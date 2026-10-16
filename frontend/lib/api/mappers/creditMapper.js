/**
 * Credit Entity Mapper
 */

function safeIsoDate(val, fallback = null) {
  if (!val) return fallback;
  const d = new Date(val);
  return !isNaN(d.getTime()) ? d.toISOString() : (typeof val === "string" ? val : fallback);
}

export function fromApiLedger(ledger) {
  if (!ledger) {
    return {
      balance: 100,
      includedCredits: 100,
      purchasedCredits: 0,
      consumedCredits: 0,
      lowBalanceWarning: false,
      warningMessage: null,
    };
  }

  const balance = Number(ledger.balance) >= 0 ? Number(ledger.balance) : 100;

  return {
    balance,
    includedCredits: Number(ledger.includedCredits) || 0,
    purchasedCredits: Number(ledger.purchasedCredits) || 0,
    consumedCredits: Number(ledger.consumedCredits) || 0,
    lowBalanceWarning: balance <= 10,
    warningMessage: balance <= 10 ? `Low balance alert: You have only ${balance} profile-view credits remaining.` : null,
    lastTransactionAt: safeIsoDate(ledger.lastTransactionAt, null),
  };
}

export function fromApiTransaction(tx) {
  if (!tx) return null;

  const id = tx._id ? String(tx._id) : (tx.id ? String(tx.id) : "");
  const createdIso = safeIsoDate(tx.createdAt, new Date().toISOString());

  return {
    id,
    _id: id,
    type: tx.type || "profile_view_deduction",
    amount: Number(tx.amount) || 0,
    balanceAfter: Number(tx.balanceAfter) || 0,
    description: tx.description || "",
    talentId: tx.talentId ? String(tx.talentId) : null,
    createdAt: createdIso,
    date: createdIso ? createdIso.split("T")[0] : "",
  };
}

export function mapCreditTypeToUi(type) {
  switch (type) {
    case "registration_bonus":
    case "registration_included":
      return { type: "included", label: "Included" };
    case "purchase":
    case "bundle_purchase":
    case "single_purchase":
      return { type: "purchased", label: "Purchased" };
    case "profile_view_deduction":
      return { type: "consumed", label: "Consumed" };
    case "admin_adjustment":
      return { type: "adjusted", label: "Adjusted" };
    default:
      return { type: "other", label: type || "Other" };
  }
}

export function fromApiAdminLedgerRow(row) {
  if (!row) return null;
  const id = row._id ? String(row._id) : (row.id ? String(row.id) : "");
  const createdIso = safeIsoDate(row.createdAt, new Date().toISOString());
  const typeMapping = mapCreditTypeToUi(row.type);

  const org = row.organization;
  const orgId = typeof org === "object" ? (org?._id ? String(org._id) : "") : (org ? String(org) : "");
  const orgName = (typeof org === "object" ? org?.organizationName : "") || "Unknown Studio";

  return {
    _id: id,
    id,
    organization: typeof org === "object" ? org : { _id: orgId, organizationName: orgName },
    orgId,
    orgName,
    type: typeMapping.type,
    typeLabel: typeMapping.label,
    rawType: row.type,
    amount: Number(row.amount) || 0,
    change: Number(row.amount) || 0,
    balanceAfter: Number(row.balanceAfter) || 0,
    description: row.description || "",
    notes: row.description || "",
    createdAt: createdIso,
    date: createdIso,
    orgBalance: row.orgBalance || null,
    reference: row.paymentTransactionId ? String(row.paymentTransactionId) : "",
  };
}

export const fromApi = fromApiTransaction;

export default {
  fromApi,
  fromApiLedger,
  fromApiTransaction,
  fromApiAdminLedgerRow,
  mapCreditTypeToUi,
};

