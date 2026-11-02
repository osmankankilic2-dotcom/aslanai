import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { aslanPublicConfig, generateAslanReply, getPresentedKeyHeader, isValidAslanKey, normalizeMessages } from "../aslan";
import { createApiKeyRecord, createAppUser, findActiveApiKey, getAppUserById, getAppUserByUsername, listApiKeys, revokeApiKey } from "../db";
import { clearSessionCookie, createSession, generateApiKey, hashApiKey, passwordDigest, readSession, sessionCookie, verifyPassword } from "../auth";

function usernameValue(input: unknown) {
  return typeof input === "string" ? input.trim().toLowerCase() : "";
}

function passwordValue(input: unknown) {
  return typeof input === "string" ? input : "";
}

async function currentUser(req: express.Request) {
  const session = readSession(req.headers.cookie);
  return session ? getAppUserById(session.userId) : undefined;
}

function setSession(res: express.Response, userId: number) {
  res.setHeader("Set-Cookie", sessionCookie(createSession(userId)));
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "aslan-ai" }));
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });
  app.get("/api/v1/config", (_req, res) => res.json(aslanPublicConfig()));

  app.get("/api/auth/session", async (req, res) => {
    const user = await currentUser(req);
    return res.json({ authenticated: Boolean(user), user: user ? { id: user.id, username: user.username } : null });
  });

  app.post("/api/auth/register", async (req, res) => {
    const username = usernameValue(req.body?.username);
    const password = passwordValue(req.body?.password);
    if (!/^[a-z0-9_]{3,32}$/.test(username)) return res.status(400).json({ error: { code: "invalid_username", message: "Kullanıcı adı 3-32 karakter olmalı; yalnızca harf, rakam ve alt çizgi kullanılmalı." } });
    if (password.length < 8) return res.status(400).json({ error: { code: "weak_password", message: "Şifre en az 8 karakter olmalı." } });
    try {
      const existing = await getAppUserByUsername(username);
      if (existing) return res.status(409).json({ error: { code: "username_taken", message: "Bu kullanıcı adı zaten alınmış." } });
      const user = await createAppUser(username, passwordDigest(password));
      if (!user) throw new Error("Kullanıcı oluşturulamadı");
      setSession(res, user.id);
      return res.json({ authenticated: true, user: { id: user.id, username: user.username } });
    } catch (error) {
      console.error("[Auth register]", error);
      return res.status(503).json({ error: { code: "database_unavailable", message: "Hesap oluşturma servisi şu anda hazır değil." } });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const username = usernameValue(req.body?.username);
    const password = passwordValue(req.body?.password);
    const user = await getAppUserByUsername(username);
    if (!user || !verifyPassword(password, user.passwordHash)) return res.status(401).json({ error: { code: "invalid_login", message: "Kullanıcı adı veya şifre hatalı." } });
    setSession(res, user.id);
    return res.json({ authenticated: true, user: { id: user.id, username: user.username } });
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.setHeader("Set-Cookie", clearSessionCookie());
    return res.json({ authenticated: false });
  });

  app.get("/api/keys", async (req, res) => {
    const user = await currentUser(req);
    if (!user) return res.status(401).json({ error: { code: "login_required", message: "Önce giriş yapmalısın." } });
    return res.json({ keys: await listApiKeys(user.id) });
  });

  app.post("/api/keys", async (req, res) => {
    const user = await currentUser(req);
    if (!user) return res.status(401).json({ error: { code: "login_required", message: "Önce giriş yapmalısın." } });
    const name = typeof req.body?.name === "string" ? req.body.name.trim().slice(0, 120) : "";
    if (!name) return res.status(400).json({ error: { code: "key_name_required", message: "API anahtarı için bir ad zorunlu." } });
    const rawKey = generateApiKey();
    const record = await createApiKeyRecord(user.id, name, hashApiKey(rawKey), rawKey.slice(-3));
    return res.status(201).json({ key: { id: record?.id, name, apiKey: rawKey, lastThree: rawKey.slice(-3), createdAt: record?.createdAt } });
  });

  app.delete("/api/keys/:id", async (req, res) => {
    const user = await currentUser(req);
    if (!user) return res.status(401).json({ error: { code: "login_required", message: "Önce giriş yapmalısın." } });
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: { code: "invalid_key_id", message: "Geçersiz anahtar." } });
    await revokeApiKey(user.id, id);
    return res.json({ deleted: true });
  });

  const chatHandler = async (req: express.Request, res: express.Response) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const messages = normalizeMessages(req.body?.messages);
      if (!messages.some((message) => message.role === "user")) return res.status(400).json({ error: { code: "missing_user_message", message: "En az bir kullanıcı mesajı gerekli." } });
      const content = await generateAslanReply(messages);
      return res.json({ id: `aslan-${Date.now()}`, model: "Qwen3-4B", choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }] });
    } catch (error) {
      console.error("[Aslan API]", error);
      return res.status(500).json({ error: { code: "generation_failed", message: error instanceof Error ? error.message : "Yanıt üretilemedi." } });
    }
  };

  app.post("/api/chat", async (req, res, next) => {
    if (!await currentUser(req)) return res.status(401).json({ error: { code: "login_required", message: "Önce kullanıcı hesabına giriş yapmalısın." } });
    return chatHandler(req, res).catch(next);
  });
  app.options("/api/v1/chat", (_req, res) => res.sendStatus(204));
  app.post("/api/v1/chat", async (req, res, next) => {
    const presented = getPresentedKeyHeader(req);
    const envKeyValid = isValidAslanKey(presented);
    const storedKey = presented ? await findActiveApiKey(hashApiKey(presented)) : undefined;
    if (!envKeyValid && !storedKey) return res.status(401).json({ error: { code: "invalid_api_key", message: "Geçersiz veya silinmiş Aslan API anahtarı." } });
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Aslan-Api-Key");
    return chatHandler(req, res).catch(next);
  });

  registerOAuthRoutes(app);
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  if (process.env.NODE_ENV === "development") await setupVite(app, server); else serveStatic(app);
  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
