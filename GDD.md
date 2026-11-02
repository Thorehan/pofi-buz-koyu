# Pofi: Buz Köyü — Oyun Tasarım Dokümanı v0.1

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
| 61+ | Karışık kombinasyonlar, büyüyen tahtalar |

Her yeni öğe ilk geldiğinde kısa bir "YENİ" kartıyla tanıtılır.
**Zorluk ritmi:** 10'lu bloklarda kolay, kolay, orta, kolay, orta, orta, ZOR, kolay, orta, ÇOK ZOR.

## 4. Meta: Pofi'nin Köyü

- Her level **1 kar tanesi ❄** ve coin kazandırır.
- **Bölge 1 · Buzul Koyu:** 8 yapı. Kar tanesiyle sırayla kurulur: İglo, Balık İskelesi, Kardan Adam, Fener Dizisi, Kakao Standı, Çam Ağacı, Buz Pisti, Kızak Tepesi.
- **Kişiselleştirme:** Her yapının 3 stili var. İlk stil kurulumla gelir, diğerleri coin ile açılır. **Düzenle** modunda açılmış stiller arasında ücretsiz geçiş yapılır.
- **Gardırop:** Pofi'ye bere/şapka ve atkı alınır (coin). Seçilen kıyafet **oyun içinde de görünür**. Bu oyuncunun kendi karakteri olur.
- **Pasif gelir:** Kakao standı kurulunca köy saatte coin üretir (en fazla 8 saat birikir), reklamla x2 toplanır.

## 5. Ekonomi (başlangıç değerleri, remote config'e taşınacak)

| Kaynak | Miktar |
|---|---|
| Level coin | Kolay 20 · orta 25 · zor 35 · çok zor 50, artı yıldız başına 5 |
| Level kar tanesi | 1 |
| Yapı maliyeti | 1–4 ❄ (toplam ~20 ❄ ≈ 20 level) |
| Ek stil | 80–150 coin |
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

## 10. Yol Haritası

| Faz | Çıktı |
|---|---|
| Prototip v0.1 | Motor + çözücü + 200 level, açılış/giriş ekranları, köy (8 yapı, stiller), gardırop, günlük sistemler |
| CPI testi | Kasa→su→köprü zincirini ve köy kişiselleştirmesini öne çıkaran 3–5 kreatif |
| Dikey dilim | Bölge 2, sezon kıyafetleri, haftalık etkinlik |
| Soft launch | D1/D7, ARPDAU, RV/DAU ölçümü |
