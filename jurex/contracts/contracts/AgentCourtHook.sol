// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC8183.sol";
import "./CourtRegistry.sol";

/**
 * @title AgentCourtHook
 * @notice ERC-8183 IACPHook — Agent Court as the reputation and dispute layer
 *         for agentic commerce jobs.
 *
 *         Design principles (per spec):
 *         1. beforeAction is a true no-op. Jurex never blocks ERC-8183 actions.
 *         2. afterAction fires atomically after the core ERC-8183 logic:
 *              - complete() → write a small positive ERC-8004 signal for the provider.
 *              - reject()   → open the appeal window; NO reputation change yet.
 *                             Reputation only moves after a Jurex judge panel renders
 *                             a verdict, preventing providers from taking a hit before
 *                             they have had a chance to appeal.
 *         3. onlyACP modifier — hook functions are callable only by the authorized
 *            ERC-8183 job contract, not by arbitrary external callers.
 *
 *         After a rejection the prevailing party files an explicit appeal via the
 *         normal CourtCase flow; nobody is forced into a dispute — the window just
 *         exists if they want it.
 *
 *         Spec: https://eips.ethereum.org/EIPS/eip-8183
 */
contract AgentCourtHook is IACPHook, Ownable {

    // ============ Selectors ============

    bytes4 private constant COMPLETE_SELECTOR = bytes4(keccak256("complete(uint256)"));
    bytes4 private constant REJECT_SELECTOR   = bytes4(keccak256("reject(uint256)"));

    // ============ State ============

    CourtRegistry public immutable registry;

    /// The one ERC-8183 job contract authorized to call hook functions.
    address public acpContract;

    /// jobId => job contract address (set on first reject — appeal window open)
    mapping(uint256 => address) public jobContract;

    /// jobId => court case contract linked after appeal is filed
    mapping(uint256 => address) public jobToCase;

    /// jobId => whether the appeal has been settled back to the job contract
    mapping(uint256 => bool) public settled;

    // ============ Events ============

    event AppealWindowOpened(uint256 indexed jobId, address indexed jobContract);
    event CaseLinkSet(uint256 indexed jobId, address indexed caseContract);
    event AppealSettled(uint256 indexed jobId, bool providerWins);

    // ============ Modifier ============

    modifier onlyACP() {
        require(msg.sender == acpContract, "AgentCourtHook: caller is not the ACP contract");
        _;
    }

    // ============ Constructor ============

    constructor(address _registry, address _acpContract) Ownable(msg.sender) {
        require(_registry    != address(0), "Invalid registry");
        require(_acpContract != address(0), "Invalid ACP contract");
        registry    = CourtRegistry(_registry);
        acpContract = _acpContract;
    }

    // ============ IACPHook ============

    /**
     * @notice No-op. Jurex never blocks ERC-8183 actions — it only observes outcomes.
     */
    function beforeAction(
        uint256, /* jobId */
        bytes4,  /* selector */
        bytes calldata /* data */
    ) external override onlyACP {
        // intentional no-op
    }

    /**
     * @notice Fires atomically after the ERC-8183 core logic completes.
     *         complete() → positive ERC-8004 reputation signal for the provider.
     *         reject()   → open the appeal window; reputation unchanged until verdict.
     */
    function afterAction(
        uint256 jobId,
        bytes4  selector,
        bytes calldata /* data */
    ) external override onlyACP {

        if (selector == COMPLETE_SELECTOR) {
            // Happy path — provider delivered. Write a small positive ERC-8004 signal.
            address provider = IAgenticCommerce(msg.sender).getProvider(jobId);
            uint256 agentId  = uint256(uint160(provider));
            registry.giveFeedback(
                agentId,
                "job",
                "completed",
                5e18,   // +5 in 1e18 fixed-point
                ""
            );
        }

        if (selector == REJECT_SELECTOR) {
            // Disputed path — open the appeal window.
            // Reputation does NOT change here; it only moves after a Jurex verdict.
            if (jobContract[jobId] == address(0)) {
                jobContract[jobId] = msg.sender;
                emit AppealWindowOpened(jobId, msg.sender);
            }
        }
    }

    // ============ Admin ============

    /**
     * @notice Update the authorized ACP contract address.
     */
    function setAcpContract(address _acpContract) external onlyOwner {
        require(_acpContract != address(0), "Invalid ACP contract");
        acpContract = _acpContract;
    }

    /**
     * @notice Link a CourtCase contract to a jobId after the appeal is filed.
     */
    function linkCase(uint256 jobId, address caseContract) external onlyOwner {
        require(caseContract != address(0), "Invalid case");
        jobToCase[jobId] = caseContract;
        emit CaseLinkSet(jobId, caseContract);
    }

    // ============ Appeal Settlement ============

    /**
     * @notice Apply the Jurex verdict back to the ERC-8183 job contract.
     *         Called explicitly by the prevailing party after the CourtCase resolves.
     *         This is the only place reputation moves for a disputed job.
     */
    function settleAppeal(uint256 jobId, bool providerWins) external {
        require(!settled[jobId],                        "Already settled");
        require(jobContract[jobId] != address(0),       "No appeal window for this job");

        settled[jobId] = true;

        IAgenticCommerce job      = IAgenticCommerce(jobContract[jobId]);
        address          provider = job.getProvider(jobId);
        uint256          agentId  = uint256(uint160(provider));

        if (providerWins) {
            job.complete(jobId);
            // Positive signal: provider won the appeal
            registry.giveFeedback(agentId, "dispute", "won", 5e18, "");
        } else {
            job.reject(jobId);
            // Negative signal: provider lost the appeal
            registry.giveFeedback(agentId, "dispute", "lost", -5e18, "");
        }

        emit AppealSettled(jobId, providerWins);
    }

    // ============ View ============

    function hasAppealWindow(uint256 jobId) external view returns (bool) {
        return jobContract[jobId] != address(0);
    }

    function getAppealStatus(uint256 jobId) external view returns (
        address _jobContract,
        address _caseContract,
        bool    _settled
    ) {
        return (jobContract[jobId], jobToCase[jobId], settled[jobId]);
    }
}
