# Aslan AI İş Listesi

## Tarayıcı sohbet deneyimi
- [x] Kullanıcılar yalnızca sohbet ekranını kullanabiliyor; ana ekran modern, Türkçe ve mobil uyumlu.
- [x] Asistan her zaman Aslan AI adını ve Osman Kankılıç tarafından geliştirildiğini koruyor.
- [x] Türkçe öncelikli; İngilizce, Windows, macOS, Android ve yazılım geliştirme konularında yardımcı davranış uygulanıyor.
- [x] Yanıt üretimi sırasında yükleniyor durumu, hata geri bildirimi ve sohbet akışı korunuyor.

## Özel API erişimi
- [x] Model isteklerini proje sahibine özel API anahtarıyla kontrol eden `/api/v1/chat` endpoint'i var.
- [x] Endpoint Bearer veya `x-aslan-api-key` başlığı ile kullanılabiliyor.
- [x] Anahtar kaynak kodda ve tarayıcı bundle'ında görünmüyor; `.env` ile sunucuda tutuluyor.
- [x] API yanıtları JSON biçiminde ve anlaşılır hata kodlarıyla dönüyor.
- [x] Anahtar gerektirmeyen aynı-origin `/api/chat` rotası web sitesindeki ziyaretçi sohbeti için ayrıldı.

## Dosya fazı
- [x] Dosya yükleme ilk sürümde kapalı tutuluyor.
- [x] İleride kontrollü ve kademeli dosya yükleme için arayüzde hazırlık mesajı bulunuyor.

## Kullanıcı hesapları ve kişisel anahtarlar
- [x] Siteye giren kullanıcıdan kullanıcı adı ve şifre isteniyor; kayıt ve giriş oturumları sunucu tarafında korunuyor.
- [x] Her kullanıcı yalnızca kendi sohbetine ve kendi API anahtar listesine erişebiliyor.
- [x] API anahtarı oluştururken isim vermek zorunlu; anahtar `aslan_` ile başlıyor.
- [x] Yeni anahtarın tam değeri oluşturma anında gösteriliyor; tam anahtar ve son üç karakter için ayrı kopyalama düğmeleri bulunuyor.
- [x] Kullanıcı kendi API anahtarını silebiliyor; silinen anahtar API isteklerinde geçersiz oluyor.
- [x] API anahtarları veritabanında hashlenmiş olarak kalıcı tutuluyor; kaynak koda veya tarayıcı bundle'ına yazılmıyor.

## Sohbet deneyimi
- [x] Ana ekranda teknik model kimliği gösterilmiyor; menüden Aslan Plus veya Aslan Pro seçilebiliyor.
- [x] Aslan Plus hızlı günlük sohbet katmanı, Aslan Pro daha güçlü akıl yürütme katmanı olarak sunucuya bağlandı.
- [x] Kullanıcı ve Aslan AI mesajlarında ekran okuyucu etiketli kopyalama düğmesi bulunuyor.
- [x] Yanıt metni kullanıcıya kademeli olarak akıyor ve bekleme durumunda görünür hareketli gösterge bulunuyor.
- [x] Yeni sohbet düğmesi üst çubukta küçük, erişilebilir bir düğme olarak da bulunuyor.
- [x] Çalışan metin modelleri gerçek model adlarıyla seçilebilir: Qwen3-4B, gpt-5.5, gpt-5, gpt-5-mini, gpt-5-nano, gpt-6.1-sol, gpt-6-luna, gpt-6-sol, gemini-3.1-pro-preview, gemini-3.8-flash ve gemini-3-flash-preview.
- [x] İndirilen Qwen3-8B-Q4_K_M ve Phi-4-mini-instruct-Q4_K_M yerel seçenekleri katalogda açıkça gösteriliyor; canlı sunucuya bağlı olmayan seçenekler mesaj gönderirken dürüstçe bildirilir.
- [x] Fotoğraf, PDF, metin, MP4 ve MP3 için girişte dosya ekleme düğmesi eklendi; dosyalar sunucu üzerinden kullanıcıya özel kalıcı depolama adresine yüklenip desteklenen model isteğine ekleniyor.
- [x] Görsel modelleri `gemini-2.5-flash-image-preview` ve `gpt-image-2`, ses modeli `whisper-1` olarak yapılandırmada açıkça gösteriliyor. Metinden sese modeli mevcut katalogda bulunmadığı için eklenmedi.
