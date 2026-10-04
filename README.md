# Vera — Agent Procurement Intelligence

Vera decides **whether** an agent should buy something — then, only if approved, completes a real **x402 V2** payment in **USDC on Solana Devnet**.

```
Agent → Vera (intent · compare · policy) → APPROVE/ASK/BLOCK
                                              ↓ APPROVE only
                                         x402 client (server)
                                              ↓
                                         Paid API (402 → settle)
                                              ↓
                                         USDC on Solana Devnet
                                              ↓
                                         Resource + Vera receipt
```

Vera is **not** a wallet product. Keys stay server-side.

## Quick start

### 1) Generate a Devnet wallet

```bash
npm install
npm run wallet:generate
```

Copy the printed values into `.env.local` (see `.env.example`).

### 2) Fund the wallet (Devnet)

1. **SOL** (rent / ATA): https://faucet.solana.com/ — select Devnet, paste the pubkey from step 1  
2. **USDC** (required for settlement): https://faucet.circle.com/  
   - Blockchain: **Solana Devnet**  
   - Mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`  
   - Amount: request at least **1 USDC** (demo pays `$0.02`)

Without Devnet USDC, the facilitator returns  
`invalid_exact_svm_transaction_simulation_failed` / `InvalidAccountData`  
and Vera correctly shows **Settlement failed** (never a fake Settled).

The public facilitator (`https://x402.org/facilitator`) sponsors fee-payer SOL; the **agent wallet still must hold USDC**.

### 3) Run the paid provider

```bash
npm run provider
```

Listens on `http://127.0.0.1:4021`:

- `GET /api/provider/sol-price` → **$0.02** (MarketData Lite)  
- `GET /api/provider/sol-price-pro` → **$0.08** (MarketData Pro)  

Unauthenticated requests return **402** + `PAYMENT-REQUIRED`.

### 4) Run Vera

```bash
npm run dev
```

Open http://localhost:3000

## Demo sequence

### Smart Purchase (live x402)

1. Select **Smart Purchase**  
2. Click **Run Procurement**  
3. Watch: Mission → Compare → Recommend → **APPROVE** Lite ($0.02)  
4. **LIVE PAYMENT** Settling… → Settled ✓  
5. Real Solana Devnet transaction + explorer link  
6. Resource Received ✓ + audit receipt  

### Suspicious Purchase (block before payment)

1. Select **Suspicious Purchase**  
2. Run Procurement → **BLOCKED**  
3. Click **Block purchase**  
4. UI shows **BLOCKED BEFORE PAYMENT** — no Solana tx  

## Environment

| Variable | Purpose |
|---|---|
| `SOLANA_PRIVATE_KEY` | Agent payer secret (base58, 64-byte) — **server only** |
| `SOLANA_PAY_TO` | Merchant recipient pubkey |
| `FACILITATOR_URL` | Default `https://x402.org/facilitator` |
| `PROVIDER_BASE_URL` | Default `http://127.0.0.1:4021` |
| `VERA_MAX_PAYMENT_USD` | x402 client hard cap (default `0.10`) |

## Architecture map

```
provider/server.ts              Paid Express API (x402 middleware)
src/lib/x402/decision.ts        ProcurementDecision + policy gate
src/lib/x402/client.ts          Server-side x402 fetch client
src/app/api/vera/procure        Orchestrates decide → (maybe) pay
src/components/live-payment-panel.tsx
```

## Notes

- Network: **Solana Devnet only** (`solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1`)  
- Protocol: **x402 V2** (`PAYMENT-REQUIRED` / `PAYMENT-SIGNATURE` / `PAYMENT-RESPONSE`)  
- If settlement fails, the UI shows the **real error** — never a fake Settled state  
