// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Minimal Uniswap V2 Router02 interface — only the function Mirror Protocol calls.
interface IUniswapV2Router02 {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

/**
 * @title UniswapV2Adapter
 * @notice Thin wrapper around Uniswap V2 Router02 that exposes a simple `swap()` call
 *         and emits a rich Swap event the Envio indexer can pick up directly.
 * @dev    Designed for Sepolia integration. Constructor sets max approvals for both
 *         tokens to the router, so the only runtime cost is the safeTransferFrom +
 *         the router swap itself.
 *
 *         Call pattern (from Mirror Protocol ExecutionEngine):
 *             ExecutionEngine._externalCall(address(adapter), abi.encodeCall(
 *                 adapter.swap, (tokenIn, amountIn, minAmountOut, to)
 *             ))
 *         msg.sender to the adapter will be the ExecutionEngine. The ExecutionEngine
 *         must have approved this adapter to spend its tokenIn balance first
 *         (see ExecutionEngine.approveToken).
 */
contract UniswapV2Adapter {
    using SafeERC20 for IERC20;

    IUniswapV2Router02 public immutable router;
    IERC20 public immutable tokenA;
    IERC20 public immutable tokenB;

    event Swap(
        address indexed sender,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address to
    );

    error InvalidTokenIn();
    error ZeroAddress();

    constructor(IUniswapV2Router02 _router, IERC20 _tokenA, IERC20 _tokenB) {
        if (address(_router) == address(0)
            || address(_tokenA) == address(0)
            || address(_tokenB) == address(0)) {
            revert ZeroAddress();
        }
        router = _router;
        tokenA = _tokenA;
        tokenB = _tokenB;

        // One-time max approvals so the router can pull either side of the pair
        // from this adapter's own balance during swapExactTokensForTokens.
        _tokenA.forceApprove(address(_router), type(uint256).max);
        _tokenB.forceApprove(address(_router), type(uint256).max);
    }

    /**
     * @notice Swap `amountIn` of `tokenIn` for the other pool token via Uniswap V2.
     * @dev    Pulls `amountIn` of `tokenIn` from msg.sender (the caller must have
     *         approved this adapter), routes it through Uniswap, and sends the
     *         output directly to `to`. Emits a Swap event on success.
     * @param tokenIn       Must be either tokenA or tokenB.
     * @param amountIn      Exact input amount in tokenIn's smallest unit.
     * @param minAmountOut  Slippage guard; the Uniswap router will revert if the
     *                      realized output is below this value.
     * @param to            Recipient of the swapped tokens.
     * @return amountOut    Actual output amount returned by the router.
     */
    function swap(
        IERC20 tokenIn,
        uint256 amountIn,
        uint256 minAmountOut,
        address to
    ) external returns (uint256 amountOut) {
        if (tokenIn != tokenA && tokenIn != tokenB) revert InvalidTokenIn();
        IERC20 tokenOut = tokenIn == tokenA ? tokenB : tokenA;

        // Pull the input tokens from the caller.
        tokenIn.safeTransferFrom(msg.sender, address(this), amountIn);

        address[] memory path = new address[](2);
        path[0] = address(tokenIn);
        path[1] = address(tokenOut);

        uint256[] memory amounts = router.swapExactTokensForTokens(
            amountIn,
            minAmountOut,
            path,
            to,
            block.timestamp + 300
        );

        amountOut = amounts[1];
        emit Swap(msg.sender, address(tokenIn), address(tokenOut), amountIn, amountOut, to);
    }
}
