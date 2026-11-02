import { useEffect, useMemo, useState } from "react";
import { ArrowUp, Check, Copy, FileUp, KeyRound, LockKeyhole, Menu, PanelLeft, Plus, ShieldCheck, Sparkles, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

type Message = { role: "user" | "assistant"; content: string };

const starterPrompts = [
  "Windows'ta yeni bir yazılım projesini nasıl kurarım?",
  "Android uygulaması için modern bir teknoloji yığını öner.",
  "Bu fikri Türkçe ve uygulanabilir bir proje planına dönüştür.",
];

function LogoMark() {
  return <div className="logo-mark" aria-hidden="true"><span>A</span><i /></div>;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [sitePassword, setSitePassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [generatedKey, setGeneratedKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasConversation = messages.length > 0;
  const intro = useMemo(() => messages.length === 0, [messages.length]);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((payload) => setAuthenticated(Boolean(payload.authenticated)))
      .catch(() => setAuthenticated(false));
  }, []);

  async function login() {
    if (!sitePassword.trim() || isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: sitePassword }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || "Şifre kabul edilmedi.");
      setAuthenticated(true);
      setSitePassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Giriş yapılamadı.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function sendMessage(text = draft) {
    const content = text.trim();
    if (!content || isSending) return;
    const next = [...messages, { role: "user", content } as Message];
    setMessages(next);
    setDraft("");
    setIsSending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || "Yanıt alınamadı.");
      setMessages([...next, { role: "assistant", content: payload.choices[0].message.content }]);
    } catch (error) {
      setMessages(messages);
      setDraft(content);
      toast.error(error instanceof Error ? error.message : "Aslan AI şu anda yanıt veremiyor.");
    } finally {
      setIsSending(false);
    }
  }

  function resetChat() {
    setMessages([]);
    setDraft("");
  }

  async function revealApiKey() {
    try {
      const response = await fetch("/api/auth/api-key");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || "API anahtarı oluşturulamadı.");
      setGeneratedKey(payload.apiKey);
      setShowKey(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "API anahtarı oluşturulamadı.");
    }
  }

  async function copyGeneratedKey() {
    if (!generatedKey) return;
    await navigator.clipboard?.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (authenticated === null) {
    return <main className="auth-shell"><div className="auth-card"><div className="auth-icon"><LockKeyhole size={25} /></div><h1>Aslan AI</h1><p>Güvenli sohbet hazırlanıyor…</p></div></main>;
  }

  if (!authenticated) {
    return <main className="auth-shell"><div className="auth-card"><div className="auth-icon"><LockKeyhole size={25} /></div><span className="auth-kicker">ÖZEL ÇALIŞMA ALANI</span><h1>Aslan AI</h1><p>Bu sohbet yalnızca senin için. Devam etmek için site şifreni gir.</p><label className="auth-label">Site şifresi<input type="password" value={sitePassword} onChange={(event) => setSitePassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") login(); }} placeholder="Şifreni yaz" autoFocus /></label><button className="auth-submit" onClick={login} disabled={!sitePassword.trim() || isLoggingIn}>{isLoggingIn ? "Kontrol ediliyor…" : "Sohbete gir"}</button><small className="auth-note">API anahtarı bu ekranda gösterilmez.</small></div></main>;
  }

  return (
    <main className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="brand-row"><div className="brand"><LogoMark /><div><strong>Aslan AI</strong><span>Türkçe teknoloji asistanı</span></div></div><button className="icon-button mobile-only" onClick={() => setSidebarOpen(false)} aria-label="Menüyü kapat"><X size={18} /></button></div>
        <button className="new-chat" onClick={resetChat}><Plus size={18} /> Yeni sohbet</button>
        <div className="side-section"><span className="eyebrow">Çalışma alanı</span><div className="side-card active"><Sparkles size={17} /><div><b>Aslan sohbeti</b><small>Qwen3-4B · Türkçe öncelikli</small></div></div></div>
        <div className="sidebar-spacer" />
        <div className="side-note"><ShieldCheck size={17} /><p>İstekler sunucuda işlenir. Bu sohbet ekranında API anahtarı girmen gerekmez.</p></div>
        <div className="developer">Osman Kankılıç tarafından geliştirildi</div>
      </aside>

      <section className="workspace">
        <header className="topbar"><button className="icon-button mobile-only" onClick={() => setSidebarOpen(true)} aria-label="Menüyü aç"><Menu size={20} /></button><div className="topbar-title"><span className="status-dot" /> Aslan AI <span className="muted">/</span> Sohbet</div><div className="topbar-actions"><button className="soft-button" onClick={revealApiKey}><KeyRound size={16} /> API anahtarım</button><button className="icon-button desktop-only" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Kenar çubuğunu aç/kapat"><PanelLeft size={18} /></button></div></header>
        <div className="conversation">
          {intro ? <div className="welcome-block"><div className="welcome-kicker"><LogoMark /><span>Aslan AI hazır</span></div><h1>Fikrini söyle.<br /><em>Birlikte netleştirelim.</em></h1><p>Türkçe öncelikli, yazılım ve günlük teknoloji işlerinde yanında olan kişisel çalışma arkadaşın.</p><div className="prompt-grid">{starterPrompts.map((prompt) => <button key={prompt} className="prompt-card" onClick={() => sendMessage(prompt)}>{prompt}<ArrowUp size={15} /></button>)}</div></div> : <div className="message-list">{messages.map((message, index) => <div className={`message-row ${message.role}`} key={`${message.role}-${index}`}>{message.role === "assistant" ? <LogoMark /> : <div className="user-avatar"><UserRound size={15} /></div>}<div className="message-content"><span className="message-label">{message.role === "assistant" ? "Aslan AI" : "Sen"}</span>{message.role === "assistant" ? <Streamdown>{message.content}</Streamdown> : <p>{message.content}</p>}</div></div>)}{isSending && <div className="message-row assistant"><LogoMark /><div className="message-content"><span className="message-label">Aslan AI</span><div className="typing"><i /><i /><i /></div></div></div>}</div>}
        </div>
        <div className="composer-wrap"><div className="composer"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder="Aslan AI'ye bir şey sor..." rows={1} /><button className="send-button" onClick={() => sendMessage()} disabled={!draft.trim() || isSending} aria-label="Gönder"><ArrowUp size={19} /></button></div><div className="composer-meta"><span><ShieldCheck size={13} /> Yanıtlar yapay zekâ tarafından üretilir</span><span>Enter gönder · Shift + Enter yeni satır</span></div></div>
      </section>

      {showKey && <div className="modal-backdrop" onClick={() => setShowKey(false)}><div className="key-modal" onClick={(event) => event.stopPropagation()}><div className="modal-heading"><div className="modal-icon"><KeyRound size={20} /></div><button className="icon-button" onClick={() => setShowKey(false)} aria-label="Kapat"><X size={18} /></button></div><h2>API anahtarın hazır</h2><p>Bu anahtar şifrene bağlı olarak sunucuda doğrulanır. Kopyalayıp kendi isteklerinde kullanabilirsin.</p><div className="generated-key">{generatedKey}</div><div className="modal-actions"><button className="gold-button copy-key-button" onClick={copyGeneratedKey}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Kopyalandı" : "Kopyala"}</button></div><div className="endpoint-note"><span>İstek adresi</span><code>/api/v1/chat</code></div></div></div>}
      {!hasConversation && <div className="file-teaser"><FileUp size={15} /><span>Dosya yükleme yakında · İlk sürüm yalnızca sohbet</span></div>}
    </main>
  );
}
