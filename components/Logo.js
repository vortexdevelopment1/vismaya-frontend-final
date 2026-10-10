import Link from "next/link";

export default function Logo({
  size = "md",
  href = "/",
  showSubtitle = false,
  variant = "light",
  className = "",
}) {
  const isSmall = size === "sm";

  const content = (
    <div
      className={`vismaya-logo ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        userSelect: "none",
        textDecoration: "none",
      }}
    >
      {/* 36px Gold Icon Box */}
      <div
        style={{
          width: isSmall ? "30px" : "36px",
          height: isSmall ? "30px" : "36px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, #ffd54a 0%, #ffbc00 100%)",
          color: "#1a1300",
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--font-heading), 'Playfair Display', serif",
          fontSize: isSmall ? "16px" : "19px",
          fontWeight: "900",
          lineHeight: 1,
          flexShrink: 0,
          boxShadow: "0 4px 14px rgba(255, 188, 0, 0.35)",
        }}
      >
        V
      </div>

      {/* Wordmark */}
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          style={{
            fontFamily: "var(--font-heading), 'Playfair Display', serif",
            fontWeight: "700",
            fontSize: isSmall ? "16px" : "20px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#eceaf5",
          }}
        >
          VISMAYA
        </span>
        {showSubtitle && (
          <span
            style={{
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              fontSize: "9px",
              fontWeight: "700",
              letterSpacing: "0.16em",
              color: "var(--gold)",
              textTransform: "uppercase",
              marginTop: "3px",
            }}
          >
            CASTING PLATFORM
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
        {content}
      </Link>
    );
  }

  return content;
}
