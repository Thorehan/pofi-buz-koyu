import { parseLevel, simulate, solve, won, generateLevel, starsFor, T } from './engine.js';
import { BoardView, paintTile } from './board.js';
import { VillageView, cocoaRatePerHour } from './village.js';
import { drawPofi, drawFish } from './draw.js';
import { load, save, resetSave } from './save.js';
import { showRewarded, maybeInterstitial, track } from './ads.js';
import { ECON, ADS, TIER_LABEL, MULT_ZONES, INTRO, DAILY_REWARDS, DAILY_PUZZLE, VILLAGE, WARDROBE } from './config.js';
import { sfx, unlock, configure as configureSound, setAmbient } from './sound.js';

const $ = id => document.getElementById(id);
const P = load(); // oyuncu kaydı
let LEVELS = []; // data/levels.json — sonrası çalışma anında üretilir

const board = new BoardView($('board'));
const village = new VillageView($('village'));
board.outfit = P.outfit;

const applySoundSettings = () => configureSound({ sfx: P.settings.sfx !== false, ambient: P.settings.ambient !== false });
applySoundSettings();
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
  $('dotVillage').classList.toggle('hidden', !canAffordNext());
  $('dotShop').classList.toggle('hidden', freeCoinsLeft() <= 0);
  renderNextCard();
  renderDailyButtons();
}

const nextBuilding = () => VILLAGE.buildings.find(b => P.village[b.id] === undefined);
const canAffordNext = () => { const b = nextBuilding(); return !!b && P.flakes >= b.cost; };

const SCREENS = ['splash', 'login', 'intro', 'home', 'game', 'village', 'wardrobe', 'shop', 'settings'];
const TAB_SCREENS = ['home', 'village', 'wardrobe', 'shop', 'settings'];

function showScreen(name) {
  screen = name;
  for (const s of SCREENS) $('screen' + s[0].toUpperCase() + s.slice(1)).classList.toggle('hidden', s !== name);
  $('app').dataset.screen = name;
  board.active = name === 'game';
  setAmbient(name === 'game' || name === 'village');
  $('btnBack').classList.toggle('hidden', name !== 'game');
  $('tabbar').classList.toggle('hidden', !TAB_SCREENS.includes(name));
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  if (name === 'village') { village.resize(); renderVillage(); }
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
  run = { def, L, st: S, history: [], moves: 0, limit: def.limit, finished: false, daily: !!daily, stuck: false, fishSound: 0 };
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
  const tile = { snow: T.SNOW, water: T.WATER, crack: T.CRACK, lever: T.LEVER, arrow: T.RIGHT }[kind] ?? T.ICE;
  paintTile(ctx, tile, 0, 0, 84, 0, {});
  if (kind === 'fish' || kind === 'crate') paintTile(ctx, kind, 0, 0, 84, 0, {});
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
  $('hintCount').textContent = P.hints > 0 ? P.hints : '+';
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
  board.play(r, run.history[run.history.length - 1]);
  sfx.slide(r.pPath.length - 1);
  if (P.settings.haptics) navigator.vibrate?.(10);
  renderHud();
};

board.onFx = f => {
  if (f.k === 'fish') { sfx.fish(run.fishSound++); renderGoal(); }
  else if (f.k === 'crack') sfx.crack();
  else if (f.k === 'sink') sfx.splash();
  else if (f.k === 'lever') sfx.lever();
  else if (f.k === 'push') sfx.crate();
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
  let base;
  if (run.daily) {
    P.dailyPuzzleStreak = (P.dailyPuzzleDay === yesterdayKey() ? P.dailyPuzzleStreak : 0) + 1;
    P.dailyPuzzleDay = run.def.daily;
    base = dailyPuzzleCoins(P.dailyPuzzleStreak);
    track('daily_puzzle_complete', { streak: P.dailyPuzzleStreak, moves: run.moves });
  } else {
    base = ECON.coin[run.def.tier] + stars * ECON.coinPerStar;
    P.stars[run.def.n] = Math.max(P.stars[run.def.n] || 0, stars);
    P.level = Math.max(P.level, run.def.n + 1);
    track('level_complete', { level: run.def.n, moves: run.moves, min: run.def.min, stars });
  }
  P.flakes += 1;
  persist();
  setTimeout(() => {
    board.burst(run.st.p, '#ffd166', 24, board.s * 5, 1, board.s * 4);
    board.burst(run.st.p, '#8fd0ff', 24, board.s * 5, 1, board.s * 4);
    sfx.win();
  }, 150);
  setTimeout(() => showResult(stars, base), 1100);
}

function multAt(pos) {
  let acc = 0;
  for (const z of MULT_ZONES) { acc += z.w / 100; if (pos <= acc) return z.m; }
  return MULT_ZONES[MULT_ZONES.length - 1].m;
}

function showResult(stars, base) {
  const head = run.daily
    ? `<span class="new-tag">GÜNLÜK BULMACA · SERİ ${P.dailyPuzzleStreak}</span><h2>Bugünkü tamam!</h2>`
    : `<h2>${stars === 3 ? 'Kusursuz!' : 'Harika!'}</h2>`;
  openOverlay(`
    ${head}
    <div class="stars">${[1, 2, 3].map(k => `<span class="star${k <= stars ? ' on' : ''}">★</span>`).join('')}</div>
    <p>${run.moves} hamle · en iyi çözüm ${run.def.min}</p>
    <div class="reward-row">
      <span class="pill big">${coinIco}<b id="rwCoins">${base}</b></span>
      <span class="pill big">${flakeIco}<b>+1</b></span>
    </div>
    <div id="claimArea">
      <div class="mult">
        <div class="mult-zones">${MULT_ZONES.map(z => `<div class="z z${z.m}" style="flex:${z.w}">x${z.m}</div>`).join('')}</div>
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
    const m = multAt(pos);
    $('multLabel').textContent = `x${m} Al · ${base * m}`;
    requestAnimationFrame(tick);
  })(t0);
  const noThanksTimer = setTimeout(() => $('btnNoThanks')?.classList.remove('invisible'), ADS.noThanksDelayMs);

  const claim = total => {
    P.coins += total;
    persist();
    sfx.coin();
    countUp($('rwCoins'), base, total);
    const villageBtn = canAffordNext() ? '<button id="toVillage" class="btn secondary">Köye git<span class="dot"></span></button>' : '';
    $('claimArea').innerHTML = `<div style="display:flex;flex-direction:column;gap:12px"><button id="toNext" class="btn green big">Devam</button>${villageBtn}</div>`;
    const leave = async then => {
      closeOverlay();
      await maybeInterstitial(P, run.def.n);
      save(P);
      then();
    };
    $('toNext').onclick = () => leave(() => (run.daily ? showScreen('home') : startLevel(P.level)));
    if (villageBtn) $('toVillage').onclick = () => leave(() => showScreen('village'));
  };

  $('btnMult').onclick = async () => {
    running = false;
    clearTimeout(noThanksTimer);
    const m = multAt(pos);
    $('btnMult').disabled = true;
    $('btnNoThanks').disabled = true;
    const ok = await showRewarded('level_end_multiplier');
    track('multiplier_result', { mult: m, watched: ok });
    if (ok) { P.skipNextInter = true; sfx.reward(); }
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
  openOverlay(`
    <h2>Hamlen bitti!</h2>
    <p>Çok yaklaştın: ${popcount(run.st.fish)}/${run.L.fishCells.length} balık toplandı.</p>
    <button id="fAd" class="btn primary big ad">+${ECON.continueMoves} hamle</button>
    <button id="fCoin" class="btn secondary">+${ECON.continueMoves} hamle · ${ECON.continueCost} coin</button>
    <button id="fRetry" class="btn link">Baştan başla</button>`);
  $('fCoin').disabled = P.coins < ECON.continueCost;
  const resume = () => { run.limit += ECON.continueMoves; run.finished = false; closeOverlay(); renderHud(); };
  $('fAd').onclick = async () => { if (await showRewarded('continue')) resume(); };
  $('fCoin').onclick = () => { P.coins -= ECON.continueCost; persist(); resume(); };
  $('fRetry').onclick = () => { closeOverlay(); startLevel(run.def.n, run.daily); };
}

function useHint() {
  if (!run || run.finished || board.anim) return;
  const sol = solve(run.L, run.st, 150000);
  if (!sol) { toast('Bu durumdan çıkış yok. Önce geri al.'); return; }
  if (P.hints > 0) {
    P.hints--;
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
function cocoaNow() {
  const rate = cocoaRatePerHour(P.village);
  if (!rate) return 0;
  const hours = (Date.now() - P.cocoaTs) / 3.6e6;
  return Math.min(P.cocoaBank + rate * hours, rate * ECON.cocoaCapHours);
}
function bankCocoa() { P.cocoaBank = cocoaNow(); P.cocoaTs = Date.now(); }

function renderCocoa() {
  const rate = cocoaRatePerHour(P.village);
  const amt = Math.floor(cocoaNow());
  $('cocoaAmt').textContent = amt;
  $('cocoaRate').textContent = rate ? `saatte ${rate} coin · en fazla ${ECON.cocoaCapHours} saat birikir` : 'Kakao standını kurunca köy coin üretir';
  $('btnCocoa').disabled = amt < 1;
  $('btnCocoa2').disabled = amt < 1;
  $('btnCocoa2').textContent = `x2 · ${amt * 2}`;
}

function collectCocoa(mult) {
  const amt = Math.floor(cocoaNow());
  if (amt < 1) return;
  P.coins += amt * mult;
  P.cocoaBank = 0;
  P.cocoaTs = Date.now();
  persist();
  sfx.coin();
  toast(`+${amt * mult} coin kakao satışından`);
  renderCocoa();
}

function renderVillage() {
  const next = nextBuilding();
  const built = Object.keys(P.village).length;
  $('zoneName').textContent = VILLAGE.name;
  $('zoneBar').style.width = (built / VILLAGE.buildings.length) * 100 + '%';
  $('buildList').innerHTML = VILLAGE.buildings.map(b => {
    if (P.village[b.id] !== undefined) {
      return `<li class="task"><span><b>${b.name}</b><small>Stil: ${b.styles[P.village[b.id]]}</small></span><button class="btn secondary" data-style="${b.id}">Düzenle</button></li>`;
    }
    if (b !== next) return `<li class="task locked"><span>${b.name}</span><span class="pill">${flakeIco}${b.cost}</span></li>`;
    return `<li class="task"><span><b>${b.name}</b><small>Sıradaki yapı</small></span><button class="btn green" data-build="${b.id}" ${P.flakes < b.cost ? 'disabled' : ''}>Kur ${flakeIco}${b.cost}</button></li>`;
  }).join('');
  $('buildList').querySelectorAll('[data-build]').forEach(btn => { btn.onclick = () => build(btn.dataset.build); });
  $('buildList').querySelectorAll('[data-style]').forEach(btn => { btn.onclick = () => openStylePicker(btn.dataset.style); });
  renderCocoa();
}

function build(id) {
  const b = VILLAGE.buildings.find(x => x.id === id);
  if (P.flakes < b.cost) { toast('Yeterli kar tanen yok, level oynayarak kazan'); return; }
  bankCocoa();
  P.flakes -= b.cost;
  P.village[id] = 0;
  P.styles[id] = [0];
  persist();
  track('village_build', { building: id });
  village.sparkle(id);
  sfx.task();
  renderVillage();
  setTimeout(() => openStylePicker(id, true), 700);
  if (!nextBuilding() && !P.zoneRewardClaimed) setTimeout(zoneComplete, 900);
}

function openStylePicker(id, fresh = false) {
  const b = VILLAGE.buildings.find(x => x.id === id);
  const owned = P.styles[id] || [0];
  openOverlay(`
    ${fresh ? '<span class="new-tag">KURULDU</span>' : ''}
    <h2>${b.name}</h2>
    <p>Bir stil seç. Açtığın stiller arasında istediğin zaman ücretsiz geçiş yapabilirsin.</p>
    <div class="style-list">${b.styles.map((name, i) => {
      const on = P.village[id] === i;
      const tag = on ? 'Seçili ✓' : owned.includes(i) ? 'Seç' : `${coinIco}${b.stylePrice}`;
      return `<button class="style-opt${on ? ' on' : ''}" data-i="${i}"><span>${name}</span><span class="tag">${tag}</span></button>`;
    }).join('')}</div>
    <button id="spClose" class="btn green big">Tamam</button>`);
  $('overlayCard').querySelectorAll('[data-i]').forEach(btn => {
    btn.onclick = () => {
      const i = +btn.dataset.i;
      if (!owned.includes(i)) {
        if (P.coins < b.stylePrice) { toast('Yeterli coin yok'); return; }
        P.coins -= b.stylePrice;
        owned.push(i);
        P.styles[id] = owned;
        sfx.coin();
        track('style_unlock', { building: id, style: i });
      }
      P.village[id] = i;
      persist();
      village.sparkle(id);
      openStylePicker(id);
      renderVillage();
    };
  });
  $('spClose').onclick = closeOverlay;
}

function zoneComplete() {
  openOverlay(`
    <span class="new-tag">BÖLGE TAMAMLANDI</span>
    <h2>Buzul Koyu hazır!</h2>
    <p>Pofi'nin köyü canlandı. Sıradaki bölge "Kuzey Işıkları" yakında açılacak.</p>
    <div class="reward-row"><span class="pill big">${coinIco}<b>${VILLAGE.reward}</b></span></div>
    <button id="zAd" class="btn primary big ad">x2 · ${VILLAGE.reward * 2}</button>
    <button id="zTake" class="btn link">${VILLAGE.reward} coin al</button>`);
  const take = total => { P.coins += total; P.zoneRewardClaimed = true; persist(); sfx.reward(); closeOverlay(); toast(`+${total} coin`); };
  $('zAd').onclick = async () => take((await showRewarded('zone_reward')) ? VILLAGE.reward * 2 : VILLAGE.reward);
  $('zTake').onclick = () => take(VILLAGE.reward);
}

function renderNextCard() {
  const b = nextBuilding();
  const card = $('nextCard');
  if (!b) {
    card.innerHTML = `${flakeIco}<span class="nc-text"><b>Buzul Koyu tamamlandı!</b><small>Sıradaki bölge yakında</small></span>`;
    return;
  }
  const missing = b.cost - P.flakes;
  card.innerHTML = `${flakeIco}<span class="nc-text"><small>Köyde sıradaki yapı</small><b>${b.name}</b></span>`
    + `<span class="nc-go">${missing > 0 ? `${missing} kar tanesi daha` : 'Hazır ›'}</span>`;
}

// ---------- gardırop ----------
let wardrobeCat = 'hat';

function renderWardrobe() {
  document.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === wardrobeCat));
  const items = WARDROBE[wardrobeCat];
  const owned = P.owned[wardrobeCat];
  $('wardrobeList').innerHTML = items.map(it => {
    const on = P.outfit[wardrobeCat] === it.id, have = owned.includes(it.id);
    const label = on ? 'Giyili' : have ? 'Giy' : `${coinIco}${it.price}`;
    return `<button class="w-item${on ? ' on' : ''}${have ? '' : ' locked'}" data-w="${it.id}"><canvas></canvas><span>${it.name}</span><span class="price">${label}</span></button>`;
  }).join('');
  $('wardrobeList').querySelectorAll('[data-w]').forEach(btn => {
    const id = btn.dataset.w;
    const ctx = fitCanvas(btn.querySelector('canvas'), 64, 64);
    drawPofi(ctx, 32, 62, 50, { outfit: { ...P.outfit, [wardrobeCat]: id } });
    btn.onclick = () => {
      const it = items.find(x => x.id === id);
      if (!owned.includes(id)) {
        if (P.coins < it.price) { toast('Yeterli coin yok'); return; }
        P.coins -= it.price;
        owned.push(id);
        sfx.coin();
        track('wardrobe_buy', { slot: wardrobeCat, item: id, price: it.price });
      }
      P.outfit = { ...P.outfit, [wardrobeCat]: id };
      board.outfit = P.outfit;
      persist();
      renderWardrobe();
    };
  });
}
document.querySelectorAll('.seg-btn').forEach(b => { b.onclick = () => { wardrobeCat = b.dataset.cat; renderWardrobe(); }; });

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
    item(['noads', 'AD'], 'Reklamsız', 'Ara reklamlar kalkar, ödüllü videolar isteğe bağlı kalır',
      '<button class="btn secondary" data-iap="noads">$3.99</button>'),
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
  openOverlay(`
    <span class="new-tag">GÜNLÜK ÖDÜL</span>
    <h2>${st.claimedToday ? 'Yarın yine gel!' : `Gün ${st.day}`}</h2>
    <p>${st.claimedToday ? `Yarın Gün ${(st.day % 7) + 1} ödülü seni bekliyor.` : 'Her gün gel, ödüller büyüsün. Bir gün kaçırırsan seri baştan başlar.'}</p>
    <div class="daily-grid">${cells}</div>
    ${st.claimedToday
      ? '<button id="drClose" class="btn green big">Tamam</button>'
      : '<button id="drAd" class="btn primary big ad">x2 al</button><button id="drTake" class="btn link">Sadece al</button>'}`);
  if (st.claimedToday) { $('drClose').onclick = closeOverlay; return; }
  const take = mult => {
    P.coins += (r.coins || 0) * mult;
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
$('setAmbient').onchange = () => { P.settings.ambient = $('setAmbient').checked; persist(); applySoundSettings(); };
$('btnReplayIntro').onclick = runIntro;
$('btnReset').onclick = () => {
  openOverlay(`<h2>Emin misin?</h2><p>Leveller, coinler, köy ve gardırop silinir. Bu geri alınamaz.</p>
    <button id="rsYes" class="btn primary big" style="background:#e5484d;box-shadow:0 5px 0 #b3363a">Evet, sıfırla</button>
    <button id="rsNo" class="btn link">Vazgeç</button>`);
  $('rsYes').onclick = () => { resetSave(); location.reload(); };
  $('rsNo').onclick = closeOverlay;
};

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
$('btnBack').onclick = () => { closeOverlay(); run = null; showScreen('home'); };
$('btnUndo').onclick = undo;
$('btnRestart').onclick = () => { if (run && !overlayOpen()) startLevel(run.def.n, run.daily); };
$('btnHint').onclick = useHint;
$('btnCocoa').onclick = () => collectCocoa(1);
$('btnCocoa2').onclick = async () => { if (await showRewarded('cocoa_x2')) collectCocoa(2); };
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
    village.draw(t, dt, P.village, P.outfit);
    if ((slowTick += dt) > 1) { slowTick = 0; renderCocoa(); }
  } else if (screen === 'home') {
    const ctx = fitCanvas($('homePofi'), 150, 150);
    drawPofi(ctx, 75, 146, 118, { outfit: P.outfit, wave: Math.max(0, Math.sin(t * 2.2)) * 0.6, blink: (t % 3.4) < 0.12 });
  } else if (screen === 'wardrobe') {
    const r = $('wardrobePofi').getBoundingClientRect();
    if (r.width) {
      const ctx = fitCanvas($('wardrobePofi'), r.width, r.height);
      drawPofi(ctx, r.width / 2, r.height - 12, r.height * 0.8, { outfit: P.outfit, wave: Math.max(0, Math.sin(t * 2.2)) * 0.6, blink: (t % 3.4) < 0.12 });
    }
  }
  requestAnimationFrame(frame);
}

updateWallet();
requestAnimationFrame(frame);
boot();
