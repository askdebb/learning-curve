# Developer Mode Metric Cards, Telemetry Modeling & Environment Status Architecture

**Author:** Bitnormous Engineering  
**Scope:** Developer Dashboard Telemetry, Reactive Metric Cards, Rate Limit Capacity & Environment Verification  
**Status:** Complete & Production Ready  
**Date:** September 2026  

---

## 1. Executive Summary

In financial and developer integration gateways, merchants require real-time visibility into checkout velocity, webhook reliability, and API key utilization. Relying on hardcoded or static mock constants creates developer distrust and masks production outages.

This engineering implementation replaces static `dashboardMetricsDevMode` with a reactive telemetry pipeline powered by `useDeveloperDashboardMetrics` querying `GET /user/businesses/{id}/developer-overview`. It rigorously enforces the **0% Directionless Equilibrium Rule** and dynamically coordinates the **API Usage Overview** and **Environment Status** widgets in `DashboardDevExtraCards.tsx`.

---

## 2. Telemetry Ingestion & Transformation Architecture

### 2.1 API Endpoint Surface
The pipeline queries the following resource:
```http
GET /api/v1/business/{id}/developer-overview?days=30
```
Returning:
- `payments.total`: Total checkout sessions initiated.
- `payments.completed`: Successfully paid and settled sessions.
- `payments.daily`: Chronological array of `{ date, total, completed }`.
- `webhooks.deliveries`: Total events dispatched across all endpoints.
- `webhooks.failed`: Total events failing HTTP 2xx acknowledgement.
- `webhooks.active_endpoints`: Count of healthy endpoints.
- `webhooks.failing_endpoints`: Count of disabled or failing endpoints.
- `environment`: Current business environment (`"test"` or `"live"`).
- `live_enabled`: Boolean flag indicating if production keys are minted and active.

---

## 3. Mathematical Modeling (Plain English Specifications)

### 3.1 Week-over-Week Request Velocity Formula
$$\text{LaTeX notation strictly replaced with Plain English}$$

**Plain English Formula:**
```
Difference Percentage = ((This Week Total Requests - Previous Week Total Requests) / Previous Week Total Requests) * 100
```
- **Equilibrium Rule:** When `Difference Percentage == 0%`, the trend direction is `"none"`. The card renders in neutral grey (`#71717A`) with zero arrows, eliminating misleading green upward arrows for 0% change.
- **Zero Base Growth:** When the previous week had 0 requests and this week has requests, velocity is reported as `+100%`.

### 3.2 Webhook Failure Rate Formula
**Plain English Formula:**
```
Failure Rate Percentage = (Failed Webhook Events / Total Webhook Deliveries) * 100
```
- **Healthy Status:** When `Failed Webhook Events == 0`, the card displays `0% fail rate` in neutral grey equilibrium.
- **Alert Status:** When failed events exceed 0, the card highlights `X.X% fail rate` in warning red (`#FF3B30`).

### 3.3 Active vs. Failing Endpoint Health
**Plain English Formula:**
```
Health Indicator = If Failing Endpoints > 0 Then "X failing" (Red) Else "Y live" (Green)
```

---

## 4. Component Wiring & Route Integration

1. **`useDeveloperDashboardMetrics.ts`**:
   - Consumes `useCurrentBusiness()` and `useOverview()`.
   - Memoizes the 4 developer metric cards (`Total Requests`, `Success Requests`, `Events Delivered`, `Active Endpoints`).
   - Propagates React Query `isLoading` states for skeleton fallbacks.

2. **`HomePage.tsx`**:
   - Dynamically selects `devMetrics` when `isDevMode` is true.
   - Wires "View API Keys" button to `navigate('/api-keys')` via `react-router` `useNavigate`.
   - Passes `overview`, `business`, and `isDevLoading` to `DashboardDevExtraCards`.

3. **`DashboardDevExtraCards.tsx`**:
   - Dynamically calculates rate limit capacity (`1,000 req/min`), today's request percentage, and tier utilization.
   - Dynamically renders `Sandbox`, `LIVE`, and `Verification Status` badges (`VERIFIED`, `IN REVIEW`, `PENDING`, `DISABLED`).
