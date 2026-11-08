# Pofi: Buz Köyü · Geliştirme süreci

Bu belge oyunun geliştirme sırasını ve her turda izlenecek adımları tutar. Claude bu listeden sıradaki maddeyi alır, uygular, dener, yayına alır ve listeyi günceller. Senin kararını ya da ücretli bir işi gerektiren maddeler atlanır ve "Karar bekleyenler" bölümüne yazılır.

Durum: geliştirme aşaması, yayın daha uzakta. Mustafa müzikleri gönderiyor ve sonra oyun dengesini yapacak.

## Her turda

1. **Seç.** Aşağıdaki "Sıradaki işler" listesinden işaretlenmemiş ilk maddeyi al. Madde bir kural yüzünden yapılamıyorsa "Karar bekleyenler"e taşı ve bir sonrakine geç.
2. **Uygula.** Değişikliği küçük tut: bir madde bir commit olsun. Kod kalıbı aynı kalır: düz JS, derleme adımı yok.
3. **Dene.**
   - Bütün dosyalar için `node --check js/*.js` çalıştır ve `node tools/smoke.mjs` testini geçir (madde 1 ile gelir).
   - Tarayıcıda 375 px telefon boyutunda değişen ekranlara bak; konsolda hata olmamalı.
   - Test kaydı kullanıldıysa oyuncunun kaydını geri yükle.
4. **Yayına al.**
   - Commit'i yalnızca değişen dosyalarla `main`'e at ve gönder.
   - `docs/pofi-muzik-suno.html` ad değişikliğine dokunma.
5. **Kaydet.**
   - Maddeyi işaretle ve "Yapılanlar"a tarih ile commit kimliğini yaz.
   - Yaparken bulunan yeni işleri listenin sonuna ekle.
6. **Bildir.** Türkçe, kısa yaz: ne değişti, ne denendi, ne denenmedi.

## Kurallar (döngü bunları asla aşmaz)

- **Reklam:** Ara reklam yok, yalnızca oyuncunun seçtiği ödüllü reklam.
- **Görsel:** Ücretli görsel üretimi yok. Görsel gerekiyorsa madde "Karar bekleyenler"e gider; üretim görsel oturumunda, maliyet gösterilip onay alınarak yapılır.
- **Denge:** Level zorluğu, ödül ve fiyat sayıları değiştirilmez; dengeyi Mustafa yapar. Yeni sistemlerin başlangıç değerleri koyulabilir, ama denge rehberine yazılır.
- **Reddedilenler:**
  - Gizli rozet avı, iglo müzik kutusu, sohbet ya da çok oyunculu mod, üyelik duvarı, kart oyunu, balık tutma mini oyunu, İngilizce.
  - "Beklenenden az hamle" başarımı.
  - Kazma, kürek ve düdük güçlendiricileri askıda kalır.
  - Tam idle ve yapı zamanlayıcısı yok; hafif idle kalır, yeni para birimi eklenmez.
- **Ses:** Sürekli gürültü ortam sesi eklenmez.
- **Yayın işleri:** Mağaza, gerçek reklam SDK'sı, giriş, bildirim ve gizlilik metni kararla başlar, döngü bunlara kendisi girişmez.

## Sıradaki işler

1. [x] **Otomatik duman testi** (`tools/smoke.mjs`). Her tur bu testle başlar.
   - Bütün leveller çözülebilir olmalı ve çözüm uzunluğu kayıtlı en kısa çözümle eşleşmeli.
   - Yan yollar ve usta levelleri çözülebilir olmalı.
   - Ayar dosyasında tutarlılık bakılır: her başarımın sayacı var mı, her ikon dosyası var mı, her müzik dosyası var mı.
   - Kayıt göçü test edilir: boş kayıt ve eski kayıt hatasız açılmalı.
2. [ ] **İlk 15 dakika denetimi.**
   - Sıfır kayıtla level 1-20 arasını oyna ve hangi pencerenin ne zaman açıldığını sırasıyla not et.
   - Aynı anda üst üste binen pencere olmamalı; bir ekranda bir tanıtım kartı yeter.
   - Bulgular bu belgeye yazılır, kolay düzeltmeler hemen yapılır.
3. [ ] **Kırmızı nokta düzeni.**
   - Her noktanın kaynağı tek tek listelenir.
   - Nokta yalnızca "şimdi yapılacak bir iş" varken yanar. Sürekli yanan noktalar kaldırılır ya da kart içindeki yazıya dönüşür.
4. [ ] **Hata günlüğü.**
   - Oyunda yakalanan hatalar cihazda küçük bir günlükte tutulur (son 30 kayıt).
   - Ayarlar'daki "Oynanış verisi" yanına "Hata kaydını kopyala" düğmesi eklenir. Mustafa test ederken sorun bildirebilsin diye.
5. [ ] **Dokunma alanı ve yazı boyu denetimi.**
   - Düğmeler en az 44 px, yazılar en az 12 px olmalı.
   - 360 px dar ekranda taşma ve yatay kaydırma olmamalı.
6. [ ] **Performans.**
   - Köy sahnesi, ekran gizliyken ya da sekme değişince çizmeyi bırakmalı.
   - Kare süresi ölçülür; köyde ve oyunda 16 ms'yi aşan yerler düzeltilir.
7. [ ] **Çevrimdışı ses.**
   - Müzik ve jingle'lar servis çalışanında güvenli biçimde önbelleğe alınır; tarayıcının parça parça yükleme isteklerine dikkat edilir.
   - Uçak modunda oyun açılınca müzik de çalmalı.
8. [ ] **Bölge sonu hikâye kartları.**
   - Her bölgenin sonunda yalnızca yazı ve mevcut görsellerle kısa bir sahne olur: köyün neden kurulduğu, Pofi'nin yolu.
   - Metinler köylü hikâyeleriyle bağlanır.
9. [ ] **Gazete zenginleştirme.**
   - Haftanın sipariş sayısı, festival durumu, köylü dostlukları ve nadir balık gibi gerçek oyuncu verisinden haberler.
   - Bilmece havuzu genişletilir.
10. [ ] **Ayarlar'a "Nasıl oynanır" sayfası.**
    - Mekanikler mevcut karo görselleriyle anlatılır.
    - Her mekanik ilk göründüğü levelden sonra açılır.

## Karar bekleyenler

- **Köy büyüme görselleri:** Köy seviyesi arttıkça daha çok köylü, ışık ve tekne. Görsel üretimi gerekir, maliyet görsel oturumunda çıkarılacak.
- **Kalan müzikler:** Level 136+, zor leveller, günlük bulmaca, 4 etkinlik, köy büyüdü, bir daha dene ve açılış parçaları Mustafa'dan bekleniyor. Gelince `MUSIC` ayarına eklenir.
- **Bildirimler:** "Stant doldu" ve "festivalin son günü" hatırlatmaları. Oyunun yayınlanacağı platforma bağlı.
- **Giriş düğmeleri:** Google ve Apple ile giriş şu an çalışmıyor; yayın öncesi karar.
- **Denge geçişi:** Mustafa'ya proje gönderilecek; denge rehberi hazır (`docs/denge/denge-rehberi.md`).

## Yapılanlar

- 2026-11-08 · `de3619d` Mustafa'nın müzikleri oyunda.
- 2026-11-08 · `1a33a9f` Köyde sahnede toplama ve sipariş panosu.
- 2026-11-08 · `024cdfa` Aylık köy festivali.
