# Financial Dashboard Chart Data Orchestration: Multi-Timeframe Series Construction, Responsive Axis Scaling & Dynamic Delivery Telemetry

**Author:** Antigravity Engineering Pair  
**Status:** Production Standard  
**Stack:** React 19, TanStack Query v5, Recharts, TypeScript, TailwindCSS  
**Repository Reference:** `business-bitnormous-merchant`  

---

## 1. Executive Summary & The Problem

Financial charts in payment gateways often present unique architectural hurdles:
1. **Mock Data Clones:** Development interfaces frequently rely on hardcoded mock series (e.g., static `JAN` to `JUL` monthly data and hardcoded `90% / 10%` donuts). When connected to real APIs, charts break or render awkward, zero-height lines if empty.
2. **Multi-Timeframe Aggregation (Monthly / Quarterly / Yearly):** Transaction databases record raw, append-only ledger entries. Converting thousands of raw timestamps into discrete monthly, quarterly, and yearly financial buckets in the active currency without performance degradation requires client-side memoization and date-windowing.
3. **Axis Overflow & Ugly Tick Marks:** Static Y-axis maximums (e.g. `yAxisMax = 3500`) either clip tall bars when revenue spikes or render microscopic bars when revenue is low.
4. **Dual Mode Dichotomy (Normal vs. Developer Mode):** The merchant dashboard toggles between business operations (Total Revenue by financial timeframe, Payment Conversion Rate) and developer operations (Daily Request Activity, Webhook Delivery Status). Both views require separate telemetry pipelines without duplicating UI components.

---

## 2. Architecture of `useDashboardChartsData`

Rather than embedding data fetching and math transformations directly into UI components, we engineered a dedicated reactive orchestrator: `src/hooks/useDashboardChartsData.ts`.

```
                       ┌─────────────────────────┐
                       │   Zustand Store         │
                       │   (activeCurrency)      │
                       └────────────┬────────────┘
                                    │
                                    ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│  Developer Overview API │   │ Ledger Transactions API │
│  (GET /developer-ovw)   │   │  (GET /transactions)    │
└────────────┬────────────┘   └────────────┬────────────┘
             │                             │
             └──────────────┬──────────────┘
                            │
                            ▼
          ┌───────────────────────────────────┐
          │     useDashboardChartsData()      │
          │  - Credit aggregation by date     │
          │  - Dynamic Y-axis tick math       │
          │  - Dual-mode telemetry mapping    │
          └─────────────────┬─────────────────┘
                            │
             ┌──────────────┴──────────────┐
             ▼                             ▼
   ┌───────────────────┐         ┌───────────────────┐
   │   RevenueChart    │         │ SuccessRateChart  │
   │ (Bar / Composed)  │         │  (Donut / Pie)    │
   └───────────────────┘         └───────────────────┘
```

---

## 3. Responsive Axis Scaling Math

To ensure charts look crisp regardless of whether a merchant processed $50 or $500,000, we implemented an automated magnitude-aware tick generator:

```ts
const calculateAxisTicks = (maxVal: number) => {
  if (maxVal <= 0) {
    return {
      yAxisMax: 1000,
      ticks: [0, 250, 500, 750, 1000],
    };
  }
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const normalized = maxVal / magnitude;
  let factor = 1.2;
  if (normalized > 5) factor = 1.2;
  else if (normalized > 2) factor = 1.3;
  else factor = 1.5;

  const targetMax = Math.ceil((maxVal * factor) / (magnitude / 2)) * (magnitude / 2);
  const yAxisMax = Math.max(targetMax, 100);

  const tickStep = yAxisMax / 3;
  const ticks = [
    0,
    Math.round(tickStep),
    Math.round(tickStep * 2),
    Math.round(yAxisMax),
  ];

  return { yAxisMax, ticks };
};
```

---

## 4. Multi-Timeframe Date Windowing

### 4.1 Monthly Timeframe (Last 7 Months)
Iterates backwards from the current month to construct a rolling 7-month window:
```ts
for (let i = 6; i >= 0; i--) {
  const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const monthLabel = targetDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase();

  const sum = creditTxs.reduce((acc, tx) => {
    const txDate = new Date(tx.created_at);
    if (txDate.getFullYear() === targetYear && txDate.getMonth() === targetMonth) {
      return acc + (parseFloat(tx.amount) || 0);
    }
    return acc;
  }, 0);

  monthlySeries.push({
    id: `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}`,
    month: monthLabel,
    value: Math.round(sum),
    isHighlighted: i === 0, // Highlight current month
  });
}
```

### 4.2 Quarterly & Yearly Timeframes
Similarly aggregates transactions into rolling 4-quarter (`Q1` to `Q4`) and 4-year windows, ensuring consistent comparisons.

---

## 5. Dual-Mode Telemetry Mapping

### Normal Dashboard vs. Developer Mode Telemetry:

| Feature | Normal Business Dashboard | Developer API Mode |
|---|---|---|
| **Revenue Chart Metric** | Total Revenue (Credits in Active Currency) | Request Activity (Total API Calls) |
| **Chart Type** | Bar Chart with active bar highlight | ComposedChart (Area + Line + Bar overlay) |
| **Top-Right Stat** | Dropdown filter: `Monthly` / `Quarterly` / `Yearly` | Week-over-Week trend badge: `VS LAST WEEK` |
| **Success Chart** | Payment Conversion Rate (`Success %` vs `Failed %`) | Webhook Delivery Status (`Delivered`, `Pending`, `Failed`) |
| **Center Metric** | Conversion Rate Percentage (`92%`) | Total Webhook Deliveries (`4,399`) |

---

## 6. Dual-Mode Skeleton Loading States & Zero-CLS Layout Physics

Both `RevenueChart` and `SuccessRateChart` accept an `isLoading` prop and implement context-aware skeleton geometry to maintain zero Cumulative Layout Shift (CLS):

### 6.1 Normal Business Mode Skeleton
- **Header:** Title skeleton (`Total revenue`) and pill dropdown placeholder (`Monthly / Quarterly / Yearly`).
- **Body:** 7 vertical animated bars with `rounded-t-[7px]` matching the exact aspect ratio of the underlying Recharts `BarChart`.

### 6.2 Developer API Mode Skeleton
- **Header:** Title skeleton (`Request Activity`) and Week-over-Week trend badge placeholder with arrow circle and `VS LAST WEEK` pill.
- **Body:** Custom responsive SVG line & area skeleton:
  - Dashed CartesianGrid guidelines matching `strokeDasharray="6 8"`.
  - Linear SVG path connecting 7 data points with subtle gradient area fill underneath (`#devLineSkeletonGrad`).
  - Circular vertex dots (`r="4.5"`) positioned at each coordinate.
  - Aligned X-axis placeholder labels.

When background network queries resolve, the real chart replaces the skeleton with zero dimensional jump or visual popping.
