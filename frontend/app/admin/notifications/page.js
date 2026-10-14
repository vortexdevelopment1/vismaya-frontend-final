"use client";

import React, { useState, useMemo } from "react";
import styles from "@/components/admin/broadcasts/broadcasts.module.css";
import { useWorkflow } from "@/lib/shared/workflowStore";
import ComposerCard from "@/components/admin/broadcasts/ComposerCard";
import PreviewPanel from "@/components/admin/broadcasts/PreviewPanel";
import RecentBroadcasts from "@/components/admin/broadcasts/RecentBroadcasts";
import SystemFeed from "@/components/admin/broadcasts/SystemFeed";
import HistoryTable from "@/components/admin/broadcasts/HistoryTable";
import SendConfirmModal from "@/components/admin/broadcasts/SendConfirmModal";

export default function AdminNotificationsPage() {
  const { notifications = [], broadcasts = [], sendBroadcast, saveBroadcastDraft, cancelScheduledBroadcast, markNotificationRead, markAllNotificationsRead, isHydrated } = useWorkflow();
  const [activeTab, setActiveTab] = useState("broadcasts");
  const [audience, setAudience] = useState("All users");
  const [targetCity, setTargetCity] = useState("Mumbai");
  const [targetOrgType, setTargetOrgType] = useState("Film Studio");
  const [category, setCategory] = useState("Platform announcement");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [emailChannel, setEmailChannel] = useState(true);
  const [smsChannel, setSmsChannel] = useState(false);
  const [whatsappChannel, setWhatsappChannel] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState("now");
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [confirmSendModal, setConfirmSendModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const reachMap = { "All users": "1,298 users", "All talent": "1,284 talent", "All organizations": "14 organizations", "Talent by city": "About 210 talent", "Organizations by type": "About 6 organizations" };
  const estimatedReach = reachMap[audience] || "1,298 users";
  const audienceLabel = audience === "Talent by city" ? `Talent in ${targetCity}` : audience === "Organizations by type" ? `Organizations (${targetOrgType})` : audience;

  const channelsSummary = useMemo(() => {
    const list = ["In-app"];
    if (emailChannel) list.push("Email");
    if (smsChannel && category === "Urgent update") list.push("SMS");
    if (whatsappChannel && category === "Urgent update") list.push("WhatsApp");
    return list.join(", ");
  }, [emailChannel, smsChannel, whatsappChannel, category]);

  const deliverySummary = useMemo(() => {
    if (deliveryMode === "now") return "Immediately";
    if (!scheduledDateTime) return "Scheduled";
    const d = new Date(scheduledDateTime);
    return isNaN(d.getTime()) ? "Scheduled" : d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }, [deliveryMode, scheduledDateTime]);

  const unreadCount = useMemo(() => notifications.filter((n) => (n.toRole === "vismaya" || (!n.toRole && !n.toUserId)) && !n.read).length, [notifications]);

  const validateBroadcast = () => {
    setValidationError("");
    if (!message.trim()) return (setValidationError("Message body is required."), false);
    if (message.trim().length < 10) return (setValidationError("Message must be at least 10 characters."), false);
    if (message.trim().length > 500) return (setValidationError("Message cannot exceed 500 characters."), false);
    if (deliveryMode === "schedule" && (!scheduledDateTime || new Date(scheduledDateTime).getTime() <= Date.now())) return (setValidationError("Please choose a future date/time."), false);
    return true;
  };

  const handleOpenConfirm = (e) => { e?.preventDefault?.(); if (validateBroadcast()) setConfirmSendModal(true); };

  const handleConfirmSend = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    sendBroadcast({
      title: title.trim(), message: message.trim(), audience: audienceLabel, category,
      channels: { inApp: true, email: emailChannel, sms: smsChannel, whatsapp: whatsappChannel },
      scheduledFor: deliveryMode === "schedule" ? new Date(scheduledDateTime).toISOString() : null,
      targetCity: audience === "Talent by city" ? targetCity : "All", targetOrgType: audience === "Organizations by type" ? targetOrgType : "All",
    });
    setToastMessage(deliveryMode === "schedule" ? `Broadcast scheduled for ${deliverySummary}.` : `Broadcast dispatched to ${estimatedReach}.`);
    setTimeout(() => setToastMessage(null), 4000);
    setTitle(""); setMessage(""); setDeliveryMode("now"); setScheduledDateTime(""); setConfirmSendModal(false); setIsSubmitting(false);
  };

  const handleSaveDraft = () => {
    if (!message.trim() && !title.trim()) return setValidationError("Please enter a title or message to save a draft.");
    saveBroadcastDraft({ title: title.trim(), message: message.trim(), audience: audienceLabel, category, channels: { inApp: true, email: emailChannel, sms: smsChannel, whatsapp: whatsappChannel } });
    setToastMessage("Broadcast draft saved.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleClear = () => { setTitle(""); setMessage(""); setValidationError(""); setDeliveryMode("now"); setScheduledDateTime(""); };

  const handleDuplicate = (bc) => {
    setTitle(bc.title || ""); setMessage(bc.message || "");
    if (bc.category) setCategory(bc.category);
    if (bc.channels) { setEmailChannel(!!bc.channels.email); setSmsChannel(!!bc.channels.sms); setWhatsappChannel(!!bc.channels.whatsapp); }
    setActiveTab("broadcasts");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setToastMessage("Broadcast copied to composer.");
    setTimeout(() => setToastMessage(null), 2500);
  };

  if (!isHydrated) return <div className={styles.page}><div style={{ height: "400px", borderRadius: "16px", background: "rgba(255,255,255,.05)" }} /></div>;

  return (
    <div className={styles.page}>
      <div className={styles.bc}>Dashboard &nbsp;›&nbsp; <b>Broadcasts</b></div>
      <h1 className={styles.title}>Notifications &amp; Broadcasts</h1>
      <p className={styles.sub}>Send announcements to talent and organizations, and track system alerts.</p>
      {toastMessage && <div className={styles.toast}><span>{toastMessage}</span></div>}
      <div className={styles.tabs} role="tablist">
        <button type="button" className={`${styles.tabBtn} ${activeTab === "broadcasts" ? styles.on : ""}`} onClick={() => setActiveTab("broadcasts")}>Broadcasts</button>
        <button type="button" className={`${styles.tabBtn} ${activeTab === "feed" ? styles.on : ""}`} onClick={() => setActiveTab("feed")}>System feed <i>{unreadCount || 3}</i></button>
        <button type="button" className={`${styles.tabBtn} ${activeTab === "history" ? styles.on : ""}`} onClick={() => setActiveTab("history")}>History</button>
      </div>
      {activeTab === "broadcasts" && (
        <>
          <div className={styles.lay}>
            <ComposerCard
              audience={audience} setAudience={setAudience} targetCity={targetCity} setTargetCity={setTargetCity}
              targetOrgType={targetOrgType} setTargetOrgType={setTargetOrgType} category={category} setCategory={setCategory}
              title={title} setTitle={setTitle} message={message} setMessage={setMessage}
              emailChannel={emailChannel} setEmailChannel={setEmailChannel} smsChannel={smsChannel} setSmsChannel={setSmsChannel}
              whatsappChannel={whatsappChannel} setWhatsappChannel={setWhatsappChannel} deliveryMode={deliveryMode} setDeliveryMode={setDeliveryMode}
              scheduledDateTime={scheduledDateTime} setScheduledDateTime={setScheduledDateTime} validationError={validationError} setValidationError={setValidationError}
              onClear={handleClear} onSaveDraft={handleSaveDraft} onOpenConfirm={handleOpenConfirm}
            />
            <PreviewPanel
              audience={audienceLabel} category={category} title={title} message={message}
              channelsSummary={channelsSummary} estimatedReach={estimatedReach} deliverySummary={deliverySummary}
            />
          </div>
          <RecentBroadcasts
            broadcasts={broadcasts} onViewAllHistory={() => setActiveTab("history")}
            onDuplicate={handleDuplicate} onCancelScheduled={cancelScheduledBroadcast}
          />
          <div className={styles.mobileBar}>
            <button type="button" className={styles.btn} onClick={handleSaveDraft}>Save draft</button>
            <button type="button" className={`${styles.btn} ${styles.pr}`} onClick={handleOpenConfirm}>Send broadcast</button>
          </div>
        </>
      )}
      {activeTab === "feed" && <SystemFeed notifications={notifications} onMarkRead={markNotificationRead} onMarkAllRead={() => markAllNotificationsRead("vismaya", "admin")} />}
      {activeTab === "history" && <HistoryTable broadcasts={broadcasts} onDuplicate={handleDuplicate} onCancelScheduled={cancelScheduledBroadcast} />}
      <SendConfirmModal
        isOpen={confirmSendModal} onClose={() => setConfirmSendModal(false)} onConfirm={handleConfirmSend}
        audience={audienceLabel} category={category} title={title} message={message}
        estimatedRecipients={estimatedReach} channelsSummary={channelsSummary} deliverySummary={deliverySummary} isSubmitting={isSubmitting}
      />
    </div>
  );
}

