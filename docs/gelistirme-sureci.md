# Pofi: Buz Köyü · Geliştirme süreci

Bu belge oyunun geliştirme sırasını ve her turda izlenecek adımları tutar. Claude bu listeden sıradaki maddeyi alır, uygular, dener, yayına alır ve listeyi günceller. Senin kararını ya da ücretli bir işi gerektiren maddeler atlanır ve "Karar bekleyenler" bölümüne yazılır.

Durum: geliştirme aşaması, yayın daha uzakta. Mustafa müzikleri gönderiyor ve sonra oyun dengesini yapacak.

## Her turda

1. **Seç.** Aşağıdaki "Sıradaki işler" listesinden işaretlenmemiş ilk maddeyi al. Madde bir kural yüzünden yapılamıyorsa "Karar bekleyenler"e taşı ve bir sonrakine geç.
2. **Uygula.** Değişikliği küçük tut: bir madde bir commit olsun. Kod kalıbı aynı kalır: düz JS, derleme adımı yok.
3. **Dene.**
   - Bütün dosyalar için `node --check js/*.js` çalıştır ve `node tools/smoke.mjs` testini geçir (madde 1 ile gelir).
   - Tarayıcıda 375 px telefon boyutunda değişen ekranlara bak; konsolda hata olmamalı.
   - Oyun ekranı, tahta ya da mekanik değiştiyse `tools/oyun-testi.html` ile 21 mekanik leveli de oynat.
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

4. [x] **İlk yapıya yönlendirme.**
   - Hiç yapı kurulmamışken kar tanesi ilk yapıya yetince bir kez "İlk yapını kur" kartı çıkar ve köyde önerilen yapıyı gösterir.
   - Kart yalnızca bir kez gelir; diğer tanıtım kartlarıyla üst üste binmez.
   - **Yapıldı (2026-11-08):**
     - **Kart:** "Yeni" tanıtım kartlarına `firstBuild` eklendi, sırada ilk o. Bu yüzden diğer kartlarla aynı kuralla ekran başına tek kart çıkıyor ve bir kez gösteriliyor.
     - **Ne zaman:** Köyde hiç yapı yokken ve önerilen yapıya (en ucuz, kar tanesi yeten) yetecek kar tanesi olunca çıkıyor. İglo 1 kar tanesi olduğu için pratikte ilk kar tanesinden sonraki ana sayfa ya da köy ziyaretinde.
     - **Metin:** "Kar tanelerin yetiyor: İglo kurabilirsin! Yapılar köyünü büyütür ve kalıcı bonus verir…"
     - **Göster:** Köyün Yapılar sekmesini açıyor ve önerilen yapının panelini hazır getiriyor. Köye ilk girişte zaten çıkan "Köyüne bir isim ver" penceresi önce geliyor; kapanınca panel orada bekliyor.
     - **Deneme:** 3 kar tanesi, sıfır yapılı kayıtla ana sayfada kart çıktı. Göster → isim penceresi → Kaydet → İglo paneli → Kur: İglo kuruldu, kart bir daha çıkmıyor. Konsolda hata yok.
     - **Eski kayıtlar:** Zaten yapısı olan oyuncuda kart hiç çıkmaz.
5. [x] **Ses düzeyi ayarları.**
   - Ayarlar'da müzik ve efekt için ayrı ses kaydırıcıları; açma/kapama anahtarları kalır.
   - Seviye kayıtta tutulur, jingle efekt seviyesine uyar.
   - **Yapıldı (2026-11-08):**
     - **Ekran:** Ayarlar'da "Ses efektleri" ve "Müzik" anahtarlarının hemen altında birer düzey kaydırıcısı var (%0-100, 5'er adım), yanında yüzde yazıyor. Anahtar kapalıyken kaydırıcı soluk görünüyor.
     - **Kayıt:** Düzeyler `settings.sfxVol` ve `settings.musicVol` olarak tutuluyor, varsayılan 100. Eski kayıtlarda alan yoksa 100 sayılıyor.
     - **Davranış:**
       - Kaydırıcı sürüklenirken düzey anında uygulanıyor, bırakılınca kaydediliyor.
       - Efekt kaydırıcısı bırakılınca örnek bir ses çalıyor.
       - Efekt düzeyi kodla üretilen sesleri, level sonu jingle'ını ve ortam çanını ölçekliyor. %0'da jingle çalmaz, eski sese de düşmez.
       - Müzik düzeyi bütün parçalara ve jingle sırasındaki kısmaya uygulanıyor.
     - **Deneme:** Müzik %40'a çekilince parçanın düzeyi 0,55'ten 0,22'ye indi. Köye geçince yeni parça da 0,22 ile başladı. Müzik kapatılınca kaydırıcı soluklaştı ve parça durdu; açılınca kaldığı düzeyden devam etti. 375 px'te taşma yok.
     - **Sınır:** iPhone Safari müzik elemanının ses düzeyini değiştirmeye izin vermiyor, orada müzik kaydırıcısı etkisiz kalabilir; açma/kapama çalışır. Efekt kaydırıcısı Web Audio ile çalıştığı için iPhone'da da etkili. Gerçek telefonda denenmedi.
6. [x] **Erişilebilirlik ve klavye.**
   - Yalnızca ikonu olan düğmelere ekran okuyucu etiketi (`aria-label`) eklenir.
   - Masaüstü kısayolları: oklar ve WASD kaydırma (varsa korunur), Z geri al, R baştan, H ipucu, Esc pencere kapatma.
   - **Yapıldı (2026-11-08):**
     - **Tarama:** Ana sayfa, harita, oyun, köy (üç sekme ve yapı paneli), mağaza, gardırop ve ayarlar oyun içinde tarandı. İkon setine geçerken araç çubuğu ve geri düğmesi zaten etiketlenmişti.
     - **Eksikler:**
       - Haritadaki iki sandık düğmesi etiketsizdi.
       - Fiyat düğmelerindeki coin, kar tanesi ve ipucu simgeleri okunmuyordu; düğme yalnızca "120" diye okunuyordu.
       - Köylü listesindeki dostluk düğmesinde yalnızca kalp işaretleri vardı.
     - **Düzeltmeler:**
       - Fiyat simgeleri artık "coin 120" diye okunuyor, cüzdan da öyle.
       - Çizilmiş ikonlar yanlarındaki yazının süsü sayılıp ekran okuyucudan gizlendi.
       - Dostluk düğmesi "Bobo ile dostluk: 2/3 kalp" diye okunuyor.
       - Duman testi artık `index.html` ve `main.js` şablonlarında yazısız ve etiketsiz düğme arıyor.
     - **Klavye:** Oklar ve WASD kaydırma ile Z/Backspace geri alma zaten vardı. Yeni kısayollar:
       - **R:** Baştan başlatır.
       - **H:** İpucu verir.
       - **Esc:** Açık penceredeki Kapat/Sonra/Vazgeç düğmesine basar ya da yapı panelini kapatır.
       - Pencere açıkken ve yazı kutusunda yazarken oyun tuşları artık çalışmıyor. Eskiden pencere açıkken oklar Pofi'yi arkada kaydırabiliyordu.
     - **Deneme:** Oyunda sağ/aşağı ile 2 hamle yapıldı. Z geri aldı, R sıfırladı, H bir ipucu harcadı. Pencere açıkken oklar, R ve Z işlemedi; Esc pencereyi ve yapı panelini kapattı; kapanınca oklar yeniden çalıştı. Mağazadaki fiyat düğmesi "coin 50" diye okunuyor.
     - **Denenmedi:** Gerçek ekran okuyucuyla (TalkBack, VoiceOver) dinleme. Harita ve köy sahnesi tuval olduğu için oradaki level ve yapı seçimleri ekran okuyucuyla yapılamıyor; bu ancak ayrı bir liste görünümüyle çözülür.
7. [x] **Geniş ekran düzeni.**
   - 768 px (tablet) ve 1280 px (masaüstü) genişlikte bütün ana ekranlar ölçülür.
   - Düzen ortalanır, gereksiz uzayan ve bozulan yerler düzeltilir; telefon düzeni değişmez.
   - **Yapıldı (2026-11-08):**
     - **Durum:** Oyun zaten 480 px'lik ortalanmış bir sütun. Pencere, yapı paneli, bildirim ve yeni sürüm şeridi de bu sütunun içinde; ekrana sabitlenmiş öğe yok.
     - **Ölçüm:** 768×1024 (tablet dikey) ve 1280×720 (dizüstü) boyutlarında 8 ekran tarandı: ana sayfa, harita, oyun, köy, mağaza, gardırop, ayarlar, görevler. Hiçbir öğe sütun dışına taşmıyor, yatay kaydırma yok, konsolda hata yok. Tablette oyun tahtası 480×774 ile düzgün; 720 yükseklikte köy ekranı kısa bir telefondaki kadar sıkışık.
     - **Düzeltmeler:** Geniş ekranda sütunun kenarına hafif gölge eklendi, eskiden arka planla birleşiyordu. Fareli cihazlarda kaydırma çubukları ince ve ahşap renginde. 375 px telefonda gölge yok, ekranlar yeniden tarandı, değişiklik yok.
     - **Sonraya not:** Masaüstünde iki yan boş kalıyor. İstenirse ileride bu boşluğa köy manzarası gibi bir arka plan görseli konabilir; bu ücretli görsel gerektirir.

**Mustafa ve test**

8. [x] **Gizli test paneli.**
   - Sürüm yazısına 7 kez dokununca açılır; normal oyuncu görmez.
   - Yalnızca levele atlama, saat ve gün değiştirme ve kaydı sıfırlama; coin ya da eşya ekleme yok.
   - **Yapıldı (2026-11-08):**
     - **Açma:** Ayarlar'ın en altındaki "Pofi: Buz Köyü v0.1.0" yazısına 3 sn içinde 7 dokunuş. Son 3 dokunuşta "Test paneli: 3/2/1 dokunuş daha" çıkıyor.
     - **Level:** Numara yazılır.
       - "Oyna" o leveli açar, ilerlemeyi değiştirmez (`?oyna=` adresiyle aynı).
       - "İlerlemeyi buraya taşı" açık leveli değiştirir; yıldızlar kalır.
     - **Oyunun saati:** +1 saat, +6 saat, +1 gün, +7 gün ve "Gerçek saate dön".
       - Kayma `js/clock.js` ile oyunun her yerinde geçerli: günlük ödül, sipariş, festival, tüccar, gece/gündüz, kakao ve iskele birikimi.
       - Kayma yalnızca bu cihazda tutulur (`pofi.dev.v1`) ve değişince oyun yenilenir.
       - Kayma açıkken Ayarlar'da kırmızı "Test saati: +1 gün" yazısı çıkıyor, hata kaydına da ekleniyor.
     - **Kayıt:** "Kaydı sıfırla…" mevcut onaylı sıfırlama penceresini açıyor.
     - **Bilerek yok:** Coin, kar tanesi, ipucu ya da eşya ekleme. Panel her oyuncunun kodunda durduğu için hile kapısı olmasın.
     - **Deneme:** 7 dokunuşta panel açıldı. "Oyna 250" level 250'yi açtı, ilerleme 60'ta kaldı. "Taşı 120" ilerlemeyi 120 yaptı. "+1 gün" oyunu yeniledi, saat 24 saat ileri gitti, oyun ertesi günün günlük ödülünü verdi. "Gerçek saate dön" kaymayı sıfırladı. Duman testi kaymanın uygulandığını, verilen tarihleri bozmadığını ve kayma yokken saate dokunulmadığını deniyor.
     - **Mustafa için:** Saati ileri almak, günlük ödül, sipariş ve festival dengesini günlerce beklemeden görmeyi sağlar. Bitince "Gerçek saate dön" demeyi unutmamalı; kayma ilerideyken alınan günlük ödüller gerçek tarihe dönünce yeniden alınamayabilir.
9. [x] **Mekanik başına oyun içi test.**
   - Her mekaniğin ilk levelini gerçek oyun arayüzünde çözüm hamleleriyle otomatik oynatan bir araç (`tools/`).
   - Kazanma, geri alma ve baştan alma hatasız olmalı; konsolda hata olmamalı.
   - **Yapıldı (2026-11-08):** `tools/oyun-testi.html`.
     - **Açma:** Yerel sunucuda `http://localhost:5174/tools/oyun-testi.html` → "Başlat".
     - **Ne yapıyor:** Her mekaniğin ilk levelini (21 level) gerçek oyunda test kaydıyla açıyor ve çözüm hamlelerini klavyeyle oynuyor.
     - **Denetimler:** Geri al (Z), baştan (R), çözümle kazanma, 3 yıldız, konsol ve hata günlüğü.
     - **Seçenekler:** İstenen leveller yazılabilir. Test bitince bu cihazdaki kayıt geri konuyor. Yaklaşık 7 dk sürüyor.
     - **Sonuç:** 21/21 level geçti. Pipi'li level 500'de Pipi hamleleri de oynandı.
     - **Bulunan hata:** Mekanik kartı ("YENİ · Kaydır!") level kazanılana kadar her başlatışta açılıyordu: baştan alınca, "tekrar dene"de, hamle bitince. Artık kart oturum başına bir kez çıkıyor; oyun kapanıp açılırsa ve level hâlâ kazanılmadıysa bir kez daha hatırlatıyor.
     - **Eksik kapandı:** Pipi'li levellerde penguen yalnızca dokunarak seçiliyordu. Artık Q ya da boşluk tuşuyla da seçiliyor (klavye maddesinin devamı).
     - **Not:** Araç her turda değil, mekanik ya da oyun ekranı değiştiğinde çalıştırılmalı. Duman testi her turda çalışmaya devam ediyor.
10. [x] **Metin denetimi.**
    - Bütün oyun yazıları taranır: yazım hataları, tutarsız kelimeler ("level" / "bölüm" gibi), büyük İ ve küçük ı hataları.
    - Düzeltmeler tek commit; anlamı değişen metin olursa not düşülür.
    - **Yapıldı (2026-11-08):**
      - **Kapsam:** Kod ve sayfadaki 558 metin ile ayar dosyasındaki 493 metin okundu: hikâye, bilmeceler, mekanik kartları, köylü sözleri, etkinlikler, eşya adları.
      - **Sayı ekleri (en çok hata):** 14 yerde ek sayıdan bağımsız sabit yazılmıştı. Bu yüzden "Köy Lv7'te açılır", "Lv2'e yükselt", "Level 6'i bitir" gibi yanlışlar çıkıyordu. Yeni `ek()` yardımcısı (`js/tr.js`) eki sayının okunuşuna göre seçiyor: "Lv7'de", "Lv2'ye", "6'yı", "40'tan".
      - **Büyük harf:** Harita penceresinde bölge adı "FENER TEPESI" çıkıyordu, artık "TEPESİ". Elle yazılmış büyük başlıkların hepsi zaten doğruydu.
      - **Yazım ve terimler:**
        - "Kar topu" → "Kartopu" (mekanik ve etkinlik adları, "Kartopu kalesi" ile aynı).
        - "Balık / Yıldız / Fener / Lale şapka" → "… şapkası".
        - "halde" → "hâlde".
        - "Kaşif" → "Kâşif".
        - "level'i" → "leveli".
        - Yapı panelindeki İngilizce "buff" → "bonus".
      - **Anlamı değişen iki metin:**
        - Balina Göçü etkinliği: "Salla suları aş." → "Sallarla suları aş." ("salla" fiil gibi okunuyordu).
        - Dünya Penguen Günü: "25 Nisan ve 23 Nisan Çocuk Şenliği." → "23 Nisan Çocuk Bayramı ve 25 Nisan Dünya Penguen Günü."
      - **Tutarlı olanlar:** Bulmacalar her yerde "level", köy ve yapılar "seviye/Lv", hikâye "bölüm". Karışma yok.
      - **Duman testi:** Bundan sonra `ek()` kurallarını, sayıdan sonra sabit ek yazılmasını ve Türkçe olmayan büyük/küçük harf çevirisini yakalıyor.
      - **Deneme:** Köy ekranında kilitli yapılar "Köy Lv3'te / Lv5'te / Lv7'de açılır", yükseltme "Lv2'ye yükselt", ana sayfa "Level 5'ten sonra" diyor. Konsolda hata yok.

### Tur 3 (2026-11-08'de başladı)

**Oyuncuyu kaybettirmeyecek işler**

1. [x] **Yarım kalan levele dönüş.**
   - Önce mevcut davranışa bakılır: level ortasında uygulama kapanınca ya da arka plana gidince ne oluyor?
   - Oyuncu geri dönünce level kaldığı hamleden sürer (tahta, hamle sayısı, geri al geçmişi). Level kazanılınca ya da çıkılınca bu durum silinir.
   - **Yapıldı (2026-11-08):**
     - **Eski davranış:** Yarım level hiç saklanmıyordu. Uygulama kapanınca ya da telefon sayfayı bellekten atınca level baştan başlıyordu.
     - **Yeni davranış:**
       - Her hamlede o levelde yapılan hamlelerin listesi ayrı bir anahtarda tutuluyor (`pofi.run.v1`); oyun kaydının biçimi değişmedi.
       - Aynı level yeniden açılınca hamleler motorda yeniden oynatılıyor; tahta, hamle sayısı ve geri al geçmişi geri geliyor. Ekranda "Kaldığın yerden devam · 3 hamle" yazıyor.
       - Hamle sınırı, kullanılan ipucu ve ek hamleler de korunuyor; nadir balık aynı kalıyor.
     - **Silinme:** Kazanınca, kaybedince, baştan alınca, levelden geri çıkınca ve kayıt sıfırlanınca. Level verisi güncellenip hamleler geçersiz kalırsa level sessizce baştan başlıyor.
     - **Kapsam:** Normal leveller, günlük bulmaca (aynı gün), etkinlik levelleri (aynı hafta), yan yollar ve usta levelleri. İstatistikte devam edilen level yeni deneme sayılmıyor.
     - **Deneme:**
       - Level 37'de 3 hamle yapıldı, oyun kapatılıp açıldı: level 3. hamleden sürdü.
       - Geri al çalıştı, level 3 yıldızla bitti ve kayıt silindi.
       - Geri çıkınca ve baştan alınca kayıt silindi.
       - Pipi'li level 500'ün devam etmesi oyun içi testte de geçti.
     - **Araç:** `tools/oyun-testi.html` her levelden önce yarım level kaydını temizliyor; ilk denemede kalmış bir kayıt yüzünden test yanlış alarm vermişti.
2. [x] **Kayıt güvenliği.**
   - Kayıt yazılamazsa (depolama dolu, gizli sekme) oyuncuya bir kez küçük bir uyarı çıkar.
   - Son sağlam kaydın yedek kopyası tutulur; ana kayıt bozuksa oyun o kopyadan açılır. Duman testi bunu dener.
   - **Yapıldı (2026-11-08):**
     - **Eski davranış:** Kayıt yazılamazsa hata sessizce yutuluyordu. Ana kayıt bozuksa oyun sıfır kayıtla açılıyor ve ilk kayıtta eski ilerlemenin üstüne yazıyordu; bu, ilerlemenin tamamen kaybı demekti.
     - **Yedek:** Her kayıtta (en çok 30 sn'de bir) son sağlam kaydın kopyası `pofi.v1.bak` anahtarına yazılıyor. Kopya alınmadan önce kaydın sağlam olduğuna bakılıyor: level, coin, yıldızlar ve köy.
     - **Bozuk kayıt:**
       - Ana kayıt okunamazsa ya da kullanılamazsa oyun yedekten açılıyor ve "Kayıt okunamadı; son yedekten açıldı." diyor.
       - Bozuk kayıt silinmiyor, `pofi.v1.broken` anahtarına taşınıyor; hata kaydına da yazılıyor.
       - Yedek de yoksa yeni kayıtla açılıyor ve oyuncu Hata kaydı'ndan bildirmeye yönlendiriliyor.
     - **Yazılamayan kayıt:** Depolama dolu, gizli sekme ya da izin yoksa bir kez "Kayıt yapılamıyor…" uyarısı çıkıyor ve durum hata kaydına düşüyor. Depolama düzelince kayıt yine yazılıyor.
     - **Sıfırlama:** "İlerlemeyi sıfırla" yedeği de siliyor.
     - **Deneme:**
       - Duman testi yedek alma, yarım yazılmış kayıt, okunan ama kullanılamayan kayıt, yedeksiz bozuk kayıt, iki kez yazılamama (tek uyarı), düzelme ve sıfırlamayı deniyor.
       - Tarayıcıda yarım yazılmış kayıt ve sağlam bir yedekle açılış denendi: oyun level 77 ve 4321 coin ile açıldı, uyarı çıktı, bozuk kayıt kenara alındı.
     - **Araç:** `tools/oyun-testi.html` test bitince yedek kopyayı da eski hâline getiriyor; test kaydı yedeğe geçmiyor.
3. [x] **İnternetsiz ilk açılış.**
   - Servis çalışanı kurulurken temel dosyaları (html, js, css, level verisi, ilk ekranların görselleri) önceden indirir.
   - Oyun bir kez açıldıktan sonra uçak modunda baştan açılabilir; duman testi sahte ağla dener.
   - **Yapıldı (2026-11-08):**
     - **Eski davranış:** Yalnızca ziyaret edilmiş dosyalar önbellekteydi. Örneğin köye hiç girilmediyse uçak modunda köy görselleri yoktu.
     - **Kurulumda indirilenler:** 28 kod ve veri dosyası (sayfa, stil, 21 modül, 3 level dosyası, manifest) ve 68 görsel (arayüz ikonları, açılışta yüklenen karolar ve Pofi, logo, uygulama ikonları). Toplam yaklaşık 2,6 MB.
       - Bir dosya alınamazsa kurulum durmuyor; o dosya ilk kullanıldığında yine önbelleğe giriyor.
       - Müzik ve yapı görselleri eskisi gibi ilk kullanımda önbelleğe giriyor.
     - **Liste denetimi:** Liste `sw.js` içinde elle tutuluyor. Duman testi her `js/` ve `data/` dosyasının, CSS görsellerinin ve `art.js` açılış görsellerinin listede olduğunu, listedeki her dosyanın diskte durduğunu denetliyor. Yeni modül eklenip listeye yazılmazsa test kırılır.
     - **Deneme:** Duman testinde servis çalışanı sahte ağla kuruldu, ağ kesildi; sayfa, `index.html`, modüller, level verisi, stil ve görsel önbellekten geldi.
     - **Denenmedi:** Gerçek telefonda uçak modunda baştan açılış. Tarayıcı paneli servis çalışanı kaydetmiyor.

**Senin istediklerin (2026-11-08, öncelikli)**

- [x] **A. Evcil dostların kendi uyku yeri.** Evcil dostlar (ve yatakları) köyde aynı yerde üst üste uyuyor; her birinin kendi uyuma alanı olsun.
  - **Yapıldı (2026-11-08, `61d3c99`):**
    - Ana dost eskisi gibi iglonun önündeki yatağında uyuyor.
    - Diğer dostlar eskiden onun iki yanına yığılıp iglonun ve etkinlik çadırının arkasında kayboluyordu. Artık her birinin kendi yeri var: baykuş çam ağacının dalına tünüyor; tilki ya da tavşan kulübe ile buz pisti arasında, ikincisi kale ile kardan adam arasında kendi yatağında uyuyor. Yatak kademesi ana dostunkiyle aynı.
    - Gece görüntüsünde üç dost ayrı ayrı görünüyor; ana dost baykuşken de denendi.
- [x] **B. Kazanma sesi yorucu.** Level kazanma müziği art arda çalınca yoruyor. Seçenekler: kısaltmak, her levelde değil arada bir tam çalmak, kısa bir "ding" ile değiştirmek.
  - **Yapıldı (2026-11-08, `e4f4625`):** Tam kazanma müziği (5 sn) en çok 4 dakikada bir çalıyor (`MUSIC.jingleGapSec: 240`). Arada kazanılan levellerde kısa zafer sesi çıkıyor. İlk kazanma ve moladan sonraki kazanma yine tam müzikle.
  - **Denenmedi:** Tarayıcı paneli dokunmadan ses açmadığı için kulakla dinlenmedi.
- [x] **C. Köy yerleşimi (küçük düzeltmeler; geniş görsel karar bekliyor).**
  - Yapılar iç içe duruyor; örneğin etkinlik foku buz pateninin arkasında kalıyor.
  - Alanlar daha geniş kullanılsın, bölgelerin ne olduğu belli olsun.
  - Oyundaki etkinlikler de köyde görünsün.
  - **Senin kararın (2026-11-08):** Şimdi kodla küçük düzeltmeler yapılacak, sonra görsel oturumunda Buzul Koyu'nu genişleten yeni arka plan hazırlanacak (maliyet önce gösterilecek).
  - **Yapıldı (`dea8582`):**
    - **Yapı boyutu:** Yapılar yaklaşık %9 küçültüldü (`SCALE`), aralarında boşluk açıldı.
    - **Etkinlik çadırı ve konuk fok:** Artık buz pistinin arkasında değil. Liman açıksa limanda kafe ile balık pazarı arasındaki boş kara geçiyorlar; liman kapalı ama buz pisti kuruluysa pistin sağındaki köşeye.
    - **Bayrak dizisi:** Etkinliğin renkli bayrakları eskiden iglonun ve kalenin ortasını kesiyordu; artık çadırın üstüne asılı.
    - **Festival:** Aylık festival köyde görünüyor; gözlemevi ile iglo arasında fener dizisine tema renginde, festivalin adı yazılı bir pankart asılı. Pankartın altındaki şerit festival puanıyla doluyor.
    - **Bölge etiketi:** Köyün sol üstünde "Bölge 2 · Buzul Koyu" yazıyordu; buradaki "Bölge 2" yapı seviyesi sınırıydı, arazi sanılıyordu. Artık "Buzul Koyu · 1/2", "Buz Limanı · 2/2".
    - **Süs yeri b3:** Köşedeki çadırla çakışmasın diye biraz sola alındı.
  - **Kalan:** Buzul Koyu'nda 12 yapı tek ekranda duruyor; asıl çözüm geniş arka plan, "Karar bekleyenler"de.

**Hız ve cihazlar**

4. [x] **Yükleme boyutu.**
   - İlk açılışta indirilen toplam boyut ve dosya sayısı ölçülür.
   - Hemen gerekmeyen müzik ve görseller gerektiğinde yüklenir; sonuç belgeye yazılır.
   - **Yapıldı (2026-11-08, `fa9fa8e`):**
     - **Ölçüm:** Sıfır kayıtla giriş ekranına kadar indirilenler ölçüldü.
       - Önce: 2,4 MB ham, 58 dosya. En büyükleri kuzey ışıkları katmanı (857 KB), `main.js` (240 KB), köy zemini (189 KB), level verisi (177 KB) ve logo (84 KB).
       - Müzik açılışta hiç inmiyor; ilk dokunuşta çalan parça akışla geliyor.
     - **Değişenler:**
       - Kuzey ışıkları katmanı köy Lv5'ten önce hiç görünmediği hâlde herkese açılışta iniyordu. Artık köy Lv5'e gelince isteniyor. Dosya 1152×768'e indirilip sıkıştırıldı: 857 → 311 KB; gece sahnesinde görünüm aynı.
       - Logo ekranda en çok 330 px görünüyor: 1254 → 768 px, 84 → 32 KB.
       - Askıdaki güçlendiricilerin (kazma, kürek, düdük) görselleri artık ikon setinden geldiği için açılış listesinden çıktı (30 KB).
       - Bu üçü servis çalışanının önceden indirme listesinden de çıktı.
     - **Sonuç:** Açılış 2,4 → 1,5 MB ham. Kod ve veri (903 KB) GitHub Pages'te sıkıştırılmış gelir (~258 KB), bu yüzden telefona gerçekten inen yaklaşık 0,85 MB: 548 KB görsel, 258 KB kod ve veri, gerisi yazı tipi.
     - **Sonraya not:** En büyük kalan kalemler köy zemini (189 KB, ilk ekranda görünüyor) ve level verisi (sıkıştırılmış ~40 KB). Bunlar için şimdilik gerek yok.
5. [x] **iPhone'da müzik düzeyi.**
   - iPhone Safari müzik elemanının ses düzeyini değiştirmeye izin vermiyor. Müzik Web Audio üzerinden çalınır, düzey kaydırıcısı orada da çalışır.
   - Yumuşak geçiş, reklamda susma ve jingle kısma aynı kalır.
   - **Yapıldı (2026-11-08, `b13d052`):**
     - **Nasıl:** Müzik ve kazanma müziği elemanları ilk dokunuştan sonra Web Audio'ya bağlanıyor; düzey elemanın kendi kazanç düğümünden ayarlanıyor.
       - Bağlantı yalnızca ses bağlamı açıkken kuruluyor; askıdaki bağlama bağlanan müzik susardı.
       - Bağlanamayan eski tarayıcılarda eski yol (`volume`) kullanılıyor.
     - **Bulunan hata:** Ekran geçişinde iki parça üst üste çalabiliyordu. Bu eski kodda da vardı.
       - Sebep: tek ortak geçiş zamanlayıcısı vardı ve `play()` sözü geç dönüyordu. Eski parça kısılırken yeni dokunuş ya da geç gelen "sesi aç" komutu kısmayı iptal ediyor, eski parça yenisinin altında çalmaya devam ediyordu.
       - Düzeltme: her parçanın kendi zamanlayıcısı var, geç gelen ses açma artık geçersiz parçaya uygulanmıyor.
     - **Deneme (tarayıcıda gerçek tıklamayla):**
       - Ana sayfa → köy → ana sayfa → köy → ayarlar geçişlerinde her an tek parça çaldı, hepsi Web Audio'ya bağlıydı.
       - Kaydırıcı %30'da düzey 0,17 oldu (0,55 × 0,3).
       - Level kazanılınca kazanma müziği 0,80'de çaldı, oyun müziği 0,11'e kısıldı ve bitince 0,55'e döndü.
     - **Denenmedi:** Gerçek iPhone. Web Audio bağlantısı iOS 14.5 ve sonrasında çalışır; daha eski sürümde eski yola düşer.
6. [x] **Uzun oturum denetimi.**
   - Oyun hızlandırılmış olarak 30 dakikalık ekran geçişleri ve levellerle oynatılır.
   - Bellek, DOM düğüm sayısı, zamanlayıcı ve dinleyici birikmesi ve hatalar ölçülür; sızıntı varsa düzeltilir.
   - **Yapıldı (2026-11-08, `80a5c19`):**
     - **Düzenek:** Zengin bir test kaydıyla 22 tur oynatıldı (yaklaşık 220 sn yoğun oyun; gerçek oyunda yarım saatten fazla ekran geçişine denk). Her turda ana sayfa, köy, mağaza, gardırop, ayarlar, görevler, harita ve gazete açıldı, köyde 4 kart açıldı ve bir level kazanıldı. Ses gerçek tıklamayla açıktı.
     - **Bulunan sızıntı (müzik elemanları):** Her ekran değişiminde yeni bir müzik elemanı açılıyordu; tek turda 9 oldu. Web Audio'ya bağlanan elemanlar ses grafiğinde kaldığı için bellekten de silinmiyordu, uzun oturumda birikip belleği şişirirdi. Artık her parça için tek eleman var ve aynı parçaya dönünce kaldığı yerden sürüyor. 20 tur boyunca 4 elemanda sabit kaldı (menü, köy, oyun, kazanma).
     - **Bulunan hata:** Evcil dostun adı kayıtta yoksa köy ekranı ve gazete hata veriyordu. Normal oyunda ad hep yazılıyor; eksik ya da bozuk kayıt için türün varsayılan adı kullanılıyor (Pamuk, Ponpon, Puhu).
     - **Ölçümler (0 → 20 tur):** Sayfa öğeleri 1127'de, bellek 9,1-9,6 MB'ta, zamanlayıcılar 1-3'te, çalan parça 1'de sabit (geçiş anında 2). Hata yok.
     - **Olay dinleyicileri:** Turda 10 artıyor, ama hepsi listeler yeniden çizilince yerine yenisi konan düğmelerde. Eski düğmeler sayfadan çıkınca dinleyicileriyle birlikte siliniyor; pencere ya da belgeye biriken dinleyici yok.
     - **Denenmedi:** Gerçek telefonda saatlerce açık kalma (pil ve ısınma).

**Erişilebilirlik ve akış**

7. [x] **Renk körlüğü denetimi.**
   - Mekanik karoları (plaka ve kapılar, numaralı balıklar, kilitler, oklar) üç renk körlüğü taklidiyle incelenir.
   - Yalnızca renkle ayrılan yerlere şekil ya da işaret eklenir; yeni görsel üretilmez.
   - **Yapıldı (2026-11-08, `09c7e32`):**
     - **Yöntem:** 31 karo ve nesne (açık/kapalı, basılı/boş durumlarıyla) oyunun kendi çizim koduyla bir tabloya çizildi. Tablo normal, kırmızı körlüğü (protanopi), yeşil körlüğü (döteranopi) ve mavi-sarı körlüğü (tritanopi) renk süzgeçlerinden geçirildi.
     - **Bulunan 1, kol kapısı ve plaka kapısı:** İki kapı türü yalnızca renkle ayrılıyordu (mavi ve yeşil). Kırmızı-yeşil körlüğünde ikisi aynı gri-mor tona düşüyor, hangisinin kolla hangisinin plakayla açıldığı anlaşılmıyordu. Plaka kapısının köşesine küçük yuvarlak bir plaka rozeti eklendi; kapı açıkken soluk.
     - **Bulunan 2, kasa hedefi:** Kasa oturunca hedef çerçevesi yalnızca kırmızıdan yeşile dönüyordu. Artık boşken kesik ve kayan, oturunca düz ve durgun çizgi.
     - **Sorunsuz olanlar:**
       - Kolun açık/kapalı hâli kolun yatış yönünden de anlaşılıyor.
       - Basılı plaka parlak, eriyen karın altında su birikintisi var.
       - Kırılgan kaya daha açık tonda ve çatlayınca şekli değişiyor.
       - Anahtar balığın anahtar halkası var, sıralı balıklarda numara var.
       - Ok, rampa, tabla ve bayrağın yönü şekille gösteriliyor.
     - **Not:** Yeni görsel üretilmedi; rozet ve çizgi kodla çiziliyor.
8. [x] **Hareketi azalt seçeneği.** (2026-11-08, `4652b43`: Ayarlar anahtarı, cihaz ayarına da uyar; parçacıklar 1/4, konfeti ve havai fişek yok, kar seyrek, CSS animasyonları anında biter. Tarayıcıda görsel olarak denenmedi, yalnızca duman testi.)
   - Ayarlar'a anahtar eklenir; telefonun "hareketi azalt" ayarına da uyar.
   - Açıkken sallanma, zıplama, ekran sarsıntısı ve parçacıklar sadeleşir; oyunun anlaşılması bozulmaz.
9. [ ] **Köye ilk giriş akışı.**
   - "Köyüne bir isim ver" sorusu ilk yapı kurulduktan sonraya ertelenir; yeni oyuncu ilk girişte iki pencereyi art arda görmez.

**Test**

10. [ ] **Oyun içi testi genişletmek.**
    - `tools/oyun-testi.html` yan yolları, usta levellerini, günlük bulmacayı ve etkinlik levellerini de oynar.
    - Her türde kazanma, ödül ekranı ve haritaya dönüş denetlenir.

## Durum

Tur 1 ve Tur 2'nin 10'ar maddesi bitti (2026-11-08). Tur 3 başladı; döngü işaretlenmemiş ilk maddeden devam ediyor.

## Karar bekleyenler

- **Buzul Koyu geniş zemin görseli (görsel oturumu, senin onayınla).** Kararın: küçük düzeltmeler yapıldı, geniş görsel görsel oturumunda maliyeti gösterilerek hazırlanacak. Görsel oturumu için şartname:
  - **Görsel:** Buzul Koyu zemini, 2 ekran genişliğinde (2048×1024, 2:1); mevcut `bg_village_pano` üslubunda. Tek görsel en çok 3072×1024 olabildiği için liman ve orman panoraması ayrı kalır; sağ kenarı Buz Limanı'nın sol kenarına dikişsiz bağlanmalı.
  - **Yerleşim (çizim kroki olarak verilir, stil görseli yanına konmaz):** 12 yapı yeri üç mahallede:
    - **Meydan:** iglo, kakao standı, fener dizisi, gözlemevi.
    - **Eğlence:** buz pisti, kızak tepesi, kartopu kalesi, kardan adam.
    - **Kıyı:** iskele, balıkçı kulübesi, deniz feneri, çam ağacı.
    - Ayrıca boş bir **etkinlik meydanı** (çadır, konuk fok, festival pankartı) ve evcil dostlar için ayrı uyku köşeleri.
  - **Yol:** Ana yol üç mahalleyi birleştirir, her yapı yerine patika ayrılır, sol altta deniz kıyısı kalır.
  - **Kod tarafı (görsel gelince bu oturum):** Birinci arazi iki ekran genişliğine çıkar; `AT` yerleri, ana yol (`PROMENADE`), süs yerleri, çadır ve uyku yerleri yeni krokiye göre güncellenir; mahalle adları köyde küçük tabelalarla gösterilir.
  - **Maliyet (tahmini):** Benzer geniş zeminler deneme başına yaklaşık $0,03 tuttu; görsel oturumu kesin maliyeti gösterip onay alır.

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
- 2026-11-08 · `17a6562` İlk yapı kartı: kar tanesi yetince bir kez "İlk yapını kur", önerilen yapının paneline götürür.
- 2026-11-08 · `e6438e9` Ses düzeyi ayarları: müzik ve efekt için ayrı kaydırıcı.
- 2026-11-08 · `483e38b` Erişilebilirlik ve klavye: okunur fiyatlar, etiketler, R/H/Esc kısayolları.
- 2026-11-08 · `eb6fc2f` Geniş ekran: tablet ve masaüstünde taşma yok; sütun gölgesi, ince kaydırma çubukları.
- 2026-11-08 · `13367e5` Gizli test paneli: levele git, ilerlemeyi taşı, oyunun saatini ileri al, kaydı sıfırla.
- 2026-11-08 · `6042119` Oyun içi mekanik testi (21/21 geçti); baştan alınca mekanik kartı yeniden açılmıyor; Q ile Pipi seçimi.
- 2026-11-08 · `e0dd51e` Metin denetimi: sayıya göre ekler (`js/tr.js`), Türkçe büyük harf, yazım düzeltmeleri.
- 2026-11-08 · `676ca70` Yarım kalan level: kaldığı hamleden sürer.
- 2026-11-08 · `8986d42` Kayıt güvenliği: yedek kopya, bozuk kayıt yedekten açılır, yazılamazsa uyarı.
- 2026-11-08 · `7626295` İnternetsiz ilk açılış: kurulumda kod, veri ve ilk ekran görselleri önceden indirilir.
- 2026-11-08 · `61d3c99` Evcil dostların kendi uyku yerleri.
- 2026-11-08 · `e4f4625` Kazanma müziği seyrek: tam hâli en çok 4 dakikada bir.
- 2026-11-08 · `dea8582` Köy düzeni küçük düzeltmeler: etkinlik çadırı görünür, festival pankartı, bölge etiketi, yapılar biraz küçük.
- 2026-11-08 · `fa9fa8e` Yükleme boyutu: açılış 2,4 → 1,5 MB ham (~0,85 MB sıkıştırılmış).
- 2026-11-08 · `b13d052` Müzik Web Audio üzerinden (iPhone düzey kaydırıcısı); iki parçanın üst üste çalması düzeltildi.
- 2026-11-08 · `80a5c19` Uzun oturum: müzik elemanı birikmesi giderildi, adı eksik evcil dost hatası; 20 turda bellek sabit.
- 2026-11-08 · `09c7e32` Renk körlüğü: plaka kapısı rozeti, kasa hedefi düz çizgi.
- 2026-11-08 · `4652b43` Hareketi azalt seçeneği.
