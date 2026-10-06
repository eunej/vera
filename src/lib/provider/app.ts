/**
 * Shared x402 paid-provider Express app (local `npm run provider`).
 */

import express, { type Express } from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import { SOLANA_DEVNET } from "@/lib/x402/constants";
import {
  LITE_BODY,
  PRO_BODY,
  buildProviderRoutes,
  resolvePayTo,
} from "@/lib/provider/x402-server";

export { resolvePayTo } from "@/lib/provider/x402-server";

export function createProviderApp(): Express {
  const payTo = resolvePayTo();
  const facilitatorUrl =
    process.env.FACILITATOR_URL ?? "https://x402.org/facilitator";

  const facilitator = new HTTPFacilitatorClient({ url: facilitatorUrl });
  const resourceServer = new x402ResourceServer(facilitator).register(
    SOLANA_DEVNET,
    new ExactSvmScheme()
  );

  const app = express();

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      network: SOLANA_DEVNET,
      payTo,
      facilitator: facilitatorUrl,
    });
  });

  app.use(paymentMiddleware(buildProviderRoutes(payTo), resourceServer));

  app.get("/api/provider/sol-price", (_req, res) => {
    res.json(LITE_BODY);
  });

  app.get("/api/provider/sol-price-pro", (_req, res) => {
    res.json(PRO_BODY);
  });

  return app;
}
