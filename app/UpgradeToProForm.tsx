"use client";

import { useState } from "react";

export function UpgradeToProForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = (await res.json().catch(() => null)) as unknown;
      const payload = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
      if (!res.ok) {
        setStatus("error");
        const detail =
          payload && typeof payload.message === "string"
            ? payload.message
            : payload && typeof payload.error === "string"
              ? payload.error
              : "Checkout failed";
        setMessage(detail);
        return;
      }
      if (payload && typeof payload.url === "string") {
        window.location.href = payload.url;
        return;
      }
      setStatus("error");
      setMessage("No checkout URL returned");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Request failed");
    }
  }

  return (
    <div id="upgrade-to-pro">
      <div style={{ fontWeight: 650, marginBottom: 8 }}>Upgrade to Pro</div>
      <p style={{ margin: "0 0 12px", color: "#94a3b8", fontSize: 14, lineHeight: 1.55 }}>
        Use the <strong style={{ color: "#e5e7eb" }}>same email</strong> you used when you requested your free API key so
        your limits update after checkout.
      </p>
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
            border: "1px solid rgba(16,185,129,0.5)",
            background: "rgba(16,185,129,0.15)",
            color: "#d1fae5",
            fontWeight: 650,
            cursor: status === "loading" ? "progress" : "pointer",
            opacity: status === "loading" || !email.trim() ? 0.7 : 1
          }}
        >
          {status === "loading" ? "Redirecting…" : "Continue to checkout"}
        </button>
      </div>
      <div style={{ color: status === "error" ? "#fca5a5" : "#94a3b8", fontSize: 12, marginTop: 8 }}>
        {message ?? "Secure payment via Stripe. $29/mo subscription."}
      </div>
    </div>
  );
}
