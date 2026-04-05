// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IERC8004.sol";

/**
 * @title CourtRegistry
 * @notice Central registry for all agents. Tracks reputation and JRX judge stakes.
 *
 * @dev ERC-8004 Reputation Registry compliant.
 *      Verdict outcomes are written as ERC-8004 feedback signals — every
 *      registered agent's reputation is portable and readable by any
 *      ERC-8004 consumer.  Spec: https://eips.ethereum.org/EIPS/eip-8004
 *
 *      Judge eligibility = staked JRX >= JUDGE_STAKE_MIN (Kleros-style skin in the game).
 *      Slashing is the economic penalty for dishonest judging.
 */
contract CourtRegistry is Ownable, IERC8004ReputationRegistry {

    // ============ Structs ============

    struct AgentProfile {
        bytes32 erc8004Id;
        uint256 reputationScore; // starts at 100
        uint256 casesWon;
        uint256 casesLost;
        uint256 noShows;
        bool isRegistered;
        uint256 registeredAt;
    }

    // ============ State ============

    mapping(address => AgentProfile) public agents;
    mapping(bytes32 => address)      public erc8004ToAgent;
    mapping(address => bool)         public validCases;

    address public courtCaseFactory;
    address public courtHook;           // authorized ERC-8183 hook contract
    address[] public registeredAgents;

    // --- JRX staking ---
    IERC20  public jrxToken;
    address public treasury;
    uint256 public constant JUDGE_STAKE_MIN   = 1_000 * 1e18; // 1,000 JRX to be eligible
    uint256 public constant SLASH_AMOUNT      =   100 * 1e18; // 100 JRX per dishonest vote

    mapping(address => uint256) public judgeStakes; // JRX staked per address
    address[] public judgePool;                     // addresses currently staked
    mapping(address => uint256) public judgePoolIndex; // 1-indexed for existence check

    // ============ ERC-8004 Reputation Registry storage ============

    struct FeedbackEntry {
        int256  value;
        string  tag1;
        string  tag2;
        string  evidence;
        bool    revoked;
    }

    /// agentId => client => feedback entries
    mapping(uint256 => mapping(address => FeedbackEntry[])) private _feedback;

    // ============ Reputation constants ============

    uint256 public constant INITIAL_REPUTATION  = 100;
    uint256 public constant RISKY_THRESHOLD      =  70;
    uint256 public constant BLACKLIST_THRESHOLD  =  50;

    // ============ Events ============

    event AgentRegistered(address indexed agent, bytes32 indexed erc8004Id, uint256 timestamp);
    event ReputationUpdated(address indexed agent, int256 delta, uint256 newScore, string reason);
    event CourtCaseFactorySet(address indexed factory);
    event JudgeStaked(address indexed judge, uint256 amount, uint256 total);
    event JudgeUnstaked(address indexed judge, uint256 amount);
    event JudgeSlashed(address indexed judge, uint256 amount, address indexed slashedBy);

    // ============ Modifiers ============

    modifier onlyFactoryOrCase() {
        require(
            msg.sender == courtCaseFactory || validCases[msg.sender] || msg.sender == courtHook,
            "Only factory, case, or hook"
        );
        _;
    }

    modifier onlyRegistered(address _agent) {
        require(agents[_agent].isRegistered, "Agent not registered");
        _;
    }

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {}

    // ============ Admin ============

    function setCourtCaseFactory(address _factory) external onlyOwner {
        require(_factory != address(0), "Invalid factory");
        courtCaseFactory = _factory;
        emit CourtCaseFactorySet(_factory);
    }

    function setCourtHook(address _hook) external onlyOwner {
        require(_hook != address(0), "Invalid hook");
        courtHook = _hook;
    }

    function setJRXToken(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token");
        jrxToken = IERC20(_token);
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }

    function registerCase(address _case) external {
        require(msg.sender == courtCaseFactory, "Only factory can register cases");
        validCases[_case] = true;
    }

    // ============ Agent Registration ============

    function registerAgent(address _agentAddress, bytes32 _erc8004Id) external onlyOwner {
        require(_agentAddress != address(0), "Invalid address");
        require(_erc8004Id != bytes32(0), "Invalid ERC-8004 ID");
        require(!agents[_agentAddress].isRegistered, "Already registered");
        require(erc8004ToAgent[_erc8004Id] == address(0), "ERC-8004 ID already used");

        agents[_agentAddress] = AgentProfile({
            erc8004Id:       _erc8004Id,
            reputationScore: INITIAL_REPUTATION,
            casesWon:        0,
            casesLost:       0,
            noShows:         0,
            isRegistered:    true,
            registeredAt:    block.timestamp
        });

        erc8004ToAgent[_erc8004Id] = _agentAddress;
        registeredAgents.push(_agentAddress);

        emit AgentRegistered(_agentAddress, _erc8004Id, block.timestamp);
    }

    /**
     * @notice Public self-registration. Any address can register itself.
     *         Generates a deterministic erc8004Id from msg.sender + block.timestamp.
     */
    function selfRegister() external {
        require(!agents[msg.sender].isRegistered, "Already registered");

        bytes32 erc8004Id = keccak256(abi.encodePacked("erc8004:", msg.sender, block.timestamp));
        require(erc8004ToAgent[erc8004Id] == address(0), "ERC-8004 ID collision");

        agents[msg.sender] = AgentProfile({
            erc8004Id:       erc8004Id,
            reputationScore: INITIAL_REPUTATION,
            casesWon:        0,
            casesLost:       0,
            noShows:         0,
            isRegistered:    true,
            registeredAt:    block.timestamp
        });

        erc8004ToAgent[erc8004Id] = msg.sender;
        registeredAgents.push(msg.sender);

        emit AgentRegistered(msg.sender, erc8004Id, block.timestamp);
    }

    // ============ JRX Judge Staking ============

    /**
     * @notice Stake JRX to enter the judge pool.
     *         Requires prior ERC-20 approval of `amount` to this contract.
     *         You can stake more on top of existing stake.
     */
    function stakeAsJudge(uint256 amount) external {
        require(address(jrxToken) != address(0), "JRX token not set");
        require(amount > 0, "Amount must be > 0");

        jrxToken.transferFrom(msg.sender, address(this), amount);
        judgeStakes[msg.sender] += amount;

        // Add to pool if newly crossing the minimum
        if (judgeStakes[msg.sender] >= JUDGE_STAKE_MIN && judgePoolIndex[msg.sender] == 0) {
            judgePool.push(msg.sender);
            judgePoolIndex[msg.sender] = judgePool.length; // 1-indexed
        }

        emit JudgeStaked(msg.sender, amount, judgeStakes[msg.sender]);
    }

    /**
     * @notice Withdraw your full JRX stake and leave the judge pool.
     *         Note: if you are currently assigned to an active case your
     *         vote still counts — slashing can still happen after unstake.
     */
    function unstakeJudge() external {
        uint256 stake = judgeStakes[msg.sender];
        require(stake > 0, "Nothing staked");

        judgeStakes[msg.sender] = 0;
        _removeFromPool(msg.sender);

        jrxToken.transfer(msg.sender, stake);
        emit JudgeUnstaked(msg.sender, stake);
    }

    /**
     * @notice Slash a judge's stake (called by case contract for dishonest vote).
     *         Slashed tokens go to treasury.
     */
    function slashJudge(address _judge) external onlyFactoryOrCase {
        require(address(jrxToken) != address(0), "JRX token not set");
        uint256 slash = SLASH_AMOUNT;
        if (judgeStakes[_judge] == 0) return; // nothing to slash

        if (slash > judgeStakes[_judge]) {
            slash = judgeStakes[_judge];
        }

        judgeStakes[_judge] -= slash;

        // Remove from pool if fell below minimum
        if (judgeStakes[_judge] < JUDGE_STAKE_MIN) {
            _removeFromPool(_judge);
        }

        address dest = treasury != address(0) ? treasury : owner();
        jrxToken.transfer(dest, slash);

        emit JudgeSlashed(_judge, slash, msg.sender);
    }

    function _removeFromPool(address _judge) internal {
        uint256 idx = judgePoolIndex[_judge];
        if (idx == 0) return; // not in pool

        uint256 i = idx - 1; // convert to 0-indexed
        address last = judgePool[judgePool.length - 1];

        judgePool[i] = last;
        judgePoolIndex[last] = idx; // update last's index
        judgePool.pop();
        judgePoolIndex[_judge] = 0;
    }

    // ============ Reputation Management ============

    function updateReputation(
        address _agent,
        int256 _delta,
        string calldata _reason
    ) external onlyFactoryOrCase onlyRegistered(_agent) {
        AgentProfile storage profile = agents[_agent];

        if (_delta > 0) {
            profile.reputationScore += uint256(_delta);
            profile.casesWon++;
        } else if (_delta < 0) {
            uint256 decrease = uint256(-_delta);
            if (decrease >= profile.reputationScore) {
                profile.reputationScore = 0;
            } else {
                profile.reputationScore -= decrease;
            }
            profile.casesLost++;
        }

        emit ReputationUpdated(_agent, _delta, profile.reputationScore, _reason);
    }

    function recordNoShow(address _agent) external onlyFactoryOrCase onlyRegistered(_agent) {
        AgentProfile storage profile = agents[_agent];
        profile.noShows++;

        uint256 penalty = 20;
        if (penalty >= profile.reputationScore) {
            profile.reputationScore = 0;
        } else {
            profile.reputationScore -= penalty;
        }

        emit ReputationUpdated(_agent, -20, profile.reputationScore, "No-show: failed to respond to court summons");
    }

    // ============ View Functions ============

    function getReputation(address _agent) external view returns (uint256) {
        return agents[_agent].reputationScore;
    }

    function getAgentProfile(address _agent) external view returns (AgentProfile memory) {
        return agents[_agent];
    }

    function isRisky(address _agent) external view returns (bool) {
        return agents[_agent].isRegistered && agents[_agent].reputationScore < RISKY_THRESHOLD;
    }

    function isBlacklisted(address _agent) external view returns (bool) {
        return agents[_agent].isRegistered && agents[_agent].reputationScore < BLACKLIST_THRESHOLD;
    }

    function getRegisteredAgentsCount() external view returns (uint256) {
        return registeredAgents.length;
    }

    function getJudgePoolSize() external view returns (uint256) {
        return judgePool.length;
    }

    /**
     * @notice Returns staked judges eligible for a case (excluding parties).
     *         The factory uses this to randomly select 3 or 5 judges.
     */
    function getEligibleJudges(
        address _plaintiff,
        address _defendant
    ) external view returns (address[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < judgePool.length; i++) {
            address j = judgePool[i];
            if (j != _plaintiff && j != _defendant) count++;
        }

        address[] memory eligible = new address[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < judgePool.length; i++) {
            address j = judgePool[i];
            if (j != _plaintiff && j != _defendant) {
                eligible[idx++] = j;
            }
        }
        return eligible;
    }

    // ============ ERC-8004 Reputation Registry implementation ============

    /**
     * @notice Record a verdict outcome as an ERC-8004 feedback signal.
     *         Called by case contracts after each resolved verdict.
     * @dev agentId is the uint256 cast of the agent's deterministic erc8004Id bytes32.
     */
    function giveFeedback(
        uint256 agentId,
        string calldata tag1,
        string calldata tag2,
        int256 value,
        string calldata evidence
    ) external override onlyFactoryOrCase {
        _feedback[agentId][msg.sender].push(FeedbackEntry({
            value:    value,
            tag1:     tag1,
            tag2:     tag2,
            evidence: evidence,
            revoked:  false
        }));
        emit FeedbackGiven(agentId, msg.sender, tag1, tag2, value, evidence);
    }

    function readFeedback(
        uint256 agentId,
        address clientAddress,
        uint256 index
    ) external view override returns (int256 value, string memory tag1, string memory tag2, string memory evidence) {
        FeedbackEntry storage e = _feedback[agentId][clientAddress][index];
        require(!e.revoked, "Feedback revoked");
        return (e.value, e.tag1, e.tag2, e.evidence);
    }

    /**
     * @notice Aggregate feedback. If clientAddresses is empty, returns the agent's
     *         overall reputation score (sum of all court verdicts).
     */
    function getSummary(
        uint256 agentId,
        address[] calldata clientAddresses,
        string calldata tag1,
        string calldata tag2
    ) external view override returns (int256 score, uint256 count) {
        bool filterTag1 = bytes(tag1).length > 0;
        bool filterTag2 = bytes(tag2).length > 0;

        if (clientAddresses.length == 0) {
            // No client filter: return reputation as a single summary signal
            address agentAddr = address(uint160(agentId));
            score = int256(agents[agentAddr].reputationScore);
            count = agents[agentAddr].casesWon + agents[agentAddr].casesLost;
            return (score, count);
        }

        for (uint256 c = 0; c < clientAddresses.length; c++) {
            FeedbackEntry[] storage entries = _feedback[agentId][clientAddresses[c]];
            for (uint256 i = 0; i < entries.length; i++) {
                FeedbackEntry storage e = entries[i];
                if (e.revoked) continue;
                if (filterTag1 && keccak256(bytes(e.tag1)) != keccak256(bytes(tag1))) continue;
                if (filterTag2 && keccak256(bytes(e.tag2)) != keccak256(bytes(tag2))) continue;
                score += e.value;
                count++;
            }
        }
    }

    function revokeFeedback(uint256 agentId, uint256 index) external override {
        FeedbackEntry storage e = _feedback[agentId][msg.sender][index];
        require(!e.revoked, "Already revoked");
        e.revoked = true;
        emit FeedbackRevoked(agentId, msg.sender, index);
    }

    // ============ ERC-8004 helper ============

    /**
     * @notice Returns the ERC-8004 agent URI for a registered agent.
     *         Format: eip155:<chainId>:<registryAddress>/<agentId>
     */
    function getAgentERC8004Uri(address _agent) external view returns (string memory) {
        require(agents[_agent].isRegistered, "Not registered");
        uint256 agentId = uint256(agents[_agent].erc8004Id);
        return string(abi.encodePacked(
            "eip155:421614:",
            _toHexString(uint160(address(this))),
            "/",
            _uintToString(agentId)
        ));
    }

    function _toHexString(uint160 value) internal pure returns (string memory) {
        bytes memory buffer = new bytes(42);
        buffer[0] = '0';
        buffer[1] = 'x';
        for (uint256 i = 41; i >= 2; i--) {
            buffer[i] = bytes1(uint8(48 + uint256(value & 0xf) + (uint256(value & 0xf) > 9 ? 39 : 0)));
            value >>= 4;
        }
        return string(buffer);
    }

    function _uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /**
     * @notice Legacy view — also checks reputation > 80 for backwards compat.
     */
    function getEligibleJudgesLegacy(
        address _plaintiff,
        address _defendant
    ) external view returns (address[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < registeredAgents.length; i++) {
            address agent = registeredAgents[i];
            if (
                agent != _plaintiff &&
                agent != _defendant &&
                agents[agent].reputationScore > 80
            ) count++;
        }

        address[] memory eligible = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < registeredAgents.length; i++) {
            address agent = registeredAgents[i];
            if (
                agent != _plaintiff &&
                agent != _defendant &&
                agents[agent].reputationScore > 80
            ) eligible[index++] = agent;
        }
        return eligible;
    }
}
