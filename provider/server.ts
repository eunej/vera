/**
 * Demo paid resource server (x402 V2 + Solana Devnet).
 *
 * We control both buyer (Vera) and seller (this provider) for a reliable local demo.
 *
 * Endpoints:
 *   GET /api/provider/sol-price      → $0.02 USDC (MarketData Lite)
 *   GET /api/provider/sol-price-pro  → $0.08 USDC (MarketData Pro)
 *
 * Flow: unauthenticated GET → 402 + PAYMENT-REQUIRED → paid retry → mock data.
 */

import { config as loadEnv } from "dotenv";
import express from "express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactSvmScheme } from "@x402/svm/exact/server";

loadEnv({ path: ".env.local" });
loadEnv(); // fallback .env

const PORT = Number(process.env.PROVIDER_PORT ?? 4021);
const NETWORK = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
const FACILITATOR_URL =
  process.env.FACILITATOR_URL ?? "https://x402.org/facilitator";

const payTo = process.env.SOLANA_PAY_TO ?? process.env.SOLANA_MERCHANT_PUBKEY;

if (!payTo) {
  console.error(
    "Set SOLANA_PAY_TO (or SOLANA_MERCHANT_PUBKEY) to the Devnet recipient pubkey."
  );
  process.exit(1);
}

const facilitator = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
const resourceServer = new x402ResourceServer(facilitator).register(
  NETWORK,
  new ExactSvmScheme()
);

const app = express();

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    network: NETWORK,
    payTo,
    facilitator: FACILITATOR_URL,
  });
});

app.use(
  paymentMiddleware(
    {
      "GET /api/provider/sol-price": {
        accepts: [
          {
            scheme: "exact",
            price: "$0.02",
            network: NETWORK,
            payTo,
          },
        ],
        description: "MarketData Lite — historical SOL market data",
        mimeType: "application/json",
      },
      "GET /api/provider/sol-price-pro": {
        accepts: [
          {
            scheme: "exact",
            price: "$0.08",
            network: NETWORK,
            payTo,
          },
        ],
        description: "MarketData Pro — historical SOL market data",
        mimeType: "application/json",
      },
    },
    resourceServer
  )
);

app.get("/api/provider/sol-price", (_req, res) => {
  res.json({
    provider: "MarketData Lite",
    pricePaidUsd: 0.02,
    network: "solana-devnet",
    data: {
      symbol: "SOL",
      range: "30d",
      candles: [
        { t: "2026-09-04", o: 142.1, h: 148.2, l: 140.5, c: 146.8 },
        { t: "2026-09-18", o: 146.8, h: 155.0, l: 145.1, c: 152.4 },
        { t: "2026-10-04", o: 152.4, h: 158.9, l: 150.2, c: 157.1 },
      ],
      note: "Mock historical SOL market data released after x402 settlement.",
    },
  });
});

app.get("/api/provider/sol-price-pro", (_req, res) => {
  res.json({
    provider: "MarketData Pro",
    pricePaidUsd: 0.08,
    network: "solana-devnet",
    data: {
      symbol: "SOL",
      range: "90d",
      candles: [
        { t: "2026-07-04", o: 120.0, h: 130.0, l: 118.0, c: 128.5 },
        { t: "2026-08-04", o: 128.5, h: 140.0, l: 125.0, c: 138.2 },
        { t: "2026-09-04", o: 138.2, h: 150.0, l: 136.0, c: 146.8 },
        { t: "2026-10-04", o: 146.8, h: 160.0, l: 145.0, c: 157.1 },
      ],
      note: "Mock Pro-tier SOL history released after x402 settlement.",
    },
  });
});

app.listen(PORT, () => {
  console.log(`Vera paid provider listening on http://127.0.0.1:${PORT}`);
  console.log(`  Lite  GET /api/provider/sol-price      ($0.02 USDC)`);
  console.log(`  Pro   GET /api/provider/sol-price-pro  ($0.08 USDC)`);
  console.log(`  payTo ${payTo}`);
  console.log(`  facilitator ${FACILITATOR_URL}`);
});
