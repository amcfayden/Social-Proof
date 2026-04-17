import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function stripeId(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

function extractCheckoutEmail(session: Record<string, unknown>): string | undefined {
  const customerDetails = session.customer_details as { email?: unknown } | undefined;
  const detailsEmail = customerDetails?.email;

  const meta = session.metadata as { email?: unknown } | undefined;
  const metaEmail = meta?.email;

  const candidates = [
    typeof session.customer_email === "string" ? session.customer_email : undefined,
    typeof detailsEmail === "string" ? detailsEmail : undefined,
    typeof metaEmail === "string" ? metaEmail : undefined
  ].filter(Boolean) as string[];

  const first = candidates[0];
  return first ? normalizeEmail(first) : undefined;
}

async function upgradeEmailToPro(params: {
  email: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCheckoutSessionId?: string | null;
}) {
  const supabase = getSupabaseAdmin();

  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));

  const email = normalizeEmail(params.email);

  // Upgrade the most recently created key for this email.
  const { data: keyRow, error: findError } = await supabase
    .from("api_keys")
    .select("id")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError) throw new Error(findError.message);
  if (!keyRow?.id) throw new Error(`No API key found for email: ${email}`);

  const { error: updateError } = await supabase
    .from("api_keys")
    .update({
      plan: "pro",
      requests_limit: 10_000,
      // Reset current month's usage when upgrading.
      requests_used: 0,
      usage_period_start: periodStart.toISOString(),
      stripe_customer_id: params.stripeCustomerId ?? null,
      stripe_subscription_id: params.stripeSubscriptionId ?? null,
      stripe_checkout_session_id: params.stripeCheckoutSessionId ?? null
    })
    .eq("id", keyRow.id);

  if (updateError) throw new Error(updateError.message);
}

export async function POST(request: Request) {
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing webhook configuration" }, { status: 400 });
  }

  const stripe = getStripe();
  const rawBody = Buffer.from(await request.arrayBuffer());

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid signature", message: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as unknown as Record<string, unknown>;
      const email = extractCheckoutEmail(session);

      // Subscriptions created via Checkout (mode=subscription)
      const subscriptionId = stripeId(session.subscription);
      const customerId = stripeId(session.customer);
      const sessionId = typeof session.id === "string" ? session.id : null;

      if (!email) {
        console.error("[stripe-webhook] checkout.session.completed missing email", {
          id: sessionId
        });
        return NextResponse.json({ error: "Missing email on checkout session" }, { status: 400 });
      }

      await upgradeEmailToPro({
        email,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripeCheckoutSessionId: sessionId
      });
    }

    // Stripe expects 2xx quickly.
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe-webhook]", err);
    return NextResponse.json(
      { error: "Webhook handler failed", message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

