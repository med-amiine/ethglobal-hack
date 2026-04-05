// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title IERC8004ReputationRegistry
 * @notice Interface for the ERC-8004 Reputation Registry.
 *         Agents publish and read feedback signals across organisational boundaries.
 *         Spec: https://eips.ethereum.org/EIPS/eip-8004
 *
 * Agent Court's CourtRegistry implements this interface — verdict outcomes
 * are written as feedback signals, giving every registered agent a portable,
 * verifiable reputation that any ERC-8004 consumer can read.
 */
interface IERC8004ReputationRegistry {
    /// @notice Emitted when feedback is recorded for an agent.
    event FeedbackGiven(
        uint256 indexed agentId,
        address indexed client,
        string  tag1,
        string  tag2,
        int256  value,
        string  evidence
    );

    /// @notice Emitted when feedback is revoked.
    event FeedbackRevoked(uint256 indexed agentId, address indexed client, uint256 index);

    /**
     * @notice Record a signed fixed-point feedback signal for an agent.
     * @param agentId   ERC-8004 agent identifier (NFT token id or deterministic bytes32 cast to uint256).
     * @param tag1      Primary category (e.g. "dispute", "payment", "delivery").
     * @param tag2      Secondary category (e.g. "won", "lost", "noshow").
     * @param value     Signed score delta in 1e18 fixed-point (e.g. 15e18 for +15, -15e18 for -15).
     * @param evidence  IPFS CID or URL pointing to evidence supporting this signal.
     */
    function giveFeedback(
        uint256 agentId,
        string calldata tag1,
        string calldata tag2,
        int256 value,
        string calldata evidence
    ) external;

    /**
     * @notice Read a single feedback entry for an agent.
     * @param agentId       ERC-8004 agent identifier.
     * @param clientAddress Address that issued the feedback.
     * @param index         Index within that client's feedback array.
     */
    function readFeedback(
        uint256 agentId,
        address clientAddress,
        uint256 index
    ) external view returns (int256 value, string memory tag1, string memory tag2, string memory evidence);

    /**
     * @notice Aggregate all feedback into a summary score for an agent.
     * @param agentId        ERC-8004 agent identifier.
     * @param clientAddresses Subset of clients whose signals to include (empty = all).
     * @param tag1           Filter by primary tag (empty = no filter).
     * @param tag2           Filter by secondary tag (empty = no filter).
     * @return score         Net reputation score (sum of all matching signals).
     * @return count         Number of signals included in the summary.
     */
    function getSummary(
        uint256 agentId,
        address[] calldata clientAddresses,
        string calldata tag1,
        string calldata tag2
    ) external view returns (int256 score, uint256 count);

    /**
     * @notice Revoke a previously given feedback signal.
     * @param agentId ERC-8004 agent identifier.
     * @param index   Index within msg.sender's feedback array for this agent.
     */
    function revokeFeedback(uint256 agentId, uint256 index) external;
}
