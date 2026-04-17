import { getApiKeyFromHeaders, hashApiKey } from "@/lib/auth/apiKey";
import { CORS_HEADERS, mergeHeaders } from "@/lib/http/cors";
import { assertAllowedSocialUrl } from "@/lib/screenshot/allowedUrl";
import { captureBrandedScreenshot } from "@/lib/screenshot/capture";
import { consumeApiUsage } from "@/lib/usage/consumeApiUsage";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Vercel Hobby caps serverless duration (often 10s); Pro+ can use longer runs for slow pages. */
export const maxDuration = 60;

const bodySchema = z.object({
  url: z.string().url()
});

function jsonResponse(body: unknown, status: number): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: mergeHeaders(CORS_HEADERS)
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: mergeHeaders(CORS_HEADERS) });
}

export async function POST(request: Request) {
  const rawKey = getApiKeyFromHeaders(request.headers);
  if (!rawKey) {
    return jsonResponse({ error: "Missing x-api-key header" }, 401);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonResponse(
      { error: "Missing or invalid URL", details: parsed.error.flatten() },
      400
    );
  }

  let target: URL;
  try {
    target = assertAllowedSocialUrl(parsed.data.url);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid URL";
    return jsonResponse({ error: message }, 400);
  }

  let keyHash: string;
  try {
    keyHash = hashApiKey(rawKey);
  } catch {
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  const usage = await consumeApiUsage(keyHash);
  if (!usage.ok) {
    if (usage.error === "limit_exceeded") {
      return jsonResponse({ error: "Request limit exceeded for this API key" }, 429);
    }
    if (usage.error === "rpc_error") {
      return jsonResponse(
        { error: "Usage check failed", message: usage.message },
        503
      );
    }
    return jsonResponse({ error: "Invalid API key" }, 401);
  }

  try {
    const png = await captureBrandedScreenshot(target.toString());
    const headers = mergeHeaders(CORS_HEADERS, {
      "Content-Type": "image/png",
      "Cache-Control": "no-store"
    });
    return new NextResponse(new Uint8Array(png), { status: 200, headers });
  } catch (err) {
    console.error("[social-proof-screenshot]", err);
    return jsonResponse(
      {
        error: "Render failed",
        message: err instanceof Error ? err.message : String(err)
      },
      500
    );
  }
}
