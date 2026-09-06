// Wnaawa style reminder: ledger actions are transparent, restrained, and never pretend that a frontend timer can award points.

export type LedgerType = "EARN_AD" | "EARN_BONUS" | "SPEND_STORE" | "SPEND_SERVICE" | "REFUND" | "ADMIN_ADJUST";

export type LedgerEntry = {
  id: string;
  amount: number;
  type: LedgerType;
  referenceId: string;
  createdAt: string;
};

const seedEntries: LedgerEntry[] = [
  { id: "led-001", amount: 120, type: "EARN_BONUS", referenceId: "welcome-bonus", createdAt: "2026-09-01T09:00:00Z" },
  { id: "led-002", amount: 75, type: "EARN_AD", referenceId: "reward-tx-001", createdAt: "2026-09-02T11:10:00Z" },
  { id: "led-003", amount: -40, type: "SPEND_STORE", referenceId: "order-001", createdAt: "2026-09-03T14:22:00Z" },
];

let ledgerEntries = [...seedEntries];

export function getLedger(): LedgerEntry[] {
  return [...ledgerEntries];
}

export function getBalance(): number {
  return Math.max(0, ledgerEntries.reduce((sum, entry) => sum + entry.amount, 0));
}

export function appendLedgerEntry(entry: Omit<LedgerEntry, "id" | "createdAt">): LedgerEntry {
  if (entry.amount < 0 && Math.abs(entry.amount) > getBalance()) {
    throw new Error("Insufficient points balance.");
  }
  const nextEntry: LedgerEntry = {
    ...entry,
    id: `led-${String(ledgerEntries.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
  };
  ledgerEntries = [...ledgerEntries, nextEntry];
  return nextEntry;
}

export type ProductType = "SERVICE_BOT" | "SERVICE_WEBSITE" | "DIGITAL_ASSET" | "TEMPLATE" | "REWARD";
export type PaymentMethod = "POINTS" | "CASH";

export type CheckoutResult = { ok: true; status: 200; message: string } | { ok: false; status: 403; message: string };

export function validateCheckout(productType: ProductType, paymentMethod: PaymentMethod): CheckoutResult {
  const cashAllowed = productType === "SERVICE_BOT" || productType === "SERVICE_WEBSITE";
  if (!cashAllowed && paymentMethod === "CASH") {
    return {
      ok: false,
      status: 403,
      message: "Cash checkout is reserved for BOT and WEBSITE services. This item is points only.",
    };
  }
  return { ok: true, status: 200, message: paymentMethod === "CASH" ? "Cash checkout is available for this service." : "Points checkout is available." };
}

export function spendPoints(points: number, type: "SPEND_STORE" | "SPEND_SERVICE", referenceId: string): LedgerEntry {
  return appendLedgerEntry({ amount: -Math.abs(points), type, referenceId });
}
