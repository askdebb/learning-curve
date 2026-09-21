# Crypto Custody Ledger Architecture & High-Integrity Withdrawal Orchestration

## Overview & Architectural Context

In modern cryptocurrency payment gateways and merchant platforms, managing digital asset balances and outbound transfers demands rigorous accounting separation. A frequent pitfall in early-stage fintech implementations is conflating **Transactional History Logs** with **Custody Ledger Balances**.

In Bitnormous Merchant, our wallets interface was previously susceptible to balance drift, premature draft state destruction during two-factor/password authorization, and layout asymmetry between the front wallet digital card and its analytical line chart.

This engineering guide details how we unified live multi-asset custody feeds, established **Custody as the Single Source of Truth (SSOT)**, engineered a non-destructive withdrawal state machine with dynamic fee estimation, and enforced pixel-perfect visual height symmetry across the dashboard.

---

## 1. The Core Architectural Divide: Custody vs. Transaction Summation

### Why `Sum(Deposits) - Sum(Withdrawals)` Fails in Production
In traditional web applications, developers frequently derive a user's wallet balance by querying their transaction history and computing:
$$\text{Balance} = \sum \text{Deposits} - \sum \text{Withdrawals}$$

In cryptocurrency merchant infrastructure, **this formula almost always produces incorrect balances** due to four operational realities:

1. **API Pagination & Ledger Truncation**:
   Transactional endpoints (`GET /crypto/deposits` and `GET /withdrawals`) return paginated subsets (typically the latest 10, 20, or 50 entries). Calculating balance client-side from paginated records ignores all preceding transactions beyond the current page boundary.
2. **Blockchain Gas & Miner Fee Deductions**:
   When an outbound blockchain transaction occurs, gas/miner fees and custody network processing fees are debited directly from the underlying vault. Transaction history rows typically reflect the net recipient amount, causing cumulative balance divergence over time.
3. **Locked vs. Available Reserves**:
   Custody accounts distinguish between **Available** funds (spendable UTXOs/tokens) and **Locked** funds (unconfirmed blocks, active withdrawal reservations, or escrow holds). A raw transaction sum cannot distinguish whether an asset is spendable or reserved.
4. **Cold-Storage Sweeping & Administrative Injections**:
   Treasury rebalancing, hot-wallet refills, or initial multi-sig seed transactions may occur off-book or via administrative scripts without generating a merchant-scoped deposit record.

```
┌─────────────────────────────────────────────────────────────┐
│                 Custody Hot Wallet Ledger                    │
│                 (GET /custody/wallets)                      │
│   • available: 0.24450000 BTC                               │
│   • locked:    0.35050000 BTC                               │
│   • total:     0.59500000 BTC  ───► SSOT Balance: 21,165 GHS│
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────┐             ┌───────────────────────┐
│  WalletDigitalCard    │             │    WalletLineChart    │
│  All-Time Balance     │             │  Total Balance Header │
│  "GHS 21,165.00"      │             │  "GHS 21,165.00"      │
└───────────────────────┘             └───────────────────────┘
```

### The Solution: Establishing Custody as the Single Source of Truth
We unified `useWalletData.ts` to derive asset balances directly from the custody response:

```typescript
// src/hooks/useWalletData.ts
const cleanSym = selectedAsset.toUpperCase();
const custodyMatch = (custodyWallets || []).find(
  (w) => w.asset.toUpperCase() === cleanSym
);

const totalStr = custodyMatch?.total || custodyMatch?.available || "0";
const { formattedGhs } = calculateWalletConversions(totalStr, cleanSym);
const balanceGhs = parseFloat(formattedGhs.replace(/,/g, "")) || 0;

return {
  id: selectedAsset.toLowerCase(),
  name: `${cleanSym} Wallet`,
  symbol: cleanSym,
  balanceGhs,                 // Authoritative custody balance
  chartTotalBalanceGhs: balanceGhs, // Chart header mirrors custody 1:1
  available: custodyMatch?.available,
  locked: custodyMatch?.locked,
  total: custodyMatch?.total,
  // ...
};
```

Both `WalletDigitalCard.tsx` and `WalletLineChart.tsx` consume `activeWalletDetail.balanceGhs`, eliminating discrepancies.

---

## 2. Dynamic Network Fee Estimation & Reusable UI Component

### Eliminating Hardcoded Fallback Fees
Previously, withdrawal fee calculations relied on static fallback tables:
```typescript
// ❌ ANTI-PATTERN: Outdated hardcoded fees
const FALLBACK_FEES: Record<string, number> = {
  BTC: 0.0000096,
  USDT: 0.5,
  USDC: 0.5,
};
```
Hardcoded fees fail because blockchain gas prices fluctuate continuously based on network congestion, mempool depth, and block space demand.

### Reactive Fee Query & Modular Component Architecture
We decoupled fee estimation into a reactive query hook (`useWithdrawalFeeAction`), a pure formatting utility (`resolveNetworkFeeInfo`), and a self-contained presentational component (`<NetworkFeeDisplay />`):

```typescript
// src/helpers/walletUtils.ts
export interface NetworkFeeInfo {
  isLoading: boolean;
  hasFee: boolean;
  feeNum: number | null;
  feeFormattedCrypto: string;
  feeFormattedUsd: string;
  displayText: string;
}

export const resolveNetworkFeeInfo = (
  fee: string | number | null | undefined,
  symbol: string,
  isLoading: boolean = false
): NetworkFeeInfo => {
  if (isLoading) {
    return {
      isLoading: true,
      hasFee: false,
      feeNum: null,
      feeFormattedCrypto: "",
      feeFormattedUsd: "",
      displayText: "Estimating...",
    };
  }

  const rawStr = fee !== null && fee !== undefined ? String(fee).trim() : "";
  const feeNum = parseFloat(rawStr);
  const hasFee = !isNaN(feeNum) && feeNum > 0 && isFinite(feeNum);

  if (!hasFee) {
    return {
      isLoading: false,
      hasFee: false,
      feeNum: null,
      feeFormattedCrypto: "",
      feeFormattedUsd: "",
      displayText: "Calculated by network",
    };
  }

  const { formattedUsd } = calculateWalletConversions(rawStr, symbol);

  return {
    isLoading: false,
    hasFee: true,
    feeNum,
    feeFormattedCrypto: `${feeNum} ${symbol.toUpperCase()}`,
    feeFormattedUsd,
    displayText: `${feeNum} ${symbol.toUpperCase()}`,
  };
};
```

This utility powers `<NetworkFeeDisplay />`, rendering loading states, live crypto/fiat fee estimates with copy triggers, or fallback states:

```tsx
// src/components/wallet/steps/NetworkFeeDisplay.tsx
export const NetworkFeeDisplay = ({
  fee,
  symbol,
  isLoading = false,
  showCopy = true,
  className = "",
}: NetworkFeeDisplayProps) => {
  const feeInfo = useMemo(
    () => resolveNetworkFeeInfo(fee, symbol, isLoading),
    [fee, symbol, isLoading]
  );

  if (feeInfo.isLoading) {
    return <span className={`font-normal text-[#64748B] italic ${className}`}>Estimating...</span>;
  }

  if (feeInfo.hasFee && feeInfo.feeNum !== null) {
    return (
      <div className={`flex flex-col items-start text-left ${className}`}>
        <span className="font-medium text-[#250A63]">{feeInfo.feeNum} {symbol.toUpperCase()}</span>
        <div className="flex items-center gap-1 text-[#64748B]">
          <span className="font-normal font-geist text-[#94A3B8] 2xl:text-[14px]">
            ${feeInfo.feeFormattedUsd} USD
          </span>
          {showCopy && <CopyBtn text={`$${feeInfo.feeFormattedUsd} USD`} />}
        </div>
      </div>
    );
  }

  return (
    <span className={`font-normal text-[#64748B] text-[11px] sm:text-[12px] ${className}`}>
      Calculated by network
    </span>
  );
};
```

---

## 3. Resilient Withdrawal State Machine & Plain-English Error Handling

### The Premature State Wipe Bug
During withdrawal testing, users reported that entering their password triggered:
> `"Withdrawal Failed: The address field is required when recipient id is not present. (and 1 more error)"`

**Root Cause**: When advancing from the withdrawal drawer to the authorization password modal, the handler invoked `resetWithdrawFlow()`. This wiped `withdrawDestination.address` and `withdrawAmountStr` in global Zustand state *before* the backend payload was dispatched, sending an empty payload:
```json
{
  "address": "",
  "amount": "0",
  "password": "***"
}
```

**Fix**: We converted the workflow into a **Non-Destructive State Machine**. The draft destination and amount are preserved across the entire confirmation, authentication, and execution lifecycle. State reset occurs strictly upon terminal success or explicit modal cancellation.

### Human-Friendly Error Transformation
Backend validation errors often expose database field names or raw validator strings. We built `formatWithdrawalError(err)` in `walletUtils.ts` to convert technical messages into actionable merchant instructions:

| Raw Backend Message | Plain English User Guidance |
| :--- | :--- |
| `The address field is required when recipient id is not present. (and 1 more error)` | `Please provide a valid destination wallet address before completing this withdrawal.` |
| `insufficient funds / balance exceeded` | `Insufficient wallet balance. The withdrawal amount plus network fees exceeds your available funds.` |
| `invalid signature / unauthorized / password incorrect` | `Authorization failed. Please enter the correct merchant password and try again.` |
| `unsupported network chain asset` | `This cryptocurrency or network is temporarily unavailable for withdrawals.` |

---

## 4. Pixel-Perfect Height Symmetry & Layout Alignment

### The 14px Offset Bug
When placing `WalletDigitalCard` and `WalletLineChart` side-by-side in a 2-column grid, the two cards appeared visually uneven:
- **Line Chart**: Top `231px`, Height `249px`.
- **Digital Card**: Top `245px`, Height `235px` (14px lower, 14px shorter).

**Root Cause**: The digital card wrapper included `pt-3.5` (`14px`) to accommodate a legacy decorative tab protruding above the card. This offset pushed the visible front card down, breaking vertical balance.

```
❌ Before (Uneven Alignment):
┌─────────────────────────┐  ┌─────────────────────────┐
│ (14px empty tab space)  │  │ Top: 231px              │
├─────────────────────────┤  │                         │
│ Top: 245px              │  │ Chart Card (249px)      │
│ Front Card (235px)      │  │                         │
└─────────────────────────┘  └─────────────────────────┘

✅ After (Synchronized 1:1 Alignment):
┌─────────────────────────┐  ┌─────────────────────────┐
│ Top: 277px              │  │ Top: 277px              │
│ Digital Card (245px)    │  │ Chart Card (245px)      │
│ Bottom: 522px           │  │ Bottom: 522px           │
└─────────────────────────┘  └─────────────────────────┘
```

### The Solution
1. **Container Grid**: Changed from `items-start` to `items-stretch` in `WalletDetailPage.tsx`:
   ```tsx
   <div className="grid items-stretch gap-6 xl:grid-cols-2 mb-6">
     <WalletDigitalCard />
     <WalletLineChart />
   </div>
   ```
2. **Direct Card Sizing**: Removed `pt-3.5` and set both cards to `h-full min-h-[235px] rounded-[20px] p-6`.
3. **Locale Comma Formatting**: Updated chart balance rendering from `totalBalance.toFixed(2)` to `toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })`, ensuring both cards display **`GHS 21,165.00`** identically.

---

## 5. Architectural Checklist for Crypto Wallets

- [x] **Custody as SSOT**: Never calculate spendable balances from transaction logs; always consume the `/custody/wallets` ledger.
- [x] **Zero Hardcoded Fees**: Query dynamic network fees on pre-flight input changes (`useWithdrawalFeeAction`).
- [x] **Non-Destructive State**: Retain transaction payload parameters in state until confirmation or explicit closure.
- [x] **Plain-English Error Parsing**: Scrub technical validation jargon (`(and 1 more error)`) before displaying alerts.
- [x] **Layout Parity**: Use `items-stretch` with equal box-sizing to prevent visual jarring between analytical charts and digital cards.
