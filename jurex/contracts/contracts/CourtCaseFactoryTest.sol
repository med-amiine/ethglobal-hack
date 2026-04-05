// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./CourtRegistry.sol";
import "./CourtCaseTest.sol";

/**
 * @title CourtCaseFactoryTest
 * @notice TEST VERSION factory. Deploys cases, randomly selects judges from JRX staker pool.
 *
 * Judge selection flow:
 *   1. Case reaches Active state (defendant responded).
 *   2. Anyone (keeper, plaintiff, defendant) calls assignJudgesToCase(caseAddress).
 *   3. Factory fetches eligible JRX stakers from CourtRegistry.
 *   4. Factory uses block.prevrandao + case address for pseudo-random selection.
 *   5. Factory calls case.assignJudges(selected[]).
 *
 * For appeal rounds: factory detects isAppeal == true and selects 5 judges.
 *
 * Fee sweep: factory owner calls sweepFeesFromCase(caseAddress, treasury).
 */
contract CourtCaseFactoryTest is Ownable {

    CourtRegistry public registry;
    address[]     public allCases;

    mapping(address => address[]) public casesByPlaintiff;
    mapping(address => address[]) public casesByDefendant;

    event CaseCreated(
        address indexed caseAddress,
        address indexed plaintiff,
        address indexed defendant,
        uint256 caseId
    );
    event JudgesAssigned(address indexed caseAddress, address[3] judges);
    event AppealJudgesAssigned(address indexed caseAddress, address[] judges);

    constructor(address _registry) Ownable(msg.sender) {
        require(_registry != address(0), "Invalid registry");
        registry = CourtRegistry(_registry);
    }

    // ============ Case filing ============

    /**
     * @notice File a new case with TEST stakes (0.0002 ETH = 2x BASE_FEE).
     */
    function fileNewCase(
        address _defendant,
        string calldata _claimDescription,
        string calldata _evidenceHash
    ) external payable returns (address caseAddress) {
        require(_defendant != address(0), "Invalid defendant");
        require(_defendant != msg.sender, "Cannot sue yourself");
        require(bytes(_claimDescription).length > 0, "Claim required");
        require(msg.value == 0.0002 ether, "Must stake 0.0002 ETH");

        CourtCaseTest newCase = new CourtCaseTest(
            address(registry),
            msg.sender,
            _defendant,
            _claimDescription,
            _evidenceHash
        );

        caseAddress = address(newCase);
        registry.registerCase(caseAddress);

        allCases.push(caseAddress);
        casesByPlaintiff[msg.sender].push(caseAddress);
        casesByDefendant[_defendant].push(caseAddress);

        CourtCaseTest(payable(caseAddress)).fileCase{value: msg.value}(msg.sender);

        emit CaseCreated(caseAddress, msg.sender, _defendant, allCases.length);
        return caseAddress;
    }

    // ============ Judge assignment ============

    /**
     * @notice Randomly assign judges from the JRX staker pool to a case in Active state.
     *         Anyone can call this (acts as a keeper). For appeal rounds, selects 5 judges.
     * @param _caseAddress The CourtCaseTest contract to assign judges to.
     * @param _seed        Extra entropy (e.g. caller-provided nonce). Combined with
     *                     block.prevrandao so the caller cannot fully control the outcome.
     */
    function assignJudgesToCase(address _caseAddress, uint256 _seed) external {
        CourtCaseTest courtCase = CourtCaseTest(payable(_caseAddress));

        CourtCaseTest.CaseState caseState = courtCase.state();
        require(
            caseState == CourtCaseTest.CaseState.Active ||
            caseState == CourtCaseTest.CaseState.Appealed,
            "Case not in Active or Appealed state"
        );
        require(courtCase.getJudges().length == 0 || caseState == CourtCaseTest.CaseState.Appealed,
            "Judges already assigned");

        bool appealRound = courtCase.isAppeal();
        uint256 needed   = appealRound ? 5 : 3;

        address plaintiff = courtCase.plaintiff();
        address defendant = courtCase.defendant();

        address[] memory pool = registry.getEligibleJudges(plaintiff, defendant);
        require(pool.length >= needed, "Not enough eligible judges in pool");

        // Fisher-Yates partial shuffle for `needed` picks
        // We work on a memory copy so storage is untouched.
        address[] memory selected = _selectRandom(pool, needed, _seed, _caseAddress);

        // Call assignJudges on the case (only this factory can call it)
        courtCase.assignJudges(selected);

        if (appealRound) {
            emit AppealJudgesAssigned(_caseAddress, selected);
        } else {
            emit JudgesAssigned(_caseAddress, [selected[0], selected[1], selected[2]]);
        }
    }

    function _selectRandom(
        address[] memory pool,
        uint256 needed,
        uint256 seed,
        address caseAddr
    ) internal view returns (address[] memory) {
        address[] memory arr = new address[](pool.length);
        for (uint256 i = 0; i < pool.length; i++) arr[i] = pool[i];

        address[] memory selected = new address[](needed);
        uint256 remaining = arr.length;

        for (uint256 i = 0; i < needed; i++) {
            uint256 rand = uint256(
                keccak256(abi.encodePacked(block.prevrandao, block.timestamp, caseAddr, seed, i))
            ) % remaining;

            selected[i] = arr[rand];
            // Swap chosen element to end of remaining pool
            arr[rand]       = arr[remaining - 1];
            arr[remaining - 1] = selected[i];
            remaining--;
        }

        return selected;
    }

    // ============ Fee sweep ============

    /**
     * @notice Owner sweeps accumulated court fees from a case contract to a treasury address.
     */
    function sweepFeesFromCase(address _caseAddress, address payable _treasury) external onlyOwner {
        CourtCaseTest(payable(_caseAddress)).sweepFees(_treasury);
    }

    // ============ View helpers ============

    function getAllCases() external view returns (address[] memory) { return allCases; }
    function getCasesByPlaintiff(address p) external view returns (address[] memory) { return casesByPlaintiff[p]; }
    function getCasesByDefendant(address d) external view returns (address[] memory) { return casesByDefendant[d]; }
    function getCaseCount() external view returns (uint256) { return allCases.length; }
}
