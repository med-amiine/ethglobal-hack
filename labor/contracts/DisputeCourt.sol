// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IWorkEscrow {
    function releaseToWorker(bytes32 jobId, uint256 amount) external;

    function refundEmployer(bytes32 jobId) external;

    function getEscrow(bytes32 jobId)
        external
        view
        returns (
            uint256 amount,
            address employer,
            address worker,
            bool released,
            bool refunded,
            uint256 createdAt
        );
}

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

contract DisputeCourt is Ownable, ReentrancyGuard {
    struct Dispute {
        bytes32 disputeId;
        bytes32 jobId;
        address opener;
        string reason;
        string openedBy; // 'worker' or 'employer'
        bool resolved;
        string resolution; // 'worker_paid' or 'employer_refunded'
        uint256 createdAt;
        uint256 resolvedAt;
    }

    struct Ruling {
        address judge;
        bool hasRuled;
        string decision; // 'worker' or 'employer'
    }

    IWorkEscrow public workEscrow;
    IJobRegistry public jobRegistry;

    mapping(address => bool) public verifiedJudges;
    mapping(bytes32 => Dispute) public disputes;
    mapping(bytes32 => address[]) public disputeJudges;
    mapping(bytes32 => mapping(address => Ruling)) public rulings;

    uint256 public totalDisputes = 0;

    event DisputeOpened(
        bytes32 indexed disputeId,
        bytes32 indexed jobId,
        address opener,
        string reason
    );

    event JudgeVerified(address indexed judge);

    event RulingSubmitted(
        bytes32 indexed disputeId,
        address indexed judge,
        string decision
    );

    event DisputeResolved(
        bytes32 indexed disputeId,
        bytes32 indexed jobId,
        string resolution
    );

    constructor(address _workEscrow, address _jobRegistry)
        Ownable(msg.sender)
    {
        workEscrow = IWorkEscrow(_workEscrow);
        jobRegistry = IJobRegistry(_jobRegistry);
    }

    function registerJudge(address judge) external onlyOwner {
        require(judge != address(0), "Invalid judge");
        verifiedJudges[judge] = true;
        emit JudgeVerified(judge);
    }

    function openDispute(
        bytes32 jobId,
        string calldata reason,
        string calldata openedBy
    ) external returns (bytes32) {
        require(
            keccak256(abi.encodePacked(openedBy)) ==
                keccak256(abi.encodePacked("worker")) ||
                keccak256(abi.encodePacked(openedBy)) ==
                keccak256(abi.encodePacked("employer")),
            "Invalid opener"
        );

        bytes32 disputeId = keccak256(
            abi.encodePacked(jobId, msg.sender, block.timestamp)
        );

        disputes[disputeId] = Dispute({
            disputeId: disputeId,
            jobId: jobId,
            opener: msg.sender,
            reason: reason,
            openedBy: openedBy,
            resolved: false,
            resolution: "",
            createdAt: block.timestamp,
            resolvedAt: 0
        });

        totalDisputes++;

        emit DisputeOpened(disputeId, jobId, msg.sender, reason);

        return disputeId;
    }

    function submitRuling(bytes32 disputeId, string calldata decision)
        external
        nonReentrant
    {
        require(verifiedJudges[msg.sender], "Not a verified judge");

        Dispute storage dispute = disputes[disputeId];
        require(!dispute.resolved, "Dispute already resolved");

        Ruling storage ruling = rulings[disputeId][msg.sender];
        require(!ruling.hasRuled, "Judge already ruled");

        ruling.judge = msg.sender;
        ruling.hasRuled = true;
        ruling.decision = decision;

        disputeJudges[disputeId].push(msg.sender);

        emit RulingSubmitted(disputeId, msg.sender, decision);

        // Check for 2/3 majority
        _checkResolution(disputeId);
    }

    function _checkResolution(bytes32 disputeId) internal {
        Dispute storage dispute = disputes[disputeId];
        require(!dispute.resolved, "Already resolved");

        address[] memory judges = disputeJudges[disputeId];

        if (judges.length < 2) {
            return; // Need at least 2 judges
        }

        uint256 workerVotes = 0;
        uint256 employerVotes = 0;

        for (uint256 i = 0; i < judges.length; i++) {
            string memory decision = rulings[disputeId][judges[i]].decision;

            if (
                keccak256(abi.encodePacked(decision)) ==
                keccak256(abi.encodePacked("worker"))
            ) {
                workerVotes++;
            } else if (
                keccak256(abi.encodePacked(decision)) ==
                keccak256(abi.encodePacked("employer"))
            ) {
                employerVotes++;
            }
        }

        // 2/3 majority required (at least 2 judges must agree)
        if (workerVotes >= 2 && workerVotes > employerVotes) {
            _resolveDispute(disputeId, "worker_paid");
        } else if (employerVotes >= 2 && employerVotes > workerVotes) {
            _resolveDispute(disputeId, "employer_refunded");
        }
    }

    function _resolveDispute(bytes32 disputeId, string memory resolution)
        internal
    {
        Dispute storage dispute = disputes[disputeId];
        dispute.resolved = true;
        dispute.resolution = resolution;
        dispute.resolvedAt = block.timestamp;

        (uint256 amount, address employer, address worker, , , ) = workEscrow
            .getEscrow(dispute.jobId);

        if (
            keccak256(abi.encodePacked(resolution)) ==
            keccak256(abi.encodePacked("worker_paid"))
        ) {
            workEscrow.releaseToWorker(dispute.jobId, amount);
        } else {
            workEscrow.refundEmployer(dispute.jobId);
        }

        emit DisputeResolved(disputeId, dispute.jobId, resolution);
    }

    function getDispute(bytes32 disputeId)
        external
        view
        returns (Dispute memory)
    {
        return disputes[disputeId];
    }

    function getDisputeJudges(bytes32 disputeId)
        external
        view
        returns (address[] memory)
    {
        return disputeJudges[disputeId];
    }

    function getRuling(bytes32 disputeId, address judge)
        external
        view
        returns (Ruling memory)
    {
        return rulings[disputeId][judge];
    }

    function isJudgeVerified(address judge) external view returns (bool) {
        return verifiedJudges[judge];
    }
}
