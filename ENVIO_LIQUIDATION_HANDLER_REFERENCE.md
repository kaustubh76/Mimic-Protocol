# Liquidation Handler Reference — The Trickiest Event In The Money-Market Vertical

**From:** Kaustubh Agrawal — Growth Engineer candidate
**Companion docs:** [ENVIO_VERTICAL_PLAYBOOK.md](./ENVIO_VERTICAL_PLAYBOOK.md) · [ENVIO_INDEXER_TEARDOWN.md](./ENVIO_INDEXER_TEARDOWN.md) · [ENVIO_EFFECT_API_PATTERN.md](./ENVIO_EFFECT_API_PATTERN.md) · [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md)

> *Reference for the trickiest event shape in the money-market vertical: `LiquidationCall`, with dual-reserve and dual-user updates and append-only entity preservation.*
>
> **Live reference code:** [`pow/envio-money-market-template-v1/src/EventHandlers/Pool.ts`](./pow/envio-money-market-template-v1/src/EventHandlers/Pool.ts) — the runnable handler. Test coverage at [`pow/envio-money-market-template-v1/test/ReserveAggregator.test.ts`](./pow/envio-money-market-template-v1/test/ReserveAggregator.test.ts) — the LiquidationCall test asserts state across all four affected entities (collateral reserve, debt reserve, victim user, liquidator user).

---

## §1 Why This Reference Exists

Liquidation is where money-market indexers fail visibly. End users see "I was liquidated but my history shows zero liquidations" or "the liquidator leaderboard is wrong." The ramifications include risk-dashboard inaccuracy, broken liquidator-bot analytics, missed alerts to delegated risk monitors. **Liquidation bugs cause customer churn at the Dedicated tier specifically because Dedicated customers are the ones building risk-dashboard products on top of the indexer.**

This closes one §2 cell directly:

- **Retention × Tech [DeFi/money-market]** — liquidation handling is the most-Googled support question for money-market indexer engineers; documenting it as the canonical pattern shrinks the support surface.

And touches one indirectly:

- **Activation × Tech [DeFi/money-market]** — the template ships the handler correct from day one rather than letting the customer rediscover the dual-update pattern at month two.

---

## §2 The Four Things `LiquidationCall` Touches

A single `LiquidationCall(collateralAsset, debtAsset, user, debtToCover, liquidatedCollateralAmount, liquidator, receiveAToken)` event causes state changes across **four entities**:

```
LiquidationCall
   │
   ├──> Liquidation entity (append-only, new row)
   │
   ├──> ReserveAggregator(collateralAsset)  — totalLiquidations++
   │    ReserveAggregator(debtAsset)        — totalLiquidations++  (skip if same asset)
   │
   └──> UserAggregator(user)                 — liquidationsAsBorrower++
        UserAggregator(liquidator)           — liquidationsAsLiquidator++
```

If any of the four is missed, the data is inconsistent. Common bugs:

- **Single-reserve update.** Handler increments `totalLiquidations` on the collateral reserve only, missing the debt asset. Risk dashboards under-count debt-asset liquidations by ~50% on average.
- **Missing liquidator counter.** Handler treats `liquidator` as auxiliary, doesn't increment their `UserAggregator`. Liquidator leaderboards undercount.
- **Same-asset double-count.** When `collateralAsset == debtAsset` (rare, e.g. liquidating aUSDC against variable USDC debt), naive handlers increment `totalLiquidations` twice on the same reserve. The template's handler explicitly checks `if (collateralAsset.toLowerCase() !== debtAsset.toLowerCase())` before the second increment.
- **Mutating instead of appending.** Some implementations update an existing `Liquidation` entity in place. The template treats Liquidation as append-only with a `(chainId, blockNumber, logIndex)` composite key — cascading liquidations within one block don't collide, and reorgs are handled by Envio's checkpoint deletion.

---

## §3 Production Guardrails

The reference prevents three failure modes:

- **`receiveAToken` flag ignored.** Some indexers throw away this field. It matters: when `receiveAToken == true`, the liquidator receives aTokens (collateral stays in Aave; underlying doesn't move), so liquidator-bot analytics that track underlying-asset flow miss it. Persist the flag.
- **Cross-reserve liquidation sequence handling.** A user can be liquidated multiple times in the same block across different reserves. Each `LiquidationCall` is a distinct event with a distinct `logIndex`; the composite key handles uniqueness without further work.
- **Liquidatee == liquidator edge case.** Theoretically possible (some flash-loan-based self-liquidation strategies). The template's two `upsertOnLiquidation*` calls run independently; if `user == liquidator`, both increments fire on the same `UserAggregator` (one as borrower, one as liquidator). Documented but rare.

---

## §4 Walkthrough Hooks

A productised version ships as:

- **A docs page** at "Patterns → Liquidation Events" — sections mirror §2 above, with code references to `pow/envio-money-market-template-v1/src/EventHandlers/Pool.ts` lines 158–207 (the LiquidationCall handler).
- **A 20-minute Loom** that walks the four state changes against the template's vitest case (`LiquidationCall writes Liquidation entity + updates both reserves + both users`).
- **A reference vitest case** in the template's test suite that explicitly asserts state across all four entities — already shipped at [`pow/envio-money-market-template-v1/test/ReserveAggregator.test.ts`](./pow/envio-money-market-template-v1/test/ReserveAggregator.test.ts) (test 3).

---

## §5 Adoption Pathway

The reference succeeds when:

1. The docs page becomes the canonical link Envio team members share when a money-market customer asks about liquidation handling.
2. The money-market template ships the dual-reserve + dual-user pattern as the default.
3. New money-market customer code reviews show liquidation correctness from day one, not as month-3 retrofits when their first user complains.

The conversion mechanism: liquidation-shaped support questions on Discord → docs page → template fork → activation. Acquisition leverage on top of activation leverage.

---

## §6 What This Reference Doesn't Cover

- **Health-factor computation.** The trigger for liquidation, but a separate concern — see [`ENVIO_EFFECT_API_PATTERN.md`](./ENVIO_EFFECT_API_PATTERN.md) for the oracle-Effect path.
- **Liquidation bonus / penalty math.** Aave's liquidation bonus per asset is governance config; the indexer doesn't compute it (the bonus is implicit in `liquidatedCollateralAmount` vs `debtToCover`).
- **MEV-protected liquidations.** Different transaction-routing layer; doesn't change the event shape or the indexer's job.

---

> **Cell:** Retention × Tech [DeFi/money-market] (primary); Activation × Tech [DeFi/money-market] (secondary)
> **Revenue mechanism:** Net-new acquisition (highest-Google-traffic search term mid-implementation; reference is acquisition leverage)
> **Named accounts:** Aave (largest LiquidationCall volume), Compound V3 (similar event shape with naming differences), Spark (Aave fork), Morpho (uses Aave + Compound liquidation primitives)
> **Sibling artifacts:** [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md), [ENVIO_MONEY_MARKET_TEMPLATE.md](./ENVIO_MONEY_MARKET_TEMPLATE.md), [ENVIO_EFFECT_API_PATTERN.md](./ENVIO_EFFECT_API_PATTERN.md)

— Kaustubh
