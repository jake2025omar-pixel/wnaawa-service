import type { Express, Request, Response } from "express";
import { createTicket, getTelegramAdmin, getUserByOpenId, listTickets, registerTelegramAdmin, updateTicketStatus, type TicketStatus } from "./db";
import { getAdminUsername, sendTelegramMessage } from "./telegram";
import { sdk } from "./_core/sdk";

type PaymentMethod = "POINTS" | "CASH" | "BITCOIN";

function normalizePaymentMethod(value: unknown): PaymentMethod | null {
  const normalized = String(value || "").trim().toUpperCase();
  return normalized === "POINTS" || normalized === "CASH" || normalized === "BITCOIN" ? normalized : null;
}

function cashAllowedForService(serviceName: string) {
  const normalized = serviceName.toLowerCase();
  return normalized.includes("bot") || normalized.includes("website");
}

function sendJson(res: Response, status: number, payload: unknown) {
  return res.status(status).json(payload);
}

const TICKET_STATUSES: TicketStatus[] = ["PENDING", "PAID", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

async function requireAdmin(req: Request, res: Response) {
  try {
    const session = await sdk.authenticateRequest(req);
    const user = await getUserByOpenId(session.openId);
    if (!user || user.role !== "admin") {
      sendJson(res, 403, { ok: false, error: "Admin access required" });
      return false;
    }
    return true;
  } catch {
    sendJson(res, 401, { ok: false, error: "Authentication required" });
    return false;
  }
}

export function registerTelegramRoutes(app: Express) {
  app.post("/api/telegram/webhook", async (req: Request, res: Response) => {
    try {
      const message = req.body?.message;
      const chatId = message?.chat?.id;
      const text = typeof message?.text === "string" ? message.text.trim() : "";
      const senderUsername = String(message?.from?.username || "").replace(/^@/, "");
      if (!chatId) return sendJson(res, 200, { ok: true, handled: false });

      if (text === "/start" || text.startsWith("/start ")) {
        const username = getAdminUsername();
        if (!senderUsername || senderUsername.toLowerCase() !== username.toLowerCase()) {
          return sendJson(res, 403, { ok: false, error: "Telegram sender is not the configured admin" });
        }
        await registerTelegramAdmin({ username, chatId: String(chatId) });
        await sendTelegramMessage(chatId, `أهلا @${username} طلبات Wnaawa ستصل هنا`);
        return sendJson(res, 200, { ok: true, handled: true });
      }

      return sendJson(res, 200, { ok: true, handled: false });
    } catch (error) {
      console.error("[Telegram webhook] Failed:", error);
      return sendJson(res, 500, { ok: false, error: "Webhook handling failed" });
    }
  });

  app.get("/api/admin/tickets", async (req: Request, res: Response) => {
    if (!(await requireAdmin(req, res))) return;
    const status = String(req.query.status || "").toUpperCase();
    const query = String(req.query.q || "").trim();
    if (status && !TICKET_STATUSES.includes(status as TicketStatus)) {
      return sendJson(res, 400, { ok: false, error: "Unknown ticket status" });
    }
    const rows = await listTickets({ status: status ? status as TicketStatus : undefined, query: query || undefined });
    return sendJson(res, 200, { ok: true, tickets: rows });
  });

  app.patch("/api/admin/tickets/:id", async (req: Request, res: Response) => {
    if (!(await requireAdmin(req, res))) return;
    const id = Number(req.params.id);
    const status = String(req.body?.status || "").toUpperCase() as TicketStatus;
    if (!Number.isInteger(id) || id < 1 || !TICKET_STATUSES.includes(status)) {
      return sendJson(res, 400, { ok: false, error: "Valid id and status are required" });
    }
    await updateTicketStatus(id, status);
    return sendJson(res, 200, { ok: true, id, status });
  });

  app.post("/api/tickets", async (req: Request, res: Response) => {
    const serviceName = String(req.body?.serviceName || req.body?.service || "").trim();
    const whatsapp = String(req.body?.whatsapp || "").trim();
    const paymentMethod = normalizePaymentMethod(req.body?.paymentMethod || req.body?.payment);
    const pointsCost = Number(req.body?.pointsCost || 0);

    if (!serviceName || !whatsapp || !paymentMethod) {
      return sendJson(res, 400, { ok: false, error: "serviceName, whatsapp, and paymentMethod are required" });
    }
    if (paymentMethod === "CASH" && !cashAllowedForService(serviceName)) {
      return sendJson(res, 403, { ok: false, error: "Cash checkout is only available for BOT and WEBSITE services" });
    }
    if (!Number.isFinite(pointsCost) || pointsCost < 0) {
      return sendJson(res, 400, { ok: false, error: "pointsCost must be a non-negative number" });
    }

    try {
      const admin = await getTelegramAdmin(getAdminUsername());
      if (!admin) {
        return sendJson(res, 503, { ok: false, error: "Admin Telegram chat is not registered. Send /start to the bot first." });
      }

      const ticketId = await createTicket({ serviceName, whatsapp, paymentMethod, pointsCost: Math.floor(pointsCost) });
      await sendTelegramMessage(admin.chatId, `🔔 طلب جديد: الخدمة ${serviceName} - واتساب ${whatsapp} - دفع ${paymentMethod}`);
      return sendJson(res, 201, { ok: true, ticketId });
    } catch (error) {
      console.error("[Tickets] Failed:", error);
      return sendJson(res, 500, { ok: false, error: "Ticket creation failed" });
    }
  });
}
