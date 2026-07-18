"use client";

/**
 * Last-resort error boundary (covers errors in the root layout itself).
 * Renders its own html/body, styled inline so it needs no CSS bundle.
 */

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafaf8",
          color: "#1c1917",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: "#78716c", lineHeight: 1.6 }}>
            An unexpected error stopped Hola Amigo Travelmate from loading.
            Please reload the page. If it keeps happening, WhatsApp us on
            +263 78 000 1111.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 16,
              padding: "12px 28px",
              borderRadius: 999,
              border: "none",
              background: "#f26a13",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
