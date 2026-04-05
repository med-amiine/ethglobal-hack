// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./CourtRegistry.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CourtCase
 * @notice Individual dispute case with staking, evidence, and voting
 * @dev One contract per case, handles full lifecycle from filing to resolution
 *
 * MAINNET CHECKLIST:
 * [ ] Replace pseudo-random judge selection in Factory with Chainlink VRF
 * [ ] Replace onlyOwner judge assignment with automated VRF callback
 * [ ] Third-party security audit
 * [ ] Deploy behind a proxy for upgradeability
 * [ ] Multi-sig ownership on Registry + Factory
 */
contract CourtCase is ReentrancyGuard, Pausable {

    // ============ Enums ============

    enum CaseState {
        Filed,        // Case filed, waiting for defendant response
        Summoned,     // Defendant notified, countdown started
        Active,       // Both parties staked, gathering evidence
        Deliberating, // Judges assigned and voting
        Resolved,     // Verdict rendered
        Dismissed,    // Case dismissed
        Defaulted     // Defendant no-show
    }

    enum Vote {
        Undecided,
        PlaintiffWins,
        DefendantWins
    }

    // ============ Structs ============

    struct Evidence {
        string ipfsHash;
        address submittedBy;
        uint256 submittedAt;
    }

    struct JudgeVote {
        Vote vote;
        uint256 votedAt;
        bool hasVoted;
    }

    // ============ Constants ============

    uint256 public constant BASE_FEE = 0.001 ether;
    uint256 public constant RESPONSE_DEADLINE = 48 hours;
    uint256 public constant DELIBERATION_DEADLINE = 7 days;
    uint256 public constant MAX_EVIDENCE = 50;
    uint256 public constant MAX_STRING_LENGTH = 500;

    // ============ State ============

    CourtRegistry public registry;

    address public plaintiff;
    address public defendant;
    address public factory; // only factory can assign judges

    string public claimDescription;
    string public initialEvidenceHash;
    CaseState public state;
    uint256 public filedAt;
    uint256 public respondedAt;
    uint256 public resolvedAt;

    uint256 public plaintiffStake;
    uint256 public defendantStake;
    uint256 public deadlineToRespond;
    uint256 public deadlineToVote;

    Evidence[] public evidence;

    address[] public judges;
    mapping(address => bool) public isJudge;       // O(1) lookup
    mapping(address => JudgeVote) public judgeVotes;
    uint256 public votesForPlaintiff;
    uint256 public votesForDefendant;

    bool public plaintiffWins;
    string public verdictReason;

    // ============ Events ============

    event CaseFiled(address indexed plaintiff, address indexed defendant, uint256 indexed caseId, uint256 stake);
    event DefendantSummoned(address indexed defendant, uint256 deadline);
    event DefendantResponded(address indexed defendant, uint256 stake);
    event EvidenceSubmitted(address indexed submitter, string ipfsHash, uint256 evidenceIndex);
    event JudgesAssigned(address judge1, address judge2, address judge3, uint256 votingDeadline);
    event VoteSubmitted(address indexed judge, Vote vote, uint256 plaintiffTotal, uint256 defendantTotal);
    event VerdictRendered(bool plaintiffWins, string reason, uint256 resolvedAt);
    event StakesDistributed(uint256 toPlaintiff, uint256 toDefendant, uint256 toCourt);
    event CaseDefaulted(address indexed defendant);
    event CaseDismissed(address indexed dismissedBy, string reason);

    // ============ Modifiers ============

    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory");
        _;
    }

    modifier onlyPlaintiff() {
        require(msg.sender == plaintiff, "Only plaintiff");
        _;
    }

    modifier onlyDefendant() {
        require(msg.sender == defendant, "Only defendant");
        _;
    }

    modifier inState(CaseState _state) {
        require(state == _state, "Action not allowed in current state");
        _;
    }

    // ============ Constructor ============

    constructor(
        address _registry,
        address _factory,
        address _plaintiff,
        address _defendant,
        string memory _claimDescription,
        string memory _evidenceHash
    ) {
        require(_registry != address(0), "Invalid registry");
        require(_factory != address(0), "Invalid factory");
        require(_plaintiff != address(0), "Invalid plaintiff");
        require(_defendant != address(0), "Invalid defendant");
        require(_plaintiff != _defendant, "Plaintiff and defendant cannot be same");
        require(bytes(_claimDescription).length > 0, "Claim description required");
        require(bytes(_claimDescription).length <= MAX_STRING_LENGTH, "Claim description too long");
        require(bytes(_evidenceHash).length > 0, "Initial evidence required");
        require(bytes(_evidenceHash).length <= 128, "Evidence hash too long");

        registry = CourtRegistry(_registry);
        factory = _factory;
        plaintiff = _plaintiff;
        defendant = _defendant;
        claimDescription = _claimDescription;
        initialEvidenceHash = _evidenceHash;
        state = CaseState.Filed;
        filedAt = block.timestamp;
    }

    // ============ Case Lifecycle ============

    /**
     * @notice File the case with initial stake (called by factory only)
     * @param _plaintiff The plaintiff address verified by factory
     * @dev Factory must send exactly 2x BASE_FEE
     */
    function fileCase(address _plaintiff) external payable onlyFactory inState(CaseState.Filed) {
        require(_plaintiff == plaintiff, "Plaintiff mismatch");
        require(msg.value == BASE_FEE * 2, "Must stake 2x base fee (0.002 ETH)");

        plaintiffStake = msg.value;
        state = CaseState.Summoned;
        deadlineToRespond = block.timestamp + RESPONSE_DEADLINE;

        emit CaseFiled(plaintiff, defendant, uint256(uint160(address(this))), msg.value);
        emit DefendantSummoned(defendant, deadlineToRespond);
    }

    /**
     * @notice Defendant responds to the case
     * @dev Defendant must send exactly 1x BASE_FEE
     */
    function respondToCase() external payable onlyDefendant inState(CaseState.Summoned) {
        require(block.timestamp <= deadlineToRespond, "Response deadline passed");
        require(msg.value == BASE_FEE, "Must stake 1x base fee (0.001 ETH)");

        defendantStake = msg.value;
        respondedAt = block.timestamp;
        state = CaseState.Active;

        emit DefendantResponded(defendant, msg.value);
    }

    /**
     * @notice Trigger default judgment if defendant missed the response deadline
     */
    function missedDeadline() external nonReentrant inState(CaseState.Summoned) {
        require(block.timestamp > deadlineToRespond, "Deadline not yet passed");
        require(defendantStake == 0, "Defendant already responded");

        // Effects first (CEI)
        state = CaseState.Defaulted;
        plaintiffWins = true;
        verdictReason = "Defendant failed to respond within deadline";
        resolvedAt = block.timestamp;

        registry.recordNoShow(defendant);

        _distributeDefaultStakes();

        emit CaseDefaulted(defendant);
        emit VerdictRendered(true, verdictReason, resolvedAt);
    }

    /**
     * @notice Submit additional evidence as IPFS hash
     * @dev Only parties, only while Active (before judges assigned)
     */
    function submitEvidence(string calldata _ipfsHash) external whenNotPaused inState(CaseState.Active) {
        require(msg.sender == plaintiff || msg.sender == defendant, "Only parties can submit evidence");
        require(bytes(_ipfsHash).length > 0, "Evidence hash required");
        require(bytes(_ipfsHash).length <= 128, "Evidence hash too long");
        require(evidence.length < MAX_EVIDENCE, "Maximum evidence submissions reached");

        uint256 idx = evidence.length;
        evidence.push(Evidence({
            ipfsHash: _ipfsHash,
            submittedBy: msg.sender,
            submittedAt: block.timestamp
        }));

        emit EvidenceSubmitted(msg.sender, _ipfsHash, idx);
    }

    // ============ Judge Management ============

    /**
     * @notice Assign judges to the case (called by factory only)
     * @dev Transitions state to Deliberating and sets the voting deadline.
     *      Evidence submission is closed once judges are assigned.
     */
    function assignJudges(address[3] calldata _judges) external onlyFactory inState(CaseState.Active) {
        require(judges.length == 0, "Judges already assigned");

        for (uint256 i = 0; i < 3; i++) {
            address judge = _judges[i];
            require(judge != address(0), "Invalid judge address");
            require(judge != plaintiff && judge != defendant, "Judge cannot be a party");
            require(!isJudge[judge], "Duplicate judge");
            require(registry.getReputation(judge) > 80, "Judge reputation too low");

            judges.push(judge);
            isJudge[judge] = true;
            judgeVotes[judge] = JudgeVote({ vote: Vote.Undecided, votedAt: 0, hasVoted: false });
        }

        deadlineToVote = block.timestamp + DELIBERATION_DEADLINE;
        state = CaseState.Deliberating;

        emit JudgesAssigned(_judges[0], _judges[1], _judges[2], deadlineToVote);
    }

    /**
     * @notice Judge submits their vote
     * @param _plaintiffWins True if the judge votes for the plaintiff
     */
    function submitVote(bool _plaintiffWins) external nonReentrant whenNotPaused inState(CaseState.Deliberating) {
        require(isJudge[msg.sender], "Not an assigned judge");
        require(!judgeVotes[msg.sender].hasVoted, "Already voted");
        require(block.timestamp <= deadlineToVote, "Voting deadline has passed");

        Vote vote = _plaintiffWins ? Vote.PlaintiffWins : Vote.DefendantWins;
        judgeVotes[msg.sender] = JudgeVote({ vote: vote, votedAt: block.timestamp, hasVoted: true });

        if (_plaintiffWins) {
            votesForPlaintiff++;
        } else {
            votesForDefendant++;
        }

        emit VoteSubmitted(msg.sender, vote, votesForPlaintiff, votesForDefendant);

        // Render verdict immediately on 2/3 majority
        if (votesForPlaintiff >= 2) {
            _renderVerdict(true);
        } else if (votesForDefendant >= 2) {
            _renderVerdict(false);
        }
    }

    /**
     * @notice Resolve the case when the deliberation deadline passes without a 2/3 majority
     * @dev Can be called by anyone. Plaintiff wins ties (documented bias).
     *      NOTE for mainnet: consider a 4th tie-breaking judge or neutral mediator.
     */
    function resolveAfterDeadline() external nonReentrant inState(CaseState.Deliberating) {
        require(block.timestamp > deadlineToVote, "Voting deadline not yet passed");
        require(votesForPlaintiff + votesForDefendant > 0, "No votes cast, cannot resolve");

        bool plaintiffWinsVote = votesForPlaintiff >= votesForDefendant;
        _renderVerdict(plaintiffWinsVote);
    }

    // ============ Verdict & Distribution ============

    function _renderVerdict(bool _plaintiffWins) internal {
        // Effects first
        plaintiffWins = _plaintiffWins;
        state = CaseState.Resolved;
        resolvedAt = block.timestamp;

        if (_plaintiffWins) {
            verdictReason = "Majority of judges ruled in favor of plaintiff";
            registry.updateReputation(plaintiff, 15, "Won case as plaintiff");
            registry.updateReputation(defendant, -15, "Lost case as defendant");
        } else {
            verdictReason = "Majority of judges ruled in favor of defendant";
            registry.updateReputation(defendant, 10, "Successfully defended case");
            registry.updateReputation(plaintiff, -10, "Lost case they initiated");
        }

        emit VerdictRendered(_plaintiffWins, verdictReason, resolvedAt);

        // Interactions last
        _distributeStakes();
    }

    function _distributeStakes() internal {
        uint256 courtFee = (BASE_FEE * 10) / 100; // 10% court fee

        if (plaintiffWins) {
            uint256 plaintiffReward = plaintiffStake + (defendantStake - courtFee);

            plaintiffStake = 0;
            defendantStake = 0;

            (bool ok, ) = payable(plaintiff).call{value: plaintiffReward}("");
            require(ok, "Plaintiff transfer failed");

            emit StakesDistributed(plaintiffReward, 0, courtFee);
        } else {
            uint256 cachedPlaintiffStake = plaintiffStake;
            uint256 cachedDefendantStake = defendantStake;
            uint256 defendantReward = cachedDefendantStake + ((cachedPlaintiffStake * 40) / 100 - courtFee);
            uint256 plaintiffRefund = (cachedPlaintiffStake * 60) / 100;

            plaintiffStake = 0;
            defendantStake = 0;

            (bool ok1, ) = payable(defendant).call{value: defendantReward}("");
            require(ok1, "Defendant transfer failed");

            (bool ok2, ) = payable(plaintiff).call{value: plaintiffRefund}("");
            require(ok2, "Plaintiff refund failed");

            emit StakesDistributed(plaintiffRefund, defendantReward, courtFee);
        }
    }

    function _distributeDefaultStakes() internal {
        uint256 totalToPlaintiff = plaintiffStake + defendantStake;

        plaintiffStake = 0;
        defendantStake = 0;

        if (totalToPlaintiff > 0) {
            (bool ok, ) = payable(plaintiff).call{value: totalToPlaintiff}("");
            require(ok, "Transfer to plaintiff failed");
        }

        registry.updateReputation(plaintiff, 15, "Won case by default (defendant no-show)");

        emit StakesDistributed(totalToPlaintiff, 0, 0);
    }

    // ============ View Functions ============

    function getEvidenceCount() external view returns (uint256) {
        return evidence.length;
    }

    function getVoteCount() external view returns (uint256 plaintiffVotes, uint256 defendantVotes) {
        return (votesForPlaintiff, votesForDefendant);
    }

    function isResolved() external view returns (bool) {
        return state == CaseState.Resolved || state == CaseState.Defaulted;
    }

    function getTimeRemaining() external view returns (uint256 responseTime, uint256 votingTime) {
        if (state == CaseState.Summoned && block.timestamp < deadlineToRespond) {
            responseTime = deadlineToRespond - block.timestamp;
        }
        if (state == CaseState.Deliberating && block.timestamp < deadlineToVote) {
            votingTime = deadlineToVote - block.timestamp;
        }
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
