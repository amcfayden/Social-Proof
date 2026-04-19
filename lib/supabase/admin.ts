import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

function readServiceRoleKey(): string {
  let k = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (k.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
    k = k.slice("SUPABASE_SERVICE_ROLE_KEY=".length).trim();
  }
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1).trim();
  }
  return k;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = readServiceRoleKey();

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  return cached;
}
