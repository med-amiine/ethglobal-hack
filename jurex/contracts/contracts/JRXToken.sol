// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title JRXToken
 * @notice Jurex governance + judge-staking token
 * @dev On testnet, anyone can call drip() once per 24h to get free JRX.
 *      Judge eligibility requires staking >= JUDGE_STAKE_MIN in CourtRegistry.
 */
contract JRXToken is ERC20, Ownable {

    uint256 public constant FAUCET_AMOUNT   = 10_000 * 1e18; // 10k JRX per drip
    uint256 public constant FAUCET_COOLDOWN = 24 hours;

    mapping(address => uint256) public lastDripAt;

    event Dripped(address indexed to, uint256 amount);

    constructor() ERC20("Jurex Token", "JRX") Ownable(msg.sender) {
        // Mint 1 million JRX to deployer (for seeding liquidity, rewarding judges, etc.)
        _mint(msg.sender, 1_000_000 * 1e18);
    }

    /**
     * @notice Public testnet faucet — anyone can call once per 24 hours.
     *         In production this would be replaced by proper tokenomics.
     * @param to Recipient address
     */
    function drip(address to) external {
        require(
            block.timestamp >= lastDripAt[to] + FAUCET_COOLDOWN,
            "JRX faucet: 24h cooldown active"
        );
        lastDripAt[to] = block.timestamp;
        _mint(to, FAUCET_AMOUNT);
        emit Dripped(to, FAUCET_AMOUNT);
    }

    /**
     * @notice Owner-only mint for distributing rewards or seeding test accounts
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
