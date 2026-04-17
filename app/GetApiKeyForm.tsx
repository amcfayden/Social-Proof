"use client";

import { useState } from "react";

export function GetApiKeyForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [inlineKey, setInlineKey] = useState<string | null>(null);

  async function submit() {
    setStatus("loading");
    setMessage(null);
    setInlineKey(null);
    try {
      const res = await fetch("/api/request-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = (await res.json().catch(() => null)) as unknown;
      const payload = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
      if (!res.ok) {
        setStatus("error");
        const errMsg = payload && typeof payload.error === "string" ? payload.error : "Request failed";
        setMessage(errMsg);
        return;
      }

      if (payload?.delivery === "inline" && typeof payload.apiKey === "string") {
        setStatus("sent");
        setInlineKey(payload.apiKey);
        setMessage("Copy your API key now. It won’t be shown again.");
        return;
      }

      setStatus("sent");
      setMessage("Check your email for your API key.");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Request failed");
    }
  }

  return (
    <div>
      <div style={{ fontWeight: 650, marginBottom: 8 }}>Get API Key</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="you@example.com"
          required
          style={{
            flex: "1 1 260px",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(148,163,184,0.22)",
            background: "rgba(2,6,23,0.55)",
            color: "#e5e7eb",
            outline: "none"
          }}
        />
        <button
          type="button"
          disabled={status === "loading" || !email.trim()}
          onClick={submit}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(99,102,241,0.55)",
            background: "rgba(99,102,241,0.18)",
            color: "#e2e8f0",
            fontWeight: 650,
            cursor: status === "loading" ? "progress" : "pointer",
            opacity: status === "loading" || !email.trim() ? 0.7 : 1
          }}
        >
          {status === "loading" ? "Working..." : "Get API key"}
        </button>
      </div>
      <div style={{ color: status === "error" ? "#fca5a5" : "#94a3b8", fontSize: 12, marginTop: 8 }}>
        {message ?? "Choose delivery mode via API_KEY_DELIVERY (email or inline)."}
      </div>

      {inlineKey ? (
        <pre
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            overflowX: "auto",
            background: "rgba(2,6,23,0.85)",
            border: "1px solid rgba(148,163,184,0.16)",
            color: "#e2e8f0",
            fontSize: 13,
            lineHeight: 1.5
          }}
        >
          {inlineKey}
        </pre>
      ) : null}
    </div>
  );
}

