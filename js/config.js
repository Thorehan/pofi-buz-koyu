// Tüm denge değerleri burada. İleride Remote Config'ten gelecek.

export const TIER_LABEL = { easy: '', medium: '', hard: 'ZOR', veryhard: 'ÇOK ZOR' };

export const ECON = {
  coin: { easy: 20, medium: 25, hard: 35, veryhard: 50 },
  coinPerStar: 5,
  hintBase: 50, // tek ipucu: gün içinde her alımda 2 katı (50, 100, 200, 400…), gün dönünce baştan
  hintGameMult: 1.5, // oyun içinden almak mağazadan bu kadar pahalı
  hintGamePack5: 300, // oyun içi 5'li paket (mağazada hintPack5Cost)
  hintAdAmount: 10, // ödüllü reklam bu kadar ipucu verir

  continueMoves: 5,
  startCoins: 100,
  startHints: 3,
  freeCoinAmount: 50,
  freeCoinPerDay: 5,
  hintPack5Cost: 200,
  starFlake: 1, // 3 yıldıza ek kar tanesi
};

// İç mekân (GDD 12.3): yapıya girilip yuvalara eşya yerleştirilir. Her yuvanın 3 kademesi sırayla alınır,
// önce odada önizlenir. Tamamen coin harcama yeri (görünüm); fiyatlara kale indirimi uygulanır.
export const INTERIOR = {
  igloo: {
    title: 'İglonun içi',
    slots: [
      { id: 'bed', name: 'Yatak', items: [{ name: 'Hasır yatak', price: 200 }, { name: 'Yorganlı yatak', price: 600 }, { name: 'Cibinlikli yatak', price: 1500 }] },
      { id: 'rug', name: 'Halı', items: [{ name: 'Yuvarlak kilim', price: 150 }, { name: 'Desenli halı', price: 450 }, { name: 'Yıldızlı halı', price: 1100 }] },
      { id: 'lamp', name: 'Lamba', items: [{ name: 'Mum', price: 150 }, { name: 'Gaz lambası', price: 500 }, { name: 'Aurora avizesi', price: 1200 }] },
      { id: 'shelf', name: 'Raf', items: [{ name: 'Tahta raf', price: 200 }, { name: 'Kitaplık', price: 550 }, { name: 'Kupa dolabı', price: 1300 }] },
      { id: 'window', name: 'Pencere', items: [{ name: 'Buz pencere', price: 250 }, { name: 'Perdeli pencere', price: 600 }, { name: 'Vitray pencere', price: 1400 }] },
      { id: 'wall', name: 'Duvar süsü', items: [{ name: 'Balık tablosu', price: 150 }, { name: 'Çam çelengi', price: 450 }, { name: 'Aurora halısı', price: 1000 }] },
    ],
  },
};

// Kakao: stant saatte fincan üretir (BUILDINGS.cocoa), Pofi fincanları yolculara satar.
// Tarifler sırayla alınır ve fincan fiyatını kalıcı olarak artırır (coin harcama yeri, kendini geri öder).
export const COCOA = {
  cupPrice: 5,
  recipes: [
    { id: 'cinnamon', name: 'Tarçın', add: 1, price: 300, vl: 1 },
    { id: 'marshmallow', name: 'Marşmelov', add: 1, price: 800, vl: 2 },
    { id: 'caramel', name: 'Karamel', add: 2, price: 2000, vl: 4 },
    { id: 'aurora', name: 'Kuzey ışığı köpüğü', add: 2, price: 4500, vl: 6 },
  ],
};

// Ara reklam yok; yalnızca oyuncunun seçtiği ödüllü reklamlar.
export const ADS = {
  rewardedSec: 3, // simülasyon süresi
  noThanksDelayMs: 1500,
};

export const MULT_ZONES = [
  { m: 2, w: 20 }, { m: 3, w: 15 }, { m: 4, w: 10 }, { m: 5, w: 10 },
  { m: 4, w: 10 }, { m: 3, w: 15 }, { m: 2, w: 20 },
];

// Yeni mekaniklerin tanıtıldığı leveller; icon: tahtada çizilecek örnek karo.
export const INTRO = {
  1: { title: 'Kaydır!', text: 'Pofi bir şeye çarpana kadar kayar. Tüm balıkları topla.', icon: 'fish' },
  4: { title: 'Kar', text: 'Kara gelen Pofi orada durur. Kayışı durdurmak için karı kullan.', icon: 'snow' },
  9: { title: 'Kasa', text: 'Kasaya çarpınca kasa da kayar ve bir şeye çarpana kadar gider. Kasayı yeni bir duvar gibi kullan.', icon: 'crate' },
  17: { title: 'Su ve köprü', text: 'Pofi suya giremez. Ama kasayı suya iterek köprü yapabilirsin.', icon: 'water' },
  27: { title: 'Çatlak buz', text: 'Çatlak buz, Pofi üzerinden geçince kırılır ve suya döner. Sırayı iyi planla.', icon: 'crack' },
  37: { title: 'Kol ve kapılar', text: 'Kola çarpınca tüm buz kapıları açılır ya da kapanır.', icon: 'lever' },
  49: { title: 'Oklar', text: 'Ok karosuna gelen Pofi ve kasalar okun yönüne döner.', icon: 'arrow' },
  76: { title: 'Buz delikleri', text: 'Bir delikten giren, eşinden aynı yönde çıkar ve kaymaya devam eder. Kasalar da geçer. Çıkış doluysa delik duvar gibidir.', icon: 'hole' },
  91: { title: 'Eriyen kar', text: 'Eriyen kar seni bir kez durdurur; üzerinden ayrılınca erir ve buza döner. Frenini dikkatli kullan!', icon: 'melt' },
  106: { title: 'Fok', text: 'Fok her hamlenden sonra bir adım yürür ve önü kapanınca geri döner. Seni de kasaları da durdurur; zamanlamayı iyi ayarla.', icon: 'seal' },
  121: { title: 'Sıralı balıklar', text: 'Numaralı balıkları sırayla topla. Sırası gelmeyen balığın üstünden geçersin ama onu alamazsın.', icon: 'order' },
  140: { title: 'Basınç plakası', text: 'Yeşil kapılar, plakanın üstünde bir şey durduğu sürece açıktır. Plakaya bir kasa it ya da üstünde dur.', icon: 'plate' },
  165: { title: 'Döner tabla', text: 'Üstünden geçen Pofi ve kasalar sağına döner ve yeni yönde kaymaya devam eder. Tabladaki ok, Pofi\'nin geleceği yönden nereye çıkacağını gösterir.', icon: 'turn' },
  195: { title: 'Kırılgan kaya', text: 'Açık renkli kaya ilk çarpmada çatlar, ikinci çarpmada kırılıp buza döner. Yol açmak için iki kez çarp!', icon: 'fragile' },
  230: { title: 'Sarkıt', text: 'Sarkıtın altından geçtiğinde arkandan düşer ve orası kayaya dönüşür. O yoldan bir kez geçebilirsin.', icon: 'icicle' },
  270: { title: 'Kar topu', text: 'Kar topunu itince kayar; durduğu yerde dağılıp kar yığını olur. Kendi frenini istediğin yere kur!', icon: 'ball' },
  315: { title: 'Anahtar balık', text: 'Altın anahtar balığı al; tahtadaki bütün buz kilitleri açılır.', icon: 'key' },
  365: { title: 'Buz salı', text: 'Sala bin: sal seni suyun üstünde karşı kıyıya taşır ve orada kalır. Dönüş yolunu iyi düşün.', icon: 'raft' },
  430: { title: 'Rüzgâr bayrağı', text: 'Her hamlenden sonra rüzgâr seni bayrağın gösterdiği yöne bir kare iter, sonra bayrak çeyrek tur döner.', icon: 'wind' },
  500: { title: 'Pipi geldi!', text: 'Pofi artık yalnız değil. Bir penguene dokunarak seç, sonra kaydır. İki penguen birbirine fren olabilir; balıkları hangisi alırsa sayılır.', icon: 'pipi' },
  61: { title: 'Rampa', text: 'Rampaya kendi yönünde girersen 2 kare uçarsın; su ve kaya altında kalır. Ama dikkat: uçtuğun balığı alamazsın ve fazla uçmak seni bir adaya hapsedebilir!', icon: 'ramp' },
};

// 7 günlük giriş ödülü; gün kaçırılırsa seri 1. güne döner. Reklamla x2.
export const DAILY_REWARDS = [
  { coins: 50 }, { hints: 1 }, { coins: 100 }, { flakes: 1 },
  { coins: 150 }, { hints: 2 }, { coins: 300, hints: 3 },
];
export const DAILY_PUZZLE = { unlockLevel: 5, coins: 100, streakBonus: 20 };

// ---------- Pofi'nin köyü (GDD 4) ----------
// costs: [kurulum, Lv2, Lv3, Lv4, Lv5] kar tanesi; Lv4-5 Bölge 2'de açılır. values: seviye başına buff; base: yapı yokken.
// unlock: yapının açıldığı köy seviyesi. Stilin ilki kurulumla gelir, diğerleri coin ile.
export const ZONES = [
  { name: 'Bölge 1 · Buzul Koyu', maxLevel: 3, fromVillageLevel: 1 },
  { name: 'Bölge 2 · Kuzey Işıkları', maxLevel: 5, fromVillageLevel: 8 },
];
// Köy yana doğru genişler: her bölge ekran genişliğinde bir paneldir. İlki ücretsiz; sonrakiler köy
// seviyesi şartıyla coin'le açılır (arazi), içindeki yapılar kar tanesiyle kurulur. soon: içeriği henüz yok.
// Zemin ve gökyüzü tek parça görsel (bg_village_pano, bg_sky_pano): üç panelin toplam genişliğine çizilir.
export const DISTRICTS = [
  { id: 'bay', name: 'Buzul Koyu', price: 0, vl: 1 },
  { id: 'harbor', name: 'Buz Limanı', price: 2000, vl: 5, text: 'Yolcu teknesi, liman kafesi, balık pazarı ve liman çanı' },
  { id: 'forest', name: 'Çam Ormanı', price: 5000, vl: 9, projects: true, text: 'Köy projeleri: sıcak kaplıca, saat kulesi ve telesiyej' },
];

export const BUILDINGS = [
  { id: 'igloo', name: 'İglo', costs: [1, 3, 6, 9, 12], unlock: 1, styles: ['Klasik', 'Kristal', 'Kar evi'], stylePrice: 120, buff: 'coinPct', values: [0.1, 0.2, 0.3, 0.4, 0.5] },
  { id: 'pier', name: 'Balık iskelesi', costs: [2, 3, 6, 9, 12], unlock: 1, styles: ['Meşe', 'Kızıl ahşap', 'Gri taş'], stylePrice: 100, buff: 'fishCoin', values: [1, 2, 3, 4, 5] },
  { id: 'snowman', name: 'Kardan adam', costs: [2, 4, 7, 11, 14], unlock: 1, styles: ['Havuç burunlu', 'Atkılı', 'Silindir şapkalı'], stylePrice: 100, buff: 'hardMoves', values: [1, 2, 3, 3, 4] },
  { id: 'cocoa', name: 'Kakao standı', costs: [2, 4, 7, 11, 14], unlock: 1, styles: ['Tenteli', 'Kulübe', 'Karavan'], stylePrice: 120, buff: 'cocoa', values: [4, 8, 12, 16, 20] },
  { id: 'lights', name: 'Fener dizisi', costs: [3, 4, 7, 11, 14], unlock: 1, styles: ['Sıcak sarı', 'Renkli', 'Buz mavisi'], stylePrice: 120, buff: 'freeHints', values: [1, 2, 3, 4, 5] },
  { id: 'tree', name: 'Çam ağacı', costs: [3, 5, 8, 12, 16], unlock: 1, styles: ['Sade', 'Süslü', 'Karlı'], stylePrice: 120, buff: 'dailyPct', values: [0.25, 0.5, 1, 1.5, 2] },
  { id: 'rink', name: 'Buz pisti', costs: [3, 5, 8, 12, 16], unlock: 1, styles: ['Buz', 'Gökkuşağı', 'Gece'], stylePrice: 150, buff: 'x5', base: 10, values: [14, 18, 22, 26, 30] },
  { id: 'sled', name: 'Kızak tepesi', costs: [4, 5, 8, 12, 16], unlock: 1, styles: ['Kızak', 'Kayak', 'Snowboard'], stylePrice: 150, buff: 'puzzlePct', values: [0.25, 0.5, 1, 1.5, 2] },
  { id: 'hut', name: 'Balıkçı kulübesi', costs: [3, 5, 8, 12, 16], unlock: 3, styles: ['Ahşap', 'Taş', 'Buz'], stylePrice: 150, buff: 'flakeChance', values: [0.1, 0.2, 0.3, 0.4, 0.5] },
  { id: 'lighthouse', name: 'Deniz feneri', costs: [4, 6, 9, 14, 18], unlock: 3, styles: ['Çizgili', 'Taş', 'Modern'], stylePrice: 150, buff: 'freeContinues', values: [1, 2, 3, 4, 5] },
  { id: 'fort', name: 'Kartopu kalesi', costs: [4, 6, 9, 14, 18], unlock: 5, styles: ['Kale', 'Şato', 'Kule'], stylePrice: 180, buff: 'discount', values: [0.1, 0.2, 0.3, 0.35, 0.4] },
  { id: 'observatory', name: 'Gözlem noktası', costs: [5, 7, 10, 15, 20], unlock: 7, styles: ['Kubbe', 'Teleskop', 'Anten'], stylePrice: 180, buff: 'cocoaCap', base: 8, values: [10, 12, 16, 20, 24] },
  // Buz Limanı (district 1). Paylaşım kodu yapıları sırayla kodladığı için yeni yapılar hep sona eklenir.
  { id: 'cafe', name: 'Liman kafesi', district: 1, costs: [5, 7, 10, 15, 20], unlock: 5, styles: ['Ahşap', 'Kırmızı tente', 'Buz camı'], stylePrice: 180, buff: 'cupBonus', values: [1, 2, 3, 4, 5] },
  { id: 'ferry', name: 'Yolcu teknesi', district: 1, costs: [6, 8, 11, 16, 21], unlock: 5, styles: ['Kırmızı', 'Mavi', 'Sarı'], stylePrice: 180, buff: 'cocoaPct', values: [0.1, 0.2, 0.3, 0.4, 0.5] },
  { id: 'market', name: 'Balık pazarı', district: 1, costs: [5, 7, 10, 15, 20], unlock: 5, styles: ['Tenteli', 'Kulübe', 'Buz tezgâhı'], stylePrice: 180, buff: 'starCoin', values: [2, 3, 4, 5, 6] },
  { id: 'bell', name: 'Liman çanı', district: 1, costs: [6, 8, 11, 16, 21], unlock: 5, styles: ['Bronz', 'Gümüş', 'Altın'], stylePrice: 180, buff: 'eventPct', values: [0.1, 0.2, 0.3, 0.4, 0.5] },
];

const pct = v => `%${Math.round(v * 100)}`;
export const BUFF_TEXT = {
  coinPct: v => `Level coin ödülü +${pct(v)}`,
  fishCoin: v => `Balık başına +${v} coin`,
  hardMoves: v => `Hamle limitli levellerde +${v} hamle`,
  cocoa: v => `Saatte ${v} fincan kakao`,
  cupBonus: v => `Kakao fincanı +${v} coin`,
  cocoaPct: v => `Kakao üretimi +${pct(v)}`,
  starCoin: v => `Yıldız başına +${v} coin`,
  eventPct: v => `Etkinlik puanı +${pct(v)}`,
  freeHints: v => `Her gün ${v} ücretsiz ipucu`,
  dailyPct: v => `Günlük ödül +${pct(v)}`,
  x5: v => `Çarpanda x5 bölgesi %${v}`,
  puzzlePct: v => `Günlük bulmaca ödülü +${pct(v)}`,
  flakeChance: v => `${pct(v)} şansla level başına +1 kar tanesi`,
  freeContinues: v => `Günde ${v} ücretsiz "+5 hamle"`,
  discount: v => `Stil, renk ve kıyafette ${pct(v)} indirim`,
  cocoaCap: v => `Kakao en fazla ${v} saat birikir`,
};

// Köy seviyesi = bütün yapı seviyelerinin toplamı. Her seviye bütün coin kazançlarına +%3 ekler.
export const VILLAGE_BONUS_PCT = 0.03;
export const VILLAGE_LEVELS = [
  { lv: 1, need: 0, visual: 'Boş koy' },
  { lv: 2, need: 4, visual: 'Kar yağışı', reward: { coins: 200, hints: 2 } },
  { lv: 3, need: 8, visual: 'Komşu penguen', reward: { scarf: 'red', coins: 150 } },
  { lv: 4, need: 13, visual: 'Taş köy yolu', reward: { coins: 300, flakes: 5 } },
  { lv: 5, need: 18, visual: 'Kuzey ışıkları', reward: { hat: 'north', coins: 300 } },
  { lv: 6, need: 24, visual: 'Gece ve gündüz', reward: { coins: 500, hints: 3 } },
  { lv: 7, need: 30, visual: 'Köy maskotu fok', reward: { hat: 'sealhood', coins: 500 } },
  { lv: 8, need: 36, visual: 'Kış festivali · Bölge 2 açıldı, yapılar Lv5\'e kadar yükselir', reward: { hat: 'crown', coins: 1000 } },
  // Bölge 2 · Kuzey Işıkları (yapılar Lv4-5)
  { lv: 9, need: 42, visual: 'Kuzey ışıkları dansı', reward: { coins: 800, flakes: 5 } },
  { lv: 10, need: 48, visual: 'Buz heykelleri', reward: { scarf: 'aurora', coins: 800 } },
  { lv: 11, need: 54, visual: 'Havai fişekler', reward: { coins: 1200, hints: 5 } },
  { lv: 12, need: 60, visual: 'Uçan fenerler', reward: { hat: 'icecrown', coins: 2000 } },
];

// Köy ismi: ilk isim ücretsiz, sonradan değiştirmek coin ister.
export const VILLAGE_RENAME_PRICE = 1000;
export const VILLAGE_NAME_MAX = 18;
export const VILLAGE_NAME_IDEAS = ['Buzlu Koy', 'Kar Tepesi', 'Pofi Köyü', 'Ayaz Limanı', 'Kuzey Yuvası', 'Fok Burnu', 'Kakao Koyu', 'Işıltı Köyü'];

// Süsler (GDD 12.3): köydeki sabit süs yerlerine yerleştirilir. Her yerleştirme ayrı satın alınır
// (değiştirilen süs geri verilmez), böylece sürekli bir coin harcama yeri olur.
export const DECOR_ITEMS = [
  { id: 'fence', name: 'Çit', price: 50 },
  { id: 'snowballs', name: 'Kartopu yığını', price: 60 },
  { id: 'lantern', name: 'Sokak feneri', price: 80 },
  { id: 'bench', name: 'Bank', price: 100 },
  { id: 'pine', name: 'Küçük çam', price: 120 },
  { id: 'flag', name: 'Bayrak direği', price: 150 },
  { id: 'statue', name: 'Buz heykelciği', price: 300 },
  { id: 'aurora', name: 'Aurora lambası', price: 400 },
  // Etkinlik hatıra süsleri: jeton dükkânından alınır (P.decorOwned), yerleştirmek ücretsiz.
  { id: 'ev_newyear', name: 'Havai fişek kulesi', price: 0, event: 'newyear' },
  { id: 'ev_snowflake', name: 'Kar tanesi heykeli', price: 0, event: 'snowflake' },
  { id: 'ev_igloo', name: 'Mini iglo', price: 0, event: 'igloo' },
  { id: 'ev_penguin', name: 'Penguen heykeli', price: 0, event: 'penguin' },
  { id: 'ev_fish', name: 'Balık bayrağı', price: 0, event: 'fish' },
  { id: 'ev_lantern', name: 'Kırmızı fener', price: 0, event: 'lantern' },
  { id: 'ev_valentine', name: 'Kalp kemeri', price: 0, event: 'valentine' },
  { id: 'ev_sculpture', name: 'Buz heykeli', price: 0, event: 'sculpture' },
  { id: 'ev_polarbear', name: 'Ayı heykelciği', price: 0, event: 'polarbear' },
  { id: 'ev_sled', name: 'Kızak', price: 0, event: 'sled' },
  { id: 'ev_sugar', name: 'Şeker standı', price: 0, event: 'sugar' },
  { id: 'ev_spring', name: 'Lale saksısı', price: 0, event: 'spring' },
  { id: 'ev_eggs', name: 'Yumurta sepeti', price: 0, event: 'eggs' },
  // Gezgin tüccarın nadir süsleri (P.decorOwned), yerleştirmek ücretsiz. merchant: tüccardaki fiyat.
  { id: 'mc_globe', name: 'Kar küresi', price: 0, merchant: 1200 },
  { id: 'mc_anchor', name: 'Çapa heykeli', price: 0, merchant: 800 },
  { id: 'mc_totem', name: 'Penguen totemi', price: 0, merchant: 1800 },
  { id: 'mc_fountain', name: 'Buz çeşmesi', price: 0, merchant: 2500 },
  { id: 'mc_swing', name: 'Salıncak', price: 0, merchant: 1500 },
  { id: 'mc_chime', name: 'Rüzgâr çanı', price: 0, merchant: 1000 },
];
// Süs yerleri (yapının taban ortası gibi, genişlik/yükseklik oranı). x > 1 olanlar Buz Limanı'nda.
// Lv3 yapı görsellerinin, yolların ve köylülerin toplanma yerlerinin dışında seçildi.
export const DECOR_SLOTS = [
  { id: 'b1', at: [0.53, 0.88] }, { id: 'b2', at: [0.555, 0.97] }, { id: 'b3', at: [0.88, 0.87] }, { id: 'b4', at: [0.965, 0.93] },
  { id: 'b5', at: [0.373, 0.48] }, { id: 'b6', at: [0.31, 0.43] }, { id: 'b7', at: [0.18, 0.64] }, { id: 'b8', at: [0.6, 0.42] },
  { id: 'h1', at: [1.1, 0.62] }, { id: 'h2', at: [1.34, 0.6] }, { id: 'h3', at: [1.61, 0.58] }, { id: 'h4', at: [1.92, 0.62] },
  { id: 'h5', at: [1.12, 0.92] }, { id: 'h6', at: [1.94, 0.7] },
];

// Köy yaşamı (GDD 12.5): köylüler cihaz saatine göre bir rutin izler. Bobo köy Lv3'te kendiliğinden gelir
// (eski "komşu penguen"), diğerleri coin'le davet edilir. kid: küçük boy.
export const VILLAGERS = [
  { id: 'bobo', name: 'Bobo', vl: 3, price: 0, outfit: { hat: 'beanieBlue', scarf: 'yellow' } },
  { id: 'lili', name: 'Lili', vl: 3, price: 500, outfit: { hat: 'earmuffs', scarf: 'red' } },
  { id: 'kiko', name: 'Kiko', vl: 4, price: 800, kid: true, outfit: { hat: 'beanieRed', scarf: 'green' } },
  { id: 'nana', name: 'Nana', vl: 5, price: 1200, outfit: { hat: 'north', scarf: 'blue' } },
  { id: 'tipi', name: 'Tipi', vl: 6, price: 1800, kid: true, outfit: { hat: 'fishhat', scarf: 'flakes' } },
  { id: 'mavi', name: 'Mavi', vl: 7, price: 2500, outfit: { hat: 'tophat', scarf: 'striped' } },
];
// Günün saatine göre: sabah balık, öğlen kakao kuyruğu ve gezinti, akşam ateş başı, gece uyku.
export const VILLAGE_PHASES = [
  { id: 'night', from: 21, to: 7, name: 'Gece' },
  { id: 'morning', from: 7, to: 11, name: 'Sabah' },
  { id: 'day', from: 11, to: 17, name: 'Öğlen' },
  { id: 'evening', from: 17, to: 21, name: 'Akşam' },
];
export const VILLAGER_LINES = {
  morning: ['Sabah balığı en tazesidir!', 'Göl buz tutmuş ama bir delik buldum.', 'Bugün oltam boş dönmeyecek.'],
  day: ['Kakao kokusu her yeri sardı!', 'Kızak tepesine kim gelir?', 'Pofi, yeni bir yapı mı kuruyoruz?'],
  evening: ['Ateş başında hikâye vakti.', 'Kuzey ışıkları birazdan başlar.', 'Ellerim ısındı, sağ ol ateş!'],
  night: ['Zzz…'],
};
// Bir köylü her gün küçük bir iş ister; bitince ödül verir.
export const DAILY_TASKS = [
  { type: 'levels', need: 3, text: '3 level bitir' },
  { type: 'fish', need: 12, text: 'Levellerde 12 balık topla' },
  { type: 'stars', need: 2, text: "2 level'i 3 yıldızla bitir" },
  { type: 'cocoa', need: 1, text: 'Yolculara kakao sat', needs: 'cocoa' },
  { type: 'feed', need: 1, text: 'Evcil dostunu besle', pet: true },
  { type: 'decor', need: 1, text: 'Köye bir süs yerleştir' },
  { type: 'wear', need: 1, text: 'Gardıroptan başka bir şey giy' },
];
export const TASK_REWARD = { coins: 120, flakes: 1 };

// Dostluk: köylüyle günde bir kez konuşmak, işini bitirmek ve kakao ikram etmek puan verir. Her eşikte bir hikâye açılır.
// Ödüller coin değil (coin zaten bol). giftCups: ikram edilen fincan.
export const FRIEND = {
  levels: [3, 8, 15], talkPts: 1, taskPts: 3, giftPts: 2, giftCups: 5,
  rewards: [{ hints: 1 }, { flakes: 2 }, { flakes: 5, hints: 2 }],
};
// Her köylünün karakteri, sözleri, ricası ve üç bölümlük hikâyesi.
export const VILLAGER_LIFE = {
  bobo: {
    trait: 'Balık delisi',
    lines: ['Bugün oltam bir şey hissediyor!', 'Balık az, sabır çok.', 'O yüzgeci gördün mü?', 'İskele benim ikinci evim.'],
    ask: 'Balıkçılar birbirine yardım eder, Pofi.',
    thanks: 'İşte bu! Oltama bile iyi haber oldu.',
    story: [
      { title: 'Eski olta', text: 'Bu oltayı dedemden aldım. Ona sorarsan buzun altından dev bir balık çıkarmış. Bana sorarsan balık onu çekmiş! Ama oltayı hiç bırakmamış.' },
      { title: 'Büyük yüzgeç', text: 'Sabahları iskelede kocaman bir yüzgeç görüyorum. Kimse inanmıyor. Geçen gün yüzgece bir fincan kakao uzattım. Fincan boş geri geldi, yemin ederim!' },
      { title: 'Sır', text: 'Sana sırrımı söyleyeyim: o yüzgeç bir balığın değil, Foki\'nin şakasıymış. Bütün köy biliyormuş! Ben yine de her sabah bir fincan bırakıyorum. Dostluk böyle bir şey.' },
    ],
  },
  lili: {
    trait: 'Meraklı gezgin',
    lines: ['Haritama bir nokta daha!', 'Limandan yeni geldim.', 'Burada kalabilirim sanki.', 'Pusulam hep buraya döner.'],
    ask: 'Haritamı bitirmeden gidemem, bana yardım et.',
    thanks: 'Bunu haritama yıldızla işaretliyorum!',
    story: [
      { title: 'Küçük nokta', text: 'Ben aslında buradan geçip gidecektim. Haritamda köyünüz yoktu bile! Kalemimi çıkardım, küçücük bir nokta koydum.' },
      { title: 'Büyüyen nokta', text: 'Her yeni yapıda o noktayı biraz büyütüyorum. Artık kocaman bir daire oldu. Kâğıdın kenarına geldim, bir sayfa daha yapıştırdım.' },
      { title: 'Ev', text: 'Bugün haritaya yeni bir kelime yazdım: Ev. Gezmeye devam edeceğim ama dönüş yolum artık belli. Bunu sana borçluyum.' },
    ],
  },
  kiko: {
    trait: 'Soru makinesi',
    lines: ['Kar neden soğuk, Pofi?', 'Bak, dişim sallanıyor!', 'Bana kaymayı öğretir misin?', 'Balıklar uyur mu?'],
    ask: 'Bunu yaparsan bir soru daha sormam. Belki.',
    thanks: 'Yaşasın! Nasıl yaptın? Neden? Bir daha yap!',
    story: [
      { title: '46 soru', text: 'Kar neden beyaz? Balıklar uyur mu? Penguenler neden uçmaz? Annem "Pofi\'ye sor" dedi. Hepsini yazdım, 46 tane oldu. Başlayalım mı?' },
      { title: 'Kayıp diş', text: 'Dişim düştü, hem de karın içine! Bütün sabah kazdım. Diş çıkmadı ama kale yapacak kadar kartopum oldu. Sanırım kazandım.' },
      { title: 'Büyüyünce', text: 'Büyüyünce senin gibi olacağım. Kayıp bir yere çarpacağım, sonra "bunu planlamıştım" diyeceğim. Dün kardan duvara çarptım. Planlamıştım!' },
    ],
  },
  nana: {
    trait: 'Köyün büyüğü',
    lines: ['Üşüme evladım, atkını tak.', 'Gençken daha çok kar yağardı.', 'Kakaoya az şeker, çok sevgi.', 'Seninle gurur duyuyorum.'],
    ask: 'Yaşlı kemiklerim yetişemiyor evladım.',
    thanks: 'Maşallah sana. Annen baban görse ne sevinirdi.',
    story: [
      { title: 'Boş koy', text: 'Burası eskiden bomboş bir koydu evladım. Bir tek rüzgâr vardı, o da misafirdi. Şimdi fener ışığında yürüyorum, gençliğim aklıma geliyor.' },
      { title: 'Kakaonun sırrı', text: 'Kakaonun sırrı tarçın değil. Sırrı, fincanı uzatırken gülümsemek. Kimseye söyleme, tarif defterine de yazmadım.' },
      { title: 'Atkı', text: 'Sana bir atkı örüyordum, ipim bitti. Köydeki herkes bir parça yün getirdi. Atkı uzadıkça uzadı. Asıl hediye atkı değil, o yünü getirenlermiş.' },
    ],
  },
  tipi: {
    trait: 'Haylaz',
    lines: ['Kartopunu ben atmadım!', 'Şşş, kimseye söyleme!', 'Kalenin arkası güvenli.', 'Havuç kimde, biliyor musun?'],
    ask: 'Kimseye söylemezsen sana bir iş vereceğim.',
    thanks: 'Sen de bizim gizli gruba girdin!',
    story: [
      { title: 'Kartopu', text: 'Kartopunu ben atmadım! Yani bu sefer. Önceki sefer attım ama o da kardan adam çok sıkılmış göründüğü içindi.' },
      { title: 'Gizli üs', text: 'Kalenin arkasında gizli üssüm var. Şifresi "balık". Kimseye söyleme. Bobo biliyor. Bir de Kiko. Bir de Nana, çünkü çorba getiriyor.' },
      { title: 'Havuç', text: 'Geçen gün kardan adamın havucunu aldım. Geri koydum ama ters. Gece gidip düzelttim, kimse görmedi. Sana söylüyorum, çünkü sen dostsun.' },
    ],
  },
  mavi: {
    trait: 'Şık sanatçı',
    lines: ['Şapkam düz mü, efendim?', 'Bu kar çok zarif bugün.', 'Sanat sabır ister.', 'Islığımı duydunuz mu?'],
    ask: 'Size zahmet, küçük bir ricam olacak efendim.',
    thanks: 'Pek zarif! Şapkamı çıkarıyorum. Düşmezse.',
    story: [
      { title: 'Silindir', text: 'Bu şapkayla denizi geçtim efendim. Tamam, bir kez suya düştüm. Ama şapka ıslanmadı. Hayatta öncelikler önemlidir.' },
      { title: 'Heykel', text: 'Köye bir buz heykeli yapmak istedim. Yaptım da. Sonra güneş çıktı, heykel havuz oldu. Modern sanat diyelim.' },
      { title: 'Konser', text: 'Akşamları ateşin başında ıslık çalıyorum, herkes uyuyor sanıyordum. Geçen gün Tipi alkışladı. Demek ki bir dinleyicim varmış. Yeter de artar.' },
    ],
  },
};
// Köylülerin kendi aralarındaki kısa sohbetler (yan yana boş dururlarken).
export const VILLAGER_CHAT = [
  ['Bugün balık var mı?', 'Yüzgeç hariç, yok.'], ['Şapkan çok güzel.', 'Biliyorum efendim.'], ['Kim yaptı bu kartopunu?', 'Ben değilim!'],
  ['Kakao içtin mi?', 'İki fincan!'], ['Hava soğuk bugün.', 'Penguene göre iyi.'], ['Yeni yapıyı gördün mü?', 'Pofi çok çalışıyor.'],
  ['Akşam ateşe gelecek misin?', 'Islık yoksa gelirim.'], ['Neden kar yağıyor?', 'Kiko, sus biraz.'], ['Liman ne kadar uzak?', 'Bir kayış mesafesi.'], ['Köy büyüyor, değil mi?', 'Hem de nasıl!'],
];

// Renk paleti: bir kez açılan renk tüm yapılarda kullanılabilir. null = stilin kendi rengi.
export const COLOR_PRICE = 100;
export const COLORS = [
  { id: 'ice', name: 'Buz mavisi', hex: '#9fd3ff' },
  { id: 'mint', name: 'Nane', hex: '#8fe0b8' },
  { id: 'peach', name: 'Şeftali', hex: '#ffbf99' },
  { id: 'rose', name: 'Gül', hex: '#ff95b2' },
  { id: 'lilac', name: 'Leylak', hex: '#c3a2ff' },
  { id: 'sun', name: 'Güneş', hex: '#ffd166' },
  { id: 'berry', name: 'Böğürtlen', hex: '#8f5bd6' },
  { id: 'coral', name: 'Mercan', hex: '#ff6b5e' },
];

// ---------- Yıllık etkinlik takvimi (docs/v04-oneri.md, bölüm 3) ----------
// Her pazartesi 00:00'da (yerel saat) takvimdeki temaya geçilir. Takvim 28 Aralık 2026 haftasından başlar
// ve 52 haftada bir tekrar eder. Tema: jeton simgesi, etkinlik levellerinin kuralı, jeton bonusu, ödül.
// rule: mech = etkinlik levellerinde zorunlu mekanikler (oyuncu açtıysa), fish = ek balık, order = sıralı balık,
//       nosnow = kalıcı kar yok, limit = hamle sınırı, dark = karanlık tahta, reverse = ters kontrol, sale = dükkân yarı fiyat
// bonus: fish (balık başına +1), star3 (3 yıldıza +5), nohint (ipucusuz +5), daily (günlük bulmaca +30), visit (arkadaş köyü +10)
// prize: son ödül basamağı ve dükkândaki kıyafet; null ise yerine coin ve kar tanesi verilir.
// art: banner (ev_banner_<id>), jeton (ev_token_<id>) ve hatıra süsü (decor_ev_<id>) görselleri var (pofi-r10).
export const EVENT_THEMES = {
  newyear: { name: 'Yılbaşı Havai Fişekleri', color: '#7b4fd0', token: '🎆', text: 'Yeni yıl! Etkinlik levellerinde fazladan balık var.', rule: { fish: 1 }, bonus: 'star3', big: true, prize: { hat: 'partyhat' }, art: true },
  snowflake: { name: 'Kar Tanesi Avı', color: '#3d8fe0', token: '❄️', text: 'Eriyen karlar her yerde; frenini dikkatli kullan.', rule: { mech: ['melt'] }, bonus: 'star3', prize: { scarf: 'flakes' }, art: true },
  igloo: { name: 'İglo Yapım Haftası', color: '#4f8fc8', token: '🧱', text: 'Kasaları ve kar toplarını doğru yere taşı.', rule: { mech: ['crate', 'ball'] }, bonus: null, prize: { hat: 'builder' }, art: true },
  penguin: { name: 'Penguen Dostları', color: '#1d3557', token: '🐧', text: '20 Ocak Penguen Farkındalık Günü. Pipi de yardıma geliyor!', rule: { mech: ['pipi'] }, bonus: 'star3', big: true, prize: { scarf: 'penguin' }, art: true },
  fish: { name: 'Balık Festivali', color: '#ff8c42', token: '🐟', text: 'Tahtalar balık dolu; her balık +1 jeton.', rule: { fish: 2 }, bonus: 'fish', prize: { hat: 'fishhat' }, art: true },
  lantern: { name: 'Fener Şenliği', color: '#e5484d', token: '🏮', text: 'Çin Yeni Yılı. Karanlıkta fenerin ışığıyla yolunu bul.', rule: { dark: true }, bonus: 'nohint', big: true, prize: { hat: 'lantern' }, art: true },
  valentine: { name: 'Kalpli Balıklar', color: '#ff5f8f', token: '💗', text: 'Sevgililer Günü. Kalpli balıkları sırayla topla.', rule: { order: true }, bonus: 'fish', big: true, prize: { scarf: 'hearts' }, art: true },
  sculpture: { name: 'Buz Heykeli Yarışması', color: '#6fb0e0', token: '🧊', text: 'Kırılgan kayaları yontarak yol aç.', rule: { mech: ['fragile'] }, bonus: null, prize: { hat: 'chisel' }, art: true },
  polarbear: { name: 'Kutup Ayısı Ziyareti', color: '#8aa1b8', token: '🐻', text: 'Kutup Ayısı Günü. Foklar ortalıkta dolaşıyor.', rule: { mech: ['seal'] }, bonus: 'star3', big: true, prize: { hat: 'bearears' }, art: true },
  sled: { name: 'Kızak Yarışı', color: '#e5484d', token: '🛷', text: 'Her etkinlik levelinde hamle sınırı var.', rule: { limit: true }, bonus: 'daily', prize: { hat: 'helmet' }, art: true },
  sugar: { name: 'Şeker Bayramı Kakaosu', color: '#c98b4f', token: '🍬', text: 'Bayramınız kutlu olsun! Her balık +1 jeton.', rule: { fish: 1 }, bonus: 'fish', big: true, prize: { scarf: 'candy' }, art: true },
  spring: { name: 'Bahar Uyanışı', color: '#3fae5a', token: '🌷', text: 'Buzlar çatlıyor, karlar eriyor.', rule: { mech: ['melt', 'crack'] }, bonus: 'nohint', big: true, prize: { hat: 'tulip' }, art: true },
  eggs: { name: 'Yumurta Avı', color: '#f5b81c', token: '🥚', text: 'Bahar şenliği. Balıkları sırayla topla.', rule: { order: true }, bonus: 'star3', big: true, prize: { hat: 'eggshell' }, art: true },
  aprilfool: { name: 'Şaşkın Pofi', color: '#ff9f43', token: '🤪', text: '1 Nisan! Etkinlik levellerinde kontroller ters.', rule: { reverse: true }, bonus: 'star3', big: true },
  aurora: { name: 'Kuzey Işığı Haftası', color: '#8f5bd6', token: '✨', text: 'Buz delikleri ışıldıyor; ipucusuz bitir, fazladan kazan.', rule: { mech: ['hole'] }, bonus: 'nohint', prize: { hat: 'starhat' } },
  crystal: { name: 'Kristal Mağara', color: '#4f86b8', token: '💎', text: 'Mağara karanlık, tavandan sarkıtlar sarkıyor.', rule: { dark: true, mech: ['icicle'] }, bonus: null },
  penguinday: { name: 'Dünya Penguen Günü', color: '#1d3557', token: '🐧', text: '25 Nisan ve 23 Nisan Çocuk Şenliği. Pofi ve Pipi birlikte.', rule: { mech: ['pipi'], fish: 1 }, bonus: 'star3', big: true },
  gullmail: { name: 'Martı Postası', color: '#4ea8de', token: '✉️', text: 'Oklar ve döner tablalar mektupları taşıyor.', rule: { mech: ['arrow', 'turn'] }, bonus: null },
  mothers: { name: 'Anneler Günü Kakaosu', color: '#ff95b2', token: '🌸', text: 'Annelere sıcak kakao!', rule: { fish: 1 }, bonus: 'star3', big: true },
  whales: { name: 'Balina Göçü', color: '#2a5d8f', token: '🐋', text: 'Salla suları aş.', rule: { mech: ['water', 'raft'] }, bonus: null },
  olympics: { name: 'Kızak Olimpiyatı', color: '#e5484d', token: '🏅', text: '19 Mayıs. Hamle sınırıyla en iyi derece!', rule: { limit: true }, bonus: 'star3', big: true },
  angler: { name: 'Usta Balıkçı', color: '#ff8c42', token: '🎣', text: 'Bol balık, ama sırayla.', rule: { fish: 2, order: true }, bonus: 'fish' },
  kites: { name: 'Uçurtma Rüzgârı', color: '#4ea8de', token: '🪁', text: 'Rüzgâr ve rampalarla uç.', rule: { mech: ['wind', 'ramp'] }, bonus: null },
  ocean: { name: 'Okyanus Haftası', color: '#1f6fb2', token: '🌊', text: 'Dünya Okyanus Günü. Su, sal ve köprüler.', rule: { mech: ['water', 'raft', 'crate'] }, bonus: 'fish', big: true },
  fathers: { name: 'Babalar Günü Balık Turu', color: '#5b6578', token: '🎣', text: 'Babalarla balığa! Her balık +1 jeton.', rule: { fish: 2 }, bonus: 'fish', big: true },
  midnightsun: { name: 'Gece Yarısı Güneşi', color: '#ff9f43', token: '☀️', text: 'Kutupta güneş batmıyor; karlar eriyor.', rule: { mech: ['melt'] }, bonus: 'nohint', big: true },
  skating: { name: 'Buz Pateni Şampiyonası', color: '#7fb8e6', token: '⛸️', text: 'Kalıcı kar yok, çatlak buz çok.', rule: { nosnow: true, mech: ['crack'] }, bonus: 'star3' },
  treasure: { name: 'Hazine Sandığı', color: '#c98b4f', token: '🗝️', text: 'Anahtar balığı bul, kilitleri aç.', rule: { mech: ['key'] }, bonus: null },
  emoji: { name: 'Emoji Penguenler', color: '#f5b81c', token: '😄', text: 'Dünya Emoji Günü. Gülümse, 3 yıldız topla!', rule: { fish: 1 }, bonus: 'star3', big: true },
  snowball: { name: 'Kar Topu Savaşı', color: '#7fa9cc', token: '⚪', text: 'Kar toplarıyla kendi frenini kur.', rule: { mech: ['ball'] }, bonus: null },
  friendship: { name: 'Dostluk Haftası', color: '#ff95b2', token: '🤝', text: 'Dostluk Günü. Arkadaş köyü ziyareti +10 jeton.', rule: { mech: ['pipi'] }, bonus: 'visit', big: true },
  compass: { name: 'Pusula Avı', color: '#8e5a2b', token: '🧭', text: 'Döner tablalar ve oklarla yönünü bul.', rule: { mech: ['turn', 'arrow'] }, bonus: null },
  meteors: { name: 'Yıldız Kayması', color: '#2f3b7a', token: '🌠', text: 'Perseid gecesi. Karanlıkta yıldız topla.', rule: { dark: true }, bonus: 'star3', big: true },
  harborfair: { name: 'Liman Panayırı', color: '#ff6b5e', token: '🎪', text: 'Sallar ve basınç plakaları panayırda.', rule: { mech: ['raft', 'plate'] }, bonus: null },
  school: { name: 'Okula Dönüş', color: '#4ea8de', token: '✏️', text: 'Balıkları sırayla say; ipucusuz bitir, fazladan kazan.', rule: { order: true }, bonus: 'nohint', big: true },
  harvest: { name: 'Kakao Hasadı', color: '#8e5a2b', token: '☕', text: 'Ekinoks. Bol balıklı hasat haftası.', rule: { fish: 1 }, bonus: 'fish', big: true },
  animals: { name: 'Hayvan Dostları', color: '#3fae5a', token: '🐾', text: 'Hayvanları Koruma Günü. Foklara yol ver.', rule: { mech: ['seal'] }, bonus: 'star3', big: true },
  ghostseal: { name: 'Hayalet Fok Gecesi', color: '#5a3d8f', token: '🎃', text: 'Cadılar Bayramı. Karanlıkta foklar dolaşıyor!', rule: { dark: true, mech: ['seal'] }, bonus: 'star3', big: true },
  feast: { name: 'Kakao Sofrası ve Büyük İndirim', color: '#c98b4f', token: '🥧', text: 'Şükran Günü ve Kara Cuma. Etkinlik dükkânı yarı fiyat!', rule: { fish: 1, sale: true }, bonus: 'fish', big: true },
  lanternnight: { name: 'Fener Gecesi', color: '#ff9f43', token: '🏮', text: 'Uzun kış gecesi; fenerinle yolunu bul.', rule: { dark: true }, bonus: 'nohint' },
  winterfest: { name: 'Kış Şenliği', color: '#2b9a63', token: '🎄', text: 'Gündönümü ve Noel. Sarkıtlar ve kar topları.', rule: { mech: ['icicle', 'ball'] }, bonus: 'star3', big: true },
};
export const EVENT_CALENDAR_START = [2026, 11, 28]; // 28 Aralık 2026, pazartesi (ay 0'dan)
export const EVENT_CALENDAR = [
  'newyear', 'snowflake', 'igloo', 'penguin', 'fish', 'lantern', 'valentine', 'sculpture', 'polarbear', 'sled',
  'sugar', 'spring', 'eggs', 'aprilfool', 'aurora', 'crystal', 'penguinday', 'gullmail', 'mothers', 'whales',
  'olympics', 'angler', 'kites', 'ocean', 'fathers', 'midnightsun', 'skating', 'treasure', 'emoji', 'snowball',
  'friendship', 'compass', 'meteors', 'harborfair', 'fish', 'sled', 'school', 'igloo', 'harvest', 'aurora',
  'animals', 'crystal', 'gullmail', 'ghostseal', 'sculpture', 'whales', 'treasure', 'feast', 'snowball', 'snowflake',
  'lanternnight', 'winterfest',
];
// Jeton: normal level, etkinlik leveli, günlük bulmaca ve köylü görevi verir. Hafta bitince kalan jeton coin'e döner.
export const EVENT_TOKENS = { level: 5, star: 2, eventLevel: 20, eventStar: 5, replay: 3, daily: 20, task: 15, coinRate: 2 };
export const EVENT_BONUS = { fish: 1, star3: 5, nohint: 5, daily: 30, visit: 10 };
export const EVENT_LEVELS = 15; // haftaya özel etkinlik leveli
// Ödül yolu: bu hafta kazanılan toplam jetona göre (harcanan jeton yolu geri almaz).
export const EVENT_TRACK = [
  { pts: 20, r: { coins: 100 } },
  { pts: 50, r: { hints: 2 } },
  { pts: 90, r: { coins: 200 } },
  { pts: 140, r: { flakes: 3 } },
  { pts: 200, r: { coins: 300 } },
  { pts: 270, r: { hints: 3 } },
  { pts: 350, r: { flakes: 5 } },
  { pts: 440, r: { coins: 500 } },
  { pts: 540, r: { hints: 5, flakes: 5 } },
  { pts: 660, r: { prize: true } }, // temanın kıyafeti; yoksa EVENT_PRIZE_FALLBACK
];
export const EVENT_PRIZE_FALLBACK = { coins: 1000, flakes: 8 };
// Etkinlik konuğu Foki: her hafta temaya uygun gelen gezgin fok. Meydandaki etkinlik çadırının yanında durur
// ve her gün bir iş verir; ödülü jeton.
export const GUEST_TASKS = [
  { type: 'evlevel', need: 2, text: '2 etkinlik leveli bitir' },
  { type: 'levels', need: 3, text: '3 level bitir' },
  { type: 'fish', need: 10, text: 'Levellerde 10 balık topla' },
  { type: 'cocoa', need: 1, text: 'Yolculara kakao sat', needs: 'cocoa' },
];
export const GUEST_REWARD = 25;
// Etkinlik dükkânı: haftalık jetonla alınır; her ürün haftada en fazla "max" kez.
export const EVENT_SHOP = [
  { id: 'hints', name: '3 ipucu', cost: 40, max: 3, r: { hints: 3 } },
  { id: 'flakes', name: '5 kar tanesi', cost: 60, max: 3, r: { flakes: 5 } },
  { id: 'coins', name: '300 coin', cost: 100, max: 3, r: { coins: 300 } },
  { id: 'prize', name: 'Haftanın kıyafeti', cost: 400, max: 1, prize: true },
  { id: 'decor', name: 'Hatıra süsü', cost: 150, max: 1, decor: true }, // köyün süs yerlerine konur (görselli temalarda)
];

// ---------- Yıldızlar, harita ve başarımlar ----------
// Yıldız sandığı: toplam yıldız her STAR_CHEST.every yıldızda bir sandık açar. Ödüller sırayla döner,
// her 5. sandık büyüktür. Böylece eski levellere dönüp 3 yıldız yapmak anlam kazanır.
export const STAR_CHEST = {
  every: 30,
  rewards: [{ coins: 150, hints: 1 }, { coins: 200, flakes: 3 }, { coins: 250, hints: 2 }, { coins: 300, flakes: 4 }, { coins: 600, hints: 3, flakes: 8 }],
};
// Tekrar oynama: bitirilmiş bir level yeniden bitirilince yalnızca yeni kazanılan yıldızlar ödül verir.
export const REPLAY = { coin: 5, perNewStar: 15, flakePerNewStar: 1, tokenPerNewStar: 3 };
// Haritadaki bölgeler (level aralığı, ad, gökyüzü renkleri üst/alt, yol kenarı süsleri)
export const MAP_REGIONS = [
  { from: 1, name: 'Buzul Koyu', top: '#cfe8fb', bottom: '#eef7ff', deco: ['pine', 'snowballs', 'fence'] },
  { from: 101, name: 'Kar Tepeleri', top: '#bcd9f4', bottom: '#e3f1fc', deco: ['pine', 'lantern', 'bench'] },
  { from: 251, name: 'Kuzey Işıkları', top: '#b9b3ec', bottom: '#dfe3fb', deco: ['aurora', 'statue', 'pine'] },
  { from: 451, name: 'Liman Kıyısı', top: '#a9dcea', bottom: '#e1f5f8', deco: ['flag', 'lantern', 'fence'] },
  { from: 651, name: 'Çam Ormanı', top: '#b7e2cc', bottom: '#e6f6ec', deco: ['pine', 'pine', 'bench'] },
  { from: 851, name: 'Kristal Zirve', top: '#d6c8f2', bottom: '#f1ecfb', deco: ['statue', 'aurora', 'snowballs'] },
];
// Usta levelleri: her bölgenin son levelinden sonra haritada bir buz kalesi. Bölgenin mekaniklerinden karışık,
// çok zor ve hamle sınırlı özel bir level. after: kalenin açıldığı level, n: zorluk (üretici bu levelin ayarlarını kullanır).
export const MASTER_LEVELS = [
  { after: 100, n: 112 }, { after: 250, n: 262 }, { after: 450, n: 462 }, { after: 650, n: 662 }, { after: 850, n: 862 }, { after: 1000, n: 1000 },
];
// Güçlendiriciler: level içinde kullanılır. Mağazada price; oyun içinden almak ECON.hintGameMult kat pahalı (gamePrice varsa o).
// Askıda (suspended, 2026-11-04 kullanıcı kararı): kazma, kürek ve düdük hiçbir ekranda görünmez; eldekiler coin olarak iade edildi.
// Neden: yıldızlar güçlendiricisiz en kısa çözüme göre verilir; tahtayı değiştiren kazma ve kürek en kısa çözümün altında
// bitirişi ve 3 yıldızı satın alınabilir yapıyordu. Geri gelirse kural: kazma ya da kürek kullanılan levelde en fazla
// 2 yıldız alınır ve bu kartta açıkça yazar.
// Rota göster çözümü yalnızca gösterir (hamleleri oyuncu yapar); +5 hamle yalnızca hamle sınırlı levellerde çalışır.
export const BOOSTERS = [
  { id: 'route', ui: 'route', name: 'Rota göster', text: 'Çözümün tamamını gösterir', icon: '🧭', price: 250 },
  { id: 'moves5', ui: 'moves', name: '+5 hamle', text: 'Hamle sınırlı levellerde', icon: '⏱️', price: 60, gamePrice: 80, limitOnly: true },
  { id: 'pick', name: 'Buz kazması', text: 'Bir kayayı kırar', icon: '⛏️', price: 150, suspended: true },
  { id: 'shovel', name: 'Kar küreği', text: 'Buza kar koyar (fren)', icon: '❄️', price: 120, suspended: true },
  { id: 'whistle', name: 'Fok düdüğü', text: 'Foklar 3 hamle uyur', icon: '🎵', price: 100, suspended: true },
];
export const ACTIVE_BOOSTERS = BOOSTERS.filter(b => !b.suspended);
// İpucu paketi, Rota göster ve +5 hamle: fiyat gün içinde her alımda sabit bir miktar artar, gün dönünce başa döner.
// Değer, mağaza fiyatına alım başına eklenen coin; oyun içi fiyat aynı oranda artar. Mağaza ve oyun içi aynı sayacı kullanır.
export const PRICE_RAMP = { pack: 50, route: 50, moves5: 15 };
export const WHISTLE_MOVES = 3;

// Balık albümü: bazı levellerde balıklardan biri nadir türdür (parıltılı). Level bitince albüme eklenir.
// Aynısı tekrar gelirse coin verir; bir seti tamamlamak ödül verir. weight: setin çıkma ağırlığı.
export const FISH_SETS = [
  { id: 'buz', name: 'Buz Denizi', weight: 3, reward: { coins: 300, hints: 1 }, fish: [
    { id: 'icescale', name: 'Buz Pullu', color: '#8fd0ff' }, { id: 'crystal', name: 'Kristal', color: '#bfeeff' },
    { id: 'snowflake', name: 'Kar Tanesi', color: '#e9f4ff' }, { id: 'glacier', name: 'Buzul', color: '#5aa9e6' }] },
  { id: 'gece', name: 'Kutup Gecesi', weight: 3, reward: { coins: 300, hints: 1 }, fish: [
    { id: 'aurora', name: 'Kutup Işığı', color: '#7be0b0' }, { id: 'starry', name: 'Yıldızlı', color: '#4a6ab8' },
    { id: 'midnight', name: 'Gece Yarısı', color: '#2c3f73' }, { id: 'glow', name: 'Işıltılı', color: '#e8f56a' }] },
  { id: 'liman', name: 'Liman', weight: 3, reward: { coins: 400, hints: 2 }, fish: [
    { id: 'sailor', name: 'Denizci', color: '#3a7bd5' }, { id: 'anchor', name: 'Çapa', color: '#7a8a9f' },
    { id: 'striped', name: 'Çizgili', color: '#ff6b6b' }, { id: 'brass', name: 'Pirinç', color: '#c99a3c' }] },
  { id: 'tatli', name: 'Tatlı Sular', weight: 2, reward: { coins: 500, hints: 2, flakes: 5 }, fish: [
    { id: 'cocoa', name: 'Kakao', color: '#8b5a3c' }, { id: 'candy', name: 'Şeker', color: '#ff8fc8' },
    { id: 'marshmallow', name: 'Lokum', color: '#fff0f5' }, { id: 'caramel', name: 'Karamel', color: '#e0a050' }] },
  { id: 'hazine', name: 'Hazine', weight: 2, reward: { coins: 600, hints: 3, flakes: 8 }, fish: [
    { id: 'gold', name: 'Altın', color: '#ffcf33' }, { id: 'silver', name: 'Gümüş', color: '#c0c8d0' },
    { id: 'ruby', name: 'Yakut', color: '#e0115f' }, { id: 'emerald', name: 'Zümrüt', color: '#2ecc71' }] },
  { id: 'efsane', name: 'Efsaneler', weight: 1, reward: { coins: 1000, hints: 5, flakes: 15 }, fish: [
    { id: 'dragon', name: 'Ejder', color: '#e85d2a' }, { id: 'ghost', name: 'Hayalet', color: '#e8eef8' },
    { id: 'rainbow', name: 'Gökkuşağı', color: '#b388ff' }, { id: 'king', name: 'Kral', color: '#3d7bd9' }] },
];
export const ALBUM = { chance: 0.15, from: 12, dupCoins: 40, missingBias: 3 };
// Yan yollar: haritada her "every" levelde bir, farklı hedefli isteğe bağlı bulmaca (data/goals.json, tools/gen-goals.mjs).
// Ana yolu ve level dengesini etkilemez. İlk bitirişte SIDE_REWARD; tekrar oynayınca yalnızca yeni yıldızlar ödül verir.
export const SIDE_LEVELS = { every: 15, count: 40 };
export const SIDE_REWARD = { flakes: 2, hints: 1 };
export const GOALS = {
  home: { title: 'Eve dön', ico: '🏠', ui: 'tab_home', art: 'ui_tab_home', color: '#ff8c42', text: 'Balıkları topla, sonra Pofi\'yi iglonun üstünde durdur. Balık kalmışsa iglo yalnızca fren olur.' },
  crate: { title: 'Kasayı yerleştir', ico: '📦', ui: 'crate', art: 'obj_crate', color: '#c98b4f', text: 'Kasaları işaretli yerlere it. Kasa bir şeye çarpana kadar kayar; tam işaretin üstünde durmalı.' },
  crack: { title: 'Buzları kır', ico: '🧊', ui: 'crack', art: 'tile_crack', color: '#3d8fe0', text: 'Bütün çatlak buzların üstünden geç. Kırılan buz suya döner; sırayı iyi planla, mahsur kalma.' },
};
export const MASTER_REWARD = { coins: 1000, hints: 3, flakes: 10 }; // ilk bitirişte, rozetle birlikte

// Başarımlar: her birinin kademeleri var; kademe ödülü ACH_REWARD[kademe]. stat, main.js'te hesaplanır.
export const ACHIEVEMENTS = [
  { id: 'levels', ui: 'route', name: 'Kâşif', icon: '🧭', stat: 'levels', text: n => `${n} level bitir`, tiers: [10, 50, 100, 250, 500, 1000] },
  { id: 'stars', name: 'Yıldız avcısı', icon: '⭐', stat: 'stars', text: n => `${n} yıldız topla`, tiers: [30, 150, 300, 750, 1500, 3000] },
  { id: 'perfect', name: 'Kusursuz', icon: '✨', stat: 'perfect', text: n => `${n} leveli 3 yıldızla bitir`, tiers: [10, 50, 100, 300, 600, 1000] },
  { id: 'fish', ui: 'fish', name: 'Balıkçı', icon: '🐟', stat: 'fish', text: n => `${n} balık topla`, tiers: [50, 250, 1000, 3000, 8000] },
  { id: 'nohint', ui: 'hint', name: 'Kendi başına', icon: '🧠', stat: 'nohint', text: n => `İpucu kullanmadan ${n} level bitir`, tiers: [25, 100, 300, 600] },
  // ipucu, rota, güçlendirici ve ek +5 hamle olmadan ilk kez 3 yıldız alınan level sayısı (tekrar oynayıp 3 yıldıza çıkarmak da sayılır)
  { id: 'clean', name: 'Yardımsız usta', icon: '🏔️', stat: 'clean', text: n => `Yardım almadan ${n} leveli 3 yıldızla bitir`, tiers: [10, 50, 150, 400, 800] },
  { id: 'village', ui: 'tab_village', name: 'Köy kurucusu', icon: '🏘️', stat: 'vl', text: n => `Köy seviyesi ${n} ol`, tiers: [3, 5, 8, 10, 12] },
  { id: 'cocoa', name: 'Kakao ustası', icon: '☕', stat: 'cups', text: n => `${n} fincan kakao sat`, tiers: [50, 250, 1000, 5000] },
  { id: 'daily', ui: 'puzzle', name: 'Sadık dost', icon: '📅', stat: 'streak', text: n => `Günlük bulmacada ${n} günlük seri yap`, tiers: [3, 7, 14, 30] },
  { id: 'events', ui: 'event', name: 'Şenlik ruhu', icon: '🎉', stat: 'events', text: n => `${n} haftalık etkinliğin ödül yolunu bitir`, tiers: [1, 4, 12, 26, 52] },
  { id: 'wardrobe', ui: 'hat', name: 'Moda ikonu', icon: '🎩', stat: 'outfits', text: n => `${n} kıyafete sahip ol`, tiers: [3, 8, 15, 25] },
  { id: 'villagers', ui: 'villagers', name: 'Kalabalık köy', icon: '🐧', stat: 'villagers', text: n => `${n} köylü davet et`, tiers: [1, 3, 6] },
  { id: 'masters', ui: 'castle', name: 'Usta', icon: '🏰', stat: 'masters', text: n => `${n} usta levelini bitir`, tiers: [1, 3, 6] },
  { id: 'pets', ui: 'pet', name: 'Hayvan dostu', icon: '🐾', stat: 'pets', text: n => `${n} evcil dost sahiplen`, tiers: [1, 2, 3] },
  { id: 'feeds', ui: 'pet', name: 'Can dostu', icon: '🦊', stat: 'feeds', text: n => `Evcil dostunu ${n} kez besle`, tiers: [7, 30, 100] },
  { id: 'album', ui: 'fish', name: 'Balık koleksiyoncusu', icon: '🐠', stat: 'album', text: n => `Albüme ${n} nadir balık ekle`, tiers: [4, 12, 24] },
  { id: 'projects', ui: 'project', name: 'Köy mimarı', icon: '🏗️', stat: 'projects', text: n => `${n} köy projesi tamamla`, tiers: [1, 2, 3] },
  { id: 'sides', ui: 'tab_village', name: 'Yan yol kâşifi', icon: '🪧', stat: 'sides', text: n => `${n} yan yol bulmacası bitir`, tiers: [5, 15, 40] },
  { id: 'friends', ui: 'emote', name: 'Köyün sevgilisi', icon: '💛', stat: 'friends', text: n => `${n} köylünün hikâyesini bitir`, tiers: [1, 3, 6] },
  { id: 'merchant', ui: 'merchant', name: 'Tüccar dostu', icon: '⛵', stat: 'merchant', text: n => `Kaptan Mors'tan ${n} kez alışveriş yap`, tiers: [5, 20, 50] },
];
// Günlük görevler: her gün tarihe göre 3 görev seçilir (herkeste aynı gün aynı görevler). needs: o özellik açık değilse seçilmez.
export const DAILY_QUESTS = [
  { type: 'levels', need: 4, text: '4 level bitir' },
  { type: 'stars', need: 2, text: '2 leveli 3 yıldızla bitir' },
  { type: 'nohint', need: 2, text: 'İpucu kullanmadan 2 level bitir' },
  { type: 'fish', need: 15, text: '15 balık topla' },
  { type: 'replay', need: 1, text: 'Haritadan bir levelde yeni yıldız kazan' },
  { type: 'build', need: 1, text: 'Köyde bir yapı kur ya da geliştir' },
  { type: 'cocoa', need: 1, text: 'Yolculara kakao sat', needs: 'cocoa' },
  { type: 'evlevel', need: 1, text: '1 etkinlik leveli bitir' },
  { type: 'daily', need: 1, text: 'Günlük bulmacayı çöz', needs: 'dailyPuzzle' },
];
export const QUEST_REWARD = { coins: 60 };
export const QUEST_CHEST = { coins: 200, hints: 2, flakes: 2 }; // üç görev de alınınca

export const ACH_REWARD = [
  { coins: 100 }, { coins: 200, hints: 1 }, { coins: 350, flakes: 3 }, { coins: 500, hints: 3 }, { coins: 800, flakes: 8 }, { coins: 1200, hints: 5, flakes: 10 },
];

// Arkadaş köyü ziyareti: günde en fazla 3 farklı köyden hediye.
export const VISIT_GIFT = { coins: 20, perDay: 3 };

// Gardırop: seçilen kıyafet oyunda da görünür.
export const WARDROBE = {
  hat: [
    { id: 'none', name: 'Yok', price: 0 },
    { id: 'beanieRed', name: 'Kırmızı bere', price: 60 },
    { id: 'beanieBlue', name: 'Mavi bere', price: 60 },
    { id: 'earmuffs', name: 'Kulaklık', price: 120 },
    { id: 'tophat', name: 'Silindir', price: 180 },
    { id: 'crown', name: 'Taç', price: 250 },
    { id: 'north', name: 'Kuzey beresi', price: 0, reward: 5 },
    { id: 'sealhood', name: 'Fok başlığı', price: 0, reward: 7 },
    { id: 'icecrown', name: 'Buz tacı', price: 0, reward: 12 },
    { id: 'fishhat', name: 'Balık şapka', price: 0, event: 'fish' },
    { id: 'helmet', name: 'Kızak kaskı', price: 0, event: 'sled' },
    { id: 'starhat', name: 'Yıldız şapka', price: 0, event: 'aurora' },
    { id: 'partyhat', name: 'Parti şapkası', price: 0, event: 'newyear' },
    { id: 'builder', name: 'İnşaat beresi', price: 0, event: 'igloo' },
    { id: 'lantern', name: 'Fener şapka', price: 0, event: 'lantern' },
    { id: 'chisel', name: 'Heykeltıraş beresi', price: 0, event: 'sculpture' },
    { id: 'bearears', name: 'Ayı kulaklı bere', price: 0, event: 'polarbear' },
    { id: 'tulip', name: 'Lale şapka', price: 0, event: 'spring' },
    { id: 'eggshell', name: 'Yumurta kabuğu', price: 0, event: 'eggs' },
    // gezgin tüccarın getirdikleri (merchant: tüccardaki fiyat)
    { id: 'captain', name: 'Kaptan şapkası', price: 0, merchant: 3000 },
    { id: 'furcap', name: 'Kürk kalpak', price: 0, merchant: 2500 },
    { id: 'pompom', name: 'Ponponlu bere', price: 0, merchant: 1500 },
    { id: 'icehelm', name: 'Buz miğferi', price: 0, merchant: 4000 },
    { id: 'beret', name: 'Ressam beresi', price: 0, merchant: 2000 },
    { id: 'flowercrown', name: 'Çiçek tacı', price: 0, merchant: 3500 },
  ],
  scarf: [
    { id: 'none', name: 'Yok', price: 0 },
    { id: 'red', name: 'Kırmızı', price: 50 },
    { id: 'blue', name: 'Mavi', price: 50 },
    { id: 'green', name: 'Yeşil', price: 50 },
    { id: 'yellow', name: 'Sarı', price: 50 },
    { id: 'striped', name: 'Çizgili', price: 150 },
    { id: 'aurora', name: 'Kuzey ışığı', price: 0, reward: 10 },
    { id: 'flakes', name: 'Kar taneli', price: 0, event: 'snowflake' },
    { id: 'penguin', name: 'Penguenli', price: 0, event: 'penguin' },
    { id: 'hearts', name: 'Kalpli', price: 0, event: 'valentine' },
    { id: 'candy', name: 'Şeker çizgili', price: 0, event: 'sugar' },
    { id: 'rainbow', name: 'Gökkuşağı', price: 0, merchant: 2500 },
    { id: 'knit', name: 'Örgü', price: 0, merchant: 1500 },
    { id: 'starry', name: 'Yıldızlı', price: 0, merchant: 3000 },
    { id: 'plaid', name: 'Ekose', price: 0, merchant: 2000 },
  ],
};

// ---------- Coin harcama yerleri (2026-11-04) ----------
// Tek seferlik harcamalar birkaç haftada bitiyordu; bunlar tekrar eden harcama yerleri. Fiyatlar ilk öneri (denge Mustafa'da).

// Balık pazarı: coin ile kar tanesi. Gün içinde her alımda fiyat artar, gün dönünce başa döner (P.flakeTrade).
// Coin'i yapı ilerlemesine bağlayan tek yol; artan fiyat ilerlemenin patlamasını önler.
export const FLAKE_TRADE = { base: 400, mult: 1.5, round: 50 };

// Hafif idle: iskele sen yokken balık tutar, balıklar yalnızca evcil dostu beslemeye yarar (coin vermez).
// Saatte iskele seviyesi × perLevel balık, capHours saatlik üretimde durur; kaçırmanın cezası yok.
export const PIER_CATCH = { perLevel: 0.5, capHours: 12 };
// "Sen yokken" kartı bu kadar dakika uzak kalınca çıkar.
export const AWAY_MIN = 60;

// Gezgin tüccar: haftada 1-2 gün Buz Limanı'na teknesiyle yanaşır (hangi gün geleceğini gazete yazar).
// Her gelişte vitrin: nadir kıyafet, nadir süs, evcil hayvan oyuncağı, balık yemi, gizemli paket, sınırlı kar tanesi.
// Kıyafet/süs/oyuncak sırayla döner; kaçırılan ürün birkaç hafta sonra yine gelir.
export const MERCHANT = {
  bait: { price: 500, levels: 10, bonus: 0.1 }, // sonraki 10 levelde nadir balık şansı +10 puan (yalnızca albüm)
  mystery: { price: 1000 },
  flakes: { mult: 0.8, limit: 3 }, // pazarın o anki fiyatının %80'i, ziyaret başına en fazla 3
};
// Tüccarın getirdiği kıyafetler WARDROBE'da merchant fiyatıyla durur; süsler DECOR_ITEMS'ta merchant fiyatıyla.

// Evcil dostlar: her tür tek renk ve ayrı coin'le sahiplenilir; köyde biri Pofi'nin yanında gezer.
// Köy Lv4 ya da level 30'dan sonra sahiplenilir. Günde bir kez levellerde
// toplanan balıklardan verilerek beslenir; beslenince o gün küçük bir hediye getirir ve nadir balık şansı artar.
// Ceza yok: beslenmezse yalnızca uykulu görünür, hiçbir şey kaybettirmez.
export const PET = {
  vl: 4, level: 30, feedFish: 5, rareBonus: 0.05, renamePrice: 300,
  kinds: [
    { id: 'fox', name: 'Kar tilkisi', ico: '🦊', price: 1500, petName: 'Pamuk' },
    { id: 'rabbit', name: 'Kutup tavşanı', ico: '🐰', price: 2000, petName: 'Ponpon' },
    { id: 'owl', name: 'Kar baykuşu', ico: '🦉', price: 3000, petName: 'Puhu' },
  ],
  collarPrice: 150, // tasma rengi, COLORS paletinden
  beds: [{ name: 'Hasır minder', price: 400 }, { name: 'Yünlü sepet', price: 900 }, { name: 'Kubbeli yuva', price: 1500 }],
  gifts: [{ w: 5, coins: [100, 200] }, { w: 3, hints: 1 }, { w: 2, flakes: [1, 2] }],
};
// Oyuncaklar yalnızca gezgin tüccarda satılır; dostu köyde onunla oynar.
export const PET_TOYS = [
  { id: 'ball', name: 'Kartopu oyuncağı', price: 300 },
  { id: 'yarn', name: 'Yün yumağı', price: 500 },
  { id: 'plush', name: 'Balık peluş', price: 800 },
  { id: 'sled', name: 'Mini kızak', price: 1500 },
];

// Köy projeleri: Çam Ormanı'nda üç büyük yapı. Coin parça parça yatırılır; üç aşamada görünür,
// bitince küçük kalıcı bir bonus verir. at: taban ortası (genişlik/yükseklik oranı, x 2-3 Çam Ormanı paneli).
export const PROJECTS = [
  { id: 'spring', name: 'Sıcak kaplıca', cost: 6000, at: [2.24, 0.66], cell: 0.34, bonus: 'rare', value: 0.03, text: 'Nadir balık şansı +3 puan' },
  { id: 'clock', name: 'Saat kulesi', cost: 10000, at: [2.52, 0.52], cell: 0.3, bonus: 'freeHint', value: 1, text: 'Her gün +1 ücretsiz ipucu' },
  { id: 'lift', name: 'Telesiyej', cost: 16000, at: [2.8, 0.64], cell: 0.36, bonus: 'coinPct', value: 0.05, text: 'Level coin ödülü +%5' },
];
export const PROJECT_STAGES = ['Temel', 'Yarısı', 'Tamamlandı'];
export const PROJECT_STEPS = [500, 2000]; // yatırma düğmeleri (+ "kalanı")

// Köy Gazetesi: her pazartesi yeni sayı. Metinler kodda üretilir.
export const GAZETTE = { hardBonus: 150 }; // haftanın zor levelini o hafta 3 yıldızla bitirene
export const RIDDLES = [
  { q: 'Ne kadar çok olursa o kadar az görürsün. Nedir?', a: 'Karanlık' },
  { q: 'Kışın gelir, baharda gider; havuç burnu, kömür gözü var. Kimdir?', a: 'Kardan adam' },
  { q: 'Suya düşer ıslanmaz, güneşe çıkar kaybolur. Nedir?', a: 'Buz' },
  { q: 'Gökten iner, iz bırakmaz; her biri başka desenli. Nedir?', a: 'Kar tanesi' },
  { q: 'Ağzı var konuşmaz, yatağı var uyumaz. Nedir?', a: 'Nehir' },
  { q: 'Önce kırarsın, sonra kullanırsın. Nedir?', a: 'Yumurta' },
  { q: 'Benim olduğu halde başkaları benden çok kullanır. Nedir?', a: 'Adın' },
  { q: 'Pofi kayar, kayar; nerede durur?', a: 'Bir şeye çarpınca' },
  { q: 'Gündüz yatar, gece kalkar; köyü ışıl ışıl yakar. Nedir?', a: 'Fener' },
  { q: 'Delik deşik ama su tutar. Nedir?', a: 'Sünger' },
  { q: 'Elleri var tutmaz, yüzü var gülmez. Nedir?', a: 'Saat' },
  { q: 'Kanadı var uçamaz, suda balık gibi yüzer. Kimdir?', a: 'Penguen' },
  { q: 'Bir sıcak fincan, üstü köpük; içen gülümser. Nedir?', a: 'Kakao' },
  { q: 'Kuzeyde gökyüzü dans eder, renk renk perde açar. Nedir?', a: 'Kuzey ışıkları' },
  { q: 'Ne kadar alırsan o kadar büyür. Nedir?', a: 'Çukur' },
  { q: 'Hep önündedir ama göremezsin. Nedir?', a: 'Gelecek' },
];

// Sipariş panosu: köydeki köylüler her gün birkaç sipariş verir. Siparişler boşta üreten yapılardan karşılanır:
// kakao standının fincanı, iskelenin balığı. Teslim edince coin ve dostluk puanı; o günün hepsi bitince küçük bonus.
// Adet, yapının birikim sınırına göre seçilir (capShare: sınırın en fazla bu kadarı), böylece her sipariş karşılanabilir.
// Ertesi gün liste yenilenir. Dengesi Mustafa'da (coinPer: birim başına coin).
export const ORDERS = {
  slots: 3, vl: 3, friendPts: 2, bonusFlakes: 1,
  kinds: {
    cups: { needs: 'cocoa', min: 4, max: 14, capShare: 0.5, coinPer: 9, name: 'fincan kakao' },
    fish: { needs: 'pier', min: 2, max: 6, capShare: 0.4, coinPer: 25, name: 'balık' },
  },
};

// Müzik (Mustafa, docs/pofi-muzik-suno.html). Hepsi -16 LUFS'a eşitlendi, AAC 112 kbps (assets/music).
// home: menüler, harita, etkinlik. game: level aralığına göre (from: o levelden itibaren). village: gündüz iki parça
// sırayla çalar; gece (köy Lv6+ ve 20:00-06:00, sahne de geceyken) kuzey ışıkları parçası döner. Boş bırakılan yerde
// müzik çalmaz. Yeni parça gelince buraya eklenir: ör. game'e { from: 136, src: '.../game_aurora.m4a' }.
export const MUSIC = {
  home: 'assets/music/menu_main.m4a',
  game: [
    { from: 1, src: 'assets/music/game_glacier.m4a' },
    { from: 61, src: 'assets/music/game_ramp.m4a' },
  ],
  village: { day: ['assets/music/village_day.m4a', 'assets/music/village_aurora.m4a'], night: 'assets/music/village_aurora.m4a' },
  jingles: { win: 'assets/music/jingle_win.m4a' },
};

// Kıyafet boyama: sahip olunan bir şapka ya da atkı için renk başına bir kez ödenir (COLORS paleti).
export const DYE_PRICE = 100;
// Pofi'nin ifadeleri: köyde Pofi'ye dokununca yapar.
export const EMOTES = [
  { id: 'wave', name: 'El sallama', price: 400 },
  { id: 'dance', name: 'Dans', price: 900 },
  { id: 'spin', name: 'Piruet', price: 1400 },
];
