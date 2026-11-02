// Pofi kayma motoru: kurallar, BFS çözücü ve level üreticisi.
// Tarayıcıda ve Node'da (tools/gen-levels.mjs) aynı kod çalışır.

export const T = { ICE: 0, ROCK: 1, SNOW: 2, WATER: 3, CRACK: 4, LEVER: 5, GATE: 6, UP: 7, RIGHT: 8, DOWN: 9, LEFT: 10, BRIDGE: 11 };
export const DX = [0, 1, 0, -1];
export const DY = [-1, 0, 1, 0];
const ARROW_CH = { '^': T.UP, '>': T.RIGHT, v: T.DOWN, '<': T.LEFT };
const isArrow = t => t >= T.UP && t <= T.LEFT;
const walkable = t => t === T.ICE || t === T.SNOW || t === T.CRACK || t === T.BRIDGE || isArrow(t);

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- level okuma ----------
// Karakterler: . buz  # kaya  s kar  ~ su  c çatlak  L kol  G kapalı kapı  g açık kapı
//              ^ > v < ok  P Pofi  f balık  F kar üstünde balık  B kasa
export function parseLevel(def) {
  const h = def.rows.length, w = def.rows[0].length, size = w * h;
  const t = new Uint8Array(size);
  const fishIdx = new Int8Array(size).fill(-1), dynIdx = new Int8Array(size).fill(-1), gateIdx = new Int8Array(size).fill(-1);
  const fishCells = [], dynCells = [], gateCells = [], crates = [];
  let p = -1, gates = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = def.rows[y][x], i = y * w + x;
      let tile = T.ICE;
      if (ch === '#') tile = T.ROCK;
      else if (ch === 's' || ch === 'F') tile = T.SNOW;
      else if (ch === '~' || ch === 'c') { tile = ch === '~' ? T.WATER : T.CRACK; dynIdx[i] = dynCells.length; dynCells.push(i); }
      else if (ch === 'L') tile = T.LEVER;
      else if (ch === 'G' || ch === 'g') { tile = T.GATE; if (ch === 'g') gates |= 1 << gateCells.length; gateIdx[i] = gateCells.length; gateCells.push(i); }
      else if (ARROW_CH[ch] !== undefined) tile = ARROW_CH[ch];
      if (ch === 'P') p = i;
      if (ch === 'f' || ch === 'F') { fishIdx[i] = fishCells.length; fishCells.push(i); }
      if (ch === 'B') crates.push(i);
      t[i] = tile;
    }
  }
  const L = { w, h, t, fishCells, dynCells, gateCells, fishIdx, dynIdx, gateIdx, def };
  const S = { p, fish: 0, gates, dyn: new Array(dynCells.length).fill(0), crates: crates.sort((a, b) => a - b) };
  return { L, S };
}

// Kırılabilir/doldurulabilir hücre durumu: su 0=su 1=köprü · çatlak 0=sağlam 1=kırık(su) 2=köprü
export function tileOf(L, S, c) {
  const b = L.t[c];
  if (b === T.WATER) return S.dyn[L.dynIdx[c]] ? T.BRIDGE : T.WATER;
  if (b === T.CRACK) { const v = S.dyn[L.dynIdx[c]]; return v === 0 ? T.CRACK : v === 1 ? T.WATER : T.BRIDGE; }
  if (b === T.GATE) return (S.gates >> L.gateIdx[c]) & 1 ? T.ICE : T.GATE;
  return b;
}

export function neighbor(L, c, d) {
  const x = (c % L.w) + DX[d], y = Math.floor(c / L.w) + DY[d];
  return x < 0 || y < 0 || x >= L.w || y >= L.h ? -1 : y * L.w + x;
}

export const won = (L, S) => S.fish === (1 << L.fishCells.length) - 1;

// ---------- tek hamle ----------
// Dönüş: null (hiçbir şey değişmedi) veya { state, pPath, crate, fx }
// fx zamanları "adım" cinsinden (Pofi'nin hamle başından itibaren geçtiği hücre sayısı).
export function simulate(L, S, dir) {
  const n = { p: S.p, fish: S.fish, gates: S.gates, dyn: S.dyn.slice(), crates: S.crates.slice() };
  const fx = [];
  const pPath = [S.p];
  const seen = new Set();
  let cur = S.p, d = dir, crate = null, lever = false;

  for (;;) {
    const key = cur * 4 + d;
    if (seen.has(key)) break;
    seen.add(key);
    const nx = neighbor(L, cur, d);
    if (nx < 0) { fx.push({ k: 'bump', at: pPath.length - 1 }); break; }
    const ci = n.crates.indexOf(nx);
    if (ci >= 0) { crate = pushCrate(L, n, ci, d, cur, pPath.length - 1, fx); break; }
    const t = tileOf(L, n, nx);
    if (t === T.LEVER) { lever = true; break; }
    if (!walkable(t)) { fx.push({ k: 'bump', at: pPath.length - 1 }); break; }
    // Çatlak buz, Pofi ayrılınca kırılır.
    if (L.t[cur] === T.CRACK && n.dyn[L.dynIdx[cur]] === 0) {
      n.dyn[L.dynIdx[cur]] = 1;
      fx.push({ k: 'crack', cell: cur, at: pPath.length - 0.5 });
    }
    cur = nx;
    pPath.push(cur);
    const fi = L.fishIdx[cur];
    if (fi >= 0 && !((n.fish >> fi) & 1)) { n.fish |= 1 << fi; fx.push({ k: 'fish', cell: cur, at: pPath.length - 1 }); }
    if (t === T.SNOW) { fx.push({ k: 'snow', at: pPath.length - 1 }); break; }
    if (isArrow(t)) { d = t - T.UP; fx.push({ k: 'arrow', cell: cur, at: pPath.length - 1 }); }
  }
  n.p = cur;

  if (lever) {
    let mask = 0;
    L.gateCells.forEach((g, i) => { if (g !== n.p && !n.crates.includes(g)) mask |= 1 << i; });
    n.gates ^= mask;
    fx.push({ k: 'lever', at: pPath.length - 1 });
  }

  const moved = pPath.length > 1 || (crate && crate.moved) || lever;
  if (!moved) return null;
  return { state: n, pPath, crate: crate && crate.moved ? crate : null, fx, dir };
}

function pushCrate(L, n, ci, dir, penguinAt, at0, fx) {
  let c = n.crates[ci], d = dir;
  const path = [c], seen = new Set();
  for (;;) {
    const key = c * 4 + d;
    if (seen.has(key)) break;
    seen.add(key);
    const nx = neighbor(L, c, d);
    if (nx < 0 || nx === penguinAt || n.crates.includes(nx)) break;
    const t = tileOf(L, n, nx);
    if (t === T.WATER) {
      const di = L.dynIdx[nx];
      n.dyn[di] = L.t[nx] === T.WATER ? 1 : 2;
      n.crates.splice(ci, 1);
      path.push(nx);
      fx.push({ k: 'sink', cell: nx, at: at0 + path.length - 1 });
      return { moved: true, sunk: true, path, at0 };
    }
    if (!walkable(t)) break;
    c = nx;
    path.push(c);
    if (t === T.SNOW) break;
    if (isArrow(t)) d = t - T.UP;
  }
  if (path.length === 1) return { moved: false };
  n.crates[ci] = c;
  n.crates.sort((a, b) => a - b);
  fx.push({ k: 'push', at: at0 });
  return { moved: true, sunk: false, path, at0 };
}

// ---------- çözücü ----------
const stateKey = s => `${s.p}|${s.fish}|${s.gates}|${s.dyn.join('')}|${s.crates.join(',')}`;

// En kısa çözümün yön dizisi; çözüm yoksa veya durum sınırı aşılırsa null.
export function solve(L, S0, maxStates = 120000) {
  if (won(L, S0)) return [];
  const states = [S0], parent = [-1], via = [-1];
  const seen = new Set([stateKey(S0)]);
  for (let qi = 0; qi < states.length; qi++) {
    for (let d = 0; d < 4; d++) {
      const r = simulate(L, states[qi], d);
      if (!r) continue;
      const k = stateKey(r.state);
      if (seen.has(k)) continue;
      seen.add(k);
      states.push(r.state);
      parent.push(qi);
      via.push(d);
      if (won(L, r.state)) {
        const moves = [];
        for (let i = states.length - 1; i > 0; i = parent[i]) moves.push(via[i]);
        return moves.reverse();
      }
      if (states.length > maxStates) return null;
    }
  }
  return null;
}

// Çözümü oynatıp hangi mekaniklerin kullanıldığını say.
export function usage(L, S0, moves) {
  const u = { push: 0, sink: 0, crack: 0, lever: 0, arrow: 0, snow: 0 };
  let s = S0;
  for (const d of moves) {
    const r = simulate(L, s, d);
    for (const f of r.fx) {
      if (u[f.k] !== undefined) u[f.k]++;
      if (f.k === 'sink') u.push++; // batan kasa da itilmiş sayılır
    }
    s = r.state;
  }
  return u;
}

// ---------- level üreticisi ----------
const PATTERN = ['easy', 'easy', 'medium', 'easy', 'medium', 'medium', 'hard', 'easy', 'medium', 'veryhard'];
const STAGES = [
  { from: 1, mech: [], req: null },
  { from: 4, mech: ['snow'], req: 'snow' },
  { from: 9, mech: ['snow', 'crate'], req: 'push' },
  { from: 17, mech: ['snow', 'crate', 'water'], req: 'sink' },
  { from: 27, mech: ['snow', 'crack'], req: 'crack' },
  { from: 37, mech: ['snow', 'lever'], req: 'lever' },
  { from: 49, mech: ['snow', 'arrow'], req: 'arrow' },
];
const MIX = ['crate', 'water', 'crack', 'lever', 'arrow'];
const REQ_OF = { crate: 'push', water: 'sink', crack: 'crack', lever: 'lever', arrow: 'arrow', snow: 'snow' };

export function levelSpec(n, r = rng(n * 31 + 7)) {
  // Yeni mekaniğin ilk 2 leveli her zaman kolay.
  const intro = STAGES.some(s => s.req && n >= s.from && n < s.from + 2);
  const tier = n <= 10 || intro ? 'easy' : PATTERN[(n - 1) % 10];
  let w, h;
  if (n <= 3) [w, h] = [5, 5];
  else if (n <= 10) [w, h] = [5, 6];
  else if (n <= 30) [w, h] = [6, 7];
  else if (n <= 60) [w, h] = [6, 8];
  else [w, h] = [7, 9];

  let lo, hi;
  if (n === 1) [lo, hi] = [1, 1];
  else if (n <= 3) [lo, hi] = [2, 2];
  else if (n <= 6) [lo, hi] = [2, 3];
  else if (n <= 10) [lo, hi] = [3, 4];
  else if (n <= 25) [lo, hi] = [3, 4];
  else if (n <= 50) [lo, hi] = [3, 5];
  else if (n <= 100) [lo, hi] = [4, 6];
  else [lo, hi] = [4, 7];
  if (intro) hi = lo + 1;
  if (tier === 'medium') hi += 1;
  if (tier === 'hard') { lo += 1; hi += 2; }
  if (tier === 'veryhard') { lo += 2; hi += 2; }

  let mech, req;
  if (n < 61) {
    const st = [...STAGES].reverse().find(s => n >= s.from);
    mech = st.mech;
    // Aşamanın ilk 4 levelinde yeni mekanik her zaman şart; sonra çoğunlukla.
    req = st.req && (n - st.from < 4 || r() < 0.75) ? st.req : null;
  } else {
    const pool = MIX.slice();
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    mech = ['snow', ...pool.slice(0, 2 + Math.floor(r() * 2))];
    if (mech.includes('water') && !mech.includes('crate')) mech.push('crate');
    req = REQ_OF[mech[1]];
  }
  const fish = n <= 2 ? 1 : n <= 10 ? 1 + Math.floor(r() * 2) : 1 + Math.floor(r() * 3);
  return { n, tier, w, h, lo, hi, mech, req, fish };
}

function buildCandidate(spec, r) {
  const { w, h, mech } = spec;
  const g = Array.from({ length: h }, () => Array(w).fill('.'));
  const cells = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) cells.push([x, y]);
  const free = () => cells.filter(([x, y]) => g[y][x] === '.');
  const pick = () => { const f = free(); return f.length ? f[Math.floor(r() * f.length)] : null; };
  const put = ch => { const c = pick(); if (c) g[c[1]][c[0]] = ch; return c; };

  const rockD = 0.14 + r() * 0.1;
  for (const [x, y] of cells) if (r() < rockD) g[y][x] = '#';
  if (mech.includes('snow')) for (let k = 0, m = 1 + Math.floor(r() * 3); k < m; k++) put('s');
  if (mech.includes('water')) {
    for (let k = 0, m = 1 + Math.floor(r() * 2); k < m; k++) {
      const c = put('~');
      if (c && r() < 0.5) {
        const d = Math.floor(r() * 4), x = c[0] + DX[d], y = c[1] + DY[d];
        if (x >= 0 && y >= 0 && x < w && y < h && g[y][x] === '.') g[y][x] = '~';
      }
    }
  }
  if (mech.includes('crack')) for (let k = 0, m = 2 + Math.floor(r() * 3); k < m; k++) put('c');
  if (mech.includes('arrow')) for (let k = 0, m = 1 + Math.floor(r() * 2); k < m; k++) put('^>v<'[Math.floor(r() * 4)]);
  if (mech.includes('lever')) {
    put('L');
    for (let k = 0, m = 1 + Math.floor(r() * 3); k < m; k++) put(r() < 0.6 ? 'G' : 'g');
  }
  put('P');
  for (let k = 0; k < spec.fish; k++) put('f');
  if (mech.includes('crate')) for (let k = 0, m = 1 + Math.floor(r() * 2); k < m; k++) put('B');
  return g.map(row => row.join(''));
}

// Mekaniği etkisizleştiren dönüşümler: kasa → kaya, su → kaya, çatlak → buz, kol/kapı → kaya/buz, ok/kar → buz.
const NEUTRAL = {
  snow: ch => (ch === 's' ? '.' : ch === 'F' ? 'f' : ch),
  push: ch => (ch === 'B' ? '#' : ch),
  sink: ch => (ch === '~' ? '#' : ch),
  crack: ch => (ch === 'c' ? '.' : ch),
  lever: ch => (ch === 'L' || ch === 'G' ? '#' : ch === 'g' ? '.' : ch),
  arrow: ch => ('^>v<'.includes(ch) ? '.' : ch),
};

// Mekanik gerçekten bulmacanın parçası mı? Kaldırınca çözülemiyorsa ya da en kısa çözüm değişiyorsa evet.
function essential(req, rows, m) {
  const alt = rows.map(r => [...r].map(NEUTRAL[req]).join(''));
  const { L, S } = parseLevel({ rows: alt });
  const sol = solve(L, S, 60000);
  return !sol || sol.length !== m;
}

// Belirli bir level için çözülebilir, bandında ve yeni mekaniği gerçekten gerektiren bir tahta üret.
export function generateLevel(n, { seed = n, maxAttempts = 6000 } = {}) {
  const spec = levelSpec(n, rng(seed * 31 + 7));
  let best = null, loose = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const r = rng(seed * 100003 + attempt * 7717 + 1);
    const rows = buildCandidate(spec, r);
    const { L, S } = parseLevel({ rows });
    if (L.fishCells.length === 0 || S.p < 0) continue;
    const sol = solve(L, S, 60000);
    if (!sol || sol.length === 0) continue;
    const m = sol.length;
    const dist = m < spec.lo ? spec.lo - m : m > spec.hi ? m - spec.hi : 0;
    if (!loose || dist < loose.dist) loose = { dist, rows, sol };
    if (spec.req && (!usage(L, S, sol)[spec.req] || !essential(spec.req, rows, m))) continue;
    if (dist === 0) return finalize(spec, rows, sol);
    // Bant tutmazsa en yakın geçerli adayı yedekte tut.
    if (!best || dist < best.dist) best = { dist, rows, sol };
  }
  const pick = best || loose;
  if (!pick) throw new Error('Level üretilemedi: ' + n);
  return finalize(spec, pick.rows, pick.sol);
}

function finalize(spec, rows, sol) {
  const min = sol.length;
  const limit = spec.tier === 'hard' ? min + Math.max(3, Math.ceil(min * 0.5))
    : spec.tier === 'veryhard' ? min + Math.max(2, Math.ceil(min * 0.35))
    : null;
  return { n: spec.n, tier: spec.tier, rows, min, limit, mech: spec.mech };
}

export function starsFor(min, moves) {
  if (moves <= min) return 3;
  if (moves <= min + Math.max(2, Math.ceil(min * 0.5))) return 2;
  return 1;
}
