# Preventing Re-renders in Custom Query Action Hooks

When creating custom hooks that wrap TanStack Query (`useQuery`, `useMutation`), naive implementations often introduce severe performance bottlenecks:
1. **Infinite Re-render Loops**: Changing callback references causing `useEffect` dependencies to fire repeatedly.
2. **Cascading Render Thrashing**: Unmemoized helper functions breaking reference equality (`===`), forcing child components using `React.memo` to re-render on every tick.
3. **Tab Focus Jitter**: Aggressive window re-focus re-fetching resetting table scroll positions and input fields.

This document details how our custom hooks solve these problems.

---

## The Three Pillars of Render Protection

```
                                Custom Hook Boundary
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                                                                             │
 │  Incoming Callbacks (from component)                                        │
 │  successCallback, errorCallback, onSettled                                  │
 │         │                                                                   │
 │         ▼                                                                   │
 │  [ Pillar 1: useRef ]                                                       │
 │  • Stores mutable references without triggering re-runs                     │
 │  • Updated synchronously: ref.current = callback                            │
 │  • Safe to execute inside useEffect without adding callback to deps         │
 │                                                                             │
 │  Query Response Data                                                        │
 │  query.data?.data                                                           │
 │         │                                                                   │
 │         ▼                                                                   │
 │  [ Pillar 2: useMemo ]                                                      │
 │  • Memoizes data array / metadata extraction                                │
 │  • Returns same array reference unless server payload actually changes      │
 │                                                                             │
 │  Exposed Helper Functions (Selectors & Converters)                          │
 │  getWallet(), getAvailable(), convertCryptoToFiat(), detectNetwork()       │
 │         │                                                                   │
 │         ▼                                                                   │
 │  [ Pillar 3: useCallback ]                                                  │
 │  • Maintains stable function identity across renders                        │
 │  • Child components receiving these methods never re-render unnecessarily   │
 │                                                                             │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## Pillar 1: Stable Callback References via `useRef`

### The Problem
When a consumer component passes an inline arrow function as a callback:
```tsx
// ❌ ANTI-PATTERN in Consumer Component:
useWalletsAction(
  (wallets) => console.log("Fetched", wallets), // Fresh function on EVERY render!
);
```
If the custom hook places this callback inside a `useEffect` dependency array:
```tsx
// ❌ WRONG inside Custom Hook:
useEffect(() => {
  if (query.isSuccess) {
    successCallback?.(query.data);
  }
}, [query.isSuccess, query.data, successCallback]); // Fires infinitely if successCallback is recreated!
```

### The Solution: Mutable Refs
```tsx
// ✅ OPTIMIZED PATTERN (Used in all Bitnormous Action Hooks):
export const useWalletsAction = (
  successCallback?: (wallets: CustodyWalletItem[]) => void,
  errorCallback?: (error: any) => void,
  onSettled?: () => void,
) => {
  const successCallbackRef = useRef(successCallback);
  successCallbackRef.current = successCallback;

  const errorCallbackRef = useRef(errorCallback);
  errorCallbackRef.current = errorCallback;

  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  useEffect(() => {
    if (query.isSuccess && query.data?.data) {
      successCallbackRef.current?.(query.data.data);
      onSettledRef.current?.();
    }
  }, [query.isSuccess, query.data]); // Reference to callback is decoupled!
};
```

---

## Pillar 2: Reference-Stable Data Slices via `useMemo`

### The Problem
If a hook extracts data directly from the query object without memoization:
```tsx
// ❌ ANTI-PATTERN:
const wallets = query.data?.data ?? []; // New array instance [] on EVERY render when data is undefined!
```
Every child receiving `wallets` sees a new object reference (`prev.wallets !== next.wallets`), forcing full subtree re-renders.

### The Solution: Memoized Slices
```tsx
// ✅ OPTIMIZED PATTERN:
const wallets: CustodyWalletItem[] = useMemo(
  () => query.data?.data ?? [],
  [query.data?.data]
);

const meta: DepositAddressesMeta | undefined = useMemo(
  () => query.data?.data?.meta,
  [query.data?.data?.meta]
);
```

---

## Pillar 3: Memoized Selector & Calculation Helpers via `useCallback`

### The Problem
In financial applications, consumer components need frequent conversions and asset lookups:
- "What is the available balance for BTC?"
- "Convert 1.5 BTC to GHS at current sell rate."
- "Which Mobile Money network does prefix 024 belong to?"

If these functions are created as normal functions inside the hook:
```tsx
// ❌ ANTI-PATTERN:
const getWallet = (asset: string) => wallets.find(w => w.asset === asset); // Brand new function every render!
```
Any component using `getWallet` in its own dependency array or passing it to child cards will trigger infinite loops or unwanted child renders.

### The Solution: Stable `useCallback` Wrappers
```tsx
// ✅ OPTIMIZED PATTERN (from useIndicativeRatesAction.ts):
const convertCryptoToFiat = useCallback(
  (asset: string, cryptoAmount: number | string): string => {
    const rate = getSellRate(asset);
    if (!rate) return "0.00";
    const numRate = parseFloat(rate);
    const numCrypto = typeof cryptoAmount === "string" ? parseFloat(cryptoAmount) : cryptoAmount;
    if (isNaN(numRate) || isNaN(numCrypto)) return "0.00";
    return (numCrypto * numRate).toFixed(2);
  },
  [getSellRate]
);
```
Consumers can pass `convertCryptoToFiat` down to nested currency converters or list items with zero performance penalty.

---

## Query Client Configuration Guardrails

All Bitnormous action hooks apply standard defensive defaults:
1. `refetchOnWindowFocus: false`: Prevents jarring layout shifts when the merchant switches browser tabs between Bitnormous and external wallets/banks.
2. `retry: 1`: Retries once on transient network dropouts without hanging the UI on persistent server errors.
3. `staleTime`: Tuned specifically per domain:
   - **Indicative Rates**: 30 seconds (volatile pricing data).
   - **Supported Assets & Chains**: 5 minutes (rarely changes during a user session).
   - **Mobile Money Networks**: 10 minutes (static operator catalogues).
