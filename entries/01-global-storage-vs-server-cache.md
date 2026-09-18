# Global Storage vs. Server State Cache

One of the most critical architectural decisions in large-scale React applications is establishing the boundary between **Server State (TanStack Query)** and **Global Client State (Zustand)**.

---

## The 3-Tier State Taxonomy

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Server State (TanStack Query)                                       │
│    • Remote ownership (source of truth is the database/API)            │
│    • Asynchronous fetching, caching, deduping, and revalidation        │
│    • Examples: Transactions, Deposits, Webhooks, Withdrawals, Rates    │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. Global Client State (Zustand)                                       │
│    • Client-owned, shared across unrelated component trees            │
│    • Synchronous, persistent across route transitions                  │
│    • Examples: Selected row in a drawer, Multi-step wizard drafts,     │
│      Active environment (Live/Test), One-time signing secrets          │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. Ephemeral Local State (React useState / useReducer)                 │
│    • Single-component scope (dies when component unmounts)             │
│    • Dropdown open/close, hovered card, local input focus              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Why Global Storage (Zustand) IS Needed

Global state management is essential when data satisfies any of the following criteria:

### 1. Cross-Hierarchy Consumer Disparity
When state is needed simultaneously across deeply nested, unrelated parts of the component tree without direct parent-child relationships.

* **Merchant Environment & Permissions (`/me` via `useMerchantStore`)**:
  - The top `Navbar` needs the merchant profile to render the `Live` vs. `Test` badge and company initials.
  - The `Sidebar` needs `allows_crypto_payouts` to conditionally render navigation links to crypto payout screens.
  - Payout modals nested 5 layers deep need `settlement_currency` to format amounts in `GHS`.
  - Passing this context through intermediate components creates brittle prop drilling. Storing the active profile in `useMerchantStore` gives every component direct, reactive access.

* **Dual Fiat Balances (`/balances` via `useFiatBalanceStore`)**:
  - Bitnormous separates funds into **Prepaid** (used to fund buys and collections) and **Withdrawable** (holding sales proceeds and funding payouts).
  - The balance pill in the header, dashboard revenue cards, and transfer modal all display these numbers. A payout submitted inside a modal must instantly reflect in the header balance without re-fetching entire pages.

### 2. Multi-Step Transaction Wizards & Draft Persistence
Complex financial operations require multi-step flows:
1. `TransferPayoutFormStep` (enter amount, choose Mobile Money network)
2. `TransferPayoutConfirmStep` (name enquiry resolution, fee summary)
3. `TransferPayoutAuthStep` (2FA / PIN verification)
4. `TransferPayoutReceiptStep` (download PDF receipt)

If a merchant accidentally closes the modal or switches tabs to copy a phone number, standard React state (`useState`) is discarded. Using draft state stores (`useWithdrawalStore`, `useFiatPayoutStore`, `useTransferStore`, `useQuoteStore`) ensures inputs, locked quote IDs, and recipient selections persist.

### 3. Decoupled Inspection Drawers and Detail Modals
In data-heavy dashboards, tables often have 25–50 rows per page. Clicking "View Details" opens a slide-over drawer (e.g. `TransactionDetailModal`, `WalletTransactionDetailDrawer`).
- Storing `selectedTransaction: T | null` in Zustand allows any table row component to trigger `setSelectedTransaction(row)`.
- The drawer component at the root of the layout listens only to `selectedTransaction`, completely decoupled from the table component.

### 4. Write-Once Ephemeral Security Secrets
When creating a webhook (`POST /webhooks`) or rotating its signing secret (`POST /webhooks/:id/rotate-secret`), the server returns the signing secret (`whsec_...`) **exactly once**.
- It is never returned in subsequent `GET /webhooks` calls.
- Storing `recentSecret` in `useWebhookStore` allows the "Copy Your Webhook Secret" modal to display the secret immediately, and clear it as soon as the modal is dismissed, preventing it from ever touching persistent local storage.

---

## Why Global Storage is NOT Needed for Raw Endpoint Data

Mirroring raw API collections (like deposit lists, withdrawal tables, or webhook logs) directly into Zustand is an anti-pattern.

### 1. Server State Already Has a Cache Engine: TanStack Query
TanStack Query provides built-in mechanisms that would have to be manually re-engineered in Zustand:
- **Key-Based Pagination**: `['withdrawals', { page: 2, status: 'completed' }]` keeps each page cached independently. In Zustand, maintaining an array of pages requires complex index math and deduplication.
- **Automatic Garbage Collection**: Unused query cache data is cleaned up after `gcTime`.
- **Request Deduplication**: Two components mounting on the same screen calling `useWithdrawalsAction()` make only **one** network request.
- **Stale-While-Revalidate**: Consumers instantly receive cached data while TanStack Query validates fresh records in the background.

### 2. TTL-Bound Volatile Rates vs. Stale Global States
Quotes (`/quotes/:id`, `/swaps/quotes`) and indicative rates (`/rates`) have strict validity windows (15 to 60 seconds).
- Storing rates in a static global store leads to stale exchange rates being rendered to merchants.
- TanStack Query allows fine-tuned polling intervals (`refetchInterval: 5000`) that stop automatically when the quote is `consumed` or `expired`.

### 3. Preventing App-Wide Render Cascades
When a global store updates an array with 100 ledger rows, every component subscribed to that store without fine-grained selector equality (`useStore(s => s.transactions)`) re-renders. Keeping raw tabular server state inside scoped TanStack Query hooks confines re-renders strictly to the component that requested that page.
