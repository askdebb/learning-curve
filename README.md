# Learning Curve: Engineering Knowledge Base

Welcome to the **Learning Curve** repository. This is an independent, cross-project engineering archive that documents technical decisions, architectural trade-offs, security models, and deep-dive code patterns established across all development sessions.

---

## Index of Topics & Architectures

| Date | Topic / Domain | Primary Technologies | Entry Link |
|---|---|---|---|
| **Sep 2026** | **Next Payouts Metric Modeling & Plain-Language FinTech Architecture** | React 19, TypeScript, TanStack Query v5, FinTech UX | [next-payouts-metric-modeling-and-plain-english-fintech.md](./entries/next-payouts-metric-modeling-and-plain-english-fintech.md) |
| **Sep 2026** | **Enterprise Authentication Architecture & Security Hardening** | React, TanStack Query, Yup, Tailwind CSS | [authentication-architecture.md](./entries/authentication-architecture.md) |
| **Sep 2026** | **Crypto Stepper State Persistence, Socket Lifecycle, & Push Notifications** | React 19, Zustand (Persist), Laravel Echo, Web Notifications API | [checkout-stepper-and-notifications.md](./entries/checkout-stepper-and-notifications.md) |
| **Sep 2026** | **Bitnormous Merchant API Architecture, Render Protection & State Taxonomy** | React 19, TypeScript, TanStack Query v5, Zustand, Axios | [merchant-api-state-architecture.md](./entries/merchant-api-state-architecture.md) |

---

## How This Knowledge Base Works

Whenever a complex feature, bug fix, or architectural refactor is completed in any project, it is distilled into this central archive.

### Wildcard Trigger
To automatically generate or update an entry in this knowledge base, simply append or include the wildcard command in your prompt:

`	ext
lc: <topic-name>
`
*or*
`	ext
doc: <topic-name>
`

**Examples:**
- lc: payment-gateway-webhook-idempotency
- doc: realtime-order-sync-websockets
- lc: multi-tenant-role-rbac

### Standard Entry Template
Each entry in entries/ adheres to a strict 5-part engineering anatomy:
1. **What Was at Stake**: Context, pain points, performance bottlenecks, and security liabilities.
2. **Options Evaluated**: Trade-off matrix comparing alternative technical approaches.
3. **The Chosen Solution & Rationale**: Why a specific path was selected.
4. **Step-by-Step Implementation & Code Snippets**: Production-ready, copy-pasteable snippets.
5. **Learning Resources & Authoritative References**: Links to official RFCs, OWASP guides, and deep-dive documentation.
