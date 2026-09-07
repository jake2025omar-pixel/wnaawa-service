import { describe, expect, it, vi } from "vitest";
import { getTelegramBotInfo } from "./telegram";

describe("Telegram configuration", () => {
  it("calls the lightweight getMe endpoint with the server-only token", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true, result: { username: "Wnaawa_servicebot" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    process.env.TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "test-token";
    const result = await getTelegramBotInfo();

    expect(result.username).toBe("Wnaawa_servicebot");
    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/getMe`,
      expect.objectContaining({ method: "GET" }),
    );

    fetchMock.mockRestore();
  });
});
