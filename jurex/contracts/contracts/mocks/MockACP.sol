// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "../interfaces/IERC8183.sol";

/**
 * @dev Test double for an ERC-8183 AgenticCommerce job contract.
 *      Lets tests configure job state and trigger hook callbacks as the ACP contract.
 */
contract MockACP is IAgenticCommerce {

    mapping(uint256 => address)   private _providers;
    mapping(uint256 => address)   private _clients;
    mapping(uint256 => uint256)   private _amounts;
    mapping(uint256 => JobState)  private _states;

    function setJob(
        uint256  jobId,
        address  provider,
        address  client,
        JobState state
    ) external {
        _providers[jobId] = provider;
        _clients[jobId]   = client;
        _states[jobId]    = state;
    }

    function getJobState(uint256 jobId) external view override returns (JobState) {
        return _states[jobId];
    }

    function getClient(uint256 jobId) external view override returns (address) {
        return _clients[jobId];
    }

    function getProvider(uint256 jobId) external view override returns (address) {
        return _providers[jobId];
    }

    function getAmount(uint256 jobId) external view override returns (uint256) {
        return _amounts[jobId];
    }

    function complete(uint256 jobId) external override {
        _states[jobId] = JobState.Completed;
    }

    function reject(uint256 jobId) external override {
        _states[jobId] = JobState.Rejected;
    }

    // ── Hook trigger helpers (msg.sender == this contract == acpContract) ──

    function callBeforeAction(address hook, uint256 jobId, bytes4 selector) external {
        IACPHook(hook).beforeAction(jobId, selector, "");
    }

    function callAfterAction(address hook, uint256 jobId, bytes4 selector) external {
        IACPHook(hook).afterAction(jobId, selector, "");
    }
}
