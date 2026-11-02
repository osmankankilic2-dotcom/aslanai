import { and, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { apiKeys, appUsers, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    throw new Error("Database is not available");
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAppUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appUsers).where(eq(appUsers.username, username)).limit(1);
  return result[0];
}

export async function getAppUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appUsers).where(eq(appUsers.id, id)).limit(1);
  return result[0];
}

export async function createAppUser(username: string, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(appUsers).values({ username, passwordHash });
  return getAppUserByUsername(username);
}

export async function listApiKeys(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: apiKeys.id, name: apiKeys.name, lastThree: apiKeys.lastThree, createdAt: apiKeys.createdAt }).from(apiKeys).where(and(eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)));
}

export async function createApiKeyRecord(userId: number, name: string, keyHash: string, lastThree: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(apiKeys).values({ userId, name, keyHash, lastThree });
  const rows = await db.select().from(apiKeys).where(and(eq(apiKeys.userId, userId), eq(apiKeys.keyHash, keyHash))).limit(1);
  return rows[0];
}

export async function findActiveApiKey(keyHash: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(apiKeys).where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt))).limit(1);
  return rows[0];
}

export async function revokeApiKey(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(apiKeys).set({ revokedAt: new Date() }).where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)));
}
