// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

import {PMMockOracle} from "../contracts/pm/PMMockOracle.sol";
import {PMMarketFactory} from "../contracts/pm/PMMarketFactory.sol";
import {PMMarket} from "../contracts/pm/PMMarket.sol";

/**
 * @title DeployPMSepolia
 * @author Kaustubh Agrawal — Growth Engineer candidate package
 * @notice One-shot deployment of the PM contracts to Ethereum Sepolia. Backs
 *         the Envio indexer in pow/envio-pm-template-v1/ with on-chain
 *         contracts the candidate owns, so the indexer's four-state
 *         settlement machine can be exercised end-to-end against real chain
 *         state.
 *
 * @dev Dry-run (no state changes, no ETH spent):
 *        forge script script/DeployPMSepolia.s.sol:DeployPMSepolia \
 *          --rpc-url $SEPOLIA_RPC_URL
 *
 *      Broadcast (real deploy — Sepolia ETH spent, irreversible):
 *        forge script script/DeployPMSepolia.s.sol:DeployPMSepolia \
 *          --rpc-url $SEPOLIA_RPC_URL \
 *          --private-key $DEPLOYER_PRIVATE_KEY \
 *          --broadcast --verify
 *
 *      Required env vars for broadcast:
 *        DEPLOYER_PRIVATE_KEY  — 0x-prefixed deployer key
 *        SEPOLIA_RPC_URL       — Sepolia RPC endpoint
 *        ETHERSCAN_API_KEY     — for --verify (optional)
 *
 *      Optional env vars:
 *        PM_RESOLVER           — address authorised to report resolutions.
 *                                Defaults to the deployer.
 *        PM_SEED_MARKET        — if "1", seed one example market with a
 *                                7-day deadline so the indexer has events
 *                                to find immediately. Defaults to "1".
 *
 *      After broadcast:
 *        - Deployed addresses are logged to stdout.
 *        - Update pow/envio-pm-template-v1/config.yaml with the
 *          PMMarketFactory address under the chain-11155111 network entry.
 */
contract DeployPMSepolia is Script {
    function run() external {
        address resolver = vm.envOr("PM_RESOLVER", address(0));
        bool seedMarket = vm.envOr("PM_SEED_MARKET", uint256(1)) == 1;

        // Resolve the deployer address. In broadcast mode this is the address
        // derived from DEPLOYER_PRIVATE_KEY; in dry-run mode it's tx.origin.
        uint256 deployerKey = vm.envOr("DEPLOYER_PRIVATE_KEY", uint256(0));
        address deployer = deployerKey != 0 ? vm.addr(deployerKey) : tx.origin;

        // If no resolver was set, the deployer becomes the resolver. This is
        // the right default for a candidate-portfolio deploy where the
        // candidate is also the one poking the oracle.
        if (resolver == address(0)) resolver = deployer;

        console.log("=== DeployPMSepolia ===");
        console.log("deployer:   ", deployer);
        console.log("resolver:   ", resolver);
        console.log("seedMarket: ", seedMarket);
        console.log("chainId:    ", block.chainid);

        // Sanity guard: refuse to run on a non-Sepolia chain unless the user
        // is in dry-run mode against a different RPC. block.chainid is 0 in
        // pure dry-run, 11155111 on Sepolia.
        if (block.chainid != 0 && block.chainid != 11155111) {
            console.log("WARNING: not running on Sepolia (chain 11155111).");
        }

        vm.startBroadcast();

        PMMockOracle oracle = new PMMockOracle(resolver);
        PMMarketFactory factory = new PMMarketFactory(address(oracle));

        address seededMarket;
        if (seedMarket) {
            // 7-day market on a placeholder question — gives the indexer
            // immediate MarketCreated + (eventually) settlement events to
            // index. Question text is content-addressed via questionId so
            // the indexer can join off-chain question text on the questionId
            // field if the user wires a separate question-text source.
            bytes32 questionId = keccak256(
                abi.encodePacked(
                    "Will the PMMockOracle have reported resolution by deadline?", block.timestamp, address(factory)
                )
            );
            seededMarket = factory.createMarket(questionId, block.timestamp + 7 days, 2, "binary");
        }

        vm.stopBroadcast();

        console.log("");
        console.log("=== deployed addresses ===");
        console.log("PMMockOracle:    ", address(oracle));
        console.log("PMMarketFactory: ", address(factory));
        if (seededMarket != address(0)) {
            console.log("Seeded PMMarket: ", seededMarket);
        }
        console.log("");
        console.log("=== next steps ===");
        console.log("1. Update pow/envio-pm-template-v1/config.yaml:");
        console.log("   - Add networks entry id: 11155111");
        console.log("   - Set MarketFactory address to:", address(factory));
        console.log("   - Set start_block to deploy block");
        console.log("2. cd pow/envio-pm-template-v1 && pnpm dev");
        console.log("3. To exercise settlement, call PMMockOracle.reportResolution(market, outcome)");
    }
}
