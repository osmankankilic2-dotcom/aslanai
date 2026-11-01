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
