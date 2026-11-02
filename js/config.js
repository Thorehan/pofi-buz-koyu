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
  cocoaPerBuildingPerHour: 4, // kakao standı kuruluysa, kurulu yapı başına coin/saat
  cocoaCapHours: 8,
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
};

// 7 günlük giriş ödülü; gün kaçırılırsa seri 1. güne döner. Reklamla x2.
export const DAILY_REWARDS = [
  { coins: 50 }, { hints: 1 }, { coins: 100 }, { flakes: 1 },
  { coins: 150 }, { hints: 2 }, { coins: 300, hints: 3 },
];
export const DAILY_PUZZLE = { unlockLevel: 5, coins: 100, streakBonus: 20 };

// Pofi'nin köyü. Her yapının 3 stili var: ilki kurulumla gelir, diğerleri coin ile açılır.
export const VILLAGE = {
  name: 'Bölge 1 · Buzul Koyu',
  reward: 300,
  buildings: [
    { id: 'igloo', name: 'İglo', cost: 1, styles: ['Klasik', 'Buz mavisi', 'Pembe şeker'], stylePrice: 80 },
    { id: 'pier', name: 'Balık iskelesi', cost: 2, styles: ['Meşe', 'Kızıl ahşap', 'Gri taş'], stylePrice: 80 },
    { id: 'snowman', name: 'Kardan adam', cost: 2, styles: ['Havuç burunlu', 'Atkılı', 'Silindir şapkalı'], stylePrice: 100 },
    { id: 'cocoa', name: 'Kakao standı', cost: 2, styles: ['Kırmızı tente', 'Yeşil tente', 'Mor tente'], stylePrice: 100 },
    { id: 'lights', name: 'Fener dizisi', cost: 3, styles: ['Sıcak sarı', 'Renkli', 'Buz mavisi'], stylePrice: 120 },
    { id: 'tree', name: 'Çam ağacı', cost: 3, styles: ['Sade', 'Süslü', 'Karlı'], stylePrice: 120 },
    { id: 'rink', name: 'Buz pisti', cost: 3, styles: ['Buz', 'Gökkuşağı', 'Gece'], stylePrice: 150 },
    { id: 'sled', name: 'Kızak tepesi', cost: 4, styles: ['Kırmızı kızak', 'Mavi kızak', 'Altın kızak'], stylePrice: 150 },
  ],
};

// Gardırop: seçilen kıyafet oyunda da görünür.
export const WARDROBE = {
  hat: [
    { id: 'none', name: 'Yok', price: 0 },
    { id: 'beanieRed', name: 'Kırmızı bere', price: 60 },
    { id: 'beanieBlue', name: 'Mavi bere', price: 60 },
    { id: 'earmuffs', name: 'Kulaklık', price: 120 },
    { id: 'tophat', name: 'Silindir', price: 180 },
    { id: 'crown', name: 'Taç', price: 250 },
  ],
  scarf: [
    { id: 'none', name: 'Yok', price: 0 },
    { id: 'red', name: 'Kırmızı', price: 50 },
    { id: 'blue', name: 'Mavi', price: 50 },
    { id: 'green', name: 'Yeşil', price: 50 },
    { id: 'yellow', name: 'Sarı', price: 50 },
    { id: 'striped', name: 'Çizgili', price: 150 },
  ],
};
