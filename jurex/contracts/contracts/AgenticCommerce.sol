// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IERC8183.sol";

/**
 * @title AgenticCommerce
 * @notice ERC-8183 compliant job escrow for agentic commerce.
 *
 * Flow:
 *   Client calls createJob() with ETH → job is Funded immediately.
 *   Provider calls submit() with a deliverable reference.
 *   Evaluator calls complete() → provider paid, hook fires.
 *             or reject()   → client refunded, hook fires (opens Jurex appeal window).
 *   Anyone calls claimRefund() after expiry → client refunded, job Expired.
 *
 * Why AgentCourt is needed:
 *   The evaluator is typically the same party as the client — inherent conflict of
 *   interest. Without an appellate layer, evaluators can reject everything and keep
 *   the escrow. AgentCourtHook is the IACPHook that opens a Jurex appeal window on
 *   rejection, giving providers recourse through a staked judge panel.
 *
 * Hook design (ERC-8183):
 *   - beforeAction: called before complete()/reject(). Hook can revert to block.
 *   - afterAction:  called after complete()/reject(). Fires reputation signals.
 *   - claimRefund is deliberately NOT hookable (prevents refund blocking).
 *
 * Spec: https://eips.ethereum.org/EIPS/eip-8183
 */
contract AgenticCommerce is ReentrancyGuard {

    // ============ Types ============

    enum JobState { Open, Funded, Submitted, Completed, Rejected, Expired }

    struct Job {
        uint256  id;
        address  client;
        address  provider;
        address  evaluator;
        string   description;
        uint256  amount;        // ETH locked in escrow (wei)
        uint256  expiredAt;     // unix timestamp
        JobState state;
        address  hook;          // optional IACPHook — address(0) if none
        bytes32  deliverable;   // provider-submitted reference (IPFS CID hash, etc.)
    }

    // ============ State ============

    mapping(uint256 => Job) private _jobs;
    uint256 public nextJobId;   // starts at 0, first job is id 0; increments after creation

    // ============ Selectors (for hook dispatch) ============

    bytes4 private constant COMPLETE_SELECTOR = bytes4(keccak256("complete(uint256)"));
    bytes4 private constant REJECT_SELECTOR   = bytes4(keccak256("reject(uint256)"));
    bytes4 private constant SUBMIT_SELECTOR   = bytes4(keccak256("submit(uint256,bytes32,bytes)"));

    // ============ Events ============

    event JobCreated(
        uint256 indexed jobId,
        address indexed client,
        address indexed provider,
        address         evaluator,
        uint256         amount,
        uint256         expiredAt,
        address         hook,
        string          description
    );
    event JobSubmitted(uint256 indexed jobId, address indexed provider, bytes32 deliverable);
    event JobCompleted(uint256 indexed jobId, address indexed evaluator, bytes32 reason);
    event JobRejected(uint256 indexed jobId, address indexed rejector,  bytes32 reason);
    event JobExpired(uint256 indexed jobId);
    event PaymentReleased(uint256 indexed jobId, address indexed provider, uint256 amount);
    event Refunded(uint256 indexed jobId, address indexed client, uint256 amount);

    // ============ Modifiers ============

    modifier jobExists(uint256 jobId) {
        require(jobId < nextJobId, "AgenticCommerce: job does not exist");
        _;
    }

    // ============ Job Creation ============

    /**
     * @notice Create and fund a job in a single call. Sends ETH as escrow.
     *
     * @param provider    Address that will perform the work.
     * @param evaluator   Address authorized to complete() or reject(). Typically == client.
     * @param expiredAt   Unix timestamp after which anyone may call claimRefund().
     * @param description Human-readable job description.
     * @param hook        Optional IACPHook contract (e.g. AgentCourtHook). Use address(0) to skip.
     * @return jobId      Identifier for this job.
     */
    function createJob(
        address provider,
        address evaluator,
        uint256 expiredAt,
        string calldata description,
        address hook
    ) external payable returns (uint256 jobId) {
        require(provider  != address(0),   "AgenticCommerce: invalid provider");
        require(evaluator != address(0),   "AgenticCommerce: invalid evaluator");
        require(expiredAt > block.timestamp, "AgenticCommerce: expiredAt must be in the future");
        require(msg.value > 0,             "AgenticCommerce: must send ETH as escrow");
        require(bytes(description).length > 0, "AgenticCommerce: description required");

        jobId = nextJobId++;

        _jobs[jobId] = Job({
            id:          jobId,
            client:      msg.sender,
            provider:    provider,
            evaluator:   evaluator,
            description: description,
            amount:      msg.value,
            expiredAt:   expiredAt,
            state:       JobState.Funded,
            hook:        hook,
            deliverable: bytes32(0)
        });

        emit JobCreated(jobId, msg.sender, provider, evaluator, msg.value, expiredAt, hook, description);
    }

    // ============ Lifecycle ============

    /**
     * @notice Provider submits deliverable. Must be called before evaluator can decide.
     * @param jobId      The job being submitted.
     * @param deliverable bytes32 reference to the work (e.g. keccak256 of IPFS CID).
     * @param optParams  Optional extra data passed to hook.
     */
    function submit(
        uint256 jobId,
        bytes32 deliverable,
        bytes calldata optParams
    ) external nonReentrant jobExists(jobId) {
        Job storage job = _jobs[jobId];
        require(msg.sender == job.provider, "AgenticCommerce: only provider can submit");
        require(job.state  == JobState.Funded, "AgenticCommerce: job must be Funded");
        require(block.timestamp < job.expiredAt, "AgenticCommerce: job has expired");

        if (job.hook != address(0)) {
            IACPHook(job.hook).beforeAction(jobId, SUBMIT_SELECTOR, optParams);
        }

        job.state       = JobState.Submitted;
        job.deliverable = deliverable;
        emit JobSubmitted(jobId, msg.sender, deliverable);

        if (job.hook != address(0)) {
            IACPHook(job.hook).afterAction(jobId, SUBMIT_SELECTOR, optParams);
        }
    }

    /**
     * @notice Evaluator approves the submission and releases payment to provider.
     *         Calls hook.afterAction(complete) — AgentCourtHook writes a +5 ERC-8004 signal.
     * @param jobId  The job being completed.
     */
    function complete(uint256 jobId) external nonReentrant jobExists(jobId) {
        Job storage job = _jobs[jobId];
        require(msg.sender == job.evaluator, "AgenticCommerce: only evaluator can complete");
        require(
            job.state == JobState.Submitted || job.state == JobState.Funded,
            "AgenticCommerce: job must be Funded or Submitted"
        );

        if (job.hook != address(0)) {
            IACPHook(job.hook).beforeAction(jobId, COMPLETE_SELECTOR, "");
        }

        job.state = JobState.Completed;

        uint256 payout = job.amount;
        job.amount = 0;

        emit JobCompleted(jobId, msg.sender, bytes32(0));
        emit PaymentReleased(jobId, job.provider, payout);

        // Transfer AFTER state update (checks-effects-interactions)
        (bool ok,) = job.provider.call{value: payout}("");
        require(ok, "AgenticCommerce: payment failed");

        if (job.hook != address(0)) {
            IACPHook(job.hook).afterAction(jobId, COMPLETE_SELECTOR, "");
        }
    }

    /**
     * @notice Evaluator rejects the job. Refunds client, calls hook.afterAction(reject).
     *         AgentCourtHook opens a 10-minute appeal window for the provider.
     * @param jobId  The job being rejected.
     */
    function reject(uint256 jobId) external nonReentrant jobExists(jobId) {
        Job storage job = _jobs[jobId];
        require(msg.sender == job.evaluator, "AgenticCommerce: only evaluator can reject");
        require(
            job.state == JobState.Funded || job.state == JobState.Submitted,
            "AgenticCommerce: job must be Funded or Submitted"
        );

        if (job.hook != address(0)) {
            IACPHook(job.hook).beforeAction(jobId, REJECT_SELECTOR, "");
        }

        job.state = JobState.Rejected;

        uint256 refund = job.amount;
        job.amount = 0;

        emit JobRejected(jobId, msg.sender, bytes32(0));
        emit Refunded(jobId, job.client, refund);

        (bool ok,) = job.client.call{value: refund}("");
        require(ok, "AgenticCommerce: refund failed");

        // Hook fires AFTER refund — appeal window opens, no reputation change yet
        if (job.hook != address(0)) {
            IACPHook(job.hook).afterAction(jobId, REJECT_SELECTOR, "");
        }
    }

    /**
     * @notice Anyone may call this once expiredAt has passed to refund the client.
     *         Deliberately NOT hookable — prevents hook from blocking refunds.
     */
    function claimRefund(uint256 jobId) external nonReentrant jobExists(jobId) {
        Job storage job = _jobs[jobId];
        require(
            job.state == JobState.Funded || job.state == JobState.Submitted,
            "AgenticCommerce: job not refundable"
        );
        require(block.timestamp >= job.expiredAt, "AgenticCommerce: job has not expired");

        job.state = JobState.Expired;

        uint256 refund = job.amount;
        job.amount = 0;

        emit JobExpired(jobId);
        emit Refunded(jobId, job.client, refund);

        (bool ok,) = job.client.call{value: refund}("");
        require(ok, "AgenticCommerce: refund failed");
    }

    // ============ IAgenticCommerce view interface ============

    function getJobState(uint256 jobId) external view jobExists(jobId) returns (JobState) {
        return _jobs[jobId].state;
    }

    function getClient(uint256 jobId) external view jobExists(jobId) returns (address) {
        return _jobs[jobId].client;
    }

    function getProvider(uint256 jobId) external view jobExists(jobId) returns (address) {
        return _jobs[jobId].provider;
    }

    function getAmount(uint256 jobId) external view jobExists(jobId) returns (uint256) {
        return _jobs[jobId].amount;
    }

    function getJob(uint256 jobId) external view jobExists(jobId) returns (Job memory) {
        return _jobs[jobId];
    }

    function getDeliverable(uint256 jobId) external view jobExists(jobId) returns (bytes32) {
        return _jobs[jobId].deliverable;
    }

    function getDescription(uint256 jobId) external view jobExists(jobId) returns (string memory) {
        return _jobs[jobId].description;
    }
}
