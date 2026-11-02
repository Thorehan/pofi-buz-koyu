# Pofi: Buz Köyü

**Funday Morning Games** · 2D mobil bulmaca · prototip v0.1.0

Pofi'yi kaydır, bir şeye çarpana kadar kaysın. Tüm balıkları topla, kazandığın kar taneleriyle köyünü kur, her yapının stilini seç, Pofi'yi giydir.

## Oynanış
- **Kaydır** (masaüstünde ok tuşları / WASD): Pofi o yönde bir şeye çarpana kadar kayar.
- **Neden-sonuç:** Kasaya çarpınca kasa da kayar. Suya düşen kasa köprü olur. Çatlak buz arkanda kırılır. Kol kapıları açıp kapatır. Oklar yön değiştirir. Rampa Pofi'yi 2 kare uçurur; fazla uçmak sıkıştırabilir.
- **Geri al** sınırsız ve ücretsiz (Z / Backspace). **İpucu** bulunduğun yerden en kısa çözümün sıradaki hamlesini gösterir.
- **Köy:** Her level 1 kar tanesi verir, 3 yıldız +1 daha. 12 yapı Lv1'den Lv3'e yükselir; her seviye görünümü güzelleştirir ve yapının buff'ını büyütür. Toplam yapı seviyesi köy seviyesini belirler. Her köy seviyesi yeni bir görsel, coin bonusu ve ödül sandığı verir.
- **Önizlemeli satın alma:** Stil, renk ve kıyafetler önce sahnede denenir, beğenilirse alınır.
- **Gardırop:** Şapka ve atkı; seçilen kıyafet oyunda da görünür.

## Yerelde çalıştırma
```bash
python -m http.server 5174
```
Sonra `http://localhost:5174` adresini aç.

## Level üretimi
```bash
node tools/gen-levels.mjs 300
```
İlk 300 leveli üretir, her birini çözücüyle doğrular ve `data/levels.json` dosyasına yazar. Bir level ancak şu şartları sağlarsa kabul edilir: en kısa çözümü hamle bandında olmalı ve o aşamanın yeni mekaniği çözüm için **gerçekten gerekli** olmalı. Mekanik etkisizleştirildiğinde bulmaca ya çözülemez hale gelmeli ya da en kısa çözümü değişmeli. 300'den sonraki leveller oyun sırasında aynı kodla üretilir.

## Proje yapısı
| Dosya | İçerik |
|---|---|
| `GDD.md` | Oyun tasarım dokümanı |
| `js/engine.js` | Kayma kuralları, BFS çözücü, level üreticisi (tarayıcı + Node) |
| `js/board.js` | Tahta çizimi, kayma animasyonu, kaydırma/klavye girdisi |
| `js/draw.js` | Pofi karakteri (kıyafetleriyle) ve balık çizimi |
| `js/village.js` | Pofi'nin köyü: 12 yapı × 3 seviye × 3 stil + renk paleti, köy seviyesi efektleri, kamera |
| `js/meta.js` | Köy hesapları: yapı seviyeleri, buff'lar, köy seviyesi, indirimler |
| `js/main.js` | Ekranlar ve oyun akışı |
| `js/sound.js` | Web Audio ile üretilen sesler |
| `js/ads.js` | Reklam simülasyonu + analitik (gerçek SDK burada bağlanacak) |
| `js/config.js` | Ekonomi, reklam kuralları, köy ve gardırop verileri |
| `tools/gen-levels.mjs` | Çevrimdışı level üretimi |
