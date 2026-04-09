# Envio Automation Implementation Plan

## Problem Statement

Mirror Protocol claims Envio drives real-time automation, but the audit reveals:

1. **Executor bot** (`executor-bot/bot.mjs`) hardcodes a 70% win rate threshold (line 229) instead of using per-delegation conditions
2. **Pattern metrics** are read from chain via `readContract` (lines 206-211) instead of from Envio GraphQL
3. **Pattern detection** is 100% manual — only Foundry scripts call `PatternDetector.validateAndMintPattern()`
4. **No feedback loop** — Envio indexes events but nothing reads that data to drive execution decisions
5. **Polling-only** — 15-second blind timer, not event-reactive

**After this plan:** Envio becomes the single source of truth. The bot cannot execute without Envio data. A new pattern service auto-detects and mints patterns from Envio-indexed trade history. The system creates a genuine Envio → Execute → Envio → Detect → Mint → Envio feedback loop.

---

## Phase 1: Bot Uses Envio for ALL Execution Decisions

**Impact:** Highest | **Files:** `executor-bot/bot.mjs`

### Step 1.1: Expand GraphQL Query with Pattern Join

**File:** `executor-bot/bot.mjs` — function `fetchActiveDelegations()` (line 137)

**Current query (line 138-151):**
```graphql
query GetActiveDelegations {
  Delegation(where: {isActive: {_eq: true}}, order_by: {createdAt: asc}) {
    id delegationId delegator patternTokenId
    percentageAllocation smartAccountAddress
    successRate totalExecutions totalAmountTraded
  }
}
```

**Change to:**
```graphql
query GetActiveDelegations {
  Delegation(where: {isActive: {_eq: true}}, order_by: {createdAt: asc}) {
    id delegationId delegator patternTokenId
    percentageAllocation smartAccountAddress
    successRate totalExecutions totalAmountTraded
    pattern {
      tokenId winRate roi totalVolume isActive patternType
    }
  }
}
```

**Why:** Single sub-50ms GraphQL query replaces N+1 on-chain `readContract` calls. This is the core Envio value proposition — aggregated relational data in one roundtrip.

---

### Step 1.2: Remove On-Chain Pattern Reads

**File:** `executor-bot/bot.mjs` — function `processExecution()` (lines 203-221)

**Delete this entire block:**
```javascript
// Get pattern metrics from chain (lines 203-221)
let patternMetrics;
try {
  const raw = await publicClient.readContract({
    address: CONTRACTS.BEHAVIORAL_NFT,
    abi: BEHAVIORAL_NFT_ABI,
    functionName: 'patterns',
    args: [patternId],
  });
  patternMetrics = {
    winRate: raw[4], roi: raw[6], totalVolume: raw[5], isActive: raw[7],
  };
} catch {
  patternMetrics = { winRate: 7500n, roi: 1000n, totalVolume: 0n, isActive: true };
}
```

**Replace with:**
```javascript
// Get pattern metrics from Envio (already in delegation response)
const envioPattern = delegation.pattern;
if (!envioPattern) {
  console.log(`  [ENVIO→SKIP] Delegation #${delegationId}: pattern not indexed yet`);
  return;
}
const patternMetrics = {
  winRate: BigInt(envioPattern.winRate || 0),
  roi: BigInt(envioPattern.roi || 0),
  totalVolume: BigInt(envioPattern.totalVolume || 0),
  isActive: envioPattern.isActive,
};
```

---

### Step 1.3: Per-Delegation Condition Validation

**File:** `executor-bot/bot.mjs`

**Add after CONTRACTS declaration (~line 61):**
```javascript
// ─── Delegation Conditions Cache ────────────────────────────────────────────
const conditionsCache = new Map();

const DELEGATION_ROUTER_CONDITIONS_ABI = [{
  name: 'getDelegationConditions',
  type: 'function',
  inputs: [{ name: 'delegationId', type: 'uint256' }],
  outputs: [
    { name: 'minWinRate', type: 'uint256' },
    { name: 'minROI', type: 'int256' },
    { name: 'minVolume', type: 'uint256' },
    { name: 'isActive', type: 'bool' },
  ],
  stateMutability: 'view',
}];

async function getDelegationConditions(delegationId, publicClient) {
  const key = delegationId.toString();
  if (conditionsCache.has(key)) return conditionsCache.get(key);

  try {
    const [minWinRate, minROI, minVolume, isActive] = await publicClient.readContract({
      address: CONTRACTS.DELEGATION_ROUTER,
      abi: DELEGATION_ROUTER_CONDITIONS_ABI,
      functionName: 'getDelegationConditions',
      args: [delegationId],
    });
    const conditions = { minWinRate, minROI, minVolume, isActive };
    conditionsCache.set(key, conditions);
    return conditions;
  } catch {
    // Default: no conditions (simple delegation)
    const defaults = { minWinRate: 0n, minROI: 0n, minVolume: 0n, isActive: true };
    conditionsCache.set(key, defaults);
    return defaults;
  }
}
```

**Replace hardcoded threshold (line 228-232):**

**Current:**
```javascript
// Only execute if win rate ≥ 70% (7000 bps)
if (patternMetrics.winRate < 7000n) {
  console.log(`  ⏭️  Pattern #${patternId} winRate ${patternMetrics.winRate} < 7000 bps — skipping`);
  return;
}
```

**Change to:**
```javascript
// Validate against per-delegation conditions (from chain, cached)
const conditions = await getDelegationConditions(delegationId, publicClient);

if (conditions.minWinRate > 0n && patternMetrics.winRate < conditions.minWinRate) {
  console.log(`  [ENVIO→SKIP] Delegation #${delegationId}: pattern winRate ${patternMetrics.winRate} < minWinRate ${conditions.minWinRate}`);
  return;
}
if (conditions.minROI !== 0n && patternMetrics.roi < conditions.minROI) {
  console.log(`  [ENVIO→SKIP] Delegation #${delegationId}: pattern ROI ${patternMetrics.roi} < minROI ${conditions.minROI}`);
  return;
}
if (conditions.minVolume > 0n && patternMetrics.totalVolume < conditions.minVolume) {
  console.log(`  [ENVIO→SKIP] Delegation #${delegationId}: pattern volume ${patternMetrics.totalVolume} < minVolume ${conditions.minVolume}`);
  return;
}
```

---

### Step 1.4: Structured Envio Data Flow Logging

**File:** `executor-bot/bot.mjs` — throughout `processExecution()`

**Add after pattern validation passes:**
```javascript
console.log(`  [ENVIO→DECIDE] Delegation #${delegationId}: pattern #${patternId} (${envioPattern.patternType})`);
console.log(`    Envio metrics: winRate=${patternMetrics.winRate} roi=${patternMetrics.roi} volume=${patternMetrics.totalVolume}`);
console.log(`    Conditions: minWinRate=${conditions.minWinRate} minROI=${conditions.minROI} → EXECUTING`);
```

**After successful execution (line 270), change to:**
```javascript
console.log(`  [EXECUTE→CHAIN] Trade tx: ${hash} (${latency}ms)`);
console.log(`  [CHAIN→ENVIO] TradeExecuted event will be indexed → metrics update`);
```

---

### Step 1.5: Update Envio Endpoint

**File:** `executor-bot/bot.mjs` — line 52-53

**Change:**
```javascript
const GRAPHQL_ENDPOINT =
  ENV.ENVIO_GRAPHQL_URL || 'https://indexer.dev.hyperindex.xyz/b1106ec/v1/graphql';
```
**To (use the current live endpoint):**
```javascript
const GRAPHQL_ENDPOINT =
  ENV.ENVIO_GRAPHQL_URL || 'https://indexer.dev.hyperindex.xyz/b383f5b/v1/graphql';
```

---

### Step 1.6: Reduce Polling Interval

**File:** `executor-bot/bot.mjs` — line 318

**Change from 15s to 5s:**
```javascript
const POLL_INTERVAL_MS = 5000; // Check every 5s — Envio's sub-50ms queries make this efficient
```

---

## Phase 2: Automated Pattern Detection Service

**Impact:** High | **Files:** NEW `executor-bot/pattern-service.mjs`

### Step 2.1: Create `executor-bot/pattern-service.mjs`

A new ~250-line service that creates the detection → mint → index feedback loop.

**Core flow:**
1. Query Envio for all trade executions in last 24h
2. Query Envio for all active patterns with performance metrics
3. Analyze trade history to detect new pattern opportunities
4. Call `PatternDetector.validateAndMintPattern()` for qualifying patterns
5. Call `BehavioralNFT.updatePerformance()` for existing patterns with fresh Envio-sourced metrics
6. Sleep 5 minutes, repeat

**Envio queries used:**
```graphql
# Get recent trade data for pattern analysis
query RecentActivity($since: BigInt!) {
  TradeExecution(where: {timestamp_gt: $since, success: {_eq: true}}, order_by: {timestamp: desc}) {
    delegationId patternTokenId executor token amount timestamp
  }
  Pattern(where: {isActive: {_eq: true}}) {
    tokenId creator_id winRate roi totalVolume patternType
    totalExecutions successfulExecutions createdAt
  }
  SystemMetrics(where: {id: {_eq: "system"}}) {
    totalExecutions successfulExecutions eventsProcessed
  }
}
```

**Why Envio is essential:** Pattern detection needs aggregated historical trade data across all delegations. Without Envio, you'd need hundreds of RPC calls to reconstruct this (one per delegation, one per execution). Envio provides it in a single sub-50ms query.

**Contract ABIs needed:**
```javascript
// PatternDetector.validateAndMintPattern
{
  name: 'validateAndMintPattern',
  type: 'function',
  inputs: [{
    name: 'pattern', type: 'tuple',
    components: [
      { name: 'user', type: 'address' },
      { name: 'patternType', type: 'string' },
      { name: 'patternData', type: 'bytes' },
      { name: 'totalTrades', type: 'uint256' },
      { name: 'successfulTrades', type: 'uint256' },
      { name: 'totalVolume', type: 'uint256' },
      { name: 'totalPnL', type: 'int256' },
      { name: 'confidence', type: 'uint256' },
      { name: 'detectedAt', type: 'uint256' },
    ],
  }],
  outputs: [{ name: 'tokenId', type: 'uint256' }],
  stateMutability: 'nonpayable',
}

// PatternDetector address
0x28BEC7E4d25D385BBf5FD4d2CF5163c513662CaE
```

**Pattern detection algorithm (port from `src/envio/src/patternDetector.ts`):**
- Group trades by executor address
- Count total trades and successful trades per executor
- Calculate win rate, total volume, ROI
- If user has >= 10 trades, >= 60% win rate, >= 1 ETH volume, >= 70% confidence, and >= 7 days history → qualify for pattern minting
- Check against existing patterns (avoid duplicates)

**Logging format:**
```
[ENVIO→DETECT] Queried 47 recent trades across 5 patterns (23ms)
[DETECT→ANALYZE] Creator 0xFc46...: 20 trades, 85% win rate, 50 ETH volume
[DETECT→CHAIN] Minting new Momentum pattern for 0xFc46... (confidence: 85%)
[CHAIN→ENVIO] PatternMinted event will be indexed → available for delegation
```

### Step 2.2: Add npm script

**File:** `package.json` (root)

Add to scripts:
```json
"pattern-service": "node executor-bot/pattern-service.mjs"
```

---

## Phase 3: Enhanced Envio Schema + Handlers

**Impact:** Medium | **Files:** `src/envio/schema.graphql`, `src/envio/src/EventHandlers.ts`

### Step 3.1: Add Trend/Quality Fields to Pattern Entity

**File:** `src/envio/schema.graphql` — Pattern entity (after line 50)

Add:
```graphql
"Pattern performance trend (improving/declining/stable)"
trendDirection: String!

"Quality grade based on combined metrics (A+/A/B/C/D/F)"
qualityGrade: String!

"Consecutive positive performance updates"
consecutiveImprovements: Int!

"Consecutive negative performance updates"
consecutiveDeclines: Int!
```

### Step 3.2: Compute Derived Metrics in PatternPerformanceUpdated Handler

**File:** `src/envio/src/EventHandlers.ts` — PatternPerformanceUpdated handler (~line 205)

After updating pattern metrics, add trend detection:
```typescript
// Compute trend direction
const winRateDelta = Number(winRate) - Number(pattern.winRate);
let newConsecutiveImp = pattern.consecutiveImprovements;
let newConsecutiveDec = pattern.consecutiveDeclines;
let trendDirection = pattern.trendDirection;

if (winRateDelta > 0) {
  newConsecutiveImp++;
  newConsecutiveDec = 0;
  if (newConsecutiveImp >= 3) trendDirection = "improving";
} else if (winRateDelta < 0) {
  newConsecutiveDec++;
  newConsecutiveImp = 0;
  if (newConsecutiveDec >= 3) trendDirection = "declining";
} else {
  trendDirection = "stable";
}

// Compute quality grade
const wr = Number(winRate);
const r = Number(roi);
const qualityGrade =
  (wr >= 9000 && r >= 2000) ? "A+" :
  (wr >= 8000 && r >= 1500) ? "A" :
  (wr >= 7000 && r >= 1000) ? "B" :
  (wr >= 6000 && r >= 500)  ? "C" :
  (wr >= 5000)              ? "D" : "F";
```

Set these in the Pattern entity:
```typescript
context.Pattern.set({
  ...pattern,
  winRate, totalVolume, roi,
  trendDirection,
  qualityGrade,
  consecutiveImprovements: newConsecutiveImp,
  consecutiveDeclines: newConsecutiveDec,
  lastPerformanceUpdateAt: ts,
  lastUpdatedAt: ts,
});
```

### Step 3.3: Initialize New Fields in PatternMinted Handler

**File:** `src/envio/src/EventHandlers.ts` — PatternMinted handler (~line 100)

Add to the `context.Pattern.set()` call:
```typescript
trendDirection: "stable",
qualityGrade: "C",
consecutiveImprovements: 0,
consecutiveDeclines: 0,
```

---

## Phase 4: Wire Feedback Loop Closed

### The Complete Data Flow After Implementation

```
1. USER creates delegation via frontend
     ↓
2. ENVIO indexes DelegationCreated event (sub-50ms)
     ↓
3. EXECUTOR BOT queries Envio for active delegations + pattern metrics
   [Single GraphQL query, ~30ms, replaces N+1 RPC calls]
     ↓
4. BOT validates per-delegation conditions using Envio pattern data
   [winRate, ROI, volume from Envio — NOT hardcoded 70%]
     ↓
5. BOT calls ExecutionEngine.executeTrade() on-chain
     ↓
6. ENVIO indexes TradeExecuted event (sub-50ms)
   [Updates SystemMetrics, Delegation stats, Pattern execution counts]
     ↓
7. PATTERN SERVICE queries Envio for aggregated trade history
   [Single query: all trades, all patterns, all metrics]
     ↓
8. SERVICE detects new patterns from Envio trade data
     ↓
9. SERVICE calls PatternDetector.validateAndMintPattern()
     ↓
10. ENVIO indexes PatternMinted + PatternPerformanceUpdated events
    [Computes trendDirection, qualityGrade — derived analytics]
     ↓
11. FRONTEND displays real-time Envio data
    [Users see new patterns, create delegations → back to step 1]
```

**Without Envio:** Steps 3, 4, 7, 10 break. The bot has no aggregated data source. Pattern detection needs hundreds of RPC calls. Derived analytics don't exist.

---

## Execution Order

| # | Step | File | Est. Lines | Depends On |
|---|------|------|-----------|------------|
| 1 | Step 1.1: Expand GraphQL query | `bot.mjs:138` | ~10 | — |
| 2 | Step 1.2: Remove chain reads | `bot.mjs:203-221` | ~15 | Step 1 |
| 3 | Step 1.3: Add conditions cache + validation | `bot.mjs:61+, 228` | ~50 | Step 2 |
| 4 | Step 1.4: Structured logging | `bot.mjs` | ~15 | Step 3 |
| 5 | Step 1.5: Update endpoint | `bot.mjs:52` | ~1 | — |
| 6 | Step 1.6: Reduce poll interval | `bot.mjs:318` | ~1 | — |
| 7 | Step 2.1: Pattern service | NEW `pattern-service.mjs` | ~250 | — |
| 8 | Step 2.2: Add npm script | `package.json` | ~1 | Step 7 |
| 9 | Step 3.1: Schema fields | `schema.graphql` | ~10 | — |
| 10 | Step 3.2: Derived metrics handler | `EventHandlers.ts` | ~30 | Step 9 |
| 11 | Step 3.3: Init new fields | `EventHandlers.ts` | ~5 | Step 9 |

**Total estimated changes:** ~390 lines across 5 files

---

## Verification Checklist

- [x] `node executor-bot/bot.mjs` logs show `[ENVIO→DECIDE]` with Envio-sourced metrics
- [x] Zero `readContract` calls for pattern data in bot logs
- [x] Bot respects per-delegation minWinRate/minROI/minVolume conditions
- [x] `node executor-bot/pattern-service.mjs` queries Envio and logs trade analysis
- [x] Pattern service auto-mints patterns when thresholds met
- [x] Schema + handler changes compiled — `Pattern { qualityGrade trendDirection }` fields added
- [x] `envio codegen` succeeded — all 124 generated files compiled
- [x] Push schema + handler changes to `envio-deploy` branch — pushed commit c264b2a
- [ ] End-to-end: execute trade → Envio indexes → bot sees updated metrics next cycle
