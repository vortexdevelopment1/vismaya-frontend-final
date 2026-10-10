import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CtaBannerSection() {
  return (
    <section className="public-section" style={{ backgroundColor: "#070b12", paddingTop: "20px" }}>
      <div className="public-container">
        <div
          className="glass"
          style={{
            borderRadius: "24px",
            padding: "clamp(36px, 6vw, 64px) clamp(24px, 5vw, 56px)",
            background: "radial-gradient(70% 70% at 85% 20%, rgba(255, 188, 0, 0.16), transparent 70%), linear-gradient(135deg, #0f1626 0%, #0a0f19 100%)",
            border: "1px solid rgba(255, 188, 0, 0.30)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.60)",
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
                fontFamily: "var(--font-heading), 'Playfair Display', serif",
                fontSize: "clamp(28px, 4vw, 42px)",
                lineHeight: 1.18,
                fontWeight: 700,
                color: "#eceaf5",
                margin: "0 0 12px 0",
              }}
            >
              Join India&apos;s Most Trusted Entertainment Platform
            </h2>
            <p style={{ fontSize: "15px", color: "#a3acc2", lineHeight: "26px", margin: 0 }}>
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
