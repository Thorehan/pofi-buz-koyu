// Kullanım: node tools/zorluk-analizi.mjs [başlangıç] [bitiş]
// Her level için en kısa çözümden daha derin zorluk ölçüleri çıkarır (leveller değişmez, yalnızca okunur):
//  - durum: tahtada ulaşılabilen farklı konum sayısı (CAP'te kesilir)
//  - tuzak: ulaşılabilen konumların yüzde kaçından artık kazanılamıyor (geri al gerektiren çıkmaz oranı)
//  - ilkTuzak: ilk hamle seçeneklerinden kaçı leveli kazanılamaz hâle getiriyor / toplam geçerli ilk hamle
//  - optimal: en kısa uzunluktaki farklı çözüm sayısı (1 = tek doğru yol)
//  - effort: en kısa çözümden kısa mesafedeki konum sayısı (arama yükü)
//  - narrow: en kısa çözüm boyunca her adımda kaç hamle "hâlâ en kısa yolda" tutuyor (dar geçitler)
// Çıktı: docs/denge/zorluk-analizi.json (+ özet konsola)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = await import(pathToFileURL(join(root, 'js', 'engine.js')).href);
const levels = JSON.parse(readFileSync(join(root, 'data', 'levels.json'), 'utf8'));
const CAP = 20000;
const from = Math.max(1, +process.argv[2] || 1), to = Math.min(levels.length, +process.argv[3] || levels.length);

function analyze(def) {
  const { L, S } = E.parseLevel(def);
  const dirs = S.q >= 0 ? 8 : 4;
  const key = s => JSON.stringify(s);
  const idx = new Map([[key(S), 0]]), states = [S], dist = [0], edges = [], wins = [];
  let capped = false;
  for (let i = 0; i < states.length; i++) {
    const s = states[i], out = [];
    if (E.won(L, s)) { wins.push(i); edges.push(out); continue; }
    for (let d = 0; d < dirs; d++) {
      const r = E.simulate(L, s, d);
      if (!r) continue;
      const k = key(r.state);
      let j = idx.get(k);
      if (j === undefined) {
        if (states.length >= CAP) { capped = true; continue; }
        j = states.length; idx.set(k, j); states.push(r.state); dist.push(dist[i] + 1);
      }
      out.push(j);
    }
    edges.push(out);
  }
  const n = states.length;
  // geriye: kazanmaya ulaşabilen durumlar
  const rev = Array.from({ length: n }, () => []);
  edges.forEach((out, i) => out.forEach(j => rev[j].push(i)));
  const alive = new Uint8Array(n), q = [...wins];
  wins.forEach(w => { alive[w] = 1; });
  for (let i = 0; i < q.length; i++) for (const p of rev[q[i]]) if (!alive[p]) { alive[p] = 1; q.push(p); }
  const minLen = wins.length ? Math.min(...wins.map(w => dist[w])) : null;
  // en kısa çözüm sayısı (BFS katmanlarında yol sayımı)
  const ways = new Float64Array(n); ways[0] = 1;
  const order = [...Array(n).keys()].sort((a, b) => dist[a] - dist[b]);
  for (const i of order) for (const j of edges[i]) if (dist[j] === dist[i] + 1) ways[j] += ways[i];
  const optimal = wins.filter(w => dist[w] === minLen).reduce((a, w) => a + ways[w], 0);
  const dead = alive.reduce((a, v) => a + (v ? 0 : 1), 0);
  const first = edges[0] || [];
  const firstDead = first.filter(j => !alive[j]).length;
  // en kısa yolda kalan dar geçitler: kazanmaya en kısa uzaklık (geriye BFS) ile
  const toWin = new Int32Array(n).fill(-1), q2 = [...wins];
  wins.forEach(w => { toWin[w] = 0; });
  for (let i = 0; i < q2.length; i++) for (const p of rev[q2[i]]) if (toWin[p] < 0) { toWin[p] = toWin[q2[i]] + 1; q2.push(p); }
  let narrow = 0, s0 = 0;
  for (let step = 0; step < (minLen || 0); step++) {
    const good = edges[s0].filter(j => toWin[j] === toWin[s0] - 1);
    if (good.length === 1 && edges[s0].length > 1) narrow++;
    s0 = good[0];
    if (s0 === undefined) break;
  }
  // arama yükü: en kısa çözümden daha kısa mesafedeki farklı konumlar (çözümü bulmadan önce düşünülebilecekler)
  const effort = minLen ? dist.filter(x => x < minLen).length : n;
  return {
    n: def.n, effort, tier: def.tier, min: def.min, limit: def.limit || null, grid: `${L.w}x${L.h}`, states: n, capped,
    dead: +(dead / n).toFixed(3), firstMoves: first.length, firstDead, optimal, narrow,
  };
}

const out = [];
const t0 = Date.now();
for (let i = from - 1; i < to; i++) {
  out.push(analyze(levels[i]));
  if ((i + 1) % 100 === 0) console.log(`${i + 1} level · ${((Date.now() - t0) / 1000).toFixed(0)} sn`);
}
writeFileSync(join(root, 'docs', 'denge', 'zorluk-analizi.json'), JSON.stringify(out));
console.log(`bitti: ${out.length} level, ${((Date.now() - t0) / 1000).toFixed(0)} sn`);
