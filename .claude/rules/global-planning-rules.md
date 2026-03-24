# Global Planning Rules - Mirror Protocol

## Core Development Philosophy

### Three-Phase Workflow
Every feature/task MUST go through:
1. **PLAN** — Architectural design and approach
2. **VALIDATE** — Review plan against requirements
3. **IMPLEMENT** — Actual coding with validation checkpoints

### Critical Requirements (NEVER SKIP)

#### 1. Envio-First Thinking
- Every feature must demonstrate WHY Envio is essential
- Always include performance metrics (latency, throughput)
- Show comparative advantages over traditional indexing solutions
- Implement real-time monitoring and metrics display
- Design for horizontal scale from the start

#### 2. Scalability Focus
Before ANY implementation, verify:
- Does this leverage Envio HyperSync effectively?
- Can this handle 10x current event volume without architecture changes?
- Is the data model optimized for the query patterns we need?
- Are we using Envio's hosted service capabilities fully?

#### 3. Technical Stack Compliance
- Monad Testnet: Chain ID 10143
- MetaMask Delegation Toolkit (not generic delegation)
- Envio HyperSync for all indexing
- Smart contracts in Solidity 0.8.20+

## Planning Standards

### Step 1: Requirements Gathering
```markdown
**User Request**: [Original request]
**Interpreted Goal**: [What we understand]
**Success Criteria**: [How we measure completion]
**Envio Requirement**: [Why Envio is essential here]
**Scale Consideration**: [How this scales to production]
```

### Step 2: Architectural Planning
- Draw component interactions
- Identify data flows
- Define contract interfaces
- Plan Envio event subscriptions
- Map delegation flows

### Step 3: Risk Assessment
- Gas optimization concerns
- Security vulnerabilities
- Performance bottlenecks
- Integration complexity
- Scalability limits

### Step 4: Implementation Breakdown
- Break into < 200 LOC chunks
- Define validation points
- Set measurable milestones
- Assign priority levels

## Validation Standards

### Code Review Checklist
- [ ] Envio integration is optimal (not just present)
- [ ] Performance metrics are displayed
- [ ] MetaMask SDK used correctly
- [ ] Gas optimization implemented
- [ ] Security best practices followed
- [ ] Error handling comprehensive
- [ ] Tests cover edge cases
- [ ] Documentation is clear

### Performance Requirements
- Pattern detection: < 50ms
- Event processing: > 1000 events/sec
- Cross-chain queries: Parallel execution
- Frontend response: < 200ms

### Security Requirements
- Multi-sig on critical functions
- Spending limits per delegation
- Emergency stop mechanisms
- Input validation everywhere
- Reentrancy protection

## Implementation Standards

### Code Structure
```
contracts/          # Smart contracts (Solidity)
src/envio/          # Envio integration (CRITICAL)
src/delegations/    # MetaMask delegation logic
src/patterns/       # Pattern detection algorithms
src/api/           # REST API endpoints
scripts/           # Deployment & utilities
test/              # Comprehensive tests
```

### Commit Standards
- Prefix: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`
- Reference: Link to planning doc/issue
- Metrics: Include performance improvements

### Testing Requirements
- Unit tests: 80%+ coverage
- Integration tests: All critical paths
- Performance tests: Envio benchmarks
- E2E tests: Full user flows

## Development Workflow

### 1. Feature Request
```bash
/plan <feature-description>
# Generates comprehensive plan
```

### 2. Plan Review
```bash
/validate-plan
# Reviews against requirements
```

### 3. Implementation
```bash
/implement <component>
# Guided implementation
```

### 4. Code Review
```bash
/validate-code
# Security, performance, standards
```

### 5. Testing
```bash
/test <component>
# Runs appropriate tests
```

### 6. Integration
```bash
/integrate
# Ensures compatibility
```

## Do's and Don'ts

### DO
- Start with WHY (especially for Envio)
- Show metrics constantly
- Think cross-chain from day 1
- Design for scale
- Document performance wins
- Plan before coding
- Validate at every step

### DON'T
- Skip planning phase
- Add generic features that don't leverage Envio
- Hide Envio behind abstractions
- Forget gas optimization
- Ignore security
- Code without tests
- Deploy without validation

## Priority Framework

### P0 (Critical — Core Infrastructure)
- Envio HyperCore integration
- Pattern detection < 50ms
- MetaMask delegations working
- Monad deployment successful

### P1 (Important — Scale & Differentiation)
- Cross-chain aggregation
- Multi-layer delegations
- Real-time metrics dashboard
- Performance benchmarks
- Horizontal scaling support

### P2 (Nice to Have — Polish)
- Advanced UI features
- Additional pattern types
- Social features
- Extended documentation

### P3 (Future — Production Roadmap)
- Mainnet deployment
- Additional chains (Ethereum, Arbitrum, Base)
- Advanced analytics
- Mobile app
- SDK for third-party integrations

## Communication Standards

### Status Updates Format
```
Current: [What we're working on]
Completed: [What's done]
In Progress: [Active tasks]
Next: [Up next]
Blockers: [Issues]
Metrics: [Performance data]
```

### Documentation Standards
- Every contract: NatSpec comments
- Every function: Purpose, params, returns
- Every API: OpenAPI/Swagger docs
- Every component: Architecture diagram

## Emergency Protocols

### If Stuck (> 30 min)
1. Document the blocker
2. Try alternative approach
3. Consult resources (Envio docs, MetaMask docs)
4. Ask for help with context
5. Pivot if necessary

### If Requirements Change
1. Stop implementation
2. Re-run planning phase
3. Validate new approach
4. Update documentation
5. Resume with new plan

### If Performance Issues
1. Profile with metrics
2. Identify bottleneck
3. Check Envio optimization
4. Review algorithm complexity
5. Implement caching if needed

## Key Resources

- **Envio Docs**: https://docs.envio.dev
- **HyperSync API**: https://hypersync.envio.dev
- **MetaMask Delegation**: https://docs.metamask.io/delegation-toolkit/
- **Monad Testnet**: https://testnet.monad.xyz
- **Project Context**: CLAUDE.md

## Success Metrics

### Technical Excellence
- Sub-50ms pattern detection
- 10,000+ events/second capability
- Cross-chain aggregation
- Gas-optimized contracts

### Scalability
- Multi-chain ready architecture
- Horizontal scaling support
- Production-grade error handling
- Automated deployment pipeline

### Innovation
- Novel delegation structure (NFT-based)
- Unique Envio usage (behavioral indexing)
- Practical automation value
- Scalable architecture

---

**Remember**: Quality > Quantity. One well-executed feature beats ten half-baked ones.
