"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  FolderKanban,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Edit,
  PlusCircle,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import ContactVismayaButton from "@/components/shared/ContactVismayaButton";
import { useWorkflow } from "@/lib/shared/workflowStore";
import { recruiterService } from "@/lib/api/services/recruiterService";
import { isRealMode } from "@/lib/api/config";

export default function RecruiterOpportunityDetailPage() {
  const params = useParams();
  const opportunityId = params?.opportunityId;

  const { opportunities, projects, applications } = useWorkflow();
  const [realOpp, setRealOpp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadOpportunity() {
      if (isRealMode("opportunities") || isRealMode("recruiter")) {
        try {
          const res = await recruiterService.getOpportunityById(opportunityId);
          if (res?.data && isMounted) {
            setRealOpp(res.data);
          }
        } catch (err) {
          console.warn("Failed to fetch opportunity by ID:", err);
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    if (opportunityId) {
      loadOpportunity();
    }
    return () => {
      isMounted = false;
    };
  }, [opportunityId]);

  const opp = realOpp || opportunities.find((o) => (o.id || o._id) === opportunityId);
  const proj = projects.find((p) => (p.id || p._id) === opp?.projectId);
  const oppApps = applications.filter((a) => (a.opportunityId || a.opportunity?._id) === opportunityId);

  if (loading) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "#5A584F" }}>
        Loading opportunity details...
      </div>
    );
  }

  if (!opp) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <Link
          href="/recruiter/opportunities"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "#5A584F",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Opportunities</span>
        </Link>
        <EmptyState
          title="Opportunity Not Found"
          description="The requested casting opportunity could not be found or you do not have permission to view it."
          icon={Briefcase}
          actionLabel="View All Opportunities"
          actionHref="/recruiter/opportunities"
        />
      </div>
    );
  }

  const isRejected = (opp.status || "").toLowerCase() === "rejected" || (opp.rawStatus || "").toLowerCase() === "rejected";
  const isCancelled = (opp.status || "").toLowerCase() === "cancelled" || (opp.rawStatus || "").toLowerCase() === "cancelled";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Top Back Nav */}
      <Link
        href="/recruiter/opportunities"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "#5A584F",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 600,
          width: "fit-content",
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Opportunities</span>
      </Link>

      {/* Rejection Notice Banner */}
      {isRejected && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "12px",
            backgroundColor: "rgba(180, 35, 24, 0.08)",
            border: "1px solid rgba(180, 35, 24, 0.28)",
            color: "#B42318",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
          className="recruiter-rejection-banner"
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <XCircle size={20} style={{ color: "#B42318", flexShrink: 0 }} />
              <strong style={{ fontSize: "16px" }}>Opportunity Rejected by Admin</strong>
              {opp.rejectedAt && (
                <span style={{ fontSize: "13px", opacity: 0.85 }}>
                  ({new Date(opp.rejectedAt).toLocaleDateString()})
                </span>
              )}
            </div>
            <Link
              href={`/recruiter/opportunities/new?edit=${opp.id || opp._id}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "8px",
                backgroundColor: "#B42318",
                color: "#FFFFFF",
                fontWeight: 600,
                fontSize: "13.5px",
                textDecoration: "none",
                boxShadow: "0 2px 6px rgba(180, 35, 24, 0.25)",
              }}
            >
              <Edit size={15} />
              <span>Edit and resubmit</span>
            </Link>
          </div>
          <div style={{ fontSize: "14px", lineHeight: "1.5", paddingLeft: "28px" }}>
            <strong>Reason: </strong>
            <span>{opp.rejectionReason || opp.adminNote || "No rejection reason provided."}</span>
            <div style={{ marginTop: "12px" }}>
              <ContactVismayaButton context="Rejected opportunity" reference={opp.id || opp._id} />
            </div>
          </div>
        </div>
      )}

      {/* Declined Cancellation Banner */}
      {opp.cancellationRequest?.decision === "declined" && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "12px",
            backgroundColor: "rgba(180, 35, 24, 0.08)",
            border: "1px solid rgba(180, 35, 24, 0.28)",
            color: "#B42318",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
          className="recruiter-cancellation-declined-banner"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={18} style={{ color: "#B42318", flexShrink: 0 }} />
            <div>
              <strong style={{ display: "block", fontSize: "15px" }}>Cancellation Request Declined</strong>
              <span style={{ fontSize: "13px", color: "#5A584F" }}>
                Vismaya moderation reviewed and declined your cancellation request.
              </span>
            </div>
          </div>
          {opp.cancellationRequest.declineReason && (
            <div style={{ fontSize: "13.5px", color: "#2B2D2A", paddingLeft: "26px" }}>
              <strong>Admin Note: </strong>
              <span>{opp.cancellationRequest.declineReason}</span>
            </div>
          )}
          <div style={{ paddingLeft: "26px" }}>
            <ContactVismayaButton context="Declined cancellation request" reference={opp.id || opp._id} />
          </div>
        </div>
      )}

      {/* Cancelled Notice Banner */}
      {isCancelled && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "12px",
            backgroundColor: "#F3EFE6",
            border: "1px solid #E8E2D4",
            color: "#2B2D2A",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
          className="recruiter-cancelled-banner"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={18} style={{ color: "#5A584F", flexShrink: 0 }} />
            <div>
              <strong style={{ display: "block", fontSize: "15px" }}>This opportunity was cancelled</strong>
              <span style={{ fontSize: "13px", color: "#5A584F" }}>
                Cancelled opportunities cannot be edited, but you can duplicate its details to create a new one.
              </span>
            </div>
          </div>
          <Link
            href={`/recruiter/opportunities/new?duplicateFrom=${opp.id || opp._id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "8px",
              backgroundColor: "#2B2D2A",
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "13.5px",
              textDecoration: "none",
            }}
          >
            <PlusCircle size={15} />
            <span>Duplicate as new</span>
          </Link>
        </div>
      )}

      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          padding: "24px",
          borderRadius: "14px",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E2D4",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "800px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 600,
                backgroundColor: "rgba(201, 165, 92, 0.16)",
                color: "#6E5420",
                border: "1px solid rgba(201, 165, 92, 0.32)",
              }}
            >
              {opp.opportunityType || "Casting Call"}
            </span>
            <StatusBadge status={opp.status} />
          </div>

          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#2B2D2A", margin: 0 }}>
            {opp.title}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#5A584F" }}>
            <FolderKanban size={15} style={{ color: "#8A6B2E" }} />
            <span>Project: </span>
            {proj ? (
              <Link
                href={`/recruiter/projects/${proj.id || proj._id}`}
                style={{ color: "#8A6B2E", fontWeight: 600, textDecoration: "none" }}
              >
                {proj.title || proj.projectName}
              </Link>
            ) : (
              <span style={{ fontWeight: 600 }}>{opp.projectName || "Assigned Project"}</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {isRejected && (
            <Link
              href={`/recruiter/opportunities/new?edit=${opp.id || opp._id}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 18px",
                borderRadius: "10px",
                backgroundColor: "#8A6B2E",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Edit size={16} />
              <span>Edit and resubmit</span>
            </Link>
          )}

          {isCancelled && (
            <Link
              href={`/recruiter/opportunities/new?duplicateFrom=${opp.id || opp._id}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 18px",
                borderRadius: "10px",
                backgroundColor: "#2B2D2A",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <PlusCircle size={16} />
              <span>Duplicate as new</span>
            </Link>
          )}

          <Link
            href={`/recruiter/opportunities/${opp.id || opp._id}/applicants`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 18px",
              borderRadius: "10px",
              border: "1px solid #E8E2D4",
              backgroundColor: "#F3EFE6",
              color: "#2B2D2A",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <Users size={16} style={{ color: "#8A6B2E" }} />
            <span>View Applicants ({oppApps.length})</span>
          </Link>
        </div>
      </div>

      {/* Overview Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: "#FFFFFF", border: "1px solid #E8E2D4" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#5A584F", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", marginBottom: "6px" }}>
            <Calendar size={14} />
            <span>Deadline</span>
          </div>
          <strong style={{ fontSize: "16px", color: "#2B2D2A" }}>{opp.deadline || "Not specified"}</strong>
        </div>

        <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: "#FFFFFF", border: "1px solid #E8E2D4" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#5A584F", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", marginBottom: "6px" }}>
            <MapPin size={14} />
            <span>Location</span>
          </div>
          <strong style={{ fontSize: "16px", color: "#2B2D2A" }}>{opp.location || "Not specified"}</strong>
        </div>

        <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: "#FFFFFF", border: "1px solid #E8E2D4" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#5A584F", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", marginBottom: "6px" }}>
            <DollarSign size={14} />
            <span>Remuneration</span>
          </div>
          <strong style={{ fontSize: "16px", color: "#2B2D2A" }}>{opp.remuneration || "Not disclosed"}</strong>
        </div>

        <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: "#FFFFFF", border: "1px solid #E8E2D4" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#5A584F", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", marginBottom: "6px" }}>
            <Users size={14} />
            <span>Total Positions</span>
          </div>
          <strong style={{ fontSize: "16px", color: "#2B2D2A" }}>{opp.positionsCount || 1}</strong>
        </div>
      </div>

      {/* Summary / Brief */}
      {opp.summary && (
        <div style={{ padding: "20px 24px", borderRadius: "14px", backgroundColor: "#FFFFFF", border: "1px solid #E8E2D4" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#2B2D2A", margin: "0 0 10px 0" }}>Summary &amp; Brief</h2>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#5A584F", margin: 0 }}>{opp.summary}</p>
        </div>
      )}

      {/* Roles Breakdown */}
      <div style={{ padding: "24px", borderRadius: "14px", backgroundColor: "#FFFFFF", border: "1px solid #E8E2D4" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#2B2D2A", margin: "0 0 16px 0" }}>
          Roles &amp; Characters ({Array.isArray(opp.roles) ? opp.roles.length : 1})
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {(Array.isArray(opp.roles) && opp.roles.length > 0 ? opp.roles : [
            {
              roleName: opp.role || "Lead Role",
              count: opp.positionsCount || 1,
              ageRange: opp.eligibility?.ageMin ? `${opp.eligibility.ageMin} - ${opp.eligibility.ageMax || 60} years` : "Open",
              gender: opp.eligibility?.gender || "Any",
              description: opp.summary,
              skills: opp.eligibility?.skills || [],
              languages: opp.eligibility?.languages || [],
            }
          ]).map((r, idx) => (
            <div
              key={r.id || `role-${idx}`}
              style={{
                padding: "16px 18px",
                borderRadius: "10px",
                backgroundColor: "#FAF9F7",
                border: "1px solid #E8E2D4",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <strong style={{ fontSize: "16px", color: "#2B2D2A" }}>
                  {r.roleName || `Role #${idx + 1}`}
                </strong>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: "6px",
                    backgroundColor: "#F3EFE6",
                    color: "#5A584F",
                  }}
                >
                  {r.count || r.positionsCount || 1} position{(r.count || r.positionsCount || 1) > 1 ? "s" : ""}
                </span>
              </div>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "13px", color: "#5A584F" }}>
                {r.ageRange && <span><strong>Age:</strong> {r.ageRange}</span>}
                {r.gender && <span><strong>Gender:</strong> {r.gender}</span>}
                {Array.isArray(r.languages) && r.languages.length > 0 && (
                  <span><strong>Languages:</strong> {r.languages.join(", ")}</span>
                )}
                {Array.isArray(r.skills) && r.skills.length > 0 && (
                  <span><strong>Skills:</strong> {r.skills.join(", ")}</span>
                )}
              </div>
              {r.description && (
                <p style={{ fontSize: "13.5px", color: "#5A584F", margin: "4px 0 0 0", lineHeight: "1.5" }}>
                  {r.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Custom Questions */}
      {Array.isArray(opp.customQuestions) && opp.customQuestions.length > 0 && (
        <div style={{ padding: "20px 24px", borderRadius: "14px", backgroundColor: "#FFFFFF", border: "1px solid #E8E2D4" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#2B2D2A", margin: "0 0 12px 0" }}>
            Custom Screening Questions ({opp.customQuestions.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {opp.customQuestions.map((q, idx) => (
              <div
                key={q.id || `q-${idx}`}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  fontSize: "14px",
                  color: "#2B2D2A",
                }}
              >
                <HelpCircle size={16} style={{ color: "#8A6B2E", flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <span>{q.questionText || q.question}</span>
                  {q.isRequired && (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#B42318", marginLeft: "6px" }}>
                      [Required]
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
