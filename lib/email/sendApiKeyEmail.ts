export async function sendApiKeyEmail(params: {
  to: string;
  rawKey: string;
  dashboardUrl?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey) throw new Error("Missing RESEND_API_KEY");
  if (!from) throw new Error("Missing EMAIL_FROM");

  const subject = "Your Social Proof API key";
  const dashboardUrl = params.dashboardUrl ?? "";
  const text = [
    "Here is your Social Proof Screenshot API key:",
    "",
    params.rawKey,
    "",
    "Use it as an x-api-key header when calling the API.",
    dashboardUrl ? "" : null,
    dashboardUrl ? `Docs: ${dashboardUrl}` : null
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject,
      text
    })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend error (${res.status}): ${body || res.statusText}`);
  }
}

