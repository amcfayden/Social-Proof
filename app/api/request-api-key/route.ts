import { CORS_HEADERS, mergeHeaders } from "@/lib/http/cors";
import { sendApiKeyEmail } from "@/lib/email/sendApiKeyEmail";
import { getApiKeyDeliveryMode } from "@/lib/keys/deliveryMode";
import { mintApiKeyForEmail } from "@/lib/keys/mintApiKey";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email()
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: mergeHeaders(CORS_HEADERS) });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: mergeHeaders(CORS_HEADERS) }
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400, headers: mergeHeaders(CORS_HEADERS) }
    );
  }

  try {
    const minted = await mintApiKeyForEmail(parsed.data.email);
    const mode = getApiKeyDeliveryMode();

    if (mode === "email") {
      await sendApiKeyEmail({
        to: parsed.data.email,
        rawKey: minted.rawKey,
        dashboardUrl: process.env.APP_URL ? `${process.env.APP_URL}/docs` : undefined
      });

      return NextResponse.json(
        { ok: true, delivery: "email" as const },
        {
          status: 200,
          headers: mergeHeaders(CORS_HEADERS, {
            "Cache-Control": "no-store"
          })
        }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        delivery: "inline" as const,
        apiKey: minted.rawKey,
        keyPrefix: minted.keyPrefix,
        apiKeyId: minted.apiKeyId
      },
      {
        status: 200,
        headers: mergeHeaders(CORS_HEADERS, {
          "Cache-Control": "no-store"
        })
      }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create API key", message: err instanceof Error ? err.message : String(err) },
      { status: 500, headers: mergeHeaders(CORS_HEADERS) }
    );
  }
}

