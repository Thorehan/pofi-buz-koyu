import { ECON } from './config.js';

const KEY = 'pofi.v1';
// Kayıt güvenliği: son sağlam kaydın kopyası (en çok 30 sn geriden gelir). Ana kayıt okunamazsa oyun bundan açılır.
// Okunamayan ana kayıt silinmez, BROKEN anahtarına taşınır (sonradan incelenebilsin).
const BAK = 'pofi.v1.bak';
const BROKEN = 'pofi.v1.broken';
const BAK_EVERY = 30000;
let lastBak = 0, failed = false, onFail = null;
// load() sonrası: { from: 'main' | 'backup' | 'new', broken: bool }
export const loadInfo = { from: 'new', broken: false };

function defaults() {
  return {
    profile: null, // { name, method: 'guest' | 'google' | 'apple', createdAt }
    level: 1,
    coins: ECON.startCoins,
    flakes: 0, // kar tanesi: köy yapıları için
    hints: ECON.startHints,
    stars: {},
    village: {}, // { binaId: { lv, style, color } } — kurulu yapılar
    land: 1, // açılmış bölge sayısı (DISTRICTS)
    styles: {}, // { binaId: [açılmış stil indeksleri] }
    colors: [], // açılmış renk kimlikleri (tüm yapılarda geçerli)
    vlClaimed: 1, // ödülü alınmış en yüksek köy seviyesi
    daily: { day: '', hints: 0, cont: 0 }, // günlük ücretsiz ipucu / +5 hamle sayaçları
    event: null, // { key, points, claimed: [basamak indeksleri] } — haftalık etkinlik
    visits: { day: '', seen: [] }, // bugün hediyesi alınan arkadaş köyleri
    outfit: { hat: 'none', scarf: 'none' },
    owned: { hat: ['none'], scarf: ['none'] },
    cocoaTs: Date.now(),
    cocoaCups: 0, // biriken fincan (kesirli; satışta tam fincanlar satılır)
    recipes: [], // alınan kakao tarifleri
    interior: {}, // { binaId: { yuvaId: sahip olunan en yüksek kademe (1-3) } }
    villagers: [], // davet edilen köylüler (Bobo hariç)
    decor: {}, // { süsYeriId: süsId }
    decorOwned: [], // etkinlik dükkânından alınan hatıra süsleri
    ach: { fish: 0, cups: 0, nohint: 0, events: 0, streak: 0 }, // başarım sayaçları (ilk bitirişler)
    achClaimed: {}, // { başarımId: alınmış kademe sayısı }
    starChests: 0, // açılmış yıldız sandığı sayısı
    quests: null, // { day, list: [{ type, need, have, claimed }], chest }
    mapSeen: 0,
    boosters: { route: 1, moves5: 1 }, // başlangıç hediyesi
    album: {}, // tür id -> kaç kez yakalandı
    albumSets: {}, // ödülü verilmiş setler
    masters: {}, // { bölgeIndeksi: en iyi yıldız } — usta levelleri // haritada en son gösterilen level (Pofi'nin yeni levele zıplaması için)
    hintLadder: null, // { day, n } — bugün coin'le alınan tek ipucu sayısı (fiyat merdiveni)
    priceRamp: null, // { day, pack, route, moves5 } — bugün coin'le alınan adetler (PRICE_RAMP)
    villageName: null, // köy ekranına ilk girişte sorulur; ilk isim ücretsiz, değiştirmek VILLAGE_RENAME_PRICE
    task: null, // { day, type, need, have, giver, claimed } — köylünün günlük işi
    settings: { haptics: true, sfx: true, ambient: true, music: true, sfxVol: 100, musicVol: 100 }, // düzeyler 0-100
    sides: {}, // { yan yol sırası: en iyi yıldız }
    goalsSeen: [], // anlatılmış hedef türleri
    friends: {}, // { köylü: { pts, ch: okunan bölüm, talk: gün, gift: gün } }
    storySeen: null, // okunan hikâye bölümleri (STORY indeksi); eski kayıtlarda geçilmiş bölümler sessizce işaretlenir
    unlocksSeen: null, // gösterilmiş "Yeni" kartları; eski kayıtlarda açık olanlar sessizce işaretlenir
    freeCoinDay: '',
    freeCoinCount: 0,
    dailyRewardDay: '',
    dailyRewardIdx: 0,
    dailyPuzzleDay: '',
    dailyPuzzleStreak: 0,
    // coin harcama yerleri (2026-11-04)
    lastSeen: null, // oyunun en son açık olduğu an ("Sen yokken" kartı için)
    pierFish: 0, // iskelenin tuttuğu balık (kesirli)
    orders: null, // { day, list: [{ giver, kind, n, done }], bonus } — sipariş panosu (günlük)
    shopSeen: '', // mağazanın açıldığı gün (nokta günde bir kez yanar)
    festival: null, // { month, pts, claimed: [bool], given: { cups, fish, coins } } — ayın köy festivali
    pierTs: null,
    flakeTrade: null, // { day, n } — pazarda bugün alınan kar tanesi (fiyat merdiveni)
    merchant: null, // { visit, bought: { ürün: adet } } — tüccarın son ziyareti
    bait: 0, // balık yeminin kalan level sayısı
    pet: null, // { kind, kinds: [], names: { tür: { name, named } }, collar, bed, toys: [], toy, collars: [], fedDay }
    fishDay: null, // { day, n } — bugün levellerde toplanan balık (tilkiyi beslemek için)
    projects: {}, // { projeId: yatırılan coin }
    gazette: {}, // { read: sayı, hard: zor level ödülü alınan sayı, riddle: cevabı açılan sayı }
    dyes: {}, // { 'hat:id': renkId } — giyilen parçanın boyası
    dyeOwned: [], // 'hat:id:renkId'
    emotes: [],
  };
}

// Okunabilir ve oyunun açılabileceği bir kayıt mı? (eksik alanlar varsayılanla dolar)
const usable = s => s && typeof s === 'object' && !Array.isArray(s) && Number.isInteger(s.level) && s.level >= 1 && Number.isFinite(s.coins)
  && s.stars && typeof s.stars === 'object' && s.village && typeof s.village === 'object';
function parse(key) {
  let raw = null;
  try { raw = localStorage.getItem(key); } catch { return { raw: null, s: null }; }
  if (raw === null) return { raw, s: null };
  try {
    const s = migrate({ ...defaults(), ...JSON.parse(raw) });
    return { raw, s: usable(s) ? s : null };
  } catch { return { raw, s: null }; }
}

export function load() {
  const main = parse(KEY);
  if (main.s) { loadInfo.from = 'main'; return main.s; }
  const bak = parse(BAK);
  if (main.raw !== null) {
    // ana kayıt var ama bozuk: üzerine yazılmadan önce kenara alınır
    loadInfo.broken = true;
    try { localStorage.setItem(BROKEN, main.raw); } catch { /* yer yoksa tutulamaz */ }
  }
  if (bak.s) { loadInfo.from = 'backup'; return bak.s; }
  loadInfo.from = 'new';
  return defaults();
}

// v0.1 köy kaydı { id: stil } → v0.2 { id: { lv, style, color } }
function migrate(s) {
  for (const [id, v] of Object.entries(s.village)) {
    if (typeof v === 'number') s.village[id] = { lv: 1, style: v, color: null };
  }
  delete s.zoneRewardClaimed;
  // v0.3: kakao coin yerine fincan olarak birikir (eski fiyat 5 coin/fincan)
  if (s.cocoaBank !== undefined) { s.cocoaCups = (s.cocoaCups || 0) + s.cocoaBank / 5; delete s.cocoaBank; }
  // Ara reklam kaldırıldı (kullanıcı kararı); eski sayaçları temizle.
  delete s.levelsSinceInter;
  delete s.lastInterTs;
  delete s.skipNextInter;
  return s;
}

// Kayıt yazılamazsa (depolama dolu, gizli sekme, tarayıcı izin vermiyor) bir kez haber verilir.
export function onSaveFail(fn) { onFail = fn; }

export function save(s) {
  try {
    const json = JSON.stringify(s);
    localStorage.setItem(KEY, json);
    failed = false;
    const now = Date.now();
    if (now - lastBak >= BAK_EVERY && usable(s)) { localStorage.setItem(BAK, json); lastBak = now; }
    return true;
  } catch (e) {
    if (!failed) { failed = true; onFail?.(e); }
    return false;
  }
}

export function resetSave() {
  try { localStorage.removeItem(KEY); localStorage.removeItem(BAK); } catch { /* yoksay */ }
  lastBak = 0;
}
