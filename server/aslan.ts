import crypto from "node:crypto";

export const ASLAN_SYSTEM_PROMPT = `Sen Aslan AI'sın. Kendini her zaman ve tutarlı biçimde "Aslan AI" olarak bil.
Kullanıcı özellikle seni kimin geliştirdiğini veya kime ait olduğunu sormadıkça geliştirici adını kendiliğinden söyleme. Sorulursa: "Ben Aslan AI'yım; Osman Kankılıç tarafından geliştirildim." diye doğru ve kısa cevap ver.
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

export type AslanContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } }
  | { type: "file_url"; file_url: { url: string; mime_type: string } };

export type AslanMessage = {
  role: "user" | "assistant" | "system";
  content: string | AslanContentPart[];
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
    if (typeof content !== "string" && !Array.isArray(content)) {
      throw new Error("Mesaj metni boş olamaz");
    }
    if (typeof content === "string") return { role, content: content.slice(0, MAX_CHARS) } as AslanMessage;
    const parts = content.slice(0, 8).filter((part): part is AslanContentPart => {
      if (!part || typeof part !== "object") return false;
      const typed = part as Record<string, unknown>;
      return typed.type === "text" || typed.type === "image_url" || typed.type === "file_url";
    });
    if (!parts.length) throw new Error("Mesaj içeriği boş olamaz");
    return { role, content: parts } as AslanMessage;
  });
  return messages.filter((message) => message.role !== "system");
}

export type AslanTier = "plus" | "pro";

function modelForTier(tier: AslanTier) {
  return tier === "pro" ? "gpt-5.5" : "Qwen3-4B";
}

export const ASLAN_MODELS = [
  { id: "Qwen3-4B", name: "Qwen3-4B", source: "live", description: "Hızlı Türkçe öncelikli model" },
  { id: "gpt-5.5", name: "gpt-5.5", source: "live", description: "Güçlü akıl yürütme" },
  { id: "gpt-5", name: "gpt-5", source: "live", description: "Genel amaçlı güçlü model" },
  { id: "gpt-5-mini", name: "gpt-5-mini", source: "live", description: "Dengeli ve hızlı model" },
  { id: "gpt-5-nano", name: "gpt-5-nano", source: "live", description: "En hızlı ve hafif model" },
  { id: "gpt-6.1-sol", name: "gpt-6.1-sol", source: "live", description: "İleri akıl yürütme" },
  { id: "gpt-6-luna", name: "gpt-6-luna", source: "live", description: "Genel amaçlı gelişmiş model" },
  { id: "gpt-6-sol", name: "gpt-6-sol", source: "live", description: "Gelişmiş akıl yürütme" },
  { id: "gemini-3.1-pro-preview", name: "gemini-3.1-pro-preview", source: "live", description: "Gemini Pro önizleme" },
  { id: "gemini-3.8-flash", name: "gemini-3.8-flash", source: "live", description: "Gemini hızlı model" },
  { id: "gemini-3-flash-preview", name: "gemini-3-flash-preview", source: "live", description: "Gemini Flash önizleme" },
  { id: "Qwen3-8B-Q4_K_M", name: "Qwen3-8B-Q4_K_M", source: "local", description: "Yerel dosya; sunucu bağlantısı bekliyor" },
  { id: "Phi-4-mini-instruct-Q4_K_M", name: "Phi-4-mini-instruct-Q4_K_M", source: "local", description: "Yerel dosya; sunucu bağlantısı bekliyor" },
] as const;

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

export async function generateAslanReply(messages: AslanMessage[], tier: AslanTier = "plus", requestedModel?: string) {
  const externalUrl = process.env.ASLAN_LLM_URL?.trim() || "https://8000-ijt216qrfxcoawej68sgo-a32a466a.sg2.manus.computer";
  const externalKey = process.env.ASLAN_LLM_KEY?.trim() || "temporary-local-qwen";
  if (externalUrl && externalKey) {
    return callOpenAICompatible(externalUrl, externalKey, process.env.ASLAN_LLM_MODEL || requestedModel || modelForTier(tier), messages, tier);
  }

  const baseUrl = process.env.MANUS_API_URL;
  const apiKey = process.env.MANUS_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("LLM servisi yapılandırılmamış");
  return callOpenAICompatible(baseUrl, apiKey, process.env.ASLAN_LLM_MODEL || requestedModel || modelForTier(tier), messages, tier);
}

export function aslanPublicConfig() {
  return {
    name: "Aslan AI",
    developer: "Osman Kankılıç",
    primaryLanguage: "tr",
    tiers: { plus: { name: "Qwen3-4B", description: "Hızlı günlük sohbet" }, pro: { name: "gpt-5.5", description: "Daha güçlü akıl yürütme" } },
    models: ASLAN_MODELS,
    mediaModels: {
      image: ["gemini-2.5-flash-image-preview", "gpt-image-2"],
      speechToText: ["whisper-1"],
      textToSpeech: [],
    },
    uploads: { enabled: true, maxBytes: 8 * 1024 * 1024, types: ["image/*", "application/pdf", "text/plain", "video/mp4", "audio/mpeg"] },
  };
}
