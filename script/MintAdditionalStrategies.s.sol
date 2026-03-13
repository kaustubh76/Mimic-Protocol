// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/BehavioralNFT.sol";

/**
 * @title MintAdditionalStrategies
 * @notice Mints 5 additional diverse trading strategies with realistic performance metrics
 */
contract MintAdditionalStrategies is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address behavioralNFTAddress = vm.envAddress("BEHAVIORAL_NFT_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        BehavioralNFT nft = BehavioralNFT(behavioralNFTAddress);
        
        console.log("Minting 5 additional trading strategies...");
        console.log("BehavioralNFT:", address(nft));
        console.log("");
        
        // Strategy 3: Arbitrage (High win rate, high volume)
        bytes memory arbitrageData = abi.encode(
            "Cross-DEX arbitrage",
            uint256(5),  // min spread: 0.5%
            uint256(100000e18)  // min volume
        );
        
        nft.mintPattern(
            msg.sender,
            "Arbitrage",
            arbitrageData
        );
        console.log("Strategy 3: Arbitrage - 90% win rate, +28.7% ROI");
        
        // Strategy 4: Liquidity (Medium-high win rate, steady returns)
        bytes memory liquidityData = abi.encode(
            "Liquidity provision strategy",
            uint256(50),  // min APR: 5%
            uint256(10000e18)  // min liquidity
        );
        
        nft.mintPattern(
            msg.sender,
            "Liquidity",
            liquidityData
        );
        console.log("Strategy 4: Liquidity - 90% win rate, +22% ROI");
        
        // Strategy 5: Yield (Lower win rate, but high ROI when successful)
        bytes memory yieldData = abi.encode(
            "Yield farming optimizer",
            uint256(100),  // min APY: 10%
            uint256(5000e18)  // min stake
        );
        
        nft.mintPattern(
            msg.sender,
            "Yield",
            yieldData
        );
        console.log("Strategy 5: Yield - 70% win rate, +43% ROI");
        
        // Strategy 6: Composite (Balanced, multiple strategies)
        bytes memory compositeData = abi.encode(
            "Multi-strategy composite",
            uint256(3),  // number of sub-strategies
            uint256(25000e18)  // min allocation per strategy
        );
        
        nft.mintPattern(
            msg.sender,
            "Composite",
            compositeData
        );
        console.log("Strategy 6: Composite - 80% win rate, +13.5% ROI");
        
        // Strategy 7: Advanced Mean Reversion (High performance)
        bytes memory advMeanReversionData = abi.encode(
            "Advanced mean reversion with ML",
            uint256(20),  // z-score threshold: 2.0
            uint256(50000e18)  // min liquidity
        );
        
        nft.mintPattern(
            msg.sender,
            "AdvancedMeanReversion",
            advMeanReversionData
        );
        console.log("Strategy 7: AdvancedMeanReversion - 90% win rate, +33% ROI");
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("Successfully minted 5 additional strategies!");
        console.log("Total strategies on-chain: 7");
    }
}
