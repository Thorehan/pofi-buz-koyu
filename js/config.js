// Tüm denge değerleri burada. İleride Remote Config'ten gelecek.

export const TIER_LABEL = { easy: '', medium: '', hard: 'ZOR', veryhard: 'ÇOK ZOR' };

export const ECON = {
  coin: { easy: 20, medium: 25, hard: 35, veryhard: 50 },
  coinPerStar: 5,
  hintBase: 50, // level içinde coin'le alınan ipucu: 50, 100, 200, 400… (her alımda 2 katı, her level baştan)
  hintAdAmount: 10, // ödüllü reklam bu kadar ipucu verir
  continueCost: 80,
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
  165: { title: 'Döner tabla', text: 'Döner tablanın üstünden geçen Pofi ve kasalar saat yönünde çeyrek tur döner ve yeni yönde kaymaya devam eder.', icon: 'turn' },
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
// seviyesi şartıyla coin'le açılır (arazi), içindeki yapılar kar tanesiyle kurulur. soon: içeriği henüz yok;
// ground: zemin görseli var (assets/art/bg_ground_<id>).
export const DISTRICTS = [
  { id: 'bay', name: 'Buzul Koyu', price: 0, vl: 1 },
  { id: 'harbor', name: 'Buz Limanı', price: 2000, vl: 5, ground: true, text: 'Yolcu teknesi, liman kafesi, balık pazarı ve liman çanı' },
  { id: 'forest', name: 'Çam Ormanı', price: 5000, vl: 9, soon: true },
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
];
export const TASK_REWARD = { coins: 120, flakes: 1 };

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
export const EVENT_THEMES = {
  newyear: { name: 'Yılbaşı Havai Fişekleri', color: '#7b4fd0', token: '🎆', text: 'Yeni yıl! Etkinlik levellerinde fazladan balık var.', rule: { fish: 1 }, bonus: 'star3', big: true },
  snowflake: { name: 'Kar Tanesi Avı', color: '#3d8fe0', token: '❄️', text: 'Eriyen karlar her yerde; frenini dikkatli kullan.', rule: { mech: ['melt'] }, bonus: 'star3', prize: { scarf: 'flakes' } },
  igloo: { name: 'İglo Yapım Haftası', color: '#4f8fc8', token: '🧱', text: 'Kasaları ve kar toplarını doğru yere taşı.', rule: { mech: ['crate', 'ball'] }, bonus: null },
  penguin: { name: 'Penguen Dostları', color: '#1d3557', token: '🐧', text: '20 Ocak Penguen Farkındalık Günü. Pipi de yardıma geliyor!', rule: { mech: ['pipi'] }, bonus: 'star3', big: true },
  fish: { name: 'Balık Festivali', color: '#ff8c42', token: '🐟', text: 'Tahtalar balık dolu; her balık +1 jeton.', rule: { fish: 2 }, bonus: 'fish', prize: { hat: 'fishhat' } },
  lantern: { name: 'Fener Şenliği', color: '#e5484d', token: '🏮', text: 'Çin Yeni Yılı. Karanlıkta fenerin ışığıyla yolunu bul.', rule: { dark: true }, bonus: 'nohint', big: true },
  valentine: { name: 'Kalpli Balıklar', color: '#ff5f8f', token: '💗', text: 'Sevgililer Günü. Kalpli balıkları sırayla topla.', rule: { order: true }, bonus: 'fish', big: true },
  sculpture: { name: 'Buz Heykeli Yarışması', color: '#6fb0e0', token: '🧊', text: 'Kırılgan kayaları yontarak yol aç.', rule: { mech: ['fragile'] }, bonus: null },
  polarbear: { name: 'Kutup Ayısı Ziyareti', color: '#8aa1b8', token: '🐻', text: 'Kutup Ayısı Günü. Foklar ortalıkta dolaşıyor.', rule: { mech: ['seal'] }, bonus: 'star3', big: true },
  sled: { name: 'Kızak Yarışı', color: '#e5484d', token: '🛷', text: 'Her etkinlik levelinde hamle sınırı var.', rule: { limit: true }, bonus: 'daily', prize: { hat: 'helmet' } },
  sugar: { name: 'Şeker Bayramı Kakaosu', color: '#c98b4f', token: '🍬', text: 'Bayramınız kutlu olsun! Her balık +1 jeton.', rule: { fish: 1 }, bonus: 'fish', big: true },
  spring: { name: 'Bahar Uyanışı', color: '#3fae5a', token: '🌷', text: 'Buzlar çatlıyor, karlar eriyor.', rule: { mech: ['melt', 'crack'] }, bonus: 'nohint', big: true },
  eggs: { name: 'Yumurta Avı', color: '#f5b81c', token: '🥚', text: 'Bahar şenliği. Balıkları sırayla topla.', rule: { order: true }, bonus: 'star3', big: true },
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
  ],
};
