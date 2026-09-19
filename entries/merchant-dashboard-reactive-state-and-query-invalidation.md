# Merchant Dashboard Reactive Architecture: Query Invalidation, Root Store Synchronization & Equilibrium State Engineering

**Author:** Antigravity Engineering Pair  
**Status:** Production Standard  
**Stack:** React 19, TanStack Query v5, Zustand v5, TypeScript, TailwindCSS  
**Repository Reference:** `business-bitnormous-merchant`  

---

## 1. Executive Summary & Core Architectural Problem

Financial dashboard interfaces demand high data fidelity, zero rendering thrash, and immediate visual consistency. In payment and cryptocurrency merchant portals like Bitnormous, the dashboard displays high-stakes metrics: withdrawable fiat balances, pending payout queues, transaction success rates, and failure frequencies.

Prior to this architectural overhaul, the merchant portal faced several structural liabilities:
1. **Scattered and Duplicated Data Fetching:** Data fetching hooks were mounted repeatedly within individual page components (e.g. `HomePage.tsx`), causing redundant HTTP requests and race conditions with the global Zustand stores.
2. **Ad-Hoc Query Invalidation (`queryClient.invalidateQueries` sprawl):** UI buttons and drawers imperatively invoked `queryClient.invalidateQueries({ queryKey: ["..."] })` with hardcoded string literals. Any change to query key naming broke cache synchronization silently.
3. **Dead Legacy State Handlers:** Functions like imperative `syncToStore` callbacks lingered in custom hooks despite automatic `useEffect` reactive syncing already handling store hydration.
4. **Mocked Metric Cards & Missing Live Trends:** The main dashboard metric cards (`Balance`, `Next payouts`, `Success Rate`, `Failed`) were driven by static mock data rather than live API controllers.
5. **The 0% Equilibrium Paradox:** When day-over-day performance was unchanged (0% diff), cards erroneously rendered upward or downward directional arrows (`FaArrowUp` / `FaArrowDown`), confusing merchants about market movement when metrics were in fact at equilibrium.
6. **Strict TypeScript Linter Warnings (`TS6133`):** Residual variables like `isCountDone` in `DashboardCards.tsx` and `numAmount` in `useWalletsAction.ts` caused linting errors when animations or destructuring changed.

---

## 2. Root-Level Action Mounting & Auto-Sync Pattern

### 2.1 The Problem with Page-Level Fetching
When data-fetching hooks (e.g. `useWalletsAction`, `useFiatBalancesAction`) are instantiated inside leaf pages:
- Navigating away from `HomePage` unmounts the query; returning re-triggers full loading states.
- Modals, drawers, and headers that rely on `useWalletStore` or `useFiatBalanceStore` find empty states if the user enters via a deep route (e.g. `/withdrawals`).
- Component lifecycles fight over store mutation.

### 2.2 The Solution: Root Layout Mounting
We mount primary financial actions inside `src/components/Layout.tsx`:

```tsx
// src/components/Layout.tsx
export const Layout = () => {
  // Mount root actions: automatically hydrates global stores on mount and keeps them fresh
  useFiatBalancesAction();
  useWalletsAction();

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAFA]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Header />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
```

### 2.3 Declarative Reactive Store Syncing
In `src/actions/wallets/useWalletsAction.ts`, the query synchronizes directly to Zustand on `isSuccess`:

```ts
useEffect(() => {
  if (query.isSuccess && query.data?.data) {
    useWalletStore.getState().setCustodyWallets(query.data.data);
    successCallbackRef.current?.(query.data.data);
    onSettledRef.current?.();
  }
}, [query.isSuccess, query.data]);
```

This eliminated the legacy manual `syncToStore` callback that previously required UI components to manually push data into the store.

---

## 3. Centralized Query Keys Factory & Semantic Invalidation Hooks

### 3.1 Centralized `queryKeys.ts`
To enforce type safety and eliminate magic strings, all cache keys are centralized into a hierarchical key factory:

```ts
// src/actions/queryKeys.ts
export const queryKeys = {
  fiatBalances: ["fiatBalances"] as const,
  custodyWallets: ["custodyWallets"] as const,
  fiatPayouts: {
    all: ["fiatPayouts"] as const,
    list: (params?: Record<string, any>) => ["fiatPayouts", params] as const,
    detail: (id: string | number) => ["fiatPayouts", id] as const,
  },
  withdrawals: {
    all: ["withdrawals"] as const,
    list: (params?: Record<string, any>) => ["withdrawals", params] as const,
    detail: (id: string | number) => ["withdrawals", id] as const,
  },
  transactions: {
    ledger: (params?: Record<string, any>) => ["ledgerTransactions", params] as const,
  },
  overview: (businessId?: string, rangeDays?: number) =>
    ["overview", businessId, rangeDays] as const,
} as const;
```

### 3.2 Semantic Invalidation Hooks (`useInvalidateQueries.ts`)
Components never import `useQueryClient` to invalidate keys manually. Instead, they consume semantic domain invalidators:

```ts
// src/actions/useInvalidateQueries.ts
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { queryKeys } from "./queryKeys";

export const useInvalidateDashboard = () => {
  const queryClient = useQueryClient();
  return useCallback(() => {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.fiatBalances }),
      queryClient.invalidateQueries({ queryKey: queryKeys.custodyWallets }),
      queryClient.invalidateQueries({ queryKey: queryKeys.fiatPayouts.all }),
      queryClient.invalidateQueries({ queryKey: ["overview"] }),
    ]);
  }, [queryClient]);
};

export const useInvalidateFiatPayouts = () => {
  const queryClient = useQueryClient();
  return useCallback(() => {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.fiatPayouts.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.fiatBalances }),
    ]);
  }, [queryClient]);
};
```

---

## 4. Live Dashboard Metrics Aggregation (`useNormalDashboardMetrics`)

The `useNormalDashboardMetrics.ts` hook aggregates live data across multiple controllers:

| Metric Card | Primary Source | Secondary Calculation | Trend Calculation |
| :--- | :--- | :--- | :--- |
| **Balance** | `useFiatBalanceStore` | `getWithdrawable()` | None (static balance display) |
| **Next payouts** | `useFiatPayoutsAction({ status: "pending" })` | Sum of all `pending` payout amounts | `${payouts.length} pending` or `0%` |
| **Success Rate** | `useOverview(businessId, 30)` | `payments.conversion_rate` | Day-over-day rate difference from `payments.daily` |
| **Failed** | `useOverview(businessId, 30)` | `expired + cancelled` payments | Failure percentage `(failed / total) * 100` |

---

## 5. The Equilibrium State Problem ("0%" Trend Engineering)

### 5.1 The Paradox
When a metric experiences **no change** (0% change):
- Rendering an **Up Arrow** (`FaArrowUp`) falsely communicates growth.
- Rendering a **Down Arrow** (`FaArrowDown`) falsely communicates loss.
- Coloring the metric **Green** or **Red** creates unwarranted positive or negative bias.
- Displaying `+0%` or `-0%` looks syntactically incorrect for a neutral zero value.

### 5.2 The Engineering Solution
In `src/components/dashboard/DashboardCards.tsx`:

```tsx
const { num: trendNum } = parseValue(trend || "");

// 1. Detect Equilibrium State
const isEquilibrium = trend ? trendNum === 0 || trendDirection === "none" : false;

// 2. Suppress Arrow Icon
const showArrow = !isEquilibrium && trendDirection !== "none";

// 3. Strip +/- signs to display clean "0%"
const displayTrend = trend ? (isEquilibrium ? trend.replace(/^[+-]/, "") : trend) : "";

// 4. Shift to Neutral Equilibrium Tone
const trendToneColor = isEquilibrium
  ? "text-[#71717A]"
  : tone === "green"
  ? "text-[#22C55E]"
  : "text-[#FF3B30]";
```

### 5.3 Non-Numeric Callback Resilience in `CountUpValue`
When `CountUpValue` receives strings that cannot be animated (e.g. `"—"` or `"0%"` without prefix), the animation loop must still invoke `onComplete`:

```ts
const { prefix, num, suffix, hasComma } = parseValue(value.toString());
if (isNaN(num)) {
  onComplete?.();
  return;
}
```

---

## 6. Codebase Hygiene & Zero-Warning Standards

### 6.1 Unused Variable Elimination (`TS6133`)
1. **`isCountDone` in `DashboardCards.tsx`:** When the trend was un-gated from the main number animation to prevent display lag on non-numeric cards, `isCountDone` was left unread. We stripped `useState`, `useCallback`, and `handleCountComplete`.
2. **`numAmount` in `useWalletsAction.ts`:** `calculateWalletConversions` returned `{ numAmount, formattedUsd }`, but `totalNum` was used instead. We removed `numAmount` from destructuring.

Result: 100% clean build via `yarn build` with 0 warnings or compiler errors.

---

## 7. Verification Matrix

| Area | Test Scenario | Expected Outcome | Verification Status |
| :--- | :--- | :--- | :--- |
| **Root Sync** | Mount `Layout.tsx` | `useWalletStore` & `useFiatBalanceStore` populated | Passed |
| **Invalidation** | Invoke `useInvalidateDashboard()` | Refetches balances, wallets, payouts, and overview in parallel | Passed |
| **Equilibrium** | `trend: "0%"` or `"+0%"` | Arrow hidden, neutral gray `#71717A`, renders clean `0%` | Passed |
| **Directional** | `trend: "+8%"` | `FaArrowUp` rendered, green `#22C55E` | Passed |
| **Directional** | `trend: "-4%"` | `FaArrowDown` rendered, red `#FF3B30` | Passed |
| **TypeScript** | `yarn build` | 0 compiler errors across all 1689 modules | Passed |
