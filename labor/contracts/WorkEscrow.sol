// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IJobRegistry {
    function getJob(bytes32 jobId)
        external
        view
        returns (
            bytes32,
            address,
            address,
            uint256,
            uint256,
            uint256,
            bool,
            string memory,
            string memory,
            uint256
        );
}

contract WorkEscrow is Ownable, ReentrancyGuard {
    struct EscrowInfo {
        uint256 amount;
        address employer;
        address worker;
        bool released;
        bool refunded;
        uint256 createdAt;
    }

    IERC20 public usdc;
    IJobRegistry public jobRegistry;
    address public disrupteCourt;

    mapping(bytes32 => EscrowInfo) public escrows;
    mapping(bytes32 => uint256) public releasedAmounts;

    event FundsLocked(bytes32 indexed jobId, address employer, uint256 amount);
    event FundsReleased(
        bytes32 indexed jobId,
        address worker,
        uint256 amount
    );
    event FundsRefunded(bytes32 indexed jobId, address employer, uint256 amount);

    modifier onlyJobRegistry() {
        require(msg.sender == address(jobRegistry), "Only JobRegistry");
        _;
    }

    modifier onlyDisputeCourtOrJobRegistry() {
        require(
            msg.sender == disrupteCourt || msg.sender == address(jobRegistry),
            "Unauthorized"
        );
        _;
    }

    constructor(
        address _usdc,
        address _jobRegistry,
        address _disrupteCourt
    ) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        jobRegistry = IJobRegistry(_jobRegistry);
        disrupteCourt = _disrupteCourt;
    }

    function setDisputeCourt(address _disrupteCourt) external onlyOwner {
        disrupteCourt = _disrupteCourt;
    }

    function lockFunds(bytes32 jobId, uint256 amount)
        external
        nonReentrant
    {
        require(amount > 0, "Amount must be > 0");
        require(escrows[jobId].amount == 0, "Funds already locked");

        // Transfer USDC from employer to this contract
        bool success = usdc.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");

        escrows[jobId] = EscrowInfo({
            amount: amount,
            employer: msg.sender,
            worker: address(0),
            released: false,
            refunded: false,
            createdAt: block.timestamp
        });

        emit FundsLocked(jobId, msg.sender, amount);
    }

    function releaseToWorker(bytes32 jobId, uint256 amount)
        external
        nonReentrant
        onlyDisputeCourtOrJobRegistry
    {
        EscrowInfo storage escrow = escrows[jobId];
        require(escrow.amount > 0, "No escrow found");
        require(!escrow.released, "Already released");
        require(!escrow.refunded, "Already refunded");
        require(amount <= escrow.amount, "Amount exceeds escrow");

        address worker = escrow.worker;
        require(worker != address(0), "No worker assigned");

        escrow.released = true;
        releasedAmounts[jobId] += amount;

        bool success = usdc.transfer(worker, amount);
        require(success, "Transfer failed");

        emit FundsReleased(jobId, worker, amount);
    }

    function refundEmployer(bytes32 jobId)
        external
        nonReentrant
        onlyDisputeCourtOrJobRegistry
    {
        EscrowInfo storage escrow = escrows[jobId];
        require(escrow.amount > 0, "No escrow found");
        require(!escrow.refunded, "Already refunded");

        escrow.refunded = true;

        uint256 refundAmount = escrow.amount - releasedAmounts[jobId];
        require(refundAmount > 0, "Nothing to refund");

        bool success = usdc.transfer(escrow.employer, refundAmount);
        require(success, "Transfer failed");

        emit FundsRefunded(jobId, escrow.employer, refundAmount);
    }

    function getEscrow(bytes32 jobId)
        external
        view
        returns (EscrowInfo memory)
    {
        return escrows[jobId];
    }

    function getReleasedAmount(bytes32 jobId) external view returns (uint256) {
        return releasedAmounts[jobId];
    }
}
