import { getStoredLedger, saveStoredLedger } from "./liveState";

export type LedgerType = "EARN_AD" | "EARN_BONUS" | "SPEND_STORE" | "SPEND_SERVICE" | "REFUND" | "ADMIN_ADJUST";

export type LedgerEntry = {
  id: string;
  amount: number;
  type: LedgerType;
  referenceId: string;
  createdAt: string;
};

export function getLedger(): LedgerEntry[] {
  return getStoredLedger();
}

export function getBalance(): number {
  return Math.max(0, getLedger().reduce((sum, entry) => sum + entry.amount, 0));
}

export function appendLedgerEntry(entry: Omit<LedgerEntry, "id" | "createdAt">): LedgerEntry {
  if (entry.amount < 0 && Math.abs(entry.amount) > getBalance()) {
    throw new Error("Insufficient points balance.");
  }
  const current = getLedger();
  const nextEntry: LedgerEntry = {
    ...entry,
    id: `led-${String(current.length + 1).padStart(3, "0")}-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  saveStoredLedger([...current, nextEntry]);
  return nextEntry;
}

export type ProductType = "SERVICE_BOT" | "SERVICE_WEBSITE" | "DIGITAL_ASSET" | "TEMPLATE" | "REWARD";
export type PaymentMethod = "POINTS" | "CASH";

export type CheckoutResult = { ok: true; status: 200; message: string } | { ok: false; status: 403; message: string };

export function validateCheckout(productType: ProductType, paymentMethod: PaymentMethod): CheckoutResult {
  const cashAllowed = productType === "SERVICE_BOT" || productType === "SERVICE_WEBSITE";
  if (!cashAllowed && paymentMethod === "CASH") {
    return { ok: false, status: 403, message: "Cash checkout is reserved for BOT and WEBSITE services. This item is points only." };
  }
  return { ok: true, status: 200, message: paymentMethod === "CASH" ? "Cash checkout is available for this service." : "Points checkout is available." };
}

export function spendPoints(points: number, type: "SPEND_STORE" | "SPEND_SERVICE", referenceId: string): LedgerEntry {
  return appendLedgerEntry({ amount: -Math.abs(points), type, referenceId });
}
