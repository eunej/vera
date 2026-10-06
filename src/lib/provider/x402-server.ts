/**
 * Shared x402 resource-server setup for the paid provider endpoints.
 * Used by Express (`npm run provider`) and Next.js App Router routes.
 */

import { HTTPFacilitatorClient, type RoutesConfig } from "@x402/core/server";
import {
  x402HTTPResourceServer,
  x402ResourceServer,
} from "@x402/express";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import { SOLANA_DEVNET } from "@/lib/x402/constants";

export const LITE_BODY = {
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
} as const;

export const PRO_BODY = {
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
} as const;

export function resolvePayTo(): string {
  const payTo =
    process.env.SOLANA_PAY_TO?.trim() ||
    process.env.SOLANA_MERCHANT_PUBKEY?.trim();
  if (!payTo) {
    throw new Error(
      "Set SOLANA_PAY_TO (or SOLANA_MERCHANT_PUBKEY) to the Devnet recipient pubkey."
    );
  }
  return payTo;
}

export function buildProviderRoutes(payTo: string): RoutesConfig {
  return {
    "GET /api/provider/sol-price": {
      accepts: [
        {
          scheme: "exact",
          price: "$0.02",
          network: SOLANA_DEVNET,
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
          network: SOLANA_DEVNET,
          payTo,
        },
      ],
      description: "MarketData Pro — historical SOL market data",
      mimeType: "application/json",
    },
  };
}

let cachedHttpServer: x402HTTPResourceServer | null = null;
let cachedPayTo: string | null = null;

export function getProviderHttpServer(): x402HTTPResourceServer {
  const payTo = resolvePayTo();
  if (cachedHttpServer && cachedPayTo === payTo) return cachedHttpServer;

  const facilitatorUrl =
    process.env.FACILITATOR_URL ?? "https://x402.org/facilitator";
  const facilitator = new HTTPFacilitatorClient({ url: facilitatorUrl });
  const resourceServer = new x402ResourceServer(facilitator).register(
    SOLANA_DEVNET,
    new ExactSvmScheme()
  );
  cachedHttpServer = new x402HTTPResourceServer(
    resourceServer,
    buildProviderRoutes(payTo)
  );
  cachedPayTo = payTo;
  return cachedHttpServer;
}
