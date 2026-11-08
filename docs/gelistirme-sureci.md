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
2. [x] **İlk 15 dakika denetimi.**
   - Sıfır kayıtla level 1-20 arasını oyna ve hangi pencerenin ne zaman açıldığını sırasıyla not et.
   - Aynı anda üst üste binen pencere olmamalı; bir ekranda bir tanıtım kartı yeter.
   - Bulgular bu belgeye yazılır, kolay düzeltmeler hemen yapılır.
   - **Bulgular (2026-11-08):** Level 1-20 otomatik oynandı, konsolda hata çıkmadı.
     - **Pencere sırası:** Giriş → tanıtım → günlük ödül (Gün 1) → "Kaydır!" mekanik kartı → level 1. Mekanik kartları level 1, 4, 9 ve 17'de geliyor (Kaydır, Kar, Kasa, Su ve köprü). Her level sonunda sonuç ekranı ve harita açılıyor. Haritada level 2'nin penceresi ilk ziyarette bir kez çıkıyor.
     - **20 levelden sonra:** Ana sayfa, köy ve haritaya dönüldüğünde sırayla "Nadir balıklar", "Köyüne bir isim ver" ve "Yan yollar" çıkıyor. Her ekranda tek pencere oluyor, üst üste binen yok. Tanıtım kartlarındaki "Sonra" düğmesi akışı kesmiyor.
     - **Sorun 1, nokta yığılması:** 20 levelden sonra ana sayfada aynı anda 7 kırmızı nokta yanıyor (günlük bulmaca, gazete, harita, görevler, etkinlik, mağaza, köy). İlk açılışta da mağaza noktası yanıyor (ücretsiz coin videosu). Madde 3'te ele alınacak.
     - **Sorun 2, erken açılan özellikler:** Etkinlik kartı ve harita ilk açılıştan itibaren görünüyor; yeni oyuncu ilk dakikada 5 yan düğme görüyor. Bu bir tasarım kararı, "Karar bekleyenler"e yazıldı.
     - **Gözlem:** 20 level ve yaklaşık 985 coin biriktiği hâlde köyde hiç yapı kurulmamış olabiliyor; oyunu yalnızca köy noktası yönlendiriyor. İlk yapıya yönlendiren bir ipucu madde 3 ile birlikte düşünülebilir.
3. [x] **Kırmızı nokta düzeni.**
   - Her noktanın kaynağı tek tek listelenir.
   - Nokta yalnızca "şimdi yapılacak bir iş" varken yanar. Sürekli yanan noktalar kaldırılır ya da kart içindeki yazıya dönüşür.
   - **Nokta kaynakları (2026-11-08):**
     - Ana sayfa: günlük ödül alınmadıysa, günlük bulmaca açık ve bitmediyse, gazetenin okunmamış sayısı, haritada açılacak yıldız sandığı, görev ya da başarım ödülü, etkinlikte alınacak ödül.
     - Alt menü: mağaza (ücretsiz coin hakkı) ve köy (yapılacak iş varsa).
     - Köy: Yapılar ve Köy hayatı sekmeleri ile kartlar (sipariş, festival, evcil dost, dostluk, tarif, iç mekân).
   - **Değişenler:**
     - Mağaza noktası artık günde bir kez yanıyor ve mağaza açılınca sönüyor; eskiden ücretsiz video hakkı olduğu sürece hep yanıyordu.
     - Yapı kartlarında nokta yalnızca önerilen sıradaki yapıda (en ucuz, kar tanesi yeten). Parası yeten diğer kartlar yalnızca yeşil çerçeveli; sahnedeki yükseltme oku da tek.
     - Köy hayatı sekmesinin kakao noktası standın yarısı dolunca değil, tamamen dolunca (üretim durunca) yanıyor.
   - **Sonuç:** Zengin test kaydında köyde 10 yeşil kart, 1 nokta ve 1 ok. Ana sayfada kalan noktaların her biri yapılacak gerçek bir işe bağlı.
4. [x] **Hata günlüğü.**
   - Oyunda yakalanan hatalar cihazda küçük bir günlükte tutulur (son 30 kayıt).
   - Ayarlar'daki "Oynanış verisi" yanına "Hata kaydını kopyala" düğmesi eklenir. Mustafa test ederken sorun bildirebilsin diye.
   - **Yapıldı (2026-11-08):** `js/errlog.js` ilk modül olarak yüklenir ve hataları cihazda tutar (son 30 kayıt, `pofi.err.v1`, sunucuya gitmez). Her kayıtta zaman, ekran, level ve yığın izinin ilk satırları var. Aynı hata art arda gelirse sayacı artar. Görsel ya da ses yüklenememesi kaydedilmez, oyun onu zaten yedekle karşılıyor. Ayarlar > "Hata kaydı" son 5 hatayı gösterir ve "Kaydı kopyala" düğmesi sürüm, ekran boyutu ve tarayıcı bilgisiyle düz metin kopyalar; pano kapalıysa metin seçili bir kutuda çıkar. "Kaydı temizle" günlüğü boşaltır.
5. [x] **Dokunma alanı ve yazı boyu denetimi.**
   - Düğmeler en az 44 px, yazılar en az 12 px olmalı.
   - 360 px dar ekranda taşma ve yatay kaydırma olmamalı.
   - **Yapıldı (2026-11-08):** 360 px genişlikte ölçülen ekranlar: ana sayfa, köy, mağaza, gardırop, ayarlar, oyun, harita, görevler, etkinlik, sipariş ve festival pencereleri. Yatay kaydırma ve taşma hiçbir yerde yok.
     - **Düzeltilenler:** Bütün düğmeler en az 40 px yükseklikte; pencerelerdeki "Kapat" bağlantıları 19 px'ten 40 px'e çıktı. Etkinlik dükkânı, festival bağışı, "Hepsini al" ve sandık düğmeleri 32-37 px'ten 40 px'e; köy ve gardırop sekmeleri 40 px'e; köy adındaki kalem düğmesinin dokunma alanı 26x22 px'ten 40x40 px'e çıktı.
     - **Yazılar:** Alt menü, ana sayfa yan düğmeleri, oyun araç çubuğu etiketleri ve görevler ekranındaki bölge ve albüm yazıları en az 12 px oldu.
     - **Bilerek küçük kalanlar:** Etkinlik süresi rozeti (11 px), Oyna düğmesindeki "LEVEL" etiketi (11 px) ve albümdeki "?" işaretleri. Ayar anahtarları satırın tamamıyla dokunulabildiği için sorun değil.
6. [x] **Performans.**
   - Köy sahnesi, ekran gizliyken ya da sekme değişince çizmeyi bırakmalı.
   - Kare süresi ölçülür; köyde ve oyunda 16 ms'yi aşan yerler düzeltilir.
   - **Yapıldı (2026-11-08):**
     - **Gizli ekranlar:** Kare döngüsü yalnızca açık ekranı çiziyor; köy başka ekrandayken çizilmiyor. Sekme gizlenince tarayıcı döngüyü zaten durduruyor. Sürekli çalışan zamanlayıcı yok; reklam ve müzik geçişindekiler kısa ömürlü.
     - **Kare süresi:** 3x piksel yoğunluklu telefon taklidiyle ölçüldü (masaüstü işlemci, yalnızca JavaScript süresi): ana sayfa 0,7 ms, köy 1,0 ms, oyun 0,4 ms, harita 0,5 ms, gardırop 0,1 ms; en kötü kare 2,6 ms. Telefonda 4-6 kat yavaş olsa bile 16 ms'nin altında.
     - **Asıl yük boyamadaydı:** Ana sayfa sahnesi her karede 1,8 MP, köy 0,9 MP boyuyordu. Sahne tuvallerinde piksel yoğunluğu 2x ile sınırlandı: ana sayfa 0,8 MP, köy 0,4 MP. Köy fotoğrafı kendi çözünürlüğünü kullandığı için etkilenmedi.
     - **Ek düzeltme:**  artık yalnızca yükseklik değiştiğinde de tuvali güncelliyor.
     - **Denenmedi:** Gerçek telefonda boyama süresi ölçülmedi.
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
- **Erken açılan özellikler:** Haftalık etkinlik kartı ve harita level 1'den görünüyor. Günlük bulmaca level 5'e kadar soluk duruyor. Etkinlik kartının örneğin level 10'dan sonra açılması ilk dakikaları sadeleştirir; açılış levelleri senin kararın.
- **Denge geçişi:** Mustafa'ya proje gönderilecek; denge rehberi hazır (`docs/denge/denge-rehberi.md`).

## Yapılanlar

- 2026-11-08 · `de3619d` Mustafa'nın müzikleri oyunda.
- 2026-11-08 · `1a33a9f` Köyde sahnede toplama ve sipariş panosu.
- 2026-11-08 · `024cdfa` Aylık köy festivali.
- 2026-11-08 · `4f542cb` Duman testi (`node tools/smoke.mjs`): bütün leveller, ayar ve dosya tutarlılığı, kayıt göçü.
- 2026-11-08 · İlk 15 dakika denetimi: level 1-20 otomatik oynandı, pencere sırası temiz; bulgular madde 2'de.
- 2026-11-08 · `c2149be` Kırmızı nokta düzeni: mağaza günde bir kez, yapılarda tek önerilen nokta ve ok, kakao noktası stant dolunca.
- 2026-11-08 · `b3016b6` Hata günlüğü (`js/errlog.js`) ve Ayarlar'da "Hata kaydı": kopyala ve temizle.
- 2026-11-08 · `8c65860` Dokunma alanı ve yazı boyu denetimi: düğmeler en az 40 px, yazılar en az 12 px, 360 px'te taşma yok.
- 2026-11-08 · `e0a1c77` Performans: kare süreleri ölçüldü (en kötü 2,6 ms), sahne tuvalleri 2x yoğunlukla (boyanan piksel yarıdan az).
