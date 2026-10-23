"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TalentPortfolioRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/talent/profile?step=2");
  }, [router]);

  return (
    <div style={{ padding: "48px 24px", textAlign: "center", color: "#5A584F", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
      <div style={{ display: "inline-block", padding: "16px 24px", backgroundColor: "#FFFFFF", border: "1px solid #E8E2D4", borderRadius: "12px", boxShadow: "0 2px 8px rgba(43,45,42,0.04)" }}>
        <p style={{ margin: 0, fontSize: "14px", fontWeight: 500 }}>Redirecting to Step 2: Portfolio & Media...</p>
      </div>
    </div>
  );
}
