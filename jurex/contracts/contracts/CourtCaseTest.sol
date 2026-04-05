// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./CourtRegistry.sol";

/**
 * @title CourtCaseTest
 * @notice TEST VERSION — tiny stakes, short timeouts, one-round appeal.
 *
 * Judge model (Kleros-inspired):
 *   - Judges are selected randomly by the factory from CourtRegistry's JRX staker pool.
 *   - Only the factory (deployer of this contract) can assign judges.
 *   - Judges who vote against majority are slashed in CourtRegistry.
 *
 * Appeal model:
 *   - Losing party has APPEAL_WINDOW to post APPEAL_BOND and trigger a re-trial.
 *   - Factory assigns 5 fresh judges (instead of 3).
 *   - Majority = 3/5. Maximum 1 appeal per case.
 *
 * Fee model:
 *   - Court fees accumulate in this contract.
 *   - Factory calls sweepFees(to) to withdraw to treasury.
 */
contract CourtCaseTest {

    // ============ Enums ============

    enum CaseState {
        Filed,          // 0
        Summoned,       // 1
        Active,         // 2
        Deliberating,   // 3
        Resolved,       // 4
        Dismissed,      // 5
        Defaulted,      // 6
        Appealed        // 7 — re-deliberating after appeal
    }

    enum Vote { Undecided, PlaintiffWins, DefendantWins }

    // ============ Structs ============

    struct Evidence {
        string  ipfsHash;
        address submittedBy;
        uint256 submittedAt;
    }

    struct JudgeVote {
        Vote    vote;
        uint256 votedAt;
        bool    hasVoted;
    }

    // ============ Constants ============

    uint256 public constant BASE_FEE             = 0.0001 ether;
    uint256 public constant RESPONSE_DEADLINE    = 5 minutes;
    uint256 public constant DELIBERATION_TIMEOUT = 30 minutes;
    uint256 public constant APPEAL_WINDOW        = 10 minutes;
    uint256 public constant APPEAL_BOND          = BASE_FEE * 3; // 0.0003 ETH

    // ============ Immutables / state set at deploy ============

    CourtRegistry public registry;
    address public  factory;
    address public  plaintiff;
    address public  defendant;

    // ============ Case data ============

    string    public claimDescription;
    string    public initialEvidenceHash;
    CaseState public state;
    uint256   public filedAt;
    uint256   public respondedAt;
    uint256   public resolvedAt;

    uint256 public plaintiffStake;
    uint256 public defendantStake;
    uint256 public deadlineToRespond;

    Evidence[]                  public evidence;
    address[]                   public judges;
    mapping(address => JudgeVote) public judgeVotes;
    uint256 public votesForPlaintiff;
    uint256 public votesForDefendant;

    bool   public plaintiffWins;
    string public verdictReason;

    // ============ Fee tracking ============

    uint256 public courtFeesCollected;

    // ============ Deliberation & appeal ============

    uint256 public deliberationStartedAt;
    uint256 public verdictRenderedAt;
    bool    public isAppeal;     // true during appeal round
    bool    public appealUsed;   // only one appeal allowed
    address public appellant;    // who filed the appeal

    // ============ Events ============

    event CaseFiled(address indexed plaintiff, address indexed defendant, uint256 indexed caseId, uint256 stake);
    event DefendantSummoned(address indexed defendant, uint256 deadline);
    event DefendantResponded(address indexed defendant, uint256 stake);
    event EvidenceSubmitted(address indexed submitter, string ipfsHash);
    event JudgeAssigned(address indexed judge);
    event VoteSubmitted(address indexed judge, Vote vote);
    event VerdictRendered(bool plaintiffWins, string reason);
    event StakesDistributed(uint256 toPlaintiff, uint256 toDefendant, uint256 toCourt);
    event CaseDefaulted(address indexed defendant);
    event AppealFiled(address indexed appellant, uint256 bond);
    event FeeSwept(address indexed to, uint256 amount);
    event JudgeSlashed(address indexed judge);

    // ============ Modifiers ============

    modifier onlyPlaintiff() {
        require(msg.sender == plaintiff, "Only plaintiff");
        _;
    }

    modifier onlyDefendant() {
        require(msg.sender == defendant, "Only defendant");
        _;
    }

    modifier inState(CaseState _state) {
        require(state == _state, "Invalid state");
        _;
    }

    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory");
        _;
    }

    // ============ Constructor ============

    constructor(
        address _registry,
        address _plaintiff,
        address _defendant,
        string memory _claimDescription,
        string memory _evidenceHash
    ) {
        require(_registry  != address(0), "Invalid registry");
        require(_plaintiff != address(0), "Invalid plaintiff");
        require(_defendant != address(0), "Invalid defendant");
        require(_plaintiff != _defendant, "Parties cannot match");

        registry           = CourtRegistry(_registry);
        plaintiff          = _plaintiff;
        defendant          = _defendant;
        claimDescription   = _claimDescription;
        initialEvidenceHash = _evidenceHash;
        state              = CaseState.Filed;
        filedAt            = block.timestamp;
        factory            = msg.sender; // factory contract that deploys this
    }

    // ============ Case lifecycle ============

    function fileCase(address _plaintiff) external payable inState(CaseState.Filed) {
        require(_plaintiff == plaintiff, "Plaintiff mismatch");
        require(msg.value == BASE_FEE * 2, "Must stake 0.0002 ETH");

        plaintiffStake   = msg.value;
        state            = CaseState.Summoned;
        deadlineToRespond = block.timestamp + RESPONSE_DEADLINE;

        emit CaseFiled(plaintiff, defendant, uint256(uint160(address(this))), msg.value);
        emit DefendantSummoned(defendant, deadlineToRespond);
    }

    function respondToCase() external payable onlyDefendant inState(CaseState.Summoned) {
        require(block.timestamp <= deadlineToRespond, "Response deadline passed");
        require(msg.value == BASE_FEE, "Must stake 0.0001 ETH");

        defendantStake = msg.value;
        respondedAt    = block.timestamp;
        state          = CaseState.Active;

        emit DefendantResponded(defendant, msg.value);
    }

    function missedDeadline() external inState(CaseState.Summoned) {
        require(block.timestamp > deadlineToRespond, "Deadline not passed");
        require(defendantStake == 0, "Defendant already responded");

        state     = CaseState.Defaulted;
        if (registry.getAgentProfile(defendant).isRegistered) {
            registry.recordNoShow(defendant);
        }
        plaintiffWins = true;
        verdictReason = "Defendant failed to respond within deadline";
        resolvedAt    = block.timestamp;

        _distributeDefaultStakes();
        emit CaseDefaulted(defendant);
        emit VerdictRendered(true, verdictReason);
    }

    // ============ Evidence ============

    function submitEvidence(string calldata _ipfsHash) external inState(CaseState.Active) {
        require(msg.sender == plaintiff || msg.sender == defendant, "Only parties");
        require(bytes(_ipfsHash).length > 0, "Invalid IPFS hash");

        evidence.push(Evidence({
            ipfsHash:    _ipfsHash,
            submittedBy: msg.sender,
            submittedAt: block.timestamp
        }));

        emit EvidenceSubmitted(msg.sender, _ipfsHash);
    }

    // ============ Judge assignment (called by factory) ============

    /**
     * @notice Assign 3 judges (normal round) or 5 judges (appeal round).
     *         Factory randomly selects from CourtRegistry's JRX staker pool.
     *         Duplicate addresses are rejected.
     */
    function assignJudges(address[] calldata _judges) external onlyFactory {
        require(
            state == CaseState.Active || state == CaseState.Appealed,
            "Must be Active or Appealed"
        );
        require(judges.length == 0, "Judges already assigned");

        uint256 required = isAppeal ? 5 : 3;
        require(_judges.length == required, isAppeal ? "Need 5 judges for appeal" : "Need 3 judges");

        for (uint256 i = 0; i < _judges.length; i++) {
            address judge = _judges[i];
            require(judge != plaintiff && judge != defendant, "Judge cannot be a party");
            require(registry.judgeStakes(judge) >= registry.JUDGE_STAKE_MIN(), "Judge not staked");
            for (uint256 j = 0; j < i; j++) {
                require(_judges[j] != judge, "Duplicate judge");
            }

            judges.push(judge);
            judgeVotes[judge] = JudgeVote({ vote: Vote.Undecided, votedAt: 0, hasVoted: false });
            emit JudgeAssigned(judge);
        }

        deliberationStartedAt = block.timestamp;
        state = CaseState.Deliberating;
    }

    // ============ Voting ============

    function submitVote(bool _plaintiffWins) external inState(CaseState.Deliberating) {
        require(_isJudge(msg.sender), "Not an assigned judge");
        require(!judgeVotes[msg.sender].hasVoted, "Already voted");

        Vote vote = _plaintiffWins ? Vote.PlaintiffWins : Vote.DefendantWins;
        judgeVotes[msg.sender] = JudgeVote({ vote: vote, votedAt: block.timestamp, hasVoted: true });

        if (_plaintiffWins) {
            votesForPlaintiff++;
        } else {
            votesForDefendant++;
        }

        emit VoteSubmitted(msg.sender, vote);

        // Appeal round needs 3/5 majority; normal round needs 2/3
        uint256 threshold = isAppeal ? 3 : 2;
        if (votesForPlaintiff >= threshold) {
            _renderVerdict(true);
        } else if (votesForDefendant >= threshold) {
            _renderVerdict(false);
        }
    }

    // ============ Appeal ============

    /**
     * @notice The losing party can appeal within APPEAL_WINDOW after verdict.
     *         Posts APPEAL_BOND (held in contract). Factory then assigns 5 fresh judges.
     *         Max one appeal per case.
     */
    function fileAppeal() external payable {
        require(state == CaseState.Resolved, "No verdict to appeal");
        require(!appealUsed, "Appeal already used");
        require(block.timestamp <= verdictRenderedAt + APPEAL_WINDOW, "Appeal window closed");
        require(msg.value == APPEAL_BOND, "Must pay appeal bond (0.0003 ETH)");

        // Only the losing party can appeal
        bool senderIsPlaintiff = msg.sender == plaintiff;
        bool senderIsDefendant = msg.sender == defendant;
        require(senderIsPlaintiff || senderIsDefendant, "Only parties can appeal");
        if (senderIsPlaintiff) require(!plaintiffWins, "Plaintiff won - cannot appeal");
        if (senderIsDefendant) require(plaintiffWins,  "Defendant won - cannot appeal");

        // Reset for re-trial
        for (uint256 i = 0; i < judges.length; i++) {
            delete judgeVotes[judges[i]];
        }
        delete judges;
        votesForPlaintiff = 0;
        votesForDefendant = 0;
        verdictReason     = "";
        plaintiffWins     = false;
        appellant         = msg.sender;
        isAppeal          = true;
        appealUsed        = true;

        state = CaseState.Appealed;
        emit AppealFiled(msg.sender, msg.value);
    }

    // ============ Deliberation timeout ============

    /**
     * @notice If judges stall for DELIBERATION_TIMEOUT, anyone can dismiss the case.
     *         Stakes are fully refunded. No reputation penalty.
     */
    function resolveAfterDeadline() external inState(CaseState.Deliberating) {
        require(
            block.timestamp > deliberationStartedAt + DELIBERATION_TIMEOUT,
            "Timeout not reached"
        );

        state         = CaseState.Dismissed;
        resolvedAt    = block.timestamp;
        verdictReason = "Deliberation timed out - case dismissed, stakes refunded";

        uint256 refundP = plaintiffStake;
        uint256 refundD = defendantStake;
        plaintiffStake  = 0;
        defendantStake  = 0;

        if (refundP > 0) payable(plaintiff).transfer(refundP);
        if (refundD > 0) payable(defendant).transfer(refundD);

        emit VerdictRendered(false, verdictReason);
        emit StakesDistributed(refundP, refundD, 0);
    }

    // ============ Fee sweep ============

    /**
     * @notice Factory (or its owner) sweeps accumulated court fees to a treasury address.
     */
    function sweepFees(address payable _to) external onlyFactory {
        require(_to != address(0), "Invalid treasury");
        uint256 amount = courtFeesCollected;
        require(amount > 0, "No fees to sweep");
        courtFeesCollected = 0;
        _to.transfer(amount);
        emit FeeSwept(_to, amount);
    }

    // ============ Internal helpers ============

    function _isJudge(address _addr) internal view returns (bool) {
        for (uint256 i = 0; i < judges.length; i++) {
            if (judges[i] == _addr) return true;
        }
        return false;
    }

    function _renderVerdict(bool _plaintiffWins) internal {
        plaintiffWins     = _plaintiffWins;
        state             = CaseState.Resolved;
        resolvedAt        = block.timestamp;
        verdictRenderedAt = block.timestamp;

        if (_plaintiffWins) {
            verdictReason = isAppeal
                ? "Appeal: majority of 5 judges ruled for plaintiff"
                : "Majority of judges ruled for plaintiff";
            if (registry.getAgentProfile(plaintiff).isRegistered)
                registry.updateReputation(plaintiff,  15, "Won case as plaintiff");
            if (registry.getAgentProfile(defendant).isRegistered)
                registry.updateReputation(defendant, -15, "Lost case as defendant");
        } else {
            verdictReason = isAppeal
                ? "Appeal: majority of 5 judges ruled for defendant"
                : "Majority of judges ruled for defendant";
            if (registry.getAgentProfile(defendant).isRegistered)
                registry.updateReputation(defendant,  10, "Successfully defended case");
            if (registry.getAgentProfile(plaintiff).isRegistered)
                registry.updateReputation(plaintiff, -10, "Lost case they initiated");
        }

        // Slash minority judges (voted against consensus)
        _slashMinorityJudges(_plaintiffWins);

        _distributeStakes();
        emit VerdictRendered(_plaintiffWins, verdictReason);
    }

    function _slashMinorityJudges(bool _plaintiffWins) internal {
        for (uint256 i = 0; i < judges.length; i++) {
            address judge = judges[i];
            JudgeVote memory jv = judgeVotes[judge];
            if (!jv.hasVoted) {
                // No-show judge — slash
                registry.slashJudge(judge);
                emit JudgeSlashed(judge);
            } else {
                bool votedForWinner = (_plaintiffWins && jv.vote == Vote.PlaintiffWins) ||
                                     (!_plaintiffWins && jv.vote == Vote.DefendantWins);
                if (!votedForWinner) {
                    registry.slashJudge(judge);
                    emit JudgeSlashed(judge);
                }
            }
        }
    }

    function _distributeStakes() internal {
        if (isAppeal) {
            // Appeal round: original stakes already distributed in the first verdict.
            // Only the APPEAL_BOND (0.0003 ETH) is now in the contract.
            // Winner of the appeal gets 90% of the bond back; 10% goes to court fees.
            uint256 courtFee   = APPEAL_BOND / 10;
            uint256 winnerPay  = APPEAL_BOND - courtFee;
            courtFeesCollected += courtFee;

            address winner = plaintiffWins ? plaintiff : defendant;
            payable(winner).transfer(winnerPay);

            emit StakesDistributed(
                plaintiffWins ? winnerPay : 0,
                plaintiffWins ? 0 : winnerPay,
                courtFee
            );
        } else {
            // Normal round: distribute the original stakes, then zero them out.
            uint256 courtFee = (BASE_FEE * 10) / 100; // 10% of BASE_FEE
            courtFeesCollected += courtFee;

            uint256 pStake = plaintiffStake;
            uint256 dStake = defendantStake;
            plaintiffStake = 0;
            defendantStake = 0;

            if (plaintiffWins) {
                uint256 reward = pStake + (dStake - courtFee);
                payable(plaintiff).transfer(reward);
                emit StakesDistributed(reward, 0, courtFee);
            } else {
                uint256 defendantReward = dStake + ((pStake * 40) / 100 - courtFee);
                uint256 plaintiffRefund = (pStake * 60) / 100;
                payable(defendant).transfer(defendantReward);
                payable(plaintiff).transfer(plaintiffRefund);
                emit StakesDistributed(plaintiffRefund, defendantReward, courtFee);
            }
        }
    }

    function _distributeDefaultStakes() internal {
        uint256 total  = plaintiffStake + defendantStake;
        plaintiffStake = 0;
        defendantStake = 0;
        if (total > 0) payable(plaintiff).transfer(total);
        if (registry.getAgentProfile(plaintiff).isRegistered)
            registry.updateReputation(plaintiff, 15, "Won by default (defendant no-show)");
        emit StakesDistributed(total, 0, 0);
    }

    // ============ View functions ============

    function getJudges()      external view returns (address[] memory) { return judges; }
    function getEvidenceCount() external view returns (uint256) { return evidence.length; }
    function getVoteCount()   external view returns (uint256, uint256) {
        return (votesForPlaintiff, votesForDefendant);
    }
    function isResolved()     external view returns (bool) {
        return state == CaseState.Resolved ||
               state == CaseState.Defaulted ||
               state == CaseState.Dismissed;
    }
    function getTimeRemaining() external view returns (uint256) {
        if (state != CaseState.Summoned || block.timestamp >= deadlineToRespond) return 0;
        return deadlineToRespond - block.timestamp;
    }

    receive() external payable {}
}
