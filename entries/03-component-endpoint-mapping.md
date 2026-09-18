# Component to Endpoint Mapping Matrix

This document maps all 50 Bitnormous Merchant API endpoints across 14 domains to the corresponding UI components, pages, and drawers in the codebase, detailing why each component requires that endpoint.

---

## 1. Merchant Identity & Profile
* **Controller**: `MerchantController`
* **Custom Hook**: `useMerchantAction`
* **Global Store**: `useMerchantStore`

| Endpoint | HTTP Method | Consuming Components | Architectural & UX Justifications |
| :--- | :--- | :--- | :--- |
| `/me` | `GET` | • `src/components/Navbar.tsx`<br>• `src/components/Sidebar.tsx`<br>• `src/pages/Settings.tsx`<br>• `src/pages/developer/Account.tsx` | Renders merchant identity, switches between `Live` and `Sandbox/Test` environments, enforces permission checks (`allows_crypto_payouts`), and displays default settlement currency (`GHS`). |

---

## 2. Platform Capability Matrix & Rates
* **Controller**: `PlatformController`
* **Custom Hooks**: `usePlatformAssetsAction`, `useIndicativeRatesAction`, `useMobileMoneyNetworksAction`, `useResolveFiatAccountAction`
* **Global Store**: `usePlatformStore`

| Endpoint | HTTP Method | Consuming Components | Architectural & UX Justifications |
| :--- | :--- | :--- | :--- |
| `/assets` | `GET` | • `WalletWithdrawInputStep.tsx`<br>• `CounterQRGenerator.tsx`<br>• `Checkout.tsx` | Provides custody capability matrix: supported chains per asset, confirmation requirements, memo support, and withdrawal minimums/fees. |
| `/rates` | `GET` | • `DashboardCards.tsx`<br>• `WalletDigitalCard.tsx`<br>• `CounterQRGenerator.tsx`<br>• `Checkout.tsx` | Displays live indicative buy/sell rates for crypto assets in fiat (`GHS`) for offline calculations and quick estimations. |
| `/fiat/networks` | `GET` | • `TransferPayoutFormStep.tsx`<br>• `AddCustomerModal.tsx`<br>• Payout Config screens | Loads supported Mobile Money networks (MTN, Telecel, AirtelTigo), prefix patterns, and per-transaction caps. |
| `/fiat/resolve` | `POST` | • `TransferPayoutFormStep.tsx`<br>• `TransferPayoutConfirmStep.tsx`<br>• `AddCustomerModal.tsx` | Instant name enquiry to validate account numbers and retrieve registered holder names before initiating payouts or saving recipients. |

---

## 3. Quotes
* **Controller**: `QuoteController`
* **Custom Hooks**: `useCreateQuoteAction`, `useQuoteAction`
* **Global Store**: `useQuoteStore`

| Endpoint | HTTP Method | Consuming Components | Architectural & UX Justifications |
| :--- | :--- | :--- | :--- |
| `/quotes` | `POST` | • Ramp Order Flow Modals<br>• `CounterQRGenerator.tsx`<br>• `Checkout.tsx` | Locks exchange rate for on-ramp or off-ramp transactions, returning single-use `quote_id` and expiry timestamp. |
| `/quotes/:id` | `GET` | • Ramp Order Execution Stepper<br>• Rate Countdown Widget | Polls quote status (`active`, `consumed`, `expired`) to notify user when quote window has elapsed. |

---

## 4. Ramp Orders
* **Controller**: `RampOrderController`
* **Custom Hooks**: `useRampOrdersAction`, `useRampOrderAction`, `useCreateRampOrderAction`, `useRampOrderEventsAction`, `useCancelRampOrderAction`
* **Global Store**: `TransactionsStore`

| Endpoint | HTTP Method | Consuming Components | Architectural & UX Justifications |
| :--- | :--- | :--- | :--- |
| `/ramp-orders` | `POST` | • Checkout Payment Stepper<br>• Ramp Order Modal | Executes locked quote, creating an on-ramp order (with fiat collection details) or off-ramp order (with deposit address). |
| `/ramp-orders` | `GET` | • `src/pages/Transactions.tsx` | Displays paginated table of merchant ramp orders with status and direction filters. |
| `/ramp-orders/:id` | `GET` | • `TransactionDetailModal.tsx` | Displays detailed breakdown of a single ramp order, amount mismatch alerts, and addresses. |
| `/ramp-orders/:id/events` | `GET` | • `TransactionDetailModal.tsx` | Renders audit timeline of status transitions (`awaiting_deposit` &rarr; `deposit_detected` &rarr; `confirming` &rarr; `settling` &rarr; `completed`). |
| `/ramp-orders/:id/cancel` | `POST` | • `TransactionDetailModal.tsx` | Cancels an order that is still in `awaiting_deposit` or `awaiting_payment` state. |

---

## 5. Fiat Balances & Internal Bucket Transfers
* **Controllers**: `BalanceController`, `TransferController`
* **Custom Hooks**: `useFiatBalancesAction`, `useTransfersAction`, `useTransferAction`, `useCreateTransferAction`
* **Global Stores**: `useFiatBalanceStore`, `useTransferStore`

| Endpoint | HTTP Method | Consuming Components | Architectural & UX Justifications |
| :--- | :--- | :--- | :--- |
| `/balances` | `GET` | • `Navbar.tsx`<br>• `DashboardCards.tsx`<br>• `WalletsHeader.tsx`<br>• `TransferPayoutsModal.tsx` | Fetches **Prepaid** (funds deposits/buys) and **Withdrawable** (holds proceeds/funds payouts) fiat balances. |
| `/transfers` | `POST` | • Internal Bucket Sweep Drawer<br>• Payout Funding Modal | Moves funds between prepaid and withdrawable buckets atomically without external bank transfers. |
| `/transfers` | `GET` | • Internal Transfers Audit Tab<br>• `Transactions.tsx` | Lists historical bucket sweep transfers with status and references. |
| `/transfers/:id` | `GET` | • Transfer Detail Modal | Inspects atomic bucket transfer metadata. |

---

## 6. Fiat Deposits & Instructions
* **Controller**: `FiatDepositController`
* **Custom Hooks**: `useCreateFiatDepositAction`, `useFiatDepositsAction`, `useFiatDepositAction`
* **Global Store**: `useFiatDepositStore`

| Endpoint | HTTP Method | Consuming Components | Architectural & UX Justifications |
| :--- | :--- | :--- | :--- |
| `/fiat/deposit-instructions` | `POST` | • Top-Up Prepaid Modal<br>• MoMo Deposit Drawer | Generates collection account number and payment reference instructions for merchant prepaid account top-ups. |
| `/fiat/deposits` | `GET` | • `Transactions.tsx`<br>• Top-Up History Tab | Displays history of fiat deposits and their confirmation state (`pending`, `confirmed`, `rejected`). |
| `/fiat/deposits/:id` | `GET` | • Deposit Receipt Modal | Detailed receipt showing confirmation timestamp and sender matching info. |

---

## 7. Fiat Payouts
* **Controller**: `FiatPayoutController`
* **Custom Hooks**: `useCreateFiatPayoutAction`, `useFiatPayoutsAction`, `useFiatPayoutAction`
* **Global Store**: `useFiatPayoutStore`

| Endpoint | HTTP Method | Consuming Components | Architectural & UX Justifications |
| :--- | :--- | :--- | :--- |
| `/fiat/payouts` | `POST` | • `TransferPayoutFormStep.tsx`<br>• `TransferPayoutConfirmStep.tsx` | Debits withdrawable balance and initiates bank or mobile money payout to recipient. |
| `/fiat/payouts` | `GET` | • `Transactions.tsx`<br>• Payouts History Table | Lists payouts with status filters (`pending`, `processing`, `settled`, `failed`). |
| `/fiat/payouts/:id` | `GET` | • `TransferPayoutReceiptStep.tsx`<br>• `TransactionDetailModal.tsx` | Fetches terminal payout settlement receipt with timestamp and delivery rail status. |

---

## 8. Wallets, Deposit Addresses & Crypto Deposits
* **Controller**: `WalletController`
* **Custom Hooks**: `useWalletsAction`, `useWalletAction`, `useCreateDepositAddressAction`, `useDepositAddressesAction`, `useDepositAddressAction`, `useCryptoDepositsAction`, `useCryptoDepositAction`
* **Global Stores**: `useWalletStore`, `useCryptoDepositStore`

| Endpoint | HTTP Method | Consuming Components | Architectural & UX Justifications |
| :--- | :--- | :--- | :--- |
| `/wallets` | `GET` | • `WalletsCardList.tsx`<br>• `Wallets.tsx`<br>• `DashboardCards.tsx` | Lists custody balances (`available`, `locked`, `total`) across all supported crypto assets. |
| `/wallets/:asset` | `GET` | • `WalletDetailPage.tsx`<br>• `WalletDigitalCard.tsx` | Fetches single asset custody balance and spendable capacity. |
| `/wallets/:asset/addresses` | `POST` | • Receive Crypto Modal<br>• Customer Address Allocator | Allocates a permanent deposit address tied to an end-user / customer reference. |
| `/wallets/:asset/addresses` | `GET` | • Customer Addresses Tab in `WalletDetailPage.tsx` | Lists all standing deposit addresses generated for an asset. |
| `/deposit-addresses/:id` | `GET` | • Deposit Address QR Viewer Drawer | Displays QR code and memo for a specific deposit address. |
| `/crypto-deposits` | `GET` | • `WalletTransactionsTable.tsx`<br>• `Transactions.tsx` | Lists on-chain crypto deposits with confirmation counters (`confirmations` vs `required_confirmations`). |
| `/crypto-deposits/:id` | `GET` | • `WalletTransactionDetailDrawer.tsx` | Shows transaction hash, block explorer link, and credited status. |

---

## 9. Crypto Withdrawals
* **Controller**: `WithdrawalController`
* **Custom Hooks**: `useWithdrawalsAction`, `useWithdrawalAction`, `useCreateWithdrawalAction`, `useWithdrawalFeeAction`, `useCancelWithdrawalAction`
* **Global Store**: `useWithdrawalStore`

| Endpoint | HTTP Method | Consuming Components | Architectural & UX Justifications |
| :--- | :--- | :--- | :--- |
| `/withdrawals/fee` | `GET` | • `WalletWithdrawInputStep.tsx` | Live fee calculation as user inputs withdrawal amount. Displays network fee and total hold. |
| `/withdrawals` | `POST` | • `WalletWithdrawConfirmStep.tsx` | Submits on-chain withdrawal with idempotency protection. Places full hold in locked bucket. |
| `/withdrawals` | `GET` | • `WalletTransactionsTable.tsx`<br>• `Transactions.tsx` | Lists withdrawals with status (`pending`, `awaiting_approval`, `processing`, `completed`, `cancelled`). |
| `/withdrawals/reference/:ref`| `GET` | • Withdrawal Retry / Idempotency Handler | Safe lookup by merchant reference for clients verifying status after network timeouts. |
| `/withdrawals/:id` | `GET` | • `WalletTransactionDetailDrawer.tsx` | Detailed view of fee, recipient, and transaction hash. |
| `/withdrawals/:id/cancel` | `POST` | • `WalletTransactionDetailDrawer.tsx` | Cancels un-broadcast withdrawals, refunding locked balance to spendable bucket. |

---

## 10. Balance Swaps
* **Controller**: `SwapController`
* **Custom Hooks**: `useSwapQuoteAction`, `useExecuteSwapAction`, `useSwapsAction`, `useSwapAction`
* **Global Store**: `useSwapStore`

| Endpoint | HTTP Method | Consuming Components | Architectural & UX Justifications |
| :--- | :--- | :--- | :--- |
| `/swaps/quotes` | `POST` | • Swap Crypto &harr; Fiat Drawer | Locks rate for balance-held conversion between crypto wallet and fiat prepaid/withdrawable buckets. |
| `/swaps` | `POST` | • Swap Confirmation Step | Executes conversion atomically; both balance legs commit together or abort. |
| `/swaps` | `GET` | • Swap History Tab in `Wallets.tsx` | Lists executed swaps, locked rates, and amounts. |
| `/swaps/:id` | `GET` | • Swap Receipt Drawer | Detailed view of atomic conversion record. |

---

## 11. Address Book (Recipients)
* **Controller**: `RecipientController`
* **Custom Hooks**: `useRecipientsAction`, `useRecipientAction`, `useCreateRecipientAction`, `useDeleteRecipientAction`
* **Global Store**: `useRecipientStore`

| Endpoint | HTTP Method | Consuming Components | Architectural & UX Justifications |
| :--- | :--- | :--- | :--- |
| `/recipients` | `POST` | • `AddCustomerModal.tsx`<br>• Payout/Withdrawal "Save to Address Book" checkbox | Saves validated destination (crypto address or mobile money account) for fast reuse and allowlist compliance. |
| `/recipients` | `GET` | • `Customers.tsx`<br>• Recipient Selector in Payouts / Withdrawals | Displays address book items filtered by type (`crypto_address` or `mobile_money`). |
| `/recipients/:id` | `GET` | • Customer Detail View | Dereferences recipient details associated with payouts or withdrawals. |
| `/recipients/:id` | `DELETE` | • Address Book Actions Menu | Removes recipient from address book (immediately revoking allowlist qualification). |

---

## 12. Unified Ledger
* **Controller**: `TransactionController`
* **Custom Hooks**: `useLedgerTransactionsAction`, `useLedgerTransactionAction`
* **Global Store**: `useLedgerStore`

| Endpoint | HTTP Method | Consuming Components | Architectural & UX Justifications |
| :--- | :--- | :--- | :--- |
| `/transactions` | `GET` | • `src/pages/developer/Transactions.tsx`<br>• `AuditLogs.tsx` | Complete append-only accounting ledger across crypto, prepaid, and withdrawable buckets with `balance_after` verification. |
| `/transactions/:id` | `GET` | • Ledger Detail Drawer | Full reconciliation audit trail for a single balance mutation. |

---

## 13. Developer Webhooks
* **Controller**: `WebhookController`
* **Custom Hooks**: `useWebhooksAction`, `useWebhookAction`, `useCreateWebhookAction`, `useUpdateWebhookAction`, `useSendTestEventAction`, `useRotateWebhookSecretAction`, `useWebhookDeliveriesAction`, `useDeleteWebhookAction`
* **Global Store**: `useWebhookStore`

| Endpoint | HTTP Method | Consuming Components | Architectural & UX Justifications |
| :--- | :--- | :--- | :--- |
| `/webhooks` | `GET` | • `src/pages/developer/Webhooks.tsx` | Lists registered webhook endpoints, delivery health, and subscription topics. |
| `/webhooks` | `POST` | • Register Webhook Modal | Registers new HTTPS endpoint and provides signing secret (`whsec_...`) for one-time copying. |
| `/webhooks/:id` | `PATCH` | • Edit Webhook Drawer | Updates URL, active state, descriptions, or event topics. |
| `/webhooks/:id/test` | `POST` | • Webhooks Action Toolbar | Dispatches a real signed `webhook.test` payload through the delivery pipeline to verify integration. |
| `/webhooks/:id/rotate-secret`| `POST` | • Security Settings Menu in Webhooks | Mints a fresh signing secret immediately invalidating old credentials. |
| `/webhooks/:id/deliveries` | `GET` | • Delivery Logs Drawer in `developer/Webhooks.tsx` | Inspects HTTP response codes, payload attempts, and retry timelines. |
| `/webhooks/:id` | `DELETE` | • Webhooks Action Toolbar | Removes webhook endpoint and cleans up delivery logs. |
