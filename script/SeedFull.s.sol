// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/PatternDetector.sol";
import "../contracts/DelegationRouter.sol";

contract SeedFull is Script {
    address constant DETECTOR = 0x28BEC7E4d25D385BBf5FD4d2CF5163c513662CaE;
    address constant ROUTER = 0xd5499e0d781b123724dF253776Aa1EB09780AfBf;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(pk);
        vm.startBroadcast(pk);

        // Remove all limits
        PatternDetector(DETECTOR).updateCooldown(0);
        PatternDetector(DETECTOR).updateMaxPatternsPerUser(20);

        // Mint 5 new patterns with unique data
        uint256 id1 = _mint(user, "Arbitrage", "DEX-arb-v3", 22, 19, 55 ether, 6 ether, 9500, 14 days);
        uint256 id2 = _mint(user, "Momentum", "Trend-v3", 16, 13, 35 ether, 4 ether, 8500, 10 days);
        uint256 id3 = _mint(user, "MeanReversion", "Bollinger-v3", 13, 11, 28 ether, 5 ether, 8800, 12 days);
        uint256 id4 = _mint(user, "Liquidity", "LP-v3", 11, 10, 45 ether, 7 ether, 9000, 15 days);
        uint256 id5 = _mint(user, "Composite", "Multi-v3", 26, 21, 65 ether, 9 ether, 9200, 20 days);

        // Create delegations
        DelegationRouter(ROUTER).createSimpleDelegation(id1, 7500, user);
        DelegationRouter(ROUTER).createSimpleDelegation(id2, 5000, user);
        DelegationRouter(ROUTER).createSimpleDelegation(id5, 6000, user);

        // Restore limits
        PatternDetector(DETECTOR).updateCooldown(3600);
        PatternDetector(DETECTOR).updateMaxPatternsPerUser(5);

        vm.stopBroadcast();
        console.log("Done: 5 patterns, 3 delegations, limits restored");
    }

    function _mint(
        address user, string memory pType, string memory data,
        uint256 trades, uint256 wins, uint256 vol, uint256 pnl,
        uint256 conf, uint256 ago
    ) internal returns (uint256) {
        return PatternDetector(DETECTOR).validateAndMintPattern(
            PatternDetector.DetectedPattern({
                user: user,
                patternType: pType,
                patternData: abi.encode(data),
                totalTrades: trades,
                successfulTrades: wins,
                totalVolume: vol,
                totalPnL: int256(pnl),
                confidence: conf,
                detectedAt: block.timestamp - ago
            })
        );
    }
}
