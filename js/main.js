import { parseLevel, simulate, solve, won, generateLevel, starsFor, T } from './engine.js';
import { BoardView, paintTile } from './board.js';
import { VillageView, phaseOf, drawDecor } from './village.js';
import { ensureEvent, eventPoints, timeLeft, claimable, nextMilestone, prizeOf, encodeVillage, decodeVillage, extractCode } from './live.js';
import {
  building, bLevel, totalLevels, villageLevel, nextVillageLevel, isUnlocked, maxLevel, nextCost,
  buff, villageBonusPct, coinBonusPct, discounted, canAffordAny, suggestion, zone, cupPrice, nextRecipe,
  nextDistrict, landOf, slotTier, interiorReady,
} from './meta.js';
import { drawRoom, drawItemIcon } from './interior.js';
import { drawPofi, drawFish } from './draw.js';
import { loadArt, setArtEnabled } from './art.js';
import { load, save, resetSave } from './save.js';
import { showRewarded, track } from './ads.js';
import {
  ECON, ADS, TIER_LABEL, MULT_ZONES, INTRO, DAILY_REWARDS, DAILY_PUZZLE, WARDROBE, EVENT_TRACK, EVENT_POINTS, VISIT_GIFT,
  BUILDINGS, BUFF_TEXT, VILLAGE_LEVELS, COLORS, COLOR_PRICE, COCOA, DISTRICTS, INTERIOR,
  VILLAGERS, VILLAGE_PHASES, VILLAGER_LINES, DAILY_TASKS, TASK_REWARD, DECOR_ITEMS, DECOR_SLOTS,
} from './config.js';
import { sfx, unlock, configure as configureSound, setAmbient } from './sound.js';

const $ = id => document.getElementById(id);
const P = load(); // oyuncu kaydı
let LEVELS = []; // data/levels.json — sonrası çalışma anında üretilir

const board = new BoardView($('board'));
const village = new VillageView($('village'));
const visitView = new VillageView($('visitCanvas'));
village.onSelect = id => (sheet?.id === id && INTERIOR[id] && P.village[id] ? enterInterior(id) : openSheet(id));
village.onDistrict = i => showDistrict(i);
village.onVillager = id => talkTo(id);
village.onDecorSlot = id => { village.decorSel = id; village.decorPreview = null; renderDecor(); };
board.outfit = P.outfit;

const applySoundSettings = () => configureSound({ sfx: P.settings.sfx !== false, ambient: P.settings.ambient !== false });
applySoundSettings();
loadArt();
setArtEnabled(P.settings.art !== false);
document.addEventListener('pointerdown', unlock, true);
document.addEventListener('keydown', unlock, true);
$('app').addEventListener('click', e => {
  if (e.target.closest('.btn, .tool, .tabbar button, .icon-btn, .next-card, .quick, .set-row.action, .seg-btn, .w-item, .style-opt')) sfx.ui();
}, true);

let screen = 'splash';
let run = null; // { def, L, st, history, moves, limit, finished, daily, stuck }

// ---------- genel ----------
const coinIco = '<i class="ico coin"></i>';
const flakeIco = '<i class="ico flake"></i>';
const hintIco = '<i class="ico hint"></i>';
const popcount = m => { let c = 0; while (m) { c += m & 1; m >>= 1; } return c; };

function persist() { save(P); updateWallet(); }

function updateWallet() {
  $('coins').textContent = P.coins;
  $('flakes').textContent = P.flakes;
  $('playLevel').textContent = P.level;
  $('dotVillage').classList.toggle('hidden', !canAffordAny(P) && !recipeReady() && !districtReady() && !homesReady().length && !taskDone());
  $('dotShop').classList.toggle('hidden', freeCoinsLeft() <= 0);
  renderNextCard();
  renderDailyButtons();
  renderEventCard();
}

const SCREENS = ['splash', 'login', 'intro', 'home', 'game', 'village', 'visit', 'interior', 'wardrobe', 'shop', 'settings'];
const TAB_SCREENS = ['home', 'village', 'wardrobe', 'shop', 'settings'];

function showScreen(name) {
  screen = name;
  for (const s of SCREENS) $('screen' + s[0].toUpperCase() + s.slice(1)).classList.toggle('hidden', s !== name);
  $('app').dataset.screen = name;
  board.active = name === 'game';
  setAmbient(name === 'game' || name === 'village');
  $('btnBack').classList.toggle('hidden', name !== 'game' && name !== 'visit' && name !== 'interior');
  $('tabbar').classList.toggle('hidden', !TAB_SCREENS.includes(name));
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  if (name !== 'village' && sheet) closeSheet();
  if (name !== 'village' && village.decorMode) exitDecor();
  if (name !== 'wardrobe') wardrobeDraft = null;
  if (name === 'village') {
    village.resize();
    renderVillage();
    if (P.vlClaimed < villageLevel(P)) setTimeout(celebrateVillage, 500);
  }
  if (name === 'wardrobe') renderWardrobe();
  if (name === 'shop') renderShop();
  if (name === 'settings') renderSettings();
  if (name === 'home' && P.profile) $('greet').textContent = `Merhaba ${P.profile.name}, Pofi seni bekliyor!`;
  updateWallet();
  if (name === 'home' && !dailyPopupShown && !dailyRewardState().claimedToday) {
    dailyPopupShown = true;
    setTimeout(() => { if (screen === 'home' && $('overlay').classList.contains('hidden')) showDailyReward(); }, 450);
  }
}
let dailyPopupShown = false;

let toastTimer = 0;
function toast(msg, ms = 1800) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), ms);
}

function openOverlay(html) {
  $('overlayCard').innerHTML = html;
  $('overlay').classList.remove('hidden');
}
function closeOverlay() { $('overlay').classList.add('hidden'); }
const overlayOpen = () => !$('overlay').classList.contains('hidden');

// CSS boyutunda, yüksek çözünürlüklü canvas bağlamı.
function fitCanvas(cv, w, h) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return ctx;
}

// ---------- açılış: Funday Morning logosu → giriş → tanıtım → ana ekran ----------
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function boot() {
  showScreen('splash');
  let loaded = false;
  // no-cache: level dosyası güncellenince oyuncu eski kopyada kalmasın.
  const levels = fetch('data/levels.json', { cache: 'no-cache' }).then(r => r.json()).then(j => { LEVELS = j; }).catch(() => { /* çalışma anında üretilir */ });
  Promise.all([document.fonts?.ready, $('splashLogo').decode?.(), levels].map(p => Promise.resolve(p).catch(() => {})))
    .then(() => { loaded = true; });
  const t0 = performance.now(), MIN_MS = 2200;
  await new Promise(resolve => {
    (function step(now) {
      const k = Math.min(1, (now - t0) / MIN_MS);
      const p = loaded ? k : Math.min(k, 0.9);
      $('loadFill').style.width = p * 100 + '%';
      if (p >= 1) resolve(); else requestAnimationFrame(step);
    })(t0);
  });
  await sleep(250);
  if (P.profile) runIntro();
  else showScreen('login');
}

$('btnGuest').onclick = () => {
  const name = $('playerName').value.trim().slice(0, 16) || 'Kaşif';
  P.profile = { name, method: 'guest', createdAt: Date.now() };
  save(P);
  track('login', { method: 'guest' });
  runIntro();
};
document.querySelectorAll('[data-provider]').forEach(b => {
  b.onclick = () => toast(`${b.textContent.trim()} yakında. Şimdilik misafir olarak oynayabilirsin.`, 2600);
});

let introStage = 0, introTimer = 0, dayStart = 0;
function runIntro() {
  showScreen('intro');
  $('screenIntro').classList.remove('day');
  const ctx = fitCanvas($('introPofi'), 120, 120);
  drawPofi(ctx, 60, 116, 100, { face: 1, lean: 0.2, outfit: P.outfit });
  introStage = 1;
  requestAnimationFrame(() => $('introPresents').classList.add('show'));
  introTimer = setTimeout(() => {
    $('introPresents').classList.remove('show');
    introTimer = setTimeout(introDay, 550);
  }, 2000);
}
function introDay() {
  clearTimeout(introTimer);
  introStage = 2;
  dayStart = performance.now();
  $('introPresents').classList.remove('show');
  $('screenIntro').classList.add('day');
  // CSS animasyonuyla eş: Pofi kayar → kara çarpar → isim belirir.
  setTimeout(() => introStage === 2 && sfx.slide(6), 200);
  setTimeout(() => introStage === 2 && sfx.bump(), 1050);
  setTimeout(() => introStage === 2 && sfx.fish(4), 1350);
}
$('screenIntro').onclick = () => {
  if (introStage === 1) introDay();
  else if (introStage === 2 && performance.now() - dayStart > 500) {
    introStage = 0;
    track('intro_complete');
    showScreen('home');
    if (pendingVisit) { const code = pendingVisit; pendingVisit = null; openVisit(code); }
  }
};

// ---------- level ----------
const dateKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const yesterdayKey = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dateKey(d); };

function levelDef(n) {
  return n <= LEVELS.length ? LEVELS[n - 1] : generateLevel(n);
}

function startLevel(n, daily = false) {
  let def;
  if (daily) {
    const key = dateKey();
    def = { ...generateLevel(Math.max(9, P.level - 1), { seed: +key.replace(/-/g, '') }), limit: null, daily: key };
  } else {
    def = levelDef(n);
  }
  const { L, S } = parseLevel(def);
  // Kardan adam: hamle limitli levellerde ek hamle.
  const limit = def.limit ? def.limit + buff(P, 'hardMoves') : null;
  run = { def, L, st: S, history: [], moves: 0, limit, finished: false, daily: !!daily, stuck: false, fishSound: 0, hintsUsed: 0 };
  showScreen('game');
  board.outfit = P.outfit;
  board.setLevel(L, S);
  board.tutorialDir = !daily && def.n <= 2 ? solve(L, S)?.[0] ?? -1 : -1;
  renderHud();
  renderGoal();
  track(daily ? 'daily_puzzle_start' : 'level_start', { level: def.n, tier: def.tier, min: def.min });

  const intro = !daily && INTRO[def.n];
  if (intro && !P.stars[def.n]) {
    openOverlay(`<span class="new-tag">YENİ</span><h2>${intro.title}</h2><canvas class="intro-icon" id="introIcon"></canvas><p>${intro.text}</p><button id="introOk" class="btn primary big">Anladım</button>`);
    drawIntroIcon($('introIcon'), intro.icon);
    $('introOk').onclick = closeOverlay;
  } else if (run.limit) {
    toast(`${TIER_LABEL[def.tier]} level · ${run.limit} hamle hakkın var`, 2200);
  }
}

function drawIntroIcon(cv, kind) {
  const ctx = fitCanvas(cv, 84, 84);
  const tile = { snow: T.SNOW, water: T.WATER, crack: T.CRACK, lever: T.LEVER, arrow: T.RIGHT, ramp: T.RAMP_RIGHT, hole: T.HOLE, melt: T.MELT }[kind] ?? T.ICE;
  paintTile(ctx, tile, 0, 0, 84, 0, {});
  if (['fish', 'crate', 'seal', 'order'].includes(kind)) paintTile(ctx, kind, 0, 0, 84, 0, {});
}

function renderHud() {
  $('hudLevel').textContent = run.daily ? 'Günlük bulmaca' : `Level ${run.def.n}`;
  const tl = run.daily ? '' : TIER_LABEL[run.def.tier];
  $('hudTier').textContent = tl;
  $('hudTier').className = `tier ${run.def.tier}${tl ? '' : ' hidden'}`;
  const box = $('hudMoves').parentElement;
  if (run.limit) {
    const left = Math.max(0, run.limit - run.moves);
    $('hudMoves').textContent = left;
    $('hudMovesLabel').textContent = 'hamle kaldı';
    box.classList.toggle('low', left <= 2);
  } else {
    $('hudMoves').textContent = run.moves;
    $('hudMovesLabel').textContent = `hamle · en iyi ${run.def.min}`;
    box.classList.remove('low');
  }
  const hints = P.hints + freeLeft('hints');
  $('hintCount').textContent = hints > 0 ? hints : '+';
  $('btnUndo').disabled = run.history.length === 0;
}

function renderGoal() {
  const n = run.L.fishCells.length, got = popcount(run.st.fish);
  $('goal').innerHTML = `<span class="chip${got === n ? ' done' : ''}"><canvas id="goalFish"></canvas><b>${got}/${n}</b></span>`
    + (run.stuck ? '<span class="chip stuck">Sıkıştın! Geri al</span>' : '');
  drawFish(fitCanvas($('goalFish'), 28, 20), 13, 10, 24, 0);
}

board.onMove = dir => {
  if (!run || run.finished || overlayOpen()) return;
  const r = simulate(run.L, run.st, dir);
  if (!r) { sfx.bump(); return; }
  run.history.push(run.st);
  run.st = r.state;
  run.moves++;
  run.stuck = false;
  run.fishSound = popcount(run.history[run.history.length - 1].fish);
  sealSounded = false;
  board.play(r, run.history[run.history.length - 1]);
  sfx.slide(r.pPath.length - 1);
  if (P.settings.haptics) navigator.vibrate?.(10);
  renderHud();
};

let sealSounded = false; // bir hamlede foklar tek ses çıkarır
board.onFx = f => {
  if (f.k === 'fish') { sfx.fish(run.fishSound++); renderGoal(); }
  else if (f.k === 'crack') sfx.crack();
  else if (f.k === 'sink') sfx.splash();
  else if (f.k === 'lever') sfx.lever();
  else if (f.k === 'push') sfx.crate();
  else if (f.k === 'jump') sfx.jump();
  else if (f.k === 'land') sfx.land();
  else if (f.k === 'warp') sfx.warp();
  else if (f.k === 'melt') sfx.melt();
  else if (f.k === 'seal' && !sealSounded) { sealSounded = true; setTimeout(() => sfx.seal(), 60); }
  else if (f.k === 'skip') sfx.skip();
  else if (f.k === 'bump' || f.k === 'snow') sfx.bump();
};

board.onSettled = () => {
  if (!run || run.finished) return;
  renderGoal();
  if (won(run.L, run.st)) { win(); return; }
  if (run.limit && run.moves >= run.limit) { run.finished = true; setTimeout(fail, 300); return; }
  if (!run.daily && run.def.n <= 2) board.tutorialDir = solve(run.L, run.st)?.[0] ?? -1;
  // Çıkışsız duruma düşüldüyse oyuncuya geri almayı öner.
  const snapshot = run.st;
  setTimeout(() => {
    if (!run || run.finished || run.st !== snapshot) return;
    run.stuck = solve(run.L, run.st, 100000) === null;
    if (run.stuck) { renderGoal(); track('stuck', { level: run.def.n, moves: run.moves }); }
  }, 30);
};

function undo() {
  if (!run || run.finished || board.anim || !run.history.length) return;
  run.st = run.history.pop();
  run.moves = Math.max(0, run.moves - 1);
  run.stuck = false;
  board.setState(run.st);
  if (!run.daily && run.def.n <= 2) board.tutorialDir = solve(run.L, run.st)?.[0] ?? -1;
  renderHud();
  renderGoal();
}

function win() {
  run.finished = true;
  board.tutorialDir = -1;
  const stars = starsFor(run.def.min, run.moves);
  let raw;
  if (run.daily) {
    P.dailyPuzzleStreak = (P.dailyPuzzleDay === yesterdayKey() ? P.dailyPuzzleStreak : 0) + 1;
    P.dailyPuzzleDay = run.def.daily;
    raw = Math.round(dailyPuzzleCoins(P.dailyPuzzleStreak) * (1 + buff(P, 'puzzlePct')));
    track('daily_puzzle_complete', { streak: P.dailyPuzzleStreak, moves: run.moves });
  } else {
    raw = ECON.coin[run.def.tier] + stars * (ECON.coinPerStar + buff(P, 'starCoin'));
    P.stars[run.def.n] = Math.max(P.stars[run.def.n] || 0, stars);
    P.level = Math.max(P.level, run.def.n + 1);
    track('level_complete', { level: run.def.n, moves: run.moves, min: run.def.min, stars });
  }
  // Köy buff'ları: iglo + köy bonusu yüzdesi, iskele balık başına coin, kulübe şanslı kar tanesi.
  const pct = coinBonusPct(P);
  const fishCoins = run.L.fishCells.length * buff(P, 'fishCoin');
  const base = raw + Math.round(raw * pct) + fishCoins;
  const lucky = Math.random() < buff(P, 'flakeChance');
  const flakes = 1 + (stars === 3 ? ECON.starFlake : 0) + (lucky ? 1 : 0);
  taskProgress('levels', 1);
  taskProgress('fish', run.L.fishCells.length);
  if (stars === 3) taskProgress('stars', 1);
  P.flakes += flakes;
  persist();
  setTimeout(() => {
    board.burst(run.st.p, '#ffd166', 24, board.s * 5, 1, board.s * 4);
    board.burst(run.st.p, '#8fd0ff', 24, board.s * 5, 1, board.s * 4);
    board.celebrate();
    sfx.win();
  }, 150);
  // Haftalık etkinlik puanı
  const ev = ensureEvent(P);
  const evPts = Math.round(eventPoints(ev, { stars, fish: run.L.fishCells.length, daily: run.daily, hintsUsed: run.hintsUsed > 0 }) * (1 + buff(P, 'eventPct')));
  P.event.points += evPts;
  persist();
  const notes = [
    pct > 0 && `Köy bonusu +%${Math.round(pct * 100)}`,
    fishCoins > 0 && `Balık +${fishCoins}`,
    stars === 3 && '3 yıldız +1 ❄',
    lucky && 'Şanslı ağ +1 ❄',
    `${ev.name} +${evPts} puan`,
  ].filter(Boolean).join(' · ');
  setTimeout(() => showResult(stars, base, flakes, notes), 1100);
}

// Buz pisti x5 bölgesini genişletir; fark iki uçtaki x2 bölgelerinden düşülür.
function multZones() {
  const w = buff(P, 'x5'), d = (w - 10) / 2;
  return MULT_ZONES.map(z => (z.m === 5 ? { m: 5, w } : z.m === 2 ? { m: 2, w: z.w - d } : z));
}

function multAt(zones, pos) {
  let acc = 0;
  for (const z of zones) { acc += z.w / 100; if (pos <= acc) return z.m; }
  return zones[zones.length - 1].m;
}

function showResult(stars, base, flakes, notes) {
  const zones = multZones();
  const head = run.daily
    ? `<span class="new-tag">GÜNLÜK BULMACA · SERİ ${P.dailyPuzzleStreak}</span><h2>Bugünkü tamam!</h2>`
    : `<h2>${stars === 3 ? 'Kusursuz!' : 'Harika!'}</h2>`;
  openOverlay(`
    ${head}
    <div class="stars">${[1, 2, 3].map(k => `<span class="star${k <= stars ? ' on' : ''}">★</span>`).join('')}</div>
    <p>${run.moves} hamle · en iyi çözüm ${run.def.min}</p>
    <div class="reward-row">
      <span class="pill big">${coinIco}<b id="rwCoins">${base}</b></span>
      <span class="pill big">${flakeIco}<b>+${flakes}</b></span>
    </div>
    ${notes ? `<small class="breakdown">${notes}</small>` : ''}
    <div id="claimArea">
      <div class="mult">
        <div class="mult-zones">${zones.map(z => `<div class="z z${z.m}" style="flex:${z.w}">x${z.m}</div>`).join('')}</div>
        <div id="needle" class="needle"></div>
      </div>
      <button id="btnMult" class="btn primary big ad"><span id="multLabel">x2 Al</span></button>
      <button id="btnNoThanks" class="btn link invisible">Hayır, teşekkürler (${base})</button>
    </div>`);

  for (let k = 0; k < stars; k++) setTimeout(() => sfx.star(k), 60 + k * 120);

  let running = true, pos = 0;
  const t0 = performance.now();
  (function tick(now) {
    if (!running) return;
    const p = (((now - t0) / 1000) * 0.75) % 2;
    pos = p < 1 ? p : 2 - p;
    $('needle').style.left = pos * 100 + '%';
    const m = multAt(zones, pos);
    $('multLabel').textContent = `x${m} Al · ${base * m}`;
    requestAnimationFrame(tick);
  })(t0);
  const noThanksTimer = setTimeout(() => $('btnNoThanks')?.classList.remove('invisible'), ADS.noThanksDelayMs);

  const claim = total => {
    P.coins += total;
    persist();
    sfx.coin();
    countUp($('rwCoins'), base, total);
    const villageBtn = canAffordAny(P) ? '<button id="toVillage" class="btn secondary">Köye git<span class="dot"></span></button>' : '';
    $('claimArea').innerHTML = `<div style="display:flex;flex-direction:column;gap:12px"><button id="toNext" class="btn green big">Devam</button>${villageBtn}</div>`;
    const leave = then => {
      closeOverlay();
      save(P);
      then();
    };
    $('toNext').onclick = () => leave(() => (run.daily ? showScreen('home') : startLevel(P.level)));
    if (villageBtn) $('toVillage').onclick = () => leave(() => showScreen('village'));
  };

  $('btnMult').onclick = async () => {
    running = false;
    clearTimeout(noThanksTimer);
    const m = multAt(zones, pos);
    $('btnMult').disabled = true;
    $('btnNoThanks').disabled = true;
    const ok = await showRewarded('level_end_multiplier');
    track('multiplier_result', { mult: m, watched: ok });
    if (ok) sfx.reward();
    claim(ok ? base * m : base);
  };
  $('btnNoThanks').onclick = () => { running = false; claim(base); };
}

function countUp(el, from, to) {
  if (from === to) return;
  const t0 = performance.now();
  (function step(now) {
    const k = Math.min(1, (now - t0) / 700);
    el.textContent = Math.round(from + (to - from) * k);
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}

function fail() {
  if (won(run.L, run.st)) return;
  track('level_fail', { level: run.def.n, fish: popcount(run.st.fish) });
  sfx.fail();
  const free = freeLeft('cont');
  openOverlay(`
    <h2>Hamlen bitti!</h2>
    <p>Çok yaklaştın: ${popcount(run.st.fish)}/${run.L.fishCells.length} balık toplandı.</p>
    ${free > 0 ? `<button id="fFree" class="btn green big">Ücretsiz +${ECON.continueMoves} hamle</button><small class="breakdown">Deniz feneri · bugün ${free} hakkın var</small>` : ''}
    <button id="fAd" class="btn primary big ad">+${ECON.continueMoves} hamle</button>
    <button id="fCoin" class="btn secondary">+${ECON.continueMoves} hamle · ${ECON.continueCost} coin</button>
    <button id="fRetry" class="btn link">Baştan başla</button>`);
  $('fCoin').disabled = P.coins < ECON.continueCost;
  const resume = () => { run.limit += ECON.continueMoves; run.finished = false; closeOverlay(); renderHud(); };
  if (free > 0) $('fFree').onclick = () => { P.daily.cont++; persist(); resume(); };
  $('fAd').onclick = async () => { if (await showRewarded('continue')) resume(); };
  $('fCoin').onclick = () => { P.coins -= ECON.continueCost; persist(); resume(); };
  $('fRetry').onclick = () => { closeOverlay(); startLevel(run.def.n, run.daily); };
}

function useHint() {
  if (!run || run.finished || board.anim) return;
  const sol = solve(run.L, run.st, 150000);
  if (!sol) { toast('Bu durumdan çıkış yok. Önce geri al.'); return; }
  const free = freeLeft('hints') > 0;
  if (free || P.hints > 0) {
    if (free) P.daily.hints++; else P.hints--;
    run.hintsUsed++;
    persist();
    track('booster_used', { type: 'hint', level: run.def.n });
    board.hintDir = sol[0];
    board.hintT = 2.6;
    sfx.fish(5);
    renderHud();
    return;
  }
  openOverlay(`
    <h2>İpucu</h2>
    <p>İpucun kalmadı. İpucu, bulunduğun yerden en kısa çözümün sıradaki hamlesini gösterir.</p>
    <button id="hAd" class="btn primary big ad">+1 ipucu</button>
    <button id="hCoin" class="btn secondary">+1 ipucu · ${ECON.hintCost} coin</button>
    <button id="hClose" class="btn link">Vazgeç</button>`);
  $('hCoin').disabled = P.coins < ECON.hintCost;
  $('hAd').onclick = async () => {
    const ok = await showRewarded('free_hint');
    closeOverlay();
    if (ok) { P.hints++; useHint(); }
  };
  $('hCoin').onclick = () => { P.coins -= ECON.hintCost; P.hints++; closeOverlay(); useHint(); };
  $('hClose').onclick = closeOverlay;
}

// ---------- köy ----------
// Günlük ücretsiz haklar (fener dizisi: ipucu, deniz feneri: +5 hamle); gün değişince sıfırlanır.
function freeLeft(kind) {
  if (P.daily.day !== dateKey()) P.daily = { day: dateKey(), hints: 0, cont: 0 };
  return Math.max(0, buff(P, kind === 'hints' ? 'freeHints' : 'freeContinues') - P.daily[kind]);
}

// Kakao: stant saatte fincan üretir; birikim gözlem noktasının saat sınırıyla dolar.
const cocoaRate = () => buff(P, 'cocoa') * (1 + buff(P, 'cocoaPct'));
const cocoaCap = () => Math.round(cocoaRate() * buff(P, 'cocoaCap'));
function cocoaNow() {
  const rate = cocoaRate();
  if (!rate) return 0;
  const hours = (Date.now() - P.cocoaTs) / 3.6e6;
  return Math.min(P.cocoaCups + rate * hours, cocoaCap());
}
function bankCocoa() { P.cocoaCups = cocoaNow(); P.cocoaTs = Date.now(); }

const recipeReady = () => { const r = nextRecipe(P); return !!r && villageLevel(P) >= r.vl && P.coins >= discounted(P, r.price); };

function renderCocoa() {
  const rate = Math.round(cocoaRate() * 10) / 10, price = cupPrice(P), cups = Math.floor(cocoaNow());
  $('cocoaAmt').textContent = cups;
  $('cocoaRate').textContent = rate
    ? `fincan ${price} coin · saatte ${rate} fincan · en fazla ${cocoaCap()}`
    : 'Kakao standını kurunca yolculara sıcak kakao satarsın';
  const busy = cups < 1 || !!village.sale;
  $('btnCocoa').disabled = busy;
  $('btnCocoa').textContent = `Sat · ${cups * price}`;
  $('btnCocoa2').disabled = busy;
  $('btnCocoa2').textContent = `x2 · ${cups * price * 2}`;
  $('btnRecipes').classList.toggle('has-dot', recipeReady());
}

// Satış: coin hemen kaydedilir; köy ekranında Pofi fincanları yolculara götürür, sayaç servis anında artar.
function sellCocoa(mult) {
  const cups = Math.floor(cocoaNow());
  if (cups < 1 || village.sale) return;
  const coins = cups * cupPrice(P) * mult;
  P.cocoaCups = cocoaNow() - cups;
  P.cocoaTs = Date.now();
  P.coins += coins;
  save(P);
  track('cocoa_sell', { cups, coins, mult });
  taskProgress('cocoa', 1);
  const done = () => {
    updateWallet();
    sfx.coin();
    toast(`${cups} fincan satıldı · +${coins} coin`);
    renderCocoa();
  };
  if (screen !== 'village' || !village.playSale({ cups, coins, pier: !!P.village.pier, done })) done();
  renderCocoa();
}

function showRecipes() {
  const vl = villageLevel(P), next = nextRecipe(P);
  const rows = COCOA.recipes.map(r => {
    const have = P.recipes.includes(r.id), price = discounted(P, r.price);
    const act = have ? '<span class="check">✓</span>'
      : r !== next ? '<small class="muted">sırayla açılır</small>'
      : vl < r.vl ? `<small class="muted">Köy Lv${r.vl}</small>`
      : `<button class="btn green" data-rc="${r.id}" ${P.coins < price ? 'disabled' : ''}>${coinIco}${price}</button>`;
    return `<div class="ev-step${have ? ' done' : ''}"><span class="pts">+${r.add}</span><span class="rw"><b>${r.name}</b></span>${act}</div>`;
  }).join('');
  openOverlay(`
    <span class="new-tag">KAKAO TARİFLERİ</span>
    <h2>Fincan ${cupPrice(P)} coin</h2>
    <p>Kuzey ışıklarını izlemeye gelen yolcular üşür. Köyün geçimi onlara satılan sıcak kakao. Her tarif fincan başına kalıcı olarak coin ekler.</p>
    <div class="ev-track">${rows}</div>
    <button id="rcClose" class="btn link">Kapat</button>`);
  $('rcClose').onclick = closeOverlay;
  $('overlayCard').querySelectorAll('[data-rc]').forEach(btn => {
    btn.onclick = () => {
      const r = COCOA.recipes.find(x => x.id === btn.dataset.rc), price = discounted(P, r.price);
      if (P.recipes.includes(r.id) || P.coins < price) return;
      P.coins -= price;
      P.recipes.push(r.id);
      persist();
      sfx.reward();
      track('recipe_buy', { id: r.id, price });
      toast(`${r.name} tarifi alındı · fincan artık ${cupPrice(P)} coin`);
      showRecipes();
      renderCocoa();
    };
  });
}

// Seviye tavanındaki yapı için açıklama: Bölge 2 açılmadıysa Lv4-5'in nerede açılacağını söyler.
const capText = b => (bLevel(P, b.id) < b.costs.length ? "Lv4-5 Köy Lv8'de açılır" : 'En yüksek seviye');
const dots = (lv, max) => `<span class="dots">${Array.from({ length: max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</span>`;
const unlockNames = lv => BUILDINGS.filter(b => b.unlock === lv && (P.land || 1) > (b.district || 0)).map(b => b.name).join(', ');

// Köy etiketi: seviye bölgesi (Bölge 1/2) ve o an bakılan arazinin adı.
let shownPanel = -1;
function renderZoneTag() {
  shownPanel = village.panel;
  $('zoneName').textContent = `${zone(P).name.split(' · ')[0]} · ${DISTRICTS[shownPanel]?.name || ''}`;
}

// Arazi (yeni bölge): köy seviyesi şartı + coin. Açılabilir durumdaysa köy sekmesinde işaret çıkar.
const districtReady = () => { const d = nextDistrict(P); return !!d && !d.soon && villageLevel(P) >= d.vl && P.coins >= d.price; };

function showDistrict(i) {
  const d = DISTRICTS[i];
  if (!d || i !== (P.land || 1)) return;
  const vl = villageLevel(P), ok = !d.soon && vl >= d.vl && P.coins >= d.price;
  const why = d.soon ? 'Bu arazi yakında geliyor.' : vl < d.vl ? `Köy Lv${d.vl} gerekli (şu an Lv${vl}).` : P.coins < d.price ? `${d.price - P.coins} coin daha gerekli.` : '';
  openOverlay(`
    <span class="new-tag">YENİ ARAZİ</span>
    <h2>${d.name}</h2>
    <p>${d.soon ? 'Köy büyümeye devam edecek: yeni yapılar ve yeni bonuslarla.' : `Köy yana doğru genişler. Yeni yapılar: ${d.text}. Yapılar kar tanesiyle kurulur.`}</p>
    ${why ? `<small class="breakdown">${why}</small>` : ''}
    ${d.soon ? '' : `<button id="dsBuy" class="btn green" ${ok ? '' : 'disabled'}>Aç · ${coinIco}${d.price}</button>`}
    <button id="dsClose" class="btn link">Kapat</button>`);
  $('dsClose').onclick = closeOverlay;
  if ($('dsBuy')) $('dsBuy').onclick = () => {
    if (!districtReady()) return;
    bankCocoa();
    P.coins -= d.price;
    P.land = i + 1;
    persist();
    closeOverlay();
    sfx.reward();
    track('district_unlock', { id: d.id, price: d.price });
    toast(`${d.name} açıldı! Yeni yapılar listede.`);
    renderVillage();
    village.goPanel(i);
  };
}

function renderVillage() {
  renderZoneTag();
  renderVlCard();
  const nd = nextDistrict(P);
  const dCard = nd ? `<button class="b-card district${districtReady() ? ' ready' : ''}" data-d="${P.land || 1}"><b>Yeni arazi: ${nd.name}</b><small>${nd.soon ? 'Yeni yapılar ve bonuslar' : `Köy Lv${nd.vl} · köy yana genişler`}</small><span class="act">${nd.soon ? 'Yakında' : `Aç ${coinIco}${nd.price}`}</span>${districtReady() ? '<i class="dot"></i>' : ''}</button>` : '';
  const vNext = VILLAGERS.find(v => v.price && !P.villagers.includes(v.id));
  const vCard = villageLevel(P) >= 3 ? `<button class="b-card district" data-vill><b>Köylüler · ${villagersHere().length}/${VILLAGERS.length}</b><small>${phaseNow().name}: ${PHASE_TEXT[phaseNow().id]}</small><span class="act">${vNext ? (villageLevel(P) >= vNext.vl ? `Davet et ${coinIco}${discounted(P, vNext.price)}` : `Sıradaki köylü Köy Lv${vNext.vl}`) : 'Hepsi köyde'}</span></button>` : '';
  const slotsOpen = DECOR_SLOTS.filter(s => Math.floor(s.at[0]) < (P.land || 1));
  const dcCard = `<button class="b-card district" data-decor><b>Süsler · ${slotsOpen.filter(s => P.decor[s.id]).length}/${slotsOpen.length} yer dolu</b><small>Fener, bank, çam, buz heykelciği…</small><span class="act">Süsle ${coinIco}${Math.min(...DECOR_ITEMS.map(d => discounted(P, d.price)))}+</span></button>`;
  $('buildList').innerHTML = dCard + vCard + dcCard + BUILDINGS.filter(b => !b.district || (P.land || 1) > b.district).map(b => {
    const lv = bLevel(P, b.id), max = maxLevel(P, b), cost = nextCost(P, b);
    if (!isUnlocked(P, b)) {
      return `<button class="b-card locked" data-b="${b.id}"><b>${b.name}</b><small>${BUFF_TEXT[b.buff](b.values[0])}</small><span class="act">Köy Lv${b.unlock}'te açılır</span></button>`;
    }
    const ready = cost !== null && P.flakes >= cost;
    const act = cost === null ? capText(b) : lv === 0 ? `Kur ${flakeIco}${cost}` : `Lv${lv + 1} ${flakeIco}${cost}`;
    const buffNow = BUFF_TEXT[b.buff](b.values[Math.max(0, lv - 1)]);
    return `<button class="b-card${ready ? ' ready' : ''}" data-b="${b.id}"><b>${b.name}</b>${dots(lv, max)}<small>${lv ? buffNow : 'Kurulunca: ' + buffNow}</small><span class="act">${act}</span>${ready ? '<i class="dot"></i>' : ''}</button>`;
  }).join('');
  $('buildList').querySelectorAll('[data-b]').forEach(btn => { btn.onclick = () => openSheet(btn.dataset.b); });
  $('buildList').querySelectorAll('[data-d]').forEach(btn => { btn.onclick = () => { village.goPanel(+btn.dataset.d); showDistrict(+btn.dataset.d); }; });
  $('buildList').querySelector('[data-vill]')?.addEventListener('click', showVillagers);
  $('buildList').querySelector('[data-decor]')?.addEventListener('click', enterDecor);
  renderCocoa();
}

function renderVlCard() {
  const vl = villageLevel(P), next = nextVillageLevel(P), tot = totalLevels(P);
  const cur = VILLAGE_LEVELS.find(v => v.lv === vl);
  const prog = next ? (tot - cur.need) / (next.need - cur.need) : 1;
  const extra = next && unlockNames(next.lv) ? ` · yeni: ${unlockNames(next.lv)}` : '';
  $('vlCard').innerHTML = `
    <div class="vl-top"><span class="vl-num">${vl}</span><div><b>Köy seviyesi ${vl}</b><small>Köy bonusu: tüm level coin'lerine +%${Math.round(villageBonusPct(P) * 100)}</small></div></div>
    <div class="progress"><div style="width:${prog * 100}%;height:100%;background:var(--blue)"></div></div>
    <small>${next ? `Lv${next.lv} için ${next.need - tot} yapı seviyesi daha · ${next.visual}${extra}` : 'Köy tamamen kuruldu! Bütün yapılar en yüksek seviyede.'}</small>`;
}

// ---------- yapı paneli: önce önizle, beğenirsen al ----------
let sheet = null; // { id, draft: { style, color } }

function openSheet(id) {
  if (village.decorMode) return;
  const b = building(id);
  if (!isUnlocked(P, b)) { toast(`${b.name} Köy Lv${b.unlock}'te açılır`); return; }
  const st = P.village[id];
  sheet = { id, draft: st ? { style: st.style, color: st.color } : null };
  village.focus = id;
  $('screenVillage').scrollTop = 0;
  renderSheet();
}

function closeSheet() {
  sheet = null;
  village.focus = null;
  village.preview = null;
  $('sheet').classList.add('hidden');
}

function renderSheet() {
  const b = building(sheet.id), st = P.village[b.id];
  const lv = bLevel(P, b.id), max = maxLevel(P, b), cost = nextCost(P, b);
  village.preview = st && sheet.draft ? { id: b.id, ...sheet.draft } : null;

  const buffLine = lv
    ? `<b>${BUFF_TEXT[b.buff](b.values[lv - 1])}</b><small>${lv < max ? `Lv${lv + 1}: ${BUFF_TEXT[b.buff](b.values[lv])}` : capText(b)}</small>`
    : `<b>Kurulunca: ${BUFF_TEXT[b.buff](b.values[0])}</b><small>Her seviye görünümü güzelleştirir ve buff'ı büyütür</small>`;
  const upLabel = cost === null ? capText(b) : lv === 0 ? `Kur · ${flakeIco}${cost}` : `Lv${lv + 1}'e yükselt · ${flakeIco}${cost}`;

  let looks = '<p class="sheet-note">Kurduktan sonra stil ve renk seçebilirsin.</p>';
  let action = '';
  if (st) {
    const ownedStyles = P.styles[b.id] || [0];
    const d = sheet.draft;
    const styleCost = ownedStyles.includes(d.style) ? 0 : discounted(P, b.stylePrice);
    const colorCost = d.color && !P.colors.includes(d.color) ? discounted(P, COLOR_PRICE) : 0;
    const total = styleCost + colorCost;
    const changed = d.style !== st.style || d.color !== st.color;
    looks = `
      <div class="sheet-sec"><b>Stil</b><small>Dokun, sahnede gör</small></div>
      <div class="chips">${b.styles.map((name, i) => {
        const lock = ownedStyles.includes(i) ? '' : ` ${coinIco}${discounted(P, b.stylePrice)}`;
        return `<button class="chip-btn${d.style === i ? ' sel' : ''}${st.style === i ? ' cur' : ''}" data-style="${i}">${name}${lock}</button>`;
      }).join('')}</div>
      <div class="sheet-sec"><b>Renk</b><small>Açılan renk tüm yapılarda kullanılır</small></div>
      <div class="swatches">
        <button class="sw def${d.color === null ? ' sel' : ''}" data-color="" title="Stilin kendi rengi"></button>
        ${COLORS.map(c => `<button class="sw${d.color === c.id ? ' sel' : ''}" data-color="${c.id}" title="${c.name}" style="background:${c.hex}">${P.colors.includes(c.id) ? '' : '<span class="lock">🔒</span>'}</button>`).join('')}
      </div>`;
    const label = !changed ? 'Şu anki görünüm' : total ? `Satın al · ${coinIco}${total}` : 'Uygula';
    action = `<div class="sheet-actions">
      <button id="shCancel" class="btn link">Vazgeç</button>
      <button id="shBuy" class="btn ${total ? 'primary' : 'green'}" ${!changed || P.coins < total ? 'disabled' : ''}>${changed && P.coins < total ? `Yetersiz coin · ${coinIco}${total}` : label}</button>
    </div>`;
    sheet.cost = { total, styleCost, colorCost };
  }

  $('sheet').innerHTML = `
    <div class="sheet-head"><div><b>${b.name}</b><span class="lv-pill">${lv ? `Lv ${lv}/${max}` : 'Kurulmadı'}</span></div><button id="shX" class="sheet-x" aria-label="Kapat">×</button></div>
    <div class="buff-box">${buffLine}</div>
    <button id="shUp" class="btn green big" ${cost === null || P.flakes < cost ? 'disabled' : ''}>${cost !== null && P.flakes < cost ? `${cost - P.flakes} kar tanesi daha gerekli` : upLabel}</button>
    ${INTERIOR[b.id] && st ? `<button id="shIn" class="btn secondary big in-btn">İçeri gir · eşya yerleştir${interiorReady(P, b.id) ? '<i class="dot"></i>' : ''}</button>` : ''}
    ${looks}
    ${action}`;
  $('sheet').classList.remove('hidden');

  $('shX').onclick = closeSheet;
  $('shUp').onclick = () => upgrade(b.id);
  if ($('shIn')) $('shIn').onclick = () => enterInterior(b.id);
  if (!st) return;
  $('sheet').querySelectorAll('[data-style]').forEach(btn => { btn.onclick = () => { sheet.draft.style = +btn.dataset.style; renderSheet(); }; });
  $('sheet').querySelectorAll('[data-color]').forEach(btn => { btn.onclick = () => { sheet.draft.color = btn.dataset.color || null; renderSheet(); }; });
  $('shCancel').onclick = closeSheet;
  $('shBuy').onclick = () => {
    const { total, styleCost, colorCost } = sheet.cost;
    if (P.coins < total) return;
    P.coins -= total;
    if (styleCost) P.styles[b.id] = [...(P.styles[b.id] || [0]), sheet.draft.style];
    if (colorCost) P.colors.push(sheet.draft.color);
    Object.assign(P.village[b.id], sheet.draft);
    persist();
    village.sparkle(b.id);
    total ? sfx.coin() : sfx.ui();
    track('village_look', { building: b.id, style: sheet.draft.style, color: sheet.draft.color, spent: total });
    toast('Yeni görünüm uygulandı');
    renderSheet();
    renderVillage();
  };
}

function upgrade(id) {
  const b = building(id), cost = nextCost(P, b);
  if (cost === null || P.flakes < cost) return;
  const vlBefore = villageLevel(P);
  bankCocoa();
  P.flakes -= cost;
  if (!P.village[id]) {
    P.village[id] = { lv: 1, style: 0, color: null };
    P.styles[id] = [0];
    sheet.draft = { style: 0, color: null };
  } else {
    P.village[id].lv++;
  }
  persist();
  track('village_upgrade', { building: id, level: P.village[id].lv });
  village.sparkle(id);
  sfx.task();
  toast(`${b.name} Lv${P.village[id].lv}: ${BUFF_TEXT[b.buff](b.values[P.village[id].lv - 1])}`, 2400);
  renderVillage();
  renderSheet();
  if (villageLevel(P) > vlBefore) setTimeout(celebrateVillage, 900);
}

// Köy seviyesi atlama kutlaması: görsel + buff + ödül sandığı. Birden fazla seviye birikirse sırayla.
function celebrateVillage() {
  const vl = villageLevel(P);
  if (P.vlClaimed >= vl) return;
  const L = VILLAGE_LEVELS.find(v => v.lv === P.vlClaimed + 1);
  closeSheet();
  const r = L.reward;
  const item = (slot, id) => WARDROBE[slot].find(x => x.id === id)?.name;
  const pills = [
    r.coins && `<span class="pill big">${coinIco}<b>${r.coins}</b></span>`,
    r.hints && `<span class="pill big">${hintIco}<b>${r.hints}</b></span>`,
    r.flakes && `<span class="pill big">${flakeIco}<b>${r.flakes}</b></span>`,
    r.hat && `<span class="pill big">🎩 <b>${item('hat', r.hat)}</b></span>`,
    r.scarf && `<span class="pill big">🧣 <b>${item('scarf', r.scarf)} atkı</b></span>`,
  ].filter(Boolean).join('');
  const unlocks = unlockNames(L.lv);
  sfx.win();
  BUILDINGS.forEach((b, i) => { if (P.village[b.id]) setTimeout(() => village.sparkle(b.id), i * 60); });
  openOverlay(`
    <span class="new-tag">KÖY SEVİYESİ</span>
    <h2>Köy Lv ${L.lv}!</h2>
    <p>Köyde yeni: <b>${L.visual}</b>${unlocks ? `<br>Yeni yapılar: <b>${unlocks}</b>` : ''}</p>
    <small class="breakdown">Köy bonusu artık tüm level coin'lerine +%${Math.round((L.lv - 1) * 3)}</small>
    <div class="reward-row" style="flex-wrap:wrap">${pills}</div>
    ${r.coins ? `<button id="vlAd" class="btn primary big ad">Coin'i x2 al</button>` : ''}
    <button id="vlTake" class="btn ${r.coins ? 'link' : 'green big'}">Topla</button>`);
  const take = mult => {
    P.coins += (r.coins || 0) * mult;
    P.hints += r.hints || 0;
    P.flakes += r.flakes || 0;
    if (r.hat && !P.owned.hat.includes(r.hat)) P.owned.hat.push(r.hat);
    if (r.scarf && !P.owned.scarf.includes(r.scarf)) P.owned.scarf.push(r.scarf);
    P.vlClaimed = L.lv;
    persist();
    sfx.reward();
    track('village_level', { level: L.lv, mult });
    closeOverlay();
    renderVillage();
    if (P.vlClaimed < villageLevel(P)) setTimeout(celebrateVillage, 400);
  };
  if (r.coins) $('vlAd').onclick = async () => take((await showRewarded('village_level_x2')) ? 2 : 1);
  $('vlTake').onclick = () => take(1);
}

function renderNextCard() {
  const s = suggestion(P);
  const card = $('nextCard');
  if (!s) {
    card.innerHTML = `${flakeIco}<span class="nc-text"><b>Köy tamamen kuruldu!</b><small>Yeni bölgeler yakında</small></span>`;
    return;
  }
  const what = s.lv === 0 ? `${s.b.name} kur` : `${s.b.name} Lv${s.lv + 1}'e yükselt`;
  const missing = s.cost - P.flakes;
  card.innerHTML = `${flakeIco}<span class="nc-text"><small>Köy · Lv ${villageLevel(P)}</small><b>${what}</b></span>`
    + `<span class="nc-go">${missing > 0 ? `${missing} kar tanesi daha` : 'Hazır ›'}</span>`;
}

// ---------- gardırop: önce dene, beğenirsen al ----------
let wardrobeCat = 'hat';
let wardrobeDraft = null; // denenen kıyafet (bu kategoride)

const previewOutfit = () => (wardrobeDraft ? { ...P.outfit, [wardrobeCat]: wardrobeDraft } : P.outfit);

function renderWardrobe() {
  document.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === wardrobeCat));
  const items = WARDROBE[wardrobeCat];
  const owned = P.owned[wardrobeCat];
  $('wardrobeList').innerHTML = items.map(it => {
    const on = P.outfit[wardrobeCat] === it.id, have = owned.includes(it.id), sel = wardrobeDraft === it.id;
    const label = on ? 'Giyili' : have ? 'Sahip' : it.reward ? `Köy Lv${it.reward}` : it.event ? 'Etkinlik' : `${coinIco}${discounted(P, it.price)}`;
    return `<button class="w-item${on ? ' on' : ''}${sel ? ' sel' : ''}${have ? '' : ' locked'}" data-w="${it.id}"><canvas></canvas><span>${it.name}</span><span class="price">${label}</span></button>`;
  }).join('');
  $('wardrobeList').querySelectorAll('[data-w]').forEach(btn => {
    const id = btn.dataset.w;
    const ctx = fitCanvas(btn.querySelector('canvas'), 64, 64);
    drawPofi(ctx, 32, 62, 50, { outfit: { ...P.outfit, [wardrobeCat]: id } });
    btn.onclick = () => { wardrobeDraft = id === P.outfit[wardrobeCat] ? null : id; renderWardrobe(); };
  });

  const it = wardrobeDraft && items.find(x => x.id === wardrobeDraft);
  if (!it) { $('wardrobeAction').innerHTML = `<p class="sheet-note" style="flex:1">Bir parçaya dokun, Pofi'nin üzerinde dene.</p>`; return; }
  const have = owned.includes(it.id), price = discounted(P, it.price);
  const btn = have ? `<button id="wBuy" class="btn green">Giy</button>`
    : it.reward ? `<button class="btn primary" disabled>Köy Lv${it.reward} ödülü</button>`
    : it.event ? `<button class="btn primary" disabled>Haftalık etkinlik ödülü</button>`
    : `<button id="wBuy" class="btn primary" ${P.coins < price ? 'disabled' : ''}>${P.coins < price ? 'Yetersiz coin · ' : 'Satın al ve giy · '}${coinIco}${price}</button>`;
  $('wardrobeAction').innerHTML = `<button id="wCancel" class="btn link">Vazgeç</button>${btn}`;
  $('wCancel').onclick = () => { wardrobeDraft = null; renderWardrobe(); };
  if ($('wBuy')) $('wBuy').onclick = () => {
    if (!have) {
      if (P.coins < price) return;
      P.coins -= price;
      owned.push(it.id);
      sfx.coin();
      track('wardrobe_buy', { slot: wardrobeCat, item: it.id, price });
    } else sfx.ui();
    P.outfit = { ...P.outfit, [wardrobeCat]: it.id };
    board.outfit = P.outfit;
    wardrobeDraft = null;
    persist();
    toast(`${it.name} giyildi`);
    renderWardrobe();
  };
}
document.querySelectorAll('.seg-btn').forEach(b => { b.onclick = () => { wardrobeCat = b.dataset.cat; wardrobeDraft = null; renderWardrobe(); }; });

// ---------- köy yaşamı (GDD 12.5) ----------
// Saat cihazdan okunur; test için adrese ?saat=20 eklenebilir.
const hourNow = () => {
  const q = new URLSearchParams(location.search).get('saat');
  if (q !== null && !Number.isNaN(+q)) return +q % 24;
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
};
const phaseNow = () => VILLAGE_PHASES.find(p => p.id === phaseOf(hourNow()));
const PHASE_TEXT = { morning: 'köylüler balıkta', day: 'kakao kuyruğu ve gezinti', evening: 'ateş başında toplanma', night: 'köylüler uyuyor' };
// Bobo köy Lv3'te kendiliğinden gelir; diğerleri davetle.
const villagersHere = () => VILLAGERS.filter(v => (v.price ? P.villagers.includes(v.id) : villageLevel(P) >= v.vl));

// Günlük iş: o gün köydeki bir köylü küçük bir iş ister.
function ensureTask() {
  const here = villagersHere();
  if (!here.length) return null;
  if (P.task?.day === dateKey()) return P.task;
  const pool = DAILY_TASKS.filter(t => !t.needs || P.village[t.needs]);
  const t = pool[Math.floor(Math.random() * pool.length)];
  P.task = { day: dateKey(), type: t.type, need: t.need, have: 0, giver: here[Math.floor(Math.random() * here.length)].id, claimed: false };
  save(P);
  return P.task;
}
const taskDone = () => { const t = P.task; return !!t && t.day === dateKey() && !t.claimed && t.have >= t.need; };
function taskProgress(type, n) {
  const t = ensureTask();
  if (!t || t.claimed || t.type !== type || t.have >= t.need) return;
  t.have = Math.min(t.need, t.have + n);
  if (t.have >= t.need) toast(`${VILLAGERS.find(v => v.id === t.giver).name}: "İşim bitti, köye uğra!"`);
}
function taskMarker() {
  const t = ensureTask();
  return t && !t.claimed ? { giver: t.giver, done: t.have >= t.need } : null;
}

function talkTo(id) {
  const v = VILLAGERS.find(x => x.id === id), t = ensureTask();
  if (t && !t.claimed && t.giver === id) { showTask(); return; }
  const lines = VILLAGER_LINES[phaseOf(hourNow())];
  village.say(id, `${v.name}: ${lines[Math.floor(Math.random() * lines.length)]}`);
  sfx.ui();
}

function showTask() {
  const t = ensureTask(), v = VILLAGERS.find(x => x.id === t.giver), def = DAILY_TASKS.find(d => d.type === t.type);
  const done = t.have >= t.need;
  openOverlay(`
    <span class="new-tag">GÜNLÜK İŞ</span>
    <canvas class="intro-icon" id="taskFace"></canvas>
    <h2>${v.name}</h2>
    <p>${done ? 'Harikasın, tam istediğim gibi! Al bakalım ödülün.' : `Bugün bana yardım eder misin? <b>${def.text}</b>.`}</p>
    <div class="progress"><div style="width:${Math.round((t.have / t.need) * 100)}%;height:100%;background:var(--green)"></div></div>
    <small class="breakdown">${t.have}/${t.need} · ödül ${coinIco}${TASK_REWARD.coins} + ${flakeIco}${TASK_REWARD.flakes}</small>
    ${done ? '<button id="tkClaim" class="btn green">Ödülü al</button>' : ''}
    <button id="tkClose" class="btn link">Kapat</button>`);
  drawPofi(fitCanvas($('taskFace'), 84, 84), 42, 82, 64, { outfit: v.outfit, happy: done });
  $('tkClose').onclick = closeOverlay;
  if ($('tkClaim')) $('tkClaim').onclick = () => {
    if (t.claimed || t.have < t.need) return;
    t.claimed = true;
    P.coins += TASK_REWARD.coins;
    P.flakes += TASK_REWARD.flakes;
    persist();
    closeOverlay();
    sfx.reward();
    track('task_claim', { type: t.type, giver: t.giver });
    toast(`+${TASK_REWARD.coins} coin, +${TASK_REWARD.flakes} kar tanesi`);
  };
}

function showVillagers() {
  const vl = villageLevel(P), here = villagersHere().map(v => v.id);
  const rows = VILLAGERS.map(v => {
    const price = discounted(P, v.price);
    const act = here.includes(v.id) ? '<span class="check">Köyde</span>'
      : !v.price ? `<small class="muted">Köy Lv${v.vl}</small>`
      : vl < v.vl ? `<small class="muted">Köy Lv${v.vl}</small>`
      : `<button class="btn green" data-inv="${v.id}" ${P.coins < price ? 'disabled' : ''}>${coinIco}${price}</button>`;
    return `<div class="ev-step${here.includes(v.id) ? ' done' : ''}"><canvas class="vill-face" data-face="${v.id}"></canvas><span class="rw"><b>${v.name}</b>${v.kid ? '&nbsp;<small>çocuk</small>' : ''}</span>${act}</div>`;
  }).join('');
  openOverlay(`
    <span class="new-tag">KÖYLÜLER</span>
    <h2>Köyü şenlendir</h2>
    <p>Köylüler günün saatine göre yaşar: sabah balığa çıkar, öğlen kakao kuyruğuna girer, akşam ateş başında toplanır, gece uyur. Her gün biri senden küçük bir iş ister.</p>
    <div class="ev-track">${rows}</div>
    <button id="vlClose" class="btn link">Kapat</button>`);
  $('overlayCard').querySelectorAll('[data-face]').forEach(cv => {
    const v = VILLAGERS.find(x => x.id === cv.dataset.face);
    drawPofi(fitCanvas(cv, 36, 36), 18, 35, v.kid ? 24 : 30, { outfit: v.outfit });
  });
  $('vlClose').onclick = closeOverlay;
  $('overlayCard').querySelectorAll('[data-inv]').forEach(btn => {
    btn.onclick = () => {
      const v = VILLAGERS.find(x => x.id === btn.dataset.inv), price = discounted(P, v.price);
      if (P.villagers.includes(v.id) || P.coins < price || villageLevel(P) < v.vl) return;
      P.coins -= price;
      P.villagers.push(v.id);
      persist();
      sfx.reward();
      track('villager_invite', { id: v.id, price });
      toast(`${v.name} köye taşındı!`);
      showVillagers();
      renderVillage();
    };
  });
}

// ---------- süsler (GDD 12.3) ----------
// Süsleme modu: köyde boş süs yerleri "+" ile görünür. Yere dokun → süsü seç (sahnede önizlenir)
// → "Satın al ve yerleştir". Her yerleştirme ayrı ücretlidir; değiştirilen süs geri verilmez.
function enterDecor() {
  closeSheet();
  village.decorMode = true;
  village.decorSel = null;
  village.decorPreview = null;
  $('screenVillage').scrollTop = 0;
  renderDecor();
}

function exitDecor() {
  village.decorMode = false;
  village.decorSel = null;
  village.decorPreview = null;
  $('sheet').classList.add('hidden');
  if (screen === 'village') renderVillage();
}

function renderDecor() {
  const slot = village.decorSel, cur = slot ? P.decor[slot] : null, pv = village.decorPreview?.item || null;
  let body = '<p class="sheet-note">Köyde "+" olan bir süs yerine dokun. Yanlara kaydırarak diğer arazilerdeki yerleri de görebilirsin.</p>';
  let action = '<div class="sheet-actions"><button id="dcDone" class="btn green">Bitti</button></div>';
  if (slot) {
    body = `<div class="sheet-sec"><b>Süs seç</b><small>Dokun, yerinde gör</small></div>
      <div class="wardrobe-grid">${DECOR_ITEMS.map(d => `<button class="w-item${cur === d.id ? ' on' : ''}${pv === d.id ? ' sel' : ''}" data-dec="${d.id}"><canvas></canvas><span>${d.name}</span><span class="price">${cur === d.id ? 'Yerleşik' : `${coinIco}${discounted(P, d.price)}`}</span></button>`).join('')}</div>`;
    const it = pv && DECOR_ITEMS.find(d => d.id === pv), price = it ? discounted(P, it.price) : 0;
    action = `<div class="sheet-actions">
      ${cur ? '<button id="dcRemove" class="btn link">Kaldır</button>' : '<button id="dcBack" class="btn link">Başka yer</button>'}
      ${it ? `<button id="dcBuy" class="btn primary" ${P.coins < price ? 'disabled' : ''}>${P.coins < price ? 'Yetersiz coin · ' : 'Satın al ve yerleştir · '}${coinIco}${price}</button>` : '<button id="dcDone" class="btn green">Bitti</button>'}
    </div>`;
  }
  $('sheet').innerHTML = `
    <div class="sheet-head"><div><b>Köyü süsle</b><span class="lv-pill">${Object.keys(P.decor).length} süs</span></div><button id="dcX" class="sheet-x" aria-label="Kapat">×</button></div>
    ${body}
    ${action}`;
  $('sheet').classList.remove('hidden');
  $('dcX').onclick = exitDecor;
  if ($('dcDone')) $('dcDone').onclick = exitDecor;
  if ($('dcBack')) $('dcBack').onclick = () => { village.decorSel = null; village.decorPreview = null; renderDecor(); };
  $('sheet').querySelectorAll('[data-dec]').forEach(btn => {
    const ctx = fitCanvas(btn.querySelector('canvas'), 64, 64);
    drawDecor(ctx, 32, 58, 520, btn.dataset.dec, 0, 0);
    btn.onclick = () => {
      const id = btn.dataset.dec;
      village.decorPreview = id === cur || id === pv ? null : { slot, item: id };
      renderDecor();
    };
  });
  if ($('dcRemove')) $('dcRemove').onclick = () => {
    delete P.decor[slot];
    village.decorPreview = null;
    persist();
    sfx.ui();
    renderDecor();
  };
  if ($('dcBuy')) $('dcBuy').onclick = () => {
    const it = DECOR_ITEMS.find(d => d.id === pv), price = discounted(P, it.price);
    if (P.coins < price) return;
    P.coins -= price;
    P.decor[slot] = it.id;
    village.decorPreview = null;
    persist();
    sfx.coin();
    track('decor_buy', { slot, item: it.id, price });
    toast(`${it.name} yerleştirildi`);
    renderDecor();
  };
}

// ---------- iç mekân (GDD 12.3) ----------
// Yuvaya dokun → kademeyi seç → odada önizle → "Satın al ve yerleştir". Kademeler sırayla alınır.
let room = null; // { id, slot, draft: önizlenen kademe ya da null }
const homesReady = () => Object.keys(INTERIOR).filter(id => interiorReady(P, id));

function enterInterior(id) {
  if (!INTERIOR[id] || !P.village[id]) return;
  closeSheet();
  const slots = INTERIOR[id].slots;
  // coin'i yeten ilk yuvadan, yoksa ilk boş yuvadan başla
  const first = slots.find(s => { const t = slotTier(P, id, s.id); return t < 3 && P.coins >= discounted(P, s.items[t].price); })
    || slots.find(s => slotTier(P, id, s.id) < 3) || slots[0];
  room = { id, slot: first.id, draft: null };
  showScreen('interior');
  renderInterior();
  track('interior_enter', { id });
}

function renderInterior() {
  if (!room) return;
  const cfg = INTERIOR[room.id], slot = cfg.slots.find(s => s.id === room.slot);
  const have = slotTier(P, room.id, slot.id);
  const placed = cfg.slots.reduce((n, s) => n + slotTier(P, room.id, s.id), 0);
  $('roomTitle').textContent = cfg.title;
  $('roomCount').textContent = `Eşya ${placed}/${cfg.slots.length * 3}`;
  $('roomSlots').innerHTML = cfg.slots.map(s => {
    const t = slotTier(P, room.id, s.id), ready = t < 3 && P.coins >= discounted(P, s.items[t].price);
    return `<button class="chip-btn${s.id === room.slot ? ' sel' : ''}" data-slot="${s.id}">${s.name}<span class="tiers">${t}/3</span>${ready ? '<i class="dot"></i>' : ''}</button>`;
  }).join('');
  $('roomList').innerHTML = slot.items.map((it, i) => {
    const tier = i + 1, owned = tier <= have, price = discounted(P, it.price);
    const label = owned ? (tier === have ? 'Yerleşik' : 'Sahip') : tier > have + 1 ? 'Sırayla açılır' : `${coinIco}${price}`;
    return `<button class="w-item${tier === have ? ' on' : ''}${room.draft === tier ? ' sel' : ''}${owned ? '' : ' locked'}" data-tier="${tier}"><canvas></canvas><span>${it.name}</span><span class="price">${label}</span></button>`;
  }).join('');
  $('roomSlots').querySelectorAll('[data-slot]').forEach(btn => { btn.onclick = () => { room.slot = btn.dataset.slot; room.draft = null; renderInterior(); }; });
  $('roomList').querySelectorAll('[data-tier]').forEach(btn => {
    const tier = +btn.dataset.tier;
    drawItemIcon(fitCanvas(btn.querySelector('canvas'), 64, 64), 64, slot.id, tier);
    btn.onclick = () => { room.draft = tier === room.draft || tier <= have ? null : tier; renderInterior(); };
  });

  const d = room.draft;
  if (!d) {
    $('roomAction').innerHTML = `<p class="sheet-note" style="flex:1">${have >= 3 ? `${slot.name} tamamlandı.` : 'Bir eşyaya dokun, odada önizle.'}</p>`;
    return;
  }
  const it = slot.items[d - 1], price = discounted(P, it.price);
  const btn = d > have + 1
    ? `<button class="btn primary" disabled>Önce: ${slot.items[have].name}</button>`
    : `<button id="rmBuy" class="btn primary" ${P.coins < price ? 'disabled' : ''}>${P.coins < price ? 'Yetersiz coin · ' : 'Satın al ve yerleştir · '}${coinIco}${price}</button>`;
  $('roomAction').innerHTML = `<button id="rmCancel" class="btn link">Vazgeç</button>${btn}`;
  $('rmCancel').onclick = () => { room.draft = null; renderInterior(); };
  if ($('rmBuy')) $('rmBuy').onclick = () => {
    if (d !== have + 1 || P.coins < price) return;
    P.coins -= price;
    P.interior[room.id] = { ...(P.interior[room.id] || {}), [slot.id]: d };
    room.draft = null;
    persist();
    sfx.reward();
    track('interior_buy', { id: room.id, slot: slot.id, tier: d, price });
    toast(`${it.name} yerleştirildi`);
    renderInterior();
  };
}

// ---------- mağaza ----------
const today = () => new Date().toDateString();
function freeCoinsLeft() {
  return P.freeCoinDay === today() ? ECON.freeCoinPerDay - P.freeCoinCount : ECON.freeCoinPerDay;
}

function renderShop() {
  const left = freeCoinsLeft();
  const item = (icon, title, sub, button) =>
    `<div class="shop-item"><div class="si-icon ${icon[0]}">${icon[1]}</div><div class="si-text"><b>${title}</b><small>${sub}</small></div>${button}</div>`;
  $('shopList').innerHTML = [
    item(['coins', ''], 'Ücretsiz coin', `Video izle, ${ECON.freeCoinAmount} coin kazan · bugün ${left}/${ECON.freeCoinPerDay}`,
      `<button id="btnFreeCoin" class="btn primary ad" ${left <= 0 ? 'disabled' : ''}>+${ECON.freeCoinAmount}</button>`),
    '<h3>İpucu</h3>',
    item(['hint', '×1'], 'İpucu', 'Sıradaki doğru hamleyi gösterir',
      `<button class="btn green" data-hints="1" data-cost="${ECON.hintCost}" ${P.coins < ECON.hintCost ? 'disabled' : ''}>${coinIco}${ECON.hintCost}</button>`),
    item(['hint', '×5'], 'İpucu paketi', `Tek tek almaktan ${ECON.hintCost * 5 - ECON.hintPack5Cost} coin ucuz`,
      `<button class="btn green" data-hints="5" data-cost="${ECON.hintPack5Cost}" ${P.coins < ECON.hintPack5Cost ? 'disabled' : ''}>${coinIco}${ECON.hintPack5Cost}</button>`),
    '<h3>Paketler</h3>',
    item(['noads', 'VIP'], 'Reklamsız ödüller', 'Ödüllü reklam izlemeden x2 ödülleri ve çarpanı doğrudan al',
      '<button class="btn secondary" data-iap="vip">$3.99</button>'),
    item(['starter', '★'], 'Başlangıç paketi', '1000 coin + 5 ipucu + taç',
      '<button class="btn secondary" data-iap="starter">$1.99</button>'),
  ].join('');

  $('btnFreeCoin').onclick = async () => {
    if (freeCoinsLeft() <= 0) return;
    if (!(await showRewarded('shop_free_coins'))) return;
    if (P.freeCoinDay !== today()) { P.freeCoinDay = today(); P.freeCoinCount = 0; }
    P.freeCoinCount++;
    P.coins += ECON.freeCoinAmount;
    persist();
    sfx.coin();
    toast(`+${ECON.freeCoinAmount} coin`);
    renderShop();
  };
  $('shopList').querySelectorAll('[data-hints]').forEach(b => {
    b.onclick = () => {
      const cost = +b.dataset.cost, n = +b.dataset.hints;
      if (P.coins < cost) return;
      P.coins -= cost;
      P.hints += n;
      persist();
      track('shop_purchase', { item: `hint_${n}`, cost });
      sfx.coin();
      toast(`+${n} ipucu · toplam ${P.hints}`);
      renderShop();
    };
  });
  $('shopList').querySelectorAll('[data-iap]').forEach(b => {
    b.onclick = () => { track('iap_click', { item: b.dataset.iap }); toast('Mağaza satın alımları yakında açılacak'); };
  });
}

// ---------- günlük ödül ve günlük bulmaca ----------
function dailyRewardState() {
  const claimedToday = P.dailyRewardDay === dateKey();
  const day = claimedToday ? P.dailyRewardIdx : P.dailyRewardDay === yesterdayKey() ? (P.dailyRewardIdx % 7) + 1 : 1;
  return { claimedToday, day };
}

function dailyPuzzleState() {
  const done = P.dailyPuzzleDay === dateKey();
  const alive = done || P.dailyPuzzleDay === yesterdayKey();
  return { unlocked: P.level > DAILY_PUZZLE.unlockLevel, done, streak: alive ? P.dailyPuzzleStreak : 0 };
}

const dailyPuzzleCoins = streak => DAILY_PUZZLE.coins + (Math.min(Math.max(streak, 1), 7) - 1) * DAILY_PUZZLE.streakBonus;

function rewardHtml(r, mult = 1) {
  return [
    r.coins && `<span class="rw">${coinIco}${r.coins * mult}</span>`,
    r.hints && `<span class="rw">${hintIco}${r.hints * mult}</span>`,
    r.flakes && `<span class="rw">${flakeIco}${r.flakes * mult}</span>`,
  ].filter(Boolean).join('');
}

function showDailyReward() {
  const st = dailyRewardState();
  const cells = DAILY_REWARDS.map((r, i) => {
    const d = i + 1;
    const cls = d < st.day || (d === st.day && st.claimedToday) ? ' done' : d === st.day ? ' today' : '';
    return `<div class="dcell${cls}${d === 7 ? ' big' : ''}"><b>Gün ${d}</b>${rewardHtml(r)}</div>`;
  }).join('');
  const r = DAILY_REWARDS[st.day - 1];
  const treePct = buff(P, 'dailyPct'); // çam ağacı coin'leri artırır
  openOverlay(`
    <span class="new-tag">GÜNLÜK ÖDÜL</span>
    <h2>${st.claimedToday ? 'Yarın yine gel!' : `Gün ${st.day}`}</h2>
    <p>${st.claimedToday ? `Yarın Gün ${(st.day % 7) + 1} ödülü seni bekliyor.` : 'Her gün gel, ödüller büyüsün. Bir gün kaçırırsan seri baştan başlar.'}</p>
    <div class="daily-grid">${cells}</div>
    ${treePct && !st.claimedToday ? `<small class="breakdown">Çam ağacı: coin ödülü +%${Math.round(treePct * 100)}</small>` : ''}
    ${st.claimedToday
      ? '<button id="drClose" class="btn green big">Tamam</button>'
      : '<button id="drAd" class="btn primary big ad">x2 al</button><button id="drTake" class="btn link">Sadece al</button>'}`);
  if (st.claimedToday) { $('drClose').onclick = closeOverlay; return; }
  const take = mult => {
    P.coins += Math.round((r.coins || 0) * (1 + treePct)) * mult;
    P.hints += (r.hints || 0) * mult;
    P.flakes += (r.flakes || 0) * mult;
    P.dailyRewardDay = dateKey();
    P.dailyRewardIdx = st.day;
    persist();
    sfx.reward();
    track('daily_reward_claim', { day: st.day, mult });
    closeOverlay();
    toast(`Gün ${st.day} ödülü alındı${mult > 1 ? ' · x2' : ''}`);
  };
  $('drAd').onclick = async () => take((await showRewarded('daily_reward_x2')) ? 2 : 1);
  $('drTake').onclick = () => take(1);
}

function renderDailyButtons() {
  const dr = dailyRewardState();
  $('dotDaily').classList.toggle('hidden', dr.claimedToday);
  $('dailySub').textContent = dr.claimedToday ? `Yarın: Gün ${(dr.day % 7) + 1}` : `Gün ${dr.day} hazır!`;
  const dp = dailyPuzzleState();
  $('btnDailyPuzzle').classList.toggle('muted-q', !dp.unlocked || dp.done);
  $('dotDailyPuzzle').classList.toggle('hidden', !dp.unlocked || dp.done);
  $('dpSub').textContent = !dp.unlocked ? `Level ${DAILY_PUZZLE.unlockLevel}'ten sonra`
    : dp.done ? `Tamam · seri ${dp.streak}`
    : `Seri ${dp.streak} · +${dailyPuzzleCoins(dp.streak + 1)}`;
}

// ---------- ayarlar ----------
function renderSettings() {
  $('setName').value = P.profile?.name || '';
  $('setHaptics').checked = !!P.settings.haptics;
  $('setSfx').checked = P.settings.sfx !== false;
  $('setAmbient').checked = P.settings.ambient !== false;
  $('setArt').checked = P.settings.art !== false;
  $('setAccount').textContent = { guest: 'Misafir', google: 'Google', apple: 'Apple' }[P.profile?.method] || 'Misafir';
}
$('setName').onchange = () => {
  const name = $('setName').value.trim().slice(0, 16);
  if (!name || !P.profile) { renderSettings(); return; }
  P.profile.name = name;
  persist();
  toast('Adın güncellendi');
};
$('setHaptics').onchange = () => {
  P.settings.haptics = $('setHaptics').checked;
  persist();
  if (P.settings.haptics) navigator.vibrate?.(20);
};
$('setSfx').onchange = () => { P.settings.sfx = $('setSfx').checked; persist(); applySoundSettings(); sfx.ui(); };
$('setArt').onchange = () => { P.settings.art = $('setArt').checked; persist(); setArtEnabled(P.settings.art); };
$('setAmbient').onchange = () => { P.settings.ambient = $('setAmbient').checked; persist(); applySoundSettings(); };
$('btnReplayIntro').onclick = runIntro;
$('btnReset').onclick = () => {
  openOverlay(`<h2>Emin misin?</h2><p>Leveller, coinler, köy ve gardırop silinir. Bu geri alınamaz.</p>
    <button id="rsYes" class="btn primary big" style="background:#e5484d;box-shadow:0 5px 0 #b3363a">Evet, sıfırla</button>
    <button id="rsNo" class="btn link">Vazgeç</button>`);
  $('rsYes').onclick = () => { resetSave(); location.reload(); };
  $('rsNo').onclick = closeOverlay;
};

// ---------- haftalık etkinlik ----------
function renderEventCard() {
  const ev = ensureEvent(P), next = nextMilestone(P), ready = claimable(P).length;
  const pct = next ? P.event.points / next.pts : 1;
  const card = $('eventCard');
  card.style.setProperty('--ev', ev.color);
  card.innerHTML = `<canvas></canvas><span class="ev-text"><b>${ev.name}</b>`
    + `<span class="ev-bar"><div style="width:${Math.min(100, pct * 100)}%"></div></span>`
    + `<small>${P.event.points} puan · ${next ? `sonraki ödül ${next.pts}` : 'bütün ödüller açıldı'} · ${timeLeft(ev.ends)}</small></span>`
    + (ready ? '<i class="dot"></i>' : '');
  const prize = prizeOf(ev);
  drawPofi(fitCanvas(card.querySelector('canvas'), 40, 40), 20, 39, 30, { outfit: { [prize.slot]: prize.id } });
}

function showEvent() {
  const ev = ensureEvent(P), prize = prizeOf(ev);
  const steps = EVENT_TRACK.map((m, i) => {
    const done = P.event.claimed.includes(i), ready = !done && P.event.points >= m.pts;
    const rw = m.r.prize ? `<b>${prize.name}</b>&nbsp;<small>özel kıyafet</small>` : rewardHtml(m.r);
    const act = ready ? `<button class="btn green" data-ev="${i}">Al</button>` : done ? '<span class="check">✓</span>' : '';
    return `<div class="ev-step${done ? ' done' : ready ? ' ready' : ''}"><span class="pts">${m.pts}</span><span class="rw">${rw}</span>${act}</div>`;
  }).join('');
  openOverlay(`
    <span class="new-tag" style="background:${ev.color}">HAFTALIK ETKİNLİK</span>
    <h2>${ev.name}</h2>
    <canvas class="intro-icon" id="evPrize"></canvas>
    <p>${ev.text}</p>
    <small class="breakdown">${P.event.points} puan · bitmesine ${timeLeft(ev.ends)} · her level en az ${EVENT_POINTS.level} puan, yıldız başına +${EVENT_POINTS.star}</small>
    <div class="ev-track">${steps}</div>
    <button id="evClose" class="btn link">Kapat</button>`);
  drawPofi(fitCanvas($('evPrize'), 84, 84), 42, 82, 64, { outfit: { ...P.outfit, [prize.slot]: prize.id } });
  $('evClose').onclick = closeOverlay;
  $('overlayCard').querySelectorAll('[data-ev]').forEach(btn => {
    btn.onclick = () => {
      const i = +btn.dataset.ev, r = EVENT_TRACK[i].r;
      if (P.event.claimed.includes(i) || P.event.points < EVENT_TRACK[i].pts) return;
      P.coins += r.coins || 0;
      P.hints += r.hints || 0;
      P.flakes += r.flakes || 0;
      if (r.prize && !P.owned[prize.slot].includes(prize.id)) P.owned[prize.slot].push(prize.id);
      P.event.claimed.push(i);
      persist();
      sfx.reward();
      track('event_claim', { event: ev.id, step: i });
      toast(r.prize ? `${prize.name} gardırobuna eklendi!` : 'Ödül alındı');
      showEvent();
    };
  });
}

// ---------- köy paylaşımı ve arkadaş köyü ziyareti ----------
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let visit = null; // { name, village, outfit } — yalnızca görüntülenir
let pendingVisit = extractCode(location.hash.includes('ziyaret=') ? location.hash : '') || null;

function shareVillage() {
  const url = `${location.origin}${location.pathname}#ziyaret=${encodeVillage(P)}`;
  openOverlay(`
    <span class="new-tag">KÖYÜNÜ PAYLAŞ</span>
    <h2>Köyünü göster!</h2>
    <p>Bu bağlantıyı açan arkadaşın köyünü yapıları, stilleri ve Pofi'nin kıyafetiyle görür. Coin ve ilerleme paylaşılmaz.</p>
    <textarea class="code-box" rows="3" readonly>${url}</textarea>
    <button id="shNative" class="btn primary big">${navigator.share ? 'Paylaş' : 'Bağlantıyı kopyala'}</button>
    <button id="shClose" class="btn link">Kapat</button>`);
  $('overlayCard').querySelector('textarea').onclick = e => e.target.select();
  $('shClose').onclick = closeOverlay;
  $('shNative').onclick = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'Pofi köyüm', text: 'Pofi köyümü ziyaret et!', url });
      else { await navigator.clipboard.writeText(url); toast('Bağlantı kopyalandı'); }
      track('village_share');
    } catch { /* paylaşım iptal edildi veya pano izni yok; bağlantı kutuda duruyor */ }
  };
}

function askVisit() {
  openOverlay(`
    <h2>Arkadaş köyü</h2>
    <p>Arkadaşının paylaştığı bağlantıyı yapıştır. Günde ${VISIT_GIFT.perDay} farklı köyden +${VISIT_GIFT.coins} coin ziyaret hediyesi alırsın.</p>
    <textarea id="visitInput" class="code-box" rows="3" placeholder="https://…#ziyaret=…"></textarea>
    <button id="vGo" class="btn green big">Ziyaret et</button>
    <button id="vClose" class="btn link">Vazgeç</button>`);
  $('vClose').onclick = closeOverlay;
  $('vGo').onclick = () => { const code = extractCode($('visitInput').value); closeOverlay(); openVisit(code); };
}

function openVisit(code) {
  const v = decodeVillage(code);
  if (!v) { toast('Bağlantı okunamadı'); return; }
  visit = v;
  showScreen('visit');
  visitView.resize();
  const vl = villageLevel({ village: v.village });
  const built = Object.keys(v.village).length;
  const levels = Object.values(v.village).reduce((s, b) => s + b.lv, 0);
  let gift = '';
  if (code !== encodeVillage(P)) {
    if (P.visits.day !== dateKey()) P.visits = { day: dateKey(), seen: [] };
    const id = code.slice(0, 64);
    if (!P.visits.seen.includes(id) && P.visits.seen.length < VISIT_GIFT.perDay) {
      P.visits.seen.push(id);
      P.coins += VISIT_GIFT.coins;
      persist();
      sfx.coin();
      gift = `Ziyaret hediyesi: +${VISIT_GIFT.coins} coin`;
    }
  } else gift = 'Bu senin köyün 🙂';
  $('visitTag').textContent = `${v.name} · Köy Lv${vl}`;
  $('visitInfo').innerHTML = `
    <div class="vl-top"><span class="vl-num">${vl}</span><div><b>${esc(v.name)} adlı oyuncunun köyü</b><small>${built} yapı · toplam ${levels} yapı seviyesi</small></div></div>
    ${gift ? `<small>${esc(gift)}</small>` : ''}`;
  track('village_visit', { level: vl });
}

function leaveVisit() {
  visit = null;
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  showScreen('village');
}

window.addEventListener('hashchange', () => {
  const code = location.hash.includes('ziyaret=') ? extractCode(location.hash) : null;
  if (code && !['splash', 'login', 'intro'].includes(screen)) openVisit(code);
});

// ---------- bağlantılar ----------
$('btnPlay').onclick = () => startLevel(P.level);
$('nextCard').onclick = () => showScreen('village');
$('btnDaily').onclick = showDailyReward;
$('btnDailyPuzzle').onclick = () => {
  const st = dailyPuzzleState();
  if (!st.unlocked) toast(`Günlük bulmaca Level ${DAILY_PUZZLE.unlockLevel}'ten sonra açılır`);
  else if (st.done) toast('Bugünkü bulmacayı çözdün, yarın yenisi gelecek');
  else startLevel(0, true);
};
document.querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => showScreen(b.dataset.tab); });
$('btnBack').onclick = () => {
  closeOverlay();
  if (screen === 'visit') { leaveVisit(); return; }
  if (screen === 'interior') { room = null; showScreen('village'); return; }
  run = null;
  showScreen('home');
};
$('btnUndo').onclick = undo;
$('btnRestart').onclick = () => { if (run && !overlayOpen()) startLevel(run.def.n, run.daily); };
$('btnHint').onclick = useHint;
$('btnCocoa').onclick = () => sellCocoa(1);
$('btnRecipes').onclick = showRecipes;
$('eventCard').onclick = showEvent;
$('btnShare').onclick = shareVillage;
$('btnVisit').onclick = askVisit;
$('btnVisitBack').onclick = leaveVisit;
$('btnCocoa2').onclick = async () => { if (await showRewarded('cocoa_x2')) sellCocoa(2); };
window.addEventListener('keydown', e => {
  if (screen === 'game' && (e.code === 'KeyZ' || e.code === 'Backspace')) { e.preventDefault(); undo(); }
});

let last = performance.now(), slowTick = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = now / 1000;
  if (screen === 'game' && run) { board.update(dt); board.draw(t); }
  else if (screen === 'village') {
    const open = BUILDINGS.filter(b => isUnlocked(P, b) && !P.village[b.id]);
    village.draw(t, dt, {
      village: P.village, vl: villageLevel(P), outfit: P.outfit, colors: COLORS,
      plots: open.map(b => b.id), ready: open.filter(b => P.flakes >= b.costs[0]).map(b => b.id),
      upgradable: BUILDINGS.filter(b => P.village[b.id] && nextCost(P, b) !== null && P.flakes >= nextCost(P, b)).map(b => b.id),
      cocoa: { cups: Math.floor(cocoaNow()), cap: cocoaCap() }, land: P.land || 1, homeReady: homesReady(),
      villagers: villagersHere(), hour: hourNow(), task: taskMarker(), decor: P.decor,
    });
    if ((slowTick += dt) > 1) { slowTick = 0; renderCocoa(); }
    if (village.panel !== shownPanel) renderZoneTag();
  } else if (screen === 'visit' && visit) {
    visitView.draw(t, dt, { village: visit.village, vl: villageLevel({ village: visit.village }), outfit: visit.outfit, colors: COLORS, plots: [], ready: [], land: landOf(visit.village), teaser: false });
  } else if (screen === 'home') {
    const ctx = fitCanvas($('homePofi'), 120, 120);
    drawPofi(ctx, 60, 117, 94, { outfit: P.outfit, wave: Math.max(0, Math.sin(t * 2.2)) * 0.6, blink: (t % 3.4) < 0.12 });
  } else if (screen === 'interior' && room) {
    const r = $('roomCanvas').getBoundingClientRect();
    if (r.width) {
      // Önizlenen kademe odada gerçekmiş gibi görünür; satın alınmadan kaydedilmez.
      const items = { ...(P.interior[room.id] || {}) };
      if (room.draft) items[room.slot] = room.draft;
      drawRoom(fitCanvas($('roomCanvas'), r.width, r.height), r.width, r.height, t, { items, highlight: room.slot, highlightTier: items[room.slot] || 0, outfit: P.outfit });
    }
  } else if (screen === 'wardrobe') {
    const r = $('wardrobePofi').getBoundingClientRect();
    if (r.width) {
      const ctx = fitCanvas($('wardrobePofi'), r.width, r.height);
      // Denenen (henüz alınmamış) parça burada görünür: önce dene, sonra satın al.
      drawPofi(ctx, r.width / 2, r.height - 12, r.height * 0.8, { outfit: previewOutfit(), wave: Math.max(0, Math.sin(t * 2.2)) * 0.6, blink: (t % 3.4) < 0.12 });
    }
  }
  requestAnimationFrame(frame);
}

updateWallet();
requestAnimationFrame(frame);
boot();
