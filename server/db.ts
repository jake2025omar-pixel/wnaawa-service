import { and, desc, eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertRewardClaim, InsertTelegramAdmin, InsertTicket, InsertUser, rewardClaims, telegramAdmins, tickets, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function registerTelegramAdmin(admin: InsertTelegramAdmin) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.insert(telegramAdmins).values(admin).onDuplicateKeyUpdate({
    set: { chatId: admin.chatId, updatedAt: new Date() },
  });
}

export async function getTelegramAdmin(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(telegramAdmins).where(eq(telegramAdmins.username, username)).limit(1);
  return result[0];
}

export async function createRewardClaim(claim: InsertRewardClaim) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const existing = await db.select().from(rewardClaims).where(eq(rewardClaims.sessionId, claim.sessionId)).limit(1);
  if (existing[0]) return { claim: existing[0], duplicate: true } as const;
  await db.insert(rewardClaims).values(claim);
  const created = await db.select().from(rewardClaims).where(eq(rewardClaims.sessionId, claim.sessionId)).limit(1);
  return { claim: created[0], duplicate: false } as const;
}

export async function createTicket(ticket: InsertTicket) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const result = await db.insert(tickets).values(ticket);
  const insertId = Number((result as unknown as Array<{ insertId?: number }>)[0]?.insertId || 0);
  return insertId;
}

export type TicketStatus = "PENDING" | "PAID" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export async function listTickets(filters?: { status?: TicketStatus; query?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(tickets.status, filters.status));
  if (filters?.query) conditions.push(like(tickets.serviceName, `%${filters.query}%`));
  const where = conditions.length ? and(...conditions) : undefined;
  return db.select().from(tickets).where(where).orderBy(desc(tickets.createdAt));
}

export async function updateTicketStatus(id: number, status: TicketStatus) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.update(tickets).set({ status, updatedAt: new Date() }).where(eq(tickets.id, id));
}
