// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockDEX
 * @notice Mock DEX for testing ExecutionEngine trades
 * @dev Simulates successful swaps for demo purposes
 */
contract MockDEX {
    event Swap(
        address indexed sender,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    /**
     * @notice Mock swap function
     * @dev Always succeeds and emits event
     */
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external payable returns (uint256 amountOut) {
        // Simulate 98% output (2% slippage)
        amountOut = (amountIn * 98) / 100;

        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);

        return amountOut;
    }

    /**
     * @notice Mock swap exact ETH for tokens
     */
    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts) {
        amounts = new uint256[](2);
        amounts[0] = msg.value;
        amounts[1] = (msg.value * 98) / 100; // 2% slippage

        emit Swap(msg.sender, address(0), path[1], msg.value, amounts[1]);

        return amounts;
    }

    /**
     * @notice Accept ETH
     */
    receive() external payable {}
}
