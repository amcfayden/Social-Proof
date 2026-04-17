export type ApiKeyDeliveryMode = "email" | "inline";

export function getApiKeyDeliveryMode(): ApiKeyDeliveryMode {
  const raw = (process.env.API_KEY_DELIVERY ?? "email").trim().toLowerCase();
  if (raw === "inline" || raw === "show" || raw === "page") return "inline";
  return "email";
}
