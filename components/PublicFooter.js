import Link from "next/link";
import Logo from "./Logo";

export default function PublicFooter() {
  return (
    <footer
      style={{
        backgroundColor: "#070b12",
        borderTop: "1px solid rgba(255, 255, 255, 0.10)",
        paddingTop: "clamp(56px, 8vw, 84px)",
        paddingBottom: "36px",
        marginTop: "auto",
        width: "100%",
        color: "#eceaf5",
      }}
    >
      <div className="public-container">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "48px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "40px",
            }}
          >
            {/* Brand column */}
            <div style={{ maxWidth: "380px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <Logo href="/" variant="light" showSubtitle={true} />
              <p style={{ color: "#a3acc2", fontSize: "14px", lineHeight: "24px", margin: 0 }}>
                India&apos;s premier verified entertainment casting platform connecting elite artists, casting directors, and top production houses with guaranteed authenticity.
              </p>
            </div>

            {/* Link Columns */}
            <div
              className="footer-columns"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "clamp(24px, 4vw, 48px)",
              }}
            >
              {/* Platform */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--gold)", letterSpacing: "0.16em", textTransform: "uppercase" }}>
                  Platform
                </span>
                <Link href="/talent/dashboard" style={{ fontSize: "14px", color: "#a3acc2", textDecoration: "none" }} className="footer-link">
                  Talent Portal
                </Link>
                <Link href="/recruiter/dashboard" style={{ fontSize: "14px", color: "#a3acc2", textDecoration: "none" }} className="footer-link">
                  Organization Portal
                </Link>
                <Link href="/admin/dashboard" style={{ fontSize: "14px", color: "#a3acc2", textDecoration: "none" }} className="footer-link">
                  Vismaya Desk
                </Link>
                <Link href="/opportunities" style={{ fontSize: "14px", color: "#a3acc2", textDecoration: "none" }} className="footer-link">
                  Active Casting Calls
                </Link>
              </div>

              {/* Company */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--gold)", letterSpacing: "0.16em", textTransform: "uppercase" }}>
                  Company
                </span>
                <Link href="/" style={{ fontSize: "14px", color: "#a3acc2", textDecoration: "none" }} className="footer-link">
                  Home
                </Link>
                <Link href="/about" style={{ fontSize: "14px", color: "#a3acc2", textDecoration: "none" }} className="footer-link">
                  About Us
                </Link>
                <Link href="/contact" style={{ fontSize: "14px", color: "#a3acc2", textDecoration: "none" }} className="footer-link">
                  Contact Support
                </Link>
                <Link href="/register" style={{ fontSize: "14px", color: "#a3acc2", textDecoration: "none" }} className="footer-link">
                  Join Network
                </Link>
              </div>

              {/* Legal */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--gold)", letterSpacing: "0.16em", textTransform: "uppercase" }}>
                  Trust &amp; Legal
                </span>
                <Link href="/about" style={{ fontSize: "14px", color: "#a3acc2", textDecoration: "none" }} className="footer-link">
                  KYC Verification
                </Link>
                <Link href="/about" style={{ fontSize: "14px", color: "#a3acc2", textDecoration: "none" }} className="footer-link">
                  Privacy Policy
                </Link>
                <Link href="/about" style={{ fontSize: "14px", color: "#a3acc2", textDecoration: "none" }} className="footer-link">
                  Terms of Service
                </Link>
                <Link href="/login" style={{ fontSize: "14px", color: "#a3acc2", textDecoration: "none" }} className="footer-link">
                  Account Sign In
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div
            style={{
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              paddingTop: "24px",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              fontSize: "13px",
              color: "#a3acc2",
            }}
          >
            <span>&copy; {new Date().getFullYear()} Vismaya Casting &amp; Talent Platform. All rights reserved.</span>
            <span style={{ color: "var(--gold)", fontWeight: "700" }}>Verified Casting Infrastructure</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        :global(.footer-link) {
          transition: color 0.18s ease;
        }
        :global(.footer-link:hover) {
          color: #ffbc00 !important;
        }
        @media (max-width: 767px) {
          .footer-columns {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
        }
      `}</style>
    </footer>
  );
}
