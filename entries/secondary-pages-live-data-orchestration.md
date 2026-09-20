# Secondary Pages Live Data Orchestration: Customer Reconciliation & Unified Audit Trail

## Overview & Architectural Context

In modern fintech platforms, not every administrative view maps one-to-one with a single backend database table. In Bitnormous Merchant, two critical secondary views—**Customers** and **Audit Logs**—historically relied on static mock arrays (`paymentData.ts`) during early UI prototyping. 

To transition these views into production-grade, enterprise operational tools without requiring breaking modifications to the backend service contracts, we engineered a client-side **Multi-Stream Event Aggregation and Reconciliation Architecture**.

---

## 1. Customers Orchestration (`useCustomersData`)

### The Challenge
The merchant gateway does not maintain an isolated, mutable `/customers` CRUD endpoint. Instead, merchant-customer relationships emerge from two primary transactional sources:
1. **Checkout Session Payloads** (`GET /user/businesses/{id}/payments`): Direct customer details captured during hosted checkout flows (`customer: { name, email, reference }`).
2. **Saved Address Book Recipients** (`GET /user/businesses/{id}/recipients`): Counterparties and accounts saved for payouts and recurring transfers (`account_name`, `label`, `channel`, `account`).
3. **Client-Registered Customers**: Ad-hoc counterparty additions initiated directly by merchant staff via the "Add Customer" modal.

### The Solution: Deduplication & Normalization
The `useCustomersData` custom React hook unifies these three sources into a deduplicated, cohesive customer directory:

1. **Extraction & Deduplication**:
   - Iterates through live checkout sessions. If customer details exist, an ID is minted from the customer's email or fallback reference.
   - Iterates through saved payout recipients, matching or appending new entries.
   - Reads persisted client additions from `localStorage` under the key `bitnormous_custom_customers_{businessId}`.
2. **Field Fallbacks**:
   - `fullName`: Uses customer name, recipient account name, or the mailbox prefix of their email.
   - `email`: Uses customer email or defaults to a clean placeholder (`"N/A"`).
   - `phone`: Maps phone or recipient account address.
   - `addedOn`: Formats UTC creation timestamp into a human-friendly date (`"MMM dd, yyyy"`).
3. **Local Mutation Persistence**:
   - Providing `addCustomer(customer)` seamlessly saves to `localStorage` and triggers reactive query state re-evaluation.

---

## 2. Audit Trail Synthesis (`useAuditLogsData`)

### The Challenge
Enterprises require an auditable trail of administrative and transactional actions. In high-velocity payments infrastructure, system activities originate across distributed micro-events:
- Webhook delivery attempts to merchant servers.
- Checkout session creation, payment state transitions, and expirations.
- Internal ledger credits, debit payouts, and settlement adjustments.
- Team member permissions, role updates, and organizational changes.

### The Solution: Multi-Stream Event Chronicle
Rather than waiting for a centralized audit microservice, `useAuditLogsData` queries and normalizes four real-time reactive streams:

| Stream | Hook / Action | Event Synthesized | Status Representation |
| :--- | :--- | :--- | :--- |
| **Webhooks** | `useDeliveries` | Event dispatch attempt to merchant endpoints | `succeeded`, `pending`, `failed` with HTTP status |
| **Orders** | `usePayments` | Checkout session creation, status lifecycle | `open`, `processing`, `completed`, `expired` |
| **Ledger** | `useLedgerTransactionsAction` | Settlement credits, payout debits, fees | Direction (`credit` / `debit`), amount, currency, bucket |
| **Team Access** | `useMembers` | Team member role bindings and invitations | Member name/email, assigned role (`admin`, `dev`, etc.) |

### Chronological Sorting & Detail Inspection
Every event is assigned an internal epoch timestamp `timestamp: number` and a human-readable activity description. The synthesized array is sorted in strict descending order (newest activity first). 

Selecting any row in the `DataTableCard` opens a slide-over inspection drawer showing the exact timestamp, structured details, and raw JSON context for security audits.

---

## 3. Mock Data Elimination

All references to static mocks have been eliminated from production pathways:
- **`dashboardData.ts`**: Stripped of `dashboardMockData`, `dashboardMockDataDevMode`, `revenueViews`, and mock success rates. Only TypeScript interfaces are preserved.
- **`SuccessRateChart.tsx`**: Stripped of `successRateDevMode` fallback.
- **`Customers.tsx`**: Disconnected from `paymentData.ts`, wired directly to `useCustomersData()`.
- **`AuditLogs.tsx`**: Disconnected from `paymentData.ts`, wired directly to `useAuditLogsData()`.

When collections are loading or empty, pages render skeleton placeholder rows or descriptive zero-data states, ensuring a responsive user experience.
