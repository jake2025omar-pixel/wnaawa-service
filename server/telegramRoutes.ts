import type { Express, Request, Response } from "express";
import { createTicket, getTelegramAdmin, registerTelegramAdmin } from "./db";
import { getAdminUsername, sendTelegramMessage } from "./telegram";

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
