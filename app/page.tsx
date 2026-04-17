import { GetApiKeyForm } from "@/app/GetApiKeyForm";

const codeExample = `curl -X POST https://YOUR_DOMAIN/api/v1/social-proof-screenshot \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"url":"https://x.com/..."}' \\
  --output screenshot.png`;

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "48px 20px",
        background:
          "radial-gradient(1200px 600px at 20% 0%, rgba(99,102,241,0.18), transparent 55%), radial-gradient(900px 500px at 80% 10%, rgba(16,185,129,0.16), transparent 55%), #0b0f19",
        color: "#e5e7eb"
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 42
          }}
        >
          <div style={{ fontWeight: 700, letterSpacing: 0.3 }}>Social Proof Screenshot API</div>
          <a
            href="/docs"
            style={{
              color: "#93c5fd",
              textDecoration: "none",
              fontSize: 14
            }}
          >
            Read docs
          </a>
        </div>

        <h1 style={{ fontSize: 44, lineHeight: 1.05, margin: "0 0 12px" }}>
          Turn a tweet or LinkedIn post into a branded screenshot.
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.6, margin: "0 0 28px", maxWidth: 760, color: "#cbd5e1" }}>
          Send a social post URL, get back a PNG image with a simple brand bar. Authenticated with an API key and tracked
          via Supabase.
        </p>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            margin: "24px 0 18px"
          }}
        >
          <div
            style={{
              border: "1px solid rgba(148,163,184,0.18)",
              background: "rgba(15,23,42,0.55)",
              borderRadius: 14,
              padding: 18
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Free</div>
            <div style={{ fontSize: 28, fontWeight: 750, marginBottom: 6 }}>$0</div>
            <div style={{ color: "#94a3b8", fontSize: 14, marginBottom: 10 }}>100 requests / month</div>
            <div style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.5 }}>
              Great for testing and small automations.
            </div>
          </div>

          <div
            style={{
              border: "1px solid rgba(148,163,184,0.18)",
              background: "linear-gradient(180deg, rgba(99,102,241,0.24), rgba(15,23,42,0.55))",
              borderRadius: 14,
              padding: 18
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Pro</div>
            <div style={{ fontSize: 28, fontWeight: 750, marginBottom: 6 }}>$29</div>
            <div style={{ color: "#94a3b8", fontSize: 14, marginBottom: 10 }}>10,000 requests / month</div>
            <div style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.5 }}>
              For teams and content workflows at scale.
            </div>
          </div>
        </section>

        <section
          style={{
            border: "1px solid rgba(148,163,184,0.18)",
            background: "rgba(15,23,42,0.55)",
            borderRadius: 14,
            padding: 18,
            marginBottom: 10
          }}
        >
          <GetApiKeyForm />
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 16,
            marginTop: 26
          }}
        >
          <section
            style={{
              border: "1px solid rgba(148,163,184,0.18)",
              background: "rgba(15,23,42,0.55)",
              borderRadius: 14,
              padding: 18
            }}
          >
            <div style={{ fontWeight: 650, marginBottom: 10 }}>Endpoint</div>
            <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
              POST <span style={{ color: "#a7f3d0" }}>/api/v1/social-proof-screenshot</span>
            </div>
            <div style={{ color: "#94a3b8", marginTop: 8, fontSize: 14 }}>
              Header: <code>x-api-key</code> · Body: <code>{"{ url: string }"}</code> · Returns: <code>image/png</code>
            </div>
          </section>

          <section
            style={{
              border: "1px solid rgba(148,163,184,0.18)",
              background: "rgba(15,23,42,0.55)",
              borderRadius: 14,
              padding: 18
            }}
          >
            <div style={{ fontWeight: 650, marginBottom: 10 }}>Example</div>
            <pre
              style={{
                margin: 0,
                padding: 14,
                overflowX: "auto",
                borderRadius: 12,
                background: "rgba(2,6,23,0.75)",
                border: "1px solid rgba(148,163,184,0.16)",
                color: "#e2e8f0",
                fontSize: 13,
                lineHeight: 1.5
              }}
            >
              {codeExample}
            </pre>
          </section>
        </div>

        <footer style={{ marginTop: 34, color: "#64748b", fontSize: 13 }}>
          Tip: Create API keys in Supabase, store only hashes, and enforce per-key request limits.
        </footer>
      </div>
    </main>
  );
}

