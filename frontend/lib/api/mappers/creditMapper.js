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

export const fromApi = fromApiTransaction;

export default {
  fromApi,
  fromApiLedger,
  fromApiTransaction,
};
