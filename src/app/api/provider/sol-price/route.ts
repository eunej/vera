import { handlePaidProviderGet } from "@/lib/provider/handle-paid-get";
import { LITE_BODY } from "@/lib/provider/x402-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    return await handlePaidProviderGet(
      request,
      "/api/provider/sol-price",
      LITE_BODY
    );
  } catch (err) {
    console.error("[provider/sol-price]", err);
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Provider error",
      },
      { status: 500 }
    );
  }
}
