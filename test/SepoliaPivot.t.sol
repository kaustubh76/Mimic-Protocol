// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../contracts/BehavioralNFT.sol";
import "../contracts/DelegationRouter.sol";
import "../contracts/ExecutionEngine.sol";
import "../contracts/UniswapV2Adapter.sol";

/// @notice Minimal WETH9 interface — wrap/unwrap + ERC20 basics.
interface IWETH9 {
    function deposit() external payable;
    function balanceOf(address) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

/**
 * @title SepoliaPivotTest
 * @notice Forked Sepolia integration test for the Mirror Protocol Sepolia pivot.
 *
 * @dev These tests use `vm.createSelectFork` to snapshot live Sepolia into an
 *      in-memory EVM. They bind to the ALREADY-DEPLOYED Mirror Protocol contracts
 *      plus the REAL Sepolia Uniswap V2 Router / WETH / USDC and exercise the full
 *      `createDelegation → executeTrade → real Uniswap V2 swap` flow. Nothing writes
 *      to live Sepolia; no Sepolia ETH is spent.
 *
 *      This is the only test in the suite that exercises UniswapV2Adapter against
 *      real on-chain liquidity. The other 143 tests in test/*.t.sol use the local
 *      MockDEX and don't cover the real adapter → router interaction.
 *
 *      Run with:
 *          forge test --match-contract SepoliaPivot \
 *                     --fork-url https://ethereum-sepolia-rpc.publicnode.com -vv
 *
 *      Or, preferred:
 *          ./test/run-sepolia-harness.sh
 */
contract SepoliaPivotTest is Test {
    // ─── Deployed Sepolia addresses (gate 7) ────────────────────────────
    BehavioralNFT     constant nft     = BehavioralNFT(0xCFa22481dDa2E4758115D3e826C2FfA1eC9c3954);
    DelegationRouter  constant router  = DelegationRouter(0xD36fB1E9537fa3b7b15B9892eb0E42A0226577a8);
    ExecutionEngine   constant engine  = ExecutionEngine(0x1C1b05628EFaD25804E663dEeA97e224ccA1eD5A);
    UniswapV2Adapter  constant adapter = UniswapV2Adapter(0x5B59f315d4E2670446ed7B130584A326A0f7c2D3);

    // ─── Sepolia Uniswap V2 infrastructure (verified live in gate 1) ────
    IWETH9 constant WETH = IWETH9(0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14);
    IERC20 constant USDC = IERC20(0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238);
    address constant UNISWAP_V2_ROUTER = 0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3;

    // ─── Deployer / executor ────────────────────────────────────────────
    // This is the only address registered as an executor on the engine (gate 7).
    // In the fork we bypass signing by using vm.prank(DEPLOYER) instead.
    address constant DEPLOYER = 0xAAd52728179aE3E4092845644FD28cd5738AFafA;

    // ─── Test actors ────────────────────────────────────────────────────
    // Fresh addresses that do not exist on chain yet. makeAddr() returns a
    // deterministic address derived from the label, but it has no code, no
    // nonce, and no balance on the fork — effectively a clean EOA.
    address delegator = makeAddr("sepolia_pivot_delegator");
    address smartAccount; // set in setUp; delegator acts as its own smart account

    uint256 constant TRADE_AMOUNT = 0.001 ether;

    function setUp() public {
        // Fork live Sepolia at the current head. Defaults to the public RPC
        // if SEPOLIA_RPC_URL is not set, so local runs and CI both work.
        vm.createSelectFork(
            vm.envOr("SEPOLIA_RPC_URL", string("https://ethereum-sepolia-rpc.publicnode.com"))
        );

        // Sanity check: the fork grabbed Sepolia (not mainnet, not Monad).
        assertEq(block.chainid, 11155111, "fork not sepolia");

        // Sanity check: the deployed contracts exist.
        assertGt(address(nft).code.length,     0, "BehavioralNFT missing code");
        assertGt(address(router).code.length,  0, "DelegationRouter missing code");
        assertGt(address(engine).code.length,  0, "ExecutionEngine missing code");
        assertGt(address(adapter).code.length, 0, "UniswapV2Adapter missing code");
        assertGt(address(WETH).code.length,    0, "WETH missing code");
        assertGt(address(USDC).code.length,    0, "USDC missing code");

        smartAccount = delegator;

        // Give every test actor some native ETH for gas inside the fork.
        // This does NOT touch real Sepolia — it just sets the fork's state.
        vm.deal(delegator, 1 ether);
        vm.deal(DEPLOYER, 1 ether);
    }

    /*//////////////////////////////////////////////////////////////
                     TEST 1 — WIRING SANITY
    //////////////////////////////////////////////////////////////*/

    /// @notice The most basic check: did the gate 7 deploy wire everything?
    ///         If this test fails, the live deploy is broken and all the
    ///         others will fail too. Run this first to diagnose.
    function test_AdapterIsWiredCorrectly() public {
        // Adapter points at the real Uniswap V2 router and the right token pair.
        assertEq(address(adapter.router()), UNISWAP_V2_ROUTER, "adapter.router mismatch");
        assertEq(address(adapter.tokenA()), address(WETH),     "adapter.tokenA mismatch");
        assertEq(address(adapter.tokenB()), address(USDC),     "adapter.tokenB mismatch");

        // Engine holds a non-trivial WETH float (gate 7 wrapped 0.1 ETH).
        // We assert >= 0.001 instead of the full 0.1 because prior bot runs
        // may have drained part of the float — any balance sufficient for one
        // trade is a pass.
        assertGe(WETH.balanceOf(address(engine)), TRADE_AMOUNT, "engine WETH float below trade amount");

        // Engine has given the adapter maximum allowance to pull WETH (gate 7
        // called engine.approveToken(WETH, adapter, type(uint256).max)).
        assertEq(
            IERC20(address(WETH)).allowance(address(engine), address(adapter)),
            type(uint256).max,
            "engine WETH allowance to adapter missing"
        );

        // Engine ownership + executor role are set correctly.
        assertEq(engine.owner(), DEPLOYER, "engine.owner() mismatch");
        assertTrue(engine.isExecutor(DEPLOYER), "deployer not registered as executor");
    }

    /*//////////////////////////////////////////////////////////////
                     TEST 2 — PATTERN STATE
    //////////////////////////////////////////////////////////////*/

    /// @notice The seed patterns minted during gate 7 should still be active
    ///         and owned by the deployer. If pattern 1 ever got deactivated
    ///         (e.g. by a future PatternDetector update), the full-flow test
    ///         would revert with `PatternInactive` — this test localizes that.
    function test_SeededPatternsAreActive() public view {
        assertTrue(nft.isPatternActive(1), "pattern 1 (Momentum) not active");
        assertEq(nft.ownerOf(1), DEPLOYER, "pattern 1 owner != deployer");
        // Spot check one more to confirm the whole seed set landed correctly.
        assertTrue(nft.isPatternActive(7), "pattern 7 (AdvancedMeanReversion) not active");
    }

    /*//////////////////////////////////////////////////////////////
                   TEST 3 — THE FULL END-TO-END FLOW
    //////////////////////////////////////////////////////////////*/

    /// @notice The critical test. Creates a fresh delegation against pattern 1,
    ///         funds the delegation's smart account with WETH (mirroring what
    ///         executor-bot/bot.mjs `ensureSmartAccountFunded` does), calls
    ///         ExecutionEngine.executeTrade with the exact swap callData the
    ///         bot would produce, and verifies that a REAL Uniswap V2 swap
    ///         moved WETH out of the engine and USDC back into it.
    function test_FullFlow_CreateDelegationAndExecuteRealSwap() public {
        // ── STEP 1: Create a fresh delegation as `delegator` pointing at
        //           pattern 1 ("Momentum") with 50% allocation.
        vm.prank(delegator);
        uint256 delegationId = router.createSimpleDelegation(
            /* patternTokenId          */ 1,
            /* percentageAllocation    */ 5000, // 50% in basis points
            /* smartAccount            */ smartAccount
        );

        // ── STEP 2: Fund the smart account with WETH the way the bot does.
        //           bot.mjs's ensureSmartAccountFunded wraps ETH on the
        //           executor EOA then transfers WETH to the smart account.
        vm.startPrank(DEPLOYER);
        WETH.deposit{value: TRADE_AMOUNT}();
        WETH.transfer(smartAccount, TRADE_AMOUNT);
        vm.stopPrank();
        assertEq(WETH.balanceOf(smartAccount), TRADE_AMOUNT, "smart account funding failed");

        // ── STEP 3: Snapshot engine balances before the swap so we can
        //           assert on the delta.
        uint256 engineWethBefore = WETH.balanceOf(address(engine));
        uint256 engineUsdcBefore = USDC.balanceOf(address(engine));

        // ── STEP 4: Build the exact tradeParams + metrics the bot passes
        //           in executor-bot/bot.mjs processExecution (after the
        //           Sepolia pivot).
        ExecutionEngine.TradeParams memory tradeParams = ExecutionEngine.TradeParams({
            delegationId: delegationId,
            token: address(WETH),
            amount: TRADE_AMOUNT,
            targetContract: address(adapter),
            callData: abi.encodeCall(
                UniswapV2Adapter.swap,
                (
                    IERC20(address(WETH)),  // tokenIn
                    TRADE_AMOUNT,            // amountIn (will be scaled by the
                                             // engine's 50% allocation → 0.0005 WETH)
                    0,                       // minAmountOut = 0 for the demo
                    address(engine)          // to — USDC accumulates in the engine
                )
            )
        });

        // These are the metrics pattern 1 was seeded with during gate 7.
        ExecutionEngine.PerformanceMetrics memory metrics = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 8750,       // 87.5 %
            currentROI: 2870,           // 28.7 %
            currentVolume: 10287 ether, // seeded total volume
            lastUpdated: block.timestamp
        });

        // ── STEP 5: Execute as the deployer (the only registered executor).
        vm.prank(DEPLOYER);
        bool success = engine.executeTrade(tradeParams, metrics);
        assertTrue(success, "executeTrade returned false");

        // ── STEP 6: Assert real balance changes.
        //
        // IMPORTANT: the engine's `percentageAllocation` only scales the value
        // recorded in the ExecutionStats bookkeeping. It does NOT scale the
        // `amountIn` inside the adapter's callData, because the bot encodes
        // `TRADE_AMOUNT` directly (see executor-bot/bot.mjs:418-424). So the
        // engine's WETH float drops by the full TRADE_AMOUNT, not by the
        // allocated fraction.
        assertEq(
            WETH.balanceOf(address(engine)),
            engineWethBefore - TRADE_AMOUNT,
            "engine WETH balance did not decrease by TRADE_AMOUNT"
        );
        assertGt(
            USDC.balanceOf(address(engine)),
            engineUsdcBefore,
            "engine received no USDC from the real Uniswap V2 swap"
        );

        // Log the swap details so -vv output shows realistic numbers.
        uint256 usdcOut = USDC.balanceOf(address(engine)) - engineUsdcBefore;
        emit log_named_uint("WETH spent (wei)",    TRADE_AMOUNT);
        emit log_named_uint("USDC received (raw)", usdcOut);
    }

    /*//////////////////////////////////////////////////////////////
                   TEST 4 — REVERT GUARD
    //////////////////////////////////////////////////////////////*/

    /// @notice Verifies graceful failure: if the engine runs out of WETH float,
    ///         the adapter's safeTransferFrom reverts, the engine's try/catch
    ///         wrapper catches the revert, and executeTrade returns false
    ///         (rather than bubbling the revert). This is critical because the
    ///         engine's design at ExecutionEngine.sol:512-517 deliberately
    ///         swallows failed swaps to allow bookkeeping to continue.
    function test_ExecuteTrade_ReturnsFalseIfEngineUnderfunded() public {
        // Create the delegation first (same as Test 3).
        vm.prank(delegator);
        uint256 delegationId = router.createSimpleDelegation(1, 5000, smartAccount);

        // Fund the smart account so the engine's `balanceOf(smartAccount) >=
        // amount` precondition passes. Otherwise we'd fail on the wrong check
        // and not actually exercise the adapter's under-funding path.
        vm.startPrank(DEPLOYER);
        WETH.deposit{value: TRADE_AMOUNT}();
        WETH.transfer(smartAccount, TRADE_AMOUNT);
        vm.stopPrank();

        // Drain the engine's entire WETH float. `vm.prank(address(engine))`
        // makes the fork call WETH.transfer as if from the engine itself,
        // which works for any plain ERC20 because transfer() reads msg.sender.
        uint256 engineWeth = WETH.balanceOf(address(engine));
        if (engineWeth > 0) {
            vm.prank(address(engine));
            WETH.transfer(address(0xDEAD), engineWeth);
        }
        assertEq(WETH.balanceOf(address(engine)), 0, "engine should be drained");

        // Same tradeParams as Test 3.
        ExecutionEngine.TradeParams memory p = ExecutionEngine.TradeParams({
            delegationId: delegationId,
            token: address(WETH),
            amount: TRADE_AMOUNT,
            targetContract: address(adapter),
            callData: abi.encodeCall(
                UniswapV2Adapter.swap,
                (IERC20(address(WETH)), TRADE_AMOUNT, 0, address(engine))
            )
        });
        ExecutionEngine.PerformanceMetrics memory m = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 8750,
            currentROI: 2870,
            currentVolume: 10287 ether,
            lastUpdated: block.timestamp
        });

        // The engine's try/catch wrapper catches the adapter's revert and
        // returns success=false rather than bubbling. Assert the boolean
        // return value, not a revert.
        vm.prank(DEPLOYER);
        bool success = engine.executeTrade(p, m);
        assertFalse(success, "executeTrade should return false when engine has no WETH float");
    }
}
