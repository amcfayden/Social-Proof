import { createHash } from "node:crypto";

/**
 * Must match how you store keys in Supabase: hex SHA-256 of (pepper + raw key).
 * Set API_KEY_HASH_PEPPER in Vercel to a long random string; use the same when hashing keys on insert.
 */
export function hashApiKey(raw: string): string {
  const pepper = process.env.API_KEY_HASH_PEPPER ?? "";
  return createHash("sha256").update(pepper + raw, "utf8").digest("hex");
}

export function getApiKeyFromHeaders(headers: Headers): string | null {
  const direct = headers.get("x-api-key");
  if (direct?.trim()) return direct.trim();

  const auth = headers.get("authorization");
  if (!auth) return null;
  const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
  return m?.[1]?.trim() ?? null;
}
