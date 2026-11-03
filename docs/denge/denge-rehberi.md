# Pofi: Buz Köyü — oynanış dengesi rehberi

Bu rehber Mustafa için hazırlandı. Unity'ye geçiş, oyun dengesi bittikten sonra yapılacak; denge çalışması web sürümünde yapılır ve sonuç Unity'ye olduğu gibi taşınır.

## 1. Elindeki dosyalar

| Dosya | Ne işe yarar |
|---|---|
| `docs/denge/level-tablosu.csv` | 1000 levelin her biri için bir satır. Excel'de doğrudan açılır (Türkçe ayar, noktalı virgül). |
| `docs/denge/zorluk-egrisi.svg` | En kısa çözümün level boyunca grafiği; tarayıcıda açılır. Noktaların rengi zorluk sınıfını gösterir. Koyu çizgi 25 levellik ortalamadır. Mavi kesikli çizgiler grid büyümesini, turuncu çizgiler yeni mekaniğin geldiği leveli işaretler. |
| `tools/level-stats.mjs` | Tabloyu ve grafiği yeniden üretir (yaklaşık 15 saniye). |
| `tools/gen-levels.mjs` | 1000 leveli yeniden üretir ve her birini çözücüyle doğrular (yaklaşık 3 dakika). |

### Tablonun sütunları

- **Grid / Hücre:** Tahtanın boyutu ve hücre sayısı.
- **Zorluk:** kolay, orta, zor, çok zor. Zor ve çok zor levellerde hamle sınırı vardır.
- **En kısa çözüm:** Leveli bitiren en az hamle; 3 yıldız bu sayıyla alınır.
- **Hamle sınırı:** Bu sayıdan fazla hamlede level kaybedilir. Boşsa sınır yoktur.
- **2 yıldız için en fazla hamle:** Bunu aşan oyuncu 1 yıldız alır.
- **Balık, Kaya:** Tahtadaki sayılar.
- **Tahtadaki mekanikler / Çözümde kullanılanlar:**
  - Tahtaya konan her şey çözümde kullanılmak zorunda değil.
  - İkisi arasındaki fark, "süs olarak duran" mekanikleri gösterir. Bkz. bölüm 5.
- **Yeni mekanik:** O levelde tanıtım penceresiyle gelen mekanik.
- **Durum sayısı:** Oyuncunun o tahtada ulaşabileceği farklı konum sayısı (5000'de kesilir). Bulmacanın ne kadar "geniş" olduğunun kaba ölçüsüdür. Küçük sayı, az seçenek ve kolay okunan tahta demektir; 5000 ise çok geniş, keşif isteyen tahta.
- **Coin:** 3 yıldızla, köy bonusu olmadan kazanılan coin.

## 2. Nasıl denenir

- **Canlı sürüm:** https://thorehan.github.io/pofi-buz-koyu/
- **İstediğin leveli aç:** Adresin sonuna `?oyna=250` ekle (https://thorehan.github.io/pofi-buz-koyu/?oyna=250). Ana sayfadaki "Oyna" düğmesi o leveli açar. Kazanınca kayıttaki ilerleme o levelin bir sonrasına geçer.
- **Etkinlik teması:** `?etkinlik=valentine`. Tema adları `js/config.js` içindeki `EVENT_THEMES` listesinde.
- **Köyde saat:** `?saat=20` (köylülerin saat rutini için).
- Parametreler birleştirilebilir: `?oyna=140&etkinlik=lantern`.
- **Kendi bilgisayarında:** Proje klasöründe `python -m http.server 5174` çalıştır, tarayıcıda `http://localhost:5174/?oyna=…` aç.

## 3. Leveller nasıl oluşuyor

Leveller elle çizilmiyor, bir üretici kurallara göre oluşturuyor (`js/engine.js`, "level üreticisi" bölümü). Her level için sırasıyla:

1. Level numarasından grid boyutu, zorluk sınıfı, hedef hamle aralığı, mekanikler ve balık sayısı belirlenir (`levelSpec`).
2. Rastgele tahtalar denenir: önce kayalar, sonra mekanikler, Pofi ve balıklar yerleştirilir (`buildCandidate`).
3. Her aday çözücüyle çözülür. Kabul edilmesi için şunlar gerekir:
   - en kısa çözüm hedef aralıkta olmalı;
   - yeni mekanik gerçekten gerekli olmalı, yani o mekanik kaldırılınca çözüm bozulmalı ya da uzamalı.
4. Zor ve çok zor levellere hamle sınırı eklenir (`finalize`).

Aynı level numarası her zaman aynı tahtayı verir; üretim rastgele görünür ama tekrarlanabilir.

## 4. Ayar haritası: neyi nereden değiştirirsin

### `js/engine.js`

| Ayar | Nerede | Şu anki değer | Etkisi |
|---|---|---|---|
| Grid büyümesi | `GRID` | 3×4 (1) → 8×11 (800), 13 adım | Tahtanın hangi levelde büyüyeceği |
| Mekaniklerin geldiği leveller | `STAGES` | kar 4, kasa 9, su 17 … Pipi 500 | Her yeni mekaniğin başladığı level ve yanında gelen mekanikler |
| Karışık levellerin başlangıcı | `MIX_FROM` | 136 | Bu levelden sonra mekanikler karışık gelir |
| Tanıtım bloğu | `INTRO_BLOCK` | 8 | Yeni mekanik kaç level boyunca tek başına gelir (136'dan sonrası için) |
| En yeni mekaniğin sıklığı | `levelSpec` içinde "100 level, %35" | %35, 100 level | Yeni açılan mekaniğin karışık levellerde öne çıkma oranı ve süresi |
| Zorluk sırası | `PATTERN` | kolay, kolay, orta, kolay, orta, orta, zor, kolay, orta, çok zor | Her 10 levelin zorluk ritmi. İlk 10 level ve mekanik tanıtımlarının ilk 2 leveli her zaman kolaydır. |
| Hedef hamle aralığı | `levelSpec` içindeki `lo, hi` | 1–1 (L1) … 5–9 (500+) | En kısa çözümün hangi aralıkta olacağı; zorluk sınıfı bu aralığa eklenir (orta +1, zor +1/+2, çok zor +2/+2) |
| Balık sayısı | `levelSpec` içindeki `fish` | 1–3, büyük tahtada 1–4 | |
| Kaya yoğunluğu, nesne sayıları | `buildCandidate` | kaya %14–24 (küçük tahtada %8–18), nesneler alanla ölçeklenir | Tahtanın kalabalığı |
| Hamle sınırı | `finalize` | zor: en kısa + en az 3 (ya da %50); çok zor: en kısa + en az 2 (ya da %35) | Kaybetme baskısı |
| Yıldız eşikleri | `starsFor` | 3★ = en kısa; 2★ = en kısa + en az 2 (ya da %50) | Yıldız toplamanın zorluğu |

### `js/config.js`

| Ayar | Nerede | Etkisi |
|---|---|---|
| Level coin'i, yıldız coin'i, ipucu fiyatları, devam hakkı | `ECON` | Ekonominin temeli |
| Mekanik tanıtım yazıları | `INTRO` | "YENİ" penceresinde çıkan metinler |
| Yapı maliyetleri (kar tanesi) ve bonusları | `BUILDINGS` | Köyün ilerleme hızı |
| Köy seviyeleri ve ödülleri | `VILLAGE_LEVELS` | |
| Günlük ödüller | `DAILY_REWARDS` | |
| Kakao satışı | `COCOA` | Pasif gelir |
| Etkinlik jetonu, ödül yolu, dükkân | `EVENT_TOKENS`, `EVENT_TRACK`, `EVENT_SHOP` | Haftalık etkinliğin temposu |
| Yıldız sandığı (her kaç yıldızda bir, ödüller) | `STAR_CHEST` | 3 yıldız yapmanın değeri |
| Tekrar oynama ödülü (yalnız yeni yıldızlar) | `REPLAY` | Eski levellere dönme isteği; tekrar tekrar coin toplanmasını engeller |
| Başarımlar ve kademe ödülleri | `ACHIEVEMENTS`, `ACH_REWARD` | Uzun vadeli hedefler |
| Harita bölgeleri | `MAP_REGIONS` | Haritadaki bölge adları ve renkleri |

### Değişiklikten sonra

1. Leveller etkilendiyse: `node tools/gen-levels.mjs 1000` (yaklaşık 3 dakika). Üretici çözülemeyen bir level üretirse hata verip durur.
2. `node tools/level-stats.mjs` ile tabloyu ve grafiği yenile.
3. Eğrinin yeni hâline bak; birkaç kritik leveli `?oyna=N` ile oyna.

**Dikkat:** Üreticideki bir değişiklik genellikle değişen noktadan sonraki bütün levellerin içeriğini değiştirir, çünkü rastgele sayı sırası kayar. Oyun yayımlanmadan önce bu sorun değil; yayından sonra mevcut levellerin değişmemesi için ayrı bir yöntem gerekir.

**Tek bir leveli elle düzeltmek:** Şu an bunun için bir yol yok; leveller yalnızca üreticiden geliyor. Gerekirse belirli levellerin elle çizilmiş hâlini koyabileceğin bir "level düzeltme" dosyası ekleyebilirim.

## 5. Veriden ilk gözlemler

Bunlar karar değil, bakılacak yerler.

| Level | Ortalama en kısa çözüm | En fazla | Zor + çok zor | Tahtada olup çözümde kullanılmayan mekanikli level |
|---|---|---|---|---|
| 1–100 | 4,7 | 7 | 13 | 18 |
| 101–200 | 5,8 | 9 | 18 | 42 |
| 201–300 | 6,7 | 9 | 18 | 65 |
| 301–400 | 6,9 | 10 | 20 | 63 |
| 401–500 | 7,1 | 13 | 18 | 65 |
| 501–600 | 7,6 | 11 | 20 | 62 |
| 601–700 | 7,5 | 11 | 20 | 65 |
| 701–800 | 7,8 | 11 | 20 | 67 |
| 801–900 | 7,8 | 11 | 20 | 65 |
| 901–1000 | 7,9 | 11 | 20 | 63 |

1. **Zorluk 500'den sonra düzleşiyor.** Ortalama en kısa çözüm 7,5–7,9 arasında kalıyor. Zorluğu bundan sonra yalnızca büyüyen grid ve karışan mekanikler taşıyor.
2. **Süs olarak duran mekanikler:** 200'den sonra her 100 levelin yaklaşık üçte ikisinde tahtada olup çözümde kullanılmayan bir mekanik var. Karışık levellerde yalnızca ilk mekaniğin gerekli olması şartı aranıyor, diğerleri tahtada kalabiliyor. Oyuncunun kafasını karıştırabilir de, tahtaya zenginlik de katabilir; bakılması gereken bir nokta.
3. **Sert düşüşler:** Çok zor bir levelden hemen sonraki kolay levelde en kısa çözüm 9–13'ten 4–5'e iniyor. Bu, 10'luk zorluk ritminin bilinçli bir "nefes alma" anı. Ama 484. level gibi 13'ten 5'e inen yerler fazla sert olabilir. Toplam 16 böyle düşüş var: 138, 188, 358, 418, 484, 574, 604, 636, 684, 728, 734, 801 …
4. **Yeni mekanik girişleri** her zaman 2 kolay levelle başlıyor; grafikte turuncu çizgilerden hemen sonra eğri kısa bir süre iniyor.

## 6. Önerini iletmek

- **Tabloda not:** Tabloya bir "not" sütunu ekleyip işaretlediğin levelleri ve beklediğin değişikliği yazabilirsin.
- **Doğrudan değişiklik:** Yukarıdaki değerleri doğrudan değiştirip levelleri yeniden üretebilirsin.
- Bunlar için kod yazmak gerekirse ya da üreticiye yeni bir kural lazımsa (örneğin "çok zor levelden sonraki level en fazla 3 hamle kısa olsun"), ne istediğini yazman yeterli.
