"use client";

import React from "react";
import styles from "./broadcasts.module.css";
import { AlertCircle } from "lucide-react";

export default function ComposerCard({
  audience,
  setAudience,
  targetCity,
  setTargetCity,
  targetOrgType,
  setTargetOrgType,
  category,
  setCategory,
  title,
  setTitle,
  message,
  setMessage,
  emailChannel,
  setEmailChannel,
  smsChannel,
  setSmsChannel,
  whatsappChannel,
  setWhatsappChannel,
  deliveryMode,
  setDeliveryMode,
  scheduledDateTime,
  setScheduledDateTime,
  validationError,
  setValidationError,
  onClear,
  onSaveDraft,
  onOpenConfirm,
}) {
  const isUrgent = category === "Urgent update";

  const handleAudienceChange = (e) => {
    setAudience(e.target.value);
  };

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    setCategory(val);
    if (val !== "Urgent update") {
      setSmsChannel(false);
      setWhatsappChannel(false);
    }
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    if (validationError) setValidationError("");
  };

  return (
    <div className={styles.card}>
      <div className={styles.ch}>
        <h2>Compose broadcast</h2>
        <p>Official communication to the Vismaya network.</p>
      </div>

      {validationError && (
        <div className={styles.valAlert}>
          <AlertCircle size={16} />
          <span>{validationError}</span>
        </div>
      )}

      <div className={styles.f}>
        {/* Audience Select */}
        <div>
          <label htmlFor="aud" className={styles.label}>Audience</label>
          <select
            id="aud"
            className={styles.sel}
            value={audience}
            onChange={handleAudienceChange}
          >
            <option value="All users">All users</option>
            <option value="All talent">All talent</option>
            <option value="All organizations">All organizations</option>
            <option value="Talent by city">Talent by city</option>
            <option value="Organizations by type">Organizations by type</option>
          </select>
          {audience === "Talent by city" && (
            <div style={{ marginTop: "8px" }}>
              <select
                className={styles.sel}
                value={targetCity}
                onChange={(e) => setTargetCity(e.target.value)}
              >
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi NCR">Delhi NCR</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Chennai">Chennai</option>
                <option value="Goa">Goa</option>
              </select>
            </div>
          )}
          {audience === "Organizations by type" && (
            <div style={{ marginTop: "8px" }}>
              <select
                className={styles.sel}
                value={targetOrgType}
                onChange={(e) => setTargetOrgType(e.target.value)}
              >
                <option value="Film Studio">Film Studio</option>
                <option value="Production House">Production House</option>
                <option value="Casting Agency">Casting Agency</option>
                <option value="Talent Management">Talent Management</option>
              </select>
            </div>
          )}
        </div>

        {/* Category Select */}
        <div>
          <label htmlFor="cat" className={styles.label}>Category</label>
          <select
            id="cat"
            className={styles.sel}
            value={category}
            onChange={handleCategoryChange}
          >
            <option value="Platform announcement">Platform announcement</option>
            <option value="New opportunities">New opportunities</option>
            <option value="Policy update">Policy update</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Urgent update">Urgent update</option>
          </select>
        </div>

        {/* Title Input */}
        <div className={styles.w}>
          <label htmlFor="ti" className={styles.lb}>
            Title <small>(optional)</small>
          </label>
          <input
            id="ti"
            type="text"
            className={styles.in}
            maxLength={80}
            placeholder="Short headline, for example: New OTT auditions this week"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Message Textarea */}
        <div className={styles.w}>
          <label htmlFor="ms" className={styles.label}>Message</label>
          <textarea
            id="ms"
            className={styles.ta}
            maxLength={500}
            placeholder="Write the message (10 to 500 characters)"
            value={message}
            onChange={handleMessageChange}
          />
          <div className={styles.ct} id="ct">
            {message.length} / 500
          </div>
        </div>

        {/* Channels Row */}
        <div className={styles.w}>
          <div className={styles.lb}>Channels</div>
          <div className={styles.ch4} id="chs">
            {/* In-app (Locked) */}
            <div
              className={`${styles.tg} ${styles.on}`}
              style={{ cursor: "default" }}
              title="Always active"
            >
              <span>In-app</span>
              <span className={styles.sw} />
            </div>

            {/* Email Toggle */}
            <div
              className={`${styles.tg} ${emailChannel ? styles.on : ""}`}
              onClick={() => setEmailChannel(!emailChannel)}
              role="button"
              tabIndex={0}
            >
              <span>Email</span>
              <span className={styles.sw} />
            </div>

            {/* SMS Toggle */}
            <div
              className={`${styles.tg} ${!isUrgent ? styles.off : smsChannel ? styles.on : ""}`}
              onClick={() => isUrgent && setSmsChannel(!smsChannel)}
              role="button"
              tabIndex={0}
              title={!isUrgent ? "Unlocks only for Urgent updates" : "Toggle SMS"}
            >
              <span>SMS</span>
              <span className={styles.sw} />
            </div>

            {/* WhatsApp Toggle */}
            <div
              className={`${styles.tg} ${!isUrgent ? styles.off : whatsappChannel ? styles.on : ""}`}
              onClick={() => isUrgent && setWhatsappChannel(!whatsappChannel)}
              role="button"
              tabIndex={0}
              title={!isUrgent ? "Unlocks only for Urgent updates" : "Toggle WhatsApp"}
            >
              <span>WhatsApp</span>
              <span className={styles.sw} />
            </div>
          </div>
          <p className={styles.hint}>
            SMS and WhatsApp unlock only for Urgent updates such as audition timing.
          </p>
        </div>

        {/* Delivery Segmented Control */}
        <div className={styles.w}>
          <div className={styles.lb}>Delivery</div>
          <div className={styles.when}>
            <div className={styles.seg}>
              <button
                type="button"
                className={deliveryMode === "now" ? styles.on : ""}
                onClick={() => setDeliveryMode("now")}
              >
                Send now
              </button>
              <button
                type="button"
                className={deliveryMode === "schedule" ? styles.on : ""}
                onClick={() => setDeliveryMode("schedule")}
              >
                Schedule
              </button>
            </div>
            {deliveryMode === "schedule" && (
              <input
                id="dt"
                type="datetime-local"
                className={styles.in}
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className={styles.ft}>
        <button
          type="button"
          className={`${styles.btn} ${styles.gh}`}
          id="clr"
          onClick={onClear}
        >
          Clear
        </button>
        <button
          type="button"
          className={styles.btn}
          onClick={onSaveDraft}
        >
          Save draft
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.pr}`}
          onClick={onOpenConfirm}
        >
          Send broadcast
        </button>
      </div>
    </div>
  );
}
