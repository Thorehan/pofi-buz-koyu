// Tüm denge değerleri burada. İleride Remote Config'ten gelecek.

export const TIER_LABEL = { easy: '', medium: '', hard: 'ZOR', veryhard: 'ÇOK ZOR' };

export const ECON = {
  coin: { easy: 20, medium: 25, hard: 35, veryhard: 50 },
  coinPerStar: 5,
  hintCost: 60,
  continueCost: 80,
  continueMoves: 5,
  startCoins: 100,
  startHints: 3,
  freeCoinAmount: 50,
  freeCoinPerDay: 5,
  hintPack5Cost: 250,
  starFlake: 1, // 3 yıldıza ek kar tanesi
};

export const ADS = {
  interstitialMinLevel: 12,
  interstitialEveryLevels: 3,
  interstitialCooldownSec: 90,
  rewardedSec: 3,
  interstitialSec: 2,
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
export const BUILDINGS = [
  { id: 'igloo', name: 'İglo', costs: [1, 3, 6, 9, 12], unlock: 1, styles: ['Klasik', 'Kristal', 'Kar evi'], stylePrice: 120, buff: 'coinPct', values: [0.1, 0.2, 0.3, 0.4, 0.5] },
  { id: 'pier', name: 'Balık iskelesi', costs: [2, 3, 6, 9, 12], unlock: 1, styles: ['Meşe', 'Kızıl ahşap', 'Gri taş'], stylePrice: 100, buff: 'fishCoin', values: [1, 2, 3, 4, 5] },
  { id: 'snowman', name: 'Kardan adam', costs: [2, 4, 7, 11, 14], unlock: 1, styles: ['Havuç burunlu', 'Atkılı', 'Silindir şapkalı'], stylePrice: 100, buff: 'hardMoves', values: [1, 2, 3, 3, 4] },
  { id: 'cocoa', name: 'Kakao standı', costs: [2, 4, 7, 11, 14], unlock: 1, styles: ['Tenteli', 'Kulübe', 'Karavan'], stylePrice: 120, buff: 'cocoa', values: [20, 40, 60, 80, 100] },
  { id: 'lights', name: 'Fener dizisi', costs: [3, 4, 7, 11, 14], unlock: 1, styles: ['Sıcak sarı', 'Renkli', 'Buz mavisi'], stylePrice: 120, buff: 'freeHints', values: [1, 2, 3, 4, 5] },
  { id: 'tree', name: 'Çam ağacı', costs: [3, 5, 8, 12, 16], unlock: 1, styles: ['Sade', 'Süslü', 'Karlı'], stylePrice: 120, buff: 'dailyPct', values: [0.25, 0.5, 1, 1.5, 2] },
  { id: 'rink', name: 'Buz pisti', costs: [3, 5, 8, 12, 16], unlock: 1, styles: ['Buz', 'Gökkuşağı', 'Gece'], stylePrice: 150, buff: 'x5', base: 10, values: [14, 18, 22, 26, 30] },
  { id: 'sled', name: 'Kızak tepesi', costs: [4, 5, 8, 12, 16], unlock: 1, styles: ['Kızak', 'Kayak', 'Snowboard'], stylePrice: 150, buff: 'puzzlePct', values: [0.25, 0.5, 1, 1.5, 2] },
  { id: 'hut', name: 'Balıkçı kulübesi', costs: [3, 5, 8, 12, 16], unlock: 3, styles: ['Ahşap', 'Taş', 'Buz'], stylePrice: 150, buff: 'flakeChance', values: [0.1, 0.2, 0.3, 0.4, 0.5] },
  { id: 'lighthouse', name: 'Deniz feneri', costs: [4, 6, 9, 14, 18], unlock: 3, styles: ['Çizgili', 'Taş', 'Modern'], stylePrice: 150, buff: 'freeContinues', values: [1, 2, 3, 4, 5] },
  { id: 'fort', name: 'Kartopu kalesi', costs: [4, 6, 9, 14, 18], unlock: 5, styles: ['Kale', 'Şato', 'Kule'], stylePrice: 180, buff: 'discount', values: [0.1, 0.2, 0.3, 0.35, 0.4] },
  { id: 'observatory', name: 'Gözlem noktası', costs: [5, 7, 10, 15, 20], unlock: 7, styles: ['Kubbe', 'Teleskop', 'Anten'], stylePrice: 180, buff: 'cocoaCap', base: 8, values: [10, 12, 16, 20, 24] },
];

const pct = v => `%${Math.round(v * 100)}`;
export const BUFF_TEXT = {
  coinPct: v => `Level coin ödülü +${pct(v)}`,
  fishCoin: v => `Balık başına +${v} coin`,
  hardMoves: v => `Hamle limitli levellerde +${v} hamle`,
  cocoa: v => `Saatte ${v} coin pasif gelir`,
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
  ],
  scarf: [
    { id: 'none', name: 'Yok', price: 0 },
    { id: 'red', name: 'Kırmızı', price: 50 },
    { id: 'blue', name: 'Mavi', price: 50 },
    { id: 'green', name: 'Yeşil', price: 50 },
    { id: 'yellow', name: 'Sarı', price: 50 },
    { id: 'striped', name: 'Çizgili', price: 150 },
    { id: 'aurora', name: 'Kuzey ışığı', price: 0, reward: 10 },
  ],
};
