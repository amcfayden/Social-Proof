import { CORS_HEADERS, mergeHeaders } from "@/lib/http/cors";
import { getStripe } from "@/lib/stripe/client";
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

  // Vercel pastes often include a trailing newline — Stripe treats `price_xxx\n` as a different id.
  const priceId = process.env.STRIPE_PRICE_ID_PRO?.trim();
  const appUrl = process.env.APP_URL?.trim();
  if (!priceId) {
    return NextResponse.json(
      { error: "Server configuration error", message: "Missing STRIPE_PRICE_ID_PRO" },
      { status: 500, headers: mergeHeaders(CORS_HEADERS) }
    );
  }
  if (!appUrl) {
    return NextResponse.json(
      { error: "Server configuration error", message: "Missing APP_URL" },
      { status: 500, headers: mergeHeaders(CORS_HEADERS) }
    );
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: parsed.data.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/?checkout=success`,
      cancel_url: `${appUrl}/?checkout=cancel`,
      metadata: {
        email: parsed.data.email,
        plan: "pro"
      }
    });

    return NextResponse.json(
      { url: session.url },
      { status: 200, headers: mergeHeaders(CORS_HEADERS) }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create checkout session", message: err instanceof Error ? err.message : String(err) },
      { status: 500, headers: mergeHeaders(CORS_HEADERS) }
    );
  }
}

