const exampleCurl = `curl -X POST https://YOUR_DOMAIN/api/v1/social-proof-screenshot \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"url":"https://x.com/..."}' \\
  --output proof.png`;

export default function DocsPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "48px 20px",
        background: "#0b0f19",
        color: "#e5e7eb"
      }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 34 }}>API Documentation</h1>
          <a href="/" style={{ color: "#93c5fd", textDecoration: "none", fontSize: 14 }}>
            Back to home
          </a>
        </div>

        <section style={{ marginTop: 22, lineHeight: 1.6, color: "#cbd5e1" }}>
          <p style={{ marginTop: 0 }}>
            Social Proof Screenshot API turns an X/Twitter or LinkedIn post URL into a branded PNG screenshot.
          </p>
        </section>

        <section style={{ marginTop: 22 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>Authentication</h2>
          <div style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
            Pass your API key using the <code>x-api-key</code> header.
          </div>
        </section>

        <section style={{ marginTop: 22 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>Getting an API key</h2>
          <div style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
            <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
              POST <span style={{ color: "#a7f3d0" }}>/api/request-api-key</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <strong>Body</strong>: <code>{"{ email: string }"}</code>
            </div>
            <div style={{ marginTop: 8 }}>
              Delivery is controlled by the server env var <code>API_KEY_DELIVERY</code>:
            </div>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
              <li>
                <strong>email</strong> (default): emails the raw key (requires <code>RESEND_API_KEY</code> +{" "}
                <code>EMAIL_FROM</code>)
              </li>
              <li>
                <strong>inline</strong>: returns the raw key in JSON (dev-only; do not use in production)
              </li>
            </ul>
          </div>
        </section>

        <section style={{ marginTop: 22 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>Endpoint</h2>
          <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
            POST <span style={{ color: "#a7f3d0" }}>/api/v1/social-proof-screenshot</span>
          </div>
          <div style={{ color: "#cbd5e1", marginTop: 8, lineHeight: 1.6 }}>
            <div>
              <strong>Body</strong>: <code>{"{ url: string }"}</code>
            </div>
            <div>
              <strong>Response</strong>: <code>image/png</code>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 22 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>Example</h2>
          <pre
            style={{
              margin: 0,
              padding: 14,
              overflowX: "auto",
              borderRadius: 12,
              background: "rgba(2,6,23,0.85)",
              border: "1px solid rgba(148,163,184,0.16)",
              color: "#e2e8f0",
              fontSize: 13,
              lineHeight: 1.5
            }}
          >
            {exampleCurl}
          </pre>
        </section>

        <section style={{ marginTop: 22 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>Error codes</h2>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1", lineHeight: 1.7 }}>
            <li>
              <strong>400</strong> — invalid JSON body, missing/invalid URL, or URL not allowed
            </li>
            <li>
              <strong>401</strong> — missing or invalid API key
            </li>
            <li>
              <strong>429</strong> — request limit exceeded for this API key
            </li>
            <li>
              <strong>500</strong> — render failed (browser/screenshot failure)
            </li>
            <li>
              <strong>503</strong> — usage check failed (database/RPC unavailable)
            </li>
          </ul>
        </section>

        <section style={{ marginTop: 22 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>Rate limits</h2>
          <div style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
            Limits are enforced per API key and reset monthly:
            <ul style={{ margin: "10px 0 0", paddingLeft: 18 }}>
              <li>
                <strong>Free</strong>: 100 requests / month
              </li>
              <li>
                <strong>Pro</strong>: 10,000 requests / month
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}

