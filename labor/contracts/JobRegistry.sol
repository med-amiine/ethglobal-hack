// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract JobRegistry is Ownable, ReentrancyGuard {
    struct Job {
        bytes32 jobId;
        address employer;
        address worker;
        uint256 dailyRateUSDC;
        uint256 startDate;
        uint256 endDate;
        bool active;
        string hederaTopicId;
        string location;
        uint256 createdAt;
    }

    mapping(bytes32 => Job) public jobs;
    mapping(address => bool) public verifiedEmployers;
    mapping(address => bytes32[]) public employerJobs;
    mapping(address => bytes32[]) public workerJobs;

    event JobCreated(
        bytes32 indexed jobId,
        address indexed employer,
        uint256 dailyRate,
        string location,
        uint256 startDate,
        uint256 endDate
    );

    event WorkerAssigned(bytes32 indexed jobId, address indexed worker);

    event JobCompleted(bytes32 indexed jobId, address indexed worker);

    event EmployerVerified(address indexed employer);

    event JobCanceled(bytes32 indexed jobId);

    modifier onlyVerifiedEmployer(address employer) {
        require(verifiedEmployers[employer], "Employer not verified by World ID");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function setEmployerVerified(address employer) external onlyOwner {
        require(employer != address(0), "Invalid employer address");
        verifiedEmployers[employer] = true;
        emit EmployerVerified(employer);
    }

    function createJob(
        uint256 dailyRateUSDC,
        uint256 startDate,
        uint256 endDate,
        string calldata location
    ) external onlyVerifiedEmployer(msg.sender) returns (bytes32) {
        require(dailyRateUSDC > 0, "Rate must be > 0");
        require(startDate < endDate, "Invalid dates");
        require(startDate >= block.timestamp, "Start date must be in future");

        bytes32 jobId = keccak256(
            abi.encodePacked(msg.sender, block.timestamp, block.number)
        );

        jobs[jobId] = Job({
            jobId: jobId,
            employer: msg.sender,
            worker: address(0),
            dailyRateUSDC: dailyRateUSDC,
            startDate: startDate,
            endDate: endDate,
            active: true,
            hederaTopicId: "",
            location: location,
            createdAt: block.timestamp
        });

        employerJobs[msg.sender].push(jobId);

        emit JobCreated(
            jobId,
            msg.sender,
            dailyRateUSDC,
            location,
            startDate,
            endDate
        );

        return jobId;
    }

    function assignWorker(bytes32 jobId, address worker) external {
        Job storage job = jobs[jobId];
        require(job.employer == msg.sender, "Only employer can assign");
        require(job.active, "Job not active");
        require(worker != address(0), "Invalid worker");

        job.worker = worker;
        workerJobs[worker].push(jobId);

        emit WorkerAssigned(jobId, worker);
    }

    function setHederaTopic(bytes32 jobId, string calldata topicId) external {
        Job storage job = jobs[jobId];
        require(
            job.employer == msg.sender || msg.sender == owner(),
            "Unauthorized"
        );
        job.hederaTopicId = topicId;
    }

    function completeJob(bytes32 jobId) external {
        Job storage job = jobs[jobId];
        require(job.active, "Job not active");
        require(job.employer == msg.sender, "Only employer can complete");
        require(job.worker != address(0), "No worker assigned");

        job.active = false;

        emit JobCompleted(jobId, job.worker);
    }

    function cancelJob(bytes32 jobId) external {
        Job storage job = jobs[jobId];
        require(job.employer == msg.sender, "Only employer can cancel");
        require(job.active, "Job not active");

        job.active = false;

        emit JobCanceled(jobId);
    }

    function getJob(bytes32 jobId) external view returns (Job memory) {
        return jobs[jobId];
    }

    function getEmployerJobs(address employer)
        external
        view
        returns (bytes32[] memory)
    {
        return employerJobs[employer];
    }

    function getWorkerJobs(address worker)
        external
        view
        returns (bytes32[] memory)
    {
        return workerJobs[worker];
    }

    function isEmployerVerified(address employer)
        external
        view
        returns (bool)
    {
        return verifiedEmployers[employer];
    }
}
