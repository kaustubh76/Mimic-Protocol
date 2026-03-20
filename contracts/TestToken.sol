// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title TestToken
 * @notice Standard ERC20 token deployed on Monad testnet for Mirror Protocol trade execution
 * @dev Includes a public faucet function for testnet usage
 */
contract TestToken is ERC20 {
    uint8 private _decimals;
    uint256 public constant FAUCET_AMOUNT = 10_000 * 1e18;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 initialSupply
    ) ERC20(name_, symbol_) {
        _decimals = decimals_;
        _mint(msg.sender, initialSupply);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Public faucet for testnet — anyone can claim tokens
     */
    function faucet() external {
        _mint(msg.sender, FAUCET_AMOUNT);
    }

    /**
     * @notice Mint to a specific address (faucet variant)
     */
    function faucetTo(address to) external {
        _mint(to, FAUCET_AMOUNT);
    }
}
