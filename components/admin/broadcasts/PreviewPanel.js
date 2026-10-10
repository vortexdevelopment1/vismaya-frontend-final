"use client";

import React, { useState } from "react";
import styles from "./broadcasts.module.css";

export default function PreviewPanel({
  audience,
  category,
  title,
  message,
  channelsSummary,
  estimatedReach,
  deliverySummary,
}) {
  const [previewRole, setPreviewRole] = useState("Talent"); // "Talent" | "Organization"
  const isUrgent = category === "Urgent update";

  return (
    <aside className={styles.side}>
      <div className={styles.card}>
        {/* Header with Role Segmented Toggle */}
        <div className={styles.ph}>
          <b>Preview</b>
          <div className={styles.seg} id="pvt">
            <button
              type="button"
              className={previewRole === "Talent" ? styles.on : ""}
              onClick={() => setPreviewRole("Talent")}
            >
              Talent
            </button>
            <button
              type="button"
              className={previewRole === "Organization" ? styles.on : ""}
              onClick={() => setPreviewRole("Organization")}
            >
              Organization
            </button>
          </div>
        </div>

        {/* Live Notification Card */}
        <div className={styles.pv}>
          <div className={styles.t}>
            <span
              className={styles.chip}
              id="pc"
              style={{
                "--c": isUrgent ? "var(--red, #ff6b6b)" : "var(--gold, #ffbc00)",
              }}
            >
              {category}
            </span>
            <span>Just now</span>
          </div>

          {title?.trim() ? (
            <h4 id="pt">{title.trim()}</h4>
          ) : null}

          <p
            id="pm"
            className={!message?.trim() ? styles.e : ""}
          >
            {message?.trim() || "Your message will appear here as you type."}
          </p>

          <div className={styles.m}>
            <span>From Vismaya</span>
            <span id="pto">To: {previewRole}</span>
          </div>
        </div>

        {/* Delivery Summary List */}
        <div className={styles.sm}>
          <div>
            <span>Audience</span>
            <b id="sa">{audience}</b>
          </div>
          <div>
            <span>Estimated reach</span>
            <b className={styles.g} id="sr">
              {estimatedReach}
            </b>
          </div>
          <div>
            <span>Channels</span>
            <b id="sc">{channelsSummary}</b>
          </div>
          <div>
            <span>Delivery</span>
            <b id="sd">{deliverySummary}</b>
          </div>
        </div>
      </div>
    </aside>
  );
}
