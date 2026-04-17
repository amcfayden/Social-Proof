/** CORS for browser clients calling the API cross-origin. Tighten origin in production if needed. */
export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
  "Access-Control-Max-Age": "86400"
};

export function mergeHeaders(base: Record<string, string>, extra?: HeadersInit): Headers {
  const h = new Headers(base);
  if (extra) {
    new Headers(extra).forEach((v, k) => h.set(k, v));
  }
  return h;
}
