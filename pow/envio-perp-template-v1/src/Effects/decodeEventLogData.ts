/**
 * decodeEventLogData — turn GMX v2's tuple-of-tuples EventLogData into a
 * typed dictionary keyed by string field name.
 *
 * GMX v2's `EventEmitter` emits all events through a generic
 * `EventLog/EventLog1/EventLog2(string eventName, ..., EventLogData eventData)`
 * shape. The `eventData` payload is a struct of 7 sections (addressItems,
 * uintItems, intItems, boolItems, bytes32Items, bytesItems, stringItems),
 * each a tuple of (items, arrayItems) where items = Array<{key, value}>.
 *
 * Envio's codegen produces a typed accessor:
 *   event.params.eventData
 *     : [
 *         [Array<[string, address]>, Array<[string, address[]]>],   // addressItems
 *         [Array<[string, bigint]>,  Array<[string, bigint[]]>],    // uintItems
 *         [Array<[string, bigint]>,  Array<[string, bigint[]]>],    // intItems
 *         [Array<[string, boolean]>, Array<[string, boolean[]]>],   // boolItems
 *         [Array<[string, string]>,  Array<[string, string[]]>],    // bytes32Items
 *         [Array<[string, string]>,  Array<[string, string[]]>],    // bytesItems
 *         [Array<[string, string]>,  Array<[string, string[]]>],    // stringItems
 *       ]
 *
 * Walking this manually is verbose. This helper flattens it into a dict.
 *
 * The GMX `eventName` string tells us which payload shape to expect; this
 * helper is event-agnostic and just exposes the keys/values present.
 *
 * Reference: gmx-io/gmx-synthetics/contracts/event/EventUtils.sol
 */

// The literal tuple shape from generated/src/Types.gen.ts — replicated here
// so the helper compiles against any generated build.
export type RawEventLogData = [
  [Array<[string, string]>, Array<[string, string[]]>], // addressItems
  [Array<[string, bigint]>, Array<[string, bigint[]]>], // uintItems
  [Array<[string, bigint]>, Array<[string, bigint[]]>], // intItems
  [Array<[string, boolean]>, Array<[string, boolean[]]>], // boolItems
  [Array<[string, string]>, Array<[string, string[]]>], // bytes32Items
  [Array<[string, string]>, Array<[string, string[]]>], // bytesItems
  [Array<[string, string]>, Array<[string, string[]]>], // stringItems
];

export type DecodedEventLogData = {
  addresses: Record<string, string>;
  addressArrays: Record<string, string[]>;
  uints: Record<string, bigint>;
  uintArrays: Record<string, bigint[]>;
  ints: Record<string, bigint>;
  intArrays: Record<string, bigint[]>;
  bools: Record<string, boolean>;
  boolArrays: Record<string, boolean[]>;
  bytes32: Record<string, string>;
  bytes32Arrays: Record<string, string[]>;
  bytes: Record<string, string>;
  bytesArrays: Record<string, string[]>;
  strings: Record<string, string>;
  stringArrays: Record<string, string[]>;
};

function pairsToDict<V>(pairs: Array<[string, V]>): Record<string, V> {
  const out: Record<string, V> = {};
  for (const [k, v] of pairs) out[k] = v;
  return out;
}

export function decodeEventLogData(raw: RawEventLogData): DecodedEventLogData {
  const [addr, uint, int, bool, b32, bts, str] = raw;
  return {
    addresses: pairsToDict(addr[0]),
    addressArrays: pairsToDict(addr[1]),
    uints: pairsToDict(uint[0]),
    uintArrays: pairsToDict(uint[1]),
    ints: pairsToDict(int[0]),
    intArrays: pairsToDict(int[1]),
    bools: pairsToDict(bool[0]),
    boolArrays: pairsToDict(bool[1]),
    bytes32: pairsToDict(b32[0]),
    bytes32Arrays: pairsToDict(b32[1]),
    bytes: pairsToDict(bts[0]),
    bytesArrays: pairsToDict(bts[1]),
    strings: pairsToDict(str[0]),
    stringArrays: pairsToDict(str[1]),
  };
}

/**
 * Type-narrowed view of a PositionIncrease event's decoded fields.
 *
 * Reference: gmx-io/gmx-synthetics/contracts/position/PositionEventUtils.sol
 * function emitPositionIncrease — see which keys it sets on each section.
 *
 * Not all fields are required; the accessor returns undefined if a key is
 * absent, which lets the handler gracefully fall back to default values
 * for fields GMX may not have set on a particular event.
 */
export type DecodedPositionIncrease = {
  // bytes32 items
  positionKey: string | undefined;
  orderKey: string | undefined;
  // address items
  account: string | undefined;
  market: string | undefined;
  collateralToken: string | undefined;
  // uint items
  sizeInUsd: bigint | undefined;        // size after this increase
  sizeInTokens: bigint | undefined;     // size after, in indexToken units
  collateralAmount: bigint | undefined; // collateral after
  borrowingFactor: bigint | undefined;
  fundingFeeAmountPerSize: bigint | undefined;
  longTokenClaimableFundingAmountPerSize: bigint | undefined;
  shortTokenClaimableFundingAmountPerSize: bigint | undefined;
  executionPrice: bigint | undefined;
  indexTokenPriceMax: bigint | undefined;
  indexTokenPriceMin: bigint | undefined;
  collateralTokenPriceMax: bigint | undefined;
  collateralTokenPriceMin: bigint | undefined;
  sizeDeltaUsd: bigint | undefined;     // delta this event added
  sizeDeltaInTokens: bigint | undefined;
  collateralDeltaAmount: bigint | undefined;
  // int items
  priceImpactUsd: bigint | undefined;
  priceImpactAmount: bigint | undefined;
  // bool items
  isLong: boolean | undefined;
  // uint items (continued — GMX adds more over time; v1 captures the common ones)
  orderType: bigint | undefined;
};

export function decodePositionIncrease(raw: RawEventLogData): DecodedPositionIncrease {
  const d = decodeEventLogData(raw);
  return {
    positionKey: d.bytes32.positionKey,
    orderKey: d.bytes32.orderKey,
    account: d.addresses.account,
    market: d.addresses.market,
    collateralToken: d.addresses.collateralToken,
    sizeInUsd: d.uints.sizeInUsd,
    sizeInTokens: d.uints.sizeInTokens,
    collateralAmount: d.uints.collateralAmount,
    borrowingFactor: d.uints.borrowingFactor,
    fundingFeeAmountPerSize: d.uints.fundingFeeAmountPerSize,
    longTokenClaimableFundingAmountPerSize:
      d.uints.longTokenClaimableFundingAmountPerSize,
    shortTokenClaimableFundingAmountPerSize:
      d.uints.shortTokenClaimableFundingAmountPerSize,
    executionPrice: d.uints.executionPrice,
    indexTokenPriceMax: d.uints.indexTokenPriceMax,
    indexTokenPriceMin: d.uints.indexTokenPriceMin,
    collateralTokenPriceMax: d.uints.collateralTokenPriceMax,
    collateralTokenPriceMin: d.uints.collateralTokenPriceMin,
    sizeDeltaUsd: d.uints.sizeDeltaUsd,
    sizeDeltaInTokens: d.uints.sizeDeltaInTokens,
    collateralDeltaAmount: d.uints.collateralDeltaAmount,
    priceImpactUsd: d.ints.priceImpactUsd,
    priceImpactAmount: d.ints.priceImpactAmount,
    isLong: d.bools.isLong,
    orderType: d.uints.orderType,
  };
}
