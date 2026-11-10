# Aslan AI Planı

## Ürün
Aslan AI, Türkçe öncelikli ve İngilizce destekli bir tarayıcı sohbet uygulamasıdır. Kimlik mesajı Aslan AI adını ve Osman Kankılıç geliştirici bilgisini sabitler. Windows, macOS, Android ve yazılım geliştirme konularında yardımcı olur.

## Uygulama yaklaşımı
- React + Tailwind ön yüzünde sade, koyu, siyah-altın bir sohbet arayüzü.
- Express sunucusunda `/api/v1/chat` OpenAI-uyumlu olmayan, basit ve güvenli bir JSON sohbet uç noktası.
- İstekler `x-aslan-api-key` veya `Authorization: Bearer` ile korunur.
- API anahtarı tarayıcı koduna yazılmaz; sunucu ortamından okunur.
- İlk sürümde dosya yükleme kapalıdır; arayüzde bunun sonraki faz olduğu belirtilir.
- LLM çağrısı sunucu tarafında Manus OpenAI-uyumlu LLM servisine yapılır. Aslan Plus hızlı günlük katman, Aslan Pro daha güçlü akıl yürütme katmanıdır; teknik model adları ana sohbet yüzeyinde gösterilmez.
- Qwen3-8B GGUF Q4_K_M yerel seçenek olarak ayrıca indirilecek; canlı yayına bağlamak için ayrı bir yerel model sunucusu gerekecektir.
- Model seçici, güncel katalogda kullanılabilir durumdaki metin modellerini gerçek kimlikleriyle gösterir; geçici olarak kullanılamayan sağlayıcılar listeye dahil edilmez.
- Sohbet alanı kullanıcıya özel depolamaya fotoğraf, PDF, metin, MP4 ve MP3 yükleyebilir; sunucu, model isteğinde kullanılmak üzere geçici erişim adresi üretir ve tarayıcıya servis anahtarı vermez.
- Görsel üretim modelleri `gemini-2.5-flash-image-preview` ve `gpt-image-2`, ses transkripsiyon modeli `whisper-1` olarak ayrı yeteneklerdir; metin sohbetiyle karıştırılmaz.

## Tasarım
Üç olasılık: teknik gece konsolu (0.06), sıcak Türk teknoloji atölyesi (0.08), sade kurumsal çalışma masası (0.04). Seçilen yön: sıcak Türk teknoloji atölyesi.

- Design Movement: Koyu arayüzlü çağdaş ürün tasarımı; terminal netliği ile sıcak altın vurgu birleşir.
- Core Principles: netlik, güven, hızlı geri bildirim, yerel bağlam.
- Color Philosophy: kömür siyahı odaklanmayı, altın aslan rengi sahiplenilebilir markayı, soluk kâğıt tonu okunabilirliği taşır.
- Layout Paradigm: solda sabit marka rayı, ortada nefes alan konuşma tuvali, altta geniş kompozisyon alanı.
- Signature Elements: altın aslan monogramı, ince grid çizgileri, durum ışığı.
- Interaction Philosophy: her gönderim anında görünür durum verir; hata mesajı kullanıcı girdisini korur.
- Animation: kısa fade/slide geçişleri; yüklemede nabız atan durum ışığı; dikkat dağıtmayan 160–220ms geçişler.
- Typography: Inter sistem yığını; başlıkta güçlü ağırlık, metinde rahat satır yüksekliği.
- Brand Essence: Türkiye odaklı, yazılım bilen, kişisel yapay zekâ çalışma arkadaşı. Sıcak, yetkin, doğrudan.
- Brand Voice: “Ne yapmak istediğini söyle; birlikte netleştirelim.” “Türkçe anlat, teknik ayrıntıyı ben toparlayayım.”
- Wordmark & Logo: dairesel altın çerçeve içinde A harfi ve küçük pençe noktası.
- Signature Brand Color: #E2B45A.

## Proje yapısı
- `client/src/pages/Home.tsx`: sohbet ve ayarlar görünümü.
- `client/src/index.css`: Aslan AI görsel dili.
- `server/_core/index.ts`: HTTP API rotası.
- `server/aslan.ts`: kimlik talimatı, API anahtarı ve LLM adapterı.
- `public/manus-routes.json`: sayfa rota bildirimi.
- `TODO.md`: teslim kapsamı ve ilerleme.
