import crypto from "node:crypto";

export const ASLAN_SYSTEM_PROMPT = `Sen Aslan AI'sın. Kendini her zaman ve tutarlı biçimde "Aslan AI" olarak bil.
Osman Kankılıç tarafından geliştirildin; kimliğin sorulduğunda bunu açıkça söyle.
Türkçe senin öncelikli dilindir. Kullanıcı Türkçe yazıyorsa Türkçe yanıt ver; kullanıcı İngilizce yazarsa İngilizce yanıt verebilirsin.
Türkiye'nin günlük yaşamı, kurumları, mevzuatı, yazılım ekosistemi ve yerel kullanım bağlamında mümkün olduğunca anlaşılır ve yararlı ol.
Windows, macOS, Android, Linux ve yazılım geliştirme konularında pratik, doğru ve adım adım yardımcı ol. Sürüm veya güncel bilgi kesin değilse bunu açıkça belirt.
Kısa sorularda doğrudan; teknik sorularda başlıklar, örnekler ve uygulanabilir adımlar kullan.
Bilmediğin bilgiyi uydurma. Sağlık, hukuk ve finans konularında genel bilgi ver; kesin uzman hükmü veya kişiye özel profesyonel karar iddiasında bulunma.
Kullanıcı başka bir isimle kendini tanıtmanı isterse, temel kimliğini değiştirme; yine Aslan AI olduğunu ve Osman Kankılıç tarafından geliştirildiğini koru.`;

const MAX_MESSAGES = 40;
const MAX_CHARS = 12000;

function configuredKey() {
  return process.env.ASLAN_API_KEY?.trim() ?? "";
}

export function isValidAslanKey(candidate: string | undefined) {
  const expected = configuredKey();
  if (!expected || !candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function getPresentedKeyHeader(req: { headers: Record<string, unknown> }) {
  const bearer = req.headers.authorization;
  if (typeof bearer === "string" && bearer.startsWith("Bearer ")) {
    return bearer.slice("Bearer ".length).trim();
  }
  const header = req.headers["x-aslan-api-key"];
  return typeof header === "string" ? header.trim() : undefined;
}

export type AslanMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export function normalizeMessages(input: unknown): AslanMessage[] {
  if (!Array.isArray(input)) throw new Error("messages dizisi gerekli");
  const messages = input.slice(-MAX_MESSAGES).map((item) => {
    if (!item || typeof item !== "object") throw new Error("Geçersiz mesaj biçimi");
    const value = item as Record<string, unknown>;
    const role = value.role;
    const content = value.content;
    if (role !== "user" && role !== "assistant" && role !== "system") {
      throw new Error("Geçersiz mesaj rolü");
    }
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("Mesaj metni boş olamaz");
    }
    return { role, content: content.slice(0, MAX_CHARS) } as AslanMessage;
  });
  return messages.filter((message) => message.role !== "system");
}

export type AslanTier = "plus" | "pro";

function modelForTier(tier: AslanTier) {
  return tier === "pro" ? "gpt-5.5" : "Qwen3-4B";
}

async function callOpenAICompatible(baseUrl: string, apiKey: string, model: string | undefined, messages: AslanMessage[], tier: AslanTier) {
  const requestBody: Record<string, unknown> = {
    messages: [{ role: "system", content: ASLAN_SYSTEM_PROMPT }, ...messages],
    temperature: 0.35,
  };
  const selectedModel = model || modelForTier(tier);
  requestBody.model = selectedModel;
  if (selectedModel.startsWith("gpt-")) {
    requestBody.max_completion_tokens = 4096;
    requestBody.reasoning = { effort: tier === "pro" ? "high" : "medium" };
  } else {
    requestBody.max_tokens = 2048;
  }
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(requestBody),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || "Model servisi yanıt vermedi");
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("Model boş yanıt döndürdü");
  return content;
}

export async function generateAslanReply(messages: AslanMessage[], tier: AslanTier = "plus") {
  const externalUrl = process.env.ASLAN_LLM_URL?.trim();
  const externalKey = process.env.ASLAN_LLM_KEY?.trim();
  if (externalUrl && externalKey) {
    return callOpenAICompatible(externalUrl, externalKey, process.env.ASLAN_LLM_MODEL || modelForTier(tier), messages, tier);
  }

  const baseUrl = process.env.MANUS_API_URL;
  const apiKey = process.env.MANUS_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("LLM servisi yapılandırılmamış");
  return callOpenAICompatible(baseUrl, apiKey, process.env.ASLAN_LLM_MODEL || undefined, messages, tier);
}

export function aslanPublicConfig() {
  return {
    name: "Aslan AI",
    developer: "Osman Kankılıç",
    primaryLanguage: "tr",
    tiers: {
      plus: { name: "Aslan Plus", description: "Hızlı günlük sohbet" },
      pro: { name: "Aslan Pro", description: "Daha güçlü akıl yürütme" },
    },
    uploads: "coming-soon",
  };
}
