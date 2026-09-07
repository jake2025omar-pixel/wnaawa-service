type TelegramApiResponse<T> = {
  ok: boolean;
  result?: T;
  description?: string;
};

export type TelegramUser = {
  id: number;
  is_bot: boolean;
  username?: string;
};

function getToken() {
  const token = process.env.TELEGRAM_TOKEN?.trim();
  if (!token) {
    throw new Error("TELEGRAM_TOKEN is not configured");
  }
  return token;
}

async function telegramRequest<T>(method: string, body?: Record<string, unknown>) {
  const token = getToken();
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = (await response.json()) as TelegramApiResponse<T>;
  if (!response.ok || !payload.ok || !payload.result) {
    throw new Error(payload.description || `Telegram API request failed: ${method}`);
  }
  return payload.result;
}

export async function getTelegramBotInfo() {
  return telegramRequest<TelegramUser>("getMe");
}

export async function sendTelegramMessage(chatId: string | number, text: string) {
  return telegramRequest<{ message_id: number }>("sendMessage", {
    chat_id: chatId,
    text,
  });
}

export async function setTelegramWebhook(url: string) {
  return telegramRequest<boolean>("setWebhook", { url });
}

export function getAdminUsername() {
  return process.env.ADMIN_USERNAME?.replace(/^@/, "") || "admin";
}
