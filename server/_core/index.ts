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
  const chatHandler = async (req: express.Request, res: express.Response) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const messages = normalizeMessages(req.body?.messages);
      if (!messages.some((message) => message.role === "user")) {
        return res.status(400).json({ error: { code: "missing_user_message", message: "En az bir kullanıcı mesajı gerekli." } });
      }
      const content = await generateAslanReply(messages);
      return res.json({ id: `aslan-${Date.now()}`, model: "Qwen3-4B", choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }] });
    } catch (error) {
      console.error("[Aslan API]", error);
      return res.status(500).json({ error: { code: "generation_failed", message: error instanceof Error ? error.message : "Yanıt üretilemedi." } });
    }
  };
  app.post("/api/chat", chatHandler);
  app.options("/api/v1/chat", (_req, res) => res.sendStatus(204));
  app.post("/api/v1/chat", (req, res, next) => {
    const presented = getPresentedKeyHeader(req);
    if (!isValidAslanKey(presented)) {
      return res.status(401).json({ error: { code: "invalid_api_key", message: "Geçersiz veya eksik Aslan API anahtarı." } });
    }
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Aslan-Api-Key");
    return chatHandler(req, res).catch(next);
  });
  registerOAuthRoutes(app);
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
