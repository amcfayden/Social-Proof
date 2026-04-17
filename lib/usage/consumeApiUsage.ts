import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type ConsumeApiUsageResult =
  | { ok: true; apiKeyId: string }
  | { ok: false; error: "invalid_key" | "limit_exceeded" | "rpc_error"; message?: string };

const ENDPOINT_PATH = "/api/v1/social-proof-screenshot";

export async function consumeApiUsage(keyHash: string): Promise<ConsumeApiUsageResult> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.rpc("consume_api_usage", {
    p_key_hash: keyHash,
    p_endpoint: ENDPOINT_PATH
  });

  if (error) {
    return { ok: false, error: "rpc_error", message: error.message };
  }

  const row = data as { ok?: boolean; error?: string; api_key_id?: string } | null;
  if (!row || typeof row !== "object") {
    return { ok: false, error: "rpc_error", message: "Unexpected RPC response" };
  }

  if (row.ok === true && row.api_key_id) {
    return { ok: true, apiKeyId: row.api_key_id };
  }

  if (row.error === "limit_exceeded") {
    return { ok: false, error: "limit_exceeded" };
  }

  return { ok: false, error: "invalid_key" };
}
