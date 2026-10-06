/**
 * Demo paid resource server (x402 V2 + Solana Devnet).
 *
 * Standalone process for local demos. On Vercel / `next start`, the same app
 * is also mounted at Next.js `/api/provider/*` so settlement does not need
 * a separate PROVIDER_BASE_URL service.
 */

import { config as loadEnv } from "dotenv";
import { createProviderApp, resolvePayTo } from "../src/lib/provider/app";

loadEnv({ path: ".env.local" });
loadEnv();

const PORT = Number(process.env.PROVIDER_PORT ?? 4021);

try {
  resolvePayTo();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

const app = createProviderApp();
const payTo = resolvePayTo();
const facilitatorUrl =
  process.env.FACILITATOR_URL ?? "https://x402.org/facilitator";

app.listen(PORT, () => {
  console.log(`Vera paid provider listening on http://127.0.0.1:${PORT}`);
  console.log(`  Lite  GET /api/provider/sol-price      ($0.02 USDC)`);
  console.log(`  Pro   GET /api/provider/sol-price-pro  ($0.08 USDC)`);
  console.log(`  payTo ${payTo}`);
  console.log(`  facilitator ${facilitatorUrl}`);
});
