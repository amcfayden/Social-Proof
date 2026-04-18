import Stripe from "stripe";

let cached: Stripe | null = null;

function readStripeSecretKey(): string {
  let k = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1).trim();
  }
  for (const prefix of ["export STRIPE_SECRET_KEY=", "STRIPE_SECRET_KEY="]) {
    if (k.startsWith(prefix)) k = k.slice(prefix.length).trim();
  }
  if (!k) throw new Error("Missing STRIPE_SECRET_KEY");

  // Standard secret (sk_) or restricted key (rk_) from Dashboard → API keys.
  if (!/^(sk|rk)_(test|live)_/.test(k)) {
    const head = k.slice(0, 28);
    const ascii = [...head].every((c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) < 127);
    const shown = ascii ? `${head}${k.length > 28 ? "..." : ""}` : "(non-ASCII prefix)";
    throw new Error(
      `STRIPE_SECRET_KEY must start with sk_test_, sk_live_, rk_test_, or rk_live_. ` +
        `Got ${k.length} chars beginning with "${shown}". ` +
        `In Vercel → Project → Settings → Environment Variables, the value must be ONLY the key from Stripe (not the text STRIPE_SECRET_KEY). ` +
        `Ensure Production is checked and redeploy after saving.`
    );
  }
  return k;
}

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = readStripeSecretKey();

  cached = new Stripe(key, {
    apiVersion: "2025-08-27.basil"
  });
  return cached;
}

