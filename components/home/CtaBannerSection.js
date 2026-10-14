import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CtaBannerSection() {
  return (
    <section className="public-section home-cta-section" style={{ backgroundColor: "var(--bg-primary)", paddingTop: "40px", paddingBottom: "80px" }}>
      <div className="public-container">
        <div
          className="glass home-cta-card"
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
              className="home-cta-heading"
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
            <p className="home-cta-subtext" style={{ fontSize: "15px", color: "var(--text-secondary, #777970)", lineHeight: "26px", margin: 0 }}>
              Whether you are an artist seeking your milestone role or a studio looking for vetted performers, Vismaya provides the infrastructure you need.
            </p>
          </div>

          <div className="home-cta-actions" style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
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

      <style jsx>{`
        @media (max-width: 640px) {
          :global(.home-cta-section) {
            padding-top: 36px !important;
            padding-bottom: 38px !important;
          }
          :global(.home-cta-section .public-container) {
            padding-left: 16px !important;
            padding-right: 16px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          :global(.home-cta-card) {
            padding: 18px !important;
            gap: 14px !important;
            border-radius: 14px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }
          :global(.home-cta-heading) {
            font-size: 22px !important;
            line-height: 1.2 !important;
            margin-bottom: 6px !important;
          }
          :global(.home-cta-subtext) {
            font-size: 14px !important;
            line-height: 1.5 !important;
          }
          :global(.home-cta-actions) {
            width: 100% !important;
            flex-direction: column !important;
            gap: 8px !important;
          }
          :global(.home-cta-actions .btn-primary),
          :global(.home-cta-actions .btn-secondary) {
            width: 100% !important;
            justify-content: center !important;
            height: 42px !important;
            min-height: 42px !important;
            font-size: 13px !important;
          }
        }
      `}</style>
    </section>
  );
}
