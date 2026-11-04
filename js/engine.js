// Pofi kayma motoru: kurallar, BFS çözücü ve level üreticisi.
// Tarayıcıda ve Node'da (tools/gen-levels.mjs) aynı kod çalışır.

export const T = {
  ICE: 0, ROCK: 1, SNOW: 2, WATER: 3, CRACK: 4, LEVER: 5, GATE: 6, UP: 7, RIGHT: 8, DOWN: 9, LEFT: 10, BRIDGE: 11,
  RAMP_UP: 12, RAMP_RIGHT: 13, RAMP_DOWN: 14, RAMP_LEFT: 15, HOLE: 16, MELT: 17,
  PLATE: 18, PGATE: 19, TURN: 20, FRAGILE: 21, ICICLE: 22, LOCK: 23, FLAG: 24,
};
export const DX = [0, 1, 0, -1];
export const DY = [-1, 0, 1, 0];
const ARROW_CH = { '^': T.UP, '>': T.RIGHT, v: T.DOWN, '<': T.LEFT };
const RAMP_CH = { 8: T.RAMP_UP, 6: T.RAMP_RIGHT, 2: T.RAMP_DOWN, 4: T.RAMP_LEFT }; // sayısal tuş takımı yönleri
const ORDER_CH = { x: 1, y: 2, z: 3, w: 4 }; // sıralı balıklar (c çatlak buz olduğu için harf çakışmasın)
const isArrow = t => t >= T.UP && t <= T.LEFT;
export const isRamp = t => t >= T.RAMP_UP && t <= T.RAMP_LEFT;
const walkable = t => t === T.ICE || t === T.SNOW || t === T.MELT || t === T.CRACK || t === T.BRIDGE || isArrow(t)
  || t === T.PLATE || t === T.TURN || t === T.ICICLE;
const stops = t => t === T.SNOW || t === T.MELT;
export const RAMP_FLIGHT = 2; // rampadan sonra uçulan hücre sayısı; iniş bir sonrakine

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
// Karakterler: . buz  # kaya  s kar  m eriyen kar  ~ su  c çatlak  L kol  G kapalı kapı  g açık kapı
//              ^ > v < ok  8 6 2 4 rampa (yukarı, sağ, aşağı, sol)  O buz deliği (ikişer eşleşir)
//              P Pofi  f balık  F kar üstünde balık  x y z w sıralı balık (1-4)  B kasa  S yatay fok  Z dikey fok
//              _ basınç plakası  H plaka kapısı  r döner tabla  k kırılgan kaya  i sarkıt  o kar topu
//              j anahtar balık  l buz kilidi  R su üstünde buz salı  W rüzgâr bayrağı  Q Pipi (ikinci penguen)
export function parseLevel(def) {
  const h = def.rows.length, w = def.rows[0].length, size = w * h;
  const t = new Uint8Array(size);
  const fishIdx = new Int8Array(size).fill(-1), dynIdx = new Int8Array(size).fill(-1), gateIdx = new Int8Array(size).fill(-1);
  const holePair = new Int16Array(size).fill(-1);
  const fishCells = [], fishOrder = [], dynCells = [], gateCells = [], crates = [], holes = [], seals = [];
  const plates = [], pgates = [], keys = [], balls = [], rafts = [];
  let p = -1, gates = 0, q = -1, wind = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = def.rows[y][x], i = y * w + x;
      let tile = T.ICE;
      if (ch === '#') tile = T.ROCK;
      else if (ch === 's' || ch === 'F') tile = T.SNOW;
      else if (ch === '~' || ch === 'c' || ch === 'm' || ch === 'R' || ch === 'k' || ch === 'i') {
        tile = { '~': T.WATER, R: T.WATER, c: T.CRACK, m: T.MELT, k: T.FRAGILE, i: T.ICICLE }[ch];
        dynIdx[i] = dynCells.length;
        dynCells.push(i);
        if (ch === 'R') rafts.push(i);
      }
      else if (ch === '_') { tile = T.PLATE; plates.push(i); }
      else if (ch === 'H') { tile = T.PGATE; pgates.push(i); }
      else if (ch === 'r') tile = T.TURN;
      else if (ch === 'l') tile = T.LOCK;
      else if (ch === 'W') { tile = T.FLAG; wind = 1; }
      if (ch === 'j') keys.push(i);
      if (ch === 'o') balls.push(i);
      if (ch === 'Q') q = i;
      else if (ch === 'L') tile = T.LEVER;
      else if (ch === 'G' || ch === 'g') { tile = T.GATE; if (ch === 'g') gates |= 1 << gateCells.length; gateIdx[i] = gateCells.length; gateCells.push(i); }
      else if (ch === 'O') { tile = T.HOLE; holes.push(i); }
      else if (ARROW_CH[ch] !== undefined) tile = ARROW_CH[ch];
      else if (RAMP_CH[ch] !== undefined) tile = RAMP_CH[ch];
      if (ch === 'P') p = i;
      if (ch === 'f' || ch === 'F' || ORDER_CH[ch]) { fishIdx[i] = fishCells.length; fishCells.push(i); fishOrder.push(ORDER_CH[ch] || 0); }
      if (ch === 'B') crates.push(i);
      if (ch === 'S') seals.push(i * 4 + 1); // sağa doğru başlar
      if (ch === 'Z') seals.push(i * 4 + 2); // aşağı doğru başlar
      t[i] = tile;
    }
  }
  for (let k = 0; k + 1 < holes.length; k += 2) { holePair[holes[k]] = holes[k + 1]; holePair[holes[k + 1]] = holes[k]; }
  const L = { w, h, t, fishCells, fishOrder, dynCells, gateCells, fishIdx, dynIdx, gateIdx, holePair, plates, pgates, keys, def };
  const S = {
    p, fish: 0, gates, dyn: new Array(dynCells.length).fill(0), crates: crates.sort((a, b) => a - b), seals,
    balls: balls.sort((a, b) => a - b), drifts: [], rafts, key: 0, pg: 0, wind, q, frz: 0,
  };
  return { L, S };
}

// Değişebilen hücreler: su 0=su 1=köprü · çatlak 0=sağlam 1=kırık(su) 2=köprü · eriyen kar 0=kar 1=erimiş(buz)
// kırılgan kaya 0=sağlam 1=çatlak 2=kırık(buz) · sarkıt 0=asılı 1=düşmüş(kaya)
// Kar topunun durduğu hücre kar yığını olur (drifts). Plaka kapıları plakaya basılıyken (pg) açıktır.
export function tileOf(L, S, c) {
  const b = L.t[c];
  if (S.drifts.length && S.drifts.includes(c)) return T.SNOW;
  if (b === T.WATER) return S.dyn[L.dynIdx[c]] ? T.BRIDGE : T.WATER;
  if (b === T.CRACK) { const v = S.dyn[L.dynIdx[c]]; return v === 0 ? T.CRACK : v === 1 ? T.WATER : T.BRIDGE; }
  if (b === T.MELT) return S.dyn[L.dynIdx[c]] ? T.ICE : T.MELT;
  if (b === T.GATE) return (S.gates >> L.gateIdx[c]) & 1 ? T.ICE : T.GATE;
  if (b === T.PGATE) return S.pg ? T.ICE : T.PGATE;
  if (b === T.FRAGILE) return S.dyn[L.dynIdx[c]] === 2 ? T.ICE : T.FRAGILE;
  if (b === T.ICICLE) return S.dyn[L.dynIdx[c]] ? T.ROCK : T.ICICLE;
  if (b === T.LOCK) return S.key ? T.ICE : T.LOCK;
  return b;
}

export function neighbor(L, c, d) {
  const x = (c % L.w) + DX[d], y = Math.floor(c / L.w) + DY[d];
  return x < 0 || y < 0 || x >= L.w || y >= L.h ? -1 : y * L.w + x;
}

export const won = (L, S) => S.fish === (1 << L.fishCells.length) - 1;

const sealAt = (n, c) => n.seals.some(s => s >> 2 === c);
// Hücrede itilebilir ya da duran bir şey var mı: kasa, kar topu, öteki penguen.
const occ = (n, c) => n.crates.includes(c) || n.balls.includes(c) || c === n.q;
const raftAt = (n, c) => n.rafts.indexOf(c);

// Pofi bu hücreye inebilir mi? (kasa/fok yok, üzerinde durulabilen zemin ya da sal)
const landable = (L, n, c) => c >= 0 && !occ(n, c) && !sealAt(n, c) && (walkable(tileOf(L, n, c)) || raftAt(n, c) >= 0);

// Sıralı balık ancak kendinden önceki sıralı balıkların hepsi alındıysa alınır.
function canTake(L, n, fi) {
  const ord = L.fishOrder[fi];
  if (!ord) return true;
  return L.fishOrder.every((o, j) => !o || o >= ord || (n.fish >> j) & 1);
}

const copyState = S => ({
  p: S.p, fish: S.fish, gates: S.gates, dyn: S.dyn.slice(), crates: S.crates.slice(), seals: S.seals.slice(),
  balls: S.balls.slice(), drifts: S.drifts.slice(), rafts: S.rafts.slice(), key: S.key, pg: S.pg, wind: S.wind, q: S.q, frz: S.frz || 0,
});

// ---------- tek hamle ----------
// dir 0-3: Pofi, 4-7: Pipi (ikinci penguen) aynı yönlerde. Pipi'nin hamlesi, iki penguenin yeri değiştirilip
// Pofi hamlesi gibi hesaplanır; sonuçta who = 1 olur ve pPath Pipi'nin yoludur.
export function simulate(L, S, dir) {
  if (dir < 4) return move(L, S, dir, 0);
  if (S.q < 0) return null;
  const r = move(L, { ...S, p: S.q, q: S.p }, dir - 4, 1);
  if (!r) return null;
  [r.state.p, r.state.q] = [r.state.q, r.state.p];
  return r;
}

// Dönüş: null (hiçbir şey değişmedi) veya { state, pPath, jumps, warps, rides, crate, seals, fx, dir, who }
// fx zamanları "adım" cinsinden (Pofi'nin hamle başından itibaren geçtiği hücre sayısı).
// jumps: rampadan inişe kadar havada geçen aralıklar ({ from, to } pPath indeksleri).
// warps: buz deliğinden çıkılan pPath indeksleri (bir önceki indeks giriş deliği).
// rides: salla taşınılan aralıklar ({ raft, from, to } pPath indeksleri).
function move(L, S, dir, who) {
  const n = copyState(S);
  const fx = [];
  const pPath = [S.p];
  const jumps = [], warps = [], rides = [];
  const seen = new Set();
  let cur = S.p, d = dir, crate = null, lever = false, hit = false;

  // Pofi bir hücreye vardığında: balığı ve anahtarı al; karda dur; okta ve döner tablada dön.
  const take = () => {
    const fi = L.fishIdx[cur];
    if (fi >= 0 && !((n.fish >> fi) & 1)) {
      if (canTake(L, n, fi)) { n.fish |= 1 << fi; fx.push({ k: 'fish', cell: cur, at: pPath.length - 1, ordered: L.fishOrder[fi] > 0 }); }
      else fx.push({ k: 'skip', cell: cur, at: pPath.length - 1 });
    }
    if (!n.key && L.keys.includes(cur)) { n.key = 1; fx.push({ k: 'key', cell: cur, at: pPath.length - 1 }); }
  };
  const arrive = t => {
    take();
    if (stops(t)) { fx.push({ k: 'snow', at: pPath.length - 1 }); return true; }
    if (isArrow(t)) { d = t - T.UP; fx.push({ k: 'arrow', cell: cur, at: pPath.length - 1 }); }
    if (t === T.TURN) { fx.push({ k: 'turn', cell: cur, at: pPath.length - 1, d }); d = (d + 1) % 4; } // d: tablaya giriş yönü
    return false;
  };

  // Pofi'nin ayrıldığı hücre: çatlak buz kırılır, üzerinde durulmuş eriyen kar erir, sarkıt düşer.
  const leave = () => {
    const di = L.dynIdx[cur];
    if (di < 0 || n.dyn[di] !== 0) return;
    if (L.t[cur] === T.CRACK) { n.dyn[di] = 1; fx.push({ k: 'crack', cell: cur, at: pPath.length - 0.5 }); }
    else if (L.t[cur] === T.MELT) { n.dyn[di] = 1; fx.push({ k: 'melt', cell: cur, at: pPath.length - 0.5 }); }
    else if (L.t[cur] === T.ICICLE) { n.dyn[di] = 1; fx.push({ k: 'icicle', cell: cur, at: pPath.length - 0.5 }); }
  };

  for (;;) {
    const key = cur * 4 + d;
    if (seen.has(key)) break;
    seen.add(key);
    const nx = neighbor(L, cur, d);
    if (nx < 0) { fx.push({ k: 'bump', at: pPath.length - 1 }); break; }
    // Sal: Pofi sal üstündeyken su boyunca sal da onunla gider; su bitince sal kalır, Pofi kaymaya devam eder.
    const ri = raftAt(n, cur);
    if (ri >= 0 && tileOf(L, n, nx) === T.WATER && raftAt(n, nx) < 0 && !occ(n, nx) && !sealAt(n, nx)) {
      const from = pPath.length - 1;
      n.rafts[ri] = nx;
      cur = nx;
      pPath.push(cur);
      const last = rides[rides.length - 1];
      if (last && last.raft === ri && last.to === from) last.to = pPath.length - 1;
      else { rides.push({ raft: ri, from, to: pPath.length - 1 }); fx.push({ k: 'raft', cell: cur, at: from }); }
      continue;
    }
    const ci = n.crates.indexOf(nx);
    if (ci >= 0) { crate = pushCrate(L, n, n.crates, ci, d, cur, pPath.length - 1, fx, 'crate'); break; }
    const bi = n.balls.indexOf(nx);
    if (bi >= 0) { crate = pushCrate(L, n, n.balls, bi, d, cur, pPath.length - 1, fx, 'ball'); break; }
    if (nx === n.q) { fx.push({ k: 'bump', at: pPath.length - 1 }); break; }
    if (sealAt(n, nx)) { fx.push({ k: 'bump', at: pPath.length - 1 }, { k: 'sealhit', at: pPath.length - 1 }); break; }
    const t = tileOf(L, n, nx);
    if (t === T.LEVER) { lever = true; break; }
    if (t === T.FRAGILE) {
      // Kırılgan kaya: ilk çarpmada çatlar, ikincide kırılıp buz olur. Pofi her seferinde önünde durur.
      const di = L.dynIdx[nx];
      n.dyn[di]++;
      hit = true;
      fx.push({ k: 'bump', at: pPath.length - 1 }, { k: 'rock', cell: nx, broke: n.dyn[di] === 2, at: pPath.length - 1 });
      break;
    }
    if (t === T.HOLE) {
      // Buz deliği: eşinden aynı yönde çıkar; çıkış doluysa delik duvar gibi davranır.
      const ex = L.holePair[nx];
      if (ex < 0 || occ(n, ex) || sealAt(n, ex)) { fx.push({ k: 'bump', at: pPath.length - 1 }); break; }
      leave();
      pPath.push(nx, ex);
      cur = ex;
      warps.push(pPath.length - 1);
      fx.push({ k: 'warp', cell: nx, to: ex, at: pPath.length - 1.5 });
      continue;
    }
    // Sal olan su hücresine binilebilir; bir sonraki adımda sal Pofi'yi taşır.
    if (t === T.WATER && raftAt(n, nx) >= 0) {
      leave();
      cur = nx;
      pPath.push(cur);
      continue;
    }
    // Rampa: kendi yönünde girilirse fırlatır, karşıdan gelinirse dik yüzü kaya gibi durdurur, yandan buz gibi geçilir.
    const ramp = isRamp(t) ? t - T.RAMP_UP : -1;
    if (ramp === (d + 2) % 4 || (ramp < 0 && !walkable(t))) { fx.push({ k: 'bump', at: pPath.length - 1 }); break; }
    leave();
    cur = nx;
    pPath.push(cur);

    if (ramp === d) {
      // Uçuş: altındaki her şeyin üstünden geçer, en uzak inilebilir hücreye iner.
      const rampAt = pPath.length - 1;
      const air = [];
      for (let k = 0, c = cur; k <= RAMP_FLIGHT; k++) { c = c < 0 ? -1 : neighbor(L, c, d); air.push(c); }
      let land = -1;
      for (let k = RAMP_FLIGHT; k >= 0; k--) if (landable(L, n, air[k])) { land = k; break; }
      if (land < 0) { fx.push({ k: 'bump', at: rampAt }); break; }
      for (let k = 0; k <= land; k++) pPath.push(air[k]);
      cur = air[land];
      jumps.push({ from: rampAt, to: pPath.length - 1 });
      fx.push({ k: 'jump', at: rampAt }, { k: 'land', cell: cur, at: pPath.length - 1 });
      if (raftAt(n, cur) >= 0) continue;
      if (arrive(tileOf(L, n, cur))) break;
      continue;
    }
    if (ramp < 0 && arrive(t)) break;
  }

  // Rüzgâr: hamle bitince bayrağın gösterdiği yöne bir kare iter (yer varsa); sonra bayrak saat yönünde döner.
  if (n.wind >= 0 && (pPath.length > 1 || (crate && crate.moved) || lever || hit)) {
    const nx = neighbor(L, cur, n.wind);
    if (raftAt(n, cur) < 0 && landable(L, n, nx) && L.t[nx] !== T.HOLE && !isRamp(tileOf(L, n, nx))) {
      leave();
      cur = nx;
      pPath.push(cur);
      fx.push({ k: 'gust', at: pPath.length - 1.5, d: n.wind });
      take();
    }
    n.wind = (n.wind + 1) % 4;
  }
  n.p = cur;

  if (lever) {
    let mask = 0;
    L.gateCells.forEach((g, i) => { if (g !== n.p && !occ(n, g) && !sealAt(n, g)) mask |= 1 << i; });
    n.gates ^= mask;
    fx.push({ k: 'lever', at: pPath.length - 1 });
  }

  const moved = pPath.length > 1 || (crate && crate.moved) || lever || hit;
  if (!moved) return null;
  const end = Math.max(pPath.length - 1, crate && crate.moved ? crate.at0 + crate.path.length - 1 : 0);
  updatePlates(L, n, fx, end);
  // fok düdüğü (güçlendirici): frz hamle boyunca foklar yerinde kalır
  const seals = n.frz > 0 ? (n.frz--, n.seals.map(s => ({ from: s >> 2, to: s >> 2, d: s & 3 }))) : moveSeals(L, n, fx, end);
  return { state: n, pPath, jumps, warps, rides, crate: crate && crate.moved ? crate : null, seals, fx, dir: dir, who };
}

// Basınç plakası: üstünde penguen, kasa ya da kar topu duruyorsa plaka kapıları açılır.
// İçinde bir şey duran kapı kapanamaz.
function updatePlates(L, n, fx, at) {
  if (!L.plates.length) return;
  const held = c => c === n.p || occ(n, c) || sealAt(n, c);
  const pg = L.plates.some(held) || (n.pg && L.pgates.some(held)) ? 1 : 0;
  if (pg !== n.pg) fx.push({ k: 'plate', open: !!pg, at });
  n.pg = pg;
}

// Foklar her geçerli hamleden sonra kendi hatlarında 1 adım ilerler; önü kapalıysa geri döner.
// İki yön de kapalıysa (köşeye sıkıştıysa) dik yönleri dener ve o yönde yürümeye devam eder.
const sealWalk = t => t === T.ICE || t === T.SNOW || t === T.MELT || t === T.CRACK || t === T.BRIDGE || isArrow(t) || t === T.PLATE || t === T.TURN;
function moveSeals(L, n, fx, at) {
  const moves = [];
  n.seals = n.seals.map((s, i) => {
    const from = s >> 2;
    const d0 = s & 3;
    for (const turn of [0, 2, 1, 3]) {
      const d = (d0 + turn) % 4;
      const nx = neighbor(L, from, d);
      const free = nx >= 0 && nx !== n.p && !occ(n, nx) && n.rafts.indexOf(nx) < 0
        && !n.seals.some((o, j) => j !== i && o >> 2 === nx) && sealWalk(tileOf(L, n, nx));
      if (free) {
        moves.push({ from, to: nx, d });
        fx.push({ k: 'seal', at });
        return nx * 4 + d;
      }
    }
    moves.push({ from, to: from, d: d0 });
    return from * 4 + d0;
  });
  return moves;
}

// Kasa ve kar topu itilince duvara kadar kayar. Suya girerse batıp köprü olur.
// Kar topu (kind 'ball') durduğu hücrede dağılır ve orası kar yığını olur.
function pushCrate(L, n, list, ci, dir, penguinAt, at0, fx, kind) {
  let c = list[ci], d = dir;
  const path = [c], warps = [], seen = new Set();
  for (;;) {
    const key = c * 4 + d;
    if (seen.has(key)) break;
    seen.add(key);
    const nx = neighbor(L, c, d);
    if (nx < 0 || nx === penguinAt || occ(n, nx) || n.rafts.indexOf(nx) >= 0) break;
    if (sealAt(n, nx)) { fx.push({ k: 'sealhit', at: at0 }); break; }
    const t = tileOf(L, n, nx);
    if (t === T.WATER) {
      const di = L.dynIdx[nx];
      n.dyn[di] = L.t[nx] === T.WATER ? 1 : 2;
      list.splice(ci, 1);
      path.push(nx);
      fx.push({ k: 'sink', cell: nx, at: at0 + path.length - 1 });
      return { moved: true, sunk: true, path, warps, at0, kind };
    }
    if (t === T.HOLE) {
      const ex = L.holePair[nx];
      if (ex < 0 || ex === penguinAt || occ(n, ex) || sealAt(n, ex)) break;
      path.push(nx, ex);
      warps.push(path.length - 1);
      fx.push({ k: 'warp', cell: nx, to: ex, at: at0 + path.length - 1.5 });
      c = ex;
      continue;
    }
    if (!walkable(t)) break;
    c = nx;
    path.push(c);
    if (stops(t)) break;
    if (isArrow(t)) d = t - T.UP;
    if (t === T.TURN) d = (d + 1) % 4;
  }
  if (path.length === 1) return { moved: false };
  fx.push({ k: 'push', at: at0 });
  if (kind === 'ball') {
    list.splice(ci, 1);
    n.drifts.push(c);
    n.drifts.sort((a, b) => a - b);
    fx.push({ k: 'drift', cell: c, at: at0 + path.length - 1 });
    return { moved: true, sunk: false, drift: true, path, warps, at0, kind };
  }
  list[ci] = c;
  list.sort((a, b) => a - b);
  return { moved: true, sunk: false, path, warps, at0, kind };
}

// ---------- çözücü ----------
const stateKey = s => `${s.p}|${s.fish}|${s.gates}|${s.dyn.join('')}|${s.crates.join(',')}|${s.seals.join(',')}|${s.balls.join(',')}|${s.drifts.join(',')}|${s.rafts.join(',')}|${s.key}${s.pg}${s.wind}|${s.q}|${s.frz || 0}`;

// En kısa çözümün yön dizisi; çözüm yoksa veya durum sınırı aşılırsa null.
export function solve(L, S0, maxStates = 120000) {
  if (won(L, S0)) return [];
  const states = [S0], parent = [-1], via = [-1];
  const seen = new Set([stateKey(S0)]);
  const dirs = S0.q >= 0 ? 8 : 4; // Pipi varsa 4 yön daha
  for (let qi = 0; qi < states.length; qi++) {
    for (let d = 0; d < dirs; d++) {
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
  const u = {
    push: 0, sink: 0, crack: 0, lever: 0, arrow: 0, snow: 0, jump: 0, warp: 0, melt: 0, seal: 0, order: 0,
    plate: 0, turn: 0, rock: 0, icicle: 0, drift: 0, key: 0, raft: 0, gust: 0, pipi: 0,
  };
  let s = S0;
  for (const d of moves) {
    const r = simulate(L, s, d);
    for (const f of r.fx) {
      if (u[f.k] !== undefined && f.k !== 'seal') u[f.k]++;
      if (f.k === 'sink') u.push++; // batan kasa da itilmiş sayılır
      if (f.k === 'sealhit') u.seal++; // fok önünü kesti
      if (f.k === 'fish' && f.ordered) u.order++;
    }
    if (r.who) u.pipi++;
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
  // Rampa su ile birlikte gelir: uçulacak engel olsun, "fazla uçup adaya düşme" riski doğsun.
  { from: 61, mech: ['snow', 'ramp', 'water'], req: 'jump' },
  { from: 76, mech: ['snow', 'hole'], req: 'warp' },
  // Eriyen kar tek fren kaynağıdır; kalıcı kar olmadan planlama zorunlu olur.
  { from: 91, mech: ['melt'], req: 'melt' },
  { from: 106, mech: ['snow', 'seal'], req: 'seal' },
  { from: 121, mech: ['snow', 'order'], req: 'order' },
  // v0.4: level 140-500 arası 9 yeni mekanik, aralar giderek açılır.
  { from: 140, mech: ['snow', 'plate', 'crate'], req: 'plate' },
  { from: 165, mech: ['snow', 'turn'], req: 'turn' },
  { from: 195, mech: ['snow', 'fragile'], req: 'rock' },
  { from: 230, mech: ['snow', 'icicle'], req: 'icicle' },
  // Kar topu kendi frenini yaratır; kalıcı kar olmadan topu nereye bırakacağını planlamak gerekir.
  { from: 270, mech: ['ball'], req: 'drift' },
  { from: 315, mech: ['snow', 'key'], req: 'key' },
  { from: 365, mech: ['snow', 'raft'], req: 'raft' },
  { from: 430, mech: ['snow', 'wind'], req: 'gust' },
  { from: 500, mech: ['snow', 'pipi'], req: 'pipi' },
];
const MIX_FROM = 136; // bu levelden sonra mekanikler karışık gelir (yeni mekaniğin tanıtım bloğu hariç)
const INTRO_BLOCK = 8; // yeni mekanik ilk bu kadar levelde tek başına gelir
const MIX = ['crate', 'water', 'crack', 'lever', 'arrow', 'ramp', 'hole', 'melt', 'seal', 'order',
  'plate', 'turn', 'fragile', 'icicle', 'ball', 'key', 'raft', 'wind', 'pipi'];
const REQ_OF = {
  crate: 'push', water: 'sink', crack: 'crack', lever: 'lever', arrow: 'arrow', snow: 'snow', ramp: 'jump',
  hole: 'warp', melt: 'melt', seal: 'seal', order: 'order',
  plate: 'plate', turn: 'turn', fragile: 'rock', icicle: 'icicle', ball: 'drift', key: 'key', raft: 'raft', wind: 'gust', pipi: 'pipi',
};
const unlockOf = m => STAGES.find(s => s.mech.includes(m) && s.req === REQ_OF[m])?.from ?? 1;

// Grid 3×4'ten 8×11'e büyür (docs/v04-oneri.md): başta sık, sonra seyrek; her adımda tek yönde bir sıra.
export const GRID = [
  [1, 3, 4], [11, 3, 5], [23, 4, 5], [40, 4, 6], [62, 5, 6], [91, 5, 7], [129, 6, 7],
  [179, 6, 8], [245, 7, 8], [333, 7, 9], [448, 7, 10], [600, 8, 10], [800, 8, 11],
];
export const gridOf = n => { const g = [...GRID].reverse().find(([from]) => n >= from); return [g[1], g[2]]; };

export function levelSpec(n, r = rng(n * 31 + 7)) {
  // Yeni mekaniğin ilk 2 leveli her zaman kolay.
  const intro = STAGES.some(s => s.req && n >= s.from && n < s.from + 2);
  const tier = n <= 10 || intro ? 'easy' : PATTERN[(n - 1) % 10];
  const [w, h] = gridOf(n);

  let lo, hi;
  if (n === 1) [lo, hi] = [1, 1];
  else if (n <= 3) [lo, hi] = [2, 2];
  else if (n <= 6) [lo, hi] = [2, 3];
  else if (n <= 25) [lo, hi] = [3, 4];
  else if (n <= 50) [lo, hi] = [3, 5];
  else if (n <= 100) [lo, hi] = [4, 6];
  else if (n <= 250) [lo, hi] = [4, 7];
  else if (n <= 500) [lo, hi] = [5, 8];
  else [lo, hi] = [5, 9];
  if (intro) hi = lo + 1;
  if (tier === 'medium') hi += 1;
  if (tier === 'hard') { lo += 1; hi += 2; }
  if (tier === 'veryhard') { lo += 2; hi += 2; }

  let mech, req;
  const st = [...STAGES].reverse().find(s => n >= s.from);
  if (n < MIX_FROM || (st.from >= MIX_FROM && n - st.from < INTRO_BLOCK)) {
    mech = st.mech;
    // Aşamanın ilk 4 levelinde yeni mekanik her zaman şart; sonra çoğunlukla.
    req = st.req && (n - st.from < 4 || r() < 0.75) ? st.req : null;
  } else {
    const pool = MIX.filter(m => unlockOf(m) <= n);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    // En son açılan mekanik, açıldıktan sonraki 100 level boyunca daha sık gelsin.
    const newest = MIX.filter(m => unlockOf(m) <= n).reduce((a, m) => (unlockOf(m) > unlockOf(a) ? m : a));
    if (unlockOf(newest) >= MIX_FROM && n - unlockOf(newest) < 100 && r() < 0.35) { pool.splice(pool.indexOf(newest), 1); pool.unshift(newest); }
    mech = ['snow', ...pool.slice(0, 2 + Math.floor(r() * 2))];
    if ((mech.includes('water') || mech.includes('plate')) && !mech.includes('crate')) mech.push('crate');
    req = REQ_OF[mech[1]];
  }
  const area = w * h;
  let fish = n <= 2 ? 1 : n <= 10 ? 1 + Math.floor(r() * 2) : 1 + Math.floor(r() * (area >= 70 ? 4 : 3));
  if (mech.includes('order')) fish = Math.max(fish, 2);
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
  // Nesne sayıları tahta alanıyla ölçeklenir (7×8 = 1 kat); küçük tahtada az, büyükte çok.
  const f = Math.max(0.35, Math.min(1.6, (w * h) / 56));
  const many = (base, span) => Math.max(1, Math.round((base + Math.floor(r() * (span + 1))) * f));

  const rockD = (w * h < 24 ? 0.08 : 0.14) + r() * 0.1;
  for (const [x, y] of cells) if (r() < rockD) g[y][x] = '#';
  if (mech.includes('snow')) for (let k = 0, m = many(1, 2); k < m; k++) put('s');
  if (mech.includes('water')) {
    for (let k = 0, m = many(1, 1); k < m; k++) {
      const c = put('~');
      if (c && r() < 0.5) {
        const d = Math.floor(r() * 4), x = c[0] + DX[d], y = c[1] + DY[d];
        if (x >= 0 && y >= 0 && x < w && y < h && g[y][x] === '.') g[y][x] = '~';
      }
    }
  }
  if (mech.includes('raft')) {
    // Göl: 3-4 hücrelik düz bir su şeridi, salı bir ucunda.
    for (let tries = 0; tries < 20; tries++) {
      const c = pick(), d = Math.floor(r() * 4), len = 3 + Math.floor(r() * 2);
      if (!c) break;
      const line = [];
      for (let k = 0, x = c[0], y = c[1]; k < len && x >= 0 && y >= 0 && x < w && y < h && g[y][x] === '.'; k++, x += DX[d], y += DY[d]) line.push([x, y]);
      if (line.length < 3) continue;
      line.forEach(([x, y], k) => { g[y][x] = k === 0 ? 'R' : '~'; });
      break;
    }
  }
  if (mech.includes('crack')) for (let k = 0, m = many(2, 2); k < m; k++) put('c');
  if (mech.includes('arrow')) for (let k = 0, m = many(1, 1); k < m; k++) put('^>v<'[Math.floor(r() * 4)]);
  if (mech.includes('ramp')) for (let k = 0, m = many(1, 1); k < m; k++) put('8624'[Math.floor(r() * 4)]);
  if (mech.includes('lever')) {
    put('L');
    for (let k = 0, m = many(1, 2); k < m; k++) put(r() < 0.6 ? 'G' : 'g');
  }
  if (mech.includes('plate')) {
    put('_');
    for (let k = 0, m = 1 + Math.floor(r() * 2); k < m; k++) put('H');
  }
  if (mech.includes('turn')) for (let k = 0, m = many(1, 1); k < m; k++) put('r');
  if (mech.includes('fragile')) for (let k = 0, m = many(1, 2); k < m; k++) put('k');
  if (mech.includes('icicle')) for (let k = 0, m = many(2, 1); k < m; k++) put('i');
  if (mech.includes('key')) {
    put('j');
    for (let k = 0, m = 1 + Math.floor(r() * 2); k < m; k++) put('l');
  }
  if (mech.includes('wind')) put('W');
  if (mech.includes('hole')) { put('O'); put('O'); }
  if (mech.includes('melt')) for (let k = 0, m = many(2, 2); k < m; k++) put('m');
  if (mech.includes('seal')) put(r() < 0.5 ? 'S' : 'Z');
  put('P');
  if (mech.includes('pipi')) put('Q');
  for (let k = 0; k < spec.fish; k++) put(mech.includes('order') ? 'xyzw'[k] : 'f');
  if (mech.includes('crate')) for (let k = 0, m = many(1, 1); k < m; k++) put('B');
  if (mech.includes('ball')) for (let k = 0, m = many(1, 1); k < m; k++) put('o');
  return g.map(row => row.join(''));
}

// Mekaniği etkisizleştiren dönüşümler: kasa/su/delik → kaya, çatlak/ok/rampa → buz, kol/kapı → kaya/buz,
// eriyen kar → kalıcı kar, fok → yok, sıralı balık → sırasız balık, plaka → buz ve kapılar hep açık,
// döner tabla → buz, kırılgan kaya → kaya, sarkıt → hiç düşmez, kar topu → kasa, anahtar/kilit → yok,
// sal → yok, rüzgâr bayrağı → kaya, Pipi → kaya.
const NEUTRAL = {
  jump: ch => ('8624'.includes(ch) ? '.' : ch),
  snow: ch => (ch === 's' ? '.' : ch === 'F' ? 'f' : ch),
  push: ch => (ch === 'B' ? '#' : ch),
  sink: ch => (ch === '~' ? '#' : ch),
  crack: ch => (ch === 'c' ? '.' : ch),
  lever: ch => (ch === 'L' || ch === 'G' ? '#' : ch === 'g' ? '.' : ch),
  arrow: ch => ('^>v<'.includes(ch) ? '.' : ch),
  warp: ch => (ch === 'O' ? '#' : ch),
  melt: ch => (ch === 'm' ? 's' : ch),
  seal: ch => (ch === 'S' || ch === 'Z' ? '.' : ch),
  order: ch => (ORDER_CH[ch] ? 'f' : ch),
  plate: ch => (ch === '_' || ch === 'H' ? '.' : ch),
  turn: ch => (ch === 'r' ? '.' : ch),
  rock: ch => (ch === 'k' ? '#' : ch),
  icicle: ch => (ch === 'i' ? '.' : ch),
  drift: ch => (ch === 'o' ? 'B' : ch),
  key: ch => (ch === 'j' || ch === 'l' ? '.' : ch),
  raft: ch => (ch === 'R' ? '~' : ch),
  gust: ch => (ch === 'W' ? '#' : ch),
  pipi: ch => (ch === 'Q' ? '#' : ch),
};

// Katı test zor tutarsa ikinci kademe: eriyen kar en azından fren olarak gerekli olsun (kaldırınca çözüm değişsin).
const NEUTRAL_WEAK = {
  melt: ch => (ch === 'm' ? '.' : ch),
};

// Mekanik gerçekten bulmacanın parçası mı? Kaldırınca çözülemiyorsa ya da en kısa çözüm değişiyorsa evet.
function essential(fn, rows, m) {
  const alt = rows.map(r => [...r].map(fn).join(''));
  const { L, S } = parseLevel({ rows: alt });
  const sol = solve(L, S, 60000);
  return !sol || sol.length !== m;
}

// Belirli bir level için çözülebilir, bandında ve yeni mekaniği gerçekten gerektiren bir tahta üret.
// Öncelik: katı testi geçen bant içi aday → katı testi geçen en yakın → zayıf testi geçen en yakın → herhangi.
// Etkinlik levelleri: temanın kuralı spec'i değiştirir (zorunlu mekanikler, ek balık, sıralı balık, karsız).
// Oyuncunun henüz açmadığı mekanikler zorlanmaz.
function applyRule(spec, rule, n) {
  if (!rule) return spec;
  // tier: zorluk sınıfını zorlar (usta levelleri çok zor ve hamle sınırlı olur)
  if (rule.tier && spec.tier !== rule.tier) { spec.tier = rule.tier; spec.lo += 2; spec.hi += 2; }
  let mech = spec.mech.slice();
  const forced = (rule.mech || []).filter(m => unlockOf(m) <= n);
  if (forced.length) {
    mech = ['snow', ...forced];
    if ((mech.includes('water') || mech.includes('plate')) && !mech.includes('crate')) mech.push('crate');
    spec.req = REQ_OF[forced[0]];
  }
  if (rule.order && unlockOf('order') <= n && !mech.includes('order')) mech.push('order');
  if (rule.nosnow) { mech = mech.filter(m => m !== 'snow'); if (spec.req === 'snow') spec.req = null; }
  spec.mech = mech;
  if (rule.fish) spec.fish += rule.fish;
  spec.fish = Math.min(mech.includes('order') ? 4 : 5, Math.max(mech.includes('order') ? 2 : 1, spec.fish));
  return spec;
}

export function generateLevel(n, { seed = n, maxAttempts = 6000, rule = null } = {}) {
  const spec = applyRule(levelSpec(n, rng(seed * 31 + 7)), rule, n);
  let best = null, weak = null, loose = null;
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
    if (spec.req) {
      if (!usage(L, S, sol)[spec.req]) continue;
      if (!essential(NEUTRAL[spec.req], rows, m)) {
        if (NEUTRAL_WEAK[spec.req] && (!weak || dist < weak.dist) && essential(NEUTRAL_WEAK[spec.req], rows, m)) weak = { dist, rows, sol };
        continue;
      }
    }
    if (dist === 0) return finalize(spec, rows, sol);
    // Bant tutmazsa en yakın geçerli adayı yedekte tut.
    if (!best || dist < best.dist) best = { dist, rows, sol };
  }
  const pick = best || weak || loose;
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
