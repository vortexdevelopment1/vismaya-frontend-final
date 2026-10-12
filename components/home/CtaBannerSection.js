import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CtaBannerSection() {
  return (
    <section className="public-section" style={{ backgroundColor: "var(--bg-primary)", paddingTop: "40px", paddingBottom: "80px" }}>
      <div className="public-container">
        <div
          className="glass"
          style={{
            borderRadius: "var(--radius-card, 6px)",
            padding: "clamp(36px, 6vw, 64px) clamp(24px, 5vw, 56px)",
            backgroundColor: "var(--bg-surface, #FFFFFF)",
            border: "1px solid var(--border-color, #E4E1D9)",
            boxShadow: "var(--shadow-sm, 0 1px 4px rgba(41, 44, 41, 0.04))",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "32px",
          }}
        >
          <div style={{ maxWidth: "680px" }}>
            <div className="eyebrow" style={{ marginBottom: "14px" }}>
              <span>Ready to Elevate Your Casting?</span>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-heading), Georgia, 'Times New Roman', serif",
                fontSize: "clamp(28px, 4vw, 42px)",
                lineHeight: 1.18,
                fontWeight: 400,
                color: "var(--text-primary, #292C29)",
                margin: "0 0 12px 0",
              }}
            >
              Join India&apos;s Most Trusted Entertainment Platform
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-secondary, #777970)", lineHeight: "26px", margin: 0 }}>
              Whether you are an artist seeking your milestone role or a studio looking for vetted performers, Vismaya provides the infrastructure you need.
            </p>
          </div>

          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
            <Link href="/register" className="btn-primary">
              <span>Join Vismaya Today</span>
              <ArrowRight size={15} />
            </Link>
            <Link href="/login" className="btn-secondary">
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
