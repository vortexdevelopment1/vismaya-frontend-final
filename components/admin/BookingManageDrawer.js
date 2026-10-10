"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  FileText,
  MessageSquare,
  Phone,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Plus,
  Bell,
  ShieldAlert,
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";

const STATUS_STEPS = ["Selected", "Scheduled", "Confirmed", "Completed"];

export default function BookingManageDrawer({
  isOpen,
  onClose,
  booking,
  onStatusChange,
  onUpdateSchedule,
  onAddNote,
  onSendAuditionAlert,
  onConfirmBooking,
}) {
  const [scheduleData, setScheduleData] = useState({
    auditionDate: "",
    auditionTime: "",
    location: "",
    scriptSides: "",
  });

  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    if (booking) {
      setScheduleData({
        auditionDate: booking.auditionDate || "",
        auditionTime: booking.auditionTime || "",
        location: booking.location || "",
        scriptSides: booking.scriptSides || "",
      });
    }
  }, [booking]);

  if (!isOpen || !booking) return null;

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    onUpdateSchedule(booking.id, scheduleData);
  };

  const handleAddNoteSubmit = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(booking.id, newNote.trim());
    setNewNote("");
  };

  const currentStepIdx = STATUS_STEPS.indexOf(booking.status);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(7, 11, 18, 0.75)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 90,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "660px",
          maxWidth: "100vw",
          backgroundColor: "var(--bg-alt)",
          borderLeft: "1px solid var(--glass-border-elevated)",
          boxShadow: "var(--shadow-lg)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          backdropFilter: "var(--glass-blur)",
          WebkitBackdropFilter: "var(--glass-blur)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            backgroundColor: "var(--bg-surface-elevated)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <img
              src={booking.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"}
              alt={booking.talentName}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                objectFit: "cover",
                border: "1px solid rgba(255, 188, 0, 0.3)",
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--gold)",
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "rgba(255, 188, 0, 0.12)",
                    border: "1px solid rgba(255, 188, 0, 0.30)",
                  }}
                >
                  {booking.id}
                </span>
                <StatusBadge status={booking.status} size="xs" />
              </div>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {booking.talentName}
              </h2>
              <p style={{ fontSize: "0.785rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                {booking.projectTitle} &bull; <span style={{ color: "var(--gold)", fontWeight: 700 }}>{booking.role}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              padding: "6px",
              borderRadius: "var(--radius-pill)",
              color: "var(--text-secondary)",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Offline Notice Banner */}
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "14px",
              backgroundColor: "rgba(255, 188, 0, 0.08)",
              border: "1px solid rgba(255, 188, 0, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.785rem",
              color: "var(--text-secondary)",
            }}
          >
            <ShieldAlert size={15} color="var(--gold)" style={{ flexShrink: 0 }} />
            <span>
              <strong style={{ color: "var(--gold)" }}>Admin Curated Flow:</strong> Audition logistics, call times, and talent contracts are coordinated directly and offline by Vismaya Admin.
            </span>
          </div>

          {/* Status Stepper */}
          <div>
            <div style={{ fontSize: "0.725rem", color: "var(--gold)", textTransform: "uppercase", fontWeight: 700, marginBottom: "8px" }}>
              Booking Lifecycle Stage
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "6px",
                backgroundColor: "var(--bg-surface-elevated)",
                padding: "6px",
                borderRadius: "16px",
                border: "1px solid var(--border-color)",
              }}
            >
              {STATUS_STEPS.map((step, idx) => {
                const isActive = booking.status === step;
                const isPassed = currentStepIdx > idx;

                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => onStatusChange(booking.id, step)}
                    style={{
                      padding: "6px 8px",
                      borderRadius: "10px",
                      background: isActive ? "var(--gold-gradient)" : isPassed ? "rgba(255, 188, 0, 0.12)" : "transparent",
                      color: isActive ? "var(--gold-text)" : isPassed ? "var(--gold)" : "var(--text-muted)",
                      border: isPassed ? "1px solid rgba(255, 188, 0, 0.30)" : "1px solid transparent",
                      fontSize: "0.75rem",
                      fontWeight: isActive || isPassed ? 700 : 500,
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {idx + 1}. {step}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact Details Quick Strip */}
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "14px",
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.785rem",
              color: "var(--text-secondary)",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontWeight: 600 }}>
              <Phone size={13} color="var(--gold)" />
              {booking.talentPhone || "+91 98765 43210"}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontWeight: 600 }}>
              <Mail size={13} color="var(--gold)" />
              {booking.talentEmail || "talent@vismaya.io"}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Recruiter: <strong style={{ color: "var(--text-primary)" }}>{booking.recruiterName}</strong>
            </span>
          </div>

          {/* Schedule Form */}
          <form
            onSubmit={handleScheduleSubmit}
            style={{
              padding: "16px",
              borderRadius: "16px",
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Audition &amp; Studio Schedule
              </h3>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                Logged to candidate &amp; recruiter
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Audition Date
                </label>
                <input
                  type="date"
                  value={scheduleData.auditionDate}
                  onChange={(e) => setScheduleData({ ...scheduleData, auditionDate: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: "10px",
                    backgroundColor: "var(--bg-input)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                    fontSize: "0.8rem",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Audition Slot Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 11:30 AM"
                  value={scheduleData.auditionTime}
                  onChange={(e) => setScheduleData({ ...scheduleData, auditionTime: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: "10px",
                    backgroundColor: "var(--bg-input)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                    fontSize: "0.8rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                Studio / Callback Location
              </label>
              <input
                type="text"
                placeholder="e.g. Studio 4, Famous Studios, Mahalaxmi, Mumbai"
                value={scheduleData.location}
                onChange={(e) => setScheduleData({ ...scheduleData, location: e.target.value })}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "10px",
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                  fontSize: "0.8rem",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                Script Sides &amp; Audition Brief for Talent
              </label>
              <textarea
                rows={2}
                placeholder="Scene descriptions, costume guidelines, dialogue test directions..."
                value={scheduleData.scriptSides}
                onChange={(e) => setScheduleData({ ...scheduleData, scriptSides: e.target.value })}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "10px",
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                  fontSize: "0.8rem",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="btn-primary"
                style={{
                  padding: "6px 16px",
                  fontSize: "0.785rem",
                }}
              >
                Save Schedule Details
              </button>
            </div>
          </form>

          {/* Coordination Notes Log */}
          <div
            style={{
              padding: "16px",
              borderRadius: "16px",
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <MessageSquare size={15} color="var(--gold)" />
                <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  Coordination Notes (Calls &amp; WhatsApp)
                </h3>
              </div>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                Offline audit trail
              </span>
            </div>

            {/* Existing notes */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
              {booking.coordinationNotes && booking.coordinationNotes.length > 0 ? (
                booking.coordinationNotes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "10px",
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-color)",
                      fontSize: "0.785rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                      <span style={{ fontWeight: 700, color: "var(--gold)" }}>{note.author}</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>{note.time}</span>
                    </div>
                    <p style={{ color: "var(--text-secondary)", lineHeight: 1.35, margin: 0 }}>{note.text}</p>
                  </div>
                ))
              ) : (
                <div style={{ padding: "10px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                  No coordination notes logged yet.
                </div>
              )}
            </div>

            {/* Add note input */}
            <form onSubmit={handleAddNoteSubmit} style={{ display: "flex", gap: "6px" }}>
              <input
                type="text"
                placeholder="Log phone call / WhatsApp update (e.g. 'Called manager, confirmed 11:30 AM slot')..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                style={{
                  flex: 1,
                  padding: "7px 10px",
                  borderRadius: "10px",
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                  fontSize: "0.785rem",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={!newNote.trim()}
                className="btn-primary"
                style={{
                  padding: "6px 14px",
                  fontSize: "0.75rem",
                  opacity: newNote.trim() ? 1 : 0.6,
                  cursor: newNote.trim() ? "pointer" : "not-allowed",
                }}
              >
                <Plus size={13} /> Add
              </button>
            </form>
          </div>
        </div>

        {/* Footer Quick Actions */}
        <div
          style={{
            padding: "14px 22px",
            borderTop: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-surface-elevated)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => onStatusChange(booking.id, "Cancelled")}
            style={{
              padding: "8px 16px",
              borderRadius: "12px",
              backgroundColor: "rgba(255, 107, 107, 0.12)",
              color: "var(--danger)",
              border: "1px solid var(--danger-border)",
              fontSize: "0.785rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cancel Booking
          </button>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => onSendAuditionAlert(booking.id)}
              className="btn-secondary"
              style={{
                padding: "8px 16px",
                color: "var(--gold)",
                borderColor: "rgba(255, 188, 0, 0.35)",
                fontSize: "0.785rem",
                gap: "4px",
                borderRadius: "12px",
              }}
            >
              <Bell size={13} /> Send Audition Alert
            </button>

            <button
              type="button"
              onClick={() => onConfirmBooking(booking.id)}
              className="btn-primary"
              style={{
                padding: "8px 18px",
                fontSize: "0.785rem",
                gap: "5px",
                borderRadius: "12px",
              }}
            >
              <CheckCircle2 size={14} /> Confirm Booking
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
