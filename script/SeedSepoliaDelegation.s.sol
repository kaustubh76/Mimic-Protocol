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
        console.log("MIRROR PROTOCOL - SEED SEPOLIA DELEGATIONS");
        console.log("==================================================");
        console.log("Deployer:         ", deployer);
        console.log("Chain ID:         ", block.chainid);
        console.log("Balance:          ", deployer.balance);
        console.log("DelegationRouter: ", routerAddr);
        console.log("BehavioralNFT:    ", nftAddr);
        console.log("Allocation (bps): ", PERCENTAGE_ALLOCATION);
        console.log("==================================================");

        require(block.chainid == 11155111, "Not Sepolia");

        // Use the deployer address as the "smart account" — legal per router
        // source, only requires != address(0). Makes the bot's later
        // ensureSmartAccountFunded call a no-op self-transfer.
        address smartAccount = deployer;

        // Pre-flight: detect which pattern IDs already have a delegation
        // from this delegator, so we don't attempt to re-create them during
        // the broadcast. Forge's script broadcast simulator aborts on any
        // reverted sub-call (even Solidity-level try/catch'd ones), so we
        // must gate before calling `createSimpleDelegation` rather than
        // catching afterwards.
        //
        // The router exposes `getDelegationId(delegator, patternId)` which
        // returns 0 if no delegation exists, else the existing id. We use
        // that to skip pre-existing delegations cleanly.
        uint256 created = 0;
        uint256 skipped = 0;

        vm.startBroadcast(deployerPrivateKey);

        for (uint256 pId = 1; pId <= 7; pId++) {
            if (!nft.isPatternActive(pId)) {
                console.log("  [skip] pattern", pId, "inactive");
                skipped++;
                continue;
            }

            // Pattern 1 was seeded in an earlier run, so there's already a
            // delegation. Check explicitly before attempting the create to
            // avoid the DelegationAlreadyExists revert that breaks the
            // broadcast simulator.
            uint256 existing = router.getDelegationId(deployer, pId);
            if (existing != 0) {
                console.log("  [skip] pattern", pId, "already delegated as id", existing);
                skipped++;
                continue;
            }

            uint256 delegationId = router.createSimpleDelegation(pId, PERCENTAGE_ALLOCATION, smartAccount);
            console.log("  [ok]   pattern", pId, "-> delegation", delegationId);
            created++;
        }

        vm.stopBroadcast();

        console.log("");
        console.log("==================================================");
        console.log("SEED RESULT");
        console.log("==================================================");
        console.log("Created:         ", created);
        console.log("Skipped/existed: ", skipped);
        console.log("Smart account:   ", smartAccount);
        console.log("");
        console.log("Next steps:");
        console.log("  1. Wait ~3s for Envio to index the DelegationCreated events");
        console.log("  2. Start the bot: node executor-bot/bot.mjs");
        console.log("  3. Bot will pick up all active delegations and execute trades");
        console.log("     against the real Sepolia Uniswap V2 WETH/USDC pool");
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
