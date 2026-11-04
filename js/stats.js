// Oynanış verisi: level başına deneme, takılma ve yardım sayıları. Yalnızca bu cihazda tutulur, sunucuya gitmez;
// oyuncu Ayarlar'dan dosya olarak dışa aktarır. Denge çalışması için (docs/denge). Kayıttan ayrı durur, yedeğe girmez.
const KEY = 'pofi.stats.v1';
const FIELDS = ['tries', 'wins', 'fails', 'quits', 'restarts', 'hints', 'routes', 'extra', 'stuck', 'secs', 'moves'];

let data = null;
function all() {
  if (data) return data;
  try { data = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { data = {}; }
  return data;
}
function store() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* yer yoksa veri tutulmaz, oyun etkilenmez */ }
}

// key: level numarası ya da usta leveli için 'U1'. info: { tier, min } tabloda görünsün diye.
export function statAdd(key, patch, info = null) {
  if (key === null || key === undefined) return;
  const d = all(), s = d[key] || (d[key] = {});
  if (info) { s.tier = info.tier; s.min = info.min; }
  for (const [k, v] of Object.entries(patch)) s[k] = (s[k] || 0) + v;
  store();
}
export function statBest(key, moves, stars) {
  const s = all()[key];
  if (!s) return;
  s.best = s.best ? Math.min(s.best, moves) : moves;
  s.stars = Math.max(s.stars || 0, stars);
  store();
}

const order = k => (String(k).startsWith('U') ? 1e6 + +String(k).slice(1) : +k);
export const statKeys = () => Object.keys(all()).sort((a, b) => order(a) - order(b));

// Özet: oynanan level, toplam deneme, en çok zorlanılan leveller (bitirme başına deneme).
export function statSummary() {
  const d = all(), keys = statKeys();
  const hard = keys.filter(k => (d[k].tries || 0) >= 2)
    .map(k => ({ k, rate: (d[k].tries || 0) / Math.max(1, d[k].wins || 0) }))
    .sort((a, b) => b.rate - a.rate).slice(0, 3);
  return { levels: keys.length, tries: keys.reduce((a, k) => a + (d[k].tries || 0), 0), hard };
}

// docs/denge/level-tablosu.csv ile aynı biçim: noktalı virgül ve BOM (Excel Türkçe açsın diye).
export function statCsv() {
  const d = all();
  const head = ['Level', 'Zorluk', 'En kısa çözüm', 'Deneme', 'Bitirme', 'Hamlesi biten', 'Yarıda bırakma', 'Baştan alma', 'İpucu', 'Rota', 'Ek hamle', 'Çıkmaz', 'Toplam süre (sn)', 'Ort. hamle', 'En iyi hamle', 'En iyi yıldız'];
  const rows = statKeys().map(k => {
    const s = d[k], [t, w, f, q, r, h, ro, e, st, sec] = FIELDS.map(x => s[x] || 0);
    return [k, s.tier || '', s.min || '', t, w, f, q, r, h, ro, e, st, Math.round(sec), w ? (s.moves / w).toFixed(1).replace('.', ',') : '', s.best || '', s.stars || ''].join(';');
  });
  return `﻿${head.join(';')}\n${rows.join('\n')}\n`;
}
