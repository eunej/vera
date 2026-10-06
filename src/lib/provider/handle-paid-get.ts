import type { HTTPAdapter } from "@x402/core/server";
import { NextResponse } from "next/server";
import { getProviderHttpServer } from "@/lib/provider/x402-server";

class WebRequestAdapter implements HTTPAdapter {
  constructor(
    private readonly req: Request,
    private readonly path: string
  ) {}

  getHeader(name: string): string | undefined {
    return this.req.headers.get(name) ?? undefined;
  }

  getMethod(): string {
    return this.req.method;
  }

  getPath(): string {
    return this.path;
  }

  getUrl(): string {
    return this.req.url;
  }

  getAcceptHeader(): string {
    return this.req.headers.get("accept") || "";
  }

  getUserAgent(): string {
    return this.req.headers.get("user-agent") || "";
  }

  getQueryParams(): Record<string, string | string[]> {
    const out: Record<string, string | string[]> = {};
    const url = new URL(this.req.url);
    url.searchParams.forEach((value, key) => {
      const existing = out[key];
      if (existing == null) out[key] = value;
      else if (Array.isArray(existing)) existing.push(value);
      else out[key] = [existing, value];
    });
    return out;
  }

  getQueryParam(name: string): string | string[] | undefined {
    return this.getQueryParams()[name];
  }

  getBody(): unknown {
    return undefined;
  }
}

/**
 * Handle a paid provider GET via App Router + x402HTTPResourceServer.
 */
export async function handlePaidProviderGet(
  request: Request,
  path: string,
  body: unknown
): Promise<Response> {
  const httpServer = getProviderHttpServer();
  await httpServer.initialize();

  const adapter = new WebRequestAdapter(request, path);
  const context = {
    adapter,
    path,
    decodedPath: path,
    method: "GET",
    paymentHeader:
      adapter.getHeader("payment-signature") || adapter.getHeader("x-payment"),
  };

  const result = await httpServer.processHTTPRequest(context);

  if (result.type === "payment-error") {
    const { response } = result;
    return NextResponse.json(response.body ?? {}, {
      status: response.status,
      headers: response.headers,
    });
  }

  if (result.type === "no-payment-required") {
    return NextResponse.json(body);
  }

  if (result.type !== "payment-verified") {
    return NextResponse.json({ error: "Unexpected payment state" }, { status: 500 });
  }

  const {
    paymentPayload,
    paymentRequirements,
    declaredExtensions,
    beforeHandlerSettlement,
  } = result;

  const responseBody = Buffer.from(JSON.stringify(body));
  const responseHeaders: Record<string, string> = {
    "content-type": "application/json",
  };

  const settleResult = await httpServer.processSettlement(
    paymentPayload,
    paymentRequirements,
    declaredExtensions,
    {
      request: context,
      responseBody,
      responseHeaders,
    },
    undefined,
    beforeHandlerSettlement
  );

  if (!settleResult.success) {
    const { response } = settleResult;
    return NextResponse.json(response.body ?? {}, {
      status: response.status,
      headers: response.headers,
    });
  }

  const headers = new Headers(responseHeaders);
  Object.entries(settleResult.headers).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new NextResponse(responseBody, {
    status: 200,
    headers,
  });
}
