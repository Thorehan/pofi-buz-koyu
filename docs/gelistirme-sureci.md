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

### Tur 1 (bitti, 2026-11-08)

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
     - **Ek düzeltme:** `fitCanvas` artık yalnızca yükseklik değiştiğinde de tuvali güncelliyor.
     - **Denenmedi:** Gerçek telefonda boyama süresi ölçülmedi.
7. [x] **Çevrimdışı ses.**
   - Müzik ve jingle'lar servis çalışanında güvenli biçimde önbelleğe alınır; tarayıcının parça parça yükleme isteklerine dikkat edilir.
   - Uçak modunda oyun açılınca müzik de çalmalı.
   - **Yapıldı (2026-11-08):**
     - **Ses önbelleği:** Servis çalışanında müzik için ayrı bir önbellek var (`pofi-audio-v1`). Bir parça ilk çalındığında istek ağdan karşılanıyor, aynı anda tam dosya arka planda önbelleğe giriyor.
     - **Sonraki istekler:** Tarayıcı sesi parça parça istediğinde istenen bayt aralığı önbellekteki dosyadan kesilip veriliyor. "Son N bayt" ve dosya dışı istekler de doğru cevaplanıyor.
     - **Eski davranış:** Sesler kod gibi işlenip her seferinde ağdan isteniyordu ve parça cevapları önbelleğe girmiyordu; uçak modunda müzik çalmıyordu.
     - **Test:** Tarayıcı paneli servis çalışanı kaydına izin vermediği için denetim `tools/smoke.mjs`'e eklendi. `sw.js` sahte önbellek ve sahte ağla çalıştırılıyor: ilk istek, önbelleğe alma ve çevrimdışı parça, son N bayt, dosya dışı ve tam istekler. Eski servis çalışanıyla test başarısız oluyor, yenisiyle geçiyor.
     - **Sınır:** Bir parça uçak modunda çalabilmek için önce bir kez internetliyken çalınmış olmalı.
     - **Denenmedi:** Gerçek telefonda, özellikle iPhone Safari'de uçak modu.
8. [x] **Bölge sonu hikâye kartları.**
   - Her bölgenin sonunda yalnızca yazı ve mevcut görsellerle kısa bir sahne olur: köyün neden kurulduğu, Pofi'nin yolu.
   - Metinler köylü hikâyeleriyle bağlanır.
   - **Yapıldı (2026-11-08):** "Pofi'nin yolu" altı bölüm, metinler `STORY` ayarında (`js/config.js`). Her bölgenin son leveli (100, 250, 450, 650, 850, 1000) ilk kez bitince tanıtım kartlarıyla aynı düzende tek bir kart çıkar.
     - **Hikâye:** Pofi boş koya gelir, tepedeki fenerde eski bir harita bulur, ışıkları izleyip limana iner. Kaptan Mors haritayı büyükannesinin çizdiğini söyler, ormandan geçip zirveye köyüyle çıkar. Zirvedeki "şarkı" köyün sesidir. Bobo, Nana, Kiko, Tipi ve Kaptan Mors hikâyede geçer.
     - **Görünüm:** Kart bölgenin harita renklerini ve Pofi'nin kıyafetiyle çizimini kullanıyor, yeni görsel yok.
     - **Yeniden okuma:** Görevler ekranında okunmuş bölgenin rozetine dokununca bölüm yeniden açılıyor.
     - **Eski kayıtlar:** Geçilmiş bölümler okunmuş sayılıyor, art arda kart çıkmıyor; Görevler'den okunabiliyor.
     - **Not:** Metinler bir öneri. Sen ya da Mustafa değiştirmek isterseniz yalnızca `STORY` düzenlenir.
9. [x] **Gazete zenginleştirme.**
   - Haftanın sipariş sayısı, festival durumu, köylü dostlukları ve nadir balık gibi gerçek oyuncu verisinden haberler.
   - Bilmece havuzu genişletilir.
   - **Yapıldı (2026-11-08):**
     - **Yeni haber türleri:** Oyuncunun kendi verisinden yedi haber: teslim edilen sipariş sayısı, en yakın köylü dostu ve kalpleri, günlük bulmaca serisi, evcil dostun kaç kez beslendiği, "Pofi'nin yolu"ndaki sıradaki durak, kusursuz bitirilen level sayısı ve Kaptan Mors'tan yapılan alışveriş sayısı.
     - **Festival haberi:** Puan yokken "%0 hazır" yerine "festival başladı" diyor.
     - **Sayaç:** Teslim edilen siparişler için yeni sayaç `P.ach.orders`.
     - **Bilmeceler:** 16'dan 34'e çıktı, tekrar yok; artık 34 haftada bir başa dönüyor.
     - **Deneme:** Beş farklı haftada gazete açıldı, hata çıkmadı. Her sayı yine üç haber seçiyor.
10. [x] **Ayarlar'a "Nasıl oynanır" sayfası.**
    - Mekanikler mevcut karo görselleriyle anlatılır.
    - Her mekanik ilk göründüğü levelden sonra açılır.
    - **Yapıldı (2026-11-08):** Ayarlar > "Nasıl oynanır".
      - **Temel kurallar:** Kayma, yıldızlar, hamle sınırı ve yardım (geri al, ipucu, rota); level 15'ten sonra yan yollar da eklenir.
      - **Mekanikler:** Oyuncunun karşılaştığı mekanikler level sırasıyla, mekanik kartlarındaki (`INTRO`) metin ve karo simgesiyle listelenir.
      - **Sürpriz korunur:** Henüz gelmemiş mekanikler gösterilmez, yalnızca sıradakinin leveli yazar.
      - **Deneme:** Level 12'deki oyuncu 3/21, level 252'deki oyuncu 16/21 mekanik görüyor.

### Tur 2 (2026-11-08'de başladı)

**Sağlamlık**

1. [x] **Kayıt yedeği testi.**
   - Sipariş, festival, hikâye ve mağaza alanları kayda yeni eklendi. Yedekle ve geri yükle bunları kayıpsız taşımalı.
   - Duman testine yedek → geri yükleme denetimi eklenir; eksik alan çıkarsa düzeltilir.
   - **Yapıldı (2026-11-08):**
     - **Alanlar:** Yedek kaydın tamamını taşıyor, eksik alan yok. Yeni alanlar için ayrıca bir şey yapmak gerekmiyor.
     - **Bulunan hata:** Oyuncu adında `<` ya da `>` varsa (örneğin "<3 Ali") yedek kodu "geçersiz" sayılıyor, oyuncu kendi yedeğini yükleyemiyordu. Artık bu işaretler silinip kayıt yükleniyor. Oyuncu adı da köy ve evcil dost adları gibi girilirken temizleniyor.
     - **Kod:** Yedek kodlaması `js/backup.js` modülüne taşındı.
     - **Test:** Duman testi dolu bir kaydı (sipariş, festival, hikâye, evcil dost, Türkçe karakterli ve emojili ad) sıkıştırmalı ve sıkıştırmasız koda çevirip geri açıyor. Oyunun açılışından geçtikten sonra da her alanın aynı kaldığına bakıyor. Boşluklu yapıştırma, `<` içeren ad ve 6 bozuk kod da deneniyor.
     - **Tarayıcı:** Ayarlar > Kayıt yedeği penceresindeki kod geri açılınca kayıtla aynı; bozuk kod "Bu kod geçersiz" diyor.
2. [x] **Kare döngüsünü hataya dayanıklı yapmak.**
   - Bir karede çizim hatası olursa hata günlüğe yazılır, döngü sonraki karede devam eder; oyun donmaz.
   - Aynı hata her karede tekrar ederse günlük dolmaz (sayaç artar).
   - **Yapıldı (2026-11-08):**
     - **Döngü:** Her kare korumalı çiziliyor. Hata olursa sonraki kare yine istenir; eskiden tek hata bütün döngüyü durduruyordu.
     - **Kurtarma:** Hata olunca sahne tuvalleri sıfırlanıyor, yarıda kalan çizim durumu sonraki kareye taşınmıyor. Hata sürerse saniyede bir yeniden deneniyor.
     - **Günlük:** "Kare (ekran): mesaj" olarak tek satır yazılıyor. Aynı hata sürerse yeni satır açılmıyor, kare sayacı 5 sn'de bir topluca artıyor; her karede depolamaya yazılmıyor.
     - **Deneme:** Ana sayfada çizime kasıtlı hata verildi. 383 kare boyunca köy sahnesi çizilmeye devam etti, günlükte tek satır ("x295") oluştu, hata bitince Pofi yeniden çizildi.
     - **Not:** Çizim dışındaki hatalar (düğme tıklaması gibi) zaten döngüyü durdurmuyordu; onlar eskisi gibi günlüğe yazılıyor.
3. [x] **"Yeni sürüm hazır" bildirimi.**
   - Servis çalışanı yeni sürümü fark edince oyunda küçük bir "Yeni sürüm hazır · Yenile" şeridi çıkar.
   - Oyun sırasında araya girmez; ana sayfada ya da köyde gösterilir.
   - **Yapıldı (2026-11-08):**
     - **Nasıl fark ediliyor:** Sürüm dosyası ya da derleme adımı yok. Oyun açılıştan 8 sn sonra yüklediği kod dosyalarının (html, js, css, json) sunucudaki imzasını alıyor; bunun için HEAD isteği yapıyor, imza ETag ya da tarih ve boyut (`js/update.js`). Sonra uygulama öne gelince (en az 10 dk arayla) ve açık kaldıkça 30 dk'da bir yeniden bakıyor. Bir dosya değişmişse yeni sürüm var demektir. Ağ yoksa denetim sessizce atlanıyor.
     - **Şerit:** Yalnızca ana sayfada, cüzdanın altında, yan düğmelerin arasında çıkıyor: "Yeni sürüm · Yenile · ×". Köyde göstermekten vazgeçildi, çünkü köy ekranının üstündeki bölge adının üstüne biniyordu. Alt kısma koymak da denendi, orada Oyna düğmesini kapatıyordu.
     - **Düğmeler:** "Yenile" kaydı yazıp sayfayı yeniden yüklüyor; servis çalışanı kodu ağdan aldığı için yeni sürüm açılıyor. Çarpı şeridi bu oturum için gizliyor.
     - **Deneme:** Yerel sunucuda bir dosyanın tarihi değiştirildi. Şerit ana sayfada çıktı, köy ve mağazada gizlendi, ana sayfaya dönünce yine göründü. Çarpı gizledi, Yenile sayfayı yeniledi. Duman testi imzanın dosya değişince değiştiğini ve ağ yokken sessiz kaldığını sahte ağla deniyor.
     - **Denenmedi:** GitHub Pages'te gerçek yayın sonrası, yani ETag ile deneme. Bir sonraki gönderimden sonra telefonda açık kalan oyunda görülebilir.

**Oyuncu deneyimi**

4. [ ] **İlk yapıya yönlendirme.**
   - Hiç yapı kurulmamışken kar tanesi ilk yapıya yetince bir kez "İlk yapını kur" kartı çıkar ve köyde önerilen yapıyı gösterir.
   - Kart yalnızca bir kez gelir; diğer tanıtım kartlarıyla üst üste binmez.
5. [ ] **Ses düzeyi ayarları.**
   - Ayarlar'da müzik ve efekt için ayrı ses kaydırıcıları; açma/kapama anahtarları kalır.
   - Seviye kayıtta tutulur, jingle efekt seviyesine uyar.
6. [ ] **Erişilebilirlik ve klavye.**
   - Yalnızca ikonu olan düğmelere ekran okuyucu etiketi (`aria-label`) eklenir.
   - Masaüstü kısayolları: oklar ve WASD kaydırma (varsa korunur), Z geri al, R baştan, H ipucu, Esc pencere kapatma.
7. [ ] **Geniş ekran düzeni.**
   - 768 px (tablet) ve 1280 px (masaüstü) genişlikte bütün ana ekranlar ölçülür.
   - Düzen ortalanır, gereksiz uzayan ve bozulan yerler düzeltilir; telefon düzeni değişmez.

**Mustafa ve test**

8. [ ] **Gizli test paneli.**
   - Sürüm yazısına 7 kez dokununca açılır; normal oyuncu görmez.
   - Yalnızca levele atlama, saat ve gün değiştirme ve kaydı sıfırlama; coin ya da eşya ekleme yok.
9. [ ] **Mekanik başına oyun içi test.**
   - Her mekaniğin ilk levelini gerçek oyun arayüzünde çözüm hamleleriyle otomatik oynatan bir araç (`tools/`).
   - Kazanma, geri alma ve baştan alma hatasız olmalı; konsolda hata olmamalı.
10. [ ] **Metin denetimi.**
    - Bütün oyun yazıları taranır: yazım hataları, tutarsız kelimeler ("level" / "bölüm" gibi), büyük İ ve küçük ı hataları.
    - Düzeltmeler tek commit; anlamı değişen metin olursa not düşülür.

## Durum

Tur 1'in 10 maddesi bitti (2026-11-08). Tur 2 başladı; döngü işaretlenmemiş ilk maddeden devam ediyor.

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
- 2026-11-08 · `a617238` Çevrimdışı ses: müzik önbelleğe alınıyor, parça istekleri önbellekten; duman testine servis çalışanı denetimi eklendi.
- 2026-11-08 · `f5a75cd` Pofi'nin yolu: altı bölümlük bölge sonu hikâye kartları, Görevler'den yeniden okunur.
- 2026-11-08 · `a30c62d` Gazete: oyuncu verisinden 7 yeni haber türü, 34 bilmece.
- 2026-11-08 · `dd29944` Ayarlar'da "Nasıl oynanır": kurallar ve karşılaşılan mekanikler.
- 2026-11-08 · `5ba529f` Kayıt yedeği: duman testinde yedek denetimi, `<` içeren adlı yedek artık yükleniyor.
- 2026-11-08 · `f39322b` Kare döngüsü hataya dayanıklı: çizim hatası günlüğe yazılır, oyun donmaz.
- 2026-11-08 · `e6cf565` Yeni sürüm şeridi: yayına alınan sürüm fark edilince ana sayfada "Yenile".
