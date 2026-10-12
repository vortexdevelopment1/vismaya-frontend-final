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
          borderRadius: "6px",
          background: "#8A6B2E",
          color: "#FFFFFF",
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--font-heading), 'Playfair Display', serif",
          fontSize: isSmall ? "16px" : "19px",
          fontWeight: "700",
          lineHeight: 1,
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(138, 107, 46, 0.22)",
        }}
      >
        V
      </div>

      {/* Wordmark */}
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          style={{
            fontFamily: "var(--font-heading), Georgia, serif",
            fontWeight: "400",
            fontSize: isSmall ? "16px" : "20px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: variant === "dark" ? "var(--text-primary, #292C29)" : "#FAF9F6",
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
      <Link href={href} style={{ textDecoration: "none", color: "inherit", display: "inline-flex", alignItems: "center" }}>
        {content}
      </Link>
    );
  }

  return content;
}
