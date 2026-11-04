// Kullanım: node tools/gen-goals.mjs [adet=40]
// Yan yol levellerini (farklı hedefli bulmacalar) üretip çözücüyle doğrular ve data/goals.json dosyasına yazar.
// Hedefler: home (balıkları al, iglonun üstünde dur), crate (kasaları işaretli yerde durdur), crack (bütün çatlak buzları kır).
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = await import(pathToFileURL(join(root, 'js', 'engine.js')).href);
const C = await import(pathToFileURL(join(root, 'js', 'config.js')).href);

const count = +(process.argv[2] || C.SIDE_LEVELS.count);
const TYPES = ['home', 'crate', 'crack'];

function candidate(type, i, after, r) {
  const w = Math.min(7, 4 + Math.floor(i / 8)), h = Math.min(9, 5 + Math.floor(i / 6));
  const g = Array.from({ length: h }, () => Array(w).fill('.'));
  const rockD = 0.1 + r() * 0.14;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (r() < rockD) g[y][x] = '#';
  const free = () => { const out = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g[y][x] === '.') out.push([x, y]); return out; };
  const put = ch => { const f = free(); if (!f.length) return; const [x, y] = f[Math.floor(r() * f.length)]; g[y][x] = ch; };
  const times = (n, ch) => { for (let k = 0; k < n; k++) put(ch); };
  put('P');
  times(1 + Math.floor(r() * 2), 's');
  if (type === 'home') { put('E'); times(1 + Math.floor(r() * (2 + Math.floor(i / 12))), 'f'); }
  if (type === 'crate') { const k = i >= 16 ? 2 : 1; times(k, 'B'); times(k, 'X'); if (r() < 0.4) put('f'); }
  if (type === 'crack') { times(Math.min(8, 3 + Math.floor(i / 7)), 'c'); if (r() < 0.5) put('f'); }
  // oyuncunun tanıdığı mekanikler biraz çeşni katar
  if (after >= 49 && r() < 0.5) put('>^<v'[Math.floor(r() * 4)]);
  if (after >= 165 && r() < 0.3) put('r');
  return g.map(row => row.join(''));
}

const out = [];
const t0 = Date.now();
for (let i = 0; i < count; i++) {
  const type = TYPES[i % 3], after = (i + 1) * C.SIDE_LEVELS.every;
  const lo = 3 + Math.floor(i / 5), hi = lo + 3 + Math.floor(i / 8);
  let best = null;
  for (let a = 0; a < 40000; a++) {
    const r = E.rng((i + 1) * 90001 + a * 7919);
    const rows = candidate(type, i, after, r);
    const { L, S } = E.parseLevel({ rows, goal: type });
    if (type === 'crate' && S.crates.length !== L.targets?.length) continue;
    const sol = E.solve(L, S, 15000);
    if (!sol || !sol.length) continue;
    const dist = sol.length < lo ? lo - sol.length : sol.length > hi ? sol.length - hi : 0;
    if (!best || dist < best.dist) best = { dist, rows, m: sol.length };
    if (dist === 0) break;
  }
  if (!best) throw new Error(`Yan yol ${i + 1} üretilemedi`);
  const { L, S } = E.parseLevel({ rows: best.rows, goal: type });
  const sol = E.solve(L, S, 200000);
  if (!sol || sol.length !== best.m) throw new Error(`Yan yol ${i + 1} doğrulanamadı`);
  out.push({ rows: best.rows, goal: type, min: sol.length, limit: null, tier: i < 10 ? 'medium' : i < 25 ? 'hard' : 'veryhard', mech: [type] });
  console.log(`Yan yol ${i + 1} (level ${after}'den sonra) ${type} ${best.rows[0].length}x${best.rows.length} en kısa ${sol.length}`);
}
writeFileSync(join(root, 'data', 'goals.json'), JSON.stringify(out));
console.log(`${out.length} yan yol, ${((Date.now() - t0) / 1000).toFixed(1)} sn`);
