import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Check, Copy, FileUp, KeyRound, Menu, PanelLeft, Plus, ShieldCheck, Sparkles, Trash2, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

type Message = { role: "user" | "assistant"; content: string };
type ModelTier = "plus" | "pro";
type ModelOption = { id: string; name: string; source: "live" | "local"; description: string };
type UploadedFile = { name: string; mimeType: string; url: string };
type User = { id: number; username: string };
type ApiKey = { id: number; name: string; lastThree: string; createdAt: string };

const modelOptions: ModelOption[] = [
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
  { id: "Qwen3-8B-Q4_K_M", name: "Qwen3-8B-Q4_K_M", source: "local", description: "Yerel dosya; canlı sunucuya bağlı değil" },
  { id: "Phi-4-mini-instruct-Q4_K_M", name: "Phi-4-mini-instruct-Q4_K_M", source: "local", description: "Yerel dosya; canlı sunucuya bağlı değil" },
];

const starterPrompts = ["Windows'ta yeni bir yazılım projesini nasıl kurarım?", "Android uygulaması için modern bir teknoloji yığını öner.", "Bu fikri Türkçe ve uygulanabilir bir proje planına dönüştür."];

function LogoMark() { return <div className="logo-mark" aria-hidden="true"><span>A</span><i /></div>; }

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modelTier, setModelTier] = useState<ModelTier>(() => (localStorage.getItem("aslan-model-tier") as ModelTier) || "plus");
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem("aslan-model") || "Qwen3-4B");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showKeys, setShowKeys] = useState(false);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState<{ name: string; apiKey: string; lastThree: string } | null>(null);
  const [copied, setCopied] = useState<"full" | "lastThree" | null>(null);

  const hasConversation = messages.length > 0;
  const intro = useMemo(() => messages.length === 0, [messages.length]);

  useEffect(() => {
    fetch("/api/auth/session").then((response) => response.json()).then((payload) => { setUser(payload.user || null); setAuthReady(true); }).catch(() => setAuthReady(true));
  }, []);

  async function submitAuth() {
    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || "İşlem başarısız.");
      setUser(payload.user); setPassword("");
    } catch (error) { toast.error(error instanceof Error ? error.message : "İşlem başarısız."); }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null); setMessages([]); setShowKeys(false);
  }

  async function sendMessage(text = draft) {
    const content = text.trim();
    if ((!content && uploadedFiles.length === 0) || isSending) return;
    const selected = modelOptions.find((option) => option.id === selectedModel);
    if (selected?.source === "local") { toast.error("Bu yerel model dosyası indirildi, ancak canlı sunucuya henüz bağlanmadı."); return; }
    const displayContent = [content, ...uploadedFiles.map((file) => `[Dosya eklendi: ${file.name}]`)].filter(Boolean).join("\n\n");
    const next = [...messages, { role: "user", content: displayContent } as Message];
    const richContent = [{ type: "text", text: content || "Ekli dosyayı incele." }, ...uploadedFiles.map((file) => file.mimeType.startsWith("image/") ? { type: "image_url", image_url: { url: file.url, detail: "auto" as const } } : { type: "file_url", file_url: { url: file.url, mime_type: file.mimeType } })];
    const requestMessages = [...messages, { role: "user", content: richContent }];
    setMessages(next); setDraft(""); setUploadedFiles([]); setIsSending(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: requestMessages, tier: modelTier, model: selectedModel }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || "Yanıt alınamadı.");
      const answer = payload.choices[0].message.content as string;
      for (let index = 0; index <= answer.length; index += 4) {
        setMessages([...next, { role: "assistant", content: answer.slice(0, index) }]);
        await new Promise((resolve) => setTimeout(resolve, 12));
      }
    } catch (error) { setMessages(messages); setDraft(content || "Dosya gönderimi"); toast.error(error instanceof Error ? error.message : "Aslan AI şu anda yanıt veremiyor."); }
    finally { setIsSending(false); }
  }

  async function loadKeys() {
    const response = await fetch("/api/keys");
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.message || "Anahtarlar alınamadı.");
    setKeys(payload.keys || []);
  }

  async function openKeyPanel() {
    try { await loadKeys(); setShowKeys(true); } catch (error) { toast.error(error instanceof Error ? error.message : "Anahtarlar alınamadı."); }
  }

  async function createKey() {
    if (!keyName.trim()) return;
    const response = await fetch("/api/keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: keyName.trim() }) });
    const payload = await response.json();
    if (!response.ok) { toast.error(payload?.error?.message || "Anahtar oluşturulamadı."); return; }
    setNewKey(payload.key); setKeyName(""); await loadKeys();
  }

  async function deleteKey(id: number) {
    const response = await fetch(`/api/keys/${id}`, { method: "DELETE" });
    if (!response.ok) { toast.error("Anahtar silinemedi."); return; }
    setKeys((current) => current.filter((key) => key.id !== id));
    if (newKey && keys.find((key) => key.id === id)) setNewKey(null);
  }

  async function copyText(value: string, type: "full" | "lastThree") {
    await navigator.clipboard?.writeText(value); setCopied(type); setTimeout(() => setCopied(null), 1500);
  }

  async function copyMessage(value: string) {
    await navigator.clipboard?.writeText(value);
    toast.success("Mesaj kopyalandı.");
  }

  function chooseModel(value: ModelTier) {
    setModelTier(value);
    localStorage.setItem("aslan-model-tier", value);
  }

  function chooseRealModel(value: string) {
    setSelectedModel(value);
    localStorage.setItem("aslan-model", value);
    setModelTier(value.startsWith("gpt-") || value.startsWith("gemini-") ? "pro" : "plus");
  }

  async function attachFile(file: File) {
    if (file.size > 8 * 1024 * 1024) { toast.error("Dosya en fazla 8 MB olabilir."); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const response = await fetch("/api/uploads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, mimeType: file.type, data: reader.result }) });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error?.message || "Dosya yüklenemedi.");
        setUploadedFiles((current) => [...current, payload.file]);
        toast.success(`${file.name} eklendi.`);
      } catch (error) { toast.error(error instanceof Error ? error.message : "Dosya yüklenemedi."); }
    };
    reader.readAsDataURL(file);
  }

  if (!authReady) return <main className="auth-shell"><div className="auth-card"><div className="auth-icon"><ShieldCheck size={25} /></div><h1>Aslan AI</h1><p>Giriş hazırlanıyor…</p></div></main>;
  if (!user) return <main className="auth-shell"><div className="auth-card"><div className="auth-icon"><UserRound size={25} /></div><span className="auth-kicker">ÖZEL ÇALIŞMA ALANI</span><h1>Aslan AI</h1><p>{authMode === "login" ? "Kullanıcı adın ve şifrenle sohbet alanına gir." : "Kendine bir kullanıcı hesabı oluştur."}</p><label className="auth-label">Kullanıcı adı<input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="kullanici_adi" autoFocus /></label><label className="auth-label">Şifre<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitAuth(); }} placeholder="En az 8 karakter" /></label><button className="auth-submit" onClick={submitAuth} disabled={!username.trim() || !password}>{authMode === "login" ? "Giriş yap" : "Hesap oluştur"}</button><button className="auth-switch" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>{authMode === "login" ? "İlk kez mi? Hesap oluştur" : "Zaten hesabın var mı? Giriş yap"}</button><small className="auth-note">Sohbetlerin ve API anahtarların yalnızca bu kullanıcı hesabına aittir.</small></div></main>;

  return <main className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}><div className="brand-row"><div className="brand"><LogoMark /><div><strong>Aslan AI</strong><span>@{user.username}</span></div></div><button className="icon-button mobile-only" onClick={() => setSidebarOpen(false)} aria-label="Menüyü kapat"><X size={18} /></button></div><button className="new-chat" onClick={() => { setMessages([]); setDraft(""); }}><Plus size={18} /> Yeni sohbet</button><div className="side-section"><span className="eyebrow">Çalışma alanı</span><div className="side-card active"><Sparkles size={17} /><div><b>Aslan sohbeti</b><small>Türkçe öncelikli yardımcı</small></div></div><label className="model-picker">Model seçimi<select value={selectedModel} onChange={(event) => chooseRealModel(event.target.value)}>{modelOptions.map((option) => <option key={option.id} value={option.id}>{option.name}{option.source === "local" ? " · yerel" : ""}</option>)}</select><small>{modelOptions.find((option) => option.id === selectedModel)?.description}</small><div className="media-model-note"><b>Görsel:</b> gemini-2.5-flash-image-preview, gpt-image-2<br /><b>Ses:</b> whisper-1 (metinden sese değil, ses→metin)</div></label></div><div className="sidebar-spacer" /><button className="key-manager-button" onClick={openKeyPanel}><KeyRound size={16} /> API anahtarlarım</button><button className="logout-button" onClick={logout}>Oturumu kapat</button><div className="side-note"><ShieldCheck size={17} /><p>İstekler sunucuda korunur. Anahtarların yalnızca bu hesabın altında görünür.</p></div><div className="developer">Osman Kankılıç tarafından geliştirildi</div></aside>
    <section className="workspace"><header className="topbar"><button className="icon-button mobile-only" onClick={() => setSidebarOpen(true)} aria-label="Menüyü aç"><Menu size={20} /></button><div className="topbar-title"><span className="status-dot" /> Aslan AI <span className="muted">/</span> Sohbet</div><div className="topbar-actions"><button className="icon-button" onClick={() => { setMessages([]); setDraft(""); }} aria-label="Yeni sohbet"><Plus size={18} /></button><button className="icon-button desktop-only" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Kenar çubuğunu aç/kapat"><PanelLeft size={18} /></button></div></header><div className="conversation">{intro ? <div className="welcome-block"><div className="welcome-kicker"><LogoMark /><span>Aslan AI hazır</span></div><h1>Fikrini söyle.<br /><em>Birlikte netleştirelim.</em></h1><p>Türkçe öncelikli, yazılım ve günlük teknoloji işlerinde yanında olan kişisel çalışma arkadaşın.</p><div className="prompt-grid">{starterPrompts.map((prompt) => <button key={prompt} className="prompt-card" onClick={() => sendMessage(prompt)}>{prompt}<ArrowUp size={15} /></button>)}</div></div> : <div className="message-list">{messages.map((message, index) => <div className={`message-row ${message.role}`} key={`${message.role}-${index}`}>{message.role === "assistant" ? <LogoMark /> : <div className="user-avatar"><UserRound size={15} /></div>}<div className="message-content"><span className="message-label">{message.role === "assistant" ? "Aslan AI" : "Sen"}</span>{message.role === "assistant" ? <Streamdown>{message.content}</Streamdown> : <p>{message.content}</p>}<button className="message-copy" onClick={() => copyMessage(message.content)} aria-label="Mesajı kopyala"><Copy size={14} /></button></div></div>)}{isSending && <div className="message-row assistant"><LogoMark /><div className="message-content"><span className="message-label">Aslan AI</span><div className="typing"><i /><i /><i /></div></div></div>}</div>}</div><div className="composer-wrap"><div className="composer">{uploadedFiles.length > 0 && <div className="upload-chips" aria-label="Eklenen dosyalar">{uploadedFiles.map((file) => <button key={file.url} className="upload-chip" onClick={() => setUploadedFiles((current) => current.filter((item) => item.url !== file.url))}>{file.name} <X size={13} /></button>)}</div>}<textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder="Aslan AI'ye bir şey sor..." rows={1} /><input ref={fileInputRef} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,video/mp4,audio/mpeg" onChange={(event) => { const file = event.target.files?.[0]; if (file) void attachFile(file); event.currentTarget.value = ""; }} /><button className="attach-button" onClick={() => fileInputRef.current?.click()} aria-label="Dosya ekle"><FileUp size={18} /></button><button className="send-button" onClick={() => sendMessage()} disabled={(!draft.trim() && uploadedFiles.length === 0) || isSending} aria-label="Gönder"><ArrowUp size={19} /></button></div><div className="composer-meta"><span><ShieldCheck size={13} /> Yanıtlar yapay zekâ tarafından üretilir</span><span>Enter gönder · Shift + Enter yeni satır</span></div></div></section>
    {showKeys && <div className="modal-backdrop" onClick={() => setShowKeys(false)}><div className="key-modal key-manager" onClick={(event) => event.stopPropagation()}><div className="modal-heading"><div><div className="modal-icon"><KeyRound size={20} /></div><h2>API anahtarlarım</h2></div><button className="icon-button" onClick={() => setShowKeys(false)} aria-label="Kapat"><X size={18} /></button></div><p>Her anahtar için zorunlu bir ad ver. Tam anahtar yalnızca oluşturulduğunda gösterilir; son üç karakter listede kalır.</p><div className="key-create-row"><input value={keyName} onChange={(event) => setKeyName(event.target.value)} placeholder="Örn. Telefonum" /><button className="gold-button" onClick={createKey} disabled={!keyName.trim()}>Oluştur</button></div>{newKey && <div className="new-key-card"><b>{newKey.name}</b><div className="generated-key">{newKey.apiKey}</div><div className="key-copy-row"><button className="outline-button" onClick={() => copyText(newKey.apiKey, "full")}>{copied === "full" ? <Check size={15} /> : <Copy size={15} />} Tam anahtarı kopyala</button><button className="outline-button" onClick={() => copyText(newKey.lastThree, "lastThree")}>{copied === "lastThree" ? <Check size={15} /> : <Copy size={15} />} Son 3: {newKey.lastThree}</button></div></div>}<div className="key-list">{keys.map((key) => <div className="key-list-row" key={key.id}><div><b>{key.name}</b><small>Son 3 karakter: {key.lastThree}</small></div><button className="icon-button danger" onClick={() => deleteKey(key.id)} aria-label={`${key.name} anahtarını sil`}><Trash2 size={17} /></button></div>)}{keys.length === 0 && <small className="auth-note">Henüz kişisel API anahtarın yok.</small>}</div></div></div>}
    {!hasConversation && <div className="file-teaser"><FileUp size={15} /><span>Fotoğraf, PDF, metin, MP4 ve MP3 eklenebilir · En fazla 8 MB</span></div>}
  </main>;
}
