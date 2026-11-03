# Pofi: Buz Köyü — Unity'ye taşıma planı

Tarih: 3 Kasım 2026. Karar: üretim motoru Unity. Web sürümü (thorehan.github.io/pofi-buz-koyu) prototip ve **görünüm/davranış referansı** olarak kalıyor.

## 1. İlkeler

1. **Görünüm birebir:** Her ekran web sürümüyle yan yana karşılaştırılır (390×844 telefon boyutu). Kabul ölçütü, tasarımcının fark görmemesi.
2. **Davranış birebir:** Aynı level aynı hamlelerle aynı sonucu verir. 1000 levelin hepsi Unity'de çözülür ve en kısa hamle sayıları web ile karşılaştırılır; tek fark bile kabul edilmez.
3. **Veri koddan ayrı:** Ekonomi, yapılar, etkinlik takvimi, level listesi gibi her şey veri dosyasında durur. İleride uzaktan ayar (Remote Config) ile değiştirilebilir.
4. **Oynanış dengesi Mustafa'da:** Level zorluğu kodla değil, Mustafa'nın düzenleyebileceği veriyle ayarlanır. Ona tablo ve editör aracı hazırlanır.

## 2. Mevcut durum

| Web dosyası | Satır | İçerik | Unity karşılığı |
|---|---|---|---|
| engine.js | 683 | kayma kuralları, çözücü, level üreticisi | `Pofi.Core` (Unity'den bağımsız saf C#) |
| board.js | 1047 | tahta çizimi, animasyon, girdi, parçacıklar | `BoardView` sahnesi, sprite havuzu, ParticleSystem |
| village.js | 2402 | köy sahnesi, yapılar, köylüler, müşteriler, süsler, etkinlik çadırı | `Village` sahnesi (en büyük iş) |
| main.js | 1781 | ekranlar, akış, ekonomi, ödüller, etkinlik ekranı | ekran yöneticisi ve servisler |
| interior.js | 487 | iglo içi | `Interior` ekranı |
| draw.js | 520 | Pofi, kıyafet çapaları, fok, balık | `PofiRig` (sprite ve çapa noktaları) |
| live.js | 156 | etkinlik takvimi, jeton, köy paylaşımı | `LiveOps` |
| config.js | 385 | bütün denge değerleri ve tablolar | ScriptableObject ve JSON |
| save.js, meta.js | 136 | kayıt, köy hesapları | `SaveSystem`, `Meta` |
| sound.js | 261 | kodla üretilen sesler | `SfxSynth` (aynı formüllerle C#'ta) |
| index.html + style.css | 911 | bütün arayüz | uGUI + TextMeshPro |
| assets/art | 349 dosya, 13 MB | bütün görseller (webp) | PNG asıllarından içe aktarma |

Kurulu araçlar: Unity 2022.3.62f3 ve Android modülü (Hub). iOS derlemesi için Mac gerekiyor.

## 3. Teknik seçimler (öneri)

| Konu | Öneri | Neden |
|---|---|---|
| Unity sürümü | **Unity 6 LTS** (kurulu 2022.3 ile başlanabilir) | 2022.3'ün resmi destek süresi doldu. Mağaza gereksinimleri (Android hedef API) için güncel LTS daha güvenli. Karar sizde. |
| Render | URP 2D | Karanlık tahta için 2D ışık, parıltılar için hafif glow |
| Arayüz | uGUI + TextMeshPro | Mobilde oturmuş bir sistem. Türkçe karakterler (ı, ş, ğ) için font atlası hazırlanır. Fredoka fontu kullanılır. |
| Girdi | Input System | Kaydırma ve dokunma |
| Animasyon | Kendi küçük tween sınıfımız | Dış bağımlılık yok; web'deki zamanlamalar (STEP 0.075 sn) birebir aktarılır |
| Görseller | PNG asıllarından (FundayMorningArt/out), Sprite Atlas, ASTC sıkıştırma | webp'ler kayıplı kopya; asıllar daha temiz |
| Uzaktan içerik | Addressables (2. aşamada) | Etkinlik görsellerini uygulama güncellemesi olmadan indirmek için |
| Servisler | Unity Gaming Services: Remote Config, Analytics, Cloud Save, Leaderboards | Unity'yle tümleşik. Alternatifi Firebase. |
| Reklam | LevelPlay (Unity Ads + AdMob arabulucu) | Yalnızca ödüllü reklam, ara reklam yok (kalıcı karar) |
| Satın alma | Unity IAP | "Reklamsız ödüller" ve coin paketleri |
| Giriş | Google Play Games, Sign in with Apple, misafir | Web'deki giriş ekranının karşılığı |

## 4. Aşamalar

Büyüklük göreli: S küçük, M orta, L büyük, XL çok büyük. Her aşamanın sonunda Android test derlemesi (APK) çıkar ve telefonda denenir.

### U0 · Kurulum (S)
- Yeni repo `pofi-unity`, Unity projesi, klasör yapısı (`Assets/Pofi/{Art,Data,Scripts,Prefabs,Scenes,Tests}`).
- Görsel içe aktarma aracı:
  - PNG asılları kopyalanır.
  - Pivotlar `scales.json`'dan ve web'deki çapalardan ayarlanır: yapılarda taban 496. satır, nesnelerde 236, süslerde 248, şapka bandında 340.
- Komut satırından Android derlemesi. Unity'yi batchmode çalıştırıp testleri ben koşabilirim.
- **Bitti sayılır:** boş sahne telefonda açılıyor; görseller doğru pivotlarla içeride.

### U1 · Çekirdek motor (M)
- engine.js → C#: kurallar (11 + 9 mekanik, Pipi), çözücü (BFS) ve level üreticisi.
- RNG (mulberry32) bit bit aynı yazılır. Böylece günlük bulmaca ve etkinlik levelleri web ile aynı çıkar.
- EditMode testleri:
  - 1000 levelin hepsi çözülür, `min` değerleri birebir tutar.
  - Örnek leveller üreticiden aynı satırlarla çıkar.
- **Bitti sayılır:** bütün testler yeşil.

### U2 · Oyun tahtası (L)
- Karo ve nesne sprite'ları, hamle animasyonu: kayma, rampadan uçuş, ışınlanma, sal, kasa ve kar topu, foklar.
- Pofi pozları ve kıyafet çapaları (draw.js'teki `POFI` tablosu); Pipi.
- Kaydırma ve dokunma girdisi, ipucu oku, eğitim eli.
- Parçacıklar: balık yıldızları, kar tozu, konfeti, buz parıltısı, karanlık tahta (2D ışık), ters kontrol.
- **Bitti sayılır:** 20 örnek level web'le yan yana aynı görünüyor ve aynı oynanıyor.

### U3 · Oyun akışı (M)
- Level başlat, kazan, kaybet; yıldızlar; sonuç ekranı ve çarpan çarkı.
- Hamle sınırı ve devam; ipucu ekonomisi (merdiven fiyat, kilit, el işareti); geri al, baştan başla; mekanik tanıtım pencereleri.

### U4 · Ana ekran, menüler, ekonomi, kayıt (M)
- Açılış, giriş ve tanıtım; ana sayfa ve kartlar; alt menü.
- Günlük ödül ve günlük bulmaca; mağaza; ayarlar.
- Kayıt sistemi: JSON, sürüm taşıma (migration).

### U5 · Köy (XL) — en büyük iş
- **Sahne ve sıralama:** Yatay kayan paneller ve arazi açma; yakınlaşan kamera. Derinlik sıralaması y'ye göre; iskele gibi yassı yapılar üst kenarına göre.
- **Yapılar:** 16 yapı × 3 stil × 5 seviye; seviye atlama, stil ve renk.
  - Renk boyama: web'de piksel piksel yapılan "vurgu bölgesi" boyaması Unity'de shader ile yapılır.
  - Vurgu maskeleri bir araçla önceden çıkarılır, böylece oyunda hesaplanmaz.
- **Köy yaşamı:** Köylüler ve saat rutini; kakao standı ve satış yürüyüşü; yüzen müşteriler, sohbet balonları.
- **Etkinlik ve süsler:** Süsleme modu; etkinlik çadırı, Foki, flamalar, yağışlar.
- **Gece ve gökyüzü:** Gece kararması, kuzey ışıkları, havai fişek.

### U6 · Diğer ekranlar (M)
- İglo içi (6 yuva × 3 kademe), gardırop (yüzen eylem çubuğu dahil).
- Etkinlik ekranı: takvim, jeton, 15 level, ödül yolu, dükkân; köy ismi.
- Arkadaş köyü: paylaşım bağlantısı → uygulama içi derin bağlantı.

### U7 · Ses (S)
- sound.js'teki sesler aynı formüllerle C#'ta üretilir (ton, gürültü, filtre); sonuç aynı ses olur.
- Rüzgâr çanı ortam sesi; Suno müzikleri gelince müzik kanalı ve geçişler.

### U8 · Servisler (L)
- Ödüllü reklam (LevelPlay), satın alma (IAP), giriş, analitik (web'deki `track` olaylarının listesi aynen), Remote Config (ECON değerleri).
- Bulut kayıt; sonra sıralama ve arkadaş listesi.
- Mağaza hesapları (Google Play Console, Apple Developer) sizin tarafınızda açılmalı.

### U9 · Test ve yayın (M)
- Düşük seviyeli Android'de performans; çentik ve güvenli alanlar.
- Kapalı test (Google Play internal testing), mağaza görselleri, gizlilik metni.
- iOS derlemesi için Mac.

**Sıra:** U0 → U1 → U2 → U3 → U4 → U5 → U6 → U7 → U8 → U9. U1 bitince oyunun kalbi doğrulanmış olur. U2 ile U3 bitince telefonda oynanabilir bir sürüm çıkar; Mustafa bu noktadan itibaren telefonda denge testi yapabilir.

## 5. Görünüm eşleştirme

- **Referans görüntüler:** Web sürümünden her ekranın görüntüsü alınır (390×844). Unity'de aynı ekran açılıp karşılaştırılır.
- **Kodla çizilenler listesi:** Unity'de ayrıca yapılması gerekenler aşağıda. Her biri işaretlenerek ilerlenir.
  - Tahta: buz parıltısı, kar tozu, balık yıldızları, konfeti, karanlık tahta, ipucu oku, eğitim eli, sıralı balık rozeti, rüzgâr yönü oku.
  - Pofi: kayarken kar savruntusu, nefes alma, çarpınca toparlanma, sevinç zıplaması.
  - Köy:
    - patikalar ve 2. panel zemini;
    - flamalar, kar yağışı, etkinlik yağışları, havai fişek, uçan fenerler;
    - kamp ateşi, zzz, görev işaretleri, fincan balonu, coin uçuşu;
    - yüzme dalgaları, konuşma balonları;
    - etkinlik çadırı, Foki'nin şapkası;
    - kilitli arazi tabelası, panel okları.
  - Arayüz: bütün kartlar, pencereler, ilerleme çubukları, kutucuklar, alt menü.
- **Emoji sorunu:** TextMeshPro renkli emojiyi güvenilir göstermiyor.
  - Etkinlik jetonlarının 13'ünün görseli var. Kalan 28 tema için jeton görseli gerekiyor; yoksa genel bir jeton sprite'ı kullanılır.
  - Sohbet balonlarındaki emojiler sprite olur.

## 6. Riskler

| Risk | Önlem |
|---|---|
| Köy sahnesinin büyüklüğü (2400 satır, çok sayıda kodla çizim) | U5'i alt parçalara bölmek; her parça sonunda karşılaştırma |
| Renk boyamanın aynı sonucu vermesi | Vurgu maskelerini Python aracıyla web'deki kurallarla çıkarmak, shader yalnızca boyasın |
| Level üreticisinin farklı sonuç vermesi | RNG ve sayısal işlemleri bit bit aynı yazmak; 1000 level ve örnek üretim testleri |
| Ses farkı | Aynı sentez formülleri; gerekirse web'den kaydedilen referans seslerle kulak testi |
| iOS | Mac ve Apple Developer hesabı gerekli; şimdiden planlanmalı |
| Web ile Unity'nin ayrışması | Taşıma bitene kadar web'e yeni özellik eklenmez ya da her ekleme iki tarafa da yapılır (karar sizde) |

## 7. Roller

- **Kod (Claude):** Bütün C# kodu, araçlar, testler, Android derlemeleri.
- **Oynanış dengesi (Mustafa):**
  - Level verisi ve zorluk ayarları ScriptableObject'te; Unity'de level görüntüleyici ve ayar ekranı.
  - Her level için tablo: grid, en kısa çözüm, hamle sınırı, mekanikler, zorluk sınıfı.
- **Görseller (görsel oturumu):** Eksik parçalar: kalan etkinlik jetonları, gerekirse arayüz simgeleri.
- **Siz:** Kararlar, telefon testleri, mağaza hesapları, müzik.

## 8. Sizden gereken kararlar

1. Unity sürümü: Unity 6 LTS (önerilen) mi, kurulu 2022.3.62 mi?
2. Servis sağlayıcı: Unity Gaming Services (önerilen) mı, Firebase mi?
3. Reklam ağı: LevelPlay (önerilen) mı, yalnız AdMob mu?
4. Web sürümü: taşıma süresince dondurulsun mu (önerilen), yoksa yeni özellikler iki tarafa da mı eklensin?
5. iOS için Mac var mı? Yoksa ilk sürüm yalnız Android mi?

## 9. İlk somut adımlar (karar sonrası)

1. `pofi-unity` reposu ve Unity projesi; görsel içe aktarma aracı (U0).
2. engine.js → C# ve 1000 level testleri (U1). Görsel olmadan bütün kuralların doğrulanması.
3. Mustafa için level tablosu (CSV), web'deki 1000 levelden hemen çıkarılabilir.
