/** Prefer same-origin Next provider routes (works on Vercel). */
export function resolveProviderBaseUrl(): string {
  if (process.env.PROVIDER_BASE_URL?.trim()) {
    return process.env.PROVIDER_BASE_URL.trim().replace(/\/$/, "");
  }
  // Prefer the stable production host over the per-deploy VERCEL_URL
  // (deployment URLs are often behind Vercel Authentication).
  const productionHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/^https?:\/\//, "") ||
    process.env.NEXT_PUBLIC_VERCEL_URL?.replace(/^https?:\/\//, "");
  if (productionHost) {
    return `https://${productionHost}`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    return process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }
  // Local Next.js embeds /api/provider/* — no separate :4021 required.
  return "http://127.0.0.1:3000";
}

/** Headers so server-side provider fetches can pass Deployment Protection. */
export function providerFetchHeaders(
  extra?: HeadersInit
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (extra) {
    const h = new Headers(extra);
    h.forEach((value, key) => {
      headers[key] = value;
    });
  }
  const bypass =
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() ||
    process.env.VERCEL_PROTECTION_BYPASS?.trim();
  if (bypass) {
    headers["x-vercel-protection-bypass"] = bypass;
    headers["x-vercel-set-bypass-cookie"] = "true";
  }
  return headers;
}
