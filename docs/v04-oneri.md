# Pofi v0.4 planı: grid büyümesi, yeni mekanikler, yıllık etkinlikler, engel görselleri

**Kararlar (3 Kasım 2026):**
- Etkinlikler: "Etkinlik" ekranı (yol, 15 temalı level, dükkân) ve haftalık temalı jeton. Hafta bitince kalan jeton coin'e döner.
- Etkinlik görselleri: önce ilk çeyrek (13 hafta, ~2,0 $), sonra oyuncu tepkisine göre devam.
- Engeller: hepsi yeniden çizilecek (8 karo, 10 nesne, 9 yeni mekaniğin parçaları; ~0,37 $).
- Grid: son boyut ekran ve oynanışa göre hesaplandı, 8×11 (bölüm 1).
- İpucu: level içinde fiyat 50, 100, 200… diye iki katına çıkıyor; reklam +10 ipucu veriyor; ipucu hamle yapılana kadar kilitli; geri al ya da baştan başla sonrası el işaretiyle öneriliyor. Bu kısım yapıldı.
- Köy ismi: ilk isim ücretsiz, değiştirmek 1000 coin. Bu kısım yapıldı.

Durum (3 Kasım 2026): 300 level var. Grid 5×5'ten 7×10'a büyüyor. 11 mekanik var, sonuncusu level 121'de tanıtılıyor, level 136'dan sonra mekanikler karışık geliyor. Haftalık etkinlik şu an 4 temayı döndürüyor: puan normal levellerden geliyor, 8 adımlı bir yol var ve sonunda bir kıyafet veriliyor.

Görsel maliyetleri son işin gerçek fiyatına göre hesaplandı: görsel başına yaklaşık 0,026 $ (pofi-r8: 6 görsel, 0,154 $). Bir sayfaya yaklaşık 6 parça sığıyor ve her sayfa 2 varyantla üretiliyor. Tekrar üretim payı olarak %20 eklendi.

---

## 1. Grid büyümesi: 3×4'ten 8×11'e, 1000 level

### Son boyut neden 8×11 (10×13 değil)

Oyundaki tahta alanı ölçüldü. Bu alan, üstteki level bilgisi ve balık sayacı ile alttaki düğmeler çıkarıldıktan sonra kalan, kenar boşluğu düşülmüş alan:

| Telefon | Ekran | Tahta alanı | En/boy |
|---|---|---|---|
| Yeni telefonlar (iPhone 12–16, çoğu Android) | 390×844 | 358×564 | 0,63 |
| Küçük ekran (iPhone SE, 16:9 Android) | 375×667 | 343×387 | 0,89 |

Grid boyutuna göre hücre boyu (px):

| Grid | Yeni telefon | Küçük ekran |
|---|---|---|
| 7×10 (şu anki en büyük) | 51 | 38 |
| 8×10 | 44 | 38 |
| **8×11** | **44** | **35** |
| 8×12 | 44 | 32 |
| 9×11 | 39 | 35 |
| 10×13 | 35 | 29 |

Ölçütler:
- **Hücre en az 40 px olmalı (yeni telefonda):** Kaya, kasa, ok, fok ve sıralı balığın numarası bu boyutun altında zor seçiliyor. 9 sütun 39 px'e, 10 sütun 35 px'e düşüyor.
- **Hücre en az 34 px olmalı (küçük ekranda):** 12 satır küçük ekranda 32 px'e iniyor.
- **Ekranın şekli:** Telefon tahtası dikey (0,63). 8×11'in en/boy oranı 0,73; dikey alanı boşa harcamıyor. 10×13 (0,77) daha kare olduğu için yeni telefonlarda altta ve üstte boşluk bırakıp hücreleri küçültüyor.
- **Oynanış:** 88 hücre, şu anki en büyük tahtadan (70) yaklaşık %25 büyük. Kayma bulmacasında tahta büyüdükçe çözüm yolu uzar ve okunması zorlaşır. 8×11 zorluğu artırıyor ama tahtayı tek bakışta okunur bırakıyor.

Sonuç: son grid **8×11**. Hücre yeni telefonlarda 44 px, küçük ekranda 35 px.

### Büyüme takvimi

Grid her adımda tek yönde bir sıra büyüyor ve dikey ekran oranını koruyor. Büyüme logaritmik bir eğriyle oluyor: başta 10–20 levelde bir, sonda 150–200 levelde bir. 8×11'e level 800'de ulaşılıyor; son 200 level en büyük boyutta.

| Boyut | Başladığı level | Önceki boyutta kalınan level sayısı |
|---|---|---|
| 3×4 | 1 | – |
| 3×5 | 11 | 10 |
| 4×5 | 23 | 12 |
| 4×6 | 40 | 17 |
| 5×6 | 62 | 22 |
| 5×7 | 91 | 29 |
| 6×7 | 129 | 38 |
| 6×8 | 179 | 50 |
| 7×8 | 245 | 66 |
| 7×9 | 333 | 88 |
| 7×10 | 448 | 115 |
| 8×10 | 600 | 152 |
| 8×11 | 800 | 200 |

Notlar:
- Büyük gridlerde boşluk artmasın diye kaya yoğunluğu ve nesne sayısı alanla birlikte artacak. Hedef hamle sayısı da gridle birlikte yavaşça yükselecek.
- **Mevcut 300 levelin hepsi değişir** (ilk levellerin grid boyutu değiştiği için). Oyuncunun level numarası ve yıldızları korunur, levellerin içeriği yenilenir.
- 1000 level üretilip çözücüyle doğrulanacak; süre ölçülecek.

## 2. Yeni mekanikler (level 500'e kadar, giderek seyrekleşen)

Mevcut 11 mekanik yerinde kalıyor; aralıkları zaten başta sık, sonra seyrek. Üstüne 9 yeni mekanik geliyor. Aralar 19 levelden 70 levele kadar açılıyor. Her yeni mekanik ilk 2 levelde kolay ve tek başına geliyor; sonra karışığa giriyor.

| Level | Mekanik | Durum |
|---|---|---|
| 4 | Kar (durdurur) | var |
| 9 | Kasa (itilir) | var |
| 17 | Su (kasa batınca köprü) | var |
| 27 | Çatlak buz (bir geçişte kırılır) | var |
| 37 | Kol ve kapı | var |
| 49 | Ok (yön değiştirir) | var |
| 61 | Rampa (uçurur) | var |
| 76 | Buz deliği (ışınlar) | var |
| 91 | Eriyen kar (bir kez durdurur) | var |
| 106 | Fok (yolu keser) | var |
| 121 | Sıralı balık | var |
| **140** | **Basınç plakası:** üstünde kasa ya da Pofi varken kapı açık kalır | yeni |
| **165** | **Döner tabla:** üstünden geçeni 90° çevirir | yeni |
| **195** | **Kırılgan kaya:** ilk çarpmada çatlar, ikincide kırılıp buz olur | yeni |
| **230** | **Sarkıt:** altından geçince düşer ve kayaya dönüşür (tek geçiş) | yeni |
| **270** | **Kar topu:** itilince duvara kadar kayar; suya ya da deliğe düşerse kapatır | yeni |
| **315** | **Anahtar balık ve buz kilidi:** anahtarı alınca kilitli buz kapısı açılır | yeni |
| **365** | **Buz salı:** suyun üstünde Pofi'yi taşır, karşı kıyıda durur | yeni |
| **430** | **Rüzgâr bayrağı:** her hamlede bir yön döner, rüzgâr Pofi'yi bir kare iter | yeni |
| **500** | **Pipi (ikinci penguen):** iki penguen sırayla yönetilir; biri diğerine durak olur | yeni |

Sıra basitten karmaşığa. 500 sonrasında yeni mekanik yok; mekanik birleşimleri ve grid büyümesi zorluğu taşıyor.

## 3. Yıllık etkinlik takvimi

Her hafta Pazartesi başlayan bir etkinlik olacak (oyun haftayı zaten Pazartesi açıyor). Özel bir güne denk gelen hafta o güne ait. Diğer haftalar oyuna uygun genel temalardan gelecek. Genel temalar 16 tanelik bir havuzdan, yıl içinde 2'şer kez dönecek; böylece içerik ve maliyet azalır. Tekrar eden temada ödül, kıyafetin renk varyantı oluyor.

### 3.1 Önerilen etkinlik modeli

**Ayrı bir oyun değil, "Etkinlik" ekranı.** Ana sayfadaki etkinlik kartından açılıyor ve 3 bölümü var:

1. **Etkinlik yolu** (şimdikinin genişletilmiş hâli): 10 adım, sonunda haftanın kıyafeti ve süsü.
2. **Etkinlik levelleri:** Haftaya özel 15 level, temalı tahta ve temaya göre kural. Örnek kurallar:
   - Sevgililer: kalpli balıklar sırayla toplanıyor.
   - Balık festivali: çok balık var.
   - Kızak yarışı: hamle limiti var.
   - Cadılar: karanlık tahta, Pofi'nin çevresi aydınlık.

   Mevcut level üreticisi kullanılıyor; yeni mekanik gerekmiyor.
3. **Etkinlik dükkânı:** Haftanın jetonuyla kıyafet, süs ve ipucu alınıyor.

**Etkinlik parası: haftalık temalı jeton.** Jeton kalp, yumurta, kabak gibi temaya göre değişiyor ama sistemde tek bir para birimi. Etkinlik levellerinden, normal levellerden ve köy görevlerinden kazanılıyor. Hafta bitince elde kalan jeton coin'e çevriliyor (1 jeton = 2 coin), böylece oyuncunun emeği boşa gitmiyor. İsteğe bağlı ödüllü reklam: günde bir kez jeton x2. Ara reklam yok.

### 3.2 Etkinlik sırasında köyde neler olabilir

- **Köy süslenir:** Etkinlik haftası köy kendiliğinden temaya bürünüyor: fener dizisinin rengi, bayraklar, kar ya da yaprak yağışı, gökyüzü tonu. Büyük etkinliklerde temaya özel 3–4 geçici süs ekleniyor.
- **Etkinlik konuğu:** Meydana temalı bir konuk geliyor (Noel'de Kar Baba Fok, Cadılar'da Hayalet Fok, Okyanus haftasında Balina Kaptan). Konuğa dokununca günlük etkinlik görevi alınıyor.
- **Köy görevleri:** "Kakao standında 30 fincan sat", "3 köylüyle konuş", "bir süs yerleştir" gibi görevler jeton veriyor. Bunlar mevcut görev ve kakao sistemine bağlanıyor.
- **Etkinlik standı:** Liman meydanına geçici bir çadır kuruluyor ve dükkân orada açılıyor. Köy ekranından da etkinliğe girilebiliyor.
- **Köylüler kıyafet giyer:** Köylüler haftanın şapkasını ya da atkısını takıyor. Kıyafet görselleri tekrar kullanıldığı için ek maliyeti yok.
- **Kalıcı hatıra:** Etkinlik süsü kazanılınca süs yerlerine kalıcı olarak konabiliyor. Köy yıl boyunca bir hatıra albümüne dönüşüyor.
- (Sunucu gelince) **Topluluk hedefi:** Bütün oyuncular birlikte 1 milyon balık topluyor ve herkese ödül çıkıyor.

### 3.3 52 haftalık takvim (28 Aralık 2026'dan başlıyor)

★ = özel gün (büyük etkinlik), ○ = genel tema. Bayram tarihleri yaklaşık; kesin tarih takvimden alınacak.

| Hafta (Pzt) | Etkinlik | Neden |
|---|---|---|
| 28 Ara | ★ Yılbaşı Havai Fişekleri | 1 Ocak |
| 4 Oca | ○ Kar Tanesi Avı | |
| 11 Oca | ○ İglo Yapım Haftası | |
| 18 Oca | ★ Penguen Dostları | 20 Ocak Penguen Farkındalık Günü |
| 25 Oca | ○ Balık Festivali | |
| 1 Şub | ★ Fener Şenliği | 6 Şubat Çin Yeni Yılı |
| 8 Şub | ★ Kalpli Balıklar | 14 Şubat Sevgililer Günü |
| 15 Şub | ○ Buz Heykeli Yarışması | |
| 22 Şub | ★ Kutup Ayısı Ziyareti | 27 Şubat Kutup Ayısı Günü |
| 1 Mar | ○ Kızak Yarışı | |
| 8 Mar | ★ Şeker Bayramı Kakaosu | Ramazan Bayramı (~9–11 Mart) |
| 15 Mar | ★ Bahar Uyanışı | 21 Mart Nevruz / ekinoks |
| 22 Mar | ★ Yumurta Avı | Bahar şenliği (Paskalya haftası, laik tema) |
| 29 Mar | ★ Şaşkın Pofi | 1 Nisan Şaka Günü (ters yönlü oklar) |
| 5 Nis | ○ Kuzey Işığı Haftası | |
| 12 Nis | ○ Kristal Mağara | |
| 19 Nis | ★ Dünya Penguen Günü ve Çocuk Şenliği | 23 Nisan, 25 Nisan |
| 26 Nis | ○ Martı Postası | |
| 3 May | ★ Anneler Günü Kakaosu | 9 Mayıs |
| 10 May | ○ Balina Göçü | |
| 17 May | ★ Kızak Olimpiyatı | 19 Mayıs, Kurban Bayramı (~16–19 Mayıs) |
| 24 May | ○ Usta Balıkçı | |
| 31 May | ○ Uçurtma Rüzgârı | |
| 7 Haz | ★ Okyanus Haftası | 8 Haziran Dünya Okyanus Günü |
| 14 Haz | ★ Babalar Günü Balık Turu | 20 Haziran |
| 21 Haz | ★ Gece Yarısı Güneşi | 21 Haziran gündönümü (kutupta güneş batmaz) |
| 28 Haz | ○ Buz Pateni Şampiyonası | |
| 5 Tem | ○ Hazine Sandığı | |
| 12 Tem | ★ Emoji Penguenler | 17 Temmuz Dünya Emoji Günü |
| 19 Tem | ○ Kar Topu Savaşı | |
| 26 Tem | ★ Dostluk Haftası | 30 Temmuz Dostluk Günü (arkadaş köyü ziyaretine bonus) |
| 2 Ağu | ○ Pusula Avı | |
| 9 Ağu | ★ Yıldız Kayması | 12 Ağustos Perseid meteor yağmuru |
| 16 Ağu | ○ Liman Panayırı | |
| 23 Ağu | ○ Balık Festivali | |
| 30 Ağu | ○ Kızak Yarışı | |
| 6 Eyl | ★ Okula Dönüş | Eylül başı |
| 13 Eyl | ○ İglo Yapım Haftası | |
| 20 Eyl | ★ Kakao Hasadı | 23 Eylül ekinoks |
| 27 Eyl | ○ Kuzey Işığı Haftası | |
| 4 Eki | ★ Hayvan Dostları | 4 Ekim Hayvanları Koruma Günü |
| 11 Eki | ○ Kristal Mağara | |
| 18 Eki | ○ Martı Postası | |
| 25 Eki | ★ Hayalet Fok Gecesi | 31 Ekim Cadılar Bayramı |
| 1 Kas | ○ Buz Heykeli Yarışması | |
| 8 Kas | ○ Balina Göçü | |
| 15 Kas | ○ Hazine Sandığı | |
| 22 Kas | ★ Kakao Sofrası ve Büyük İndirim | 25 Kasım Şükran Günü, 26 Kasım Kara Cuma |
| 29 Kas | ○ Kar Topu Savaşı | |
| 6 Ara | ○ Kar Tanesi Avı | |
| 13 Ara | ○ Fener Gecesi | |
| 20 Ara | ★ Kış Şenliği | 21 Aralık gündönümü, 25 Aralık |

Toplam: 21 büyük (özel gün) ve 31 genel hafta. Genel haftalar 16 farklı temadan geliyor.

### 3.4 Her etkinlik için gereken içerik ve maliyet

| Paket | İçerik | Görsel | Maliyet |
|---|---|---|---|
| Genel tema (×16) | banner, jeton ikonu, 1 kıyafet, 1 süs, konuk | 4 | ~0,10 $ |
| Büyük etkinlik, orta (×21) | banner, jeton, şapka ve atkı, 3 süs, konuk | 6 | ~0,16 $ |
| Büyük etkinlik, tam (×21) | orta paket ve üstüne temalı tahta kaplaması (buz, kaya, arka plan) ile köy süsleme seti | 10 | ~0,26 $ |

Yıllık toplam (%20 tekrar payı dahil):

| Seçenek | Kapsam | Görsel | Maliyet |
|---|---|---|---|
| **A) Ekonomik** | Hepsi genel paket (16 genel + 21 özel gün, 4'er görsel) | ~150 | **~4,6 $** |
| **B) Orta** | 16 genel + 21 orta büyük | ~190 | **~6,0 $** |
| **C) Tam** | 16 genel + 21 tam büyük | ~275 | **~8,6 $** |

Kodla yapılanların görsel maliyeti yok: etkinlik ekranı, etkinlik levelleri, jeton ve dükkân, köy görevleri, konuk davranışı, köyün renk ve hava efektleri.

Mevcut görsel bütçesi 4 $; bunun 3,22 $'ı harcandı. Etkinlikler için ek bütçe gerekiyor. İlk çeyreği (13 hafta) üretip oyuncu tepkisine göre devam etmek de mümkün; B seçeneğinde bu ~2,0 $ eder (6 büyük ve 7 genel etkinlik).

## 4. Engellerin yeniden çizimi (daha az gerçekçi, Pofi tarzında)

Şu an görselli olanlar: buz, kar, kaya, su, çatlak buz, rampa, delik, eriyen kar (8 karo). Kasa, kol, kapı, ok, fok ve balık hâlâ kodla çiziliyor. Öneri: hepsini aynı çizgide yeniden çizmek. Bu, Pofi ve yapılarla aynı kalın kontur, yumuşak renk ve basit şekil demek.

| Kapsam | Parça | Görsel | Maliyet |
|---|---|---|---|
| Yalnızca 8 karo | 8 | 4 | ~0,13 $ |
| 8 karo ve kodla çizilen 10 nesne | 18 | 6 | ~0,19 $ |
| Yukarıdakiler ve 9 yeni mekaniğin parçaları (~16) | 34 | 12 | ~0,37 $ |

Son seçenek kalan bütçeye (~0,78 $) sığıyor ve hepsi tek seferde aynı tarzda çıkıyor.
