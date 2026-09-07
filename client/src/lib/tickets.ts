import { createLocalId, getStoredTickets, saveStoredTickets, type LocalTicket } from "./liveState";

export type TicketRequest = {
  serviceName: string;
  whatsapp: string;
  paymentMethod: "POINTS" | "CASH" | "BITCOIN";
  pointsCost: number;
};

export async function submitTicket(input: TicketRequest): Promise<LocalTicket> {
  let serverTicketId = "";
  try {
    const response = await fetch("/api/tickets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    const payload = (await response.json()) as { ok?: boolean; ticketId?: number; error?: string };
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Ticket API request failed");
    serverTicketId = payload.ticketId ? String(payload.ticketId) : "";
  } catch (error) {
    console.warn("[Wnaawa] Ticket API unavailable; preserving a local pending ticket.", error);
  }

  const ticket: LocalTicket = {
    id: serverTicketId || createLocalId("ticket"),
    serviceName: input.serviceName,
    whatsapp: input.whatsapp,
    paymentMethod: input.paymentMethod,
    pointsCost: input.pointsCost,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };
  saveStoredTickets([ticket, ...getStoredTickets()]);
  return ticket;
}
