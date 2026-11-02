import { ECON } from './config.js';

const KEY = 'pofi.v1';

function defaults() {
  return {
    profile: null, // { name, method: 'guest' | 'google' | 'apple', createdAt }
    level: 1,
    coins: ECON.startCoins,
    flakes: 0, // kar tanesi: köy yapıları için
    hints: ECON.startHints,
    stars: {},
    village: {}, // { binaId: { lv, style, color } } — kurulu yapılar
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
    settings: { haptics: true, sfx: true, ambient: true },
    freeCoinDay: '',
    freeCoinCount: 0,
    dailyRewardDay: '',
    dailyRewardIdx: 0,
    dailyPuzzleDay: '',
    dailyPuzzleStreak: 0,
  };
}

export function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s) return migrate({ ...defaults(), ...s });
  } catch { /* kayıt yok veya erişilemiyor */ }
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

export function save(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* yoksay */ }
}

export function resetSave() {
  try { localStorage.removeItem(KEY); } catch { /* yoksay */ }
}
