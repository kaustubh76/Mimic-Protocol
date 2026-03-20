// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/BehavioralNFT.sol";
import "../contracts/DelegationRouter.sol";
import "../contracts/ExecutionEngine.sol";
import "../contracts/PatternDetector.sol";
import "../contracts/MockDEX.sol";

/**
 * @title DeployAll
 * @notice One-shot deployment of all Mirror Protocol contracts on Monad Testnet
 * @dev Run: forge script script/DeployAll.s.sol:DeployAll --rpc-url monad --broadcast --legacy
 *
 * MINTING NOTE:
 * mintPattern() and updatePerformance() both require onlyPatternDetector.
 * We temporarily set deployer as patternDetector to seed initial strategies,
 * then wire the real PatternDetector contract at the end.
 */
contract DeployAll is Script {
    function run() external {
        uint256 deployerPrivateKey = uint256(vm.envBytes32("DEPLOYER_PRIVATE_KEY"));
        address deployer = vm.addr(deployerPrivateKey);

        console.log("==================================================");
        console.log("MIRROR PROTOCOL - FULL DEPLOYMENT");
        console.log("==================================================");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("Balance:", deployer.balance);
        console.log("==================================================");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy BehavioralNFT
        BehavioralNFT nft = new BehavioralNFT(deployer);
        console.log("\n[1/5] BehavioralNFT:", address(nft));

        // 2. Deploy DelegationRouter
        DelegationRouter router = new DelegationRouter(address(nft), deployer);
        console.log("[2/5] DelegationRouter:", address(router));

        // 3. Deploy ExecutionEngine
        ExecutionEngine engine = new ExecutionEngine(address(router), address(nft));
        console.log("[3/5] ExecutionEngine:", address(engine));

        // 4. Deploy PatternDetector
        PatternDetector detector = new PatternDetector(address(nft));
        console.log("[4/5] PatternDetector:", address(detector));

        // 5. Deploy MockDEX
        MockDEX dex = new MockDEX();
        console.log("[5/5] MockDEX:", address(dex));

        // === Wire ExecutionEngine into Router ===
        router.setExecutionEngine(address(engine));
        console.log("\n--- Wiring: Router -> ExecutionEngine set");

        // === Temporarily set deployer as patternDetector to seed strategies ===
        // mintPattern() and updatePerformance() both require onlyPatternDetector.
        // We set deployer, mint all 7, updatePerformance all 7, then set real detector.
        nft.setPatternDetector(deployer);
        console.log("--- Wiring: deployer set as temporary patternDetector");

        // === Mint 7 initial trading strategies ===
        console.log("\n--- Minting initial strategies ---");

        uint256 tokenId1 = nft.mintPattern(
            deployer,
            "Momentum",
            abi.encode("RSI-based momentum strategy", uint256(70), uint256(30))
        );
        console.log("  Strategy 1: Momentum minted, tokenId:", tokenId1);

        uint256 tokenId2 = nft.mintPattern(
            deployer,
            "MeanReversion",
            abi.encode("Bollinger band mean reversion", uint256(20), uint256(2))
        );
        console.log("  Strategy 2: MeanReversion minted, tokenId:", tokenId2);

        uint256 tokenId3 = nft.mintPattern(
            deployer,
            "Arbitrage",
            abi.encode("Cross-DEX arbitrage", uint256(5), uint256(100000e18))
        );
        console.log("  Strategy 3: Arbitrage minted, tokenId:", tokenId3);

        uint256 tokenId4 = nft.mintPattern(
            deployer,
            "Liquidity",
            abi.encode("Liquidity provision strategy", uint256(50), uint256(10000e18))
        );
        console.log("  Strategy 4: Liquidity minted, tokenId:", tokenId4);

        uint256 tokenId5 = nft.mintPattern(
            deployer,
            "Yield",
            abi.encode("Yield farming optimizer", uint256(100), uint256(5000e18))
        );
        console.log("  Strategy 5: Yield minted, tokenId:", tokenId5);

        uint256 tokenId6 = nft.mintPattern(
            deployer,
            "Composite",
            abi.encode("Multi-strategy composite", uint256(3), uint256(25000e18))
        );
        console.log("  Strategy 6: Composite minted, tokenId:", tokenId6);

        uint256 tokenId7 = nft.mintPattern(
            deployer,
            "AdvancedMeanReversion",
            abi.encode("Advanced mean reversion with ML signals", uint256(20), uint256(50000e18))
        );
        console.log("  Strategy 7: AdvancedMeanReversion minted, tokenId:", tokenId7);

        // === Update performance metrics while still patternDetector ===
        // winRate in basis points (10000 = 100%), totalVolume in wei, roi in basis points
        console.log("\n--- Updating performance metrics ---");
        nft.updatePerformance(tokenId1, 8750, 10287 ether, 2870);
        console.log("  Momentum: winRate=87.5%, roi=28.7%");

        nft.updatePerformance(tokenId2, 9000, 5000 ether, 270);
        console.log("  MeanReversion: winRate=90%, roi=2.7%");

        nft.updatePerformance(tokenId3, 6667, 12000 ether, 4583);
        console.log("  Arbitrage: winRate=66.7%, roi=45.8%");

        nft.updatePerformance(tokenId4, 8000, 1500 ether, 125);
        console.log("  Liquidity: winRate=80%, roi=1.25%");

        nft.updatePerformance(tokenId5, 8571, 10500 ether, 3900);
        console.log("  Yield: winRate=85.7%, roi=39%");

        nft.updatePerformance(tokenId6, 7500, 25000 ether, 1200);
        console.log("  Composite: winRate=75%, roi=12%");

        nft.updatePerformance(tokenId7, 8200, 50000 ether, 2500);
        console.log("  AdvancedMeanReversion: winRate=82%, roi=25%");

        // === Now wire real PatternDetector and add executor ===
        nft.setPatternDetector(address(detector));
        console.log("\n--- Wiring: NFT -> real PatternDetector set");

        engine.addExecutor(deployer);
        console.log("--- Wiring: Deployer added as executor");

        vm.stopBroadcast();

        // === Summary ===
        console.log("\n==================================================");
        console.log("DEPLOYMENT COMPLETE!");
        console.log("==================================================");
        console.log("BehavioralNFT:     ", address(nft));
        console.log("DelegationRouter:  ", address(router));
        console.log("ExecutionEngine:   ", address(engine));
        console.log("PatternDetector:   ", address(detector));
        console.log("MockDEX:           ", address(dex));
        console.log("Total Patterns:    ", nft.totalPatterns());
        console.log("==================================================");
        console.log("\nCopy these into .env:");
        console.log("BEHAVIORAL_NFT_ADDRESS=", address(nft));
        console.log("DELEGATION_ROUTER_ADDRESS=", address(router));
        console.log("EXECUTION_ENGINE_ADDRESS=", address(engine));
        console.log("PATTERN_DETECTOR_ADDRESS=", address(detector));
        console.log("MOCK_DEX_ADDRESS=", address(dex));
        console.log("==================================================");
    }
}
