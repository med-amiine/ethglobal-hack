// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./CourtRegistry.sol";
import "./CourtCase.sol";
import "./AgentCourtHook.sol";
import "./interfaces/IERC8183.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CourtCaseFactory
 * @notice Factory for creating and tracking CourtCase instances
 * @dev Deploys new cases, assigns judges, maintains the case registry
 *
 * MAINNET CHECKLIST:
 * [ ] Replace assignJudgesToCase with Chainlink VRF callback pattern
 * [ ] Transfer ownership to a multi-sig (Gnosis Safe) before mainnet
 * [ ] Add timelock to critical admin functions
 * [ ] Run comprehensive fuzz tests on judge selection
 */
contract CourtCaseFactory is Ownable, Pausable {

    // ============ State ============

    CourtRegistry public registry;

    address[] public allCases;
    mapping(address => address[]) public casesByPlaintiff;
    mapping(address => address[]) public casesByDefendant;
    mapping(address => bool) public isValidCase;

    uint256 public constant BASE_FEE = 0.001 ether;
    uint256 public caseCounter;

    // ============ Events ============

    event CaseCreated(
        address indexed caseAddress,
        address indexed plaintiff,
        address indexed defendant,
        uint256 caseNumber,
        uint256 timestamp
    );
    event AppealFiled(
        uint256 indexed jobId,
        address indexed jobContract,
        address indexed caseAddress,
        address provider,
        address client
    );
    event JudgesAssigned(address indexed caseAddress, address judge1, address judge2, address judge3);

    // ============ Constructor ============

    constructor(address _registry) Ownable(msg.sender) {
        require(_registry != address(0), "Invalid registry address");
        registry = CourtRegistry(_registry);
    }

    // ============ Case Creation ============

    /**
     * @notice File a new case against a defendant
     * @param _defendant The agent being accused
     * @param _claimDescription Description of the claim
     * @param _evidenceHash IPFS hash of initial evidence
     * @return caseAddress The address of the deployed CourtCase contract
     */
    function fileNewCase(
        address _defendant,
        string calldata _claimDescription,
        string calldata _evidenceHash
    ) external payable whenNotPaused returns (address caseAddress) {
        require(msg.value == BASE_FEE * 2, "Must stake 2x base fee (0.002 ETH)");
        require(_defendant != address(0), "Invalid defendant address");
        require(_defendant != msg.sender, "Cannot file case against yourself");
        require(bytes(_claimDescription).length > 0, "Claim description required");
        require(bytes(_claimDescription).length <= 500, "Claim description too long");
        require(bytes(_evidenceHash).length > 0, "Evidence hash required");
        require(bytes(_evidenceHash).length <= 128, "Evidence hash too long");

        require(registry.getReputation(msg.sender) > 0, "Plaintiff not registered");
        require(registry.getReputation(_defendant) > 0, "Defendant not registered");
        require(!registry.isBlacklisted(msg.sender), "Plaintiff is blacklisted");

        caseCounter++;

        CourtCase newCase = new CourtCase(
            address(registry),
            address(this),
            msg.sender,
            _defendant,
            _claimDescription,
            _evidenceHash
        );

        caseAddress = address(newCase);

        allCases.push(caseAddress);
        casesByPlaintiff[msg.sender].push(caseAddress);
        casesByDefendant[_defendant].push(caseAddress);
        isValidCase[caseAddress] = true;

        registry.registerCase(caseAddress);

        CourtCase(payable(caseAddress)).fileCase{value: msg.value}(msg.sender);

        emit CaseCreated(caseAddress, msg.sender, _defendant, caseCounter, block.timestamp);

        return caseAddress;
    }

    // ============ Appeal Filing ============

    /**
     * @notice File an appeal after an ERC-8183 job is rejected.
     *         Provider becomes the plaintiff; the client who rejected becomes the defendant.
     *         Deploys a CourtCase and links it to the hook so judges can render a binding verdict.
     *
     * @param jobId        ERC-8183 job identifier (from AgenticCommerce).
     * @param jobContract  Address of the AgenticCommerce contract that holds the job.
     * @param hookContract Address of the AgentCourtHook that opened the appeal window.
     * @param evidenceHash IPFS hash of provider's appeal evidence.
     * @return caseAddress The deployed CourtCase contract.
     *
     * Requirements:
     * - Caller must be the job's provider.
     * - Job must be in Rejected state.
     * - Hook must have an open appeal window for this jobId (set by hook.afterAction(reject)).
     * - Caller must send BASE_FEE * 2 as the plaintiff stake.
     */
    function fileAppeal(
        uint256 jobId,
        address jobContract,
        address hookContract,
        string calldata evidenceHash
    ) external payable whenNotPaused returns (address caseAddress) {
        require(msg.value == BASE_FEE * 2, "Must stake 2x base fee (0.002 ETH)");
        require(jobContract  != address(0), "Invalid job contract");
        require(hookContract != address(0), "Invalid hook contract");
        require(bytes(evidenceHash).length > 0,  "Evidence hash required");
        require(bytes(evidenceHash).length <= 128, "Evidence hash too long");

        IAgenticCommerce job = IAgenticCommerce(jobContract);

        address provider = job.getProvider(jobId);
        address client   = job.getClient(jobId);

        require(msg.sender == provider,  "Only the job provider can file an appeal");
        require(
            job.getJobState(jobId) == IAgenticCommerce.JobState.Rejected,
            "Job must be in Rejected state"
        );
        require(
            AgentCourtHook(hookContract).hasAppealWindow(jobId),
            "No appeal window open for this job"
        );

        require(registry.getReputation(provider) > 0, "Provider not registered");
        require(registry.getReputation(client)   > 0, "Client not registered");
        require(!registry.isBlacklisted(provider), "Provider is blacklisted");

        string memory claimDescription = string(
            abi.encodePacked("Appeal: ERC-8183 job #", _uint2str(jobId), " rejection")
        );

        caseCounter++;

        CourtCase newCase = new CourtCase(
            address(registry),
            address(this),
            provider,   // provider is the plaintiff (appeals their rejected work)
            client,     // client is the defendant (their rejection is challenged)
            claimDescription,
            evidenceHash
        );

        caseAddress = address(newCase);

        allCases.push(caseAddress);
        casesByPlaintiff[provider].push(caseAddress);
        casesByDefendant[client].push(caseAddress);
        isValidCase[caseAddress] = true;

        registry.registerCase(caseAddress);

        CourtCase(payable(caseAddress)).fileCase{value: msg.value}(provider);

        // Note: hook.linkCase() is onlyOwner on AgentCourtHook.
        // The owner must call hook.linkCase(jobId, caseAddress) separately after this tx.
        // Off-chain tooling should watch for the AppealFiled event to trigger that call.

        emit AppealFiled(jobId, jobContract, caseAddress, provider, client);
        emit CaseCreated(caseAddress, provider, client, caseCounter, block.timestamp);

        return caseAddress;
    }

    /// @dev Convert uint to decimal string — used only to build appeal claim descriptions.
    function _uint2str(uint256 n) internal pure returns (string memory) {
        if (n == 0) return "0";
        uint256 temp = n;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buf = new bytes(digits);
        while (n != 0) { digits--; buf[digits] = bytes1(uint8(48 + n % 10)); n /= 10; }
        return string(buf);
    }

    // ============ Judge Assignment ============

    /**
     * @notice Assign pseudo-random judges to an active case (owner only, MVP)
     * @param _caseAddress The case to assign judges to
     *
     * @dev SECURITY NOTE: The randomness source (block.prevrandao, timestamp, blockhash)
     *      is NOT cryptographically secure. A block proposer can bias the selection.
     *      This is acceptable for testnet MVP. For mainnet, replace with Chainlink VRF:
     *
     *      1. Add VRFCoordinatorV2Interface and subscription setup
     *      2. Replace this function with requestRandomWords() call
     *      3. Implement fulfillRandomWords() callback that calls _assignJudgesFromSeed()
     *      4. Remove onlyOwner — assignment becomes trustless and automatic
     */
    function assignJudgesToCase(address _caseAddress) external onlyOwner whenNotPaused {
        require(isValidCase[_caseAddress], "Invalid case address");

        CourtCase courtCase = CourtCase(payable(_caseAddress));
        require(courtCase.state() == CourtCase.CaseState.Active, "Case must be in Active state");

        address plaintiff = courtCase.plaintiff();
        address defendant = courtCase.defendant();

        address[] memory eligible = registry.getEligibleJudges(plaintiff, defendant);
        require(eligible.length >= 3, "Not enough eligible judges (need reputation > 80)");

        address[3] memory selectedJudges = _selectThreeJudges(eligible, _caseAddress);

        courtCase.assignJudges(selectedJudges);

        emit JudgesAssigned(_caseAddress, selectedJudges[0], selectedJudges[1], selectedJudges[2]);
    }

    /**
     * @dev Select 3 distinct judges from the eligible pool using a seeded index walk.
     *      Bounded O(n) worst-case: at most eligible.length attempts per slot.
     */
    function _selectThreeJudges(
        address[] memory eligible,
        address _caseAddress
    ) internal view returns (address[3] memory selected) {
        uint256 seed = uint256(keccak256(abi.encodePacked(
            block.prevrandao,
            block.timestamp,
            blockhash(block.number - 1),
            _caseAddress,
            msg.sender
        )));

        bool[3] memory usedSlots;

        for (uint256 i = 0; i < 3; i++) {
            uint256 index = (seed >> (i * 80)) % eligible.length;

            // Walk forward until we find an un-selected judge (bounded loop)
            uint256 attempts = 0;
            while (attempts < eligible.length) {
                bool duplicate = false;
                for (uint256 j = 0; j < i; j++) {
                    if (selected[j] == eligible[index]) {
                        duplicate = true;
                        break;
                    }
                }
                if (!duplicate) break;
                index = (index + 1) % eligible.length;
                attempts++;
            }
            // eligible.length >= 3 is already enforced, so we always find a unique judge
            selected[i] = eligible[index];
            usedSlots[i] = true;
        }
    }

    // ============ Admin ============

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ View Functions ============

    function getAllCases() external view returns (address[] memory) {
        return allCases;
    }

    function getCasesByAgent(address _agent) external view returns (
        address[] memory plaintiffCases,
        address[] memory defendantCases
    ) {
        return (casesByPlaintiff[_agent], casesByDefendant[_agent]);
    }

    /**
     * @notice Returns all non-terminal cases
     * @dev O(n) over allCases — add off-chain indexing for large deployments
     */
    function getActiveCases() external view returns (address[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < allCases.length; i++) {
            CourtCase.CaseState s = CourtCase(payable(allCases[i])).state();
            if (s != CourtCase.CaseState.Resolved &&
                s != CourtCase.CaseState.Defaulted &&
                s != CourtCase.CaseState.Dismissed) {
                count++;
            }
        }

        address[] memory active = new address[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allCases.length; i++) {
            CourtCase.CaseState s = CourtCase(payable(allCases[i])).state();
            if (s != CourtCase.CaseState.Resolved &&
                s != CourtCase.CaseState.Defaulted &&
                s != CourtCase.CaseState.Dismissed) {
                active[idx++] = allCases[i];
            }
        }

        return active;
    }

    function getCaseCount() external view returns (uint256) {
        return allCases.length;
    }

    receive() external payable {}
}
