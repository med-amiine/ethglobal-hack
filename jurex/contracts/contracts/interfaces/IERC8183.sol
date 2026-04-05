// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title IERC8183 — Agentic Commerce Protocol
 * @notice Interfaces for ERC-8183 job escrow and hook contracts.
 *         Spec: https://eips.ethereum.org/EIPS/eip-8183
 *
 * Agent Court implements IACPHook — it acts as the *evaluator* for disputed
 * ERC-8183 jobs.  When a client rejects a provider's submission, either party
 * can route the job to Agent Court for binding arbitration.  The court's
 * verdict maps directly to complete() or reject() on the job contract.
 */

/**
 * @notice Hook interface that Agent Court implements.
 *         beforeAction: validate that a dispute is eligible to be filed.
 *         afterAction:  apply the court verdict back to the job contract.
 */
interface IACPHook {
    /**
     * @param jobId   ERC-8183 job identifier.
     * @param selector Function selector being called on the job contract
     *                 (e.g. keccak256("reject(uint256)")[:4]).
     * @param data    ABI-encoded calldata for the action.
     */
    function beforeAction(
        uint256 jobId,
        bytes4  selector,
        bytes calldata data
    ) external;

    /**
     * @param jobId   ERC-8183 job identifier.
     * @param selector Function selector that was called.
     * @param data    ABI-encoded calldata for the action.
     */
    function afterAction(
        uint256 jobId,
        bytes4  selector,
        bytes calldata data
    ) external;
}

/**
 * @notice Minimal read interface for an ERC-8183 AgenticCommerce job contract.
 *         Agent Court reads job state to validate disputes.
 */
interface IAgenticCommerce {
    enum JobState { Open, Funded, Submitted, Completed, Rejected, Expired }

    function getJobState(uint256 jobId) external view returns (JobState);
    function getClient(uint256 jobId)   external view returns (address);
    function getProvider(uint256 jobId) external view returns (address);
    function getAmount(uint256 jobId)   external view returns (uint256);

    function complete(uint256 jobId) external;
    function reject(uint256 jobId)   external;
}
