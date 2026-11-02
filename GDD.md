# Pofi: Buz Köyü — Oyun Tasarım Dokümanı v0.2

**Funday Morning Games** · 2D mobil bulmaca · tek parmak (kaydır) · level tabanlı · kolay–orta zorluk · reklam ağırlıklı hibrit-casual

> **Kısa döngü:** Pofi'yi kaydır → buzda kayar, çarptığı her şey tepki verir → balıkları topla.
> **Uzun döngü:** Kazandığın kar taneleriyle Pofi'nin köyünü kur, her yapının stilini seç, Pofi'yi giydir.

---

## 0. İsim Analizi

| Aday | Durum |
|---|---|
| **Pofi** (TR "pofuduk"tan) | Mağaza aramasında eşleşme yok. Kısa, sevimli, iki dilde kolay okunuyor, karakter markasına dönüşebilir. **Seçildi.** |
| "Slide / Slippy / Pengu" içeren adlar | Çok kalabalık: Pengu Slide, Slippy Slide, Slipping Penguin, Pengi… Kaçınılmalı. |
| "Pingu" | Tescilli çizgi film markası. **Kesinlikle kullanılmamalı.** |

- **Mağaza başlığı:** `Pofi: Ice Slide Puzzle` (EN, 22) · `Pofi: Buz Köyü Bulmaca` (TR, 22)
- **Alt başlık:** "Kay, çarp, çöz, köyünü kur."
- **Yapılacak:** Marka kontrolü (TÜRKPATENT / EUIPO / USPTO). Web araması marka tescil kontrolü yerine geçmez.

**Rekabet notu:** Penguenli buz kaydırma bulmacaları mağazada var. Farkımız iki şey:
1. **Neden-sonuç zincirleri:** Kasa suya düşüp köprü olur, çatlak buz kırılıp delik açar, kol kapıları değiştirir, oklar yön değiştirir. Her hamle haritayı kalıcı olarak değiştirir.
2. **Köy kurma ve kişiselleştirme metası:** Oyuncu yalnızca level geçmez, kendi köyünü ve karakterini şekillendirir.

---

## 1. Oyun Özeti

- **Kontrol:** Tahtanın herhangi bir yerinde 4 yönden birine kaydır (masaüstünde ok tuşları). Pofi o yönde **bir şeye çarpana kadar** kayar.
- **Amaç:** Tahtadaki tüm balıkları toplamak. Pofi üzerinden geçtiği balığı alır.
- **Kaybetme:** Normal levellerde yok. "Geri al" sınırsız ve ücretsiz, "Baştan" her zaman var.
- **Yıldız:** Optimum hamle sayısında bitirirsen 3, birkaç fazlasıyla 2, aksi halde 1 yıldız.
- **Zor leveller:** Hamle limiti var. Biterse reklamla veya coin ile +5 hamle alınır ya da level baştan oynanır.
- **Level süresi:** 30 saniye – 2 dakika.

## 2. Nesneler ve Neden-Sonuç Kuralları

| Nesne | Kural | Etkisi |
|---|---|---|
| Buz | Üzerinde kayılır | — |
| Kaya | Pofi'yi ve kasaları durdurur | Yön belirleme noktası |
| Kar | Üzerine gelen Pofi veya kasa **orada durur** | Kontrol sağlar |
| Balık | Pofi geçerken toplar | Hedef |
| **Kasa** | Pofi kasaya çarparsa durur; kasa aynı yönde **o da bir şeye çarpana kadar kayar** | Engeli taşı, yeni duvar yarat |
| **Su** | Pofi suya giremez (önünde durur). Kasa suya kayarsa **batar ve köprü olur** | Yeni yol aç |
| **Çatlak buz** | Pofi üzerinden geçince arkasında **kırılır, suya döner** | Dönüş yolunu kapatır; sıra planlaması gerekir |
| **Kol + kapılar** | Pofi kola çarparsa tüm buz kapıları açılır ↔ kapanır | Haritanın şeklini değiştir |
| **Ok** | Üzerinden geçen Pofi veya kasa okun yönüne döner | Yönlendirme zincirleri |

## 3. Mekanik Açılış Takvimi

| Level | Yeni öğe |
|---|---|
| 1–3 | Buz, kaya, balık (eğitim eli) |
| 4–8 | Kar |
| 9–16 | Kasa |
| 17–26 | Su + kasa = köprü |
| 27–36 | Çatlak buz |
| 37–48 | Kol + kapılar |
| 49–60 | Oklar |
| 61–75 | **Rampa** (v0.2 ✅, su ile birlikte gelir) |
| 76+ (şu an) | Karışık: kasa, su, çatlak, kol, ok, rampa |
| 76–90 (Faz 3) | **Buz delikleri** (giriş-çıkış çifti) |
| 91–105 | **Eriyen kar** (v0.3) |
| 106–120 | **Fok** (hareketli engel) (v0.3) |
| 121–135 | **Sıralı balık** (1-2-3) (v0.3) |
| 136+ | Karışık kombinasyonlar, büyüyen tahtalar, daha sık hamle limiti |

### 3.1 Zorlaştırıcı yeni mekanikler (v0.2–v0.3)
Hepsi deterministik, yani çözücü ve level üreticisi aynen çalışır. Her biri "mekanik gerçekten gerekli mi" testinden geçer: etkisizleştirme kuralı rampa → buz, delik → kaya, eriyen kar → buz, fok → yok, sıralı balık → sırasız balık.

| Mekanik | Kural | Neden zorlaştırır |
|---|---|---|
| **Rampa** | Pofi rampaya rampanın yönünde girerse **2 hücre uçar**. Uçtuğu hücrelerdeki her şeyin (su, kaya, kasa, balık) üstünden geçer, 3. hücreye iner ve kaymaya devam eder. İniş hücresi doluysa uçuş yolundaki en uzak boş hücreye iner. Rampanın dik tarafından gelinirse kaya gibi durdurur, yanlardan gelinirse buz gibi geçilir. Kasalar rampadan uçmaz; onlar için rampa kayadır. | **Fazla uçmak sıkıştırır:** Pofi durmak istediği yerin ötesine iner, suyla çevrili bir "adaya" düşebilir. Uçtuğu balığı alamaz. Su ve kaya aşılabilir ama dönüş yolu olmayabilir. "Sıkıştın! Geri al" uyarısı burada önem kazanır. |
| **Buz delikleri** | Bir delikten giren Pofi ya da kasa, eş deliğin karşısından aynı yönde çıkar ve kaymaya devam eder. | Haritayı katlar; aynı hamle iki farklı bölgeyi etkiler. |
| **Eriyen kar** | Üzerinde bir kez durulunca erir ve buza döner. | Tek kullanımlık fren; sıra planlaması gerekir. |
| **Fok** | Her hamleden sonra kendi rotasında 1 adım ilerler; Pofi'yi ve kasaları durdurur. | Zamanlama bulmacası; aynı hamle farklı anlarda farklı sonuç verir. |
| **Sıralı balık** | Balıklar 1-2-3 sırasıyla toplanmalı; sırası gelmeyen balığın üstünden geçilir ama toplanmaz. | Rota planlamasını zorunlu kılar. |

**Zorluk eğrisi (136+):** Tahtalar 7×9'dan 8×10'a büyür. Hamle limitli leveller her 10 levelde 2'den 3'e çıkar. Yeni mekanik bloğunun ilk 2 leveli her zaman kolay kalır.

Her yeni öğe ilk geldiğinde kısa bir "YENİ" kartıyla tanıtılır.
**Zorluk ritmi:** 10'lu bloklarda kolay, kolay, orta, kolay, orta, orta, ZOR, kolay, orta, ÇOK ZOR.

## 4. Meta: Pofi'nin Köyü (v0.2 tasarımı)

> v0.1'deki sorun: 8 yapının toplam maliyeti 20 ❄; köy ~20. levelde biter ve sonrasında harcanacak bir şey kalmaz. v0.2'de köy **uzun vadeli** bir hedef olur.

### 4.1 İki para birimi, iki net rol
| Birim | Ne için | Nereden |
|---|---|---|
| **❄ Kar tanesi** | **İlerleme:** yapı kurmak ve seviye atlatmak | Level başına 1 ❄, **3 yıldızda +1 ❄**, günlük ödül, köy seviye ödülleri |
| **Coin** | **Görünüm ve yardım:** stiller, renkler, kıyafet, ipucu, +5 hamle | Level ödülü, çarpan, kakao, mağaza |

3 yıldıza verilen ek ❄, bulmacayı en iyi çözmeyi doğrudan köy ilerlemesine bağlar. "Geri al" ücretsiz olduğu için oyuncu 3 yıldız için tekrar dener.

### 4.2 Yapı seviyeleri (Lv1 → Lv3; Bölge 2'de Lv5'e çıkar)
- Her seviye atlatma ❄ ile yapılır, **anında** biter (bekleme süresi yok).
- **Görünüm her seviyede belirgin şekilde güzelleşir.** Örnek İglo: Lv1 küçük kubbe → Lv2 baca, pencere ve ışık → Lv3 çift kubbe, bayrak, girişte fener ve tüten baca.
- **Her yapının kendine özgü bir buff'ı var**, seviye arttıkça büyür. Buff'lar bulmacayı kolaylaştırmaz (çözümü göstermez), ama ödülleri ve rahatlığı artırır:

| Yapı | Kurulum / Lv2 / Lv3 (❄) | Buff (Lv1 / Lv2 / Lv3) |
|---|---|---|
| İglo | 1 / 3 / 6 | Level coin ödülü +%10 / +%20 / +%30 |
| Balık iskelesi | 2 / 3 / 6 | Toplanan balık başına +1 / +2 / +3 coin |
| Kardan adam | 2 / 4 / 7 | Zor levellerde +1 / +2 / +3 başlangıç hamlesi |
| Kakao standı | 2 / 4 / 7 | Pasif gelir 20 / 40 / 60 coin/saat (8 saat birikir) |
| Fener dizisi | 3 / 4 / 7 | Her gün 1 / 2 / 3 ücretsiz ipucu |
| Çam ağacı | 3 / 5 / 8 | Günlük ödül +%25 / +%50 / +%100 |
| Buz pisti | 3 / 5 / 8 | Çarpan çubuğunda x5 bölgesi %10 → %14 / %18 / %22 |
| Kızak tepesi | 4 / 5 / 8 | Günlük bulmaca ödülü +%25 / +%50 / +%100 |
| **Balıkçı kulübesi** (yeni) | 3 / 5 / 8 | Level sonunda %10 / %20 / %30 şansla +1 ❄ |
| **Deniz feneri** (yeni) | 4 / 6 / 9 | Günde 1 / 2 / 3 kez ücretsiz "+5 hamle" |
| **Kartopu kalesi** (yeni) | 4 / 6 / 9 | Stil ve kıyafetlerde %10 / %20 / %30 indirim |
| **Kuzey ışığı gözlem noktası** (yeni) | 5 / 7 / 10 | Kakao kapasitesi 8 → 10 / 12 / 16 saat |

- **Bölge 1 toplamı:** 12 yapı × 3 seviye = 36 seviye, toplam **186 ❄**. 3 yıldız bonusuyla ortalama 1,5 ❄/level kazanılırsa bu yaklaşık **125 level** eder. Ardından Bölge 2 gelir.
- **Kilit:** Yeni yapılar köy seviyesiyle açılır (4.3). Böylece oyuncunun önünde her zaman 2–4 seçenek olur, sıra dayatılmaz.

### 4.3 Köy seviyesi = toplam yapı seviyesi
Köy seviyesi, bütün yapıların seviyelerinin toplamından hesaplanır. Her seviye atlayışta üç şey olur:
1. **Görsel değişim**
2. **Kalıcı buff**
3. **Tek seferlik ödül sandığı**

**Köy bonusu:** Her köy seviyesi bütün level coin'lerine kalıcı **+%3** ekler. Bu bonus sonuç ekranında "Köy bonusu +%12" gibi görünür. Ek hamle buff'ı yalnızca kardan adamdadır; köy seviyesi hamle vermez, aksi halde zor levellerdeki hamle limiti anlamını yitirir.

| Köy Lv | Gereken toplam yapı seviyesi | Görsel | Ödül |
|---|---|---|---|
| 1 | 0 | Boş koy | — |
| 2 | 4 | Hafif kar yağışı efekti | 200 coin, 2 ipucu |
| 3 | 8 | **Balıkçı kulübesi + Deniz feneri açılır**, komşu penguen gelir | Kırmızı atkı |
| 4 | 13 | Köy yolu döşenir, ikinci komşu | 300 coin, 5 ❄ |
| 5 | 18 | **Kartopu kalesi açılır**, gökyüzünde kuzey ışıkları | "Kuzey" beresi |
| 6 | 24 | Gece/gündüz döngüsü, fenerler yanar | 500 coin |
| 7 | 30 | **Gözlem noktası açılır**, köy maskotu fok gelir | Fok kostümü |
| 8 | 36 | Köy meydanında festival | **Bölge 2 "Kuzey Işıkları"** + taç |

Seviye atlayışı tam ekran bir kutlamayla gösterilir: kamera köyü yakınlaştırır, yeni görsel belirir, sandık açılır.

### 4.4 Satın almadan önce önizleme (stiller, renkler, kıyafetler)
- **Sorun:** v0.1'de 80–150 coin'lik bir stile dokunmak onu doğrudan satın alıyor ve oyuncu sonucu görmeden ödüyor.
- **Çözüm: "Dene → Beğen → Al" akışı.**
  - **Köy:** Yapıya dokunulunca ekranın altında bir panel açılır, köy sahnesi üstte görünür kalır ve kamera o yapıya yakınlaşır. Stillere ve renklere dokunmak onları **anında sahnede gösterir**, para harcanmaz. Kilitli seçenek seçiliyken alt butonda "Satın al · 100 🪙" yazar, açık bir seçenekte "Uygula". "Vazgeç" ya da paneli kapatmak her şeyi eski haline döndürür.
  - **Renkler:** Stilden ayrı bir renk paleti olur (çatı, gövde, süs; 6–8 renk). Her yeni renk 100 coin, bir kez açılınca tüm yapılarda kullanılabilir.
  - **Gardırop:** Kıyafete dokunmak Pofi'nin üzerinde dener. Satın alma ayrı bir butonla yapılır. Pofi kıyafetle birlikte kısa bir sevinç animasyonu yapar.
- **Satın almayı teşvik:** Önizlemede alt köşede "Köy bonusu: bu stil köy puanı vermez" gibi bir not durur. Görünüm tamamen kozmetiktir ve buff'larla karışmaz.

### 4.5 Gardırop
Pofi'ye bere, şapka ve atkı alınır (coin). Seçilen kıyafet **oyun içinde de görünür**; bu, oyuncunun kendi karakteri olur. Köy seviye ödülleri özel kıyafetler de verir (4.3).

## 5. Ekonomi (başlangıç değerleri, remote config'e taşınacak)

| Kaynak | Miktar |
|---|---|
| Level coin | Kolay 20 · orta 25 · zor 35 · çok zor 50, artı yıldız başına 5 |
| Level kar tanesi | 1, 3 yıldızda +1 |
| Yapı kurulum ve seviye maliyeti | 1–10 ❄; Bölge 1 toplamı 186 ❄ ≈ 125 level (bkz. 4.2) |
| Ek stil / renk | 80–150 coin / renk başına 100 coin (önizlemeli) |
| Kıyafet | 60–250 coin |
| İpucu | 60 coin veya reklam |

## 6. Reklam ve Monetizasyon

Damla Bahçesi'nde doğrulanan model aynen geçerli:
- **Level sonu ibreli çarpan** (x2–x5, ödüllü reklam).
- +5 hamle, ipucu, günlük ödül x2, pasif gelir x2, mağazada günlük 5 ücretsiz coin.
- Ara reklam: level 12'den önce yok, en az 3 levelde bir ve en az 90 saniye arayla. Ödüllü reklamdan sonraki geçişte atlanır.
- IAP: Reklamsız ($3.99), Başlangıç paketi ($1.99), ileride özel kıyafet paketleri.

## 7. Günlük Sistemler

- **Günlük ödül:** 7 günlük takvim, gün kaçırılırsa seri sıfırlanır, reklamla x2.
- **Günlük bulmaca:** Tarihten üretilir, aynı gün herkese aynı bulmaca. Seri arttıkça ödül büyür.

## 8. Level Üretim Pipeline'ı

1. **Üretici** (`js/engine.js`): Levelin aşamasına göre tahta boyutu, kaya yoğunluğu ve aktif nesneleri seçer, rastgele aday tahta kurar.
2. **Çözücü:** BFS ile tüm durum uzayını tarar (Pofi konumu, toplanan balıklar, kasa konumları, kırılan buzlar, köprüler, kapı durumları). En kısa çözümü bulur.
3. **Kabul şartları:** Çözülebilir olmalı, en kısa çözüm levelin hamle bandında olmalı, **o aşamanın yeni mekaniği çözümde gerçekten kullanılmalı** (kasa itildi mi, köprü kuruldu mu, kol çekildi mi…).
4. **Çevrimdışı üretim** (`tools/gen-levels.mjs`): İlk 200 level `data/levels.json` dosyasına yazılır. Sonraki leveller aynı kodla çalışma anında üretilir.
5. **İpucu:** Çözücü oyuncunun o anki durumundan çalışıp bir sonraki doğru hamleyi gösterir.

## 9. Teknik

| Alan | Seçim |
|---|---|
| Prototip | HTML5 Canvas + ES modülleri; motor Node'da da çalışır (üretici ve testler) |
| Üretim (karar bekliyor) | Web + Capacitor (kod korunur) veya Unity |
| Ses | Web Audio ile kodda üretilir (dosya yok) |
| Kayıt | localStorage; ileride bulut |

## 10. v0.2 Geliştirme Fazları

| Faz | İçerik | Neden bu sırada |
|---|---|---|
| **Faz 1 · Köy derinliği** ✅ | Yapı seviyeleri (Lv1–3, her seviyede yeni görünüm), yapı buff'ları, köy seviyesi + kutlama + ödül sandığı, 4 yeni yapı, 3 yıldıza +1 ❄, **önizlemeli satın alma** (köy stilleri, renk paleti, gardırop) | Meta şu an ~20. levelde bitiyor. Retention'ı en çok bu etkiler. |
| **Faz 2 · Rampa** ✅ | Rampa mekaniği, levelleri 300'e çıkarma, yeni "YENİ" kartı ve sesler | 61. levelden sonra yeni mekanik yok; oyuncu 60'ı geçince bu eksik hissedilir. |
| **Faz 3 · Derinlik** | Buz delikleri, eriyen kar, fok, sıralı balık; Bölge 2 "Kuzey Işıkları" (Lv5'e kadar yapılar) | Uzun vadeli içerik |
| **Faz 4 · Canlı operasyon** | Haftalık etkinlik, köy ziyareti (arkadaşın köyünü görme), sezon kıyafetleri | Sosyal ve sezonluk geri dönüş |

## 11. Yol Haritası

| Faz | Çıktı |
|---|---|
| Prototip v0.1 | Motor + çözücü + 200 level, açılış/giriş ekranları, köy (8 yapı, stiller), gardırop, günlük sistemler |
| CPI testi | Kasa→su→köprü zincirini ve köy kişiselleştirmesini öne çıkaran 3–5 kreatif |
| Dikey dilim | Bölge 2, sezon kıyafetleri, haftalık etkinlik |
| Soft launch | D1/D7, ARPDAU, RV/DAU ölçümü |
