// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TaskEscrow
 * @notice Private USDC escrow for AI agent task disputes via Jurex.
 *
 * Holds USDC in escrow per case. On dispute resolution, CourtCaseFactory
 * calls release() or refund() to transfer funds to winner or client.
 *
 * Amount is never publicly revealed onchain (Unlink handles private transfer).
 */
contract TaskEscrow is ReentrancyGuard, Ownable {

    address public factory;
    address public USDC;

    struct EscrowInfo {
        uint256 amount;
        address client;
        bool locked;
        bool released;
    }

    mapping(uint256 => EscrowInfo) public escrows;

    event FundsLocked(uint256 indexed caseId, address indexed client, uint256 amount);
    event FundsReleased(uint256 indexed caseId, address indexed winner, uint256 amount);
    event FundsRefunded(uint256 indexed caseId, address indexed client, uint256 amount);

    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory");
        _;
    }

    constructor(address _factory, address _usdc) Ownable(msg.sender) {
        require(_factory != address(0), "Invalid factory");
        require(_usdc != address(0), "Invalid USDC");
        factory = _factory;
        USDC = _usdc;
    }

    /**
     * @notice Lock USDC in escrow for a case
     * @param caseId Case ID
     * @param amount USDC amount (in wei, 6 decimals)
     * @param client Client address
     */
    function lockFunds(
        uint256 caseId,
        uint256 amount,
        address client
    ) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(client != address(0), "Invalid client");
        require(!escrows[caseId].locked, "Already locked");

        // Transfer USDC from caller (client) to this contract
        bool success = IERC20(USDC).transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");

        escrows[caseId] = EscrowInfo({
            amount: amount,
            client: client,
            locked: true,
            released: false
        });

        emit FundsLocked(caseId, client, amount);
    }

    /**
     * @notice Release funds to winner (called by factory on verdict)
     * @param caseId Case ID
     * @param winner Winner address
     */
    function releaseTo(
        uint256 caseId,
        address winner
    ) external nonReentrant onlyFactory {
        EscrowInfo storage escrow = escrows[caseId];
        require(escrow.locked, "Not locked");
        require(!escrow.released, "Already released");
        require(winner != address(0), "Invalid winner");

        uint256 amount = escrow.amount;
        escrow.released = true;

        // Transfer to winner
        bool success = IERC20(USDC).transfer(winner, amount);
        require(success, "Transfer failed");

        emit FundsReleased(caseId, winner, amount);
    }

    /**
     * @notice Refund to client (called by factory if dispute unresolved)
     * @param caseId Case ID
     */
    function refund(uint256 caseId) external nonReentrant onlyFactory {
        EscrowInfo storage escrow = escrows[caseId];
        require(escrow.locked, "Not locked");
        require(!escrow.released, "Already released");

        uint256 amount = escrow.amount;
        address client = escrow.client;
        escrow.released = true;

        // Refund to client
        bool success = IERC20(USDC).transfer(client, amount);
        require(success, "Transfer failed");

        emit FundsRefunded(caseId, client, amount);
    }

    /**
     * @notice View escrow state
     */
    function getEscrow(uint256 caseId) external view returns (EscrowInfo memory) {
        return escrows[caseId];
    }

    /**
     * @notice Get locked amount for a case (0 if not locked)
     */
    function getLockedAmount(uint256 caseId) external view returns (uint256) {
        if (escrows[caseId].locked && !escrows[caseId].released) {
            return escrows[caseId].amount;
        }
        return 0;
    }
}
