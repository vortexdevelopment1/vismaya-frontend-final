"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  PlusCircle,
  AlertTriangle,
  User,
  CheckCircle2,
  Calendar,
  Lock,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import Modal from "@/components/shared/Modal";
import PaymentCard from "@/components/payment/PaymentCard";
import { paymentService } from "@/lib/api/services/paymentService";
import { PRICING_CONFIG } from "@/lib/config/pricing";

export default function RecruiterCreditsPage() {
  const [credits, setCredits] = useState({
    balance: 100,
    includedCredits: 100,
    purchasedCredits: 0,
    consumedCredits: 0,
    lowBalanceWarning: false,
  });

  const [viewedTalents, setViewedTalents] = useState([]);
  const [buyPlan, setBuyPlan] = useState(null); // 'single_view' | 'bundle_views' | null
  const [isSuccessToast, setIsSuccessToast] = useState("");

  const loadData = async () => {
    const credRes = await paymentService.getCredits("org-1");
    setCredits(credRes);

    const viewedRes = await paymentService.getViewedTalents();
    setViewedTalents(viewedRes || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBuySuccess = (receipt) => {
    loadData();
    setBuyPlan(null);
    setIsSuccessToast("Views successfully added to your studio balance!");
    setTimeout(() => setIsSuccessToast(""), 5000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
      {/* Page Header */}
      <PageHeader
        title="Organization Credits"
        subtitle="Track profile-view credits, review previously unlocked comp-cards, and top up views for casting."
        badge="Zee Films • Studio Ledger"
        action={
          <button
            type="button"
            onClick={() => setBuyPlan("bundle_views")}
            className="btn-primary"
            style={{
              fontSize: "13px",
              fontWeight: "600",
              height: "38px",
              padding: "0 18px",
              gap: "6px",
              borderRadius: "8px",
            }}
          >
            <PlusCircle size={15} />
            <span>Buy More Views</span>
          </button>
        }
      />

      {/* Success Notification */}
      {isSuccessToast && (
        <div
          style={{
            backgroundColor: "#F3EFE6",
            border: "1px solid #E8E2D4",
            borderRadius: "8px",
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#8A6B2E",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          <CheckCircle2 size={18} />
          <span>{isSuccessToast}</span>
        </div>
      )}

      {/* Low Balance Warning Banner */}
      {credits.balance < PRICING_CONFIG.LOW_BALANCE && (
        <div
          style={{
            backgroundColor: "#FFFDF5",
            border: "1px solid #E8E2D4",
            borderLeft: "4px solid #8A6B2E",
            borderRadius: "8px",
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertTriangle size={20} style={{ color: "#8A6B2E", flexShrink: 0 }} />
            <div>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#2B2D2A" }}>
                Low Balance Warning: You have only {credits.balance} credits remaining
              </span>
              <div style={{ fontSize: "12.5px", color: "#5A584F", marginTop: "2px" }}>
                Top up your studio balance to continue unlocking full candidate showreels and contact comp-cards.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBuyPlan("bundle_views")}
            className="btn-primary"
            style={{ height: "36px", padding: "0 14px", fontSize: "12.5px" }}
          >
            Buy 25 Views (₹2,000)
          </button>
        </div>
      )}

      {/* 4 Overview Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "16px",
        }}
      >
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "2px solid #8A6B2E",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 4px 16px rgba(138, 107, 46, 0.08)",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "#8A6B2E", letterSpacing: "0.06em" }}>
            Available Balance
          </div>
          <div
            style={{
              fontFamily: "var(--font-heading), Georgia, serif",
              fontSize: "36px",
              fontWeight: "700",
              color: "#8A6B2E",
              margin: "6px 0",
            }}
          >
            {credits.balance}
          </div>
          <div style={{ fontSize: "12px", color: "#5A584F" }}>
            Profile-view credits • Never expire
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "#5A584F", letterSpacing: "0.06em" }}>
            Included with Signup
          </div>
          <div
            style={{
              fontFamily: "var(--font-heading), Georgia, serif",
              fontSize: "32px",
              fontWeight: "600",
              color: "#2B2D2A",
              margin: "6px 0",
            }}
          >
            {credits.includedCredits}
          </div>
          <div style={{ fontSize: "12px", color: "#5A584F" }}>
            Credited on registration
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "#5A584F", letterSpacing: "0.06em" }}>
            Purchased Views
          </div>
          <div
            style={{
              fontFamily: "var(--font-heading), Georgia, serif",
              fontSize: "32px",
              fontWeight: "600",
              color: "#2B2D2A",
              margin: "6px 0",
            }}
          >
            {credits.purchasedCredits}
          </div>
          <div style={{ fontSize: "12px", color: "#5A584F" }}>
            Top-up packs added
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "#5A584F", letterSpacing: "0.06em" }}>
            Profiles Unlocked
          </div>
          <div
            style={{
              fontFamily: "var(--font-heading), Georgia, serif",
              fontSize: "32px",
              fontWeight: "600",
              color: "#2B2D2A",
              margin: "6px 0",
            }}
          >
            {credits.consumedCredits}
          </div>
          <div style={{ fontSize: "12px", color: "#5A584F" }}>
            Candidate profiles viewed
          </div>
        </div>
      </div>

      {/* Buy More Views Section */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E2D4",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 2px 10px rgba(43, 45, 42, 0.02)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#2B2D2A", margin: 0 }}>
              Top Up Profile Views
            </h3>
            <p style={{ fontSize: "13.5px", color: "#5A584F", margin: "4px 0 0" }}>
              Add credits instantly to unlock actor contact information, high-res comp-cards, and self-tape showreels.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          {/* Option 1: Single View */}
          <div
            style={{
              backgroundColor: "#FAF9F7",
              border: "1px solid #E8E2D4",
              borderRadius: "10px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#5A584F" }}>
                Individual View
              </span>
              <div style={{ fontSize: "28px", fontWeight: "700", color: "#8A6B2E", margin: "6px 0" }}>
                ₹{PRICING_CONFIG.SINGLE_VIEW}
              </div>
              <p style={{ fontSize: "13px", color: "#5A584F", margin: 0, lineHeight: 1.45 }}>
                1 talent candidate full comp-card & showreel unlock. Includes 7-day free repeat access.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setBuyPlan("single_view")}
              className="btn-secondary"
              style={{
                width: "100%",
                height: "40px",
                justifyContent: "center",
                marginTop: "16px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              <span>Buy 1 View (₹100)</span>
            </button>
          </div>

          {/* Option 2: 25 Views Bundle */}
          <div
            style={{
              backgroundColor: "#FAF9F7",
              border: "2px solid #8A6B2E",
              borderRadius: "10px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-11px",
                right: "16px",
                backgroundColor: "#8A6B2E",
                color: "#FFFFFF",
                fontSize: "10px",
                fontWeight: "700",
                padding: "2px 10px",
                borderRadius: "12px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Recommended • Save ₹500
            </div>

            <div>
              <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#8A6B2E" }}>
                25 Views Bulk Pack
              </span>
              <div style={{ fontSize: "28px", fontWeight: "700", color: "#8A6B2E", margin: "6px 0" }}>
                ₹{PRICING_CONFIG.BUNDLE_PRICE.toLocaleString()}
              </div>
              <p style={{ fontSize: "13px", color: "#5A584F", margin: 0, lineHeight: 1.45 }}>
                ₹80 per view (Save 20%). Valid across all ongoing and future casting calls. Never expires.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setBuyPlan("bundle_views")}
              className="btn-primary"
              style={{
                width: "100%",
                height: "40px",
                justifyContent: "center",
                marginTop: "16px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              <span>Buy 25 Views (₹2,000)</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Previously Viewed Talent Table */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E2D4",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 2px 10px rgba(43, 45, 42, 0.02)",
        }}
      >
        <div style={{ marginBottom: "18px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#2B2D2A", margin: 0 }}>
            Previously Viewed Talent
          </h3>
          <p style={{ fontSize: "13px", color: "#5A584F", margin: "4px 0 0" }}>
            Candidates you have unlocked. Profiles remain completely free to re-examine during their 7-day window.
          </p>
        </div>

        {viewedTalents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 16px", color: "#5A584F", fontSize: "14px" }}>
            No profiles unlocked yet. Unlocking applicant profiles will automatically list them here with their 7-day free review window.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {viewedTalents.map((t) => {
              const freeUntilDate = new Date(t.freeUntil);
              const isFreeActive = freeUntilDate > new Date();

              return (
                <div
                  key={t.talentId}
                  style={{
                    backgroundColor: "#FAF9F7",
                    border: "1px solid #E8E2D4",
                    borderRadius: "8px",
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "14px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    {t.avatar ? (
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "50%",
                          backgroundImage: `url(${t.avatar})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          border: "1px solid #E8E2D4",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "50%",
                          backgroundColor: "#F3EFE6",
                          color: "#8A6B2E",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "600",
                          flexShrink: 0,
                        }}
                      >
                        <User size={20} />
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: "14.5px", fontWeight: "600", color: "#2B2D2A" }}>
                        {t.talentName}
                      </div>
                      <div style={{ fontSize: "12.5px", color: "#5A584F" }}>
                        {t.role || "Actor / Artist"} • Viewed {new Date(t.viewedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div
                      style={{
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "600",
                        backgroundColor: isFreeActive ? "#F3EFE6" : "#FAF9F7",
                        color: isFreeActive ? "#8A6B2E" : "#5A584F",
                        border: isFreeActive ? "1px solid #C9A55C" : "1px solid #E8E2D4",
                      }}
                    >
                      {isFreeActive
                        ? `Free until ${freeUntilDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                        : "7-Day Window Expired"}
                    </div>

                    <Link
                      href={`/recruiter/applications/app-1?opp=opp-1`}
                      className="btn-secondary"
                      style={{
                        height: "34px",
                        padding: "0 14px",
                        fontSize: "12px",
                        textDecoration: "none",
                        borderRadius: "6px",
                      }}
                    >
                      <span>Review Profile</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {buyPlan && (
        <Modal
          isOpen={!!buyPlan}
          onClose={() => setBuyPlan(null)}
          title="Buy Profile Views"
          subtitle={buyPlan === "bundle_views" ? "25 Views Pack (₹2,000)" : "Single Profile View (₹100)"}
          maxWidth="520px"
        >
          <PaymentCard
            type={buyPlan}
            userName="Zee Films Casting Desk"
            userEmail="casting@zeefilms.com"
            onSuccess={handleBuySuccess}
            onCancel={() => setBuyPlan(null)}
            isModal={true}
          />
        </Modal>
      )}
    </div>
  );
}
