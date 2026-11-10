# Pofi: Buz Köyü — Tasarım durumu ve bitirme planı

Tarih: 10 Kasım 2026. Bu belge oyunun bugünkü hâlini alan alan özetler, eksikleri ve senden beklenen kararları listeler. `GDD.md` v0.2'de kaldı (köy süsleri dönemi). Kararlar alınınca GDD v1.0 bu belgeden yazılır ve tasarım "bitti" sayılır.

**Kısa özet:**
- **Oyun içeriği bakımından bitmiş durumda:**
  - 1000 level ve 21 mekanik var; zorluk dengesi ilk turdan geçti.
  - Köy metası, günlük sistemler ve 52 haftalık etkinlik takvimi hazır.
  - Hikâye var: 6 bölüm ve köylü hikâyeleri.
- **Eksik olan yeni özellik değil, şu dört alan:**
  1. Çevrimiçi altyapı: giriş, bulut kayıt, sunucu saati, uzaktan ayar.
  2. Gerçek para ve reklam altyapısı.
  3. Üretim motoru: Unity'ye taşıma.
  4. İlk saatin sadeleştirilmesi.
- **En büyük tasarım riski:** Hibrit-casual bir oyuna göre çok fazla sistem var (yaklaşık 30). Yeni özellik eklemek yerine açılış takvimini ve ekonomiyi sıkılaştırmak gerekiyor.

---

## 1. Oynanış

**Var olan**
- **Ana yol:**
  - 1000 level. Grid 3×4'ten 8×11'e büyür.
  - 21 mekanik: sonuncusu, ikinci penguen Pipi, level 500'de gelir.
  - Haritada 6 bölge var.
- **Yan içerik:**
  - 40 yan yol bulmacası: eve dön, kasa yerleştir, buz kır.
  - 6 usta kalesi.
  - Günlük bulmaca: aynı gün herkese aynı bulmaca.
  - Haftalık etkinlik: 15 temalı level ve tema kuralları (karanlık, ters kontrol, sıralı balık…).
- **Yardımlar:**
  - Sınırsız geri al.
  - İpucu: fiyatı gün içinde artar.
  - Rota göster ve +5 hamle.
  - Kazma, kürek ve düdük askıda.
- **Denge:** Zorluk sınıfları ölçülen zorluğa bağlandı (2026-11-10, `docs/denge/denge-rehberi.md` bölüm 7).

**Eksik / açık**
- **1000'den sonrası:**
  - Leveller oyun içinde üretiliyor.
  - Sınıf hedefi, yeni mekanik ve yeni bölge yok; hikâye "yol sürüyor" diye bitiyor.
  - Çoğu oyuncu buraya ulaşmaz, ama ulaşan en sadık oyuncudur.
- **Gerçek oyuncu verisi yok.** Zorluk ölçülen tahta özelliklerine göre ayarlandı; nerede takılındığını yalnızca oynanış verisi gösterir (soft launch).

**Karar**
- **K1. 1000 sonrası.** Önerim: ilk sürümde sonsuz üretim kalsın; güncellemelerle 100 levellik yeni bölgeler eklenir (yeni bölge, hikâye kartı, 1-2 mekanik).

## 2. Arayüz ve kullanıcı deneyimi

**Var olan**
- **Ekran sırası:** Funday Morning açılışı → giriş → oyunun kendi açılışı → ana sayfa.
- **Alt menü:** Mağaza, Gardırop, Ana sayfa, Köy, Ayarlar.
- **Ekranlar:** harita, etkinlik, görevler/başarımlar, köy, iglo içi, ziyaret.
- **Yeni özellik kartları:** Her özellik açılınca bir kez anlatılıyor.
- **Hareketi azalt** ayarı ve ses ayarları var; ekran okuyucu etiketleri eklendi.
- **Kayıt güvenliği:** yarım level kaldığı yerden sürüyor, kayıt yedekleniyor, yeni sürüm uyarısı veriliyor.

**Eksik / açık**
- **Sistem yoğunluğu (en önemli bulgu).** Oyuncu ilk saatlerde şunlarla karşılaşıyor:
  - **Günlük ve tekrar eden:** günlük ödül, günlük bulmaca, 3 günlük görev, haftalık etkinlik, yıldız sandığı, başarımlar.
  - **Koleksiyon:** albüm, gardırop.
  - **Köyde:** 16 yapı, iç mekân, süsler, 6 köylü ve dostluk hikâyeleri, kakao standı, sipariş panosu, aylık festival, gezgin tüccar, gazete, evcil dost, köy projeleri, balık pazarı.

  Her biri tek başına iyi, ama hepsi birlikte yorabilir. Bir kısmı köy seviyesine bağlı açılıyor; etkinlik kartı ve harita ise level 1'den görünüyor.
- **Giriş ekranı:** Google ve Apple düğmeleri çalışmıyor (sahte).
- **Ekran testleri:** Yalnızca tarayıcıda 375 px telefon boyutunda yapıldı. Gerçek cihazda dokunma, çentik ve performans testi yapılmadı.

**Karar**
- **K2. Açılış takvimi.** Önerim: ilk 15 dakikada yalnızca level, harita ve köy olsun. Diğerleri sırayla gelsin:
  - günlük ödül: 3. level sonrası
  - günlük bulmaca ve görevler: 8. level sonrası
  - haftalık etkinlik: 15. level sonrası
  - albüm: 12. level sonrası (bugünkü gibi)
  - köy alt sistemleri: köy seviyesine bağlı (bugünkü gibi)

  Bir bildirim rozeti ile oyuncu ne yeni açıldı, bilir. Bunu hazırlayıp sana önce tablo olarak gösteririm.

## 3. İç ekonomi

**Para birimleri**

| Birim | Nereden gelir | Nereye gider |
|---|---|---|
| **Coin** | level, yıldız, günlük ödül/bulmaca/görev, başarım, sandık, albüm, kakao, sipariş, evcil dost hediyesi, ziyaret, gazete | ipucu, rota, +5 hamle, stil/renk, iç mekân, süs, kıyafet/boya, evcil dost, kakao tarifi, köy projesi, festival bağışı, tüccar, kar tanesi takası, köy adı |
| **Kar tanesi** | level (1, 3 yıldızda +1), sandık, yan yol, usta, festival, takas | yalnızca yapı kurma/geliştirme (ilerlemenin hızını belirler) |
| **İpucu** | başlangıç 3, günlük ödül, görev sandığı, reklam (+10) | level içinde |
| **Etkinlik jetonu** | etkinlik haftası boyunca | etkinlik dükkânı; hafta bitince coin'e döner |
| Balık (yalnızca evcil dost yemi) | iskele (hafif idle) | evcil dostu beslemek |

**Gerçek para (şu an yer tutucu, satın alma yok):**
- "Reklamsız ödüller" $3.99
- Başlangıç paketi $1.99 (1000 coin, 5 ipucu, taç)

**Reklam:** yalnızca ödüllü reklam (ibreli x2–x5 çarpan, +5 hamle, ipucu, günlük ödül x2). Ara reklam hiç yok.

**Eksik / açık**
- **Uçtan uca ekonomi simülasyonu yapılmadı.**
  - 2026-11-04'te "coin fazla" bulgusu vardı; o zamandan beri harcama yerleri eklendi.
  - 1000 level boyunca gün gün coin ve kar tanesi akışı hiç hesaplanmadı.
  - Bu artık bizim işimiz (denge bizde). Önerim: `tools/ekonomi-sim.mjs` yazayım. Bulguları ve önerdiğim sayı değişikliklerini sana göstereyim; sen onaylamadan bir şey değiştirmem.
- **Mağaza kataloğu eksik:**
  - coin paketi yok
  - ipucu paketinin gerçek para karşılığı yok
  - kozmetik paket yok
  - Kar tanesi gerçek parayla satılmalı mı? Ben satılmamasını öneriyorum, ilerleme satın alınamasın.

**Karar**
- **K3. Mağaza kataloğu.** Önerim:
  - Reklamsız ödüller ($3.99) ve başlangıç paketi ($1.99) aynen kalsın.
  - 3 coin paketi eklensin.
  - Mevsimlik kozmetik paketler eklensin: tüccar kıyafeti ve süs.
  - Kar tanesi satılmasın.

  Fiyatlar ekonomi simülasyonundan sonra kesinleşir.

## 4. Başarımlar ve görevler

**Var olan**
- 21 başarım, her biri 3–6 kademe; kademe ödülleri artıyor.
- 9 türden her gün 3 günlük görev; üçü bitince sandık.
- Usta rozetleri.
- "Beklenenden az hamle" başarımı bilerek yok.

**Eksik / açık**
- **Platform başarımları:** Google Play Games ve Game Center karşılıkları seçilmedi. Mağazada "başarımlar" görünürlüğü için önerilir; çevrimiçi kararına bağlı.

**Karar:** Ayrı karar gerekmiyor. Tasarım tamam; platform eşleştirmesi K4 ile birlikte yapılır.

## 5. Çevrimiçi özellikler

**Var olan (sunucusuz)**
- **Haftalık etkinlik:** cihaz saatiyle dönüyor; saat ileri alınarak hile yapılabilir.
- **Günlük bulmaca:** tarihten üretiliyor, herkese aynı.
- **Arkadaş köyü ziyareti:** köy bağlantının içine kodlanıyor; ziyaret eden günde 3 köyden hediye alıyor. Ziyaret edilen haberdar olmuyor.
- **Kayıt:** cihazda tutuluyor; yedek kodu ile elle taşınıyor.
- **Oynanış verisi:** yalnızca cihazda.
- **Reddedilenler:** sohbet ve çok oyunculu mod.

**Eksik / açık**
- Giriş ve bulut kayıt yok. Telefon değişince ilerleme kaybolur (yedek kodu dışında).
- Uzaktan ayar (Remote Config) yok: ekonomi ve etkinlik değişikliği için güncelleme gerekiyor.
- Sunucu saati yok.
- Analitik yok: soft launch ölçümü (D1/D7, takılma noktaları) bunsuz yapılamaz.
- Bildirim yok: "stant doldu", "festivalin son günü".
- Sıralama tablosu yok.

**Karar**
- **K4. Çevrimiçi kapsam ve servis.** Önerim, ilk sürüm için "temel paket" (giriş, bulut kayıt, sunucu saati, uzaktan ayar, analitik):
  - Giriş: Google Play Games ve Apple.
  - Unity seçildiği için Unity Gaming Services (Authentication, Cloud Save, Remote Config, Analytics). Firebase de olur.
  - Sıralama tablosu isteğe bağlı: yalnızca günlük bulmaca ve etkinlik için, arkadaşlar arası. Çok oyunculu değil.

## 6. Hikâye

**Var olan**
- **Ana hikâye ("Pofi'nin yolu"):**
  - Her bölge sonunda bir kart; 6 bölüm.
  - Pofi tek başına koya gelir, köyü kurar, haritayı izleyip Kristal Zirve'ye çıkar.
  - Sonunda anlar: hazine, köyün kendisidir.
- **Köylüler:**
  - 6 köylü: Bobo, Lili, Kiko, Nana, Tipi, Mavi.
  - Her biri dostluk seviyesine bağlı 3 bölümlük hikâye.
  - Sohbet satırları.
- **Diğer:**
  - Kaptan Mors (tüccar).
  - Konuk Foki (etkinlik).
  - Pipi (level 500'de ikinci penguen).
  - Kakaonun hikâyesi (GDD 12.2).
  - Haftalık gazete ve bilmeceler.

**Eksik / açık**
- Hikâye yalnızca yazı; bölüm kartlarında görsel yok.
- Pipi'nin gelişi yalnızca bir mekanik kartı. Hikâyede yeri yok; level 500, 3. ve 4. bölüm arasına düşüyor.
- Açılışta Pofi'nin koya gelişini anlatan kısa bir sahne yok. İlk bölüm ancak level 100'de açılıyor.

**Karar**
- **K5. Hikâye görselleri.** Önerim:
  - 6 bölüm kartına birer görsel ve kısa bir açılış sahnesi: 3 kare, Pofi oltasıyla koya gelir.
  - Pipi'nin gelişine 500'de kısa bir kart.

  Görsel oturumunda maliyeti gösterilerek üretilir; tahminen 10 görsel × ~$0,03, ~$0,30 artı tekrar payı.

## 7. Ses ve müzik

**Var olan:** 5 parça ve kazanma jingle'ı. Ses efektleri kodla üretiliyor. Ortam sesi hafif.

**Eksik:** Şu parçalar Mustafa'dan bekleniyordu, ama Mustafa yoğun:
- level 136+
- zor leveller
- günlük bulmaca
- 4 etkinlik
- köy büyüdü
- bir daha dene
- açılış

**Karar**
- **K6. Müzik.** Önerim: `docs/pofi-muzik-suno.html` içindeki tariflerle eksikleri biz üretelim (Suno), seçimi sen yap.

## 8. Görsel

**Bekleyen (görsel oturumu, maliyet onayıyla):**
- geniş Buzul Koyu zemini
- köy büyüme görselleri
- hikâye görselleri (K5)
- mağaza görselleri: ikon, ekran görüntüleri, tanıtım görseli

## 9. Yayın ve üretim

**Durum**
- **Motor:** Unity'ye taşıma kararı var (2026-11-03, `docs/unity-tasima-plani.md`). Şartı "denge bitince" idi; ilk denge turu bitti.
- **Web sürümü:** prototip ve görünüm referansı olarak kalıyor.
- **Mağaza adı:** marka kontrolü (TÜRKPATENT, EUIPO, USPTO) yapılmadı.

**Yayın öncesi zorunlular**
- gizlilik metni
- yaş derecelendirmesi
- reklam SDK'sı
- satın alma
- mağaza sayfası
- gerçek cihaz testi

**Karar**
- **K7. Üretim yolu.**
  - Seçenek A: Unity taşımasına şimdi başlamak.
  - Seçenek B: Önce tasarımı web'de kesinleştirmek (K2, ekonomi simülasyonu, K4'ün tasarımı), sonra taşımak.

  Önerim B: Taşıma büyük bir iş; değişen her sistem iki kez yazılmasın.
- **K8. Hedef kitle ve pazar.**
  - **Yaş:** 13 yaş altı hedefleniyorsa Google Families ve COPPA kuralları reklam SDK'sını, veri toplamayı ve girişi kısıtlar.
  - **Pazar ve dil:** İngilizce daha önce reddedildi. Bu durumda yayın yalnızca Türkiye pazarı olur. Bu bilinçli bir karar mı?

---

## Bitirme yol haritası (öneri)

| Aşama | İçerik | Kimde |
|---|---|---|
| 1. Tasarımı kilitle | K1–K8 kararları; açılış takvimi; ekonomi simülasyonu ve ayarları; GDD v1.0 | biz (bu oturum) + senin onayın |
| 2. Eksik içerik | hikâye görselleri, eksik müzikler, geniş köy zemini, mağaza görselleri | görsel oturumu + müzik |
| 3. Üretim | Unity taşıma (plan hazır), çevrimiçi servisler, reklam ve satın alma SDK'ları | biz |
| 4. Soft launch | sınırlı ülke/kitle, D1/D7, takılma noktaları, ekonomi ayarı (uzaktan ayar ile) | biz + veri |
| 5. Yayın | mağaza sayfası, marka tescili, gizlilik, yaş derecelendirmesi | sen (hesaplar, yasal) + biz |
