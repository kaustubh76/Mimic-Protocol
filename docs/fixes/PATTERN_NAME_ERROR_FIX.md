# Pattern Name Fetching Error - FIXED ✅

## Error
```
TypeError: Cannot read properties of undefined (reading 'length')
    at useDelegations.ts:85:50
```

## Root Cause
The `patterns(uint256)` function returns a struct, but viem might return it as:
1. An object with named properties: `{ patternType: "...", ... }`
2. An array/tuple: `["0xCreator", "PatternName", ...]`
3. `undefined` if the pattern doesn't exist or ABI decoding fails

The code was trying to access `pattern.patternType` directly without checking if `pattern` exists or what format it's in.

## Fix Applied

### Before (Unsafe)
```typescript
const pattern = await publicClient.readContract({
  functionName: 'patterns',
  args: [patternTokenId],
}) as any;
patternName = pattern.patternType; // ❌ Crashes if pattern is undefined or array
```

### After (Safe)
```typescript
let patternName = `Pattern #${patternTokenId}`; // ✅ Default fallback

try {
  const pattern = await publicClient.readContract({
    functionName: 'patterns',
    args: [patternTokenId],
  }) as any;

  // Safely extract pattern type
  if (pattern && typeof pattern === 'object') {
    if (pattern.patternType && typeof pattern.patternType === 'string') {
      patternName = pattern.patternType; // ✅ Named property
    } else if (Array.isArray(pattern) && pattern[1]) {
      patternName = pattern[1]; // ✅ Array/tuple index 1
    }
  }
} catch (e) {
  console.error('Error fetching pattern name:', e);
  // Keep the default Pattern #X name
}
```

## What Changed

### 1. **Default Fallback Name**
```typescript
let patternName = `Pattern #${patternTokenId}`;
```
Always starts with a valid name, so even if fetching fails, users see "Pattern #2" instead of "Unknown" or crashes.

### 2. **Safe Object Checking**
```typescript
if (pattern && typeof pattern === 'object') {
  if (pattern.patternType && typeof pattern.patternType === 'string') {
    patternName = pattern.patternType;
  }
}
```
Checks if `pattern` exists and is an object before accessing properties.

### 3. **Array/Tuple Handling**
```typescript
else if (Array.isArray(pattern) && pattern[1]) {
  patternName = pattern[1];
}
```
If viem returns the struct as an array, `patternType` is at index 1:
```
[0] creator (address)
[1] patternType (string) ← This is what we want
[2] patternData (bytes)
[3] createdAt (uint256)
...
```

### 4. **Error Handling**
```typescript
catch (e) {
  console.error('Error fetching pattern name:', e);
  // Keep the default Pattern #X name
}
```
If the RPC call fails, contract doesn't exist, or any other error occurs, the delegation still displays with the fallback name.

## Pattern Struct (From Contract)
```solidity
struct PatternMetadata {
    address creator;        // [0]
    string patternType;     // [1] ← This is the pattern name
    bytes patternData;      // [2]
    uint256 createdAt;      // [3]
    uint256 winRate;        // [4]
    uint256 totalVolume;    // [5]
    int256 roi;             // [6]
    bool isActive;          // [7]
}

mapping(uint256 => PatternMetadata) public patterns;
```

## Verification

Your patterns exist on-chain:
```bash
# Pattern #2 owner (verified with Alchemy RPC)
cast call 0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc \
  "ownerOf(uint256)" 2 \
  --rpc-url "https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0"
# Result: 0xfbd05ee3e711b03bb67eeec982e49c81ee1db99d ✅
```

## Benefits of This Fix

1. ✅ **No more crashes** - Safe property access
2. ✅ **Always shows something** - Default "Pattern #X" name
3. ✅ **Handles both formats** - Object properties or array indices
4. ✅ **Graceful degradation** - If fetch fails, still shows delegation
5. ✅ **Better UX** - Users see delegation even if pattern name fetch is slow/fails

## Expected Behavior After Fix

### My Delegations Page
```
✅ Delegation to Pattern #4 (or actual name if fetch succeeds)
   75% allocation, Active

✅ Delegation to Pattern #5 (or actual name if fetch succeeds)
   50% allocation, Active

✅ Delegation to Pattern #2 (or actual name if fetch succeeds)
   50% allocation, Active

✅ Delegation to Pattern #3 (or actual name if fetch succeeds)
   50% allocation, Active
```

Even if the pattern name fetch fails, you'll see "Pattern #X" instead of errors or blank screens.

## Files Updated
- ✅ [src/frontend/src/hooks/useDelegations.ts:83-104](src/frontend/src/hooks/useDelegations.ts#L83-L104)

## Testing
1. Refresh your browser
2. Navigate to "My Delegations"
3. Should see 4 delegations without errors
4. Pattern names will show either:
   - Actual pattern name (if fetch succeeds)
   - "Pattern #X" (if fetch fails or is slow)

## Summary
**Root cause**: Unsafe access to potentially undefined pattern data
**Fix**: Added default fallback name, safe property checking, and error handling
**Result**: Delegations always display, even if pattern names fail to load! ✅
