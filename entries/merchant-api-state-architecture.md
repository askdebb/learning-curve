# Learning Curve: Bitnormous Merchant API Architecture, Render Protection & State Taxonomy

> **Domain:** Financial Frontend Architecture, API Orchestration & Performance  
> **Reference Projects:** `business-bitnormous-merchant`  
> **Technologies:** React 19, TypeScript, TanStack Query v5, Zustand, Axios  
> **Type:** Architectural Standard & State Boundary Framework  

---

## 1. What Was at Stake

When building an enterprise financial dashboard connecting to over **50 backend endpoints across 14 operational domains** (Merchant Profile, Platform Rates, Quotes, Ramp Orders, Balances, Transfers, Deposits, Payouts, Custody Wallets, Crypto Deposits, Withdrawals, Swaps, Recipients, and Webhooks), frontend architecture can easily degrade into one of two fatal anti-patterns:

1. **The Re-render Cascade Catastrophe**:  
   Wrapping TanStack Query (`useQuery`, `useMutation`) in custom hooks without strict callback and selector memoization causes consumer components to re-render uncontrollably. Inline callbacks passed from parents break identity equality, triggering infinite `useEffect` loops. Unmemoized helper functions passed down to tables with 50+ rows force entire subtrees to re-render on every background query refresh.
2. **State Storage Ambiguity & Cache Duplication**:  
   Teams frequently confuse **Server State** with **Global Client State**. Developers either put *everything* into global stores (e.g. duplicating paginated transaction tables into Zustand, manually reinventing pagination, deduplication, and caching) or put *everything* into query cache (forcing brittle prop-drilling for active environment flags, wizard drafts, and drawer selections).
3. **Loss of Draft State in Multi-Step Financial Wizards**:  
   Complex flows like Crypto Withdrawals, Mobile Money Payouts, and Balance Swaps span multiple validation steps (Account Resolution &rarr; Fee Estimation &rarr; 2FA PIN &rarr; Receipt). If state resides purely in ephemeral component state (`useState`), switching browser tabs or accidentally closing a modal resets the entire wizard, destroying user progress and invalidating rate-locked quotes.
4. **Security Vulnerability: Leaking One-Time Webhook Signing Secrets**:  
   When registering a new webhook endpoint or rotating secrets, the server emits the raw signing secret (`whsec_...`) **exactly once**. Storing it in persistent local storage creates a critical security liability, while storing it in ephemeral local component state causes it to vanish if the modal closes prematurely.

---

## 2. Architectural Options Evaluated

### Option A: Server State vs. Global Client State Storage

| Strategy | How It Operates | Pros | Cons | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **Zustand Monolith (Store All API Data)** | Every API response is dispatched into a global Zustand store; components read solely from Zustand. | Familiar Redux-style single store pattern. | Re-invents caching, garbage collection, and pagination math. Dispatches with large arrays trigger app-wide re-render cascades. Stales rapidly. | **REJECTED** |
| **TanStack Query Pure (No Global Stores)** | All data stays in TanStack Query cache; UI states and drafts are passed via props or context. | Zero state duplication; automatic cache invalidation and background revalidation. | Brittle prop-drilling (5+ layers deep). Wizard draft inputs are discarded on unmount. Drawer state is tightly coupled to table rows. | **REJECTED** |
| **3-Tier State Taxonomy (Hybrid Separation)** | **Tier 1 (Server State):** TanStack Query manages all remote API data.<br>**Tier 2 (Global Client State):** Zustand manages wizard drafts, active row selection, cross-hierarchy environment context, and write-once secrets.<br>**Tier 3 (Ephemeral State):** React `useState` handles single-component UI toggles. | Clean separation of concerns. Zero redundant cache engines. High performance with scoped re-renders. Maximum draft persistence. | Requires clear architectural guidelines across the engineering team. | **CHOSEN** |

### Option B: Render Protection in Custom Action Hooks

| Strategy | Implementation | Trade-Off & Performance Impact | Verdict |
| :--- | :--- | :--- | :--- |
| **Naive Direct Return** | Return raw `useQuery` object directly with inline helper methods and unmemoized arrays. | `query.data?.data ?? []` creates a new array reference on every render cycle. Child components wrapped in `React.memo` re-render continuously. | **REJECTED** |
| **Inline Callbacks in Dependencies** | Place `successCallback` and `errorCallback` directly in `useEffect` dependency arrays. | If consumer component provides an inline arrow function (`() => ...`), hook triggers **infinite re-render loops**. | **REJECTED** |
| **The Three Pillars of Render Protection** | **1. Mutable `useRef`:** Decouples callback execution from dependency arrays.<br>**2. Stable `useMemo`:** Keeps extracted arrays and metadata reference-identical.<br>**3. Memoized `useCallback`:** Guarantees converter and selector helpers never change identity. | Zero re-render thrashing. Complete protection against consumer inline functions. Predictable reference equality. | **CHOSEN** |

### Option C: API Client & Parameter Sanitization Layer

| Strategy | How It Operates | Trade-Off & Verdict |
| :--- | :--- | :--- |
| **Raw Axios Calls Inside Hooks** | Each TanStack hook invokes `axios.get('/api/...')` directly with manual headers. | Duplicates base URLs, token injection, and error interceptors across 50 hooks. **REJECTED**. |
| **Base Controller Pattern with Pure Param Cleaner** | Dedicated domain controllers extending base `Controller` with `this.http.withApiKey()`. Query objects pass through pure helper `cleanQueryParams(params)` stripping `null`, `undefined`, and `""`. | Clean single-responsibility separation. 100% DRY authorization headers. URLs never polluted with `?status=undefined&asset=`. **CHOSEN**. |

---

## 3. The Chosen Solution & Rationale

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Server State (TanStack Query Cache)                                 │
│    • Remote ownership (API is single source of truth)                  │
│    • Asynchronous fetching, key-based caching, deduplication, SWR      │
│    • Examples: Transactions, Deposits, Webhooks, Withdrawals, Rates    │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. Global Client State (Zustand Stores)                                │
│    • Client-owned, shared across unrelated component trees            │
│    • Synchronous, persistent across route transitions                  │
│    • Examples: Active Drawer row, Multi-step wizard drafts,            │
│      Merchant Environment (Live/Test), Write-once signing secrets      │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. Ephemeral Local State (React useState / useReducer)                 │
│    • Component-scoped (dies when component unmounts)                   │
│    • Dropdown open/close, hover tooltips, local form inputs            │
└────────────────────────────────────────────────────────────────────────┘
```

### Why Global Storage (Zustand) IS Needed

1. **Cross-Hierarchy Context Disparity**:  
   - `useMerchantStore`: The top `Navbar` renders the `Live` vs. `Test` badge; the `Sidebar` needs `allows_crypto_payouts` to conditionally show links; nested payout modals need `settlement_currency` to format GHS amounts. Storing the merchant profile globally eliminates 5-layer prop drilling.
   - `useFiatBalanceStore`: Bitnormous partitions fiat balances into **Prepaid** (funds buys and collections) and **Withdrawable** (holds payout proceeds). Balance pills in the header, dashboard revenue widgets, and transfer drawers must update simultaneously.
2. **Multi-Step Transaction Wizard Draft Persistence**:  
   - `useWithdrawalStore` and `useFiatPayoutStore`: Entering amounts, resolving Mobile Money account names, calculating network fees, and verifying 2FA OTP codes requires 4 discrete steps. Zustand draft stores preserve inputs even if the merchant accidentally closes the dialog or switches tabs.
3. **Decoupled Inspection Drawers**:  
   - Tables with 50 rows per page click "View Details" to open slide-over drawers (`TransactionDetailModal`, `WalletTransactionDetailDrawer`). Storing `selectedTransaction: T | null` in Zustand completely decouples drawer rendering from table row lifecycles.
4. **Write-Once Ephemeral Security Secrets**:  
   - `useWebhookStore`: Rotating or creating webhook signing secrets returns `whsec_...` once. Storing `recentSecret` in Zustand displays it in the confirmation dialog without persisting sensitive credentials to localStorage.

### Why Global Storage is NOT Needed for Raw Endpoint Data

1. **TanStack Query is Already a High-Performance Cache Engine**:  
   Query keys like `['withdrawals', { page: 2, status: 'completed' }]` cache each page independently. Storing this in Zustand requires manual pagination algorithms, index deduplication, and cache invalidation logic.
2. **TTL-Bound Volatile Rates vs. Stale Global State**:  
   Quotes (`/quotes/:id`) and indicative rates (`/rates`) expire in 15 to 60 seconds. TanStack Query's `refetchInterval` and `staleTime` automatically poll and expire queries, preventing outdated rates.
3. **Preventing App-Wide Render Cascades**:  
   Updating a 100-row ledger array in Zustand forces every component subscribed to the store to re-evaluate. Keeping raw collections in scoped TanStack hooks restricts renders strictly to the active table.

---

## 4. Step-by-Step Implementation & Code Snippets

### 4.1 Layer 1: Parameter Sanitizer & Domain Controller

```typescript
// src/helpers/apiParams.ts
export function cleanQueryParams<T extends Record<string, any>>(params?: T): Record<string, any> | undefined {
  if (!params) return undefined;
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      cleaned[key] = value;
    }
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}
```

```typescript
// src/controllers/MerchantController.ts
import Controller from "./Controller";
import { MerchantResponse } from "../interfaces/MerchantInterface";

export class MerchantController extends Controller {
  async getAuthenticatedMerchant(): Promise<MerchantResponse> {
    return this.http.withApiKey().get<MerchantResponse>("/me");
  }
}

export default new MerchantController();
```

### 4.2 Layer 2: Custom Hook with the Three Pillars of Render Protection

```typescript
// src/actions/platform/useIndicativeRatesAction.ts
import { useQuery } from "@tanstack/react-query";
import { useRef, useEffect, useMemo, useCallback } from "react";
import PlatformController from "../../controllers/PlatformController";
import { IndicativeRatesData } from "../../interfaces/PlatformInterface";

export const useIndicativeRatesAction = (
  successCallback?: (data: IndicativeRatesData) => void,
  errorCallback?: (error: any) => void,
) => {
  // Pillar 1: Mutable Refs for Callbacks (Decouples identity from useEffect)
  const successRef = useRef(successCallback);
  successRef.current = successCallback;

  const errorRef = useRef(errorCallback);
  errorRef.current = errorCallback;

  const query = useQuery({
    queryKey: ["platform", "rates"],
    queryFn: () => PlatformController.getIndicativeRates(),
    staleTime: 1000 * 30, // 30s volatile pricing window
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    if (query.isSuccess && query.data?.data) {
      successRef.current?.(query.data.data);
    }
  }, [query.isSuccess, query.data]);

  useEffect(() => {
    if (query.isError && query.error) {
      errorRef.current?.(query.error);
    }
  }, [query.isError, query.error]);

  // Pillar 2: Stable Reference Extraction via useMemo
  const rates = useMemo(() => query.data?.data?.rates ?? {}, [query.data?.data?.rates]);
  const fiat = useMemo(() => query.data?.data?.fiat ?? "GHS", [query.data?.data?.fiat]);

  // Pillar 3: Memoized Selector & Conversion Helpers via useCallback
  const getBuyRate = useCallback((asset: string): string | null => rates[asset]?.buy ?? null, [rates]);
  const getSellRate = useCallback((asset: string): string | null => rates[asset]?.sell ?? null, [rates]);

  const convertCryptoToFiat = useCallback(
    (asset: string, amount: number | string): string => {
      const rate = getSellRate(asset);
      if (!rate) return "0.00";
      const numRate = parseFloat(rate);
      const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
      if (isNaN(numRate) || isNaN(numAmount)) return "0.00";
      return (numAmount * numRate).toFixed(2);
    },
    [getSellRate]
  );

  return { ...query, rates, fiat, getBuyRate, getSellRate, convertCryptoToFiat };
};
```

### 4.3 Layer 3: Zustand Global Store for Wizard Drafts & Ephemeral Secrets

```typescript
// src/store/useWebhookStore.ts
import { create } from "zustand";
import { WebhookItem } from "../interfaces/WebhookInterface";

interface WebhookState {
  selectedWebhook: WebhookItem | null;
  setSelectedWebhook: (webhook: WebhookItem | null) => void;
  recentSecret: string | null;
  setRecentSecret: (secret: string | null) => void;
  clearRecentSecret: () => void;
}

export const useWebhookStore = create<WebhookState>((set) => ({
  selectedWebhook: null,
  setSelectedWebhook: (webhook) => set({ selectedWebhook: webhook }),
  recentSecret: null,
  setRecentSecret: (secret) => set({ recentSecret: secret }),
  clearRecentSecret: () => set({ recentSecret: null }),
}));
```

---

## 5. Comprehensive 50-Endpoint to Component Mapping

The following matrix documents all 50 Bitnormous Merchant API endpoints across 14 domains, mapping each endpoint to its consuming components and architectural rationale:

| Domain | Endpoint & Method | Consuming Components | Architectural & UX Justification |
| :--- | :--- | :--- | :--- |
| **Merchant** | `GET /me` | `Navbar.tsx`, `Sidebar.tsx`, `Settings.tsx` | Renders identity, manages `Live` vs. `Test` mode, and evaluates `allows_crypto_payouts`. |
| **Platform** | `GET /assets` | `WalletWithdrawInputStep.tsx`, `CounterQRGenerator.tsx` | Custody capability matrix: supported chains, confirmation requirements, withdrawal minimums. |
| **Platform** | `GET /rates` | `DashboardCards.tsx`, `WalletDigitalCard.tsx` | Indicative buy/sell rates for live fiat/crypto conversion widgets. |
| **Platform** | `GET /fiat/networks` | `TransferPayoutFormStep.tsx`, `AddCustomerModal.tsx` | Loads Mobile Money networks (MTN, Telecel, AirtelTigo) and account prefix validation. |
| **Platform** | `POST /fiat/resolve` | `TransferPayoutConfirmStep.tsx`, `AddCustomerModal.tsx` | Instant recipient name enquiry before dispatching funds. |
| **Quotes** | `POST /quotes` | Ramp Modals, `CounterQRGenerator.tsx` | Locks exchange rates for on-ramp/off-ramp flows returning `quote_id` and TTL. |
| **Quotes** | `GET /quotes/:id` | Quote Countdown Timer | Polls quote status (`active`, `consumed`, `expired`). |
| **Ramp Orders** | `POST /ramp-orders` | Checkout Payment Flow | Executes locked quote into active merchant order. |
| **Ramp Orders** | `GET /ramp-orders` | `src/pages/Transactions.tsx` | Paginated ramp orders table with status filtering. |
| **Ramp Orders** | `GET /ramp-orders/:id` | `TransactionDetailModal.tsx` | Full order audit breakdown and destination addresses. |
| **Ramp Orders** | `GET /ramp-orders/:id/events` | `TransactionDetailModal.tsx` | Lifecycle timeline (`awaiting_deposit` &rarr; `confirming` &rarr; `settling`). |
| **Ramp Orders** | `POST /ramp-orders/:id/cancel` | `TransactionDetailModal.tsx` | Cancels orders pending payment. |
| **Balances** | `GET /balances` | `Navbar.tsx`, `DashboardCards.tsx` | Dual fiat balances: **Prepaid** (funding) and **Withdrawable** (proceeds). |
| **Transfers** | `POST /transfers` | Bucket Sweep Modal | Atomic transfer between Prepaid and Withdrawable balances without bank rails. |
| **Transfers** | `GET /transfers` | `Transactions.tsx` | Audit log of internal bucket sweeps. |
| **Fiat Deposits** | `POST /fiat/deposit-instructions`| Top-Up Modal | Generates dynamic account and reference instructions for fiat deposits. |
| **Fiat Deposits** | `GET /fiat/deposits` | Top-Up History Tab | History of bank/MoMo deposits and confirmation states. |
| **Fiat Payouts** | `POST /fiat/payouts` | `TransferPayoutFormStep.tsx` | Debits withdrawable balance and dispatches Mobile Money/bank payout. |
| **Fiat Payouts** | `GET /fiat/payouts` | `Transactions.tsx` | Payout history table with delivery rail statuses. |
| **Custody Wallets** | `GET /wallets` | `WalletsCardList.tsx`, `Wallets.tsx` | Available, locked, and total crypto balances across all assets. |
| **Custody Wallets** | `GET /wallets/:asset` | `WalletDetailPage.tsx` | Granular balance for a single asset. |
| **Deposit Addresses** | `POST /wallets/:asset/addresses`| Receive Crypto Modal | Allocates permanent address tied to a merchant customer reference. |
| **Deposit Addresses** | `GET /wallets/:asset/addresses` | Customer Addresses Table | Lists all generated standing deposit addresses. |
| **Crypto Deposits** | `GET /crypto-deposits` | `WalletTransactionsTable.tsx` | On-chain deposit confirmations monitoring. |
| **Withdrawals** | `GET /withdrawals/fee` | `WalletWithdrawInputStep.tsx` | Real-time network fee calculation as user inputs amount. |
| **Withdrawals** | `POST /withdrawals` | `WalletWithdrawConfirmStep.tsx` | Submits on-chain withdrawal with idempotency protection. |
| **Withdrawals** | `GET /withdrawals` | `WalletTransactionsTable.tsx` | Paginated withdrawal table with transaction hashes. |
| **Withdrawals** | `POST /withdrawals/:id/cancel` | `WalletTransactionDetailDrawer.tsx` | Cancels un-broadcast withdrawals, refunding locked balances. |
| **Swaps** | `POST /swaps/quotes` | Swap Currency Drawer | Locks conversion rate between crypto custody and fiat balances. |
| **Swaps** | `POST /swaps` | Swap Execution Step | Executes atomic balance-held swap. |
| **Swaps** | `GET /swaps` | Swap History Tab | Lists completed conversions and exchange rates. |
| **Recipients** | `POST /recipients` | `AddCustomerModal.tsx` | Saves validated crypto addresses or MoMo accounts to address book. |
| **Recipients** | `GET /recipients` | Recipient Picker in Payouts | Address book lookup filtered by transfer rail. |
| **Recipients** | `DELETE /recipients/:id` | Address Book Actions | Revokes recipient allowlist status. |
| **Ledger** | `GET /transactions` | `src/pages/developer/Transactions.tsx` | Append-only financial ledger with `balance_after` audit checks. |
| **Webhooks** | `GET /webhooks` | `src/pages/developer/Webhooks.tsx` | Lists registered endpoints and health metrics. |
| **Webhooks** | `POST /webhooks` | Register Webhook Modal | Registers endpoint and displays write-once signing secret. |
| **Webhooks** | `PATCH /webhooks/:id` | Edit Webhook Drawer | Updates endpoint URL, topics, and active state. |
| **Webhooks** | `POST /webhooks/:id/test` | Webhook Toolbar | Sends live test event verifying merchant receiver pipeline. |
| **Webhooks** | `POST /webhooks/:id/rotate-secret`| Secret Management Dialog | Rotates signing secret with one-time display. |
| **Webhooks** | `GET /webhooks/:id/deliveries`| Delivery Logs Drawer | Inspects HTTP response status codes and retry schedules. |
| **Webhooks** | `DELETE /webhooks/:id` | Webhook Toolbar | Unregisters webhook endpoint. |

---

## 6. Learning Resources & Authoritative References

- **TkDodo's Practical React Query Series**: [Practical React Query](https://tkdodo.eu/blog/practical-react-query) — *Deep dive on query keys, selectors, and separating client vs. server state.*
- **TanStack Query v5 Architecture Guides**: [Important Defaults & Render Optimizations](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
- **Zustand Documentation**: [Flux-Inspired State Management & Selector Equality](https://zustand.docs.pmnd.rs/guides/auto-generating-selectors)
- **React 19 Identity Equality & Memoization**: [React Reference Overview](https://react.dev/reference/react)
- **OWASP API Security Top 10**: [Sensitive Data Exposure & Secret Rotation Best Practices](https://owasp.org/www-project-api-security/)
