// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

import "../contracts/DelegationRouter.sol";
import "../contracts/BehavioralNFT.sol";

/**
 * @title SeedSepoliaDelegation
 * @notice One-shot script that creates a real delegation on live Sepolia so
 *         the executor bot can pick it up and fire a real Uniswap V2 swap.
 *
 * @dev This is the "one command end-to-end demo" path. After broadcast:
 *      1. DelegationCreated event fires on Sepolia
 *      2. Envio indexer at 009ef9b picks it up within ~3s
 *      3. Bot's next 5s poll sees it in fetchActiveDelegations
 *      4. Bot auto-funds the smart account (executor EOA itself) with WETH
 *      5. Bot calls ExecutionEngine.executeTrade → real Uniswap V2 swap
 *      6. TradeExecuted event fires, Envio indexes it, frontend shows it
 *
 *      Run with:
 *          forge script script/SeedSepoliaDelegation.s.sol:SeedSepoliaDelegation \
 *              --rpc-url sepolia --broadcast --legacy
 *
 *      Required env vars:
 *          DEPLOYER_PRIVATE_KEY  (with 0x prefix, must be the same key that
 *                                 deployed the Sepolia contracts during gate 7)
 *
 *      Defaults (overridable via env):
 *          SEPOLIA_DELEGATION_ROUTER_ADDRESS  0xD36fB1E9...
 *          SEPOLIA_BEHAVIORAL_NFT_ADDRESS     0xCFa22481...
 */
contract SeedSepoliaDelegation is Script {
    // Gate 7 deploy addresses — overridable via env for safety.
    address constant DEFAULT_ROUTER = 0xD36fB1E9537fa3b7b15B9892eb0E42A0226577a8;
    address constant DEFAULT_NFT    = 0xCFa22481dDa2E4758115D3e826C2FfA1eC9c3954;

    // Seed pattern 1 = "Momentum" (gate 7 mint, 87.5% win rate, 28.7% ROI).
    uint256 constant PATTERN_TOKEN_ID = 1;

    // 50% allocation in basis points (router accepts 1-10000).
    uint256 constant PERCENTAGE_ALLOCATION = 5000;

    function run() external {
        uint256 deployerPrivateKey = uint256(vm.envBytes32("DEPLOYER_PRIVATE_KEY"));
        address deployer = vm.addr(deployerPrivateKey);

        address routerAddr = _envAddressOr("SEPOLIA_DELEGATION_ROUTER_ADDRESS", DEFAULT_ROUTER);
        address nftAddr    = _envAddressOr("SEPOLIA_BEHAVIORAL_NFT_ADDRESS",    DEFAULT_NFT);

        DelegationRouter router = DelegationRouter(routerAddr);
        BehavioralNFT    nft    = BehavioralNFT(nftAddr);

        console.log("==================================================");
        console.log("MIRROR PROTOCOL - SEED SEPOLIA DELEGATION");
        console.log("==================================================");
        console.log("Deployer:         ", deployer);
        console.log("Chain ID:         ", block.chainid);
        console.log("Balance:          ", deployer.balance);
        console.log("DelegationRouter: ", routerAddr);
        console.log("BehavioralNFT:    ", nftAddr);
        console.log("Pattern token ID: ", PATTERN_TOKEN_ID);
        console.log("Allocation (bps): ", PERCENTAGE_ALLOCATION);
        console.log("==================================================");

        require(block.chainid == 11155111, "Not Sepolia");

        // Pre-flight: confirm pattern is active. If it's not, bail early
        // rather than broadcast a failing tx.
        require(nft.isPatternActive(PATTERN_TOKEN_ID), "Pattern not active");

        // Use the deployer address as the "smart account" — legal per router
        // source, only requires != address(0). Makes the bot's later
        // ensureSmartAccountFunded call a no-op self-transfer.
        address smartAccount = deployer;

        vm.startBroadcast(deployerPrivateKey);

        uint256 delegationId = router.createSimpleDelegation(
            PATTERN_TOKEN_ID,
            PERCENTAGE_ALLOCATION,
            smartAccount
        );

        vm.stopBroadcast();

        console.log("");
        console.log("==================================================");
        console.log("DELEGATION CREATED");
        console.log("==================================================");
        console.log("Delegation ID:    ", delegationId);
        console.log("Smart account:    ", smartAccount);
        console.log("");
        console.log("Next steps:");
        console.log("  1. Wait ~3s for Envio to index DelegationCreated");
        console.log("  2. Start the bot: node executor-bot/bot.mjs");
        console.log("  3. Bot's next cycle will pick it up and fire a real swap");
        console.log("==================================================");
    }

    function _envAddressOr(string memory key, address fallbackAddr) internal view returns (address) {
        try vm.envAddress(key) returns (address a) {
            return a;
        } catch {
            return fallbackAddr;
        }
    }
}
