// Kullanım: node tools/level-stats.mjs
// data/levels.json'daki her level için denge tablosu (docs/denge/level-tablosu.csv) ve
// zorluk eğrisi grafiği (docs/denge/zorluk-egrisi.svg) üretir. Leveller değişmez, yalnızca okunur.
// CSV, Türkçe Excel'de doğrudan açılsın diye noktalı virgülle ayrılır ve BOM ile başlar.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = await import(pathToFileURL(join(root, 'js', 'engine.js')).href);
const C = await import(pathToFileURL(join(root, 'js', 'config.js')).href);

const levels = JSON.parse(readFileSync(join(root, 'data', 'levels.json'), 'utf8'));
const TIER = { easy: 'kolay', medium: 'orta', hard: 'zor', veryhard: 'çok zor' };
const MECH = {
  snow: 'kar', crate: 'kasa', water: 'su', crack: 'çatlak buz', lever: 'kol-kapı', arrow: 'ok', ramp: 'rampa', hole: 'buz deliği',
  melt: 'eriyen kar', seal: 'fok', order: 'sıralı balık', plate: 'basınç plakası', turn: 'döner tabla', fragile: 'kırılgan kaya',
  icicle: 'sarkıt', ball: 'kar topu', key: 'anahtar-kilit', raft: 'sal', wind: 'rüzgâr', pipi: 'Pipi',
};
const USE = {
  push: 'itme', sink: 'köprü', crack: 'kırma', lever: 'kol', arrow: 'ok', snow: 'kar freni', jump: 'uçuş', warp: 'ışınlanma',
  melt: 'eritme', seal: 'fok', order: 'sıra', plate: 'plaka', turn: 'dönüş', rock: 'kaya kırma', icicle: 'sarkıt', drift: 'kar yığını',
  key: 'anahtar', raft: 'sal', gust: 'rüzgâr', pipi: 'Pipi hamlesi',
};
const STATE_CAP = 5000;

// Erişilebilir durum sayısı: bulmacanın ne kadar "geniş" olduğunun kaba ölçüsü (kaç farklı konum denenebilir).
function reachable(L, S0) {
  const dirs = S0.q >= 0 ? 8 : 4, seen = new Set([JSON.stringify(S0)]), q = [S0];
  for (let i = 0; i < q.length && seen.size < STATE_CAP; i++) {
    for (let d = 0; d < dirs; d++) {
      const r = E.simulate(L, q[i], d);
      if (!r) continue;
      const k = JSON.stringify(r.state);
      if (!seen.has(k)) { seen.add(k); q.push(r.state); }
    }
  }
  return seen.size;
}

const head = ['Level', 'Grid', 'Hücre', 'Zorluk', 'En kısa çözüm', 'Hamle sınırı', '2 yıldız için en fazla hamle', 'Balık', 'Kaya',
  'Tahtadaki mekanikler', 'Çözümde kullanılanlar', 'Yeni mekanik', `Durum sayısı (${STATE_CAP}'de kesilir)`, 'Coin (3 yıldız, bonussuz)'];
const rows = [head];
const pts = [];
const t0 = Date.now();
for (const lv of levels) {
  const { L, S } = E.parseLevel(lv);
  const sol = E.solve(L, S, 200000);
  if (!sol || sol.length !== lv.min) throw new Error(`Level ${lv.n} çözülemedi ya da min tutmuyor`);
  const u = E.usage(L, S, sol);
  const used = Object.entries(u).filter(([, v]) => v).map(([k, v]) => `${USE[k] || k} ×${v}`).join(', ');
  const w = lv.rows[0].length, h = lv.rows.length;
  const rocks = lv.rows.join('').split('#').length - 1;
  const two = lv.min + Math.max(2, Math.ceil(lv.min * 0.5));
  const states = reachable(L, S);
  rows.push([
    lv.n, `${w}×${h}`, w * h, TIER[lv.tier], lv.min, lv.limit ?? '', two, L.fishCells.length, rocks,
    lv.mech.map(m => MECH[m] || m).join(', ') || 'temel', used, C.INTRO[lv.n]?.title || '', states,
    C.ECON.coin[lv.tier] + 3 * C.ECON.coinPerStar,
  ]);
  pts.push({ n: lv.n, min: lv.min, tier: lv.tier, states, limit: lv.limit });
}
const esc = v => { const s = String(v); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
mkdirSync(join(root, 'docs', 'denge'), { recursive: true });
writeFileSync(join(root, 'docs', 'denge', 'level-tablosu.csv'), '﻿' + rows.map(r => r.map(esc).join(';')).join('\r\n'));

// ---------- zorluk eğrisi (SVG) ----------
// Noktalar: her levelin en kısa çözümü (renk = zorluk sınıfı). Çizgi: 25 levellik kayan ortalama.
// Dikey çizgiler: grid büyümesi (mavi) ve yeni mekaniğin geldiği level (turuncu).
const W = 1600, H = 620, PL = 60, PR = 20, PT = 40, PB = 70;
const N = levels.length, maxMin = Math.max(...pts.map(p => p.min)) + 1;
const X = n => PL + ((n - 1) / (N - 1)) * (W - PL - PR), Y = m => PT + (1 - m / maxMin) * (H - PT - PB);
const col = { easy: '#3cc977', medium: '#3d9bff', hard: '#ff9f43', veryhard: '#e5484d' };
let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="sans-serif" font-size="13">
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="${PL}" y="24" font-size="18" font-weight="bold" fill="#1d3557">Pofi: zorluk eğrisi (en kısa çözüm, ${N} level)</text>`;
for (let m = 0; m <= maxMin; m += 2) svg += `<line x1="${PL}" x2="${W - PR}" y1="${Y(m)}" y2="${Y(m)}" stroke="#eef2f7"/><text x="${PL - 8}" y="${Y(m) + 4}" text-anchor="end" fill="#5a6f8c">${m}</text>`;
for (const [from, w, h] of E.GRID) svg += `<line x1="${X(from)}" x2="${X(from)}" y1="${PT}" y2="${H - PB}" stroke="#9fd3ff" stroke-dasharray="4 4"/><text x="${X(from) + 3}" y="${H - PB + 16}" fill="#2a5d8f" font-size="11">${w}×${h}</text>`;
for (const n of Object.keys(C.INTRO).map(Number).filter(n => n > 1)) svg += `<line x1="${X(n)}" x2="${X(n)}" y1="${PT}" y2="${H - PB}" stroke="#ffb066" stroke-width="1"/><text transform="translate(${X(n) + 3},${PT + 10}) rotate(90)" fill="#c26a12" font-size="10">${C.INTRO[n].title}</text>`;
for (const p of pts) svg += `<circle cx="${X(p.n).toFixed(1)}" cy="${Y(p.min).toFixed(1)}" r="2.2" fill="${col[p.tier]}" fill-opacity=".75"/>`;
const avg = pts.map((p, i) => { const a = pts.slice(Math.max(0, i - 12), i + 13); return a.reduce((s, q) => s + q.min, 0) / a.length; });
svg += `<polyline fill="none" stroke="#1d3557" stroke-width="2.5" points="${avg.map((a, i) => `${X(i + 1).toFixed(1)},${Y(a).toFixed(1)}`).join(' ')}"/>`;
svg += `<text x="${W / 2}" y="${H - 18}" text-anchor="middle" fill="#5a6f8c">level</text>`;
let lx = PL;
for (const [k, c] of Object.entries(col)) { svg += `<circle cx="${lx + 6}" cy="${H - 40}" r="5" fill="${c}"/><text x="${lx + 16}" y="${H - 36}" fill="#1d3557">${TIER[k]}</text>`; lx += 90; }
svg += `<line x1="${lx}" x2="${lx + 24}" y1="${H - 40}" y2="${H - 40}" stroke="#1d3557" stroke-width="2.5"/><text x="${lx + 30}" y="${H - 36}" fill="#1d3557">25 level ortalaması</text>`;
svg += `<line x1="${lx + 200}" x2="${lx + 200}" y1="${H - 48}" y2="${H - 32}" stroke="#9fd3ff" stroke-dasharray="4 4"/><text x="${lx + 206}" y="${H - 36}" fill="#1d3557">grid büyür</text>`;
svg += `<line x1="${lx + 300}" x2="${lx + 300}" y1="${H - 48}" y2="${H - 32}" stroke="#ffb066"/><text x="${lx + 306}" y="${H - 36}" fill="#1d3557">yeni mekanik</text>`;
svg += '</svg>';
writeFileSync(join(root, 'docs', 'denge', 'zorluk-egrisi.svg'), svg);
console.log(`${N} level, tablo ve grafik yazıldı (${((Date.now() - t0) / 1000).toFixed(1)} sn)`);
