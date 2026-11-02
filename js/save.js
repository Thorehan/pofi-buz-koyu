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
    village: {}, // { binaId: seçili stil indeksi } — kurulu yapılar
    styles: {}, // { binaId: [açılmış stil indeksleri] }
    outfit: { hat: 'none', scarf: 'none' },
    owned: { hat: ['none'], scarf: ['none'] },
    zoneRewardClaimed: false,
    cocoaTs: Date.now(),
    cocoaBank: 0,
    levelsSinceInter: 0,
    lastInterTs: 0,
    skipNextInter: false,
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
    if (s) return { ...defaults(), ...s };
  } catch { /* kayıt yok veya erişilemiyor */ }
  return defaults();
}

export function save(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* yoksay */ }
}

export function resetSave() {
  try { localStorage.removeItem(KEY); } catch { /* yoksay */ }
}
