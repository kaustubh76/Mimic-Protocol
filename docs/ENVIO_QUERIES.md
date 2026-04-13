# Envio GraphQL Playground — Query Reference

All queries below can be pasted directly into the Envio GraphQL playground at:

**https://indexer.dev.hyperindex.xyz/14ba103/v1/graphql**

Each query is annotated with its purpose and the UI component or bot logic it powers.

---

## 1. System Overview (Headline Metrics)

The single-row aggregate of the entire protocol state. Powers the top-of-dashboard metrics cards.

```graphql
query SystemOverview {
  SystemMetrics(where: { id: { _eq: "1" } }) {
    totalPatterns
    activePatterns
    totalDelegations
    activeDelegations
    totalExecutions
    successfulExecutions
    failedExecutions
    eventsProcessed
    averageQueryLatency
    peakEventsPerSecond
    totalVolume
    totalEarnings
    momentumPatterns
    arbitragePatterns
    meanReversionPatterns
    otherPatterns
  }
}
```

---

## 2. Top Performing Patterns

Sorted by ROI descending — powers the leaderboard and the ROI bar chart.

```graphql
query TopPatterns {
  Pattern(
    where: { isActive: { _eq: true } }
    order_by: { roi: desc }
    limit: 10
  ) {
    tokenId
    patternType
    winRate
    roi
    totalVolume
    totalEarnings
    delegationCount
    successfulExecutions
    failedExecutions
    qualityGrade
    trendDirection
    creator {
      id
    }
  }
}
```

---

## 3. Cross-Entity Join (Pattern + Delegations + Executions + Updates)

Shows off Envio's relational query capability. A single request traverses four entities.

```graphql
query PatternWithRelations {
  Pattern(where: { tokenId: { _eq: "3" } }) {
    tokenId
    patternType
    winRate
    roi
    totalVolume
    totalEarnings
    isActive
    qualityGrade
    creator {
      id
    }
    delegations {
      delegationId
      delegator
      percentageAllocation
      totalExecutions
      totalEarnings
      isActive
    }
    executions(order_by: { timestamp: desc }, limit: 5) {
      delegationId
      amount
      success
      txHash
      timestamp
    }
    performanceUpdates(order_by: { timestamp: asc }) {
      winRate
      roi
      totalVolume
      timestamp
    }
  }
}
```

---

## 4. Active Delegations (Used by the Executor Bot)

This is the exact query the bot uses every 5 seconds to decide which trades to execute.

```graphql
query ActiveDelegations {
  Delegation(
    where: { isActive: { _eq: true } }
    order_by: { createdAt: asc }
  ) {
    delegationId
    delegator
    patternTokenId
    percentageAllocation
    smartAccountAddress
    successRate
    totalExecutions
    totalEarnings
    pattern {
      tokenId
      patternType
      winRate
      roi
      totalVolume
      isActive
      delegationCount
    }
  }
}
```

---

## 5. Live Trade Feed

Latest executions across the whole protocol. Powers the `LiveExecutionFeed` component.

```graphql
query LiveTradeFeed {
  TradeExecution(
    order_by: { timestamp: desc }
    limit: 20
  ) {
    id
    delegationId
    patternTokenId
    executor
    amount
    success
    txHash
    timestamp
  }
}
```

---

## 6. Top Delegators

Per-user aggregates sorted by earnings. Useful for a social layer or reputation UI.

```graphql
query TopDelegators {
  Delegator(
    order_by: { totalEarnings: desc }
    limit: 10
  ) {
    address
    totalDelegations
    activeDelegations
    totalExecutions
    successfulExecutions
    totalEarnings
    totalCapitalDelegated
    reputationScore
    firstDelegationAt
    lastDelegationAt
  }
}
```

---

## 7. Pattern Performance Timeline

Historical time-series for a single pattern. Use this for the analytics chart's time axis.

```graphql
query PerformanceTimeline {
  PerformanceUpdate(
    where: { pattern_id: { _eq: "1" } }
    order_by: { timestamp: asc }
  ) {
    timestamp
    winRate
    roi
    totalVolume
    winRateDelta
    roiDelta
    volumeDelta
    blockNumber
    txHash
  }
}
```

---

## 8. Pattern Distribution by Type

Aggregate counts per pattern type. Great for a donut chart or type-breakdown badges.

```graphql
query PatternDistribution {
  momentum: Pattern_aggregate(where: { patternType: { _eq: "momentum" } }) {
    aggregate { count }
  }
  arbitrage: Pattern_aggregate(where: { patternType: { _eq: "arbitrage" } }) {
    aggregate { count }
  }
  mean_reversion: Pattern_aggregate(where: { patternType: { _eq: "mean_reversion" } }) {
    aggregate { count }
  }
  yield: Pattern_aggregate(where: { patternType: { _eq: "yield" } }) {
    aggregate { count }
  }
  liquidity: Pattern_aggregate(where: { patternType: { _eq: "liquidity" } }) {
    aggregate { count }
  }
  composite: Pattern_aggregate(where: { patternType: { _eq: "composite" } }) {
    aggregate { count }
  }
}
```

---

## 9. Trades for a Specific Delegation

All executions under one delegation — for the "Delegation Details" modal.

```graphql
query DelegationTrades {
  TradeExecution(
    where: { delegationId: { _eq: "4" } }
    order_by: { timestamp: desc }
  ) {
    amount
    success
    txHash
    timestamp
    patternTokenId
    executor
  }
}
```

---

## 10. Dashboard Home (One-Query Wonder)

**The showcase query.** Everything the dashboard home page needs, in a single request. Envio computes the joins, aggregates, and filters in <50ms.

```graphql
query DashboardHome {
  metrics: SystemMetrics(where: { id: { _eq: "1" } }) {
    totalPatterns
    activePatterns
    totalDelegations
    activeDelegations
    totalExecutions
    successfulExecutions
    totalVolume
    totalEarnings
    peakEventsPerSecond
    averageQueryLatency
  }

  topPatterns: Pattern(
    where: { isActive: { _eq: true } }
    order_by: { roi: desc }
    limit: 5
  ) {
    tokenId
    patternType
    winRate
    roi
    totalVolume
    delegationCount
  }

  recentTrades: TradeExecution(
    order_by: { timestamp: desc }
    limit: 10
  ) {
    delegationId
    patternTokenId
    amount
    success
    txHash
    timestamp
  }

  topDelegators: Delegator(
    order_by: { totalEarnings: desc }
    limit: 3
  ) {
    address
    totalEarnings
    totalExecutions
    reputationScore
  }

  activeDelegations: Delegation(
    where: { isActive: { _eq: true } }
    limit: 5
    order_by: { totalEarnings: desc }
  ) {
    delegationId
    patternTokenId
    delegator
    totalExecutions
    totalEarnings
    pattern {
      patternType
      roi
    }
  }
}
```

---

## Demo Flow (For Judges or Presentations)

Run these queries in order during a live demo:

1. **Query #1** → "The system has 13 patterns, 9 delegations, 47 executions — all real, all indexed by Envio in real-time."
2. **Query #10** → "This single query returns the entire dashboard. Raw RPC would need dozens of calls and take seconds. Envio does it in 4ms."
3. **Query #3** → "Watch this cross-entity join: Pattern → Delegations → Executions → PerformanceUpdates, all in one request."
4. **Query #5** → "The live trade feed. Every time the bot executes a trade, it shows up here within a second of on-chain confirmation."

**Pro tip:** The Envio playground shows query execution time in the bottom-right. Point out the sub-50ms latency every time.
