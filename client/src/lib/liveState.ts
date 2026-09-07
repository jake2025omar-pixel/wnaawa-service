import type { LedgerEntry } from "./ledger";

export type LocalTicket = {
  id: string;
  serviceName: string;
  whatsapp: string;
  paymentMethod: "POINTS" | "CASH" | "BITCOIN";
  pointsCost: number;
  status: "PENDING" | "PAID" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
};

export type RewardAvailability = "UNKNOWN" | "AVAILABLE" | "BLOCKED";

export type StoredRewardSession = {
  id: string;
  provider: string;
  placement: string;
  status: string;
  createdAt: string;
  expiresAt: string;
};

export type LocalOrder = {
  id: string;
  productId: string;
  title: string;
  points: number;
  ticketId: string;
  createdAt: string;
};

const KEYS = {
  ledger: "wnaawa:ledger",
  tickets: "wnaawa:tickets",
  orders: "wnaawa:orders",
  verified: "wnaawa:verified-payments",
  rewards: "wnaawa:reward-sessions",
  availability: "wnaawa:reward-availability",
} as const;

const EVENT_NAME = "wnaawa:state-changed";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function getStoredLedger(): LedgerEntry[] {
  return read<LedgerEntry[]>(KEYS.ledger, []);
}

export function saveStoredLedger(entries: LedgerEntry[]) {
  write(KEYS.ledger, entries);
}

export function getStoredTickets(): LocalTicket[] {
  return read<LocalTicket[]>(KEYS.tickets, []);
}

export function saveStoredTickets(tickets: LocalTicket[]) {
  write(KEYS.tickets, tickets);
}

export function getRewardAvailability(): RewardAvailability {
  return read<RewardAvailability>(KEYS.availability, "UNKNOWN");
}

export function setRewardAvailability(availability: RewardAvailability) {
  write(KEYS.availability, availability);
}

export function getRewardSessions(): StoredRewardSession[] {
  return read<StoredRewardSession[]>(KEYS.rewards, []);
}

export function saveRewardSession(session: StoredRewardSession) {
  const sessions = getRewardSessions().filter((item) => item.id !== session.id);
  write(KEYS.rewards, [session, ...sessions]);
}

export function getStoredOrders(): LocalOrder[] {
  return read<LocalOrder[]>(KEYS.orders, []);
}

export function saveStoredOrders(orders: LocalOrder[]) {
  write(KEYS.orders, orders);
}

export function getVerifiedPayments(): string[] {
  return read<string[]>(KEYS.verified, []);
}

export function markPaymentVerified(ticketId: string) {
  saveVerifiedPayments(Array.from(new Set([...getVerifiedPayments(), ticketId])));
}

function saveVerifiedPayments(ids: string[]) {
  write(KEYS.verified, ids);
}

export function subscribeToLiveState(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const handler = () => listener();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

export function createLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
