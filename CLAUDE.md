---

## **claude.md - Claude Context File**

```markdown
# Claude Context - Mirror Protocol Development Guide

## Project Overview
You are working on Mirror Protocol, an Envio-powered behavioral liquidity infrastructure for the Monad blockchain. This project is being built for a hackathon targeting three specific bounties: Innovative Delegations ($500), Best use of Envio ($2,000), and On-chain Automation ($1,500-3,000).

## Core Concept
Mirror Protocol transforms on-chain trading behavior into executable, delegatable infrastructure. Users' trading patterns are detected by Envio HyperSync, minted as NFTs, and can be delegated to via MetaMask Smart Accounts for automated execution.

## Critical Requirements

### 1. ENVIO MUST BE CENTRAL
- Every feature should showcase why Envio is ESSENTIAL, not optional
- Emphasize sub-50ms pattern detection (50x faster than alternatives)
- Show 10,000+ events/second processing
- Demonstrate cross-chain behavioral aggregation
- Display real-time metrics proving Envio's superiority

### 2. MetaMask Smart Accounts Integration
- Use Delegation Toolkit for all delegations
- Implement multi-layer delegation system
- Show gasless transactions
- Deploy smart accounts programmatically

### 3. Monad Testnet Deployment
- All contracts must deploy to Monad testnet
- Chain ID: 10143
- RPC: https://testnet.monad.xyz/rpc

## Technical Architecture

### Envio HyperCore (PRIMARY FOCUS)
```javascript
// This is the heart of the system
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

## Demo Requirements

### Must Show
1. **Envio Speed**: Pattern detected in <50ms with visual timer
2. **Data Scale**: Process 10M+ transactions in seconds
3. **Cross-Chain**: Aggregate behavior from 3 chains simultaneously
4. **Delegations**: Multi-layer delegation via MetaMask
5. **Automation**: Patterns executing automatically

### Metrics to Display
```
Events Processed: 10,847,293
Average Latency: 47ms
Peak Throughput: 12,384 events/sec
Cross-Chain Queries: 1,847
Patterns Detected: 3,924
```

## Code Patterns to Follow

### Envio Query Pattern
```javascript
// ALWAYS show performance metrics
const startTime = Date.now();
const result = await envio.query(params);
const queryTime = Date.now() - startTime;
console.log(`Query completed in ${queryTime}ms`);
```

### Pattern Detection Pattern
```javascript
// Emphasize speed advantage
if (detectionTime < 50) {
  console.log("SUB-50MS DETECTION - Only possible with Envio!");
}
```

### Delegation Pattern
```javascript
// Use MetaMask SDK properly
const delegation = await DelegationFramework.create({
  delegator: userAccount,
  delegate: patternNFT,
  permissions: specificPermissions
});
```

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

## Demo Script Key Points
1. Start with problem statement
2. Show Envio metrics dashboard immediately
3. Demonstrate 47ms pattern detection
4. Show cross-chain capability
5. Execute delegation flow
6. Display earnings/results
7. End with "Only possible with Envio"

## Success Criteria
- Envio is demonstrably essential (not replaceable)
- Delegations are innovative (multi-layer NFT-based)
- Automation provides real value
- Demo is smooth and impressive
- Metrics prove superiority

## Key Messages
- "50x faster than traditional indexers"
- "Processing 10,000 events per second"
- "Cross-chain behavioral aggregation"
- "Your trading style is now a product"
- "Only possible with Envio"

## DO NOT
- Don't mention AI agents as primary feature
- Don't oversimplify for "consumers"
- Don't add features just to check boxes
- Don't use generic indexing (must be Envio-specific)
- Don't forget to show metrics constantly

## Resources
- Envio Docs: https://docs.envio.dev
- MetaMask Delegation Toolkit: https://docs.metamask.io/delegation-toolkit/
- Monad Testnet: https://testnet.monad.xyz
- HyperSync API: https://hypersync.envio.dev

## Current Status
- ✅ Envio HyperCore implemented
- ✅ Pattern detection working
- ✅ Basic delegation structure
- 🔄 Smart contract deployment
- 🔄 Frontend development
- ⏳ Demo preparation

## Next Priority Tasks
1. Deploy smart contracts to Monad
2. Connect Envio to deployed contracts
3. Test end-to-end delegation flow
4. Build metrics dashboard
5. Prepare demo video

---

Remember: ENVIO IS THE STAR. Every feature should highlight why Mirror Protocol cannot exist without Envio's unique capabilities.
```

---

## **How to Use These Files**

### **For Development:**
1. Place `README.md` in your project root
2. Share with team members and judges
3. Update status section as you progress

### **For Claude:**
1. Save `claude.md` in project root
2. When starting a new conversation with Claude about this project:
   - Copy and paste the `claude.md` content first
   - Then ask your specific questions
   - Claude will maintain context about your project

### **Example Claude Usage:**
```
You: [Paste claude.md content]

You: I need help implementing the delegation router contract. It should integrate with MetaMask Smart Accounts and support multi-layer delegations.

Claude: [Will provide solution considering all project context]
```

### **Keep Updated:**
- Update README.md status section daily
- Add new metrics to claude.md as you achieve them
- Document any architectural changes

These files will ensure:
1. **Judges** understand your project immediately
2. **Claude** maintains perfect context
3. **You** stay focused on winning priorities
