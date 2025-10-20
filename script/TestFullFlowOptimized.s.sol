// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/BehavioralNFT.sol";
import "../contracts/DelegationRouter.sol";
import "../contracts/ExecutionEngine.sol";

contract TestFullFlowOptimized is Script {
    address constant NFT_ADDR = 0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc;
    address constant ROUTER_ADDR = 0x56C145f5567f8DB77533c825cf4205F1427c5517;
    address constant ENGINE_ADDR = 0xBbBE055f281Ef5d3F6004E0eE2A8447be26e6287;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("==========================================");
        console.log("OPTIMIZED END-TO-END TEST");
        console.log("==========================================");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        BehavioralNFT nft = BehavioralNFT(NFT_ADDR);
        DelegationRouter router = DelegationRouter(ROUTER_ADDR);
        ExecutionEngine engine = ExecutionEngine(ENGINE_ADDR);

        console.log("1. Minting pattern...");
        uint256 tokenId = nft.mintPattern(deployer, "OptimizedTest", "");
        console.log("   Token ID:", tokenId);

        console.log("2. Creating delegation...");
        uint256 delegationId = router.createSimpleDelegation(tokenId, 5000, deployer);
        console.log("   Delegation ID:", delegationId);

        console.log("3. Executing trade...");
        ExecutionEngine.TradeParams memory params = ExecutionEngine.TradeParams({
            delegationId: delegationId,
            token: address(0x1111111111111111111111111111111111111111),
            amount: 1 ether,
            targetContract: address(0x2222222222222222222222222222222222222222),
            callData: ""
        });

        ExecutionEngine.PerformanceMetrics memory metrics = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 8500,
            currentROI: 1500,
            currentVolume: 1 ether,
            lastUpdated: block.timestamp
        });

        engine.executeTrade(params, metrics);
        console.log("   Trade executed!");

        vm.stopBroadcast();

        console.log("==========================================");
        console.log("SUCCESS! ExecutionEngine now has interactions!");
        console.log("Total operations: 3 (all in 1 tx)");
    }
}
