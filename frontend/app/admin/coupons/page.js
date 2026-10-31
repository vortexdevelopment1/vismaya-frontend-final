"use client";

import React, { useState, useEffect } from "react";
import {
  Ticket,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Copy,
  Check,
  Eye,
  Edit3,
  Trash2,
  Filter,
  Sparkles,
  Layers,
  ArrowRight,
  Percent,
  IndianRupee,
  ShieldAlert,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import Modal from "@/components/shared/Modal";
import StatusBadge from "@/components/shared/StatusBadge";
import { adminService } from "@/lib/api/services/adminService";
import { PRICING_CONFIG } from "@/lib/config/pricing";

const AVAILABLE_PACKAGES = [
  { id: "talent_annual_999", label: "Talent Annual Registration (₹999)" },
  { id: "industry_annual_4999", label: "Organization Annual Registration (₹4,999)" },
  { id: "credit_single_100", label: "Single Profile View Credit (₹100)" },
  { id: "credit_bundle_25_2000", label: "Bulk Pack 25 Profile Views (₹2,000)" },
];

const SIMULATION_PACKAGES = [
  {
    id: "talent_annual_999",
    name: "Talent Annual Registration",
    category: "Talent Platform",
    basePrice: 999,
  },
  {
    id: "industry_annual_4999",
    name: "Studio / Organization Annual",
    category: "Studio Platform",
    basePrice: 4999,
  },
  {
    id: "credit_bundle_25_2000",
    name: "Bulk Pack 25 Profile Views",
    category: "Credits",
    basePrice: 2000,
  },
  {
    id: "credit_single_100",
    name: "Single Profile View Credit",
    category: "Credits",
    basePrice: 100,
  },
];

const getPackageSimulation = (coupon) => {
  if (!coupon) return [];
  const val = Number(coupon.discountValue ?? coupon.discountPercent ?? 0);
  const type = coupon.discountType || "percentage";
  const maxCap = coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : null;
  const minOrder = Number(coupon.minOrderAmount || 0);
  const packagesList = Array.isArray(coupon.applicablePackages) ? coupon.applicablePackages : [];

  return SIMULATION_PACKAGES.map((pkg) => {
    const isPackageAllowed = packagesList.length === 0 || packagesList.includes(pkg.id);
    const meetsMinOrder = pkg.basePrice >= minOrder;
    const isEligible = isPackageAllowed && meetsMinOrder;

    let discount = 0;
    if (isEligible) {
      if (type === "percentage") {
        discount = Math.round((pkg.basePrice * val) / 100);
        if (maxCap && discount > maxCap) {
          discount = maxCap;
        }
      } else {
        discount = Math.min(val, pkg.basePrice);
      }
    }

    const finalPayable = Math.max(0, pkg.basePrice - discount);
    let ineligibleReason = "";
    if (!isPackageAllowed) {
      ineligibleReason = "Not applicable for this package";
    } else if (!meetsMinOrder) {
      ineligibleReason = `Requires min order of ₹${minOrder.toLocaleString("en-IN")}`;
    }

    return {
      ...pkg,
      isEligible,
      ineligibleReason,
      discount,
      finalPayable,
    };
  });
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive' | 'expired'
  const [typeFilter, setTypeFilter] = useState("all"); // 'all' | 'percentage' | 'fixed'
  const [toastMessage, setToastMessage] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [viewingCoupon, setViewingCoupon] = useState(null);
  const [deletingCoupon, setDeletingCoupon] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const defaultFormState = {
    code: "",
    discountType: "percentage",
    discountValue: 20,
    userEligibility: "all",
    applicableUsersText: "",
    maxUses: "",
    maxUsesPerUser: 1,
    validFrom: new Date().toISOString().slice(0, 16),
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
    minOrderAmount: 0,
    maxDiscountAmount: "",
    applicablePackages: [], // empty = all
    isActive: true,
  };
  const [formData, setFormData] = useState(defaultFormState);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Coupon code ${code} copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await adminService.getCoupons();
      if (res?.success) {
        setCoupons(res.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch coupons", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormData(defaultFormState);
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || "",
      discountType: coupon.discountType || "percentage",
      discountValue: coupon.discountValue ?? (coupon.discountPercent || 0),
      userEligibility: coupon.userEligibility || "all",
      applicableUsersText: Array.isArray(coupon.applicableUsers) ? coupon.applicableUsers.join(", ") : "",
      maxUses: coupon.maxUses ?? "",
      maxUsesPerUser: coupon.maxUsesPerUser ?? 1,
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().slice(0, 16) : "",
      minOrderAmount: coupon.minOrderAmount ?? 0,
      maxDiscountAmount: coupon.maxDiscountAmount ?? "",
      applicablePackages: Array.isArray(coupon.applicablePackages) ? coupon.applicablePackages : [],
      isActive: coupon.isActive !== false,
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Toggle Active/Inactive
  const handleToggleStatus = async (coupon) => {
    const updatedStatus = !coupon.isActive;
    const res = await adminService.updateCoupon(coupon._id, { isActive: updatedStatus });
    if (res?.success) {
      showToast(`Coupon ${coupon.code} marked as ${updatedStatus ? "Active" : "Inactive"}`);
      loadCoupons();
    } else {
      showToast(res?.message || "Failed to update coupon status");
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deletingCoupon) return;
    setIsSubmitting(true);
    const res = await adminService.deleteCoupon(deletingCoupon._id);
    setIsSubmitting(false);
    if (res?.success) {
      showToast(`Coupon ${deletingCoupon.code} deleted successfully`);
      setDeletingCoupon(null);
      loadCoupons();
    } else {
      showToast(res?.message || "Failed to delete coupon");
    }
  };

  // Form Validation & Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    const cleanCode = (formData.code || "").trim().toUpperCase();
    if (!cleanCode) {
      errors.code = "Coupon code is required.";
    } else if (cleanCode.length < 3) {
      errors.code = "Coupon code must be at least 3 characters.";
    }

    const val = Number(formData.discountValue);
    if (isNaN(val) || val <= 0) {
      errors.discountValue = "Discount value must be greater than 0.";
    } else if (formData.discountType === "percentage" && val > 100) {
      errors.discountValue = "Percentage discount cannot exceed 100%.";
    }

    if (!formData.validUntil) {
      errors.validUntil = "Validity end date is required.";
    } else if (new Date(formData.validUntil) <= new Date(formData.validFrom)) {
      errors.validUntil = "Valid until date must be after valid from date.";
    }

    if (formData.userEligibility === "limited" && !formData.applicableUsersText.trim()) {
      errors.applicableUsersText = "Please provide at least one user email or ID for limited eligibility.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    const payload = {
      code: cleanCode,
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      userEligibility: formData.userEligibility,
      applicableUsers:
        formData.userEligibility === "limited"
          ? formData.applicableUsersText
              .split(/[,;\n]+/)
              .map((u) => u.trim())
              .filter(Boolean)
          : [],
      maxUses: formData.maxUses ? Number(formData.maxUses) : null,
      maxUsesPerUser: Number(formData.maxUsesPerUser || 1),
      validFrom: new Date(formData.validFrom).toISOString(),
      validUntil: new Date(formData.validUntil).toISOString(),
      minOrderAmount: Number(formData.minOrderAmount || 0),
      maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
      applicablePackages: formData.applicablePackages || [],
      isActive: formData.isActive,
    };

    let res;
    if (editingCoupon) {
      res = await adminService.updateCoupon(editingCoupon._id, payload);
    } else {
      res = await adminService.createCoupon(payload);
    }

    setIsSubmitting(false);

    if (res?.success) {
      showToast(editingCoupon ? `Coupon ${cleanCode} updated!` : `Coupon ${cleanCode} generated successfully!`);
      setIsFormModalOpen(false);
      loadCoupons();
    } else {
      setFormErrors({ submit: res?.message || "Failed to save coupon." });
    }
  };

  // Metrics Calculation
  const now = new Date();
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(
    (c) => c.isActive && (!c.validUntil || new Date(c.validUntil) >= now) && (!c.maxUses || (c.usedCount || 0) < c.maxUses)
  ).length;
  const expiredCoupons = coupons.filter((c) => c.validUntil && new Date(c.validUntil) < now).length;
  const totalRedemptions = coupons.reduce((acc, c) => acc + (c.usedCount || 0), 0);

  // Filtered List
  const filteredCoupons = coupons.filter((c) => {
    const q = searchTerm.toLowerCase().trim();
    const codeMatch = (c.code || "").toLowerCase().includes(q);
    const descMatch = (c.description || "").toLowerCase().includes(q);
    if (q && !codeMatch && !descMatch) return false;

    if (typeFilter !== "all" && c.discountType !== typeFilter) return false;

    const isExpired = c.validUntil && new Date(c.validUntil) < now;
    if (statusFilter === "active") {
      return c.isActive && !isExpired && (!c.maxUses || (c.usedCount || 0) < c.maxUses);
    }
    if (statusFilter === "inactive") {
      return !c.isActive;
    }
    if (statusFilter === "expired") {
      return isExpired;
    }
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Coupon Management"
        subtitle="Create and manage automatic discounts for users."
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Coupon Management" },
        ]}
        action={
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="btn-primary"
            style={{
              fontSize: "13px",
              fontWeight: "600",
              height: "40px",
              padding: "0 18px",
              gap: "8px",
              borderRadius: "8px",
              backgroundColor: "#8A6B2E",
              color: "#FFFFFF",
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <Plus size={16} />
            <span>Generate Coupon</span>
          </button>
        }
      />

      {/* Toast Notification */}
      {toastMessage && (
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
            boxShadow: "0 4px 12px rgba(138, 107, 46, 0.1)",
          }}
        >
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Overview Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "16px",
        }}
      >
        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E8E2D4", borderRadius: "12px", padding: "18px" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "#5A584F", letterSpacing: "0.06em" }}>
            Total Coupons
          </div>
          <div style={{ fontFamily: "var(--font-heading), Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#2B2D2A", margin: "4px 0" }}>
            {totalCoupons}
          </div>
          <div style={{ fontSize: "12px", color: "#5A584F" }}>All configured discount codes</div>
        </div>

        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E8E2D4", borderRadius: "12px", padding: "18px" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "#5A584F", letterSpacing: "0.06em" }}>
            Active Coupons
          </div>
          <div style={{ fontFamily: "var(--font-heading), Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#2E7D32", margin: "4px 0" }}>
            {activeCoupons}
          </div>
          <div style={{ fontSize: "12px", color: "#5A584F" }}>Currently eligible at checkout</div>
        </div>

        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E8E2D4", borderRadius: "12px", padding: "18px" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "#5A584F", letterSpacing: "0.06em" }}>
            Expired Coupons
          </div>
          <div style={{ fontFamily: "var(--font-heading), Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#C53030", margin: "4px 0" }}>
            {expiredCoupons}
          </div>
          <div style={{ fontSize: "12px", color: "#5A584F" }}>Validity period elapsed</div>
        </div>

        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E8E2D4", borderRadius: "12px", padding: "18px" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "#5A584F", letterSpacing: "0.06em" }}>
            Total Successful Redemptions
          </div>
          <div style={{ fontFamily: "var(--font-heading), Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#8A6B2E", margin: "4px 0" }}>
            {totalRedemptions}
          </div>
          <div style={{ fontSize: "12px", color: "#5A584F" }}>Discounted checkouts fulfilled</div>
        </div>
      </div>

      {/* 3. Coupons Management Table Card */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E2D4",
          borderRadius: "12px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        {/* Filters and Search Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", minWidth: "260px", flex: "1 1 300px" }}>
            <Search
              size={16}
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#5A584F" }}
            />
            <input
              type="text"
              placeholder="Search by coupon code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                height: "38px",
                paddingLeft: "36px",
                paddingRight: "14px",
                borderRadius: "8px",
                border: "1px solid #E8E2D4",
                fontSize: "13px",
                outline: "none",
                backgroundColor: "#FAF9F7",
                color: "#2B2D2A",
              }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            {/* Status Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", color: "#5A584F", fontWeight: "600" }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  height: "38px",
                  padding: "0 10px",
                  borderRadius: "8px",
                  border: "1px solid #E8E2D4",
                  fontSize: "13px",
                  backgroundColor: "#FAF9F7",
                  color: "#2B2D2A",
                  outline: "none",
                }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Type Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", color: "#5A584F", fontWeight: "600" }}>Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{
                  height: "38px",
                  padding: "0 10px",
                  borderRadius: "8px",
                  border: "1px solid #E8E2D4",
                  fontSize: "13px",
                  backgroundColor: "#FAF9F7",
                  color: "#2B2D2A",
                  outline: "none",
                }}
              >
                <option value="all">All Discount Types</option>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Desktop Data Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "960px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E8E2D4", backgroundColor: "#FAF9F7" }}>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#5A584F", textTransform: "uppercase" }}>
                  Coupon Code
                </th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#5A584F", textTransform: "uppercase" }}>
                  Discount
                </th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#5A584F", textTransform: "uppercase" }}>
                  Eligibility
                </th>
                <th style={{ padding: "12px 14px", textAlign: "center", fontSize: "12px", fontWeight: "700", color: "#5A584F", textTransform: "uppercase" }}>
                  Usage Limit
                </th>
                <th style={{ padding: "12px 14px", textAlign: "center", fontSize: "12px", fontWeight: "700", color: "#5A584F", textTransform: "uppercase" }}>
                  Used / Left
                </th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#5A584F", textTransform: "uppercase" }}>
                  Validity Period
                </th>
                <th style={{ padding: "12px 14px", textAlign: "center", fontSize: "12px", fontWeight: "700", color: "#5A584F", textTransform: "uppercase" }}>
                  Status
                </th>
                <th style={{ padding: "12px 14px", textAlign: "right", fontSize: "12px", fontWeight: "700", color: "#5A584F", textTransform: "uppercase" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "36px", textAlign: "center", color: "#5A584F", fontSize: "14px" }}>
                    {loading ? "Loading coupons..." : "No coupons found matching the selected filters."}
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => {
                  const isExpired = coupon.validUntil && new Date(coupon.validUntil) < now;
                  const isMaxedOut = coupon.maxUses && (coupon.usedCount || 0) >= coupon.maxUses;
                  const remaining = coupon.maxUses ? Math.max(0, coupon.maxUses - (coupon.usedCount || 0)) : "Unlimited";
                  const percentUsed = coupon.maxUses ? Math.min(100, Math.round(((coupon.usedCount || 0) / coupon.maxUses) * 100)) : null;

                  return (
                    <tr
                      key={coupon._id}
                      style={{
                        borderBottom: "1px solid #F0EEEA",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAF9F7")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* Code */}
                      <td style={{ padding: "14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontWeight: "700",
                              fontSize: "14px",
                              color: "#8A6B2E",
                              backgroundColor: "rgba(138, 107, 46, 0.1)",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(coupon.code)}
                            title="Copy code"
                            style={{
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              color: copiedCode === coupon.code ? "#2E7D32" : "#5A584F",
                              padding: "4px",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            {copiedCode === coupon.code ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>

                      {/* Discount Type & Value */}
                      <td style={{ padding: "14px" }}>
                        <div style={{ fontWeight: "600", color: "#2B2D2A", fontSize: "14px" }}>
                          {coupon.discountType === "percentage" ? `${coupon.discountValue}% Off` : `₹${coupon.discountValue} Flat`}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#5A584F" }}>
                          {coupon.maxDiscountAmount ? `Up to ₹${coupon.maxDiscountAmount}` : "No discount cap"}
                          {coupon.minOrderAmount > 0 ? ` • Min order ₹${coupon.minOrderAmount}` : ""}
                        </div>
                      </td>

                      {/* User Eligibility */}
                      <td style={{ padding: "14px" }}>
                        {coupon.userEligibility === "limited" ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "3px 8px",
                              borderRadius: "12px",
                              backgroundColor: "#FEF3C7",
                              color: "#92400E",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            <Users size={12} />
                            Limited ({coupon.applicableUsers?.length || 0})
                          </span>
                        ) : (
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "12px",
                              backgroundColor: "#ECFDF5",
                              color: "#065F46",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            All Users
                          </span>
                        )}
                        <div style={{ fontSize: "11px", color: "#5A584F", marginTop: "3px" }}>
                          {Array.isArray(coupon.applicablePackages) && coupon.applicablePackages.length > 0
                            ? `${coupon.applicablePackages.length} package(s)`
                            : "All packages"}
                        </div>
                      </td>

                      {/* Usage Limit */}
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        <div style={{ fontWeight: "600", color: "#2B2D2A", fontSize: "13px" }}>
                          {coupon.maxUses ? `${coupon.maxUses} total` : "Unlimited"}
                        </div>
                        <div style={{ fontSize: "11px", color: "#5A584F" }}>
                          {coupon.maxUsesPerUser || 1}/user
                        </div>
                      </td>

                      {/* Used / Remaining */}
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        <div style={{ fontWeight: "700", color: "#8A6B2E", fontSize: "13.5px" }}>
                          {coupon.usedCount || 0} <span style={{ fontWeight: "400", color: "#5A584F", fontSize: "12px" }}>used</span>
                        </div>
                        <div style={{ fontSize: "11px", color: remaining === 0 ? "#C53030" : "#5A584F" }}>
                          {remaining === "Unlimited" ? "Unlimited left" : `${remaining} left`}
                        </div>
                        {percentUsed !== null && (
                          <div
                            style={{
                              width: "60px",
                              height: "4px",
                              backgroundColor: "#E8E2D4",
                              borderRadius: "2px",
                              margin: "4px auto 0 auto",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${percentUsed}%`,
                                height: "100%",
                                backgroundColor: percentUsed >= 100 ? "#C53030" : "#8A6B2E",
                              }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Validity Period */}
                      <td style={{ padding: "14px" }}>
                        <div style={{ fontSize: "12.5px", color: "#2B2D2A", fontWeight: "500" }}>
                          {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Indefinite"}
                        </div>
                        <div style={{ fontSize: "11px", color: isExpired ? "#C53030" : "#5A584F" }}>
                          {isExpired ? "Expired" : "Expires in " + Math.ceil((new Date(coupon.validUntil) - now) / 86400000) + "d"}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        {isExpired ? (
                          <span style={{ padding: "3px 9px", borderRadius: "999px", backgroundColor: "#FEE2E2", color: "#991B1B", fontSize: "11px", fontWeight: "700" }}>
                            EXPIRED
                          </span>
                        ) : isMaxedOut ? (
                          <span style={{ padding: "3px 9px", borderRadius: "999px", backgroundColor: "#FEF3C7", color: "#92400E", fontSize: "11px", fontWeight: "700" }}>
                            MAXED OUT
                          </span>
                        ) : coupon.isActive ? (
                          <span style={{ padding: "3px 9px", borderRadius: "999px", backgroundColor: "#DCFCE7", color: "#166534", fontSize: "11px", fontWeight: "700" }}>
                            ACTIVE
                          </span>
                        ) : (
                          <span style={{ padding: "3px 9px", borderRadius: "999px", backgroundColor: "#F3F4F6", color: "#4B5563", fontSize: "11px", fontWeight: "700" }}>
                            INACTIVE
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => setViewingCoupon(coupon)}
                            title="View Coupon Details"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "6px",
                              border: "1px solid #E8E2D4",
                              backgroundColor: "#FFFFFF",
                              color: "#5A584F",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(coupon)}
                            title="Edit Coupon"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "6px",
                              border: "1px solid #E8E2D4",
                              backgroundColor: "#FFFFFF",
                              color: "#8A6B2E",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(coupon)}
                            title={coupon.isActive ? "Deactivate Coupon" : "Activate Coupon"}
                            style={{
                              padding: "0 10px",
                              height: "32px",
                              borderRadius: "6px",
                              border: "1px solid #E8E2D4",
                              backgroundColor: coupon.isActive ? "#F3EFE6" : "#E8E2D4",
                              color: coupon.isActive ? "#8A6B2E" : "#5A584F",
                              fontSize: "11.5px",
                              fontWeight: "600",
                              cursor: "pointer",
                            }}
                          >
                            {coupon.isActive ? "Disable" : "Enable"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingCoupon(coupon)}
                            title="Delete Coupon"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "6px",
                              border: "1px solid #FEE2E2",
                              backgroundColor: "#FFF5F5",
                              color: "#C53030",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Generate / Edit Coupon Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => !isSubmitting && setIsFormModalOpen(false)}
        title={editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : "Generate New Coupon"}
        subtitle="Configure discount rules, user eligibility, and usage limitations."
        maxWidth="680px"
      >
        <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {formErrors.submit && (
            <div style={{ backgroundColor: "#FEE2E2", color: "#991B1B", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>
              {formErrors.submit}
            </div>
          )}

          {/* Code & Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#5A584F", marginBottom: "6px" }}>
                COUPON CODE *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, "") })}
                placeholder="e.g. FESTIVE30"
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 12px",
                  borderRadius: "8px",
                  border: `1px solid ${formErrors.code ? "#C53030" : "#E8E2D4"}`,
                  fontSize: "14px",
                  fontWeight: "700",
                  fontFamily: "monospace",
                  letterSpacing: "0.08em",
                  color: "#8A6B2E",
                  outline: "none",
                }}
              />
              {formErrors.code && <span style={{ fontSize: "11px", color: "#C53030" }}>{formErrors.code}</span>}
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#5A584F", marginBottom: "6px" }}>
                STATUS
              </label>
              <select
                value={formData.isActive ? "active" : "inactive"}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "active" })}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 10px",
                  borderRadius: "8px",
                  border: "1px solid #E8E2D4",
                  fontSize: "13px",
                  fontWeight: "600",
                  backgroundColor: "#FFFFFF",
                  color: "#2B2D2A",
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Discount Type & Value */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#5A584F", marginBottom: "6px" }}>
                DISCOUNT TYPE *
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, discountType: "percentage" })}
                  style={{
                    flex: 1,
                    height: "40px",
                    borderRadius: "8px",
                    border: `1px solid ${formData.discountType === "percentage" ? "#8A6B2E" : "#E8E2D4"}`,
                    backgroundColor: formData.discountType === "percentage" ? "#F3EFE6" : "#FFFFFF",
                    color: formData.discountType === "percentage" ? "#8A6B2E" : "#5A584F",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  % Percentage
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, discountType: "fixed" })}
                  style={{
                    flex: 1,
                    height: "40px",
                    borderRadius: "8px",
                    border: `1px solid ${formData.discountType === "fixed" ? "#8A6B2E" : "#E8E2D4"}`,
                    backgroundColor: formData.discountType === "fixed" ? "#F3EFE6" : "#FFFFFF",
                    color: formData.discountType === "fixed" ? "#8A6B2E" : "#5A584F",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  ₹ Fixed Amount
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#5A584F", marginBottom: "6px" }}>
                DISCOUNT VALUE * ({formData.discountType === "percentage" ? "%" : "₹"})
              </label>
              <input
                type="number"
                min="1"
                max={formData.discountType === "percentage" ? 100 : 100000}
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                placeholder={formData.discountType === "percentage" ? "e.g. 20" : "e.g. 500"}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 12px",
                  borderRadius: "8px",
                  border: `1px solid ${formErrors.discountValue ? "#C53030" : "#E8E2D4"}`,
                  fontSize: "14px",
                  fontWeight: "600",
                  outline: "none",
                }}
              />
              {formErrors.discountValue && <span style={{ fontSize: "11px", color: "#C53030" }}>{formErrors.discountValue}</span>}
            </div>
          </div>

          {/* User Eligibility */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#5A584F", marginBottom: "6px" }}>
              USER ELIGIBILITY
            </label>
            <div style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="userEligibility"
                  checked={formData.userEligibility === "all"}
                  onChange={() => setFormData({ ...formData, userEligibility: "all" })}
                />
                All Users (Automatic for anyone eligible)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="userEligibility"
                  checked={formData.userEligibility === "limited"}
                  onChange={() => setFormData({ ...formData, userEligibility: "limited" })}
                />
                Limited Users (Specific whitelist)
              </label>
            </div>

            {formData.userEligibility === "limited" && (
              <div>
                <textarea
                  rows={2}
                  placeholder="Enter user emails or IDs separated by comma (e.g. user@example.com, artist@vismaya.com)"
                  value={formData.applicableUsersText}
                  onChange={(e) => setFormData({ ...formData, applicableUsersText: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: `1px solid ${formErrors.applicableUsersText ? "#C53030" : "#E8E2D4"}`,
                    fontSize: "12.5px",
                    outline: "none",
                  }}
                />
                {formErrors.applicableUsersText && (
                  <span style={{ fontSize: "11px", color: "#C53030" }}>{formErrors.applicableUsersText}</span>
                )}
              </div>
            )}
          </div>

          {/* Usage Limits */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#5A584F", marginBottom: "6px" }}>
                MAX REDEMPTIONS (OPTIONAL)
              </label>
              <input
                type="number"
                min="1"
                placeholder="Leave blank for unlimited"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 12px",
                  borderRadius: "8px",
                  border: "1px solid #E8E2D4",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#5A584F", marginBottom: "6px" }}>
                PER USER USAGE LIMIT
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxUsesPerUser}
                onChange={(e) => setFormData({ ...formData, maxUsesPerUser: e.target.value })}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 12px",
                  borderRadius: "8px",
                  border: "1px solid #E8E2D4",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Validity Period */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#5A584F", marginBottom: "6px" }}>
                VALID FROM (DATE & TIME)
              </label>
              <input
                type="datetime-local"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 10px",
                  borderRadius: "8px",
                  border: "1px solid #E8E2D4",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#5A584F", marginBottom: "6px" }}>
                VALID UNTIL (DATE & TIME) *
              </label>
              <input
                type="datetime-local"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 10px",
                  borderRadius: "8px",
                  border: `1px solid ${formErrors.validUntil ? "#C53030" : "#E8E2D4"}`,
                  fontSize: "13px",
                  outline: "none",
                }}
              />
              {formErrors.validUntil && <span style={{ fontSize: "11px", color: "#C53030" }}>{formErrors.validUntil}</span>}
            </div>
          </div>

          {/* Order Thresholds */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#5A584F", marginBottom: "6px" }}>
                MIN ORDER AMOUNT (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                placeholder="0"
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 12px",
                  borderRadius: "8px",
                  border: "1px solid #E8E2D4",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#5A584F", marginBottom: "6px" }}>
                MAX DISCOUNT CAP (₹, OPTIONAL)
              </label>
              <input
                type="number"
                min="0"
                value={formData.maxDiscountAmount}
                onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                placeholder="e.g. 1000"
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 12px",
                  borderRadius: "8px",
                  border: "1px solid #E8E2D4",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Applicable Packages Multi-select */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#5A584F", marginBottom: "6px" }}>
              APPLICABLE PACKAGES (Leave unselected for all packages)
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", backgroundColor: "#FAF9F7", padding: "12px", borderRadius: "8px", border: "1px solid #E8E2D4" }}>
              {AVAILABLE_PACKAGES.map((pkg) => {
                const isChecked = formData.applicablePackages.includes(pkg.id);
                return (
                  <label key={pkg.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, applicablePackages: [...formData.applicablePackages, pkg.id] });
                        } else {
                          setFormData({
                            ...formData,
                            applicablePackages: formData.applicablePackages.filter((id) => id !== pkg.id),
                          });
                        }
                      }}
                    />
                    <span>{pkg.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px", paddingTop: "14px", borderTop: "1px solid #E8E2D4" }}>
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              disabled={isSubmitting}
              className="btn-secondary"
              style={{ height: "40px", padding: "0 18px", borderRadius: "8px", fontSize: "13px", fontWeight: "600" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                height: "40px",
                padding: "0 20px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                backgroundColor: "#8A6B2E",
                color: "#FFFFFF",
                border: "none",
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Saving..." : editingCoupon ? "Save Changes" : "Create Coupon"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. View Details Modal */}
      {viewingCoupon && (
        <Modal
          isOpen={!!viewingCoupon}
          onClose={() => setViewingCoupon(null)}
          title={`Coupon Details: ${viewingCoupon.code}`}
          subtitle="Detailed overview of usage, limitations, and package price simulations."
          maxWidth="640px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#F3EFE6", padding: "14px 18px", borderRadius: "10px", border: "1px solid #E8E2D4" }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#5A584F", textTransform: "uppercase" }}>COUPON CODE</div>
                <div style={{ fontSize: "22px", fontWeight: "700", fontFamily: "monospace", color: "#8A6B2E" }}>{viewingCoupon.code}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#5A584F", textTransform: "uppercase" }}>DISCOUNT VALUE</div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#2B2D2A" }}>
                  {viewingCoupon.discountType === "percentage" ? `${viewingCoupon.discountValue}% Off` : `₹${viewingCoupon.discountValue} Flat`}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
              <div style={{ backgroundColor: "#FAF9F7", padding: "12px", borderRadius: "8px", border: "1px solid #E8E2D4" }}>
                <strong style={{ display: "block", color: "#5A584F", fontSize: "11.5px", marginBottom: "4px" }}>USER ELIGIBILITY</strong>
                <span style={{ color: "#2B2D2A", fontWeight: "600" }}>
                  {viewingCoupon.userEligibility === "limited" ? "Limited Users Only" : "All Platform Users"}
                </span>
                {viewingCoupon.applicableUsers?.length > 0 && (
                  <div style={{ fontSize: "11px", color: "#5A584F", marginTop: "4px" }}>
                    {viewingCoupon.applicableUsers.join(", ")}
                  </div>
                )}
              </div>

              <div style={{ backgroundColor: "#FAF9F7", padding: "12px", borderRadius: "8px", border: "1px solid #E8E2D4" }}>
                <strong style={{ display: "block", color: "#5A584F", fontSize: "11.5px", marginBottom: "4px" }}>REDEMPTION STATUS</strong>
                <span style={{ color: "#8A6B2E", fontWeight: "700" }}>{viewingCoupon.usedCount || 0}</span>
                <span style={{ color: "#5A584F" }}> / {viewingCoupon.maxUses ? `${viewingCoupon.maxUses} total` : "Unlimited"}</span>
                <div style={{ fontSize: "11px", color: "#5A584F", marginTop: "4px" }}>
                  Per user limit: {viewingCoupon.maxUsesPerUser || 1}
                </div>
              </div>

              <div style={{ backgroundColor: "#FAF9F7", padding: "12px", borderRadius: "8px", border: "1px solid #E8E2D4" }}>
                <strong style={{ display: "block", color: "#5A584F", fontSize: "11.5px", marginBottom: "4px" }}>VALIDITY PERIOD</strong>
                <div style={{ color: "#2B2D2A", fontWeight: "600" }}>
                  {viewingCoupon.validUntil ? new Date(viewingCoupon.validUntil).toLocaleString("en-IN") : "Indefinite"}
                </div>
                <div style={{ fontSize: "11px", color: "#5A584F", marginTop: "2px" }}>
                  Started: {viewingCoupon.validFrom ? new Date(viewingCoupon.validFrom).toLocaleDateString("en-IN") : "Immediately"}
                </div>
              </div>

              <div style={{ backgroundColor: "#FAF9F7", padding: "12px", borderRadius: "8px", border: "1px solid #E8E2D4" }}>
                <strong style={{ display: "block", color: "#5A584F", fontSize: "11.5px", marginBottom: "4px" }}>ORDER CONSTRAINTS</strong>
                <div style={{ color: "#2B2D2A" }}>
                  Min Order: <strong>₹{viewingCoupon.minOrderAmount || 0}</strong>
                </div>
                <div style={{ color: "#2B2D2A" }}>
                  Max Discount: <strong>{viewingCoupon.maxDiscountAmount ? `₹${viewingCoupon.maxDiscountAmount}` : "None"}</strong>
                </div>
              </div>
            </div>

            {/* Applicable Packages Tag List */}
            <div style={{ backgroundColor: "#FAF9F7", padding: "12px", borderRadius: "8px", border: "1px solid #E8E2D4", fontSize: "13px" }}>
              <strong style={{ display: "block", color: "#5A584F", fontSize: "11.5px", marginBottom: "4px" }}>APPLICABLE PACKAGES</strong>
              <div style={{ color: "#2B2D2A" }}>
                {Array.isArray(viewingCoupon.applicablePackages) && viewingCoupon.applicablePackages.length > 0 ? (
                  viewingCoupon.applicablePackages.map((p) => (
                    <span key={p} style={{ display: "inline-block", backgroundColor: "#E8E2D4", padding: "2px 8px", borderRadius: "4px", margin: "2px 4px 2px 0", fontSize: "12px", fontWeight: "600" }}>
                      {p === "talent_annual_999" ? "Talent Annual (₹999)" : p === "industry_annual_4999" ? "Studio Annual (₹4,999)" : p === "credit_bundle_25_2000" ? "Bulk Pack 25 Views (₹2,000)" : p === "credit_single_100" ? "Single View (₹100)" : p}
                    </span>
                  ))
                ) : (
                  <span style={{ color: "#2E7D32", fontWeight: "600" }}>All packages eligible (Talent, Organization/Studio, and View Credits)</span>
                )}
              </div>
            </div>

            {/* Net Payable Amount After Coupon Applied (Simulation for Talent, Studio, etc.) */}
            <div style={{ backgroundColor: "#FAF9F7", padding: "14px 16px", borderRadius: "10px", border: "1px solid #E8E2D4" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <strong style={{ color: "#5A584F", fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Sparkles size={14} style={{ color: "#8A6B2E" }} />
                  Net Payable Amount After Coupon (Simulation)
                </strong>
                <span style={{ fontSize: "11px", color: "#8A6B2E", fontWeight: "700", backgroundColor: "rgba(138, 107, 46, 0.12)", padding: "3px 8px", borderRadius: "4px" }}>
                  {viewingCoupon.discountType === "percentage" ? `${viewingCoupon.discountValue}% Discount` : `₹${viewingCoupon.discountValue} Flat Discount`}
                  {viewingCoupon.maxDiscountAmount ? ` (Cap: ₹${viewingCoupon.maxDiscountAmount})` : ""}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {getPackageSimulation(viewingCoupon).map((sim) => (
                  <div
                    key={sim.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      backgroundColor: sim.isEligible ? "#FFFFFF" : "#F5F3EF",
                      border: `1px solid ${sim.isEligible ? "#E8E2D4" : "#E2DFD7"}`,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: "700", color: sim.isEligible ? "#2B2D2A" : "#8A8170", fontSize: "13.5px" }}>
                          {sim.name}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: "700",
                            color: "#8A6B2E",
                            backgroundColor: "#F3EFE6",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {sim.category}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px", fontSize: "12px" }}>
                        <span style={{ color: "#8A8170" }}>
                          Original: <strong style={{ textDecoration: sim.isEligible ? "line-through" : "none", color: "#5A584F" }}>₹{sim.basePrice.toLocaleString("en-IN")}</strong>
                        </span>
                        {sim.isEligible ? (
                          <span style={{ color: "#2E7D32", fontWeight: "600" }}>
                            Discount: -₹{sim.discount.toLocaleString("en-IN")} ({viewingCoupon.discountType === "percentage" ? `${viewingCoupon.discountValue}%` : "Flat"})
                          </span>
                        ) : (
                          <span style={{ color: "#C53030", fontStyle: "italic", fontSize: "11px" }}>
                            ({sim.ineligibleReason})
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0, paddingLeft: "14px" }}>
                      <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: sim.isEligible ? "#2E7D32" : "#8A8170", letterSpacing: "0.05em" }}>
                        {sim.isEligible ? "User Will Pay" : "Full Price"}
                      </div>
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "700",
                          color: sim.isEligible ? "#2E7D32" : "#5A584F",
                          fontFamily: "var(--font-heading), Georgia, serif",
                          lineHeight: 1.2,
                        }}
                      >
                        ₹{sim.finalPayable.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => setViewingCoupon(null)}
                className="btn-primary"
                style={{ height: "38px", padding: "0 18px", borderRadius: "8px", fontSize: "13px" }}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 6. Delete Confirmation Modal */}
      {deletingCoupon && (
        <Modal
          isOpen={!!deletingCoupon}
          onClose={() => !isSubmitting && setDeletingCoupon(null)}
          title="Delete Coupon"
          maxWidth="460px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#C53030" }}>
              <ShieldAlert size={28} />
              <div style={{ fontSize: "14px", color: "#2B2D2A" }}>
                Are you sure you want to delete coupon <strong>{deletingCoupon.code}</strong>? This action cannot be undone. Users will no longer receive automatic discounts with this coupon.
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button
                type="button"
                onClick={() => setDeletingCoupon(null)}
                disabled={isSubmitting}
                className="btn-secondary"
                style={{ height: "38px", padding: "0 16px", borderRadius: "8px", fontSize: "13px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                style={{
                  height: "38px",
                  padding: "0 18px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  backgroundColor: "#C53030",
                  color: "#FFFFFF",
                  border: "none",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
