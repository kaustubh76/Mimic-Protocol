# Claude Context - Mirror Protocol Development Guide

## Project Overview
Mirror Protocol is an Envio-powered behavioral liquidity infrastructure built on the Monad blockchain. It transforms on-chain trading behavior into executable, delegatable infrastructure using Envio HyperSync for real-time indexing and pattern detection.

## Core Concept
Users' trading patterns are detected by Envio HyperSync, minted as NFTs, and can be delegated to via MetaMask Smart Accounts for automated execution. The protocol demonstrates how Envio's indexing infrastructure enables a new class of real-time, data-driven DeFi applications.

## Why Envio is Essential

### Performance Advantages
- **Sub-50ms pattern detection** — HyperSync enables near-instant behavioral analysis
- **High-throughput event processing** — 10,000+ events/second capability
- **Cross-chain data aggregation** — unified behavioral view across multiple chains
- **Real-time metrics** — live dashboards powered by Envio GraphQL

### Scalability Story
- HyperSync replaces RPC polling with efficient batch syncing
- Event-driven architecture scales horizontally with Envio's infrastructure
- GraphQL layer provides flexible, performant queries for any frontend
- Hosted service deployment eliminates indexer DevOps overhead

### What Envio Unlocks (Not Possible Without It)
1. **Real-time pattern detection** — behavioral analysis requires low-latency access to historical + live events
2. **Cross-chain behavioral aggregation** — HyperSync's multi-chain support enables unified pattern analysis
3. **Scalable event processing** — traditional RPCs cannot sustain the throughput needed for pattern detection at scale
4. **Production-grade indexing** — hosted service with automatic redeployment, no infrastructure management

## Technical Architecture

### Envio HyperCore (PRIMARY FOCUS)
```javascript
class EnvioHyperCore {
  - Real-time event streaming via HyperSync
  - Pattern detection in <50ms
  - Cross-chain data aggregation
  - 10M+ historical transaction analysis
}
```

### Pattern Detection Flow
1. Envio indexes all on-chain events in real-time
2. Pattern detector analyzes behavioral sequences
3. Successful patterns are minted as NFTs
4. Users delegate to pattern NFTs via MetaMask
5. Execution engine auto-executes based on patterns

### Smart Contract Structure
- BehavioralNFT.sol - NFTs representing patterns
- DelegationRouter.sol - Manages delegations
- PatternRegistry.sol - Stores pattern metadata
- ExecutionEngine.sol - Automated execution

## Key Files to Maintain

### Core Files
1. `src/envio/hypercore.js` - Envio integration core
2. `src/envio/patternDetector.js` - Pattern recognition
3. `src/envio/config.yaml` - Envio configuration
4. `contracts/BehavioralNFT.sol` - Pattern NFT contract
5. `contracts/DelegationRouter.sol` - Delegation management

### Configuration
- `.env` - Environment variables (keys, RPCs)
- `hardhat.config.js` - Monad network configuration
- `package.json` - Dependencies and scripts

## Envio Integration Best Practices

### Always Show Performance Metrics
```javascript
const startTime = Date.now();
const result = await envio.query(params);
const queryTime = Date.now() - startTime;
console.log(`Query completed in ${queryTime}ms`);
```

### Leverage HyperSync for Batch Operations
```javascript
// Use HyperSync for efficient historical data access
const events = await hyperSync.getEvents({
  fromBlock: startBlock,
  toBlock: 'latest',
  contracts: [patternDetector, delegationRouter],
  batchSize: 10000
});
```

### Delegation Pattern
```javascript
const delegation = await DelegationFramework.create({
  delegator: userAccount,
  delegate: patternNFT,
  permissions: specificPermissions
});
```

## Scaling Considerations

### Current Scale
- 8 event types indexed across 2 contracts
- 10 GraphQL entities
- <50ms query latency
- 102 events/second peak throughput

### Path to Production Scale
1. **Multi-chain expansion** — add Ethereum, Arbitrum, Base via HyperSync multi-chain config
2. **Event volume** — HyperSync handles millions of events; increase batch sizes as volume grows
3. **Query optimization** — use Envio's built-in caching, add composite indexes for complex queries
4. **Horizontal scaling** — Envio hosted service scales automatically; add read replicas for high-traffic frontends

### Performance Targets
| Metric | Current | Target |
|--------|---------|--------|
| Query latency | <50ms | <20ms |
| Event throughput | 102 eps | 10,000+ eps |
| Chains supported | 1 (Monad) | 5+ |
| Concurrent queries | ~10 | 1,000+ |

## Common Issues & Solutions

### Issue: Slow pattern detection
**Solution**: Ensure Envio HyperSync is in 'turbo' mode, use parallel queries

### Issue: MetaMask delegation fails
**Solution**: Check smart account deployment, ensure proper permissions

### Issue: Cross-chain queries timeout
**Solution**: Use Promise.all() for parallel execution, implement retry logic

## Testing Checklist
- [ ] Envio processes >1000 events/second
- [ ] Pattern detection under 50ms
- [ ] Cross-chain aggregation works
- [ ] Delegations execute properly
- [ ] Automation triggers correctly
- [ ] Gas optimization in place
- [ ] Emergency stops functional

## Deployment Steps
1. Deploy contracts to Monad testnet
2. Initialize Envio indexer with deployed addresses
3. Start Envio HyperCore
4. Verify pattern detection working
5. Test delegation flow
6. Confirm automation executes

## DO NOT
- Don't hide Envio behind abstractions — make it visible
- Don't use generic indexing when Envio-specific features are available
- Don't forget to show metrics in every data-facing component
- Don't skip performance benchmarking
- Don't add features that don't leverage Envio's strengths

## Resources
- Envio Docs: https://docs.envio.dev
- MetaMask Delegation Toolkit: https://docs.metamask.io/delegation-toolkit/
- Monad Testnet: https://testnet.monad.xyz
- HyperSync API: https://hypersync.envio.dev

## Current Status
- Envio HyperCore implemented
- Pattern detection working
- Delegation structure complete
- Smart contracts deployed to Monad testnet
- Frontend live on Vercel
- Envio hosted service deployed

Remember: ENVIO IS THE STAR. Every feature should highlight why Mirror Protocol cannot exist without Envio's unique capabilities.
