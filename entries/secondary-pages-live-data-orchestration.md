# Secondary Pages Live Data Orchestration: Customer Reconciliation & Unified Audit Trail

## Overview & Architectural Context

In modern fintech platforms, not every administrative view maps one-to-one with a single backend database table. In Bitnormous Merchant, two critical secondary views—**Customers** and **Audit Logs**—historically relied on static mock arrays (`paymentData.ts`) during early UI prototyping. 

To transition these views into production-grade, enterprise operational tools without requiring breaking modifications to the backend service contracts, we engineered a client-side **Multi-Stream Event Aggregation and Reconciliation Architecture**, eliminated redundant manual `localStorage` calls in favor of a persistent **Zustand Store**, and elevated loading and inspection states to enterprise UI standards.

---

## 1. Customers Orchestration & Zustand Store (`useCustomerStore`)

### The Architectural Question: Why Not Direct `localStorage`?
When an application already uses **Zustand** as its primary client-side state manager, writing manual `localStorage.getItem()`, `localStorage.setItem()`, and `JSON.parse()` routines inside React component hooks is an anti-pattern:
1. **Loss of Reactivity**: Changes written to `localStorage` do not automatically cause other components or hooks subscribed to that key to re-render without manual custom event listeners (`window.addEventListener('storage')`).
2. **Boilerplate & Deserialization Vulnerability**: Manually parsing JSON strings inside `useEffect` or `useState` initializers requires defensive `try/catch` wrappers and creates hydration drift between tabs or business switcher switches.
3. **State Centralization**: By defining a dedicated Zustand store with the official `persist` middleware, persistence is handled declaratively behind the scenes, while components enjoy granular selector-based reactive subscriptions:

```typescript
export const useCustomerStore = create<CustomerStoreState>()(
  persist(
    (set) => ({
      customCustomers: {},
      addCustomCustomer: (businessId, customerInput) =>
        set((state) => {
          const key = String(businessId);
          const list = state.customCustomers[key] || [];
          const newCustomer: CustomerRow = {
            ...customerInput,
            id: `cus-${Date.now()}`,
            addedOn: formatDisplayDate(),
          };
          const filtered = list.filter(
            (c) =>
              !c.email ||
              !customerInput.email ||
              c.email.trim().toLowerCase() !== customerInput.email.trim().toLowerCase()
          );
          return {
            customCustomers: {
              ...state.customCustomers,
              [key]: [newCustomer, ...filtered],
            },
          };
        }),
    }),
    {
      name: "bitnormous-customer-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### The Three-Source Customer Reconciliation Pipeline
The `useCustomersData` custom React hook unifies three distinct transactional streams into a deduplicated, cohesive directory:
1. **Checkout Session Payloads** (`GET /user/businesses/{id}/payments`): Real customers captured during hosted checkout sessions (`customer: { name, email, reference }`).
2. **Saved Address Book Recipients** (`GET /user/businesses/{id}/recipients`): Saved counterparties and bank/mobile-money accounts.
3. **Zustand Persisted Customers**: Registered directly by merchant operators via the "Add Customer" modal.

---

## 2. Professional Skeleton Design vs. Raw Text Placeholders

### Eliminating `"Loading..."` Text Placeholders
Rendering rows with raw text strings like `time: "Loading..."` and `activity: "Loading activity..."` breaks visual hierarchy, shifts layout widths during network requests, and degrades user confidence.

Instead, enterprise data tables employ **Column-Proportional Pulsing Skeletons**:
- **Timestamp Column**: Fixed-width pulsing block (`w-28` to `w-32`) matching the natural aspect ratio of dates.
- **Activity Column**: Fluid, alternating sentence-length pulsing bars (`w-4/5 max-w-lg` alternating with `w-3/5 max-w-md`) simulating natural paragraph sentences.
- **Configurable `skeletonClassName`**: Columns in `DataTableCard` now support explicit skeleton overrides for exact layout fidelity.

---

## 3. Audit Trail Multi-Stream Synthesis & Interactive Telemetry Inspector

### Real-Time Micro-Event Synthesis
Rather than waiting for a heavy centralized audit logging microservice, `useAuditLogsData` queries and normalizes four real-time reactive streams:

| Stream | Hook / Action | Event Synthesized | Status Representation |
| :--- | :--- | :--- | :--- |
| **Webhooks** | `useDeliveries` | Event dispatch attempt to merchant endpoints | `succeeded` (HTTP 200), `pending`, `failed` |
| **Orders** | `usePayments` | Checkout session creation, status lifecycle | `open`, `processing`, `completed`, `expired` |
| **Ledger** | `useLedgerTransactionsAction` | Settlement credits, payout debits, fees | Direction (`credit` / `debit`), amount, currency, bucket |
| **Team Access** | `useMembers` | Team member role bindings and invitations | Member name/email, assigned role (`admin`, `dev`, etc.) |

### Professional Telemetry Inspector (`AuditLogDetailInspector`)
Selecting any audit log in the chronicle transitions the inspection deck into a rich, interactive forensic console:
1. **Category Pills with Semantic Icons**:
   - `FaBolt` Indigo Pill: Webhook Dispatch
   - `FaCartShopping` Emerald Pill: Checkout Session
   - `FaWallet` Amber Pill: Ledger Settlement
   - `FaUserShield` Purple Pill: Access Control
2. **Status Indicator with Pulse**: Real-time status badges (`HTTP 200 OK`, `In Progress`, `Failed`) with animated glowing dots.
3. **Copyable Telemetry Specifications**: One-click clipboard copy for event IDs and target entity references with visual checkmark confirmation.
4. **Tabbed Inspector**:
   - **Structured Properties**: Key-value metadata table displaying balance after, bucket allocation, delivery attempts, and references.
   - **Raw JSON Console**: Formatted monospace payload viewer with a dedicated "Copy JSON" action for audit exports.
5. **Intuitive Empty State**: When no log is selected, renders a centered audit shield illustration with clear instructions to click any table row to inspect.

---

## 4. Verification & Clean Build

All components passed strict TypeScript compilation (`tsc -b`) and Vite production bundling with **0 errors**.
