# Next Payouts Metric Modeling: Batch Pipeline Aggregation, Multi-Currency Scoping & Plain-Language FinTech Architecture

**Author:** Antigravity Engineering Pair  
**Status:** Production Standard  
**Stack:** React 19, TanStack Query v5, TypeScript, TailwindCSS  
**Repository Reference:** `business-bitnormous-merchant`  

---

## 1. Executive Summary & The FinTech Metric Problem

In financial dashboards and merchant payment gateways, metric cards must convey high-stakes operational velocity at a single glance. In the Bitnormous Merchant Dashboard, the **Next payouts** card is responsible for answering two vital operational questions:
1. **How much capital is currently in-flight to my bank or mobile money account?** (The Primary Metric)
2. **Is my payout volume accelerating or decelerating compared to my last completed settlement?** (The Trend Indicator)

### Prior Liabilities in the Codebase
Before this implementation:
- **Raw Count vs. Financial Velocity:** The card was displaying raw string counts (e.g., `"2 pending"`), whereas the Figma design specification demanded a financial percentage trend (`+56% ↑`) indicating volume growth.
- **Unscoped Currency Pollution:** Payout queries were not strictly scoped by the active dashboard currency, risking cross-currency aggregation (e.g. summing GHS and NGN amounts directly).
- **Misleading Directional Arrows:** Any flat comparison defaulted to an upward or downward arrow, violating the equilibrium principle where `0%` change must be directionless and neutral.
- **Overcomplicated Presentation & Cryptic Notation:** Engineering documentation previously utilized dense LaTeX mathematical notation that obscured simple financial concepts from developers and product stakeholders.

---

## 2. Payout Lifecycle in On-Demand FinTech Rail Systems

Unlike traditional payroll systems that execute on fixed weekly or monthly cron schedules, merchant gateways like Bitnormous operate an **on-demand payout lifecycle**:

```
[Merchant Initiates Payout] 
          │
          ▼
   ┌──────────────┐
   │   pending    │ ───► Payout request queued in gateway database
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │  processing  │ ───► Dispatched to banking / Mobile Money rails (in-flight)
   └──────┬───────┘
          │
    ┌─────┴────────────────┐
    ▼                      ▼
┌──────────────┐    ┌──────────────┐
│   settled    │    │    failed    │
│  (Completed) │    │  (Rejected)  │
└──────────────┘    └──────────────┘
```

### The In-Flight Definition: `pending` + `processing`
Both `pending` and `processing` represent unsettled merchant liabilities that are actively moving toward completion:
- If a payout is `pending`, it has been committed by the merchant and deducted from withdrawable funds.
- If a payout is `processing`, partner banking rails are actively executing the bank or MoMo transfer.

Therefore, the upcoming payout volume must strictly aggregate **both** states. Once a payout reaches `settled`, it exits the pending pipeline and enters settled history.

---

## 3. FinTech Metric Formulas: Human-Readable vs. LaTeX

FinTech engineering documentation must be accessible to product managers, compliance auditors, frontend engineers, and clients. We explicitly reject academic LaTeX notation in favor of plain-language specifications and real-world examples.

### 3.1 Primary Metric: Next Payouts Amount

* **Old Cryptic Notation (Avoid):**  
  `$$\text{Next Payouts Value} = \sum \text{Pending Payout Amounts}$$`

* **Plain-Language FinTech Specification:**  
  **Next Payouts Amount = Total sum of all pending or processing payout amounts in the active currency.**

* **Real-World Business Example:**  
  A merchant initiates two payouts during the morning:  
  - Payout A: `GHS 200.00` (status: `processing`)  
  - Payout B: `GHS 290.00` (status: `pending`)  
  - **Display on Card:** `GHS 490.00`

---

### 3.2 Secondary Metric: Trend Percentage & Direction

* **Old Cryptic Notation (Avoid):**  
  `$$\text{Trend %} = \left( \frac{\text{Current Batch Volume} - \text{Previous Settled Volume}}{\text{Previous Settled Volume}} \right) \times 100$$`

* **Plain-Language FinTech Specification:**  
  **Trend % = ((Current Pending Volume − Previous Settled Volume) ÷ Previous Settled Volume) × 100**

* **Behavioral Matrix & Real-World Scenarios:**

| Scenario | Previous Settled | Current Pending | Calculation | Display Output | Card Styling |
|---|---|---|---|---|---|
| **Accelerated Volume** | GHS 300.00 | GHS 468.00 | `((468 - 300) / 300) * 100 = +56%` | `+56% ↑` | Green tone, upward arrow |
| **Decelerated Volume** | GHS 500.00 | GHS 350.00 | `((350 - 500) / 500) * 100 = -30%` | `-30% ↓` | Red tone, downward arrow |
| **Zero Prior History** | None (0) | GHS 250.00 | First-time baseline | `0%` | Neutral grey, NO arrow |
| **No Pending Payouts** | GHS 400.00 | GHS 0.00 | Pipeline empty | `0%` | Neutral grey, NO arrow |
| **Identical Batch Volume** | GHS 300.00 | GHS 300.00 | `((300 - 300) / 300) * 100 = 0%` | `0%` | Neutral grey, NO arrow |

---

## 4. Multi-Currency Isolation Standard

Financial aggregation across mixed currency sets causes catastrophic accounting errors. For instance, `200 USD + 500 GHS` cannot be summed as `700`.

To eliminate this vulnerability:
1. The global active currency is read directly from `useFiatBalanceStore((state) => state.activeCurrency)`.
2. The action query is explicitly parameterized: `useFiatPayoutsAction({ currency: activeCurrency })`.
3. The resulting total is formatted using `formatFiatAmount(total.toFixed(2), activeCurrency)`.

---

## 5. Production Implementation in React 19 & TypeScript

The following clean implementation in `src/hooks/useNormalDashboardMetrics.ts` computes the in-flight pipeline and relative velocity trend with zero linter errors:

```ts
// src/hooks/useNormalDashboardMetrics.ts
import { useMemo } from "react";
import { useFiatBalanceStore } from "@/store/useFiatBalanceStore";
import { useFiatPayoutsAction } from "@/actions/fiatPayouts";
import { formatFiatAmount } from "@/helpers";
import type { DashboardMetric } from "@/types/dashboard";

export const useNormalDashboardMetrics = () => {
  const activeCurrency = useFiatBalanceStore((state) => state.activeCurrency);

  // 1. Currency-scoped query: isolates active currency payouts
  const { payouts, isLoading: isPayoutsLoading } = useFiatPayoutsAction({
    currency: activeCurrency,
  });

  // 2. Next payouts: Pending pipeline total and relative percentage trend
  const { pendingPayoutTotal, nextPayoutsTrend, nextPayoutsTrendDir, nextPayoutsTone } = useMemo(() => {
    // Separate in-flight requests from completed payout history
    const pending = payouts.filter((p) => p.status === "pending" || p.status === "processing");
    const settled = payouts.filter((p) => p.status === "settled");

    // Sum all pending and processing amounts
    const total = pending.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const formattedTotal = formatFiatAmount(total.toFixed(2), activeCurrency);

    // Equilibrium fallback if no pending volume or no settled history
    if (total === 0 || settled.length === 0) {
      return {
        pendingPayoutTotal: formattedTotal,
        nextPayoutsTrend: "0%",
        nextPayoutsTrendDir: "none" as const,
        nextPayoutsTone: "green" as const,
      };
    }

    // Most recent settled payout volume
    const prevAmount = parseFloat(settled[0].amount) || 0;
    if (prevAmount === 0) {
      return {
        pendingPayoutTotal: formattedTotal,
        nextPayoutsTrend: "+100%",
        nextPayoutsTrendDir: "up" as const,
        nextPayoutsTone: "green" as const,
      };
    }

    // Calculate percentage change
    const diffPct = Math.round(((total - prevAmount) / prevAmount) * 100);
    if (diffPct === 0) {
      return {
        pendingPayoutTotal: formattedTotal,
        nextPayoutsTrend: "0%",
        nextPayoutsTrendDir: "none" as const,
        nextPayoutsTone: "green" as const,
      };
    }

    return {
      pendingPayoutTotal: formattedTotal,
      nextPayoutsTrend: `${diffPct > 0 ? "+" : ""}${diffPct}%`,
      nextPayoutsTrendDir: diffPct > 0 ? ("up" as const) : ("down" as const),
      nextPayoutsTone: diffPct >= 0 ? ("green" as const) : ("red" as const),
    };
  }, [payouts, activeCurrency]);

  // Card metric declaration
  const metrics: DashboardMetric[] = useMemo(() => [
    // ... other metrics (Balance, Success Rate, Failed)
    {
      id: "next-payouts",
      label: "Next payouts",
      value: pendingPayoutTotal,
      tone: nextPayoutsTone,
      trend: nextPayoutsTrend,
      trendDirection: nextPayoutsTrendDir,
      isLoading: isPayoutsLoading,
    },
  ], [
    pendingPayoutTotal,
    nextPayoutsTone,
    nextPayoutsTrend,
    nextPayoutsTrendDir,
    isPayoutsLoading,
  ]);

  return { metrics };
};
```

---

## 6. Key Takeaways & Best Practices

1. **In-Flight Financial Liabilities:** When calculating upcoming payouts, always combine `pending` (in-queue) and `processing` (dispatched to rails).
2. **Never Cross Currency Boundaries:** Always filter gateway lists by `activeCurrency` before running mathematical reductions.
3. **Respect the 0% Equilibrium Standard:** Zero movement or missing comparative baselines must render neutral text with no directional arrows.
4. **Communicate in Plain Language:** FinTech codebases thrive on clear, human-understandable formulas over abstract mathematical symbols.
