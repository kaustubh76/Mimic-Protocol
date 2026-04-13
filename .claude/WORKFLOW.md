# Mirror Protocol - Development Workflow Guide

## 🎯 Overview

This guide explains the structured development workflow for Mirror Protocol. Following this workflow ensures high-quality, validated, and production-ready code.

## 📋 Quick Reference

### Slash Commands
| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/status` | Project status report | Start of day, before standup |
| `/plan <feature>` | Create implementation plan | Before any new feature |
| `/validate-plan` | Review plan quality | After creating plan |
| `/implement <component>` | Guided implementation | After plan approval |
| `/validate-code` | Code review & security audit | After implementation |
| `/review-demo` | Demo optimization | Before release or presentation |

### Workflow Phases
```
PLAN → VALIDATE → IMPLEMENT → VALIDATE → INTEGRATE → TEST → DEMO
```

## 🚀 Getting Started

### 1. Daily Kickoff
Every work session should start with:

```bash
/status
```

This gives you:
- Current project state
- Goal alignment
- Blockers to address
- Priority tasks

**Example**:
```
You: /status

Claude: [Generates comprehensive status report]
- Envio integration: 60% complete
- P0 Task: Complete pattern detection
- Blocker: Need Sepolia testnet ETH
```

## 📝 Feature Development Workflow

### Step 1: Planning (15-30 min)

**When**: Before implementing ANY new feature

**Command**: `/plan <feature description>`

**Example**:
```
You: /plan Pattern detection system that uses Envio HyperSync
to identify successful trading patterns in under 50ms

Claude: [Creates comprehensive plan including]
- Requirements analysis
- Architecture diagrams
- Envio integration strategy
- Implementation phases
- Risk assessment
- Performance targets
```

**What You Get**:
- Detailed technical specification
- Component breakdown
- Integration points
- Success criteria
- Risk mitigation strategies

**Output**: `plans/[feature-name]-plan.md` (save for reference)

### Step 2: Plan Validation (5-10 min)

**When**: Immediately after planning

**Command**: `/validate-plan`

**Example**:
```
You: /validate-plan

Claude: [Reviews plan against standards]
- Completeness: 9/10 ✅
- Goal Alignment: 27/30 ✅
- Technical Quality: 25/30 🟡
- Overall: 85/100 (A) - Minor revisions suggested
```

**Possible Outcomes**:
- ✅ **Approved (80+)**: Proceed to implementation
- 🟡 **Revisions Needed (60-79)**: Address issues and revalidate
- 🔴 **Rejected (<60)**: Major rework required

**Decision Point**: Only proceed to implementation if score > 80

### Step 3: Implementation (60-80% of time)

**When**: After plan approval

**Command**: `/implement <component>`

**Example**:
```
You: /implement Pattern Detector

Claude: [Guided implementation following plan]
- Creates file structure
- Implements core functionality
- Adds error handling
- Includes performance monitoring
- Writes tests
- Documents code
```

**During Implementation**:
- Follow the approved plan
- Include performance monitoring
- Handle errors comprehensively
- Write tests alongside code
- Document as you go

**Best Practices**:
```javascript
// ✅ DO: Include performance tracking
const startTime = Date.now();
const result = await envio.query(params);
const latency = Date.now() - startTime;
console.log(`Query completed in ${latency}ms`);
if (latency < 50) {
  console.log("🚀 SUB-50MS - Only possible with Envio!");
}

// ✅ DO: Comprehensive error handling
try {
  await operation();
} catch (error) {
  logger.error('operation_failed', { error, context });
  throw new Error(`Operation failed: ${error.message}`);
}

// ❌ DON'T: Skip documentation
// Bad: function foo(x) { return x * 2; }

// ✅ DO: Document everything
/**
 * @notice Doubles the input value
 * @param x Value to double
 * @return Doubled value
 */
function foo(uint256 x) external pure returns (uint256) {
  return x * 2;
}
```

### Step 4: Code Validation (10-20 min)

**When**: After implementation

**Command**: `/validate-code`

**Example**:
```
You: /validate-code

Claude: [Comprehensive code review]
- Security: 18/20 ✅
- Performance: 17/20 ✅
- Code Quality: 16/20 ✅
- Integration: 19/20 ✅
- Testing: 15/20 🟡
- Overall: 85/100 (A) - Minor test improvements needed
```

**Validation Checks**:
- 🔒 Security vulnerabilities
- ⚡ Performance optimization
- 📐 Code quality standards
- 🔗 Integration correctness
- 🧪 Test coverage

**Possible Outcomes**:
- ✅ **Approved (85+)**: Ready for integration
- 🟡 **Fix & Revalidate (70-84)**: Minor fixes needed
- 🔴 **Rejected (<70)**: Significant rework required

**Common Issues**:
```javascript
// 🔴 BLOCKER: Reentrancy vulnerability
function withdraw() external {
  // ❌ External call before state change
  (bool success, ) = msg.sender.call{value: balance}("");
  balance = 0; // Too late!
}

// ✅ FIX: State change before external call
function withdraw() external nonReentrant {
  uint256 amount = balance;
  balance = 0; // State change first
  (bool success, ) = msg.sender.call{value: amount}("");
  require(success, "Transfer failed");
}
```

### Step 5: Integration & Testing (10-15% of time)

**After validation approval**:

```bash
# Compile
npm run compile

# Run tests
npm test

# Check coverage
npm run coverage

# Performance tests (for Envio components)
npm run test:envio

# Integration tests
npm run test:integration
```

**Success Criteria**:
- ✅ All tests pass
- ✅ Coverage > 80%
- ✅ No security warnings
- ✅ Performance targets met
- ✅ Integration working

## 🎬 Pre-Demo Preparation

### Demo Review (30-60 min before submission)

**Command**: `/review-demo`

**Example**:
```
You: /review-demo

Claude: [Comprehensive demo review]
- First Impression: 8/10 ✅
- Envio Showcase: 9/10 ✅
- Delegation Innovation: 7/10 🟡
- Overall: 82/100 (B+)
- Suggestions: [Specific improvements]
```

**What Gets Reviewed**:
- Demo flow and timing
- Metrics visibility
- Goal alignment
- Technical depth
- User experience
- Narrative clarity
- Memorability

**Optimization Focus**:
1. First 30 seconds (make a strong first impression)
2. Envio superiority (prove it's essential)
3. Metrics display (numbers demonstrate value)
4. Smooth execution (no bugs)

## 🎯 Example: Complete Feature Development

Let's walk through developing the **Pattern Detection System**:

### Day 1 Morning: Planning

```
You: /status

Response:
- Smart contracts: 75% complete
- Envio integration: 0% complete ⚠️
- Next P0: Pattern detection system

You: /plan Pattern detection system using Envio HyperSync to
identify successful trading patterns (win rate >70%) in under
50ms. Should analyze swap events across DEXs and detect patterns
like momentum trading, mean reversion, etc.

Response: [Creates comprehensive plan]
- Architecture diagram
- Envio event subscriptions
- Pattern recognition algorithm
- Performance targets: <50ms, >1000 events/sec
- Security considerations
- Testing strategy
- 4 implementation phases

You: /validate-plan

Response:
- Score: 88/100 (A)
- ✅ Approved - proceed with implementation
- Minor suggestion: Add more error handling details
```

### Day 1 Afternoon: Implementation Phase 1

```
You: /implement Pattern Detector Core

Response: [Implements]
- src/envio/patternDetector.js
- src/patterns/patternTypes.js
- test/patternDetector.test.js
- Includes performance monitoring
- Error handling
- Comprehensive tests

You: /validate-code

Response:
- Score: 83/100 (B+)
- 🟡 Fix: Add input validation (Line 42)
- 🟡 Improve: Test coverage 75% (target 80%)

You: [Fix issues]

You: /validate-code

Response:
- Score: 91/100 (A+)
- ✅ Approved - ready for integration
```

### Day 1 Evening: Testing

```bash
npm test
# All tests pass ✅

npm run test:envio
# Pattern detection: 47ms ✅ (Target: <50ms)
# Events processed: 1,247/sec ✅ (Target: >1000/sec)
```

### Day 2: Integration

Integrate with other components, deploy to testnet, verify end-to-end.

### Day 3: Demo Prep

```
You: /review-demo

Response:
- Overall: 85/100 (A)
- Strengths: Metrics clear, performance impressive
- Improvements: Add comparison to traditional indexer
- Quick wins: [Specific suggestions]

You: [Implement improvements]

You: /review-demo

Response:
- Overall: 93/100 (A+)
- Demo ready ✅
- Confidence: 85% (strong Envio integration)
```

## 📊 Quality Gates

Don't skip these checkpoints:

### Gate 1: Plan Approval
❌ **Block** implementation if plan score < 80

### Gate 2: Code Approval
❌ **Block** integration if code score < 85

### Gate 3: Test Pass
❌ **Block** deployment if:
- Tests fail
- Coverage < 80%
- Performance targets not met

### Gate 4: Demo Ready
❌ **Block** release if demo score < 80

## 🚨 Emergency Protocols

### If Stuck (>30 min on same issue)

```
You: I've been stuck on [issue] for 30 minutes

1. /status - Check if this is P0
2. If P0: Ask for help
3. If P1/P2: Pivot to different task
4. Document blocker for later
```

### If Behind Schedule

```
You: /status

Response: 🔴 Behind schedule - 3 days until deadline

Actions:
1. Scope reduction: Cut P2 features
2. Focus on demo impact over perfection
3. Prioritize working demo over polish
4. Get help on blockers immediately
```

### If Demo Breaks

```
Pre-recorded backup plan:
1. Record demo when working
2. Keep as backup
3. If live fails, show recording
4. Always have plan B
```

## 💡 Pro Tips

### 1. Plan in the Morning, Code in the Afternoon
Planning when fresh leads to better decisions.

### 2. Validate Early, Validate Often
Catching issues in validation is 10x faster than debugging later.

### 3. Metrics Tell the Story
Numbers demonstrate value more than words.

### 4. Security Can't Be Added Later
Design for security from the start.

### 5. Demo First, Features Second
If it's not in the demo, it doesn't exist to users.

### 6. Document While Fresh
Document immediately after implementation, not later.

### 7. Test One Thing at a Time
Easier to debug when you know what changed.

### 8. Performance Monitoring is Marketing
Your metrics prove Envio's value.

## 📈 Success Metrics

Track these throughout development:

### Technical Metrics
- [ ] Pattern detection < 50ms
- [ ] Event processing > 1000/sec
- [ ] Test coverage > 80%
- [ ] Zero critical security issues
- [ ] All integration tests passing

### Goal Alignment
- [ ] Envio demonstrably essential
- [ ] Novel delegation approach
- [ ] Automation value clear
- [ ] Demo scoring > 85/100

### Process Metrics
- [ ] Plans validated before implementation
- [ ] Code validated before integration
- [ ] No quality gate skipped
- [ ] Documentation complete

## 🎓 Learning from Validation

Validation feedback is teaching you:

### Common Feedback → Fix
"Envio not essential" → Show why traditional indexers can't do this
"Missing error handling" → Add try/catch with specific error types
"Gas not optimized" → Use storage efficiently, optimize loops
"Tests incomplete" → Add edge cases, error cases, performance cases

## 🔄 Iteration Loop

```
Plan → Validate → Implement → Validate → Test
                    ↑                      |
                    └──────────────────────┘
                         (If issues found)
```

Never skip back to implementation without validation if major changes needed.

## ✅ Final Pre-Release Checklist

```markdown
### Code Quality
- [ ] All plans validated (>80)
- [ ] All code validated (>85)
- [ ] All tests passing
- [ ] No TODOs in code
- [ ] No console.logs in production

### Functionality
- [ ] Pattern detection working
- [ ] Delegations working
- [ ] Automation working
- [ ] Metrics displaying
- [ ] No critical bugs

### Demo
- [ ] Demo rehearsed
- [ ] Demo scoring > 85
- [ ] All metrics real (not mocked)
- [ ] Under 5 minutes

### Deployment
- [ ] Deployed to Ethereum Sepolia
- [ ] Smart contracts verified
- [ ] Frontend accessible
- [ ] API working
- [ ] No deployment errors

### Documentation
- [ ] README complete
- [ ] Code documented
- [ ] Architecture diagram included
- [ ] Demo script ready

### Release
- [ ] GitHub repo public
- [ ] All links working
```

## 🎯 Remember

> "Perfect is the enemy of good, but good is the enemy of crap."

- Quality gates prevent crap
- Iteration achieves good
- Don't waste time chasing perfect

**Now go ship it!**

---

## Quick Start

New feature? Run this:
```
/status → /plan <feature> → /validate-plan → /implement <component> → /validate-code → test → integrate
```

Ready for demo? Run this:
```
/review-demo → fix issues → /review-demo → submit
```

**Questions?** Check:
1. CLAUDE.md - Project context
2. .claude/rules/global-planning-rules.md - Standards
3. This file - Workflow
