import { randomBytes } from "node:crypto";

import { hashApiKey } from "@/lib/auth/apiKey";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type MintedApiKey = {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
  apiKeyId: string;
};

function generateRawKey(): string {
  // URL-safe base64 without padding; prefixed for recognizability.
  const token = randomBytes(32)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
  return `spk_${token}`;
}

export async function mintApiKeyForEmail(email: string): Promise<MintedApiKey> {
  const normalizedEmail = email.trim().toLowerCase();
  const rawKey = generateRawKey();
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.slice(0, 8);

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      email: normalizedEmail,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      plan: "free",
      requests_used: 0,
      requests_limit: 100
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message ?? "Failed to create API key");
  }

  return { rawKey, keyHash, keyPrefix, apiKeyId: data.id as string };
}

