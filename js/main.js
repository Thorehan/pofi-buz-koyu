import { clockShift, setDev, shiftText } from './clock.js'; // önce yüklenir: test saati kayması varsa bütün modüller onu görür
import { setErrContext, errList, errText, clearErrors, logError } from './errlog.js'; // önce yüklenir: açılış hataları da yakalanır
import { parseLevel, simulate, solve, won, generateLevel, starsFor, T, tileOf } from './engine.js';
import { BoardView, paintTile } from './board.js';
import { VillageView, phaseOf, drawDecor } from './village.js';
import {
  ensureEvent, levelTokens, addTokens, BONUS_TEXT, eventLevelDef, timeLeft, claimable, nextMilestone, prizeOf,
  encodeVillage, decodeVillage, extractCode, currentEvent,
} from './live.js';
import {
  tradeN, flakePrice, merchantToday, nextMerchant, merchantWeek, dayName, merchantStock, MERCHANT_OUTFITS, MERCHANT_DECOR,
  weatherNow, petFedToday, fishToday, petUnlocked, projectSpent, projectStage, projectBonus, rareChance, gazetteIssue,
} from './town.js';
import { drawPet, drawToy } from './townart.js';
import { statAdd, statBest, statSummary, statCsv } from './stats.js';
import {
  building, bLevel, totalLevels, villageLevel, nextVillageLevel, isUnlocked, maxLevel, nextCost,
  buff, villageBonusPct, coinBonusPct, discounted, canAffordAny, suggestion, zone, cupPrice, nextRecipe,
  nextDistrict, landOf, slotTier, interiorReady,
} from './meta.js';
import { drawRoom, drawItemIcon } from './interior.js';
import { drawPofi, drawFish, roundRect } from './draw.js';
import { loadArt, setArtEnabled, accentHue, onArtLoad, art } from './art.js';
import { load, save, resetSave, onSaveFail, loadInfo } from './save.js';
import { backupEncode, backupDecode } from './backup.js';
import { ek } from './tr.js';
import { watchUpdates } from './update.js';
import { showRewarded, track } from './ads.js';
import {
  ECON, ADS, TIER_LABEL, MULT_ZONES, INTRO, DAILY_REWARDS, DAILY_PUZZLE, WARDROBE, EVENT_TRACK, EVENT_SHOP, EVENT_LEVELS, EVENT_TOKENS, EVENT_BONUS, EVENT_PRIZE_FALLBACK, GUEST_TASKS, GUEST_REWARD, VISIT_GIFT,
  STAR_CHEST, REPLAY, MAP_REGIONS, STORY, ACHIEVEMENTS, ACH_REWARD, DAILY_QUESTS, QUEST_REWARD, QUEST_CHEST, MASTER_LEVELS, MASTER_REWARD, BOOSTERS, ACTIVE_BOOSTERS, WHISTLE_MOVES, FISH_SETS, ALBUM,
  BUILDINGS, BUFF_TEXT, VILLAGE_LEVELS, COLORS, COLOR_PRICE, COCOA, DISTRICTS, INTERIOR,
  VILLAGERS, VILLAGE_PHASES, VILLAGER_LINES, DAILY_TASKS, TASK_REWARD, FRIEND, VILLAGER_LIFE, DECOR_ITEMS, DECOR_SLOTS,
  VILLAGE_RENAME_PRICE, VILLAGE_NAME_MAX, VILLAGE_NAME_IDEAS,
  SIDE_LEVELS, SIDE_REWARD, GOALS, ORDERS, FESTIVAL, PIER_CATCH, AWAY_MIN, MUSIC, FLAKE_TRADE, MERCHANT, PET, PET_TOYS, PROJECTS, PROJECT_STAGES, PROJECT_STEPS, GAZETTE, RIDDLES, DYE_PRICE, EMOTES, PRICE_RAMP,
} from './config.js';
import { sfx, unlock, configure as configureSound, setAmbient, setMusic, playJingle, preloadJingle } from './sound.js';

const $ = id => document.getElementById(id);
const P = load(); // oyuncu kaydı
// Kayıt güvenliği: yazılamazsa bir kez uyar; ana kayıt bozuksa yedekten açıldığını söyle (ikisi de hata kaydına düşer).
onSaveFail(e => {
  logError(`Kayıt yazılamadı: ${e?.name || ''} ${e?.message || e}`);
  setTimeout(() => toast('Kayıt yapılamıyor: tarayıcı depolaması dolu ya da kapalı. Bu oturumdaki ilerleme kaybolabilir.', 4200), 600);
});
if (loadInfo.broken) {
  logError(`Kayıt bozuktu, ${loadInfo.from === 'backup' ? 'yedekten açıldı' : 'yedek de yoktu, yeni kayıt açıldı'}`);
  setTimeout(() => toast(loadInfo.from === 'backup' ? 'Kayıt okunamadı; son yedekten açıldı.' : 'Kayıt okunamadı ve yedek yoktu. Ayarlar > Hata kaydı ile bize bildirebilirsin.', 4200), 3500);
}
// Askıya alınan güçlendiriciler (kazma, kürek, düdük): eldekiler mağaza fiyatı kadar coin olarak iade edilir.
{
  let refund = 0;
  // yeni güçlendiricilerin başlangıç hediyesi eski kayıtlara da verilir
  for (const id of ['route', 'moves5']) if (P.boosters[id] === undefined) P.boosters[id] = 1;
  for (const b of BOOSTERS) if (b.suspended && P.boosters[b.id] > 0) { refund += P.boosters[b.id] * b.price; P.boosters[b.id] = 0; }
  if (refund) {
    P.coins += refund;
    save(P);
    setTimeout(() => toast(`Güçlendiriciler yenilendi: eldekiler için +${refund} coin iade edildi`, 4000), 3000);
  }
}
// Tilki tüy rengi kaldırıldı (2026-11-04 kullanıcı kararı: evcil hayvanlar tek renk, renk yerine tür çeşidi gelecek).
// Satın alınmış renkler o günkü fiyatlarından coin olarak iade edilir.
if (P.pet?.furs) {
  const price = { red: 600, silver: 600, gold: 900, night: 1200 };
  const refund = P.pet.furs.reduce((a, id) => a + (price[id] || 0), 0);
  delete P.pet.furs;
  delete P.pet.fur;
  P.coins += refund;
  save(P);
  if (refund) setTimeout(() => toast(`Tilki renkleri kalktı: +${refund} coin iade edildi`, 4000), 3000);
}
// Tek tilkili eski kayıt: türler ve türe göre isimler (pofi-r13).
if (P.pet && !P.pet.kinds) {
  P.pet.kind = 'fox';
  P.pet.kinds = ['fox'];
  P.pet.names = { fox: { name: P.pet.name, named: !!P.pet.named } };
  delete P.pet.name;
  delete P.pet.named;
  save(P);
}
let LEVELS = []; // data/levels.json — sonrası çalışma anında üretilir

const board = new BoardView($('board'));
const village = new VillageView($('village'));
const visitView = new VillageView($('visitCanvas'));
const homeView = new VillageView($('homeScene')); // ana ekranın arkasındaki canlı köy
village.onSelect = id => (sheet?.id === id && INTERIOR[id] && P.village[id] ? goInside(id) : openSheet(id));
village.onDistrict = i => showDistrict(i);
village.onVillager = id => talkTo(id);
village.onEvent = kind => { sfx.ui(); if (kind === 'tent') showScreen('event'); else showGuest(); };
village.onDecorSlot = id => { village.decorSel = id; village.decorPreview = null; renderDecor(); };
village.onBubble = k => {
  // Fincan balonu: açık kakao siparişlerine yetecek kadarı ayrılır, fazlası satılır; fazla yoksa pano açılır.
  if (k === 'cups') {
    const keep = orderList().filter(o => !o.done && o.kind === 'cups').reduce((a, o) => a + o.n, 0);
    if (Math.floor(cocoaNow()) - keep >= 1) sellCocoa(1, keep);
    else if (keep) { sfx.ui(); showOrders(); }
    return;
  }
  sfx.ui();
  if (k === 'fish') { if (orderList().some(o => !o.done && o.kind === 'fish')) showOrders(); else if (P.pet) showPet(); }
};
village.onTown = k => {
  sfx.ui();
  if (k === 'merchant') showMerchant();
  else if (k === 'pet') { village.wakePet(); village.petCheer = village.clock + 2; showPet(); }
  else if (k === 'hero') heroEmote();
  else if (k.startsWith('proj:')) showProject(k.slice(5));
};
board.outfit = P.outfit;

const volOf = k => Math.max(0, Math.min(100, Number.isFinite(P.settings[k]) ? P.settings[k] : 100));
const applySoundSettings = () => configureSound({ sfx: P.settings.sfx !== false, ambient: P.settings.ambient !== false, music: P.settings.music !== false, sfxLevel: volOf('sfxVol') / 100, musicLevel: volOf('musicVol') / 100 });
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
const ui = id => `<i class="ui ui-${id}" aria-hidden="true"></i>`; // çizilmiş ikon seti (css: .ui-<id>); yanındaki yazının süsü
// Fiyat simgeleri ekran okuyucuda okunur: "coin 120" (yalnızca "120" değil).
const coinIco = '<i class="ico coin" role="img" aria-label="coin"></i>';
const flakeIco = '<i class="ico flake" role="img" aria-label="kar tanesi"></i>';
const hintIco = '<i class="ico hint" role="img" aria-label="ipucu"></i>';
const popcount = m => { let c = 0; while (m) { c += m & 1; m >>= 1; } return c; };

function persist() { P.lastSeen = Date.now(); save(P); updateWallet(); }

// Köy sahnesindeki yükseltme oku: yalnızca önerilen sıradaki yapıda (kuruluysa ve kar tanesi yetiyorsa).
function upgradeHint() {
  const s = suggestion(P);
  return s && s.lv > 0 && P.flakes >= s.cost ? [s.b.id] : [];
}
function updateWallet() {
  $('coins').textContent = P.coins;
  $('flakes').textContent = P.flakes;
  $('playLevel').textContent = P.level;
  $('dotVillage').classList.toggle('hidden', !canAffordAny(P) && !recipeReady() && !districtReady() && !homesReady().length && !taskDone() && !guestDone());
  // Mağaza noktası: ücretsiz coin hakkı varken günde bir kez, mağaza açılana kadar (sürekli yanmasın).
  $('dotShop').classList.toggle('hidden', freeCoinsLeft() <= 0 || P.shopSeen === today());
  renderNextCard();
  renderDailyButtons();
  renderEventCard();
  renderTownStrip();
}

const SCREENS = ['splash', 'login', 'intro', 'home', 'game', 'village', 'visit', 'interior', 'event', 'map', 'ach', 'wardrobe', 'shop', 'settings'];
const TAB_SCREENS = ['home', 'village', 'wardrobe', 'shop', 'settings'];

// Ekranın müziği. Oyunda level aralığına göre; günlük, etkinlik, usta ve yan yol levellerinde oyuncunun kendi leveli.
function musicFor(name) {
  if (name === 'game' && run) {
    const n = run.daily || run.event !== null || run.master !== null || run.side !== null ? P.level : run.def.n || P.level;
    return [...MUSIC.game].reverse().find(t => n >= t.from)?.src ?? null;
  }
  if (name === 'village' || name === 'interior' || name === 'visit') {
    const h = hourNow();
    return villageLevel(P) >= 6 && (h >= 20 || h < 6) ? MUSIC.village.night : MUSIC.village.day;
  }
  return ['home', 'intro', 'map', 'event', 'ach', 'wardrobe', 'shop', 'settings'].includes(name) ? MUSIC.home : null;
}

function showScreen(name) {
  screen = name;
  for (const s of SCREENS) $('screen' + s[0].toUpperCase() + s.slice(1)).classList.toggle('hidden', s !== name);
  $('app').dataset.screen = name;
  board.active = name === 'game';
  setAmbient(name === 'game' || name === 'village');
  setMusic(musicFor(name));
  $('btnBack').classList.toggle('hidden', !['game', 'visit', 'interior', 'event', 'map', 'ach'].includes(name));
  board.dark = false;
  $('tabbar').classList.toggle('hidden', !TAB_SCREENS.includes(name));
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  if (name !== 'village' && sheet) closeSheet();
  if (name !== 'village') village.door = null; // yarım kalan kapı yürüyüşü sonradan içeri sokmasın
  if (name !== 'village' && village.decorMode) exitDecor();
  if (name !== 'wardrobe') { wardrobeDraft = null; dyeDraft = undefined; }
  if (name !== 'game') { $('hintBar').classList.add('hidden'); $('boostBar').classList.add('hidden'); board.target = null; }
  if (name === 'village') {
    village.resize();
    renderVillage();
    if (P.vlClaimed < villageLevel(P)) setTimeout(celebrateVillage, 500);
    else if (!P.villageName && !nameAsked) { nameAsked = true; setTimeout(() => { if (screen === 'village' && !overlayOpen()) showVillageName(); }, 400); }
  }
  if (name === 'home') homeView.resize();
  if (name === 'wardrobe') renderWardrobe();
  if (name === 'event') renderEventScreen();
  if (name === 'map') openMap();
  if (name === 'home' || name === 'village') setTimeout(() => { if (screen === name && !overlayOpen()) showUnlock(); }, 900);
  if (name === 'ach') renderAch();
  renderUpdBar();
  if (name === 'shop') { renderShop(); if (P.shopSeen !== today()) { P.shopSeen = today(); save(P); } }
  if (name === 'settings') { renderSettings(); renderErrCount(); }
  if (name === 'home') { ensureEvent(P); if (P.eventNote) { const n = P.eventNote; P.eventNote = null; persist(); setTimeout(() => toast(`${n.name} bitti: kalan ${n.tokens} jeton ${n.coins} coin oldu`, 3200), 600); } }
  updateWallet();
  if (name === 'home' && !dailyPopupShown && !dailyRewardState().claimedToday) {
    dailyPopupShown = true;
    setTimeout(() => { if (screen === 'home' && $('overlay').classList.contains('hidden')) showDailyReward(); }, 450);
  } else if (name === 'home' && awayFrom) setTimeout(showAway, 450);
}
let dailyPopupShown = false;
let nameAsked = false;

let toastTimer = 0;
function toast(msg, ms = 1800) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), ms);
}

function openOverlay(html, cls = '') {
  $('overlayCard').className = `card ${cls}`.trim();
  $('overlayCard').innerHTML = html;
  $('overlay').classList.remove('hidden');
}
function closeOverlay() { $('overlay').classList.add('hidden'); }
const overlayOpen = () => !$('overlay').classList.contains('hidden');

// CSS boyutunda, yüksek çözünürlüklü canvas bağlamı.
function fitCanvas(cv, w, h) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  // Boyut değişmedikçe tuval yeniden ayrılmaz (her karede çağrılır); yalnızca yükseklik değişirse de güncellenir.
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
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
  const name = cleanName($('playerName').value).slice(0, 16) || 'Kâşif';
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

const introsShown = new Set(); // bu oturumda mekanik kartı gösterilen leveller

// Yarım kalan level: her hamlede o levelde yapılan hamleler (yön listesi) ayrı bir anahtarda tutulur.
// Oyuncu aynı leveli yeniden açınca hamleler motorda yeniden oynatılır, tahta kaldığı yerden sürer.
// Kazanınca, kaybedince, baştan alınca ya da levelden çıkınca silinir. Level verisi değiştiyse
// (hamle artık geçersizse) sessizce baştan başlar.
const RUN_KEY = 'pofi.run.v1';
const runKeyOf = (def, evk, master, side) => [def.n, def.daily || '', evk ?? '', evk !== null && evk !== undefined ? P.event?.key ?? '' : '', master ?? '', side ?? ''].join('|');
function readRunSnap() {
  try { return JSON.parse(localStorage.getItem(RUN_KEY)); } catch { return null; }
}
function saveRunSnap() {
  if (!run || run.finished || !run.dirs.length) { clearRunSnap(); return; }
  try {
    localStorage.setItem(RUN_KEY, JSON.stringify({ key: run.key, dirs: run.dirs, limit: run.limit, rare: run.rare || null, hintsUsed: run.hintsUsed, boosts: run.boosts || 0, at: Date.now() }));
  } catch { /* yer yoksa yarım level tutulmaz */ }
}
function clearRunSnap() {
  try { localStorage.removeItem(RUN_KEY); } catch { /* yoksay */ }
}
// Kayıtlı hamleleri yeni run'a uygular; geçersizse false (run baştaki hâliyle kalır).
function replayRun(snap) {
  let st = run.st;
  const hist = [];
  for (const d of snap.dirs) {
    const r = simulate(run.L, st, d);
    if (!r || won(run.L, r.state)) return false;
    hist.push(st);
    st = r.state;
  }
  run.history = hist;
  run.st = st;
  run.moves = snap.dirs.length;
  run.dirs = [...snap.dirs];
  if (snap.limit) run.limit = Math.max(run.limit || 0, snap.limit);
  if (run.limit && run.moves >= run.limit) return false;
  run.hintsUsed = snap.hintsUsed || 0;
  run.boosts = snap.boosts || 0;
  if (snap.rare) { run.rare = snap.rare; board.rare = run.rare; }
  return true;
}

function startLevel(n, daily = false, evk = null, master = null, side = null) {
  preloadJingle(MUSIC.jingles.win);
  let def;
  const ev = evk !== null ? ensureEvent(P) : null;
  if (side !== null) {
    def = { ...SIDES[side], n: 30000 + side };
  } else if (master !== null) {
    def = masterDef(master);
  } else if (ev) {
    def = eventLevelDef(ev, evk, P.event.base);
  } else if (daily) {
    const key = dateKey();
    def = { ...generateLevel(Math.max(9, P.level - 1), { seed: +key.replace(/-/g, '') }), limit: null, daily: key };
  } else {
    def = levelDef(n);
  }
  const { L, S } = parseLevel(def);
  // Kardan adam: hamle limitli levellerde ek hamle.
  const limit = def.limit ? def.limit + buff(P, 'hardMoves') : null;
  run = {
    def, L, st: S, history: [], moves: 0, limit, finished: false, daily: !!daily, stuck: false, fishSound: 0, hintsUsed: 0, hintLock: false,
    event: ev ? evk : null, reverse: !!ev?.rule?.reverse, fromMap: playFromMap || master !== null || side !== null, master, side,
    dirs: [], key: runKeyOf(def, ev ? evk : null, master, side),
  };
  playFromMap = false;
  run.rare = rollRare();
  board.rare = run.rare;
  // oynanış verisi yalnızca sabit leveller için (günlük bulmaca ve etkinlik levelleri her hafta üretilir)
  run.statKey = side !== null ? `Y${side + 1}` : master !== null ? `U${master + 1}` : !ev && !daily ? def.n : null;
  run.statT = performance.now();
  const snap = readRunSnap();
  const resumed = snap?.key === run.key && Array.isArray(snap.dirs) && replayRun(snap);
  if (snap && !resumed) clearRunSnap();
  if (!resumed) statAdd(run.statKey, { tries: 1 }, { tier: def.tier, min: def.min });
  showScreen('game');
  board.dark = !!ev?.rule?.dark;
  board.outfit = P.outfit;
  board.setLevel(L, S);
  if (resumed) {
    board.setState(run.st);
    track('level_resume', { level: def.n, moves: run.moves });
    setTimeout(() => toast(`Kaldığın yerden devam · ${run.moves} hamle`, 2200), 300);
  }
  board.tutorialDir = !daily && !ev && master === null && def.n <= 2 ? solve(L, S)?.[0] ?? -1 : -1;
  renderHud();
  renderGoal();
  if (side !== null) {
    const g = GOALS[def.goal];
    track('side_start', { side, goal: def.goal });
    if (P.goalsSeen.includes(def.goal)) toast(`${g.title}: ${g.text}`, 3000);
    else {
      // tür ilk kez oynanıyor: kural bir kartla anlatılır
      P.goalsSeen.push(def.goal);
      save(P);
      openOverlay(`<span class="new-tag">YENİ HEDEF</span><h2>${g.title}</h2><div class="unlock-ico">${ui(g.ui)}</div><p>${g.text}</p><button id="introOk" class="btn green big">Tamam</button>`);
      $('introOk').onclick = closeOverlay;
    }
    return;
  }
  if (master !== null) {
    track('master_start', { region: master });
    toast(`Usta leveli · ${run.limit} hamle hakkın var`, 2400);
    return;
  }
  if (ev) {
    track('event_level_start', { event: ev.id, k: evk });
    const tips = [ev.rule?.reverse && 'Kontroller ters: sağa kaydırırsan sola gider!', ev.rule?.dark && 'Karanlık: yalnızca penguenin çevresi görünür.', run.limit && `${run.limit} hamle hakkın var`].filter(Boolean);
    if (tips.length) toast(tips.join(' · '), 2600);
    return;
  }
  track(daily ? 'daily_puzzle_start' : 'level_start', { level: def.n, tier: def.tier, min: def.min });

  // Mekanik kartı level kazanılana kadar her oturumda bir kez çıkar; baştan alınca ya da "tekrar dene"de yeniden açılmaz.
  const intro = !daily && INTRO[def.n];
  if (intro && !P.stars[def.n] && !introsShown.has(def.n)) {
    introsShown.add(def.n);
    openOverlay(`<span class="new-tag">YENİ</span><h2>${intro.title}</h2><canvas class="intro-icon" id="introIcon"></canvas><p>${intro.text}</p><button id="introOk" class="btn primary big">Anladım</button>`);
    drawIntroIcon($('introIcon'), intro.icon);
    $('introOk').onclick = closeOverlay;
  } else if (run.limit) {
    toast(`${TIER_LABEL[def.tier]} level · ${run.limit} hamle hakkın var`, 2200);
  }
}

function drawIntroIcon(cv, kind, s = 84) {
  const ctx = fitCanvas(cv, s, s);
  const tile = {
    snow: T.SNOW, water: T.WATER, crack: T.CRACK, lever: T.LEVER, arrow: T.RIGHT, ramp: T.RAMP_RIGHT, hole: T.HOLE, melt: T.MELT,
    plate: T.PLATE, turn: T.TURN, fragile: T.FRAGILE, icicle: T.ICICLE, wind: T.FLAG,
  }[kind] ?? T.ICE;
  paintTile(ctx, tile, 0, 0, s, 0, { pressed: kind === 'plate' });
  if (['fish', 'crate', 'seal', 'order', 'ball', 'raft', 'key', 'pipi'].includes(kind)) paintTile(ctx, kind, 0, 0, s, 0, {});
}

function renderHud() {
  $('hudLevel').textContent = run.side !== null && run.side !== undefined ? GOALS[run.def.goal].title : run.master !== null ? `Usta · ${MAP_REGIONS[run.master].name}` : run.event !== null ? `Etkinlik ${run.event + 1}/${EVENT_LEVELS}` : run.daily ? 'Günlük bulmaca' : `Level ${run.def.n}`;
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
  $('btnHint').disabled = run.hintLock;
  const bc = ACTIVE_BOOSTERS.reduce((n, b) => n + (P.boosters[b.id] || 0), 0);
  const low = run.limit && !run.finished && run.limit - run.moves <= 2 && run.limit - run.moves > 0;
  $('btnBoost').classList.toggle('pulse', !!low);
  if (low && !run.offered5) { run.offered5 = true; toast('Hamle azalıyor · Güç → +5 hamle', 2400); }
  $('boostCount').textContent = bc > 0 ? bc : '+';
  $('btnUndo').disabled = run.history.length === 0;
}

function renderGoal() {
  const n = run.L.fishCells.length, got = popcount(run.st.fish), { L, st } = { L: run.L, st: run.st };
  // hedefli levelde asıl hedef önce yazar; balık yoksa balık sayacı çıkmaz
  const chip = (ok, ico, text) => `<span class="chip${ok ? ' done' : ''}">${ico}<b>${text}</b></span>`;
  let extra = '';
  if (L.targets) { const on = L.targets.filter(c => st.crates.includes(c)).length; extra = chip(on === L.targets.length, ui('crate'), `${on}/${L.targets.length}`); }
  if (L.exit >= 0) extra = chip(st.p === L.exit && got === n, ui('tab_home'), 'Eve dön');
  if (L.breakAll) { const all = L.dynCells.filter(c => L.t[c] === T.CRACK), on = all.filter(c => st.dyn[L.dynIdx[c]] !== 0).length; extra = chip(on === all.length, ui('crack'), `${on}/${all.length}`); }
  $('goal').innerHTML = extra + (n ? `<span class="chip${got === n ? ' done' : ''}"><canvas id="goalFish"></canvas><b>${got}/${n}</b></span>` : '')
    + (run.stuck ? '<span class="chip stuck">Sıkıştın! Geri al</span>' : '');
  if (n) drawFish(fitCanvas($('goalFish'), 28, 20), 13, 10, 24, 0);
}

const flip = d => (d & 4) | (((d & 3) + 2) % 4);
board.onMove = dir => {
  if (!run || run.finished || overlayOpen()) return;
  if (run.reverse) dir = flip(dir);
  $('hintBar').classList.add('hidden');
  if (board.target) endTarget();
  $('boostBar').classList.add('hidden');
  const r = simulate(run.L, run.st, dir);
  if (!r) { sfx.bump(); return; }
  run.history.push(run.st);
  run.st = r.state;
  run.moves++;
  run.dirs.push(dir);
  saveRunSnap();
  run.stuck = false;
  run.hintLock = false;
  run.fishSound = popcount(run.history[run.history.length - 1].fish);
  sealSounded = false;
  board.play(r, run.history[run.history.length - 1]);
  if (run.route) {
    if (dir === run.route[0] && run.route.length > 1) { run.route.shift(); board.showRoute(routeSeq(run.st, run.route)); }
    else run.route = null;
  }
  sfx.slide(r.pPath.length - 1);
  if (P.settings.haptics) navigator.vibrate?.(10);
  renderHud();
};

let sealSounded = false; // bir hamlede foklar tek ses çıkarır
board.onFx = f => {
  if (f.k === 'fish') {
    sfx.fish(run.fishSound++);
    renderGoal();
    if (run.rare && f.cell === run.L.fishCells[run.rare.i]) {
      board.burst(f.cell, '#ffe066', 16, board.s * 3.5, 0.8, board.s * 2, 'star');
      toast(`✨ ${run.rare.f.name} balığı! Level bitince albüme girer`, 2200);
    }
  }
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
  else if (f.k === 'rock') f.broke ? sfx.crack() : sfx.bump();
  else if (f.k === 'icicle') sfx.crack();
  else if (f.k === 'drift') sfx.land();
  else if (f.k === 'key') sfx.fish(6);
  else if (f.k === 'raft') sfx.splash();
  else if (f.k === 'plate') sfx.lever();
  else if (f.k === 'turn') sfx.rotate();
  else if (f.k === 'gust') sfx.slide(1);
};
board.onSelect = () => sfx.ui();

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
    if (run.stuck) statAdd(run.statKey, { stuck: 1 });
    if (run.stuck) { renderGoal(); track('stuck', { level: run.def.n, moves: run.moves }); }
  }, 30);
};

function undo() {
  if (!run || run.finished || board.anim || !run.history.length) return;
  run.route = null;
  run.st = run.history.pop();
  run.moves = Math.max(0, run.moves - 1);
  run.dirs.pop();
  saveRunSnap();
  run.stuck = false;
  run.hintLock = false;
  board.hintDir = -1; // eski durumun ipucu artık geçersiz
  board.setState(run.st);
  if (!run.daily && run.def.n <= 2) board.tutorialDir = solve(run.L, run.st)?.[0] ?? -1;
  renderHud();
  renderGoal();
  nudgeHint();
}

// Geri al ya da baştan başla: oyuncu zorlanıyor demektir, ipucu düğmesini bir el ile göster.
// Her level için oturumda bir kez; ipucu zaten gösteriliyorsa gösterilmez.
const nudged = new Set();
function nudgeHint() {
  if (!run || run.finished || run.hintLock || nudged.has(run.def.n) || overlayOpen()) return;
  nudged.add(run.def.n);
  const btn = $('btnHint'), r = btn.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'hint-nudge';
  el.innerHTML = '<span class="bubble">İpucu kullanmayı dene</span><span class="hand">👇</span>';
  el.style.left = `${r.left + r.width / 2}px`;
  el.style.top = `${r.top}px`;
  document.body.appendChild(el);
  const off = () => { el.remove(); document.removeEventListener('pointerdown', off, true); };
  setTimeout(() => document.addEventListener('pointerdown', off, true), 0);
  setTimeout(off, 4000);
  track('hint_nudge', { level: run.def.n });
}

// O ana kadar geçen süre (bir kez sayılsın diye saat sıfırlanır)
function statTime() {
  const s = (performance.now() - run.statT) / 1000;
  run.statT = performance.now();
  return s;
}

let lastWinJingle = -Infinity; // tam kazanma müziğinin en son çaldığı an
function win() {
  run.finished = true;
  clearRunSnap();
  board.tutorialDir = -1;
  const stars = starsFor(run.def.min, run.moves);
  statAdd(run.statKey, { wins: 1, moves: run.moves, secs: statTime() });
  statBest(run.statKey, run.moves, stars);
  let raw;
  if (run.daily) {
    P.dailyPuzzleStreak = (P.dailyPuzzleDay === yesterdayKey() ? P.dailyPuzzleStreak : 0) + 1;
    P.dailyPuzzleDay = run.def.daily;
    P.ach.streak = Math.max(P.ach.streak || 0, P.dailyPuzzleStreak);
    raw = Math.round(dailyPuzzleCoins(P.dailyPuzzleStreak) * (1 + buff(P, 'puzzlePct')));
    track('daily_puzzle_complete', { streak: P.dailyPuzzleStreak, moves: run.moves });
  } else if (run.side !== null) {
    // yan yol: ilk bitirişte tam ödül, tekrarda yalnızca yeni yıldızlar (ana levellerle aynı kural)
    const prev = P.sides[run.side] || 0;
    run.replay = prev > 0;
    run.gained = Math.max(0, stars - prev);
    raw = run.replay ? REPLAY.coin + run.gained * REPLAY.perNewStar : ECON.coin[run.def.tier] + stars * (ECON.coinPerStar + buff(P, 'starCoin'));
    P.sides[run.side] = Math.max(prev, stars);
    if (!run.replay) { giveReward(SIDE_REWARD); run.sideFirst = true; }
    track('side_complete', { side: run.side, goal: run.def.goal, stars, first: !run.replay });
  } else if (run.master !== null) {
    raw = ECON.coin[run.def.tier] + stars * (ECON.coinPerStar + buff(P, 'starCoin'));
    run.masterFirst = !P.masters[run.master];
    P.masters[run.master] = Math.max(P.masters[run.master] || 0, stars);
    if (run.masterFirst) giveReward(MASTER_REWARD);
    track('master_complete', { region: run.master, stars, first: run.masterFirst });
  } else if (run.event !== null) {
    raw = ECON.coin[run.def.tier] + stars * (ECON.coinPerStar + buff(P, 'starCoin'));
    track('event_level_complete', { k: run.event, moves: run.moves, stars });
  } else {
    const prev = P.stars[run.def.n] || 0;
    run.replay = prev > 0;
    if (stars === 3 && prev < 3 && !run.hintsUsed && !run.boosts) P.ach.clean = (P.ach.clean || 0) + 1;
    // Köy Gazetesi: haftanın zor leveli o hafta 3 yıldızla bitirilirse bir kez ödül
    if (stars === 3 && run.def.n === gazetteHard() && P.gazette.hard !== gazetteIssue()) {
      P.gazette.hard = gazetteIssue();
      P.coins += GAZETTE.hardBonus;
      run.hardBonus = true;
    }
    run.gained = Math.max(0, stars - prev);
    raw = run.replay ? REPLAY.coin + run.gained * REPLAY.perNewStar : ECON.coin[run.def.tier] + stars * (ECON.coinPerStar + buff(P, 'starCoin'));
    P.stars[run.def.n] = Math.max(prev, stars);
    run.starGain = run.replay ? run.gained : stars;
    P.level = Math.max(P.level, run.def.n + 1);
    track('level_complete', { level: run.def.n, moves: run.moves, min: run.def.min, stars });
  }
  // Köy buff'ları: iglo + köy bonusu yüzdesi, iskele balık başına coin, kulübe şanslı kar tanesi.
  const pct = coinBonusPct(P);
  const fishCoins = run.L.fishCells.length * buff(P, 'fishCoin');
  const base = raw + Math.round(raw * pct) + fishCoins;
  const lucky = Math.random() < buff(P, 'flakeChance');
  const flakes = run.replay ? run.gained * REPLAY.flakePerNewStar : 1 + (stars === 3 ? ECON.starFlake : 0) + (lucky ? 1 : 0);
  const achBefore = achClaimable();
  if (!run.replay) {
    P.ach.fish = (P.ach.fish || 0) + run.L.fishCells.length;
    if (!run.hintsUsed) P.ach.nohint = (P.ach.nohint || 0) + 1;
  }
  if (!run.hintsUsed) questProgress('nohint', 1);
  if (run.replay && run.gained) questProgress('replay', 1);
  if (run.daily) questProgress('daily', 1);
  if (run.event !== null) questProgress('evlevel', 1);
  taskProgress('levels', 1);
  taskProgress('fish', run.L.fishCells.length);
  if (stars === 3) taskProgress('stars', 1);
  // bugün toplanan balık (tilkiyi beslemek için) ve balık yeminin kalan leveli
  P.fishDay = { day: dateKey(), n: fishToday(P) + run.L.fishCells.length };
  if (P.bait > 0) P.bait--;
  const caught = run.rare ? albumAdd(run.rare.f) : null;
  P.flakes += flakes;
  persist();
  setTimeout(() => {
    board.burst(run.st.p, '#ffd166', 24, board.s * 5, 1, board.s * 4);
    board.burst(run.st.p, '#8fd0ff', 24, board.s * 5, 1, board.s * 4);
    board.celebrate();
    // tam kazanma müziği seyrek; arada (ve müzik çalamazsa) kısa zafer sesi
    const now = performance.now();
    if (now - lastWinJingle >= MUSIC.jingleGapSec * 1000 && playJingle(MUSIC.jingles.win)) lastWinJingle = now;
    else sfx.win();
  }, 150);
  // Haftalık etkinlik jetonu (etkinlik levelinde ilk bitiriş çok daha fazla verir)
  const ev = ensureEvent(P);
  const isEv = run.event !== null, firstClear = isEv && !P.event.done[run.event];
  const evPts = addTokens(P, run.replay ? run.gained * REPLAY.tokenPerNewStar : Math.round(levelTokens(ev, {
    stars, fish: run.L.fishCells.length, daily: run.daily, hintsUsed: run.hintsUsed > 0, eventLevel: isEv, firstClear,
  }) * (1 + buff(P, 'eventPct'))));
  run.achNew = achClaimable() > achBefore;
  if (isEv) { P.event.done[run.event] = Math.max(P.event.done[run.event] || 0, stars); guestProgress('evlevel', 1); }
  persist();
  const notes = [
    pct > 0 && `Köy bonusu +%${Math.round(pct * 100)}`,
    fishCoins > 0 && `Balık +${fishCoins}`,
    !run.replay && stars === 3 && '3 yıldız +1 ❄',
    !run.replay && lucky && 'Şanslı ağ +1 ❄',
    run.replay && (run.gained ? `Tekrar · yeni yıldız +${run.gained}` : 'Tekrar · yeni yıldız yok'),
    caught && caught.text,
    run.sideFirst && `🪧 Yan yol ödülü: +${SIDE_REWARD.flakes} ❄, +${SIDE_REWARD.hints} ipucu`,
    run.hardBonus && `📰 Haftanın zor leveli +${GAZETTE.hardBonus} coin`,
    run.masterFirst && `🏰 ${MAP_REGIONS[run.master].name} rozeti · +${MASTER_REWARD.coins} coin, +${MASTER_REWARD.hints} ipucu, +${MASTER_REWARD.flakes} ❄`,
    `${ev.token} +${evPts} jeton`,
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

// Sonuç ekranında: yıldız sandığının dolması ve hazır başarım rozeti (normal levellerde).
function resultProgress() {
  if (run.daily || run.event !== null || run.master !== null || run.side !== null) return run.achNew ? `<div class="rs-ach">${ui('quests')} Başarım ödülü hazır!</div>` : '';
  const tot = totalStars(), base = P.starChests * STAR_CHEST.every, gain = run.starGain || 0;
  const ready = Math.floor(tot / STAR_CHEST.every) > P.starChests;
  const from = Math.max(0, Math.min(100, ((tot - gain - base) / STAR_CHEST.every) * 100)), to = ready ? 100 : ((tot - base) / STAR_CHEST.every) * 100;
  return `<div class="rs-chest">
      <span>${ui('gift')}</span>
      <div class="progress"><div id="rsChestBar" style="width:${from}%" data-to="${to}%" ${ready ? 'data-ready="1"' : ''}></div></div>
      <b>${ready ? 'Sandık hazır!' : `${tot - base}/${STAR_CHEST.every}`}</b>
    </div>
    ${gain ? `<small class="breakdown">+${gain} yıldız${ready ? ' · sandığı haritada aç' : ''}</small>` : ''}
    ${run.achNew ? `<div class="rs-ach">${ui('quests')} Başarım ödülü hazır!</div>` : ''}`;
}

function showResult(stars, base, flakes, notes) {
  const zones = multZones();
  const head = run.daily
    ? `<span class="new-tag">GÜNLÜK BULMACA · SERİ ${P.dailyPuzzleStreak}</span><h2>Bugünkü tamam!</h2>`
    : `<h2>${stars === 3 ? 'Kusursuz!' : 'Harika!'}</h2>`;
  openOverlay(`
    ${head}
    <div class="stars">${[1, 2, 3].map(k => `<span class="star${k <= stars ? ' on' : ''}">★</span>`).join('')}</div>
    ${P.pet ? '<canvas id="rsPet" class="rs-pet"></canvas>' : ''}
    <p>${run.moves} hamle · en iyi çözüm ${run.def.min}</p>
    ${stars < 3 && !run.daily ? `<div class="rs-retry"><span>3 yıldız için en fazla <b>${run.def.min}</b> hamle</span><button id="rsRetry" class="btn secondary">↻ Tekrar dene</button></div>` : ''}
    ${resultProgress()}
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

  for (let k = 0; k < stars; k++) setTimeout(() => sfx.star(k), 180 + k * 260);
  // evcil dost sonuç ekranında sevinçle zıplar
  if ($('rsPet')) {
    const cv = $('rsPet');
    (function petTick(now) {
      if (!cv.isConnected || !overlayOpen()) return;
      drawPet(fitCanvas(cv, 64, 52), 32, 50, 36, { kind: P.pet.kind, pose: 'happy', t: now / 1000, collar: collarHex() });
      requestAnimationFrame(petTick);
    })(performance.now());
  }
  if ($('rsRetry')) $('rsRetry').onclick = () => { closeOverlay(); restartRun(); };
  // sandık çubuğu eski değerden yenisine dolar
  const bar = $('rsChestBar');
  if (bar) setTimeout(() => { bar.style.width = bar.dataset.to; if (bar.dataset.ready) sfx.reward(); }, 900);

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
    const retry = stars < 3 && !run.daily ? `<button id="rsRetry2" class="btn secondary">↻ Tekrar oyna · ${3 - stars} yıldız daha kazan</button>` : '';
    $('claimArea').innerHTML = `<div style="display:flex;flex-direction:column;gap:12px"><button id="toNext" class="btn green big">Devam</button>${retry}${villageBtn}</div>`;
    const leave = then => {
      closeOverlay();
      save(P);
      then();
    };
    $('toNext').onclick = () => leave(() => {
      if (run.event !== null) return showScreen('event');
      if (run.daily) return showScreen('home');
      // eski leveli tekrar oynadıysa haritada kalır; ilk kez bitirdiyse sıradaki levelin penceresi kendiliğinden açılır
      mapNext = !run.replay && run.master === null && run.side === null;
      showScreen('map');
    });
    if ($('rsRetry2')) $('rsRetry2').onclick = () => leave(restartRun);
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
  clearRunSnap();
  statAdd(run.statKey, { fails: 1 });
  track('level_fail', { level: run.def.n, fish: popcount(run.st.fish) });
  sfx.fail();
  const free = freeLeft('cont'), contPrice = boostPrice(BOOSTERS.find(b => b.id === 'moves5'));
  openOverlay(`
    <h2>Hamlen bitti!</h2>
    <p>Çok yaklaştın: ${popcount(run.st.fish)}/${run.L.fishCells.length} balık toplandı.</p>
    ${free > 0 ? `<button id="fFree" class="btn green big">Ücretsiz +${ECON.continueMoves} hamle</button><small class="breakdown">Deniz feneri · bugün ${free} hakkın var</small>` : ''}
    ${P.boosters.moves5 > 0 ? `<button id="fBoost" class="btn green big">${ui('moves')} +${ECON.continueMoves} hamle · elinde ${P.boosters.moves5}</button>` : ''}
    <button id="fAd" class="btn primary big ad">+${ECON.continueMoves} hamle</button>
    <button id="fCoin" class="btn secondary">+${ECON.continueMoves} hamle · ${contPrice} coin</button>
    <button id="fRetry" class="btn link">Baştan başla</button>`);
  $('fCoin').disabled = P.coins < contPrice;
  // Ek hamle nereden gelirse gelsin yardım sayılır (Yardımsız usta başarımı).
  const resume = () => { statAdd(run.statKey, { extra: 1 }); run.limit += ECON.continueMoves; run.boosts = (run.boosts || 0) + 1; run.finished = false; closeOverlay(); renderHud(); };
  if (free > 0) $('fFree').onclick = () => { P.daily.cont++; persist(); resume(); };
  if ($('fBoost')) $('fBoost').onclick = () => { P.boosters.moves5--; persist(); track('booster_used', { type: 'moves5', level: run.def.n }); resume(); };
  $('fAd').onclick = async () => { if (await showRewarded('continue')) resume(); };
  $('fCoin').onclick = () => { P.coins -= contPrice; rampUp('moves5'); persist(); resume(); };
  $('fRetry').onclick = () => { closeOverlay(); restartRun(); };
}

// İpucu bir hamleyi gösterir; oyuncu hamle yapana (ya da geri alana) kadar düğme kilitli kalır,
// böylece arka arkaya basıp ipucu harcanmaz.
// Tek ipucu fiyatı gün içinde her alımda ikiye katlanır (mağaza ve oyun içi aynı merdiven).
// Oyun içinden almak hintGameMult kat pahalı; 5'li paket her zaman daha uygun.
const ladderN = () => (P.hintLadder?.day === dateKey() ? P.hintLadder.n : 0);
const hintPrice = (inGame = false) => Math.round(ECON.hintBase * 2 ** ladderN() * (inGame ? ECON.hintGameMult : 1));
// Bugünkü alım sayısına göre fiyat: mağazada taban + adet × adım; oyun içinde aynı oranda, 5'e yuvarlı.
const rampN = id => (P.priceRamp?.day === dateKey() ? P.priceRamp[id] || 0 : 0);
function rampUp(id) {
  const n = rampN(id) + 1;
  P.priceRamp = { ...(P.priceRamp?.day === dateKey() ? P.priceRamp : { day: dateKey() }), [id]: n };
}
function ramped(id, shop, game, inGame) {
  const p = shop + rampN(id) * (PRICE_RAMP[id] || 0);
  return inGame ? Math.round((p * game) / shop / 5) * 5 : p;
}
const packPrice = (inGame = false) => ramped('pack', ECON.hintPack5Cost, ECON.hintGamePack5, inGame);
function buyHints(n, cost, where) {
  if (P.coins < cost) return false;
  P.coins -= cost;
  P.hints += n;
  if (n === 1) P.hintLadder = { day: dateKey(), n: ladderN() + 1 };
  else rampUp('pack');
  persist();
  track('hint_buy', { n, cost, where });
  sfx.coin();
  updateWallet();
  return true;
}

function useHint() {
  if (!run || run.finished || board.anim || run.hintLock) return;
  document.querySelector('.hint-nudge')?.remove();
  const sol = solve(run.L, run.st, 150000);
  if (!sol) { toast('Bu durumdan çıkış yok. Önce geri al.'); return; }
  const free = freeLeft('hints') > 0;
  if (free || P.hints > 0) {
    if (free) P.daily.hints++; else P.hints--;
    run.hintsUsed++;
    persist();
    statAdd(run.statKey, { hints: 1 });
    track('booster_used', { type: 'hint', level: run.def.n });
    // gölge penguen hamleyi önden gösterir; ok, ters kontrolde kaydırılacak yönü gösterir
    board.showHint(run.reverse ? flip(sol[0]) : sol[0], simulate(run.L, run.st, sol[0]));
    if (run.st.q >= 0) board.sel = sol[0] >= 4 ? 1 : 0;
    run.hintLock = true;
    sfx.fish(5);
    renderHud();
    return;
  }
  showHintBar();
}

// ---------- güçlendiriciler ----------
// Güç düğmesi araç çubuğunun üstünde üç kart açar. Kazma ve kürek hedef ister (tahtada geçerli hücreler parlar),
// düdük hemen etki eder. Güçlendirici bitince kartta coin'le alma ve ödüllü reklam (+1) çıkar.
const boostIcon = b => (b.ui ? ui(b.ui) : art(`booster_${b.id}`) ? `<img src="assets/art/booster_${b.id}.webp" alt="">` : b.icon);
const boostPrice = (b, inGame = true) => ramped(b.id, b.price, b.gamePrice ?? Math.round(b.price * ECON.hintGameMult), inGame);

function boostCells(kind) {
  const L = run.L, S = run.st, cells = new Set();
  for (let c = 0; c < L.w * L.h; c++) {
    const t = tileOf(L, S, c);
    if (kind === 'pick' && (t === T.ROCK || t === T.FRAGILE)) cells.add(c);
    if (kind === 'shovel' && t === T.ICE && L.t[c] === T.ICE && c !== S.p && c !== S.q && !S.crates.includes(c) && !S.balls.includes(c)
      && !S.seals.some(v => v >> 2 === c) && !S.rafts.includes(c)) cells.add(c);
  }
  return cells;
}

function showBoostBar() {
  if (!run || run.finished) return;
  $('hintBar').classList.add('hidden');
  const bar = $('boostBar'), hasSeal = run.st.seals.length > 0;
  // kart kapalı mı: düdük fok ister, +5 hamle hamle sınırı ister
  const offText = b => (b.id === 'whistle' && !hasSeal ? 'Bu levelde fok yok' : b.limitOnly && !run.limit ? 'Bu level hamle sınırsız' : '');
  bar.innerHTML = `
    <div class="hb-head"><b>Güçlendiriciler</b><button class="hb-x" aria-label="Kapat">×</button></div>
    <div class="bb-row">${ACTIVE_BOOSTERS.map(b => {
      const n = P.boosters[b.id] || 0, off = !!offText(b), price = boostPrice(b);
      const act = n > 0 ? `<button class="btn green" data-use="${b.id}" ${off ? 'disabled' : ''}>${board.target?.kind === b.id ? 'Vazgeç' : `Kullan · ${n}`}</button>`
        : `<div class="bb-buy"><button class="btn secondary" data-buy="${b.id}" ${P.coins < price ? 'disabled' : ''}>${coinIco}${price}</button><button class="btn primary ad" data-ad="${b.id}">+1</button></div>`;
      return `<div class="bb-card${off ? ' off' : ''}${board.target?.kind === b.id ? ' on' : ''}"><span class="bb-ico">${boostIcon(b)}</span><b>${b.name}</b><small>${off ? offText(b) : b.text}</small>${act}</div>`;
    }).join('')}</div>`;
  bar.classList.remove('hidden');
  bar.querySelector('.hb-x').onclick = () => { bar.classList.add('hidden'); endTarget(); };
  bar.querySelectorAll('[data-use]').forEach(btn => { btn.onclick = () => useBoost(btn.dataset.use); });
  bar.querySelectorAll('[data-buy]').forEach(btn => {
    btn.onclick = () => {
      const b = BOOSTERS.find(x => x.id === btn.dataset.buy), price = boostPrice(b);
      if (P.coins < price) return;
      P.coins -= price;
      P.boosters[b.id] = (P.boosters[b.id] || 0) + 1;
      rampUp(b.id);
      persist();
      sfx.coin();
      track('booster_buy', { id: b.id, price, where: 'game' });
      updateWallet();
      renderHud();
      showBoostBar();
    };
  });
  bar.querySelectorAll('[data-ad]').forEach(btn => {
    btn.onclick = async () => {
      if (!(await showRewarded('booster'))) return;
      P.boosters[btn.dataset.ad] = (P.boosters[btn.dataset.ad] || 0) + 1;
      persist();
      renderHud();
      showBoostBar();
    };
  });
}

// Rota: verilen hamlelerin art arda sonuçları (hayalet için)
function routeSeq(st, dirs) {
  return dirs.map(d => { const r = simulate(run.L, st, d); st = r.state; return r; });
}

function useBoost(kind) {
  if (!run || run.finished || board.anim || !(P.boosters[kind] > 0)) return;
  if (kind === 'route') {
    const sol = solve(run.L, run.st, 150000);
    if (!sol) { toast('Bu durumdan çıkış yok. Önce geri al.'); return; }
    run.route = sol.slice();
    board.showRoute(routeSeq(run.st, sol));
    spendBoost(kind);
    run.hintsUsed++; // yardım sayılır (ipucusuz ödüller ve Yardımsız usta)
    sfx.task();
    toast(`Rota: ${sol.length} hamle · sen oyna, rota seninle ilerler`, 2600);
    return;
  }
  if (kind === 'moves5') {
    if (!run.limit) return;
    run.limit += ECON.continueMoves;
    spendBoost(kind);
    sfx.reward();
    toast(`+${ECON.continueMoves} hamle`);
    return;
  }
  if (board.target?.kind === kind) { endTarget(); showBoostBar(); return; }
  if (kind === 'whistle') {
    if (!run.st.seals.length) return;
    run.st = { ...run.st, frz: WHISTLE_MOVES };
    board.S = run.st;
    spendBoost(kind);
    sfx.task();
    toast(`Foklar ${WHISTLE_MOVES} hamle uyuyor`);
    return;
  }
  const cells = boostCells(kind);
  if (!cells.size) { toast(kind === 'pick' ? 'Kırılacak kaya yok' : 'Kar konacak boş buz yok'); return; }
  board.target = { kind, cells };
  // çubuk tahtanın alt sıralarını örtmesin diye hedef seçerken kapanır; Güç düğmesi seçimi iptal eder
  toast(kind === 'pick' ? 'Kırmak istediğin kayaya dokun' : 'Kar koymak istediğin buza dokun', 2200);
  $('boostBar').classList.add('hidden');
}

function endTarget() { board.target = null; }

board.onTarget = c => {
  const kind = board.target?.kind;
  if (!kind || !run) return;
  if (kind === 'pick') { run.L.t[c] = T.ICE; board.burst(c, '#9aa7bc', 18, board.s * 3, 0.6, board.s); sfx.crack(); }
  else { run.L.t[c] = T.SNOW; board.burst(c, '#ffffff', 18, board.s * 2.5, 0.6, board.s); sfx.land(); }
  endTarget();
  spendBoost(kind);
};

function spendBoost(kind) {
  P.boosters[kind]--;
  run.boosts = (run.boosts || 0) + 1;
  // tahta değişti: eski ipucu ve "sıkıştın" uyarısı geçersiz (rota kendi hayaletini az önce kurdu)
  if (kind !== 'route') { board.clearHint(); run.route = null; }
  run.hintLock = false;
  run.stuck = false;
  persist();
  statAdd(run.statKey, kind === 'route' ? { routes: 1 } : { extra: 1 });
  track('booster_used', { type: kind, level: run.def.n });
  $('boostBar').classList.add('hidden');
  renderHud();
  renderGoal();
}

// İpucu kalmayınca: araç çubuğunun üstünde mini satın alma çubuğu (reklam +10, tek, 5'li).
function showHintBar() {
  $('boostBar').classList.add('hidden');
  const one = hintPrice(true), five = packPrice(true), bar = $('hintBar');
  bar.innerHTML = `
    <div class="hb-head"><b>İpucun kalmadı</b><button class="hb-x" aria-label="Kapat">×</button></div>
    <div class="hb-row">
      <button id="hbAd" class="btn primary ad">+${ECON.hintAdAmount}</button>
      <button id="hbOne" class="btn secondary" ${P.coins < one ? 'disabled' : ''}>1 · ${coinIco}${one}</button>
      <button id="hbFive" class="btn green" ${P.coins < five ? 'disabled' : ''}>5'li · ${coinIco}${five}</button>
    </div>
    <small>Fiyatlar bugün her alımda artar · mağazada daha ucuz</small>`;
  bar.classList.remove('hidden');
  const done = n => { bar.classList.add('hidden'); toast(`+${n} ipucu`); useHint(); };
  bar.querySelector('.hb-x').onclick = () => bar.classList.add('hidden');
  $('hbAd').onclick = async () => {
    if (!(await showRewarded('free_hint'))) return;
    P.hints += ECON.hintAdAmount;
    persist();
    done(ECON.hintAdAmount);
  };
  $('hbOne').onclick = () => { if (buyHints(1, one, 'game')) done(1); };
  $('hbFive').onclick = () => { if (buyHints(5, five, 'game')) done(5); };
}

// ---------- köy ----------
// Günlük ücretsiz haklar (fener dizisi: ipucu, deniz feneri: +5 hamle); gün değişince sıfırlanır.
function freeLeft(kind) {
  if (P.daily.day !== dateKey()) P.daily = { day: dateKey(), hints: 0, cont: 0 };
  // Saat kulesi (köy projesi) bitince her gün +1 ücretsiz ipucu
  return Math.max(0, buff(P, kind === 'hints' ? 'freeHints' : 'freeContinues') + (kind === 'hints' ? projectBonus(P, 'freeHint') : 0) - P.daily[kind]);
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

// İskelenin balığı: kakao gibi zamanla birikir, sınırda durur. Yalnızca evcil dostu beslemeye yarar.
const pierCap = () => bLevel(P, 'pier') * PIER_CATCH.perLevel * PIER_CATCH.capHours;
function pierNow() {
  const lv = bLevel(P, 'pier');
  if (!lv) return 0;
  if (!P.pierTs) return P.pierFish; // üretim saati ilk bankPier ile başlar
  return Math.min(pierCap(), P.pierFish + (lv * PIER_CATCH.perLevel * (Date.now() - P.pierTs)) / 3.6e6);
}
function bankPier() { P.pierFish = pierNow(); P.pierTs = Date.now(); }
const petFood = () => fishToday(P) + Math.floor(pierNow());

// ---------- Sipariş panosu ----------
// Köylüler stanttaki fincanı ve iskelenin balığını ister. Liste günde bir yenilenir.
const ordersOn = () => villageLevel(P) >= ORDERS.vl && villagersHere().length > 0
  && Object.values(ORDERS.kinds).some(k => bLevel(P, k.needs));
const orderCap = kind => (kind === 'cups' ? cocoaCap() : pierCap());
const orderStock = kind => Math.floor(kind === 'cups' ? cocoaNow() : pierNow());
const orderCoins = o => o.n * ORDERS.kinds[o.kind].coinPer;
function ensureOrders() {
  if (!ordersOn()) return null;
  const day = dateKey();
  if (P.orders?.day === day) return P.orders;
  const kinds = Object.keys(ORDERS.kinds).filter(k => bLevel(P, ORDERS.kinds[k].needs));
  const givers = [...villagersHere()].sort(() => Math.random() - 0.5);
  const first = Math.floor(Math.random() * kinds.length), list = [];
  for (let i = 0; i < ORDERS.slots; i++) {
    const kind = kinds[(first + i) % kinds.length], K = ORDERS.kinds[kind];
    const hi = Math.max(K.min, Math.min(K.max, Math.floor(orderCap(kind) * K.capShare)));
    list.push({ giver: givers[i % givers.length].id, kind, n: K.min + Math.floor(Math.random() * (hi - K.min + 1)), done: false });
  }
  P.orders = { day, list, bonus: false };
  save(P);
  return P.orders;
}
const orderList = () => ensureOrders()?.list || [];
const orderReady = o => !o.done && orderStock(o.kind) >= o.n;
const ordersReady = () => orderList().filter(orderReady).length;
// Sahne: siparişi olan köylülerin üstünde işaret (aynı köylünün tek işareti olur: ilk açık siparişi).
function orderMarks() {
  const seen = new Set(), out = [];
  for (const o of orderList()) if (!o.done && !seen.has(o.giver)) { seen.add(o.giver); out.push({ giver: o.giver, kind: o.kind, ready: orderReady(o) }); }
  return out;
}
// İskele balonu yalnızca balık bir işe yarayacaksa çıkar: balık siparişi ya da aç evcil dost.
const pierInfo = () => ({
  fish: Math.floor(pierNow()),
  want: orderList().some(o => !o.done && o.kind === 'fish') || !!(P.pet && !petFedToday(P)),
});
function deliverOrder(i) {
  const o = orderList()[i];
  if (!o || !orderReady(o)) return;
  if (o.kind === 'cups') {
    P.cocoaCups = cocoaNow() - o.n;
    P.cocoaTs = Date.now();
    P.ach.cups = (P.ach.cups || 0) + o.n;
  } else {
    bankPier();
    P.pierFish = Math.max(0, P.pierFish - o.n);
  }
  o.done = true;
  P.ach.orders = (P.ach.orders || 0) + 1;
  const coins = orderCoins(o), v = VILLAGERS.find(x => x.id === o.giver);
  P.coins += coins;
  let bonus = '';
  if (!P.orders.bonus && P.orders.list.every(x => x.done)) {
    P.orders.bonus = true;
    P.flakes += ORDERS.bonusFlakes;
    bonus = ` · günün siparişleri tamam, +${ORDERS.bonusFlakes} ❄`;
  }
  friendAdd(o.giver, ORDERS.friendPts);
  save(P);
  track('order_deliver', { kind: o.kind, n: o.n, coins });
  updateWallet();
  sfx.coin();
  village.coinsAt(o.giver, coins);
  toast(`${v.name}: "Çok teşekkürler!" · +${coins} coin${bonus}`, 2600);
  if (screen === 'village') renderVillage();
}
// ---------- Köy festivali (aylık) ----------
const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const festTheme = () => { const d = new Date(); return FESTIVAL.themes[(d.getFullYear() * 12 + d.getMonth()) % FESTIVAL.themes.length]; };
const festMax = () => FESTIVAL.stages[FESTIVAL.stages.length - 1].pts;
const festDaysLeft = () => { const d = new Date(), end = new Date(d.getFullYear(), d.getMonth() + 1, 1); return Math.max(1, Math.ceil((end - d) / 864e5)); };
const festOn = () => villageLevel(P) >= FESTIVAL.vl;
const festRare = () => MERCHANT_DECOR.find(d => !P.decorOwned.includes(d.id)) || null;
const festStage = pts => FESTIVAL.stages.filter(s => pts >= s.pts).length;
function festGrant(i) {
  const F = P.festival, s = FESTIVAL.stages[i];
  F.claimed[i] = true;
  giveReward(s.reward);
  let extra = '';
  if (s.reward.rare) {
    const d = festRare();
    if (d) { P.decorOwned.push(d.id); extra = d.name; } else { P.coins += FESTIVAL.rareCoins; extra = `${FESTIVAL.rareCoins} coin`; }
  }
  if (i === FESTIVAL.stages.length - 1) P.ach.festivals = (P.ach.festivals || 0) + 1;
  return extra;
}
function ensureFestival() {
  if (!festOn()) return null;
  const month = monthKey();
  if (P.festival?.month === month) return P.festival;
  // geçen ayın ulaşılmış ama alınmamış ödülleri kaybolmaz
  if (P.festival) {
    let n = 0;
    FESTIVAL.stages.forEach((s, i) => { if (P.festival.pts >= s.pts && !P.festival.claimed[i]) { festGrant(i); n++; } });
    if (n) setTimeout(() => toast(`Geçen ayın festivalinden ${n} ödül hesabına eklendi`, 3000), 3200);
  }
  P.festival = { month, pts: 0, claimed: FESTIVAL.stages.map(() => false), given: { cups: 0, fish: 0, coins: 0 } };
  save(P);
  return P.festival;
}
const festClaimable = () => { const F = ensureFestival(); return !!F && FESTIVAL.stages.some((s, i) => F.pts >= s.pts && !F.claimed[i]); };
// Bağışlanabilir stok: açık siparişlere yetecek kadarı ayrılır.
const festFree = kind => Math.max(0, orderStock(kind) - (ordersOn() ? orderList().filter(o => !o.done && o.kind === kind).reduce((a, o) => a + o.n, 0) : 0));
function festGive(kind) {
  const F = ensureFestival();
  if (!F || F.pts >= festMax()) return;
  let pts = 0;
  if (kind === 'coins') {
    const n = FESTIVAL.coinStep;
    if (P.coins < n) return;
    P.coins -= n;
    F.given.coins += n;
    pts = Math.round(n / FESTIVAL.coinPerPt);
  } else {
    const n = festFree(kind);
    if (n < 1 || !bLevel(P, kind === 'cups' ? 'cocoa' : 'pier')) return;
    if (kind === 'cups') { P.cocoaCups = cocoaNow() - n; P.cocoaTs = Date.now(); } else { bankPier(); P.pierFish = Math.max(0, P.pierFish - n); }
    F.given[kind] += n;
    pts = n * FESTIVAL.points[kind];
  }
  const before = festStage(F.pts);
  F.pts = Math.min(festMax(), F.pts + pts);
  save(P);
  track('festival_give', { kind, pts, total: F.pts });
  updateWallet();
  sfx.coin();
  if (festStage(F.pts) > before) {
    sfx.reward();
    toast(`${festTheme().name}: ${festStage(F.pts)}. aşamaya ulaşıldı! Ödülünü al`, 2600);
    village.sparkleAt(0.48, 0.5);
  } else toast(`+${pts} festival puanı`);
  if (screen === 'village') renderVillage();
  showFestival();
}
function festClaim(i) {
  const F = ensureFestival(), s = FESTIVAL.stages[i];
  if (!F || F.claimed[i] || F.pts < s.pts) return;
  const extra = festGrant(i);
  save(P);
  track('festival_claim', { stage: i + 1 });
  updateWallet();
  sfx.reward();
  toast(`Festival ödülü: ${[rewardText(s.reward), extra].filter(Boolean).join(' · ')}`, 2800);
  if (screen === 'village') renderVillage();
  showFestival();
}
const rewardText = r => [r.coins && `${r.coins} coin`, r.hints && `${r.hints} ipucu`, r.flakes && `${r.flakes} kar tanesi`].filter(Boolean).join(', ');
function showFestival() {
  const F = ensureFestival();
  if (!F) return;
  const th = festTheme(), max = festMax(), rare = festRare();
  const stages = FESTIVAL.stages.map((s, i) => {
    const got = F.claimed[i], ok = F.pts >= s.pts;
    const rw = `${rewardHtml(s.reward)}${s.reward.rare ? ` <b>+ ${rare ? `nadir süs: ${rare.name}` : `${FESTIVAL.rareCoins} coin`}</b>` : ''}`;
    const act = got ? '<span class="check">✓</span>' : ok ? `<button class="btn green" data-fc="${i}">Al</button>` : `<small class="muted">${s.pts} puan</small>`;
    return `<div class="ev-step${got ? ' done' : ''}"><span class="pts">${i + 1}</span><span class="rw">${rw}</span>${act}</div>`;
  }).join('');
  const done = F.pts >= max;
  const cups = bLevel(P, 'cocoa') ? festFree('cups') : -1, fish = bLevel(P, 'pier') ? festFree('fish') : -1;
  const give = done ? '<small class="breakdown">Bu ayın festivali tamam. Gelecek ay yeni tema gelir.</small>' : `<div class="fest-give">
      ${cups >= 0 ? `<button class="btn secondary" data-fg="cups" ${cups < 1 ? 'disabled' : ''}>☕ Kakao ver · ${cups} fincan <small>+${cups * FESTIVAL.points.cups}</small></button>` : ''}
      ${fish >= 0 ? `<button class="btn secondary" data-fg="fish" ${fish < 1 ? 'disabled' : ''}>${ui('fish')} Balık ver · ${fish} balık <small>+${fish * FESTIVAL.points.fish}</small></button>` : ''}
      <button class="btn secondary" data-fg="coins" ${P.coins < FESTIVAL.coinStep ? 'disabled' : ''}>${coinIco}${FESTIVAL.coinStep} coin ver <small>+${Math.round(FESTIVAL.coinStep / FESTIVAL.coinPerPt)}</small></button>
    </div>
    <small class="breakdown">Siparişler için gereken kakao ve balık ayrılır, yalnızca fazlası bağışlanır.</small>`;
  openOverlay(`
    <span class="new-tag">KÖY FESTİVALİ</span>
    <h2>${th.name}</h2>
    <p>${th.text}</p>
    <div class="fest-bar"><div class="progress"><div style="width:${(F.pts / max) * 100}%;height:100%;background:var(--green)"></div></div>
      ${FESTIVAL.stages.map(s => `<i style="left:${(s.pts / max) * 100}%" class="${F.pts >= s.pts ? 'on' : ''}"></i>`).join('')}</div>
    <small class="breakdown"><b>${F.pts}</b> / ${max} puan · ay sonuna ${festDaysLeft()} gün</small>
    <div class="fest-stages">${stages}</div>
    ${give}
    <button id="fsClose" class="btn link">Kapat</button>`);
  $('fsClose').onclick = closeOverlay;
  $('overlayCard').querySelectorAll('[data-fg]').forEach(b => { b.onclick = () => festGive(b.dataset.fg); });
  $('overlayCard').querySelectorAll('[data-fc]').forEach(b => { b.onclick = () => festClaim(+b.dataset.fc); });
}

function showOrders() {
  const list = orderList();
  if (!list.length) return;
  const rows = list.map((o, i) => {
    const v = VILLAGERS.find(x => x.id === o.giver), K = ORDERS.kinds[o.kind], have = orderStock(o.kind);
    const ico = o.kind === 'cups' ? '☕' : ui('fish');
    const act = o.done ? '<span class="check">✓</span>'
      : `<button class="btn green" data-ord="${i}" ${have < o.n ? 'disabled' : ''}>Ver · ${coinIco}${orderCoins(o)}</button>`;
    return `<div class="ord-row${o.done ? ' done' : ''}"><canvas class="ord-face" data-face="${o.giver}"></canvas>
      <div class="ord-txt"><b>${v.name}</b><small>${ico} ${o.n} ${K.name}${o.done ? ' · teslim edildi' : ` · elinde ${Math.min(have, 999)}`}</small></div>${act}</div>`;
  }).join('');
  const left = list.filter(o => !o.done).length;
  const stock = Object.keys(ORDERS.kinds).filter(k => bLevel(P, ORDERS.kinds[k].needs))
    .map(k => (k === 'cups' ? `☕ Stant: <b>${orderStock(k)}</b>/${cocoaCap()} fincan` : `${ui('fish')} İskele: <b>${orderStock(k)}</b>/${Math.round(pierCap())} balık`)).join(' · ');
  openOverlay(`
    <span class="new-tag">SİPARİŞ PANOSU</span>
    <h2>Köyün siparişleri</h2>
    <small class="breakdown">Stant ve iskele sen yokken de üretir. Siparişleri buradan karşıla; yarın yeni siparişler gelir.</small>
    <div class="ord-stock">${stock}</div>
    <div class="ord-list">${rows}</div>
    <small class="breakdown">${left ? `Bugünün hepsini bitirince +${ORDERS.bonusFlakes} kar tanesi` : P.orders.bonus ? 'Bugünün siparişleri tamam. Yarın yenileri gelir.' : ''}</small>
    <button id="ordClose" class="btn link">Kapat</button>`);
  $('overlayCard').querySelectorAll('.ord-face').forEach(cv => {
    const v = VILLAGERS.find(x => x.id === cv.dataset.face);
    drawPofi(fitCanvas(cv, 44, 44), 22, 42, 34, { outfit: v.outfit });
  });
  $('overlayCard').querySelectorAll('[data-ord]').forEach(b => { b.onclick = () => { deliverOrder(+b.dataset.ord); showOrders(); }; });
  $('ordClose').onclick = closeOverlay;
}

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
// keep: siparişler için ayrılan fincan (satılmaz).
function sellCocoa(mult, keep = 0) {
  const cups = Math.floor(cocoaNow()) - keep;
  if (cups < 1 || village.sale) return;
  const coins = cups * cupPrice(P) * mult;
  P.cocoaCups = cocoaNow() - cups;
  P.ach.cups = (P.ach.cups || 0) + cups;
  P.cocoaTs = Date.now();
  P.coins += coins;
  save(P);
  track('cocoa_sell', { cups, coins, mult });
  taskProgress('cocoa', 1);
  const done = () => {
    updateWallet();
    sfx.coin();
    toast(`${cups} fincan satıldı · +${coins} coin${keep ? ` · ${keep} fincan siparişe ayrıldı` : ''}`);
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
    <p>${d.soon ? 'Köy büyümeye devam edecek: yeni yapılar ve yeni bonuslarla.' : d.projects ? `Köy yana doğru genişler. ${d.text}. Projelere coin'i parça parça yatırırsın; biten proje kalıcı bir bonus verir.` : `Köy yana doğru genişler. Yeni yapılar: ${d.text}. Yapılar kar tanesiyle kurulur.`}</p>
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
    toast(d.projects ? `${d.name} açıldı! Köy projeleri listede.` : `${d.name} açıldı! Yeni yapılar listede.`);
    renderVillage();
    village.goPanel(i);
  };
}

let villageTab = 'build';

function renderVillage() {
  renderZoneTag();
  renderVlCard();
  const nd = nextDistrict(P);
  const dCard = nd ? `<button class="b-card district${districtReady() ? ' ready' : ''}" data-d="${P.land || 1}"><b>Yeni arazi: ${nd.name}</b><small>${nd.soon ? 'Yeni yapılar ve bonuslar' : `Köy Lv${nd.vl} · köy yana genişler`}</small><span class="act">${nd.soon ? 'Yakında' : `Aç ${coinIco}${nd.price}`}</span>${districtReady() ? '<i class="dot"></i>' : ''}</button>` : '';
  const vNext = VILLAGERS.find(v => v.price && !P.villagers.includes(v.id));
  const vCard = villageLevel(P) >= 3 ? `<button class="b-card district" data-vill><b>${ui('villagers')} Köylüler · ${villagersHere().length}/${VILLAGERS.length}</b><small>${phaseNow().name}: ${PHASE_TEXT[phaseNow().id]}</small><span class="act">${vNext ? (villageLevel(P) >= vNext.vl ? `Davet et ${coinIco}${discounted(P, vNext.price)}` : `Sıradaki köylü Köy Lv${vNext.vl}`) : 'Hepsi köyde'}</span></button>` : '';
  const slotsOpen = DECOR_SLOTS.filter(s => Math.floor(s.at[0]) < (P.land || 1));
  const dcCard = `<button class="b-card district" data-decor><b>${ui('decor')} Süsler · ${slotsOpen.filter(s => P.decor[s.id]).length}/${slotsOpen.length} yer dolu</b><small>Fener, bank, çam, buz heykelciği…</small><span class="act">Süsle ${coinIco}${Math.min(...DECOR_ITEMS.filter(d => !d.event && !d.merchant).map(d => discounted(P, d.price)))}+</span></button>`;
  const firstTip = Object.keys(P.village).length ? '' : `<p class="sheet-note first-tip">Level bitirdikçe kar tanesi kazanırsın. Kar tanesiyle ilk yapını kur: ${flakeIco} yetiyorsa kartta kırmızı nokta görünür.</p>`;
  // Nokta yalnızca önerilen sıradaki yapıda yanar; parası yeten diğerleri yalnızca yeşil çerçeveli kalır.
  const sug = suggestion(P), sugId = sug && P.flakes >= sug.cost ? sug.b.id : null;
  const buildCards = () => firstTip + dCard + BUILDINGS.filter(b => !b.district || (P.land || 1) > b.district).map(b => {
    const lv = bLevel(P, b.id), max = maxLevel(P, b), cost = nextCost(P, b);
    if (!isUnlocked(P, b)) {
      return `<button class="b-card locked" data-b="${b.id}"><b>${b.name}</b><small>${BUFF_TEXT[b.buff](b.values[0])}</small><span class="act">Köy Lv${ek(b.unlock, 'de')} açılır</span></button>`;
    }
    const ready = cost !== null && P.flakes >= cost;
    const act = cost === null ? capText(b) : lv === 0 ? `Kur ${flakeIco}${cost}` : `Lv${lv + 1} ${flakeIco}${cost}`;
    const buffNow = BUFF_TEXT[b.buff](b.values[Math.max(0, lv - 1)]);
    const thumb = `<img class="b-thumb" src="assets/art/bld_${b.id}_s${P.village[b.id]?.style || 0}_lv${Math.min(Math.max(lv, 1), 3)}.webp" alt="" onerror="this.remove()">`;
    return `<button class="b-card${ready ? ' ready' : ''}" data-b="${b.id}">${thumb}<b>${b.name}</b>${dots(lv, max)}<small>${lv ? buffNow : 'Kurulunca: ' + buffNow}</small><span class="act">${act}</span>${ready && b.id === sugId ? '<i class="dot"></i>' : ''}</button>`;
  }).join('');
  // Sekmeler: Köy hayatı ilk yapıdan sonra, Projeler Çam Ormanı açılınca görünür. Seçili sekme yoksa Yapılar açılır.
  const tabs = { build: true, life: Object.keys(P.village).length > 0, proj: (P.land || 1) >= 3 };
  if (!tabs[villageTab]) villageTab = 'build';
  const lifeCount = Object.keys(P.village).length;
  $('vTabs').classList.toggle('hidden', lifeCount === 0);
  // Kakao satış düğmesi Köy hayatı'nda: stant yarıdan fazla dolunca sekmede işaret çıkar.
  const cocoaFull = cocoaRate() > 0 && cocoaNow() >= cocoaCap(); // stant dolunca üretim durur
  const dotsOn = { build: canAffordAny(P) || districtReady(), life: villagersHere().some(v => friendReady(v.id)) || cocoaFull || (P.level > 5 && gazetteUnread()) || (!!merchantToday() && (P.land || 1) >= 2) || homesReady().length > 0 || recipeReady() || taskDone() || guestDone() || ordersReady() > 0 || festClaimable() || !!(P.pet && !petFedToday(P) && petFood() >= PET.feedFish), proj: false };
  $('vTabs').querySelectorAll('.vtab').forEach(b => {
    const k = b.dataset.vt;
    b.classList.toggle('hidden', !tabs[k]);
    b.classList.toggle('active', k === villageTab);
    b.querySelector('.dot').classList.toggle('hidden', k === villageTab || !dotsOn[k]);
    b.onclick = () => { villageTab = k; renderVillage(); };
  });
  document.querySelector('#screenVillage .share-row').classList.toggle('hidden', villageTab !== 'life');
  document.querySelector('#screenVillage .honey').classList.toggle('hidden', villageTab !== 'life');
  $('buildList').innerHTML = villageTab === 'build' ? buildCards() : villageTab === 'life' ? townCards() + vCard + dcCard : projectCards();
  $('buildList').querySelectorAll('[data-b]').forEach(btn => { btn.onclick = () => openSheet(btn.dataset.b); });
  $('buildList').querySelectorAll('[data-d]').forEach(btn => { btn.onclick = () => { village.goPanel(+btn.dataset.d); showDistrict(+btn.dataset.d); }; });
  $('buildList').querySelector('[data-vill]')?.addEventListener('click', showVillagers);
  $('buildList').querySelector('[data-decor]')?.addEventListener('click', enterDecor);
  $('buildList').querySelectorAll('[data-town]').forEach(btn => { btn.onclick = () => openTown(btn.dataset.town); });
  renderCocoa();
}

// ---------- köy ismi ----------
// İlk isim ücretsiz ve köy ekranına ilk girişte sorulur; sonradan değiştirmek VILLAGE_RENAME_PRICE coin.
const cleanName = s => String(s).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, VILLAGE_NAME_MAX);

function showVillageName() {
  const first = !P.villageName, price = first ? 0 : VILLAGE_RENAME_PRICE;
  const idea = VILLAGE_NAME_IDEAS[Math.floor(Math.random() * VILLAGE_NAME_IDEAS.length)];
  openOverlay(`
    <span class="new-tag">${first ? 'YENİ KÖY' : 'İSİM DEĞİŞTİR'}</span>
    <h2>${first ? 'Köyüne bir isim ver' : 'Köyün yeni ismi'}</h2>
    <p>${first ? 'İsim köy ekranında ve paylaştığın köy bağlantısında görünür. İlk isim ücretsiz.' : `İsmi değiştirmek ${coinIco}${price} coin.`}</p>
    <label class="field light"><input id="vnInput" maxlength="${VILLAGE_NAME_MAX}" placeholder="${esc(idea)}" value="${esc(P.villageName || '')}" autocomplete="off"></label>
    <small id="vnWhy" class="breakdown">2-${VILLAGE_NAME_MAX} karakter</small>
    <button id="vnSave" class="btn green" ${P.coins < price ? 'disabled' : ''}>${first ? 'Kaydet' : P.coins < price ? `Yetersiz coin · ${coinIco}${price}` : `Değiştir · ${coinIco}${price}`}</button>
    <button id="vnClose" class="btn link">${first ? 'Sonra' : 'Vazgeç'}</button>`);
  const input = $('vnInput');
  const check = () => {
    const name = cleanName(input.value || (first ? idea : ''));
    const ok = name.length >= 2 && name !== P.villageName && P.coins >= price;
    $('vnSave').disabled = !ok;
    return ok ? name : null;
  };
  input.oninput = check;
  check();
  $('vnClose').onclick = closeOverlay;
  $('vnSave').onclick = () => {
    const name = check();
    if (!name) return;
    P.coins -= price;
    P.villageName = name;
    persist();
    closeOverlay();
    sfx.reward();
    track('village_name', { first, price });
    toast(first ? `Köyünün adı artık ${name}` : `Köyün yeni adı: ${name}`);
    renderVillage();
    updateWallet();
  };
}

function renderVlCard() {
  const vl = villageLevel(P), next = nextVillageLevel(P), tot = totalLevels(P);
  const cur = VILLAGE_LEVELS.find(v => v.lv === vl);
  const prog = next ? (tot - cur.need) / (next.need - cur.need) : 1;
  const extra = next && unlockNames(next.lv) ? ` · yeni: ${unlockNames(next.lv)}` : '';
  $('vlCard').innerHTML = `
    <div class="vl-top"><span class="vl-num">${vl}</span><div><b class="vname">${P.villageName ? `${esc(P.villageName)} · ` : ''}Köy seviyesi ${vl}<button id="vnEdit" class="vn-edit" aria-label="Köy ismini değiştir">✎</button></b><small>Köy bonusu: tüm level coin'lerine +%${Math.round(villageBonusPct(P) * 100)}</small></div></div>
    <div class="progress"><div style="width:${prog * 100}%;height:100%;background:var(--blue)"></div></div>
    <small>${next ? `Lv${next.lv} için ${next.need - tot} yapı seviyesi daha · ${next.visual}${extra}` : 'Köy tamamen kuruldu! Bütün yapılar en yüksek seviyede.'}</small>`;
  $('vnEdit').onclick = showVillageName;
}

// ---------- yapı paneli: önce önizle, beğenirsen al ----------
let sheet = null; // { id, draft: { style, color } }

function openSheet(id) {
  if (village.decorMode) return;
  const b = building(id);
  if (!isUnlocked(P, b)) { toast(`${b.name} Köy Lv${ek(b.unlock, 'de')} açılır`); return; }
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

// Renk paleti yalnızca görselin vurgu bölgesini boyar (tente, çatı, bayrak…). Vurgusu olmayan yapı/stilde
// renk seçeneği gösterilmez. Görsel yoksa ya da kapalıysa kod çizimi rengi kullandığı için gösterilir.
function colorable(id, style, lv) {
  if (id === 'lights') return true;
  return accentHue(`bld_${id}_s${style}_lv${Math.min(Math.max(lv, 1), 3)}`) !== null;
}

function renderSheet() {
  const b = building(sheet.id), st = P.village[b.id];
  const lv = bLevel(P, b.id), max = maxLevel(P, b), cost = nextCost(P, b);
  village.preview = st && sheet.draft ? { id: b.id, ...sheet.draft } : null;

  const buffLine = lv
    ? `<b>${BUFF_TEXT[b.buff](b.values[lv - 1])}</b><small>${lv < max ? `Lv${lv + 1}: ${BUFF_TEXT[b.buff](b.values[lv])}` : capText(b)}</small>`
    : `<b>Kurulunca: ${BUFF_TEXT[b.buff](b.values[0])}</b><small>Her seviye görünümü güzelleştirir ve bonusu büyütür</small>`;
  const upLabel = cost === null ? capText(b) : lv === 0 ? `Kur · ${flakeIco}${cost}` : `Lv${ek(lv + 1, 'e')} yükselt · ${flakeIco}${cost}`;

  let looks = '<p class="sheet-note">Kurduktan sonra stil ve renk seçebilirsin.</p>';
  let action = '';
  if (st) {
    const ownedStyles = P.styles[b.id] || [0];
    const d = sheet.draft;
    const canColor = colorable(b.id, d.style, lv);
    if (!canColor) d.color = st.color; // bu stilde boyanacak yer yok: renk değişmez
    const styleCost = ownedStyles.includes(d.style) ? 0 : discounted(P, b.stylePrice);
    const colorCost = canColor && d.color && !P.colors.includes(d.color) ? discounted(P, COLOR_PRICE) : 0;
    const total = styleCost + colorCost;
    const changed = d.style !== st.style || d.color !== st.color;
    looks = `
      <div class="sheet-sec"><b>Stil</b><small>Dokun, sahnede gör</small></div>
      <div class="chips">${b.styles.map((name, i) => {
        const lock = ownedStyles.includes(i) ? '' : ` ${coinIco}${discounted(P, b.stylePrice)}`;
        return `<button class="chip-btn${d.style === i ? ' sel' : ''}${st.style === i ? ' cur' : ''}" data-style="${i}">${name}${lock}</button>`;
      }).join('')}</div>
      ${canColor ? `<div class="sheet-sec"><b>Renk</b><small>Yalnızca tente, çatı, bayrak gibi renkli kısmı boyar · açılan renk tüm yapılarda kullanılır</small></div>
      <div class="swatches">
        <button class="sw def${d.color === null ? ' sel' : ''}" data-color="" title="Stilin kendi rengi"></button>
        ${COLORS.map(c => `<button class="sw${d.color === c.id ? ' sel' : ''}" data-color="${c.id}" title="${c.name}" style="background:${c.hex}">${P.colors.includes(c.id) ? '' : `<span class="lock">${ui('lock')}</span>`}</button>`).join('')}
      </div>` : '<p class="sheet-note">Bu stilde boyanacak renkli bir kısım yok; görünümü stil belirler.</p>'}`;
    const label = !changed ? 'Şu anki görünüm' : total ? `Satın al · ${coinIco}${total}` : 'Uygula';
    action = `<div class="sheet-actions">
      <button id="shCancel" class="btn link">Vazgeç</button>
      <button id="shBuy" class="btn ${total ? 'primary' : 'green'}" ${!changed || P.coins < total ? 'disabled' : ''}>${changed && P.coins < total ? `Yetersiz coin · ${coinIco}${total}` : label}</button>
    </div>`;
    sheet.cost = { total, styleCost, colorCost };
  }

  $('sheet').innerHTML = `
    <div class="sheet-head"><div><b>${b.name}</b><span class="lv-pill">${lv ? `Lv ${lv}/${max}` : 'Kurulmadı'}</span></div><button id="shX" class="sheet-x" aria-label="Kapat">×</button></div>
    <div class="buff-box">${buffLine}${b.id === 'pier' && lv ? `<small>${ui('market')} Sen yokken saatte ${lv * PIER_CATCH.perLevel} balık tutar (evcil dost için) · şu an ${Math.floor(pierNow())}/${pierCap()}</small>` : ''}</div>
    <button id="shUp" class="btn green big" ${cost === null || P.flakes < cost ? 'disabled' : ''}>${cost !== null && P.flakes < cost ? `${cost - P.flakes} kar tanesi daha gerekli` : upLabel}</button>
    ${INTERIOR[b.id] && st ? `<button id="shIn" class="btn secondary big in-btn">İçeri gir · eşya yerleştir${interiorReady(P, b.id) ? '<i class="dot"></i>' : ''}</button>` : ''}
    ${b.id === 'market' && st ? `<button id="shTrade" class="btn secondary big in-btn">Kar tanesi takası · ${coinIco}${flakePrice(tradeN(P))}</button>` : ''}
    ${looks}
    ${action}`;
  $('sheet').classList.remove('hidden');

  $('shX').onclick = closeSheet;
  $('shUp').onclick = () => upgrade(b.id);
  if ($('shIn')) $('shIn').onclick = () => goInside(b.id);
  if ($('shTrade')) $('shTrade').onclick = showMarket;
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
  bankPier();
  P.flakes -= cost;
  questProgress('build', 1);
  village.celebrate(id);
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
  const what = s.lv === 0 ? `${s.b.name} kur` : `${s.b.name} Lv${ek(s.lv + 1, 'e')} yükselt`;
  const missing = s.cost - P.flakes;
  card.innerHTML = `${flakeIco}<span class="nc-text"><small>Köy · Lv ${villageLevel(P)}</small><b>${what}</b></span>`
    + `<span class="nc-go">${missing > 0 ? `${missing} kar tanesi daha` : 'Hazır ›'}</span>`;
}

// ---------- gardırop: önce dene, beğenirsen al ----------
let wardrobeCat = 'hat';
let wardrobeDraft = null; // denenen kıyafet (bu kategoride)

let wardrobeCheer = 0; // Pofi yeni kıyafetine bu ana kadar sevinir
let emoteDraft = null; // İfade sekmesinde denenen ifade
let dyeDraft; // undefined: boya denenmiyor; null: kendi rengi; yoksa COLORS kimliği
const dyeKey = (cat, id) => `${cat}:${id}`;
// Boyanacak parça: denenen parça (sahipse), deneme yoksa giyilen parça
function dyeTarget() {
  if (wardrobeCat === 'emote') return null;
  const id = wardrobeDraft ? (P.owned[wardrobeCat].includes(wardrobeDraft) ? wardrobeDraft : null) : P.outfit[wardrobeCat];
  return id && id !== 'none' ? id : null;
}
function previewOutfit() {
  if (wardrobeCat === 'emote') return P.outfit;
  const o = { ...P.outfit }, dk = wardrobeCat + 'Dye';
  if (wardrobeDraft) { o[wardrobeCat] = wardrobeDraft; o[dk] = P.dyes[dyeKey(wardrobeCat, wardrobeDraft)] || null; }
  if (dyeDraft !== undefined && dyeTarget()) o[dk] = dyeDraft;
  return o;
}
// Görselde boyanacak renkli kısım var mı? Görsel yüklenmemişse kod çizimi (atkılar, tüccar şapkaları) boyanır.
function dyeable(cat, id) {
  const h = accentHue(`outfit_${cat}_${id}`);
  return h === undefined ? cat === 'scarf' || !!WARDROBE.hat.find(x => x.id === id)?.merchant : h !== null;
}
// Giyilen parça değişince boyası da onunla gelir (her parçanın boyası ayrı saklanır).
function wear(cat, id) {
  P.outfit = { ...P.outfit, [cat]: id, [cat + 'Dye']: P.dyes[dyeKey(cat, id)] || null };
  board.outfit = P.outfit;
}
// İfadeler: el sallama, dans, piruet (gardırop önizlemesi ve köy)
function emotePose(id, t) {
  if (id === 'wave') return { wave: 0.6 + Math.sin(t * 14) * 0.5 };
  if (id === 'dance') return { lean: Math.sin(t * 11) * 0.14, squash: Math.max(0, Math.cos(t * 22)) * 0.12, happy: true };
  if (id === 'spin') return { face: [1, 0, -1, 0][Math.floor(t * 8) % 4], happy: true };
  return { wave: Math.max(0, Math.sin(t * 2.2)) * 0.6, blink: (t % 3.4) < 0.12 };
}
const emoteBob = t => (wardrobeCat === 'emote' && emoteDraft === 'dance' ? Math.abs(Math.sin(t * 11)) * 8 : t < wardrobeCheer ? Math.abs(Math.sin(t * 8)) * 14 : 0);
const cheerWardrobe = () => { wardrobeCheer = performance.now() / 1000 + 1.6; };

let wardrobeRedraw = 0;
onArtLoad(id => {
  if (screen !== 'wardrobe' || !id.startsWith('outfit_') || wardrobeRedraw) return;
  wardrobeRedraw = requestAnimationFrame(() => { wardrobeRedraw = 0; if (screen === 'wardrobe') renderWardrobe(); });
});

function renderWardrobe() {
  document.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === wardrobeCat));
  if (wardrobeCat === 'emote') { renderEmotes(); return; }
  const items = WARDROBE[wardrobeCat];
  const owned = P.owned[wardrobeCat];
  const sorted = [...items.filter(it => owned.includes(it.id)), ...items.filter(it => !owned.includes(it.id))];
  $('wardrobeList').innerHTML = sorted.map(it => {
    const on = P.outfit[wardrobeCat] === it.id, have = owned.includes(it.id), sel = wardrobeDraft === it.id;
    const label = on ? 'Giyili' : have ? 'Sahip' : it.reward ? `Köy Lv${it.reward}` : it.event ? 'Etkinlik' : it.merchant ? 'Gezgin tüccar' : `${coinIco}${discounted(P, it.price)}`;
    return `<button class="w-item${on ? ' on' : ''}${sel ? ' sel' : ''}${have ? '' : ' locked'}" data-w="${it.id}"><canvas></canvas><span>${it.name}</span><span class="price">${label}</span></button>`;
  }).join('');
  $('wardrobeList').querySelectorAll('[data-w]').forEach(btn => {
    const id = btn.dataset.w;
    const ctx = fitCanvas(btn.querySelector('canvas'), 64, 64);
    drawPofi(ctx, 32, 63, 44, { outfit: { ...P.outfit, [wardrobeCat]: id, [wardrobeCat + 'Dye']: P.dyes[dyeKey(wardrobeCat, id)] || null } });
    btn.onclick = () => { wardrobeDraft = id === P.outfit[wardrobeCat] ? null : id; dyeDraft = undefined; renderWardrobe(); };
  });
  renderDye();

  const it = wardrobeDraft && items.find(x => x.id === wardrobeDraft);
  // Seçim varken eylem çubuğu kaydırırken de görünür kalır (alt menünün hemen üstünde).
  $('wardrobeAction').classList.toggle('floating', !!it);
  if (!it) { $('wardrobeAction').innerHTML = `<p class="sheet-note" style="flex:1">Bir parçaya dokun, Pofi'nin üzerinde dene.</p>`; return; }
  const have = owned.includes(it.id), price = discounted(P, it.price);
  const btn = have ? `<button id="wBuy" class="btn green">Giy</button>`
    : it.reward ? `<button class="btn primary" disabled>Köy Lv${it.reward} ödülü</button>`
    : it.event ? `<button class="btn primary" disabled>Haftalık etkinlik ödülü</button>`
    : it.merchant ? `<button class="btn primary" disabled>Gezgin tüccar getirir</button>`
    : `<button id="wBuy" class="btn primary" ${P.coins < price ? 'disabled' : ''}>${P.coins < price ? 'Yetersiz · ' : 'Al ve giy · '}${coinIco}${price}</button>`;
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
    wear(wardrobeCat, it.id);
    taskProgress('wear', 1);
    wardrobeDraft = null;
    dyeDraft = undefined;
    cheerWardrobe();
    persist();
    toast(`${it.name} giyildi`);
    renderWardrobe();
  };
}
document.querySelectorAll('.seg-btn').forEach(b => { b.onclick = () => { wardrobeCat = b.dataset.cat; wardrobeDraft = null; dyeDraft = undefined; emoteDraft = null; renderWardrobe(); }; });

// Kıyafet boyama: denenen ya da giyilen parçanın renkli kısmı. Renk başına parça için bir kez ödenir.
function renderDye() {
  const id = dyeTarget(), box = $('dyeBox');
  if (!id || !dyeable(wardrobeCat, id)) { box.innerHTML = ''; return; }
  const it = WARDROBE[wardrobeCat].find(x => x.id === id), key = dyeKey(wardrobeCat, id), cur = P.dyes[key] || null;
  const sel = dyeDraft === undefined ? cur : dyeDraft;
  const owned = c => P.dyeOwned.includes(`${key}:${c}`);
  const cost = sel && !owned(sel) ? DYE_PRICE : 0;
  box.innerHTML = `<div class="sheet-sec"><b>Boya · ${it.name}</b><small>Yalnızca renkli kısmı boyar · her renk bu parça için bir kez ${coinIco}${DYE_PRICE}</small></div>
    <div class="swatches"><button class="sw def${sel === null ? ' sel' : ''}" data-dye="" title="Kendi rengi"></button>${COLORS.map(c => `<button class="sw${sel === c.id ? ' sel' : ''}" data-dye="${c.id}" title="${c.name}" style="background:${c.hex}">${owned(c.id) ? '' : `<span class="lock">${ui('lock')}</span>`}</button>`).join('')}</div>
    ${sel !== cur ? `<button id="dyeApply" class="btn ${cost ? 'primary' : 'green'}" ${P.coins < cost ? 'disabled' : ''}>${cost ? `${P.coins < cost ? 'Yetersiz · ' : 'Boya · '}${coinIco}${cost}` : 'Uygula'}</button>` : ''}`;
  box.querySelectorAll('[data-dye]').forEach(b => { b.onclick = () => { dyeDraft = b.dataset.dye || null; renderDye(); }; });
  if ($('dyeApply')) $('dyeApply').onclick = () => {
    if (P.coins < cost) return;
    P.coins -= cost;
    if (cost) P.dyeOwned.push(`${key}:${sel}`);
    if (sel) P.dyes[key] = sel;
    else delete P.dyes[key];
    if (P.outfit[wardrobeCat] === id) wear(wardrobeCat, id);
    dyeDraft = undefined;
    cheerWardrobe();
    persist();
    cost ? sfx.coin() : sfx.ui();
    track('outfit_dye', { slot: wardrobeCat, item: id, color: sel, price: cost });
    toast(sel ? `${it.name} boyandı` : `${it.name} kendi renginde`);
    renderWardrobe();
  };
}

// İfadeler: satın alınan ifadeyi Pofi köyde ona dokununca yapar.
function renderEmotes() {
  $('dyeBox').innerHTML = '';
  $('wardrobeList').innerHTML = EMOTES.map(e => {
    const have = P.emotes.includes(e.id);
    return `<button class="w-item${emoteDraft === e.id ? ' sel' : ''}${have ? '' : ' locked'}" data-em="${e.id}"><canvas></canvas><span>${e.name}</span><span class="price">${have ? 'Sahip' : `${coinIco}${e.price}`}</span></button>`;
  }).join('');
  $('wardrobeList').querySelectorAll('[data-em]').forEach(btn => {
    const id = btn.dataset.em;
    drawPofi(fitCanvas(btn.querySelector('canvas'), 64, 64), 32, 63, 44, { outfit: P.outfit, ...emotePose(id, 0.2) });
    btn.onclick = () => { emoteDraft = id; renderEmotes(); };
  });
  const e = EMOTES.find(x => x.id === emoteDraft), have = e && P.emotes.includes(e.id);
  $('wardrobeAction').classList.toggle('floating', !!e && !have);
  if (!e || have) {
    $('wardrobeAction').innerHTML = `<p class="sheet-note" style="flex:1">${have ? `${e.name} sende. ` : 'Bir ifadeye dokun, Pofi göstersin. '}Köyde Pofi'ye dokununca öğrendiği ifadeleri sırayla yapar.</p>`;
    return;
  }
  $('wardrobeAction').innerHTML = `<button id="wCancel" class="btn link">Vazgeç</button><button id="wBuy" class="btn primary" ${P.coins < e.price ? 'disabled' : ''}>${P.coins < e.price ? 'Yetersiz · ' : 'Öğret · '}${coinIco}${e.price}</button>`;
  $('wCancel').onclick = () => { emoteDraft = null; renderEmotes(); };
  $('wBuy').onclick = () => {
    if (P.coins < e.price) return;
    P.coins -= e.price;
    P.emotes.push(e.id);
    persist();
    sfx.coin();
    track('emote_buy', { id: e.id, price: e.price });
    toast(`Pofi artık "${e.name}" yapıyor · köyde ona dokun`);
    renderEmotes();
  };
}

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
  const pool = DAILY_TASKS.filter(t => (!t.needs || P.village[t.needs]) && (!t.pet || P.pet));
  const t = pool[Math.floor(Math.random() * pool.length)];
  P.task = { day: dateKey(), type: t.type, need: t.need, have: 0, giver: here[Math.floor(Math.random() * here.length)].id, claimed: false };
  save(P);
  return P.task;
}
const taskDone = () => { const t = P.task; return !!t && t.day === dateKey() && !t.claimed && t.have >= t.need; };
function taskProgress(type, n) {
  guestProgress(type, n);
  questProgress(type, n);
  const t = ensureTask();
  if (!t || t.claimed || t.type !== type || t.have >= t.need) return;
  t.have = Math.min(t.need, t.have + n);
  if (t.have >= t.need) toast(`${VILLAGERS.find(v => v.id === t.giver).name}: "İşim bitti, köye uğra!"`);
}
function taskMarker() {
  const t = ensureTask();
  return t && !t.claimed ? { giver: t.giver, done: t.have >= t.need } : null;
}

// Dostluk: konuşma, iş ve kakao ikramı puan verir; her eşikte bir hikâye bölümü açılır.
const friendOf = id => P.friends[id] || (P.friends[id] = { pts: 0, ch: 0, talk: '', gift: '' });
const friendLv = f => FRIEND.levels.filter(n => f.pts >= n).length;
const friendReady = id => { const f = friendOf(id); return f.ch < friendLv(f); };
function friendAdd(id, n) {
  const f = friendOf(id), before = friendLv(f);
  f.pts += n;
  save(P);
  if (friendLv(f) > before) toast(`${VILLAGERS.find(v => v.id === id).name} sana bir şey anlatmak istiyor`, 2600);
}
const friendHearts = f => [0, 1, 2].map(i => (i < friendLv(f) ? '♥' : '♡')).join('');

// Köylünün sözü: çoğunlukla kendi karakterinden, ara sıra köyde olan bitenden.
function villagerLine(v) {
  const phase = phaseOf(hourNow()), own = VILLAGER_LIFE[v.id].lines, pick = a => a[Math.floor(Math.random() * a.length)];
  if (phase === 'night') return pick(VILLAGER_LINES.night);
  const news = [];
  if (P.pet) news.push(petFedToday(P) ? `${petInfo().name} ne kadar tatlı!` : `${petInfo().name} uykulu, karnı aç sanki.`);
  if (merchantToday() && (P.land || 1) >= 2) news.push('Kaptan Mors limanda!');
  const building = PROJECTS.find(p => { const st = projectStage(P, p); return st > 0 && st < 3; });
  if (building) news.push(`${building.name} yükseliyor!`);
  news.push({ heavy: 'Bu hafta kar durmuyor!', clear: 'Ayaz var ama güneş güzel.', blizzard: 'Tipi başladı, sıkı giyin!', aurora: 'Geceleri gökyüzüne bak!' }[weatherNow().id]);
  const r = Math.random();
  return r < 0.3 ? pick(news) : r < 0.45 ? pick(VILLAGER_LINES[phase]) : pick(own);
}

function talkTo(id) {
  const v = VILLAGERS.find(x => x.id === id), t = ensureTask(), f = friendOf(id);
  if (t && !t.claimed && t.giver === id) { showTask(); return; }
  const ord = orderList().find(o => !o.done && o.giver === id);
  if (ord && orderReady(ord)) { sfx.ui(); showOrders(); return; }
  if (ord && !(village.speechOn() && village.speech.id === id)) {
    village.say(id, `${v.name}: "${ord.n} ${ORDERS.kinds[ord.kind].name} lazım. ${ord.kind === 'cups' ? 'Stant dolunca' : 'İskele tutunca'} getirir misin?"`);
    sfx.ui();
    return;
  }
  // yeni hikâyesi varsa ya da konuşurken bir daha dokunulursa dostluk penceresi açılır
  if (friendReady(id) || (village.speechOn() && village.speech.id === id)) { showFriend(id); return; }
  if (f.talk !== dateKey()) { f.talk = dateKey(); friendAdd(id, FRIEND.talkPts); village.heartsAt(id); }
  village.say(id, `${v.name}: ${villagerLine(v)}`);
  sfx.ui();
}

function showFriend(id) {
  const v = VILLAGERS.find(x => x.id === id), life = VILLAGER_LIFE[id], f = friendOf(id), lv = friendLv(f), next = FRIEND.levels[lv];
  const prev = lv ? FRIEND.levels[lv - 1] : 0, cups = Math.floor(cocoaNow()), gifted = f.gift === dateKey();
  openOverlay(`
    <span class="new-tag">DOSTLUK</span>
    <canvas class="intro-icon" id="frFace"></canvas>
    <h2>${v.name}</h2>
    <small class="breakdown">${life.trait}</small>
    <div class="fr-hearts">${friendHearts(f)}</div>
    ${next ? `<div class="progress"><div style="width:${((f.pts - prev) / (next - prev)) * 100}%;height:100%;background:#ff5f8f"></div></div><small class="breakdown">Sonraki hikâyeye ${next - f.pts} dostluk puanı · günlük sohbet +${FRIEND.talkPts}, iş +${FRIEND.taskPts}, ikram +${FRIEND.giftPts}</small>` : '<small class="breakdown">En yakın dostun oldu</small>'}
    <div class="fr-stories">${life.story.map((s, i) => (i < f.ch ? `<button class="chip-btn" data-st="${i}">${s.title}</button>` : i < lv ? `<button class="btn green" data-st="${i}">Yeni hikâye: ${s.title}</button>` : `<span class="chip-btn fr-lock">${ui('lock')} Hikâye ${i + 1}</span>`)).join('')}</div>
    ${P.village.cocoa ? `<button id="frGift" class="btn secondary" ${gifted || cups < FRIEND.giftCups ? 'disabled' : ''}>${gifted ? 'Bugün kakao ikram ettin ✓' : `☕ Kakao ikram et · ${FRIEND.giftCups} fincan`}</button>` : ''}
    <button id="frClose" class="btn link">Kapat</button>`);
  drawPofi(fitCanvas($('frFace'), 84, 84), 42, 82, 64, { outfit: v.outfit, happy: friendReady(id) });
  $('frClose').onclick = closeOverlay;
  $('overlayCard').querySelectorAll('[data-st]').forEach(b => { b.onclick = () => showStory(id, +b.dataset.st); });
  if ($('frGift')) $('frGift').onclick = () => {
    if (f.gift === dateKey() || cocoaNow() < FRIEND.giftCups) return;
    bankCocoa();
    P.cocoaCups -= FRIEND.giftCups;
    f.gift = dateKey();
    friendAdd(id, FRIEND.giftPts);
    persist();
    sfx.reward();
    village.heartsAt(id);
    track('villager_gift', { id });
    showFriend(id);
    renderCocoa();
  };
}

function showStory(id, i) {
  const v = VILLAGERS.find(x => x.id === id), s = VILLAGER_LIFE[id].story[i], f = friendOf(id), fresh = i === f.ch, r = FRIEND.rewards[i];
  openOverlay(`
    <span class="new-tag">${v.name.toLocaleUpperCase('tr-TR')} ANLATIYOR</span>
    <canvas class="intro-icon" id="frFace"></canvas>
    <h2>${s.title}</h2>
    <p class="fr-text">${s.text}</p>
    ${fresh ? `<div class="reward-row">${rewardHtml(r)}</div>` : ''}
    <button id="stOk" class="btn green big">${fresh ? 'Teşekkürler!' : 'Geri'}</button>`);
  drawPofi(fitCanvas($('frFace'), 84, 84), 42, 82, 64, { outfit: v.outfit, happy: true });
  $('stOk').onclick = () => {
    if (fresh && f.ch === i) {
      f.ch = i + 1;
      giveReward(r);
      persist();
      sfx.reward();
      track('villager_story', { id, chapter: i + 1 });
    }
    showFriend(id);
  };
}

function showTask() {
  const t = ensureTask(), v = VILLAGERS.find(x => x.id === t.giver), def = DAILY_TASKS.find(d => d.type === t.type), life = VILLAGER_LIFE[v.id];
  const done = t.have >= t.need;
  openOverlay(`
    <span class="new-tag">GÜNLÜK İŞ</span>
    <canvas class="intro-icon" id="taskFace"></canvas>
    <h2>${v.name}</h2>
    <p>${done ? life.thanks : `${life.ask} <b>${def.text}</b>.`}</p>
    <div class="progress"><div style="width:${Math.round((t.have / t.need) * 100)}%;height:100%;background:var(--green)"></div></div>
    <small class="breakdown">${t.have}/${t.need} · ödül ${coinIco}${TASK_REWARD.coins} + ${flakeIco}${TASK_REWARD.flakes}</small>
    ${done ? '<button id="tkClaim" class="btn green">Ödülü al</button>' : ''}
    <button id="tkFriend" class="btn link">Dostluk · ${friendHearts(friendOf(v.id))}</button>
    <button id="tkClose" class="btn link">Kapat</button>`);
  $('tkFriend').onclick = () => showFriend(v.id);
  drawPofi(fitCanvas($('taskFace'), 84, 84), 42, 82, 64, { outfit: v.outfit, happy: done });
  $('tkClose').onclick = closeOverlay;
  if ($('tkClaim')) $('tkClaim').onclick = () => {
    if (t.claimed || t.have < t.need) return;
    t.claimed = true;
    friendAdd(t.giver, FRIEND.taskPts);
    P.coins += TASK_REWARD.coins;
    P.flakes += TASK_REWARD.flakes;
    const ev = ensureEvent(P);
    addTokens(P, EVENT_TOKENS.task);
    persist();
    closeOverlay();
    sfx.reward();
    track('task_claim', { type: t.type, giver: t.giver });
    toast(`+${TASK_REWARD.coins} coin, +${TASK_REWARD.flakes} kar tanesi, ${ev.token} +${EVENT_TOKENS.task} jeton`);
  };
}

// ---------- etkinlik konuğu Foki ----------
// Her gün bir iş verir (köylü işinden ayrı); ödülü haftanın jetonu. İş etkinlik haftası boyunca P.event'te durur.
function ensureGuest() {
  ensureEvent(P);
  const g = P.event.guest;
  if (g?.day === dateKey()) return g;
  const pool = GUEST_TASKS.filter(t => !t.needs || P.village[t.needs]);
  const t = pool[Math.floor(Math.random() * pool.length)];
  P.event.guest = { day: dateKey(), type: t.type, need: t.need, have: 0, claimed: false };
  save(P);
  return P.event.guest;
}
const guestDone = () => { const g = P.event?.guest; return !!g && g.day === dateKey() && !g.claimed && g.have >= g.need; };
function guestProgress(type, n) {
  const g = ensureGuest();
  if (g.claimed || g.type !== type || g.have >= g.need) return;
  g.have = Math.min(g.need, g.have + n);
  if (g.have >= g.need) toast('Foki: "İşim bitti, çadıra uğra!"');
}
// Köy çizimi için: tema rengi, jeton ve konuğun işaret durumu.
function eventVillage() {
  const ev = ensureEvent(P), g = P.event.guest?.day === dateKey() ? P.event.guest : null;
  return { id: ev.id, token: ev.token, color: ev.color, art: !!ev.art, guest: g?.claimed ? null : { done: !!g && g.have >= g.need } };
}

function showGuest() {
  const ev = ensureEvent(P), g = ensureGuest(), def = GUEST_TASKS.find(d => d.type === g.type), done = g.have >= g.need;
  openOverlay(`
    <span class="new-tag" style="background:${ev.color}">ETKİNLİK KONUĞU</span>
    <div class="ev-guest-face">${tokenHtml(ev)}</div>
    <h2>Foki</h2>
    <p>${g.claimed ? `Bugünkü işimiz bitti, yarın yine gel! ${ev.name} sürüyor.` : done ? 'Süpersin! İşte jetonların.' : `${ev.name} için köyüne geldim! Bugün bana yardım eder misin? <b>${def.text}</b>.`}</p>
    ${g.claimed ? '' : `<div class="progress"><div style="width:${Math.round((g.have / g.need) * 100)}%;height:100%;background:${ev.color}"></div></div>
    <small class="breakdown">${g.have}/${g.need} · ödül ${ev.token} ${GUEST_REWARD} jeton</small>`}
    ${done && !g.claimed ? '<button id="gClaim" class="btn green">Jetonları al</button>' : ''}
    <button id="gEvent" class="btn secondary">Etkinliğe git</button>
    <button id="gClose" class="btn link">Kapat</button>`);
  $('gClose').onclick = closeOverlay;
  $('gEvent').onclick = () => { closeOverlay(); showScreen('event'); };
  if ($('gClaim')) $('gClaim').onclick = () => {
    if (g.claimed || g.have < g.need) return;
    g.claimed = true;
    addTokens(P, GUEST_REWARD);
    persist();
    closeOverlay();
    sfx.reward();
    track('guest_claim', { event: ev.id, type: g.type });
    toast(`${ev.token} +${GUEST_REWARD} jeton`);
    updateWallet();
  };
}

function showVillagers() {
  const vl = villageLevel(P), here = villagersHere().map(v => v.id);
  const rows = VILLAGERS.map(v => {
    const price = discounted(P, v.price);
    const act = here.includes(v.id) ? `<button class="btn secondary fr-open" data-fr="${v.id}" aria-label="${v.name} ile dostluk: ${friendLv(friendOf(v.id))}/3 kalp">${friendHearts(friendOf(v.id))}${friendReady(v.id) ? '<i class="dot"></i>' : ''}</button>`
      : !v.price ? `<small class="muted">Köy Lv${v.vl}</small>`
      : vl < v.vl ? `<small class="muted">Köy Lv${v.vl}</small>`
      : `<button class="btn green" data-inv="${v.id}" ${P.coins < price ? 'disabled' : ''}>${coinIco}${price}</button>`;
    return `<div class="ev-step"><canvas class="vill-face" data-face="${v.id}"></canvas><span class="rw"><b>${v.name}</b>${v.kid ? '&nbsp;<small>çocuk</small>' : ''}</span>${act}</div>`;
  }).join('');
  openOverlay(`
    <span class="new-tag">KÖYLÜLER</span>
    <h2>Köyü şenlendir</h2>
    <p>Köylüler günün saatine göre yaşar: sabah balığa çıkar, öğlen kakao kuyruğuna girer, akşam ateş başında toplanır, gece uyur. Her gün biri senden küçük bir iş ister. Kalplere dokun: dostluk ilerledikçe sana hikâyelerini anlatırlar.</p>
    <div class="ev-track">${rows}</div>
    <button id="vlClose" class="btn link">Kapat</button>`);
  $('overlayCard').querySelectorAll('[data-face]').forEach(cv => {
    const v = VILLAGERS.find(x => x.id === cv.dataset.face);
    drawPofi(fitCanvas(cv, 36, 36), 18, 35, v.kid ? 24 : 30, { outfit: v.outfit });
  });
  $('vlClose').onclick = closeOverlay;
  $('overlayCard').querySelectorAll('[data-fr]').forEach(b => { b.onclick = () => showFriend(b.dataset.fr); });
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
// Süs seçenekleri: coin'le alınanlar ve etkinlikten kazanılmış hatıra süsleri.
const decorList = () => DECOR_ITEMS.filter(d => !(d.event || d.merchant) || P.decorOwned.includes(d.id));

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
      <div class="wardrobe-grid">${decorList().map(d => `<button class="w-item${cur === d.id ? ' on' : ''}${pv === d.id ? ' sel' : ''}" data-dec="${d.id}"><canvas></canvas><span>${d.name}</span><span class="price">${cur === d.id ? 'Yerleşik' : d.event ? 'Hatıra' : d.merchant ? 'Nadir' : `${coinIco}${discounted(P, d.price)}`}</span></button>`).join('')}</div>`;
    const it = pv && DECOR_ITEMS.find(d => d.id === pv), price = it ? discounted(P, it.price) : 0;
    action = `<div class="sheet-actions">
      ${cur ? '<button id="dcRemove" class="btn link">Kaldır</button>' : '<button id="dcBack" class="btn link">Başka yer</button>'}
      ${it ? `<button id="dcBuy" class="btn primary" ${P.coins < price ? 'disabled' : ''}>${it.event || it.merchant ? 'Yerleştir' : `${P.coins < price ? 'Yetersiz coin · ' : 'Satın al ve yerleştir · '}${coinIco}${price}`}</button>` : '<button id="dcDone" class="btn green">Bitti</button>'}
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
    taskProgress('decor', 1);
    track('decor_buy', { slot, item: it.id, price });
    toast(`${it.name} yerleştirildi`);
    renderDecor();
  };
}

// ---------- iç mekân (GDD 12.3) ----------
// Yuvaya dokun → kademeyi seç → odada önizle → "Satın al ve yerleştir". Kademeler sırayla alınır.
let room = null; // { id, slot, draft: önizlenen kademe ya da null }
const homesReady = () => Object.keys(INTERIOR).filter(id => interiorReady(P, id));

// Pofi önce köyde kapıya yürür, sonra içeride kapıdan odaya girer.
function goInside(id) {
  if (!INTERIOR[id] || !P.village[id]) return;
  if (!village.walkIn(() => enterInterior(id))) enterInterior(id);
}

// Çıkış: Pofi odada tünele yürür, köyde kapıdan çıkar.
function exitRoom() {
  if (!room || room.anim?.out) return;
  const t = performance.now() / 1000;
  room.draft = null;
  room.anim = { out: true, t0: t, x0: 0.56 + 0.08 * Math.sin(t * 0.5) };
  sfx.ui();
}
function leaveRoom() {
  room = null;
  showScreen('village');
  village.sx = village.sxT = 0;
  village.nightStay = village.clock + 8;
  village.walkOut();
}
$('roomExit').onclick = exitRoom;
// kapı tünelinin kendisine dokunmak da dışarı çıkarır
$('roomCanvas').addEventListener('click', e => {
  const r = $('roomCanvas').getBoundingClientRect(), fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
  if (fx > 0.87 && fy > 0.44 && fy < 0.8) exitRoom();
});

function enterInterior(id) {
  if (!INTERIOR[id] || !P.village[id]) return;
  closeSheet();
  const slots = INTERIOR[id].slots;
  // coin'i yeten ilk yuvadan, yoksa ilk boş yuvadan başla
  const first = slots.find(s => { const t = slotTier(P, id, s.id); return t < 3 && P.coins >= discounted(P, s.items[t].price); })
    || slots.find(s => slotTier(P, id, s.id) < 3) || slots[0];
  room = { id, slot: first.id, draft: null, anim: { out: false, t0: performance.now() / 1000 } };
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
  $('roomAction').classList.toggle('floating', !!d);
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
    room.cheer = performance.now() / 1000 + 1.6;
    persist();
    sfx.reward();
    track('interior_buy', { id: room.id, slot: slot.id, tier: d, price });
    toast(`${it.name} yerleştirildi`);
    renderInterior();
  };
}

// ---------- köy: coin harcama yerleri (pazar takası, gezgin tüccar, gazete, tilki, projeler) ----------
const fmt = n => n.toLocaleString('tr-TR');
const collarHex = () => (P.pet?.collar ? COLORS.find(c => c.id === P.pet.collar)?.hex || null : null);
const petKind = id => PET.kinds.find(k => k.id === (id || P.pet?.kind));
const petInfo = () => P.pet.names[P.pet.kind];
const gazetteUnread = () => P.gazette.read !== gazetteIssue();

// Köy listesinin üstündeki kartlar
function townCards() {
  const land = P.land || 1, cards = [];
  const nm = nextMerchant(), here = !!merchantToday();
  if (P.level > 5) cards.push(`<button class="b-card district town" data-town="gazette"><b>${ui('gazette')} Köy Gazetesi · Sayı ${gazetteIssue()}</b><small>${land >= 2 ? (here ? 'Gezgin tüccar bugün limanda' : nm ? `Tüccar ${dayName(nm)} günü geliyor` : '') : 'Haftanın haberleri, zor leveli ve bilmecesi'}</small><span class="act">${gazetteUnread() ? 'Yeni sayı!' : 'Oku'}</span>${gazetteUnread() ? '<i class="dot"></i>' : ''}</button>`);
  if (land >= 2) cards.push(`<button class="b-card district town${here ? ' ready' : ''}" data-town="merchant"><b>${ui('merchant')} Gezgin tüccar</b><small>${here ? 'Kaptan Mors limanda! Nadir kıyafet, süs ve gizemli paket' : 'Haftada 1-2 gün limana uğrar; günü gazetede'}</small><span class="act">${here ? 'Tezgâha git' : nm ? `${dayName(nm)} gelir` : 'Yolda'}</span>${here ? '<i class="dot"></i>' : ''}</button>`);
  if (P.village.market) cards.push(`<button class="b-card district town" data-town="market"><b>${ui('market')} Balık pazarı · kar tanesi</b><small>Coin ile kar tanesi; fiyat bugün aldıkça artar</small><span class="act">1 ${flakeIco} = ${coinIco}${fmt(flakePrice(tradeN(P)))}</span></button>`);
  if (ordersOn()) {
    const list = orderList(), left = list.filter(o => !o.done).length, rd = ordersReady();
    const first = list.find(o => !o.done), fv = first && VILLAGERS.find(x => x.id === first.giver);
    cards.unshift(`<button class="b-card district town${rd ? ' ready' : ''}" data-town="orders"><b>${ui('villagers')} Sipariş panosu · ${list.length - left}/${list.length}</b><small>${left ? `${fv.name} ${first.n} ${ORDERS.kinds[first.kind].name} istiyor${left > 1 ? ` · ${left - 1} sipariş daha` : ''}` : 'Bugünün siparişleri tamam · yarın yenileri gelir'}</small><span class="act">${rd ? `${rd} hazır` : left ? 'Bak' : '✓'}</span>${rd ? '<i class="dot"></i>' : ''}</button>`);
  }
  if (festOn()) {
    const F = ensureFestival(), th = festTheme(), cl = festClaimable(), st = festStage(F.pts), next = FESTIVAL.stages[st];
    cards.splice(ordersOn() ? 1 : 0, 0, `<button class="b-card district town${cl ? ' ready' : ''}" data-town="festival"><b>${ui('event')} ${th.name}</b>
      <div class="progress slim"><div style="width:${Math.min(100, (F.pts / festMax()) * 100)}%"></div></div>
      <small>Köy festivali · ${F.pts}/${festMax()} puan · ay sonuna ${festDaysLeft()} gün${next ? ` · sıradaki ödül ${next.pts} puanda` : ' · tamamlandı'}</small>
      <span class="act">${cl ? 'Ödül hazır' : next ? 'Katıl' : '✓'}</span>${cl ? '<i class="dot"></i>' : ''}</button>`);
  }
  const vl = villageLevel(P);
  if (P.pet) {
    const fed = petFedToday(P), canFeed = !fed && petFood() >= PET.feedFish;
    cards.push(`<button class="b-card district town${canFeed ? ' ready' : ''}" data-town="pet"><b>${ui('pet')} ${esc(petInfo().name)}</b><small>${fed ? 'Karnı tok, Pofi\'nin peşinde' : canFeed ? 'Acıktı · balıklarından ver' : `Uykulu · ${petFood()}/${PET.feedFish} balığın var`}</small><span class="act">${canFeed ? 'Besle' : 'Bak'}</span>${canFeed ? '<i class="dot"></i>' : ''}</button>`);
  } else if (petUnlocked(P, vl)) {
    cards.push(`<button class="b-card district town" data-town="pet"><b>${ui('pet')} Evcil dost</b><small>Tilki, tavşan ya da baykuş: Pofi'nin peşinden yürür, beslenince hediye getirir</small><span class="act">Sahiplen ${coinIco}${fmt(PET.kinds[0].price)}+</span></button>`);
  }
  return cards.join('');
}

function projectCards() {
  if ((P.land || 1) < 3) return '';
  return PROJECTS.map(p => {
    const spent = projectSpent(P, p), st = projectStage(P, p);
    return `<button class="b-card town${st === 3 ? '' : ' proj'}" data-town="proj:${p.id}"><b>${ui('project')} ${p.name}</b>
      <div class="progress slim"><div style="width:${Math.min(100, (spent / p.cost) * 100)}%"></div></div>
      <small>${st === 3 ? `Tamamlandı · ${p.text}` : `${fmt(spent)}/${fmt(p.cost)} · bitince: ${p.text}`}</small>
      <span class="act">${st === 3 ? '✓' : st ? PROJECT_STAGES[st - 1] : 'Başla'}</span></button>`;
  }).join('');
}

function openTown(k) {
  if (k === 'gazette') showGazette();
  else if (k === 'merchant') { village.goPanel(1); showMerchant(); }
  else if (k === 'market') showMarket();
  else if (k === 'pet') showPet();
  else if (k === 'orders') showOrders();
  else if (k === 'festival') showFestival();
  else if (k.startsWith('proj:')) { village.goPanel(2); showProject(k.slice(5)); }
}

// Ana ekranda tek satırlık köy haberi: tüccar limanda > yeni gazete > evcil dost acıktı
// "Yeni" kartları: bir özellik açıldığında bir kez anlatılır. Oyuncu köy sekmelerinde ya da mağazada kendisi aramak zorunda kalmaz.
// İlk yapı: hiç yapı yokken kar tanesi önerilen yapıya yetince bir kez (denetimde 20 level oynayıp yapı kurmayan oyuncu görüldü).
const firstBuild = () => { const s = suggestion(P); return !Object.keys(P.village).length && s && P.flakes >= s.cost ? s.b : null; };
const UNLOCKS = [
  { id: 'firstBuild', when: () => !!firstBuild(), ico: 'flake', title: 'İlk yapını kur', text: () => `Kar tanelerin yetiyor: ${firstBuild()?.name || 'ilk yapını'} kurabilirsin! Yapılar köyünü büyütür ve kalıcı bonus verir. Level bitirdikçe yeni kar tanesi kazanırsın.`, go: () => { villageTab = 'build'; showScreen('village'); const b = firstBuild(); if (b) openSheet(b.id); } },
  { id: 'album', when: () => P.level >= ALBUM.from, ico: 'fish', title: 'Nadir balıklar', text: 'Bazı levellerde parıltılı bir balık çıkar. Topla, Görevler ekranındaki albümüne girer; seti tamamlayınca ödül var.' },
  { id: 'pet', when: () => !P.pet && petUnlocked(P, villageLevel(P)), ico: 'pet', title: 'Evcil dost', text: 'Artık bir dost sahiplenebilirsin. Köyde Pofi\'nin peşinden yürür, beslenince hediye getirir.', go: () => { showScreen('village'); showPet(); } },
  { id: 'harbor', when: () => (P.land || 1) === 1 && villageLevel(P) >= DISTRICTS[1].vl, ico: 'merchant', title: 'Buz Limanı', text: 'Köy büyüdü, yeni araziyi açabilirsin. Limana gezgin tüccar da uğrar.', go: () => { villageTab = 'build'; showScreen('village'); village.goPanel(1); } },
  { id: 'trade', when: () => !!P.village.market, ico: 'market', title: 'Kar tanesi takası', text: 'Balık pazarında coin ile kar tanesi alabilirsin. Fiyat gün içinde aldıkça artar, ertesi gün başa döner.' },
  { id: 'forest', when: () => (P.land || 1) === 2 && villageLevel(P) >= DISTRICTS[2].vl, ico: 'project', title: 'Çam Ormanı', text: 'Yeni arazi açılabilir. Köy projelerine coin yatırırsın, biten proje kalıcı bonus verir.', go: () => { villageTab = 'build'; showScreen('village'); village.goPanel(2); } },
  { id: 'sides', when: () => P.level > SIDE_LEVELS.every, ico: 'tab_village', title: 'Yan yollar', text: 'Haritada yolun kenarında tabelalar belirdi. Her biri farklı hedefli, isteğe bağlı bir bulmaca: eve dön, kasayı yerleştir, buzları kır.', go: () => showScreen('map') },
  { id: 'orders', when: ordersOn, ico: 'villagers', title: 'Sipariş panosu', text: 'Köylüler her gün sipariş veriyor: stanttan kakao, iskeleden balık. Teslim et, coin ve dostluk kazan. Köyde siparişi olan köylünün üstünde işaret çıkar.', go: () => { showScreen('village'); showOrders(); } },
  { id: 'festival', when: festOn, ico: 'event', title: 'Köy festivali', text: 'Her ay yeni bir festival! Stanttaki kakaoyu, iskelenin balığını ya da coin bağışla, köy puan toplasın. Son aşamada nadir bir süs kazanırsın.', go: () => { showScreen('village'); showFestival(); } },
  { id: 'master', when: () => P.level > MASTER_LEVELS[0].after, ico: 'castle', title: 'Usta kalesi', text: 'Haritada bölge sonunda bir buz kalesi belirdi. Çok zor ama ödülü ve rozeti özel.', go: () => showScreen('map') },
];
// Eski kayıtlar: zaten açık olanlar için kart çıkmaz.
if (P.unlocksSeen === null) { P.unlocksSeen = UNLOCKS.filter(u => u.when()).map(u => u.id); save(P); }
// Bekleyen kart varsa gösterir ve true döner (aynı anda bir tane).
// ---------- Pofi'nin yolu: bölge sonu hikâye kartları ----------
const storyPassed = i => !!P.stars[STORY[i].after];
// Eski kayıtlar: kart çıkmadan önce geçilmiş bölümler okunmuş sayılır (Görevler'den okunabilir).
if (P.storySeen === null) { P.storySeen = STORY.map((s, i) => i).filter(storyPassed); save(P); }
function showRoad(i, reread = false) {
  const s = STORY[i], reg = MAP_REGIONS[i];
  openOverlay(`
    <span class="new-tag">POFİ'NİN YOLU · BÖLÜM ${i + 1}</span>
    <h2>${s.title}</h2>
    <small class="breakdown">${reg.name}</small>
    <canvas id="stPofi" class="story-pofi"></canvas>
    <div class="story-text">${s.lines.map(l => `<p>${l}</p>`).join('')}</div>
    <p class="story-next">${s.next}</p>
    <button id="stOk" class="btn primary big">${reread ? 'Kapat' : 'Devam'}</button>`, 'story');
  $('overlayCard').style.setProperty('--st-top', reg.top);
  $('overlayCard').style.setProperty('--st-bot', reg.bottom);
  drawPofi(fitCanvas($('stPofi'), 96, 96), 48, 92, 76, { outfit: P.outfit, happy: i === STORY.length - 1, wave: 0.4 });
  $('stOk').onclick = closeOverlay;
  if (!reread) track('story_chapter', { chapter: i + 1 });
}
// Bekleyen bölüm varsa gösterir ve true döner (tanıtım kartlarıyla aynı sırada, ekran başına bir kart).
function showPendingRoad() {
  const i = STORY.findIndex((s, k) => storyPassed(k) && !P.storySeen.includes(k));
  if (i < 0) return false;
  P.storySeen.push(i);
  save(P);
  sfx.reward();
  showRoad(i);
  return true;
}

function showUnlock() {
  if (overlayOpen()) return false;
  if (showPendingRoad()) return true;
  const u = UNLOCKS.find(x => !P.unlocksSeen.includes(x.id) && x.when());
  if (!u) return false;
  P.unlocksSeen.push(u.id);
  save(P);
  sfx.reward();
  track('unlock_card', { id: u.id });
  openOverlay(`
    <span class="new-tag">YENİ</span>
    <h2>${u.title}</h2>
    <div class="unlock-ico">${ui(u.ico)}</div>
    <p>${typeof u.text === 'function' ? u.text() : u.text}</p>
    <button id="ulOk" class="btn green big">${u.go ? 'Göster' : 'Tamam'}</button>
    ${u.go ? '<button id="ulLater" class="btn link">Sonra</button>' : ''}`);
  $('ulOk').onclick = () => { closeOverlay(); u.go?.(); };
  if (u.go) $('ulLater').onclick = closeOverlay;
  return true;
}

// "Sen yokken": oyuna dönünce köyde biriken şeylerin özeti. Yeni para birimi yok, olanı görünür kılar.
// Level ortasında ya da başka pencere açıkken çıkmaz; bir sonraki ana ekranda çıkar.
let awayFrom = null;
function noteAway() {
  if (P.lastSeen && Date.now() - P.lastSeen >= AWAY_MIN * 6e4) awayFrom = P.lastSeen;
  P.lastSeen = Date.now();
  save(P);
}
function awayLines() {
  const lines = [], cups = Math.floor(cocoaNow());
  if (cups >= 1) lines.push(`☕ Kakao standında <b>${fmt(cups)} fincan</b> birikti${cups >= cocoaCap() ? ' (stant doldu)' : ''}`);
  if (P.pet && !petFedToday(P)) {
    const n = Math.floor(pierNow()), name = esc(petInfo().name);
    if (n > 0) lines.push(`${ui('market')} İskele <b>${n} balık</b> tuttu`);
    lines.push(petFood() >= PET.feedFish ? `${ui('pet')} ${name} acıktı, besleyebilirsin` : `${ui('pet')} ${name} uyukluyor`);
  }
  const rd = ordersOn() ? ordersReady() : 0;
  if (rd) lines.push(`${ui('villagers')} Sipariş panosunda <b>${rd} sipariş</b> teslime hazır`);
  if (merchantToday() && (P.land || 1) >= 2) lines.push(`${ui('merchant')} Gezgin tüccar bugün limanda`);
  if (P.level > 5 && gazetteUnread()) lines.push(`${ui('gazette')} Köy Gazetesi'nin ${gazetteIssue()}. sayısı çıktı`);
  return lines;
}
function showAway() {
  if (!awayFrom || screen !== 'home' || overlayOpen()) return;
  const mins = Math.round((Date.now() - awayFrom) / 6e4), lines = awayLines();
  awayFrom = null;
  if (!lines.length) return;
  const h = Math.floor(mins / 60), when = h >= 24 ? `${Math.floor(h / 24)} gün` : h ? `${h} saat` : `${mins} dakika`;
  openOverlay(`
    <span class="new-tag">SEN YOKKEN</span>
    <h2>Köyde neler oldu?</h2>
    <p>${when} yoktun.</p>
    <div class="away-list">${lines.map(l => `<div>${l}</div>`).join('')}</div>
    <button id="awGo" class="btn green big">Köye git</button>
    <button id="awClose" class="btn link">Sonra</button>`);
  $('awClose').onclick = closeOverlay;
  $('awGo').onclick = () => { closeOverlay(); villageTab = 'life'; showScreen('village'); };
  track('away_card', { mins, lines: lines.length });
}
// Yeni sürüm yayına alındıysa ana sayfada küçük bir şerit çıkar (köyün üstü bölge adıyla dolu); oyun sırasında araya girmez.
// "Yenile" kaydı yazıp sayfayı yeniden yükler (servis çalışanı kodu ağdan alır). Çarpı bu oturumluk gizler.
let updReady = false, updHidden = false;
function renderUpdBar() {
  if (!$('updBar')) return;
  $('updBar').classList.toggle('hidden', !updReady || updHidden || screen !== 'home');
}
if ($('updBar')) {
  $('updGo').onclick = () => { track('update_reload'); persist(); location.reload(); };
  $('updX').onclick = () => { updHidden = true; renderUpdBar(); };
  window.__pofiUpdateCheck = watchUpdates(() => { updReady = true; track('update_seen'); renderUpdBar(); });
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') { P.lastSeen = Date.now(); save(P); return; }
  noteAway();
  if (screen === 'home') setTimeout(showAway, 400);
});

function renderTownStrip() {
  $('btnGazette').classList.toggle('hidden', P.level <= 5);
  $('dotGazette').classList.toggle('hidden', !gazetteUnread());
  const el = $('townStrip');
  let html = '', go = null;
  if (merchantToday() && (P.land || 1) >= 2) { html = `${ui('merchant')} <b>Gezgin tüccar bugün limanda</b>`; go = 'merchant'; }
  else if (gazetteUnread() && P.level > 5) { html = `${ui('gazette')} <b>Köy Gazetesi · Sayı ${gazetteIssue()} çıktı</b>`; go = 'gazette'; }
  else if (P.pet && !petFedToday(P) && petFood() >= PET.feedFish) { html = `${ui('pet')} <b>${esc(petInfo().name)} acıktı</b>`; go = 'pet'; }
  else if (festOn() && festClaimable()) { html = `${ui('event')} <b>${festTheme().name}: ödül hazır</b>`; go = 'festival'; }
  else if (ordersOn() && ordersReady()) { html = `${ui('villagers')} <b>${ordersReady()} sipariş teslime hazır</b>`; go = 'orders'; }
  el.classList.toggle('hidden', !go);
  if (!go) return;
  el.innerHTML = `${html}<span>›</span>`;
  el.onclick = () => {
    if (go === 'gazette') { showGazette(); return; }
    showScreen('village');
    openTown(go);
  };
}

// Balık pazarı: coin → 1 kar tanesi. Gün içinde her alımda FLAKE_TRADE.mult kat pahalanır.
function showMarket() {
  const n = tradeN(P), price = flakePrice(n);
  openOverlay(`
    <span class="new-tag">BALIK PAZARI</span>
    <h2>Kar tanesi takası</h2>
    <p>Coin ver, kar tanesi al. Fiyat bugün her alımda artar; yarın yine ${coinIco}${ek(FLAKE_TRADE.base, 'den')} başlar.</p>
    <div class="reward-row"><span class="pill big">${flakeIco}<b>+1</b></span></div>
    <small class="breakdown">Bugün aldığın: ${n} · sonraki: ${coinIco}${fmt(flakePrice(n + 1))} · elindeki: ${P.flakes} ${flakeIco}</small>
    <button id="mkBuy" class="btn green big" ${P.coins < price ? 'disabled' : ''}>${P.coins < price ? 'Yetersiz coin · ' : 'Al · '}${coinIco}${fmt(price)}</button>
    <button id="mkClose" class="btn link">Kapat</button>`);
  $('mkClose').onclick = closeOverlay;
  $('mkBuy').onclick = () => {
    if (P.coins < price) return;
    P.coins -= price;
    P.flakes += 1;
    P.flakeTrade = { day: dateKey(), n: n + 1 };
    persist();
    sfx.coin();
    track('flake_trade', { n: n + 1, price });
    toast(`+1 kar tanesi · elinde ${P.flakes}`);
    showMarket();
    if (screen === 'village') { renderVillage(); if (sheet) renderSheet(); }
  };
}

// ---------- gezgin tüccar ----------
const MC_SUB = {
  outfit: 'Nadir kıyafet · gardıropta yok',
  decor: 'Nadir süs · süs yerlerine konur',
  toy: 'Evcil dostunun oyuncağı',
  bait: `Sonraki ${MERCHANT.bait.levels} levelde nadir balık daha sık (yalnızca albüm)`,
  mystery: 'Kar tanesi, ipucu, nadir süs ya da kıyafet',
  flakes: 'Pazardan ucuz, bu gelişe özel',
};
const MC_ICO = { bait: '🎣', mystery: '<i class="ui ui-gift"></i>', flakes: '<i class="ui ui-flake"></i>' };

function showMerchant() {
  const m = merchantToday();
  if (!m) {
    const d = nextMerchant();
    toast(d ? `Gezgin tüccar ${dayName(d)} günü limana gelecek` : 'Tüccar yolda', 2400);
    return;
  }
  if (P.merchant?.visit !== m.visit) P.merchant = { visit: m.visit, bought: {} };
  const stock = merchantStock(m.no, P);
  const rows = stock.map(it => {
    const n = P.merchant.bought[it.key] || 0, left = it.max - n;
    const sub = it.needPet ? 'Önce bir evcil dost sahiplen' : it.kind === 'flakes' ? `${MC_SUB.flakes} · ${left}/${it.max}` : it.kind === 'bait' && P.bait ? `${MC_SUB.bait} · ${P.bait} level kaldı` : MC_SUB[it.kind];
    const btn = it.owned ? '<button class="btn secondary" disabled>Sende var</button>'
      : left <= 0 ? '<button class="btn secondary" disabled>Tükendi</button>'
      : `<button class="btn green" data-mc="${it.key}" ${P.coins < it.price || it.needPet ? 'disabled' : ''}>${coinIco}${fmt(it.price)}</button>`;
    const ico = MC_ICO[it.kind] ? `<div class="si-icon mc">${MC_ICO[it.kind]}</div>` : `<canvas class="mc-ico" data-mci="${it.key}"></canvas>`;
    return `<div class="shop-item">${ico}<div class="si-text"><b>${it.name}</b><small>${sub}</small></div>${btn}</div>`;
  }).join('');
  openOverlay(`
    <span class="new-tag">GEZGİN TÜCCAR</span>
    <h2>Kaptan Mors</h2>
    <p>"Uzak kıyılardan getirdim! Bugün limandayım, yarın yine yoldayım."</p>
    <div class="mc-list">${rows}</div>
    <small class="breakdown">Kaçırdığın ürünler birkaç hafta sonra yine gelir.</small>
    <button id="mcClose" class="btn link">Kapat</button>`);
  for (const it of stock) {
    const cv = $('overlayCard').querySelector(`[data-mci="${it.key}"]`);
    if (!cv) continue;
    const ctx = fitCanvas(cv, 44, 44);
    // kıyafet: Pofi'nin üst yarısı yakından (şapka ya da atkı görünsün)
    if (it.kind === 'outfit') drawPofi(ctx, 22, it.slot === 'hat' ? 74 : 62, it.slot === 'hat' ? 62 : 52, { outfit: { hat: 'none', scarf: 'none', [it.slot]: it.id } });
    else if (it.kind === 'decor') drawDecor(ctx, 22, 40, 360, it.id, 0, 0);
    else if (it.kind === 'toy') drawToy(ctx, 22, 38, 600, it.id);
  }
  $('mcClose').onclick = closeOverlay;
  $('overlayCard').querySelectorAll('[data-mc]').forEach(b => { b.onclick = () => buyMerchant(stock.find(x => x.key === b.dataset.mc)); });
}

function buyMerchant(it) {
  if (!it || P.coins < it.price || !merchantToday()) return;
  const n = P.merchant.bought[it.key] || 0;
  if (n >= it.max || it.owned || it.needPet) return;
  P.coins -= it.price;
  P.merchant.bought[it.key] = n + 1;
  let msg = `${it.name} alındı`;
  if (it.kind === 'outfit') { P.owned[it.slot].push(it.id); msg = `${it.name} gardıropta!`; }
  else if (it.kind === 'decor') { P.decorOwned.push(it.id); msg = `${it.name} süs listesinde, istediğin yere koy`; }
  else if (it.kind === 'toy') { P.pet.toys.push(it.id); P.pet.toy = it.id; msg = `${petInfo().name} yeni oyuncağına bayıldı!`; }
  else if (it.kind === 'bait') { P.bait += MERCHANT.bait.levels; msg = `Balık yemi: ${P.bait} level boyunca nadir balık daha sık`; }
  else if (it.kind === 'flakes') { P.flakes += 1; msg = `+1 kar tanesi · elinde ${P.flakes}`; }
  else if (it.kind === 'mystery') msg = openMystery();
  persist();
  sfx.coin();
  P.ach.merchant = (P.ach.merchant || 0) + 1;
  save(P);
  track('merchant_buy', { item: it.kind, id: it.id || null, price: it.price });
  toast(msg, 2600);
  showMerchant();
  if (screen === 'village') renderVillage();
}

// Gizemli paket: coin dışında bir şey çıkar. Nadir kıyafet ve süs, sahip olunmayanlardan seçilir.
function openMystery() {
  const r = Math.random();
  const outfits = MERCHANT_OUTFITS.filter(o => !P.owned[o.slot].includes(o.id)), decor = MERCHANT_DECOR.filter(d => !P.decorOwned.includes(d.id));
  if (r < 0.1 && outfits.length) {
    const o = outfits[Math.floor(Math.random() * outfits.length)];
    P.owned[o.slot].push(o.id);
    return `🎁 Paketten nadir kıyafet çıktı: ${o.name}!`;
  }
  if (r < 0.28 && decor.length) {
    const d = decor[Math.floor(Math.random() * decor.length)];
    P.decorOwned.push(d.id);
    return `🎁 Paketten nadir süs çıktı: ${d.name}!`;
  }
  if (r < 0.68) {
    const n = 3 + Math.floor(Math.random() * 3);
    P.flakes += n;
    return `🎁 Paketten ${n} kar tanesi çıktı`;
  }
  const h = 4 + Math.floor(Math.random() * 2);
  P.hints += h;
  return `🎁 Paketten ${h} ipucu çıktı`;
}

// ---------- Köy Gazetesi ----------
// Haftanın zor leveli: oynanmış, zor ya da çok zor olup 3 yıldızı eksik bir level (sayıya göre sabit).
let gzHard = null;
function gazetteHard() {
  const issue = gazetteIssue();
  if (gzHard?.issue === issue && gzHard.level === P.level) return gzHard.n;
  let seed = issue * 7919, n = 0;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const lo = Math.max(5, P.level - 150), hi = P.level - 1;
  for (let k = 0; k < 60 && hi > lo; k++) {
    const c = lo + Math.floor(rnd() * (hi - lo + 1)), d = levelDef(c);
    if ((d.tier === 'hard' || d.tier === 'veryhard') && (P.stars[c] || 0) < 3) { n = c; break; }
  }
  gzHard = { issue, level: P.level, n: n || P.level };
  return gzHard.n;
}

// Gazete için: en çok dostluk puanı olan köylü (hiç puan yoksa null) ve kusursuz bitirilen level sayısı.
function bestFriend() {
  const here = villagersHere().filter(v => (P.friends[v.id]?.pts || 0) > 0);
  return here.sort((a, b) => P.friends[b.id].pts - P.friends[a.id].pts)[0] || null;
}
const perfectCount = () => Object.values(P.stars).filter(v => v === 3).length;
function gazetteNews() {
  const issue = gazetteIssue(), vname = P.villageName || 'Köyümüz', vs = villagersHere().map(v => v.name);
  const who = k => vs.length ? vs[(issue + k) % vs.length] : 'Pofi';
  const lines = [
    P.ach.cups > 0 && `${vname} bu hafta da kakao kokuyor: bugüne dek ${fmt(P.ach.cups)} fincan satıldı.`,
    `${who(0)} iskelede balık tutarken parıltılı bir balık gördüğüne yemin ediyor. Albümde şimdilik ${ALL_FISH.filter(f => P.album[f.id]).length} nadir balık var.`,
    P.pet && `${petInfo().name} meydanda kartopu kovalarken görüldü. Köylüler çok sevdi.`,
    ...PROJECTS.map(p => {
      const st = projectStage(P, p);
      return st === 3 ? `${p.name} açıldı! ${p.text}.` : st > 0 ? `${p.name} inşaatı sürüyor: %${Math.floor((projectSpent(P, p) / p.cost) * 100)} tamam.` : null;
    }),
    P.level > 10 && `Pofi ${P.level - 1}. leveli geçti; ${vname} gurur duyuyor.`,
    vs.length > 1 && `${who(1)} ile ${who(2)} kardan adam yarışması için havuç biriktiriyor.`,
    P.village.lights && 'Fener dizisi geceleri köyü aydınlatıyor; gece yürüyüşleri çok sevildi.',
    `Hava durumu: ${weatherNow().name}. Atkınızı unutmayın!`,
    // oyuncunun kendi verisinden haberler
    P.ach.orders > 0 && `Sipariş panosu hiç boş kalmıyor: Pofi bugüne dek köylülere ${fmt(P.ach.orders)} sipariş teslim etti.`,
    bestFriend() && `${bestFriend().name} ile Pofi'nin dostluğu dillere destan (${friendHearts(friendOf(bestFriend().id))}). İkisini en çok iskelede birlikte görüyoruz.`,
    P.dailyPuzzleStreak >= 3 && P.dailyPuzzleDay >= yesterdayKey() && `Günün bulmacası serisi ${P.dailyPuzzleStreak} güne ulaştı. Bulmaca köşemizin en sadık okuru belli oldu.`,
    P.pet && (P.ach.feeds || 0) > 0 && `${petInfo().name} bugüne dek ${fmt(P.ach.feeds)} kez beslendi; köyün en tombul dostu seçilmeye aday.`,
    (P.storySeen?.length || 0) > 0 && P.storySeen.length < STORY.length && `Pofi'nin haritasında sıradaki durak: ${MAP_REGIONS[P.storySeen.length].name}. Köylüler yol hikâyelerini merakla bekliyor.`,
    perfectCount() >= 10 && `Pofi ${fmt(perfectCount())} leveli kusursuz bitirdi. Buz pistinde ondan hızlısını gören olmadı.`,
    (P.ach.merchant || 0) > 0 && `Kaptan Mors: "Bu köyle şimdiye dek ${P.ach.merchant} kez alışveriş yaptık. Kuzeyde en sevdiğim liman burası."`,
    festOn() && (ensureFestival().pts > 0
      ? `${festTheme().name} sürüyor: köy festivale %${Math.floor((ensureFestival().pts / festMax()) * 100)} hazır, ay sonuna ${festDaysLeft()} gün var.`
      : `${festTheme().name} başladı! Köy kakao ve balık bağışı bekliyor; ay sonuna ${festDaysLeft()} gün var.`),
  ].filter(Boolean);
  // her sayıda farklı üç haber
  const out = [], n = Math.min(3, lines.length);
  for (let k = 0; k < n; k++) out.push(lines.splice((issue * 3 + k * 5) % lines.length, 1)[0]);
  return out;
}

let gzPhoto = null; // gazetenin ön sayfa fotoğrafı, sayı başına bir kez çekilir
function showGazette() {
  const issue = gazetteIssue(), now = new Date(), land = P.land || 1;
  const next = currentEvent(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7));
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = merchantWeek(now).filter(d => d >= midnight), nextDays = merchantWeek(now, 1);
  const rumor = days.length ? merchantStock(merchantToday(days[0])?.no ?? 0, P)[0] : null;
  const when = d => (d.getTime() === midnight.getTime() ? 'bugün' : `${dayName(d)} günü`);
  const merchantText = land < 2
    ? 'Kaptan Mors\'un teknesi Buz Limanı açılınca köyümüze de uğrayacak.'
    : `${days.length ? `Kaptan Mors bu hafta ${days.map(when).join(' ve ')} limanda. Söylentiye göre yanında ${rumor.name} var.` : 'Kaptan Mors bu hafta uğradı ve yola çıktı.'} Gelecek hafta: ${nextDays.map(dayName).join(' ve ')}.`;
  const monday = new Date(midnight);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const hard = gazetteHard(), hardDone = P.gazette.hard === issue, riddle = RIDDLES[issue % RIDDLES.length];
  const vname = P.villageName || 'Köyümüz', news = gazetteNews();
  // manşet: haftanın en büyük olayı. Ön sayfa fotoğrafı köyün o anki hâli.
  const headline = merchantToday() && land >= 2 ? 'Kaptan Mors bugün limanda!' : news.length ? `${esc(vname)} büyümeye devam ediyor` : `${esc(vname)} kışa hazır`;
  if (gzPhoto?.issue !== issue) { try { gzPhoto = { issue, url: shootVillage().toDataURL('image/jpeg', 0.75) }; } catch { gzPhoto = null; } }
  const answered = P.gazette.riddle === issue;
  openOverlay(`
    <header class="nw-mast">${art('gazette_header') ? '<img src="assets/art/gazette_header.webp" alt="">' : ''}<div class="nw-title">Köy Gazetesi</div></header>
    <div class="nw-meta"><span>Sayı ${issue}</span><span>${monday.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span><span>Fiyatı: bir kartopu</span></div>
    <h3 class="nw-head">${headline}</h3>
    ${gzPhoto ? `<figure class="nw-photo"><img src="${gzPhoto.url}" alt="Köyün fotoğrafı"><figcaption>${esc(vname)}, Köy seviyesi ${villageLevel(P)}. Hava: ${weatherNow().name}.</figcaption></figure>` : ''}
    <div class="nw-cols">
      <section class="nw-sec"><h4>Köyden haberler</h4>${news.map(l => `<p>${esc(l)}</p>`).join('')}</section>
      <section class="nw-sec"><h4>Liman köşesi</h4><p>${merchantText}</p><h4>Gelecek hafta</h4><p><b>${next.name}.</b> ${next.text}</p></section>
    </div>
    <div class="nw-row">
      <section class="nw-box"><h4>Haftanın zor leveli</h4><p>Level ${hard}${hardDone ? '' : `<br>3 yıldıza ${GAZETTE.hardBonus} coin`}</p>${hardDone ? '<span class="nw-stamp">Çözüldü</span>' : '<button id="gzPlay" class="btn secondary">Oyna</button>'}</section>
      <section class="nw-box"><h4>Bilmece</h4><p>${riddle.q}</p><div id="gzAns" class="nw-answer${answered ? ' up' : ''}">${riddle.a}</div>${answered ? '' : '<button id="gzReveal" class="nw-flip">Gazeteyi çevir</button>'}</section>
    </div>
    <button id="gzClose" class="btn green">Gazeteyi katla</button>`, 'news');
  if (P.gazette.read !== issue) { P.gazette.read = issue; persist(); track('gazette_read', { issue }); }
  $('gzClose').onclick = () => { closeOverlay(); if (screen === 'village') renderVillage(); };
  if ($('gzPlay')) $('gzPlay').onclick = () => { closeOverlay(); playFromMap = true; startLevel(hard); };
  if ($('gzReveal')) $('gzReveal').onclick = () => { P.gazette.riddle = issue; persist(); $('gzAns').classList.add('up'); $('gzReveal').remove(); };
}

// ---------- evcil dostlar: her tür ayrı sahiplenilir, biri köyde Pofi'nin yanında gezer ----------
let petDraft = null; // { collar } satın almadan önce önizleme

// Tür seçimi: sahip olunana dokununca o gezer, olmayana dokununca sahiplenme penceresi açılır.
function petKindRow(sel) {
  return `<div class="pet-kinds">${PET.kinds.map(k => {
    const own = P.pet?.kinds.includes(k.id);
    return `<button class="pet-kind${k.id === sel ? ' sel' : ''}" data-kind="${k.id}"><canvas></canvas><b>${own ? esc(P.pet.names[k.id].name) : k.name}</b><small>${own ? (P.pet.kind === k.id ? 'Yanında' : 'Köyde') : `${coinIco}${fmt(k.price)}`}</small></button>`;
  }).join('')}</div>`;
}
function bindPetKinds() {
  $('overlayCard').querySelectorAll('[data-kind]').forEach(b => {
    b.onclick = () => {
      const id = b.dataset.kind;
      if (!P.pet?.kinds.includes(id)) { showPetAdopt(id); return; }
      if (P.pet.kind !== id) {
        P.pet.kind = id;
        persist();
        if (screen === 'village') renderVillage();
      }
      showPet();
    };
  });
}

function showPetAdopt(id) {
  const k = petKind(id), ok = petUnlocked(P, villageLevel(P)), cant = !ok || P.coins < k.price;
  openOverlay(`
    <span class="new-tag">YENİ DOST</span>
    <h2>${k.name}</h2>
    <canvas id="petCv" class="pet-cv"></canvas>
    ${petKindRow(id)}
    <p>${P.pet ? 'Köye yeni bir dost gelir. Dostlarından biri Pofi\'nin yanında gezer, istediğin zaman değiştirirsin.' : `Köyde Pofi'nin peşinden yürür, iglonun önünde uyur. Günde bir kez levellerde topladığın balıklardan ${PET.feedFish} tane verirsen o gün sana küçük bir hediye getirir.`}</p>
    ${P.pet ? '' : '<small class="breakdown">Beslemezsen yalnızca uykulu olur; hiçbir şey kaybetmezsin.</small>'}
    <button id="petAdopt" class="btn green big" ${cant ? 'disabled' : ''}>${!ok ? `Köy Lv${PET.vl} ya da level ${ek(PET.level, 'den')} sonra` : `${P.coins < k.price ? 'Yetersiz coin' : 'Sahiplen'} · ${coinIco}${fmt(k.price)}`}</button>
    <button id="petClose" class="btn link">${P.pet ? 'Vazgeç' : 'Kapat'}</button>`);
  petLoop(() => ({ kind: id, pose: 'happy', collar: null }));
  bindPetKinds();
  $('petClose').onclick = () => (P.pet ? showPet() : closeOverlay());
  $('petAdopt').onclick = () => {
    if (cant) return;
    P.coins -= k.price;
    if (!P.pet) P.pet = { kind: id, kinds: [], names: {}, collar: null, bed: 0, toys: [], toy: null, collars: [], fedDay: '' };
    P.pet.kinds.push(id);
    P.pet.names[id] = { name: k.petName, named: false };
    P.pet.kind = id;
    persist();
    sfx.reward();
    track('pet_adopt', { kind: id, price: k.price });
    showPetName();
    if (screen === 'village') renderVillage();
  };
}

function showPet() {
  if (!P.pet) { showPetAdopt(PET.kinds[0].id); return; }
  const p = P.pet, info = petInfo(), d = petDraft || (petDraft = { collar: p.collar });
  const fed = petFedToday(P), fish = petFood(), canFeed = !fed && fish >= PET.feedFish, fromPier = Math.floor(pierNow());
  const cost = d.collar && !p.collars.includes(d.collar) ? PET.collarPrice : 0;
  const changed = d.collar !== p.collar, bedNext = PET.beds[p.bed || 0];
  openOverlay(`
    <span class="new-tag">EVCİL DOST</span>
    <h2>${esc(info.name)}</h2>
    <canvas id="petCv" class="pet-cv"></canvas>
    ${petKindRow(p.kind)}
    <p>${fed ? `Karnı tok! Bugün ${p.gift || 'bir hediye'} getirdi. Nadir balık şansı bugün +${Math.round(PET.rareBonus * 100)} puan.` : canFeed ? `Acıktı. ${fish} balığın var${fromPier ? ` (${fromPier} tanesi iskeleden)` : ''}; ${PET.feedFish} tanesini ver, karşılığında bir hediye getirsin.` : `Uykulu. ${PET.feedFish} balık gerekli, şu an ${fish} tane var. Levellerde topla${P.village.pier ? ' ya da iskele tutsun' : ''}, sonra besle.`}</p>
    ${fed ? '' : `<button id="petFeed" class="btn green big" ${canFeed ? '' : 'disabled'}>Besle · ${PET.feedFish} 🐟</button>`}

    <div class="sheet-sec"><b>Tasma</b><small>Renk başına ${coinIco}${PET.collarPrice}</small></div>
    <div class="swatches"><button class="sw def${d.collar === null ? ' sel' : ''}" data-collar="" title="Tasmasız"></button>${COLORS.map(c => `<button class="sw${d.collar === c.id ? ' sel' : ''}" data-collar="${c.id}" title="${c.name}" style="background:${c.hex}">${p.collars.includes(c.id) ? '' : `<span class="lock">${ui('lock')}</span>`}</button>`).join('')}</div>
    ${changed ? `<button id="petLook" class="btn ${cost ? 'primary' : 'green'}" ${P.coins < cost ? 'disabled' : ''}>${cost ? `${P.coins < cost ? 'Yetersiz · ' : 'Satın al · '}${coinIco}${cost}` : 'Uygula'}</button>` : ''}
    <div class="sheet-sec"><b>Yatak</b><small>İglonun önünde · ${p.bed ? PET.beds[p.bed - 1].name : 'henüz yok'}</small></div>
    ${bedNext ? `<button id="petBed" class="btn secondary" ${P.coins < bedNext.price ? 'disabled' : ''}>${bedNext.name} · ${coinIco}${fmt(bedNext.price)}</button>` : '<small class="breakdown">En güzel yatak onda ✓</small>'}
    <div class="sheet-sec"><b>Oyuncak</b><small>Gezgin tüccar getirir</small></div>
    ${p.toys.length ? `<div class="chips">${p.toys.map(id => `<button class="chip-btn${p.toy === id ? ' sel' : ''}" data-toy="${id}">${PET_TOYS.find(t => t.id === id).name}</button>`).join('')}</div>` : '<small class="breakdown">Henüz oyuncağı yok.</small>'}
    <div class="sheet-actions"><button id="petRename" class="btn link">${info.named ? `İsim değiştir · ${coinIco}${PET.renamePrice}` : 'İsim ver · ücretsiz'}</button><button id="petClose" class="btn green">Kapat</button></div>`);
  // Beslenmemiş dost uyur; tasma denenirken görünsün diye ayağa kalkar.
  petLoop(() => ({ pose: fed ? 'happy' : changed ? 'stand' : 'sleep', sleepy: !fed, collar: d.collar ? COLORS.find(c => c.id === d.collar).hex : null, toy: p.toy }));
  bindPetKinds();
  $('petClose').onclick = () => { petDraft = null; closeOverlay(); };
  if ($('petFeed')) $('petFeed').onclick = () => {
    if (!canFeed) return;
    // önce bugün levellerde toplananlar sayılır, eksiği iskeleden gelir
    bankPier();
    P.pierFish = Math.max(0, P.pierFish - Math.max(0, PET.feedFish - fishToday(P)));
    const g = PET.gifts, tot = g.reduce((a, x) => a + x.w, 0);
    let r = Math.random() * tot, k = 0;
    while (r >= g[k].w) r -= g[k++].w;
    const pick = g[k], span = v => (Array.isArray(v) ? v[0] + Math.floor(Math.random() * (v[1] - v[0] + 1)) : v);
    let text;
    if (pick.coins) { const n = span(pick.coins); P.coins += n; text = `${n} coin`; }
    else if (pick.hints) { const n = span(pick.hints); P.hints += n; text = `${n} ipucu`; }
    else { const n = span(pick.flakes); P.flakes += n; text = `${n} kar tanesi`; }
    p.fedDay = dateKey();
    p.gift = text;
    persist();
    sfx.reward();
    P.ach.feeds = (P.ach.feeds || 0) + 1;
    taskProgress('feed', 1);
    save(P);
    track('pet_feed', { gift: text });
    village.petCheer = village.clock + 3;
    toast(`${info.name} karnını doyurdu ve sana ${text} getirdi!`, 2800);
    showPet();
    if (screen === 'village') renderVillage();
  };

  $('overlayCard').querySelectorAll('[data-collar]').forEach(b => { b.onclick = () => { d.collar = b.dataset.collar || null; showPet(); }; });
  $('overlayCard').querySelectorAll('[data-toy]').forEach(b => { b.onclick = () => { p.toy = p.toy === b.dataset.toy ? null : b.dataset.toy; persist(); showPet(); }; });
  if ($('petLook')) $('petLook').onclick = () => {
    if (P.coins < cost) return;
    P.coins -= cost;
    if (cost) p.collars.push(d.collar);
    p.collar = d.collar;
    persist();
    cost ? sfx.coin() : sfx.ui();
    track('pet_look', { collar: d.collar, spent: cost });
    toast(`${info.name} yeni görünümüyle çok şık`);
    showPet();
  };
  if ($('petBed')) $('petBed').onclick = () => {
    if (P.coins < bedNext.price) return;
    P.coins -= bedNext.price;
    p.bed = (p.bed || 0) + 1;
    persist();
    sfx.coin();
    track('pet_bed', { tier: p.bed, price: bedNext.price });
    toast(`${bedNext.name} iglonun önüne kondu`);
    showPet();
  };
  $('petRename').onclick = showPetName;
}

// Evcil dostun ismi: her türde ilk isim ücretsiz, sonradan değiştirmek PET.renamePrice coin (köy ismiyle aynı kural).
function showPetName() {
  const p = petInfo(), first = !p.named, price = first ? 0 : PET.renamePrice, def = petKind().petName;
  openOverlay(`
    <span class="new-tag">${first ? 'YENİ DOST' : 'İSİM DEĞİŞTİR'}</span>
    <h2>${first ? 'Dostuna bir isim ver' : `${esc(p.name)} için yeni isim`}</h2>
    <canvas id="petCv" class="pet-cv"></canvas>
    <p>${first ? `İlk isim ücretsiz. Sonradan değiştirmek ${coinIco}${PET.renamePrice}.` : `İsmi değiştirmek ${coinIco}${price}.`}</p>
    <label class="field light"><input id="pnInput" maxlength="12" placeholder="${esc(def)}" value="${esc(p.name)}" autocomplete="off"></label>
    <small class="breakdown">2-12 karakter</small>
    <button id="pnSave" class="btn green" ${P.coins < price ? 'disabled' : ''}>${first ? 'Kaydet' : P.coins < price ? `Yetersiz coin · ${coinIco}${price}` : `Değiştir · ${coinIco}${price}`}</button>
    <button id="pnClose" class="btn link">${first ? 'Sonra' : 'Vazgeç'}</button>`);
  petLoop(() => ({ pose: 'happy' }));
  const input = $('pnInput');
  const check = () => {
    const name = cleanName(input.value).slice(0, 12);
    // ilk isimde varsayılan isim de seçilebilir; sonradan aynı isme para ödetilmez
    const ok = name.length >= 2 && (first || name !== p.name) && P.coins >= price;
    $('pnSave').disabled = !ok;
    return ok ? name : null;
  };
  input.oninput = check;
  check();
  $('pnClose').onclick = showPet;
  $('pnSave').onclick = () => {
    const name = check();
    if (!name) return;
    P.coins -= price;
    p.name = name;
    p.named = true;
    persist();
    sfx.reward();
    track('pet_name', { first, price });
    toast(first ? `${name} artık köyde! Balık topla, besle.` : `Yeni adı: ${name}`, 2600);
    showPet();
    if (screen === 'village') renderVillage();
  };
}

// Pencere açıkken evcil dost önizlemesi ve tür küçük resimleri canlı çizilir.
function petLoop(opts) {
  const cv = $('petCv');
  (function tick(now) {
    if (!cv.isConnected || !overlayOpen()) return;
    const o = opts(), ctx = fitCanvas(cv, 160, 110), t = now / 1000;
    if (o.toy) drawToy(ctx, 122, 104, 700, o.toy, t);
    drawPet(ctx, 74, 104, 76, { kind: P.pet?.kind, t, collar: collarHex(), ...o });
    $('overlayCard').querySelectorAll('[data-kind]').forEach(b => drawPet(fitCanvas(b.querySelector('canvas'), 60, 50), 30, 48, 40, { kind: b.dataset.kind, pose: 'stand', t }));
    requestAnimationFrame(tick);
  })(performance.now());
}

// ---------- köy projeleri (Çam Ormanı) ----------
function showProject(id) {
  const p = PROJECTS.find(x => x.id === id);
  if (!p) return;
  const spent = projectSpent(P, p), st = projectStage(P, p), left = p.cost - spent;
  const steps = [...PROJECT_STEPS.filter(s => s < left), left];
  openOverlay(`
    <span class="new-tag">KÖY PROJESİ</span>
    <h2>${p.name}</h2>
    <p>${st === 3 ? `Tamamlandı! ${p.text}.` : `Köylüler hep birlikte yapıyor. Coin'i parça parça yatır; bitince kalıcı bonus: <b>${p.text}</b>.`}</p>
    <div class="proj-stages">${PROJECT_STAGES.map((s, i) => `<span class="${st > i ? 'on' : ''}">${s}</span>`).join('')}</div>
    <div class="progress"><div style="width:${(spent / p.cost) * 100}%;height:100%;background:var(--green)"></div></div>
    <small class="breakdown">${fmt(spent)} / ${fmt(p.cost)} coin</small>
    ${st === 3 ? '' : `<div class="proj-btns">${steps.map(s => `<button class="btn ${s === left ? 'primary' : 'secondary'}" data-inv="${s}" ${P.coins < s ? 'disabled' : ''}>${s === left ? 'Kalanı' : '+'} ${coinIco}${fmt(s)}</button>`).join('')}</div>`}
    <button id="pjClose" class="btn link">Kapat</button>`);
  $('pjClose').onclick = closeOverlay;
  $('overlayCard').querySelectorAll('[data-inv]').forEach(b => {
    b.onclick = () => {
      const n = +b.dataset.inv;
      if (P.coins < n) return;
      P.coins -= n;
      P.projects[p.id] = spent + n;
      const st2 = projectStage(P, p);
      persist();
      sfx.coin();
      track('project_invest', { id: p.id, amount: n, total: P.projects[p.id] });
      if (screen === 'village') renderVillage();
      if (st2 === 3) {
        // bitince pencere kapanır, kamera yapıya döner ve yapının üstünde parıltı patlar
        sfx.win();
        toast(`${p.name} tamamlandı! ${p.text}`, 3200);
        closeOverlay();
        village.goPanel(2);
        village.sparkleAt(p.at[0], p.at[1] - 0.08);
        return;
      }
      if (st2 > st) { sfx.reward(); toast(`${p.name}: ${st2 === 1 ? 'temeli atıldı' : 'yarıya geldi'}`, 2400); }
      showProject(id);
    };
  });
}

// Köyde Pofi'ye dokununca öğrendiği ifadeleri sırayla yapar.
let emoteIdx = 0;
function heroEmote() {
  if (!P.emotes.length) { toast('Pofi\'ye ifade öğret: Gardırop › İfade', 2400); return; }
  village.emote = { id: P.emotes[emoteIdx++ % P.emotes.length], t0: village.clock };
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
    item(['coins', ui('coin')], 'Ücretsiz coin', `Video izle, ${ECON.freeCoinAmount} coin kazan · bugün ${left}/${ECON.freeCoinPerDay}`,
      `<button id="btnFreeCoin" class="btn primary ad" ${left <= 0 ? 'disabled' : ''}>+${ECON.freeCoinAmount}</button>`),
    '<h3>İpucu</h3>',
    item(['hint', `${ui('hint')}<small>×1</small>`], 'İpucu', 'Sıradaki doğru hamleyi gösterir',
      `<button class="btn green" data-hints="1" data-cost="${hintPrice()}" ${P.coins < hintPrice() ? 'disabled' : ''}>${coinIco}${hintPrice()}</button>`),
    item(['hint', `${ui('hint')}<small>×5</small>`], 'İpucu paketi', `Bugün aldıkça pahalanır · yarın ${ECON.hintPack5Cost} coin'den başlar`,
      `<button class="btn green" data-hints="5" data-cost="${packPrice()}" ${P.coins < packPrice() ? 'disabled' : ''}>${coinIco}${packPrice()}</button>`),
    '<h3>Güçlendiriciler</h3>',
    ...ACTIVE_BOOSTERS.map(b => item(['boost', boostIcon(b)], b.name, `${b.text} · elinde ${P.boosters[b.id] || 0} · bugün aldıkça pahalanır`,
      `<button class="btn green" data-boost="${b.id}" ${P.coins < boostPrice(b, false) ? 'disabled' : ''}>${coinIco}${boostPrice(b, false)}</button>`)),
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
      if (!buyHints(n, cost, 'shop')) return;
      toast(`+${n} ipucu · toplam ${P.hints}`);
      renderShop();
    };
  });
  $('shopList').querySelectorAll('[data-boost]').forEach(btn => {
    btn.onclick = () => {
      const b = BOOSTERS.find(x => x.id === btn.dataset.boost);
      const price = boostPrice(b, false);
      if (P.coins < price) return;
      P.coins -= price;
      P.boosters[b.id] = (P.boosters[b.id] || 0) + 1;
      rampUp(b.id);
      persist();
      sfx.coin();
      track('booster_buy', { id: b.id, price, where: 'shop' });
      toast(`${b.name} alındı · elinde ${P.boosters[b.id]}`);
      renderShop();
      updateWallet();
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
    setTimeout(showAway, 500);
  };
  $('drAd').onclick = async () => take((await showRewarded('daily_reward_x2')) ? 2 : 1);
  $('drTake').onclick = () => take(1);
}

function renderDailyButtons() {
  const dr = dailyRewardState();
  $('dotDaily').classList.toggle('hidden', dr.claimedToday);
  $('dailySub').textContent = dr.claimedToday ? `Yarın: Gün ${(dr.day % 7) + 1}` : `Gün ${dr.day} hazır!`;
  const tot = totalStars(), chestReady = Math.floor(tot / STAR_CHEST.every) > P.starChests, ac = achClaimable();
  $('mapSub').textContent = chestReady ? `⭐ ${tot} · 🎁 hazır!` : `⭐ ${tot} · 🎁 ${tot - P.starChests * STAR_CHEST.every}/${STAR_CHEST.every}`;
  $('dotMap').classList.toggle('hidden', !chestReady);
  const q = ensureQuests(), qDone = q.list.filter(x => x.have >= x.need).length, qReady = questReady();
  $('achSub').textContent = ac + qReady ? `${ac + qReady} ödül hazır!` : `Bugün ${qDone}/${q.list.length} görev`;
  $('dotAch').classList.toggle('hidden', !(ac + qReady));
  const dp = dailyPuzzleState();
  $('btnDailyPuzzle').classList.toggle('muted-q', !dp.unlocked || dp.done);
  $('dotDailyPuzzle').classList.toggle('hidden', !dp.unlocked || dp.done);
  $('dpSub').textContent = !dp.unlocked ? `Level ${ek(DAILY_PUZZLE.unlockLevel, 'den')} sonra`
    : dp.done ? `Tamam · seri ${dp.streak}`
    : `Seri ${dp.streak} · +${dailyPuzzleCoins(dp.streak + 1)}`;
}

// ---------- harita: geçmiş levellere dönüş ----------
// Aşağıdan yukarı kıvrılan buzlu yol. Bitirilen levellerde yıldızlar, o anki levelde Pofi durur.
// Yol bölgelerden geçer (MAP_REGIONS); kenarlarda köyün süs görselleri. Dokununca level penceresi açılır.
let playFromMap = false;
const MAP = { G: 96, TOP: 150, BOT: 170, R: 22 };
const totalStars = () => Object.values(P.stars).reduce((a, b) => a + b, 0);
const mapMax = () => Math.min(1000, Math.max(P.level + 15, 30));
const mapH = () => MAP.TOP + (mapMax() - 1) * MAP.G + MAP.BOT;
const nodeY = n => MAP.TOP + (mapMax() - n) * MAP.G;
const nodeX = (n, W) => W / 2 + Math.sin(n * 0.62) * W * 0.27;
const regionOf = n => [...MAP_REGIONS].reverse().find(r => n >= r.from);
let mapNodes = [];

let mapHop = null; // { from, to, t0 } Pofi'nin bir önceki levelden yenisine zıplaması
let mapNext = false; // level sonu Devam: harita açılınca (zıplama bitince) sıradaki levelin penceresi açılır

function openMap() {
  renderMapHead();
  const sc = $('mapScroll'), cur = Math.min(P.level, mapMax());
  // yeni açılan levele zıplama (yalnızca birkaç level ilerlendiyse; ilk açılışta ya da çok ilerideyse doğrudan)
  if (P.mapSeen && P.mapSeen < cur && (cur - P.mapSeen <= 3 || mapNext)) mapHop = { from: Math.max(P.mapSeen, cur - 3), to: cur, t0: performance.now() + 450 };
  if (mapNext) {
    mapNext = false;
    const wait = mapHop ? 450 + (mapHop.to - mapHop.from) * 550 + 250 : 500;
    setTimeout(() => { if (screen === 'map' && $('overlay').classList.contains('hidden') && !showUnlock()) showLevelPopup(cur); }, wait);
  }
  if (P.mapSeen !== cur) { P.mapSeen = cur; persist(); }
  requestAnimationFrame(() => {
    $('mapSpacer').style.height = `${Math.max(0, mapH() - sc.clientHeight)}px`;
    sc.scrollTop = Math.max(0, nodeY(mapHop ? mapHop.from : cur) - sc.clientHeight * 0.62);
  });
}

function renderMapHead() {
  const tot = totalStars(), base = P.starChests * STAR_CHEST.every, ready = Math.floor(tot / STAR_CHEST.every) > P.starChests;
  $('mapStars').textContent = `⭐ ${tot} yıldız · ${Object.keys(P.stars).length} level`;
  const miss = missingLevels().length;
  $('mapMissing').classList.toggle('hidden', !miss);
  $('mapMissing').textContent = `↻ Eksik yıldız · ${miss}`;
  $('mapBar').style.width = `${Math.min(100, ((tot - base) / STAR_CHEST.every) * 100)}%`;
  $('mapChest').disabled = !ready;
  $('mapChest').classList.toggle('ready', ready);
  const n = Math.floor(tot / STAR_CHEST.every) - P.starChests;
  $('mapChest').innerHTML = n > 1 ? `${ui('gift')} ${n} sandığı aç` : ready ? `${ui('gift')} Sandığı aç` : `${ui('gift')} ${tot - base}/${STAR_CHEST.every}`;
}

// Ödülleri topla (coin, ipucu, kar tanesi)
const addRewards = (a, r) => { for (const k of ['coins', 'hints', 'flakes']) if (r[k]) a[k] = (a[k] || 0) + r[k]; return a; };

function openStarChest() {
  const n = Math.floor(totalStars() / STAR_CHEST.every) - P.starChests;
  if (n <= 0) return;
  let r = {};
  for (let k = 0; k < n; k++) {
    const one = STAR_CHEST.rewards[P.starChests % STAR_CHEST.rewards.length];
    giveReward(one);
    r = addRewards(r, one);
    P.starChests++;
  }
  persist();
  sfx.reward();
  track('star_chest', { n: P.starChests, opened: n });
  openOverlay(`<span class="new-tag">YILDIZ SANDIĞI</span><h2>${n > 1 ? `${n} sandık açıldı!` : `${P.starChests}. sandık açıldı!`}</h2>
    <div class="reward-row">${rewardHtml(r)}</div>
    <small class="breakdown">Her ${STAR_CHEST.every} yıldızda bir sandık · eski levellerde 3 yıldız yaparak daha hızlı topla</small>
    <button id="chOk" class="btn green big">Harika</button>`);
  $('chOk').onclick = closeOverlay;
  renderMapHead();
  updateWallet();
}

// Yıldız (5 köşe) yolu
function starPath(ctx, x, y, r) {
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

function drawMap(t) {
  const sc = $('mapScroll'), W = sc.clientWidth, H = sc.clientHeight;
  if (!W || !H) return;
  const ctx = fitCanvas($('mapCanvas'), W, H), top = sc.scrollTop, max = mapMax();
  const nHi = Math.min(max, Math.ceil(max - (top - 120 - MAP.TOP) / MAP.G));
  const nLo = Math.max(1, Math.floor(max - (top + H + 120 - MAP.TOP) / MAP.G));
  ctx.save();
  ctx.translate(0, -top);
  // bölge zeminleri (geçişler yumuşak)
  MAP_REGIONS.forEach((r, i) => {
    const nextFrom = MAP_REGIONS[i + 1]?.from ?? 1e9;
    if (nextFrom - 1 < nLo - 3 || r.from > nHi + 3) return;
    const y0 = nextFrom - 1 >= max ? top - 200 : nodeY(nextFrom - 1) - MAP.G / 2, y1 = r.from === 1 ? mapH() : nodeY(r.from) + MAP.G / 2;
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, r.top);
    g.addColorStop(1, r.bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, y0, W, y1 - y0);
    if (i > 0) {
      const yb = y1, prev = MAP_REGIONS[i - 1], gb = ctx.createLinearGradient(0, yb - 70, 0, yb + 70);
      gb.addColorStop(0, r.bottom);
      gb.addColorStop(1, prev.top);
      ctx.fillStyle = gb;
      ctx.fillRect(0, yb - 70, W, 140);
    }
  });
  // kar tepecikleri
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  for (let n = nLo; n <= nHi; n++) {
    const side = Math.sin(n * 1.7) > 0 ? 1 : -1, y = nodeY(n) + MAP.G * 0.45;
    ctx.beginPath();
    ctx.ellipse(W / 2 + side * W * (0.38 + 0.08 * Math.sin(n)), y, W * 0.16, 16, 0, Math.PI, 0);
    ctx.fill();
  }
  // yol
  const seg = (stroke, width, dash, from, to) => {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.setLineDash(dash);
    ctx.beginPath();
    for (let n = from; n <= to; n++) {
      const x = nodeX(n, W), y = nodeY(n);
      if (n === from) ctx.moveTo(x, y);
      else { const px = nodeX(n - 1, W), py = nodeY(n - 1); ctx.bezierCurveTo(px, py - MAP.G / 2, x, y + MAP.G / 2, x, y); }
    }
    ctx.stroke();
    ctx.setLineDash([]);
  };
  seg('#a9c8e2', 34, [], nLo, nHi);
  seg('#f6fbff', 26, [], nLo, nHi);
  const doneTo = Math.min(nHi, P.level);
  if (doneTo > nLo) seg('#ffd166', 4, [10, 9], nLo, doneTo);
  // kenar süsleri ve bölge tabelaları
  for (let n = nLo; n <= nHi; n++) {
    const r = regionOf(n), x = nodeX(n, W), y = nodeY(n);
    if (n % 2 === 0) {
      const id = r.deco[(n / 2) % r.deco.length], dx = x > W / 2 ? W * 0.12 : W * 0.88;
      drawDecor(ctx, dx, y + MAP.G * 0.25, 430, id, t);
    }
    if (n === r.from) {
      ctx.font = '700 14px Fredoka, sans-serif';
      const tw = ctx.measureText(r.name).width + 24, sx = x > W / 2 ? W * 0.22 : W * 0.78, sy = y + MAP.G * 0.55;
      ctx.fillStyle = '#8e5a2b';
      ctx.fillRect(sx - 2, sy, 4, 22);
      ctx.fillStyle = '#c98b4f';
      roundRect(ctx, sx - tw / 2, sy - 14, tw, 26, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(r.name, sx, sy);
    }
  }
  // usta kaleleri: bölgenin son levelinin yanında, yola noktalı bir patikayla bağlı
  mapNodes = [];
  MASTER_LEVELS.forEach((m, i) => {
    if (m.after < nLo - 2 || m.after > nHi + 2 || m.after > max) return;
    const ax = nodeX(m.after, W), ay = nodeY(m.after), cx = ax > W / 2 ? W * 0.2 : W * 0.8, cy = ay + MAP.G * 0.2; // bölge tabelasının altında
    const open = !!P.stars[m.after], best = P.masters[i] || 0;
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = 5;
    ctx.setLineDash([2, 9]);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(cx, cy + 14);
    ctx.stroke();
    ctx.setLineDash([]);
    drawCastle(ctx, cx, cy, i, open, best, t);
    mapNodes.push([{ master: i }, cx, cy - 12, 34]);
  });

  // yan yollar: ana yolun kenarında tabela; ilgili level bitince açılır, bitirilmezse yol kapanmaz
  SIDES.forEach((d, i) => {
    const after = (i + 1) * SIDE_LEVELS.every;
    if (after < nLo - 2 || after > nHi + 2 || after > max) return;
    // yol bir sonraki levele hangi yöne kıvrılıyorsa tabela tersine konur; yola binmez
    const ax = nodeX(after, W), ay = nodeY(after), cx = Math.max(30, Math.min(W - 30, ax + (nodeX(after + 1, W) > ax ? -84 : 84))), cy = ay - MAP.G * 0.3, g = GOALS[d.goal];
    const open = P.level > after, best = P.sides[i] || 0;
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = 4;
    ctx.setLineDash([2, 8]);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = open ? g.color : '#c9d6e3';
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = best === 3 ? '#ffd166' : '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
    if (open && !best) { ctx.strokeStyle = `rgba(255,255,255,${0.5 + Math.sin(t * 4) * 0.4})`; ctx.beginPath(); ctx.arc(cx, cy, 25, 0, Math.PI * 2); ctx.stroke(); }
    ctx.font = '19px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    const gim = art(open ? g.art : 'ui_lock');
    if (gim) ctx.drawImage(gim, cx - 15, cy - 15, 30, 30);
    else ctx.fillText(open ? g.ico : '🔒', cx, cy + 1);
    if (best) for (let k = 0; k < best; k++) { starPath(ctx, cx + (k - (best - 1) / 2) * 12, cy + 26, 6); ctx.fillStyle = '#ffc23a'; ctx.fill(); }
    mapNodes.push([{ side: i }, cx, cy, 20]);
  });

  // level düğmeleri
  for (let n = nLo; n <= nHi; n++) {
    const x = nodeX(n, W), y = nodeY(n), st = P.stars[n] || 0, cur = n === Math.min(P.level, max), locked = n > P.level;
    const R = cur ? MAP.R + 4 : MAP.R;
    mapNodes.push([n, x, y, R]);
    ctx.fillStyle = 'rgba(29,53,87,.18)';
    ctx.beginPath();
    ctx.ellipse(x, y + R * 0.8, R * 0.95, R * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    if (cur) {
      ctx.strokeStyle = 'rgba(255,140,66,.45)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x, y, R + 7 + Math.sin(t * 4) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = locked ? '#c9d6e3' : cur ? '#ff8c42' : '#3d8fe0';
    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = st === 3 && !cur ? '#ffd166' : '#fff'; // 3 yıldızlı level altın çerçeveli
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = locked ? '#8a9bb0' : '#fff';
    ctx.font = `700 ${n >= 100 ? 15 : 17}px Fredoka, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n, x, y + 1);
    if (!locked && !cur) {
      for (let k = 0; k < 3; k++) {
        const sx = x + (k - 1) * 15, sy = y + R + 9 - (k === 1 ? 4 : 0);
        starPath(ctx, sx, sy, 7.5);
        ctx.fillStyle = k < st ? '#ffd166' : 'rgba(255,255,255,.85)';
        ctx.fill();
        ctx.strokeStyle = k < st ? '#d99a12' : '#a9bcd0';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    if (!locked && !cur && st > 0 && st < 3) {
      // eksik yıldız: tekrar oynanabilir olduğunu gösteren küçük rozet
      ctx.fillStyle = '#ff8c42';
      ctx.beginPath();
      ctx.arc(x + R * 0.78, y - R * 0.78, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '700 12px Fredoka, sans-serif';
      ctx.fillText('↻', x + R * 0.78, y - R * 0.78 + 1);
    }
    if (INTRO[n] && n > 1) {
      ctx.font = '700 10px Fredoka, sans-serif';
      const label = 'YENİ: ' + INTRO[n].title, tw = ctx.measureText(label).width + 12, lx = x > W / 2 ? x - R - 6 - tw : x + R + 6;
      ctx.fillStyle = locked ? 'rgba(255,140,66,.55)' : '#ff8c42';
      roundRect(ctx, lx, y - 9, tw, 18, 9);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.fillText(label, lx + 6, y + 0.5);
    }
    if (cur && !mapHop && P.pet) drawPet(ctx, x - 34, y - R + 6, 30, { kind: P.pet.kind, pose: 'stand', t, collar: collarHex() });
    if (cur && !mapHop) drawPofi(ctx, x, y - R + 4 - Math.abs(Math.sin(t * 3)) * 4, 50, { outfit: P.outfit, wave: Math.max(0, Math.sin(t * 2.4)) * 0.6, blink: (t % 3.3) < 0.12 });
  }
  // zıplama: her level arası bir sıçrayış, sonunda kar tozu
  if (mapHop) {
    const per = 0.55, k = (performance.now() - mapHop.t0) / 1000 / per, steps = mapHop.to - mapHop.from;
    if (k >= steps) { sfx.land(); mapHop = null; }
    else {
      const i = Math.max(0, Math.floor(k)), f = Math.max(0, k - i), a = mapHop.from + i;
      if (f > 0 && !mapHop.played?.[i]) { (mapHop.played = mapHop.played || {})[i] = 1; sfx.jump(); }
      const x0 = nodeX(a, W), y0 = nodeY(a) - MAP.R, x1 = nodeX(a + 1, W), y1 = nodeY(a + 1) - MAP.R - 4;
      const e = f * f * (3 - 2 * f), x = x0 + (x1 - x0) * e, y = y0 + (y1 - y0) * e - Math.sin(f * Math.PI) * 60;
      drawPofi(ctx, x, y + 4, 50, { outfit: P.outfit, happy: true, wave: 1 });
      // kamera Pofi'yi izler
      const want = y - H * 0.62;
      if (Math.abs(sc.scrollTop - want) > 2) sc.scrollTop += (want - sc.scrollTop) * 0.12;
    }
  }
  if (max < 1000) drawBlizzard(ctx, W, t, top, H, max);
  ctx.restore();
}

// Haritanın kilitli devamı: P.level+4'ten sonra leveller kar tipisine gömülür, en üstte tipi tamamen kapatır.
// Yolun soluk izi tipinin içinde sürer; tipi bulutları rüzgârla kayar, kar tanesi yağar.
function drawBlizzard(ctx, W, t, top, H, max) {
  const fogEnd = nodeY(max) - 30, fogStart = nodeY(Math.min(max, P.level + 4)) + 20;
  if (fogStart < top - 40) return; // ekranda değil
  const FOG = '236,244,252';
  const g = ctx.createLinearGradient(0, fogStart, 0, fogEnd);
  g.addColorStop(0, `rgba(${FOG},0)`);
  g.addColorStop(0.6, `rgba(${FOG},.78)`);
  g.addColorStop(1, `rgba(${FOG},.96)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, fogEnd, W, fogStart - fogEnd);
  ctx.fillStyle = `rgba(${FOG},.96)`;
  ctx.fillRect(0, top - 10, W, fogEnd - top + 10);
  // yolun izi tipinin içinde yukarı sürer
  ctx.strokeStyle = 'rgba(90,111,140,.22)';
  ctx.lineWidth = 6;
  ctx.setLineDash([2, 14]);
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let n = max - 3; n <= max + 3; n++) { const x = nodeX(n, W), y = nodeY(n); n === max - 3 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
  ctx.stroke();
  ctx.setLineDash([]);
  // kayan tipi bulutları (sınır boyunca)
  for (let i = 0; i < 12; i++) {
    const cx = (((i / 11) * (W + 120) + t * (10 + (i % 3) * 6)) % (W + 120)) - 60;
    const cy = fogEnd + 30 + Math.sin(i * 1.9) * 40 + Math.sin(t * 0.8 + i) * 6;
    ctx.fillStyle = `rgba(255,255,255,${0.55 + (i % 3) * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 52 + (i % 4) * 10, 26 + (i % 3) * 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // rüzgârla eğik yağan kar
  const y0 = Math.max(top - 10, fogEnd - 160), y1 = fogStart, hh = Math.max(1, y1 - y0);
  ctx.fillStyle = 'rgba(150,176,204,.75)';
  for (let i = 0; i < 46; i++) {
    const sp = 1 + (i % 4) * 0.35;
    const y = y0 + ((i * 53.7 + t * 70 * sp) % hh), x = ((i * 97.3 + t * 45 * sp + (y - y0) * 0.35) % (W + 20)) - 10;
    ctx.beginPath();
    ctx.arc(x, y, 1.6 + (i % 3) * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
  // kısa açıklama
  const ty = Math.max(fogEnd - 40, top + 60);
  if (ty < top + H) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#4a6283';
    ctx.font = '700 15px Fredoka, sans-serif';
    ctx.fillText('❄ Tipinin ardında yeni leveller var', W / 2, ty);
    ctx.font = '600 12px Fredoka, sans-serif';
    ctx.fillStyle = '#6b7f9c';
    ctx.fillText('Level bitirdikçe kar açılır', W / 2, ty + 20);
  }
}

function mapTap(e) {
  const sc = $('mapScroll'), r = sc.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top + sc.scrollTop;
  const hit = mapNodes.find(([, nx, ny, R]) => Math.hypot(x - nx, y - ny) < R + 12);
  if (!hit) return;
  if (typeof hit[0] === 'object') { sfx.ui(); if (hit[0].side !== undefined) showSidePopup(hit[0].side); else showMasterPopup(hit[0].master); return; }
  const n = hit[0];
  if (n > P.level) { toast(`Önce Level ${ek(P.level, 'i')} bitir`); return; }
  sfx.ui();
  showLevelPopup(n);
}

// ---------- usta levelleri ----------
const masterCache = new Map();
// data/masters.json önceden üretilir (tools/gen-masters.mjs); yoksa oyunda üretilir.
// Yan yollar: farklı hedefli isteğe bağlı bulmacalar (önceden üretilmiş, dosya yoksa haritada çıkmaz).
let SIDES = [];
fetch('data/goals.json', { cache: 'no-cache' }).then(r => r.json()).then(j => { SIDES = j; }).catch(() => {});
function showSidePopup(i) {
  const d = SIDES[i], g = GOALS[d.goal], after = (i + 1) * SIDE_LEVELS.every, open = P.level > after, best = P.sides[i] || 0;
  openOverlay(`
    <span class="new-tag">YAN YOL</span>
    <h2>${g.title}</h2>
    <div class="stars">${[1, 2, 3].map(k => `<span class="star${k <= best ? ' on' : ''}">★</span>`).join('')}</div>
    <p>${open ? g.text : `Level ${ek(after, 'i')} bitirince açılır.`}</p>
    <small class="breakdown">${best ? `En iyi çözüm ${d.min} hamle · yeni yıldız için tekrar oynayabilirsin` : `İlk bitirişte: ${rewardHtml(SIDE_REWARD)}`}</small>
    ${open ? `<button id="sdPlay" class="btn primary big">${best ? 'Tekrar oyna' : 'Oyna'}</button>` : ''}
    <button id="sdClose" class="btn link">Kapat</button>`);
  $('sdClose').onclick = closeOverlay;
  if ($('sdPlay')) $('sdPlay').onclick = () => { closeOverlay(); startLevel(0, false, null, null, i); };
}
let MASTERS = [];
fetch('data/masters.json', { cache: 'no-cache' }).then(r => r.json()).then(j => { MASTERS = j; }).catch(() => { /* anlık üretilir */ });
function masterDef(i) {
  if (!masterCache.has(i)) {
    const m = MASTER_LEVELS[i];
    const d = MASTERS[i] || generateLevel(m.n, { seed: 770000 + i * 131, rule: { tier: 'veryhard', fish: 1 }, maxAttempts: 4000 });
    masterCache.set(i, { ...d, n: 20000 + i });
  }
  return masterCache.get(i);
}

// Kale: görseli varsa map_castle, yoksa kodla çizilmiş buz kalesi; bitirildiyse bayrak ve yıldızlar.
function drawCastle(ctx, x, y, i, open, best, t) {
  const im = art('map_castle'), col = ['#4f8fc8', '#3d7bd9', '#8f5bd6', '#2a9d8f', '#3fae5a', '#b36bd6'][i];
  ctx.save();
  if (!open) ctx.globalAlpha = 0.55;
  ctx.fillStyle = 'rgba(29,53,87,.18)';
  ctx.beginPath();
  ctx.ellipse(x, y + 22, 34, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  if (im) ctx.drawImage(im, x - 40, y + 22 - 236 * (80 / 256), 80, 80);
  else {
    ctx.fillStyle = '#e8f4fd';
    ctx.strokeStyle = '#2a5d8f';
    ctx.lineWidth = 2.5;
    roundRect(ctx, x - 26, y - 14, 52, 36, 5);
    ctx.fill();
    ctx.stroke();
    for (const dx of [-26, 14]) {
      roundRect(ctx, x + dx, y - 30, 12, 52, 3);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = col;
    roundRect(ctx, x - 7, y + 4, 14, 18, 6);
    ctx.fill();
    ctx.strokeStyle = '#8e5a2b';
    ctx.beginPath();
    ctx.moveTo(x, y - 14);
    ctx.lineTo(x, y - 40);
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x, y - 40);
    ctx.lineTo(x + 16 + Math.sin(t * 5) * 2, y - 35);
    ctx.lineTo(x, y - 30);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (!open) {
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    const lockIm = art('ui_lock');
    if (lockIm) ctx.drawImage(lockIm, x - 13, y - 9, 26, 26);
    else ctx.fillText('🔒', x, y + 4);
  } else if (best) {
    for (let k = 0; k < 3; k++) {
      starPath(ctx, x + (k - 1) * 15, y + 34, 7.5);
      ctx.fillStyle = k < best ? '#ffd166' : 'rgba(255,255,255,.85)';
      ctx.fill();
      ctx.strokeStyle = k < best ? '#d99a12' : '#a9bcd0';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = '#ff8c42';
    roundRect(ctx, x - 22, y + 26, 44, 16, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '700 10px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('USTA', x, y + 34.5);
  }
  ctx.restore();
}

function showMasterPopup(i) {
  const m = MASTER_LEVELS[i], reg = MAP_REGIONS[i], open = !!P.stars[m.after], best = P.masters[i] || 0;
  openOverlay(`
    <span class="new-tag">USTA LEVELİ</span>
    <h2>${reg.name} Ustası</h2>
    <div class="stars">${[1, 2, 3].map(k => `<span class="star${k <= best ? ' on' : ''}">★</span>`).join('')}</div>
    <p>${open ? 'Bölgenin mekaniklerinden karışık, hamle sınırlı, çok zor bir bulmaca.' : `Level ${ek(m.after, 'i')} bitirince açılır.`}</p>
    <small class="breakdown">${best ? 'Rozetin alındı · daha çok yıldız için tekrar oynayabilirsin' : `İlk bitirişte: rozet + ${rewardHtml(MASTER_REWARD)}`}</small>
    ${open ? `<button id="msPlay" class="btn primary big">${best ? 'Tekrar oyna' : 'Meydan oku'}</button>` : ''}
    <button id="msClose" class="btn link">Kapat</button>`);
  $('msClose').onclick = closeOverlay;
  if ($('msPlay')) $('msPlay').onclick = () => { closeOverlay(); startLevel(0, false, null, i); };
}

// Rozetler: Görevler ekranında 6 bölge madalyası
// ---------- balık albümü ----------
const ALL_FISH = FISH_SETS.flatMap(set => set.fish.map(f => ({ ...f, set })));
const albumCount = () => ALL_FISH.filter(f => P.album[f.id]).length;

// Level başında: balıklı levellerde ALBUM.chance olasılıkla balıklardan biri nadir tür olur.
// Tür, set ağırlığına göre seçilir; albümde olmayan türler ALBUM.missingBias kat daha sık çıkar.
function rollRare() {
  const n = run.L.fishCells.length;
  if (!n || run.def.n < ALBUM.from || Math.random() >= rareChance(P)) return null;
  const w = ALL_FISH.map(f => f.set.weight * (P.album[f.id] ? 1 : ALBUM.missingBias));
  let r = Math.random() * w.reduce((a, b) => a + b, 0), k = 0;
  while (r >= w[k]) r -= w[k++];
  return { i: Math.floor(Math.random() * n), f: ALL_FISH[k] };
}

function albumAdd(f) {
  const dup = !!P.album[f.id];
  P.album[f.id] = (P.album[f.id] || 0) + 1;
  track('album_fish', { id: f.id, dup });
  if (dup) { P.coins += ALBUM.dupCoins; return { text: `🐟 ${f.name} (zaten var) +${ALBUM.dupCoins} coin` }; }
  let text = `🐟 Yeni balık: ${f.name} · albüm ${albumCount()}/${ALL_FISH.length}`;
  const set = f.set;
  if (!P.albumSets[set.id] && set.fish.every(x => P.album[x.id])) {
    P.albumSets[set.id] = true;
    giveReward(set.reward);
    text += ` · ${set.name} seti tamam! ${rewardHtml(set.reward)}`;
    track('album_set', { id: set.id });
  }
  return { text };
}

function drawAlbumFish(cv, f) {
  const ctx = fitCanvas(cv, 48, 48), im = art(`fish_${f.id}`);
  if (!P.album[f.id]) {
    // yakalanmamış: gölge silüet
    ctx.globalAlpha = 0.18;
    if (im) { ctx.filter = 'brightness(0)'; ctx.drawImage(im, 0, 0, 48, 48); ctx.filter = 'none'; }
    else drawFish(ctx, 24, 25, 44, 0, '#1d3557', '#1d3557');
    ctx.globalAlpha = 1;
    return;
  }
  if (im) ctx.drawImage(im, 0, 0, 48, 48);
  else drawFish(ctx, 24, 25, 44, 0, f.color, '#fff8dc');
}

function renderAlbum() {
  $('albumBox').innerHTML = `<h3>Balık albümü <small>${albumCount()}/${ALL_FISH.length}</small></h3>
    <p class="album-tip">Bazı levellerde parıltılı nadir bir balık çıkar. Topla, level bitince albüme girer.</p>
    ${FISH_SETS.map(set => {
      const got = set.fish.filter(f => P.album[f.id]).length;
      return `<div class="album-set${P.albumSets[set.id] ? ' done' : ''}"><div class="as-head"><b>${set.name}</b><small>${P.albumSets[set.id] ? 'Tamamlandı ✓' : `${got}/4 · ödül ${rewardHtml(set.reward)}`}</small></div>
        <div class="as-row">${set.fish.map(f => `<div class="as-fish${P.album[f.id] ? '' : ' off'}"><canvas data-fish="${f.id}"></canvas><span>${P.album[f.id] ? f.name : '?'}</span>${P.album[f.id] > 1 ? `<i>×${P.album[f.id]}</i>` : ''}</div>`).join('')}</div></div>`;
    }).join('')}`;
  $('albumBox').querySelectorAll('[data-fish]').forEach(cv => drawAlbumFish(cv, ALL_FISH.find(f => f.id === cv.dataset.fish)));
}
onArtLoad(id => { if (id.startsWith('fish_') && !$('screenAch').classList.contains('hidden')) renderAlbum(); });

function renderBadges() {
  $('badgeBox').innerHTML = MAP_REGIONS.map((r, i) => `<div class="bdg${P.masters[i] ? '' : ' off'}${P.storySeen?.includes(i) ? ' story' : ''}" data-story="${i}"><canvas data-bdg="${i}"></canvas><span>${r.name}</span></div>`).join('')
    + (P.storySeen?.length ? '<small class="bdg-hint">Okuduğun bölümü yeniden açmak için bölgeye dokun</small>' : '');
  $('badgeBox').querySelectorAll('.bdg.story').forEach(b => { b.onclick = () => { sfx.ui(); showRoad(+b.dataset.story, true); }; });
  $('badgeBox').querySelectorAll('[data-bdg]').forEach(cv => {
    const i = +cv.dataset.bdg, ctx = fitCanvas(cv, 44, 44), im = art(`badge_master_${i + 1}`);
    if (im) { ctx.drawImage(im, 0, 0, 44, 44); return; }
    const col = ['#4f8fc8', '#3d7bd9', '#8f5bd6', '#2a9d8f', '#3fae5a', '#b36bd6'][i];
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(22, 22, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(22, 22, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏰', 22, 23);
  });
}

function showLevelPopup(n) {
  const st = P.stars[n] || 0, def = levelDef(n), two = def.min + Math.max(2, Math.ceil(def.min * 0.5));
  const tl = TIER_LABEL[def.tier];
  openOverlay(`
    <span class="new-tag">${regionOf(n).name.toLocaleUpperCase('tr-TR')}</span>
    <h2>Level ${n}${tl ? ` <span class="tier ${def.tier}">${tl}</span>` : ''}</h2>
    <div class="stars">${[1, 2, 3].map(k => `<span class="star${k <= st ? ' on' : ''}">★</span>`).join('')}</div>
    <p>${st === 3 ? 'Kusursuz! Bu level tamam.' : st ? `3 yıldız için en fazla <b>${def.min}</b> hamlede bitir.` : 'Henüz bitirmedin.'}</p>
    <small class="breakdown">★★★ ${def.min} hamle · ★★ ${two} hamle${def.limit ? ` · hamle sınırı ${def.limit}` : ''}${st ? ` · yeni yıldız başına +${REPLAY.perNewStar} coin` : ''}</small>
    <button id="lvPlay" class="btn primary big">${st ? 'Tekrar oyna' : 'Oyna'}</button>
    <button id="lvClose" class="btn link">Kapat</button>`);
  $('lvClose').onclick = closeOverlay;
  $('lvPlay').onclick = () => { closeOverlay(); playFromMap = true; startLevel(n); };
}

// ---------- günlük görevler ----------
// Her gün tarihe göre 3 görev (aynı gün herkes için aynı). Her görev QUEST_REWARD, üçü alınınca QUEST_CHEST.
function ensureQuests() {
  const day = dateKey();
  if (P.quests?.day === day) return P.quests;
  const pool = DAILY_QUESTS.filter(q => !q.needs || (q.needs === 'dailyPuzzle' ? P.level > DAILY_PUZZLE.unlockLevel : P.village[q.needs]));
  let seed = [...day].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
  const list = [];
  while (list.length < 3 && pool.length) list.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  P.quests = { day, list: list.map(q => ({ type: q.type, need: q.need, have: 0, claimed: false })), chest: false };
  save(P);
  return P.quests;
}
function questProgress(type, n) {
  const q = ensureQuests();
  for (const it of q.list) {
    if (it.type !== type || it.have >= it.need) continue;
    it.have = Math.min(it.need, it.have + n);
    if (it.have >= it.need) setTimeout(() => toast(`Görev tamam: ${DAILY_QUESTS.find(d => d.type === type).text} ✔`, 2200), 1500);
  }
}
const questReady = () => {
  const q = P.quests?.day === dateKey() ? P.quests : null;
  if (!q) return 0;
  return q.list.filter(x => x.have >= x.need && !x.claimed).length + (q.list.every(x => x.claimed) && !q.chest ? 1 : 0);
};

function renderQuests() {
  const q = ensureQuests(), allClaimed = q.list.every(x => x.claimed);
  $('questBox').innerHTML = `
    <div class="qb-head"><b>Bugünün görevleri</b><small>Yarın yenileri gelir</small></div>
    ${q.list.map((it, i) => {
      const d = DAILY_QUESTS.find(x => x.type === it.type), done = it.have >= it.need;
      const act = it.claimed ? '<span class="check">✓</span>' : done ? `<button class="btn green" data-q="${i}">Al</button>` : `<span class="ach-rw">${rewardHtml(QUEST_REWARD)}</span>`;
      return `<div class="quest${it.claimed ? ' claimed' : ''}"><div class="q-body"><span>${d.text}</span><div class="progress"><div style="width:${(it.have / it.need) * 100}%"></div></div><small class="ach-rw">${it.have}/${it.need}</small></div>${act}</div>`;
    }).join('')}
    <div class="qb-chest"><span>${ui('gift')} Üç görevi de bitir: ${rewardHtml(QUEST_CHEST)}</span>${q.chest ? '<span class="check">✓</span>' : `<button id="qChest" class="btn primary" ${allClaimed ? '' : 'disabled'}>Aç</button>`}</div>`;
  $('questBox').querySelectorAll('[data-q]').forEach(btn => {
    btn.onclick = () => {
      const it = q.list[+btn.dataset.q];
      if (it.claimed || it.have < it.need) return;
      it.claimed = true;
      giveReward(QUEST_REWARD);
      persist();
      sfx.coin();
      track('quest_claim', { type: it.type });
      renderAch();
      updateWallet();
    };
  });
  if ($('qChest')) $('qChest').onclick = () => {
    if (q.chest || !q.list.every(x => x.claimed)) return;
    q.chest = true;
    giveReward(QUEST_CHEST);
    persist();
    sfx.reward();
    track('quest_chest');
    toast('Günlük sandık açıldı!');
    renderAch();
    updateWallet();
  };
}

// ---------- başarımlar ----------
function achStat(stat) {
  switch (stat) {
    case 'levels': return Object.keys(P.stars).length;
    case 'stars': return totalStars();
    case 'perfect': return Object.values(P.stars).filter(v => v === 3).length;
    case 'vl': return villageLevel(P);
    case 'outfits': return P.owned.hat.length + P.owned.scarf.length - 2;
    case 'villagers': return P.villagers.length;
    case 'masters': return Object.keys(P.masters).length;
    case 'sides': return Object.keys(P.sides).length;
    case 'friends': return Object.values(P.friends).filter(f => f.ch >= 3).length;
    case 'pets': return P.pet?.kinds.length || 0;
    case 'album': return ALL_FISH.filter(f => P.album[f.id]).length;
    case 'projects': return PROJECTS.filter(p => projectStage(P, p) === 3).length;
    default: return P.ach[stat] || 0;
  }
}
function achInfo(a) {
  const v = achStat(a.stat), got = P.achClaimed[a.id] || 0, reached = a.tiers.filter(x => v >= x).length;
  return { v, got, reached, claimable: reached > got, max: got >= a.tiers.length };
}
const achClaimable = () => ACHIEVEMENTS.reduce((n, a) => { const i = achInfo(a); return n + Math.max(0, i.reached - i.got); }, 0);
const achDone = () => ACHIEVEMENTS.reduce((n, a) => n + (P.achClaimed[a.id] || 0), 0);
const achTotal = () => ACHIEVEMENTS.reduce((n, a) => n + a.tiers.length, 0);

function renderAch() {
  renderQuests();
  renderBadges();
  renderAlbum();
  const ready = achClaimable();
  $('achSummary').innerHTML = `${achDone()}/${achTotal()} kademe · ${ready} ödül hazır${ready > 1 ? ' <button id="achAll" class="btn green">Hepsini al</button>' : ''}`;
  if ($('achAll')) $('achAll').onclick = () => {
    let r = {}, n = 0;
    for (const a of ACHIEVEMENTS) {
      let i = achInfo(a);
      while (i.claimable) {
        const one = ACH_REWARD[i.got];
        giveReward(one);
        r = addRewards(r, one);
        P.achClaimed[a.id] = i.got + 1;
        n++;
        i = achInfo(a);
      }
    }
    persist();
    sfx.reward();
    track('achievement_claim_all', { n });
    openOverlay(`<span class="new-tag">BAŞARIMLAR</span><h2>${n} ödül alındı!</h2>
      <div class="reward-row">${rewardHtml(r)}</div>
      <button id="achOk" class="btn green big">Harika</button>`);
    $('achOk').onclick = closeOverlay;
    renderAch();
    updateWallet();
  };
  $('achList').innerHTML = ACHIEVEMENTS.map(a => {
    const i = achInfo(a), target = a.tiers[Math.min(i.got, a.tiers.length - 1)], prevT = i.got ? a.tiers[i.got - 1] : 0;
    const pct = i.max ? 100 : Math.max(0, Math.min(100, ((i.v - prevT) / (target - prevT)) * 100));
    const dots = a.tiers.map((_, k) => `<i class="${k < i.got ? 'on' : k < i.reached ? 'ready' : ''}"></i>`).join('');
    const act = i.claimable ? `<button class="btn green" data-ach="${a.id}">Al</button>` : i.max ? '<span class="check">✓</span>' : '';
    return `<div class="ach-card${i.claimable ? ' ready' : ''}${i.max ? ' done' : ''}">
      <span class="ach-ico">${a.ui ? ui(a.ui) : a.icon}</span>
      <div class="ach-body">
        <div class="ach-top"><b>${a.name}</b><span class="dots">${dots}</span></div>
        <small>${i.max ? 'Bütün kademeler tamam' : a.text(target)} · ${Math.min(i.v, target)}/${target}</small>
        <div class="progress"><div style="width:${pct}%"></div></div>
        ${i.max ? '' : `<span class="ach-rw">Ödül: ${rewardHtml(ACH_REWARD[i.got])}</span>`}
      </div>
      ${act}
    </div>`;
  }).join('');
  $('achList').querySelectorAll('[data-ach]').forEach(btn => {
    btn.onclick = () => {
      const a = ACHIEVEMENTS.find(x => x.id === btn.dataset.ach), i = achInfo(a);
      if (!i.claimable) return;
      const r = ACH_REWARD[i.got];
      giveReward(r);
      P.achClaimed[a.id] = i.got + 1;
      persist();
      sfx.reward();
      track('achievement_claim', { id: a.id, tier: i.got + 1 });
      toast(`${a.icon} ${a.name} · ${i.got + 1}. kademe`);
      renderAch();
      updateWallet();
    };
  });
}

// ---------- ayarlar ----------
function renderSettings() {
  $('setName').value = P.profile?.name || '';
  $('setHaptics').checked = !!P.settings.haptics;
  $('setSfx').checked = P.settings.sfx !== false;
  $('setAmbient').checked = P.settings.ambient !== false;
  $('setMusic').checked = P.settings.music !== false;
  renderVolumes();
  $('setMusic').closest('.set-row').classList.toggle('hidden', !MUSIC.home);
  $('setArt').checked = P.settings.art !== false;
  $('setAccount').textContent = { guest: 'Misafir', google: 'Google', apple: 'Apple' }[P.profile?.method] || 'Misafir';
}
// ---------- telefona kurulum (PWA) ----------
// Android/Chrome'da tarayıcının kurulum penceresi açılır; iPhone'da Paylaş menüsü anlatılır.
// Servis çalışanı kodu her açılışta tazeler (eski ve yeni dosyalar karışmaz) ve oyunu çevrimdışı açar.
let installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });
window.addEventListener('appinstalled', () => { installEvt = null; track('pwa_installed'); toast('Pofi ana ekrana eklendi!'); });
const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
$('btnInstall').onclick = async () => {
  if (standalone()) { toast('Pofi zaten ana ekranında'); return; }
  if (installEvt) {
    installEvt.prompt();
    const { outcome } = await installEvt.userChoice;
    track('pwa_prompt', { outcome });
    installEvt = null;
    return;
  }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  openOverlay(`<h2>Ana ekrana ekle</h2>
    <p>${ios ? 'Safari\'de alttaki <b>Paylaş</b> düğmesine dokun, sonra <b>Ana Ekrana Ekle</b>\'yi seç.' : 'Tarayıcı menüsünden (⋮) <b>Ana ekrana ekle</b> ya da <b>Uygulamayı yükle</b>\'yi seç.'}</p>
    <small class="breakdown">Pofi uygulama gibi tam ekran açılır ve internetsiz de oynanır.</small>
    <button id="insOk" class="btn primary">Tamam</button>`);
  $('insOk').onclick = closeOverlay;
};
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* desteklenmiyorsa normal çalışır */ }));
}

$('setName').onchange = () => {
  const name = cleanName($('setName').value).slice(0, 16);
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
$('setSfx').onchange = () => { P.settings.sfx = $('setSfx').checked; persist(); applySoundSettings(); sfx.ui(); renderVolumes(); };
$('setArt').onchange = () => { P.settings.art = $('setArt').checked; persist(); setArtEnabled(P.settings.art); };
$('setMusic').onchange = () => { P.settings.music = $('setMusic').checked; persist(); applySoundSettings(); renderVolumes(); };
// Ses düzeyleri: sürüklerken anında uygulanır, bırakınca kaydedilir. Efekt düzeyinde örnek ses çalar.
function renderVolumes() {
  for (const [id, key, on] of [['Sfx', 'sfxVol', 'sfx'], ['Music', 'musicVol', 'music']]) {
    $('vol' + id).value = volOf(key);
    $('vol' + id + 'Val').textContent = `%${volOf(key)}`;
    $('row' + id + 'Vol').classList.toggle('off', P.settings[on] === false);
  }
}
for (const [id, key] of [['Sfx', 'sfxVol'], ['Music', 'musicVol']]) {
  $('vol' + id).oninput = () => { P.settings[key] = +$('vol' + id).value; $('vol' + id + 'Val').textContent = `%${P.settings[key]}`; applySoundSettings(); };
  $('vol' + id).onchange = () => { persist(); if (id === 'Sfx') sfx.ui(); track('volume', { kind: key, v: P.settings[key] }); };
}
$('setAmbient').onchange = () => { P.settings.ambient = $('setAmbient').checked; persist(); applySoundSettings(); };
$('btnReplayIntro').onclick = runIntro;

// Gizli test paneli (Mustafa'nın denge testi için): Ayarlar'ın altındaki sürüm yazısına 3 sn içinde 7 dokunuş.
// Yalnızca levele gitme, oyunun saatini ileri alma ve kaydı sıfırlama. Coin ya da eşya ekleme yok (her oyuncunun kodunda durur).
let verTaps = [];
if ($('aboutVer')) $('aboutVer').onclick = () => {
  const now = performance.now();
  verTaps = [...verTaps.filter(t => now - t < 3000), now];
  const left = 7 - verTaps.length;
  if (left <= 0) { verTaps = []; showDevPanel(); }
  else if (left <= 3) toast(`Test paneli: ${left} dokunuş daha`, 900);
};
if (clockShift && $('aboutVer')) $('aboutVer').insertAdjacentHTML('beforeend', `<br><b class="dev-clock">Test saati: ${shiftText()}</b>`);
function showDevPanel() {
  const when = new Date().toLocaleString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  openOverlay(`
    <span class="new-tag">TEST PANELİ</span>
    <h2>Test paneli</h2>
    <p class="muted">Denge ve test için. Coin ya da eşya eklemez; değişiklikler yalnızca bu cihazda.</p>
    <div class="dev-sec"><b>Level</b><small>Şu an level ${P.level}</small>
      <label class="field light"><input id="dvLevel" type="number" inputmode="numeric" min="1" max="1000" value="${P.level}" aria-label="Level numarası"></label>
      <div class="dev-row"><button id="dvPlay" class="btn primary">Oyna</button><button id="dvMove" class="btn secondary">İlerlemeyi buraya taşı</button></div>
      <small>Oyna ilerlemeyi değiştirmez (kazanırsan ileri gider). Taşımak açık leveli değiştirir, yıldızlar kalır.</small></div>
    <div class="dev-sec"><b>Oyunun saati</b><small>${when} · kayma: ${shiftText()}</small>
      <div class="dev-row">${[['+1 saat', 36e5], ['+6 saat', 216e5], ['+1 gün', 864e5], ['+7 gün', 6048e5]].map(([t, ms]) => `<button class="btn secondary" data-shift="${ms}">${t}</button>`).join('')}</div>
      <div class="dev-row"><button id="dvClock0" class="btn secondary" ${clockShift ? '' : 'disabled'}>Gerçek saate dön</button></div>
      <small>Günlük ödül, sipariş, festival, tüccar, gece/gündüz ve kakao birikimi bu saate göre çalışır. Değişince oyun yenilenir.</small></div>
    <div class="dev-sec"><b>Kayıt</b><div class="dev-row"><button id="dvReset" class="btn secondary">Kaydı sıfırla…</button></div></div>
    <button id="dvClose" class="btn link">Kapat</button>`, 'dev');
  const lv = () => Math.max(1, Math.min(1000, Math.floor(+$('dvLevel').value || 0)));
  $('dvPlay').onclick = () => { const n = lv(); closeOverlay(); track('dev_play', { n }); startLevel(n); };
  $('dvMove').onclick = () => { const n = lv(); P.level = n; persist(); track('dev_move', { n }); closeOverlay(); toast(`İlerleme level ${ek(n, 'e')} taşındı`); showScreen('home'); };
  $('overlayCard').querySelectorAll('[data-shift]').forEach(b => { b.onclick = () => { setDev({ shift: clockShift + +b.dataset.shift }); persist(); location.reload(); }; });
  $('dvClock0').onclick = () => { setDev({ shift: 0 }); persist(); location.reload(); };
  $('dvReset').onclick = () => $('btnReset').click();
  $('dvClose').onclick = closeOverlay;
}

$('btnReset').onclick = () => {
  openOverlay(`<h2>Emin misin?</h2><p>Leveller, coinler, köy ve gardırop silinir. Bu geri alınamaz.</p>
    <button id="rsYes" class="btn primary big" style="background:#e5484d;box-shadow:0 5px 0 #b3363a">Evet, sıfırla</button>
    <button id="rsNo" class="btn link">Vazgeç</button>`);
  $('rsYes').onclick = () => { resetSave(); clearRunSnap(); location.reload(); };
  $('rsNo').onclick = closeOverlay;
};

// ---------- haftalık etkinlik (docs/v04-oneri.md, bölüm 3) ----------
// Haftanın jetonu: görseli olan temada resim, yoksa emoji.
const tokenHtml = (ev, cls = 'tok') => (ev.art ? `<img class="${cls}" src="assets/art/ev_token_${ev.id}.webp" alt="${ev.token}">` : ev.token);
// Etkinlik ekranı: haftaya özel 15 temalı level, jetonla ilerleyen ödül yolu ve jeton dükkânı.
function renderEventCard() {
  const ev = ensureEvent(P), ready = claimable(P).length;
  const card = $('eventCard');
  card.style.setProperty('--ev', ev.color);
  card.setAttribute('aria-label', ev.name);
  card.innerHTML = `<span class="h-ring"><span class="ev-token">${tokenHtml(ev)}</span></span><span class="ev-time">${timeLeft(ev.ends).split(' ')[0]}</span>Etkinlik`
    + (ready ? '<i class="dot"></i>' : '');
}

const evPrizeReward = ev => (prizeOf(ev) ? null : EVENT_PRIZE_FALLBACK);
function giveReward(r) {
  P.coins += r.coins || 0;
  P.hints += r.hints || 0;
  P.flakes += r.flakes || 0;
}

function renderEventScreen() {
  const ev = ensureEvent(P), prize = prizeOf(ev), E = P.event;
  const shopPrice = it => (ev.rule?.sale ? Math.ceil(it.cost / 2) : it.cost);
  $('screenEvent').style.setProperty('--ev', ev.color);
  // görselli temada banner sahnesi sağda, yazı solda koyulaşan zeminin üstünde
  $('evBanner').classList.toggle('has-art', !!ev.art);
  $('evBanner').style.backgroundImage = ev.art ? `linear-gradient(90deg, ${ev.color} 0%, ${ev.color}e6 38%, ${ev.color}00 62%), url(assets/art/ev_banner_${ev.id}.webp)` : '';
  const rules = [
    ev.rule?.mech && 'Temalı mekanikler',
    ev.rule?.fish && `+${ev.rule.fish} balık`,
    ev.rule?.order && 'Sıralı balık',
    ev.rule?.nosnow && 'Kalıcı kar yok',
    ev.rule?.limit && 'Hamle sınırı',
    ev.rule?.dark && 'Karanlık tahta',
    ev.rule?.reverse && 'Ters kontrol',
    ev.rule?.sale && 'Dükkân yarı fiyat',
  ].filter(Boolean);
  $('evBanner').innerHTML = `
    <span class="ev-big">${tokenHtml(ev)}</span>
    <div class="ev-head"><span class="new-tag">${ev.big ? 'ÖZEL GÜN' : 'HAFTALIK ETKİNLİK'}</span><h2>${ev.name}</h2><p>${ev.text}</p>
      <div class="ev-chips">${rules.map(r => `<span>${r}</span>`).join('')}${ev.bonus ? `<span>${BONUS_TEXT[ev.bonus]}</span>` : ''}</div>
      <small>Bitmesine ${timeLeft(ev.ends)} · kalan jeton hafta sonunda ${EVENT_TOKENS.coinRate} katı coin olur</small></div>
    <span class="ev-wallet">${tokenHtml(ev)} <b>${E.tokens}</b></span>`;

  // levelller: sırayla açılır
  const firstOpen = Array.from({ length: EVENT_LEVELS }, (_, k) => k).find(k => !E.done[k]) ?? EVENT_LEVELS;
  $('evLevels').innerHTML = Array.from({ length: EVENT_LEVELS }, (_, k) => {
    const st = E.done[k] || 0, open = k <= firstOpen;
    return `<button class="ev-lv${st ? ' done' : ''}${open ? '' : ' locked'}${k === firstOpen ? ' next' : ''}" data-evl="${k}" ${open ? '' : 'disabled'}>
      <b>${k + 1}</b><span>${st ? '★'.repeat(st) + '☆'.repeat(3 - st) : open ? `+${EVENT_TOKENS.eventLevel}` : ui('lock')}</span></button>`;
  }).join('');
  $('evLevels').querySelectorAll('[data-evl]').forEach(b => {
    b.onclick = () => {
      b.classList.add('loading');
      setTimeout(() => startLevel(0, false, +b.dataset.evl), 30); // üretim kısa sürebilir; önce dokunuş görünsün
    };
  });

  // ödül yolu
  $('evTrack').innerHTML = EVENT_TRACK.map((m, i) => {
    const done = E.claimed.includes(i), ready = !done && E.earned >= m.pts;
    const r = m.r.prize ? evPrizeReward(ev) : m.r;
    const rw = r ? rewardHtml(r) : `<b>${prize.name}</b>&nbsp;<small>haftanın kıyafeti</small>`;
    const act = ready ? `<button class="btn green" data-ev="${i}">Al</button>` : done ? '<span class="check">✓</span>' : '';
    return `<div class="ev-step${done ? ' done' : ready ? ' ready' : ''}"><span class="pts">${m.pts}</span><span class="rw">${rw}</span>${act}</div>`;
  }).join('');
  $('evEarned').textContent = `Bu hafta kazanılan: ${E.earned} jeton`;
  $('evTrack').querySelectorAll('[data-ev]').forEach(btn => {
    btn.onclick = () => {
      const i = +btn.dataset.ev, m = EVENT_TRACK[i];
      if (E.claimed.includes(i) || E.earned < m.pts) return;
      const r = m.r.prize ? evPrizeReward(ev) : m.r;
      if (r) giveReward(r);
      else if (!P.owned[prize.slot].includes(prize.id)) P.owned[prize.slot].push(prize.id);
      E.claimed.push(i);
      if (i === EVENT_TRACK.length - 1) P.ach.events = (P.ach.events || 0) + 1;
      persist();
      sfx.reward();
      track('event_claim', { event: ev.id, step: i });
      toast(r ? 'Ödül alındı' : `${prize.name} gardırobuna eklendi!`);
      renderEventScreen();
      updateWallet();
    };
  });

  // dükkân
  const decorId = `ev_${ev.id}`, decorItem = DECOR_ITEMS.find(d => d.id === decorId);
  const shopItems = EVENT_SHOP.filter(it => (!it.prize || prize) && (!it.decor || (ev.art && decorItem)));
  const shopOwned = it => (it.prize && P.owned[prize.slot].includes(prize.id)) || (it.decor && P.decorOwned.includes(decorId));
  $('evShop').innerHTML = shopItems.map(it => {
    const n = E.bought[it.id] || 0, price = shopPrice(it);
    const owned = shopOwned(it);
    const left = it.max - n;
    const label = it.prize ? prize.name : it.decor ? `${it.name}: ${decorItem.name}` : it.name;
    const act = owned ? '<span class="check">Sahipsin</span>' : left <= 0 ? '<span class="check">Tükendi</span>'
      : `<button class="btn green" data-evs="${it.id}" ${E.tokens < price ? 'disabled' : ''}>${tokenHtml(ev, 'tok sm')} ${price}</button>`;
    return `<div class="ev-step"><span class="rw">${label}</span><small>${owned || it.prize || it.decor ? '' : `${left}/${it.max}`}</small>${act}</div>`;
  }).join('');
  $('evShop').querySelectorAll('[data-evs]').forEach(btn => {
    btn.onclick = () => {
      const it = EVENT_SHOP.find(x => x.id === btn.dataset.evs), price = shopPrice(it);
      if (E.tokens < price || (E.bought[it.id] || 0) >= it.max) return;
      E.tokens -= price;
      E.bought[it.id] = (E.bought[it.id] || 0) + 1;
      if (it.prize) { if (!P.owned[prize.slot].includes(prize.id)) P.owned[prize.slot].push(prize.id); }
      else if (it.decor) { if (!P.decorOwned.includes(decorId)) P.decorOwned.push(decorId); }
      else giveReward(it.r);
      persist();
      sfx.coin();
      track('event_shop', { event: ev.id, item: it.id, price });
      toast(it.prize ? `${prize.name} gardırobuna eklendi!` : it.decor ? `${decorItem.name} alındı · köyde Süsler'den yerleştir` : `${it.name} alındı`);
      renderEventScreen();
      updateWallet();
    };
  });
  // Jeton bozdurma: dükkândaki her şey alınınca kalan jeton hafta sonunu beklemeden coin'e çevrilir (aynı oran).
  const shopDone = shopItems.every(it => shopOwned(it) || (E.bought[it.id] || 0) >= it.max);
  const exCoins = E.tokens * EVENT_TOKENS.coinRate;
  $('evExchange').innerHTML = shopDone
    ? `<div class="ev-step ev-exchange${E.tokens ? ' ready' : ''}"><span class="rw ev-ex-text"><b>Jeton bozdur</b><small>Dükkân tamam · 1 jeton = ${EVENT_TOKENS.coinRate} coin</small></span><button id="evEx" class="btn green" ${E.tokens ? '' : 'disabled'}>${tokenHtml(ev, 'tok sm')} ${E.tokens} → ${coinIco}${exCoins}</button></div>`
    : '<small class="ev-ex-note">Dükkândaki her şeyi alınca kalan jetonunu burada coin\'e çevirebilirsin.</small>';
  if ($('evEx')) $('evEx').onclick = () => {
    if (!E.tokens) return;
    const tokens = E.tokens, coins = tokens * EVENT_TOKENS.coinRate;
    E.tokens = 0;
    P.coins += coins;
    persist();
    sfx.coin();
    track('event_exchange', { event: ev.id, tokens, coins });
    toast(`${tokens} jeton ${coins} coin oldu`);
    renderEventScreen();
    updateWallet();
  };
  const pv = $('evPrize');
  if (prize) drawPofi(fitCanvas(pv, 64, 64), 32, 62, 50, { outfit: { ...P.outfit, [prize.slot]: prize.id } });
  pv.classList.toggle('hidden', !prize);
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
      const ev = ensureEvent(P);
      if (ev.bonus === 'visit') { addTokens(P, EVENT_BONUS.visit); persist(); gift += ` · ${ev.token} +${EVENT_BONUS.visit} jeton`; }
    }
  } else gift = 'Bu senin köyün 🙂';
  $('visitTag').textContent = `${v.vname || v.name} · Köy Lv${vl}`;
  $('visitInfo').innerHTML = `
    <div class="vl-top"><span class="vl-num">${vl}</span><div><b>${v.vname ? `${esc(v.vname)} · ${esc(v.name)} adlı oyuncunun köyü` : `${esc(v.name)} adlı oyuncunun köyü`}</b><small>${built} yapı · toplam ${levels} yapı seviyesi</small></div></div>
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
// Denge testi: ?oyna=250 ile "Oyna" düğmesi doğrudan o leveli açar (ilerleme kaydı değişmez, yalnız kazanınca ileri gider).
const testLevel = Math.max(0, Math.min(1000, Math.floor(+new URLSearchParams(location.search).get('oyna') || 0)));
$('btnPlay').onclick = () => startLevel(testLevel || P.level);
$('nextCard').onclick = () => showScreen('village');
$('homeSceneWrap').onclick = () => showScreen('village');
$('btnGazette').onclick = () => { sfx.ui(); showGazette(); };
$('btnDaily').onclick = showDailyReward;
$('btnDailyPuzzle').onclick = () => {
  const st = dailyPuzzleState();
  if (!st.unlocked) toast(`Günlük bulmaca Level ${ek(DAILY_PUZZLE.unlockLevel, 'den')} sonra açılır`);
  else if (st.done) toast('Bugünkü bulmacayı çözdün, yarın yenisi gelecek');
  else startLevel(0, true);
};
document.querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => showScreen(b.dataset.tab); });
$('btnBack').onclick = () => {
  closeOverlay();
  if (screen === 'visit') { leaveVisit(); return; }
  if (screen === 'interior') { exitRoom(); return; }
  const back = screen === 'game' && run?.event !== null && run?.event !== undefined ? 'event' : screen === 'game' && run?.fromMap ? 'map' : 'home';
  if (screen === 'game' && run && !run.finished) statAdd(run.statKey, { quits: 1, secs: statTime() });
  if (screen === 'game') clearRunSnap();
  run = null;
  showScreen(back);
};
$('btnUndo').onclick = undo;
const restartRun = () => {
  clearRunSnap();
  if (!run.finished) statAdd(run.statKey, { restarts: 1, secs: statTime() });
  playFromMap = !!run.fromMap;
  startLevel(run.def.n, run.daily, run.event, run.master, run.side);
};
$('btnRestart').onclick = () => { if (run && !overlayOpen()) { restartRun(); nudgeHint(); } };
$('btnHint').onclick = useHint;
$('btnBoost').onclick = () => { if (board.target) { endTarget(); return; } if ($('boostBar').classList.contains('hidden')) showBoostBar(); else { $('boostBar').classList.add('hidden'); endTarget(); } };
$('btnCocoa').onclick = () => sellCocoa(1);
$('btnRecipes').onclick = showRecipes;
$('eventCard').onclick = () => showScreen('event');
$('btnMap').onclick = () => showScreen('map');
$('btnAch').onclick = () => showScreen('ach');
$('mapChest').onclick = openStarChest;
$('mapScroll').addEventListener('click', mapTap);
$('btnShare').onclick = shareVillage;
$('btnVisit').onclick = askVisit;
$('btnVisitBack').onclick = leaveVisit;
$('btnCocoa2').onclick = async () => { if (await showRewarded('cocoa_x2')) sellCocoa(2); };
// Klavye (masaüstü): oklar ve WASD Pofi'yi kaydırır, Q ya da boşluk Pipi'ye geçer (board.js), Z ya da Backspace geri alır, R baştan başlatır, H ipucu verir,
// Esc açık pencereyi ya da yapı panelini kapatır. Yazı yazılırken ve pencere açıkken oyun tuşları çalışmaz
// (bu dinleyici yakalama aşamasında, board.js'tekinden önce çalışır).
const typingIn = e => !!e.target.closest?.('input:not([type=checkbox]):not([type=range]), textarea, [contenteditable]');
const CLOSE_WORDS = /^(Kapat|Sonra|Vazgeç|Geri|Tamam)$/;
function escClose() {
  if (overlayOpen()) {
    const btns = [...$('overlayCard').querySelectorAll('button')].filter(b => b.offsetParent && !b.disabled && !b.classList.contains('invisible'));
    const b = btns.find(x => x.getAttribute('aria-label') === 'Kapat') || btns.reverse().find(x => CLOSE_WORDS.test(x.textContent.trim()));
    if (b) b.click();
    return;
  }
  if (sheet) closeSheet();
}
document.addEventListener('keydown', e => {
  if (typingIn(e) || e.ctrlKey || e.metaKey || e.altKey) { e.stopPropagation(); return; }
  if (e.key === 'Escape') { e.preventDefault(); escClose(); return; }
  if (overlayOpen()) { e.stopPropagation(); return; } // pencere açıkken Pofi kaymaz
  if (screen !== 'game' || !run) return;
  if (e.code === 'KeyZ' || e.code === 'Backspace') { e.preventDefault(); undo(); }
  else if (e.code === 'KeyR' && !e.repeat) $('btnRestart').click();
  else if (e.code === 'KeyH' && !e.repeat) useHint();
}, true);

// Köy sahnesinin oyun ekranı ve fotoğrafta ortak olan bilgileri
const villageScene = () => ({
  village: P.village, vl: villageLevel(P), outfit: P.outfit, colors: COLORS, land: P.land || 1,
  villagers: villagersHere(), hour: hourNow(), decor: P.decor, event: eventVillage(), weather: weatherNow().id, friendReady: villagersHere().filter(v => friendReady(v.id)).map(v => v.id),
  pet: P.pet ? { kind: P.pet.kind, others: P.pet.kinds.filter(k => k !== P.pet.kind), collar: collarHex(), bed: P.pet.bed || 0, toy: P.pet.toy, awake: petFedToday(P) } : null,
  projects: (P.land || 1) >= 3 ? PROJECTS.map(p => ({ p, stage: projectStage(P, p) })) : null,
});

// Köy fotoğrafı: açık bütün araziler tek karede, altta köyün adı. Oyun içi işaretler (oklar, balonlar) çizilmez.
let photoView = null;
function shootVillage() {
  if (!photoView) {
    const wrap = document.createElement('div');
    wrap.style.display = 'none'; // görünmez: VillageView ölçüsünü kendisi almasın diye
    wrap.appendChild(document.createElement('canvas'));
    document.body.appendChild(wrap);
    photoView = new VillageView(wrap.firstChild);
  }
  const land = P.land || 1, PW = 720, PH = 648, strip = 92, v = photoView;
  v.W = PW;
  v.H = PH;
  v.dpr = 1;
  v.c.width = PW * land;
  v.c.height = PH;
  v.cam = { x: PW / 2, y: PH / 2, z: 1 };
  v.heroHome = undefined;
  v.draw(performance.now() / 1000, 0, { ...villageScene(), plots: [], ready: [], teaser: false, photo: true });
  const out = document.createElement('canvas');
  out.width = PW * land;
  out.height = PH + strip;
  const x = out.getContext('2d');
  x.fillStyle = '#ffffff';
  x.fillRect(0, 0, out.width, out.height);
  x.drawImage(v.c, 0, 0);
  x.textBaseline = 'middle';
  x.fillStyle = '#1d3557';
  x.font = "700 34px Fredoka, sans-serif";
  x.fillText(P.villageName || 'Pofi\'nin köyü', 28, PH + 34);
  x.fillStyle = '#5a6f8c';
  x.font = "500 22px Fredoka, sans-serif";
  x.fillText(`Köy seviyesi ${villageLevel(P)} · Pofi: Buz Köyü`, 28, PH + 68);
  return out;
}

async function showPhoto() {
  // dosya baştan hazırlanır: paylaşım penceresi yalnızca dokunuşun hemen ardından açılabilir
  const cv = shootVillage(), url = cv.toDataURL('image/jpeg', 0.9);
  const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.9)), file = new File([blob], 'pofi-koyum.jpg', { type: 'image/jpeg' });
  const canShare = !!navigator.canShare?.({ files: [file] });
  openOverlay(`
    <span class="new-tag">KÖY FOTOĞRAFI</span>
    <h2>Köyün hazır!</h2>
    <img class="photo-prev" src="${url}" alt="Köy fotoğrafı">
    <button id="phShare" class="btn primary big">${canShare ? 'Paylaş' : 'İndir'}</button>
    <button id="phClose" class="btn link">Kapat</button>`);
  $('phClose').onclick = closeOverlay;
  $('phShare').onclick = async () => {
    track('village_photo', { land: P.land || 1 });
    if (!canShare) { downloadFile(blob, file.name); return; }
    try { await navigator.share({ files: [file], title: 'Pofi köyüm' }); } catch { /* paylaşım iptal edildi */ }
  };
}

function downloadFile(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  toast('Dosya indirildi');
}
$('btnPhoto').onclick = showPhoto;

// Kayıt yedeği: kodlama js/backup.js içinde.
async function showBackup() {
  const code = await backupEncode(P);
  openOverlay(`
    <span class="new-tag">KAYIT YEDEĞİ</span>
    <h2>İlerlemeni taşı</h2>
    <p>Bu kodu sakla. Başka cihazda oyunu açıp aşağıya yapıştırınca ilerlemen gelir.</p>
    <textarea id="bkCode" class="code-box" rows="3" readonly>${code}</textarea>
    <button id="bkCopy" class="btn primary big">Kodu kopyala</button>
    <div class="sheet-sec"><b>Yedeği yükle</b><small>Bu cihazdaki ilerlemenin yerini alır</small></div>
    <textarea id="bkIn" class="code-box" rows="2" placeholder="Yedek kodunu buraya yapıştır"></textarea>
    <button id="bkLoad" class="btn secondary" disabled>Yedeği yükle</button>
    <button id="bkClose" class="btn link">Kapat</button>`);
  $('bkCode').onclick = e => e.target.select();
  $('bkClose').onclick = closeOverlay;
  $('bkCopy').onclick = async () => {
    try { await navigator.clipboard.writeText(code); toast('Kod kopyalandı'); track('backup_copy'); }
    catch { $('bkCode').select(); toast('Kodu seçip kopyala'); }
  };
  $('bkIn').oninput = () => { $('bkLoad').disabled = !$('bkIn').value.trim(); };
  $('bkLoad').onclick = async () => {
    const s = await backupDecode($('bkIn').value);
    if (!s) { toast('Bu kod geçersiz', 2400); return; }
    openOverlay(`
      <span class="new-tag">YEDEĞİ YÜKLE</span>
      <h2>Emin misin?</h2>
      <p>Yedekte level ${s.level}, ${fmt(s.coins)} coin var. Bu cihazdaki ilerleme (level ${P.level}, ${fmt(P.coins)} coin) silinip yedekle değiştirilecek.</p>
      <button id="bkYes" class="btn primary big">Evet, yükle</button>
      <button id="bkNo" class="btn link">Vazgeç</button>`);
    $('bkNo').onclick = showBackup;
    $('bkYes').onclick = () => { save(s); track('backup_load'); location.reload(); };
  };
}
$('btnBackup').onclick = showBackup;

// Oynanış verisi: cihazda toplanır, yalnızca oyuncu isteyince dosya olur.
function showStats() {
  const s = statSummary();
  openOverlay(`
    <span class="new-tag">OYNANIŞ VERİSİ</span>
    <h2>Level istatistikleri</h2>
    <p>Bu cihazda ${s.levels} level, ${fmt(s.tries)} deneme kaydedildi. Veri yalnızca bu cihazda durur; denge çalışması için dosya olarak alabilirsin.</p>
    ${s.hard.length ? `<small class="breakdown">En çok zorlanılan: ${s.hard.map(h => `Level ${h.k} (bitirme başına ${h.rate.toFixed(1).replace('.', ',')} deneme)`).join(' · ')}</small>` : ''}
    <button id="stDown" class="btn primary big" ${s.levels ? '' : 'disabled'}>Dosyayı indir (CSV)</button>
    <button id="stClose" class="btn link">Kapat</button>`);
  $('stClose').onclick = closeOverlay;
  $('stDown').onclick = () => downloadFile(new Blob([statCsv()], { type: 'text/csv;charset=utf-8' }), `pofi-oynanis-${dateKey()}.csv`);
}
$('btnStats').onclick = showStats;

// Hata kaydı: bu cihazda yakalanan hatalar (js/errlog.js). Kopyalanan metin test edene gönderilir.
setErrContext(() => ({ ekran: screen, level: P?.level, oyun: run && !run.finished ? (run.def?.n ?? null) : null, ...(clockShift ? { saat: shiftText() } : {}) }));
function renderErrCount() {
  const n = errList().length;
  if (!$('errCount')) return; // eski önbellekli HTML'de satır yoksa oyun yine açılsın
  $('errCount').textContent = n ? `(${n} kayıt)` : '(sorun bildirmek için)';
}
function showErrors() {
  const list = errList();
  const rows = list.slice(-5).reverse().map(e => `<div class="err-row"><small>${new Date(e.t).toLocaleString('tr-TR')}${e.n > 1 ? ` · x${e.n}` : ''}${e.ekran ? ` · ${esc(e.ekran)}` : ''}</small><code>${esc(e.m)}</code></div>`).join('');
  openOverlay(`
    <span class="new-tag">HATA KAYDI</span>
    <h2>${list.length ? `${list.length} kayıt` : 'Kayıtlı hata yok'}</h2>
    <p>${list.length ? 'Oyunda bir sorun yaşadıysan kaydı kopyalayıp bize gönder. Kayıt yalnızca bu cihazda durur.' : 'Oyunda bir hata yakalanırsa burada görünür. Kayıt yalnızca bu cihazda durur.'}</p>
    ${rows ? `<div class="err-list">${rows}</div>` : ''}
    <textarea id="errText" class="err-text hidden" readonly></textarea>
    <button id="errCopy" class="btn primary big" ${list.length ? '' : 'disabled'}>Kaydı kopyala</button>
    ${list.length ? '<button id="errClear" class="btn secondary">Kaydı temizle</button>' : ''}
    <button id="errClose" class="btn link">Kapat</button>`);
  $('errClose').onclick = closeOverlay;
  $('errCopy').onclick = async () => {
    const text = errText();
    try { await navigator.clipboard.writeText(text); toast('Hata kaydı kopyalandı'); }
    catch { const ta = $('errText'); ta.value = text; ta.classList.remove('hidden'); ta.select(); toast('Metni seçip kopyala'); }
    track('errlog_copy', { n: list.length });
  };
  if ($('errClear')) $('errClear').onclick = () => { clearErrors(); renderErrCount(); showErrors(); };
}
if ($('btnErrors')) $('btnErrors').onclick = showErrors;

// Nasıl oynanır: temel kurallar ve oyuncunun karşılaştığı mekanikler (INTRO kartlarıyla aynı metin ve simge).
// Henüz gelmemiş mekanikler gösterilmez (sürpriz bozulmasın); yalnızca sıradakinin leveli yazar.
function showHowTo() {
  const seen = Object.keys(INTRO).map(Number).sort((a, b) => a - b), reached = n => P.level > n || !!P.stars[n];
  const open = seen.filter(reached), next = seen.find(n => !reached(n));
  const rules = [
    ['Kaydır', 'Pofi bir yöne kaydırılınca bir şeye çarpana kadar kayar. Bütün balıkları toplayınca level biter.'],
    ['Yıldızlar', 'En kısa çözüm kadar hamleyle bitirirsen 3 yıldız alırsın. Biraz fazlası 2, daha fazlası 1 yıldız.'],
    ['Hamle sınırı', 'Bazı zor levellerde hamle sayın sınırlıdır. Hamlen biterse +5 hamle kullanabilir ya da leveli baştan alabilirsin.'],
    ['Yardım', 'Geri al son hamleni siler. İpucu sıradaki doğru hamleyi gösterir; rota göster bütün çözümü gösterir, hamleleri yine sen yaparsın.'],
  ];
  if (P.level > SIDE_LEVELS.every) rules.push(['Yan yollar', 'Haritadaki tabelalar farklı hedefli bulmacalar açar: eve dön, kasayı yerleştir ya da bütün çatlak buzu kır.']);
  openOverlay(`
    <span class="new-tag">NASIL OYNANIR</span>
    <h2>Kurallar ve mekanikler</h2>
    <div class="howto-rules">${rules.map(([t, x]) => `<div><b>${t}</b><p>${x}</p></div>`).join('')}</div>
    <h4 class="howto-h">Karşılaştığın mekanikler · ${open.length}/${seen.length}</h4>
    <div class="howto-list">${open.map(n => `<div class="howto-row"><canvas data-ht="${INTRO[n].icon}"></canvas><div><b>${INTRO[n].title}</b><small>Level ${n}</small><p>${INTRO[n].text}</p></div></div>`).join('')}</div>
    ${next ? `<small class="breakdown">Sıradaki yeni mekanik level ${ek(next, 'de')} seni bekliyor.</small>` : '<small class="breakdown">Bütün mekanikleri gördün!</small>'}
    <button id="htClose" class="btn primary big">Tamam</button>`, 'howto');
  $('overlayCard').querySelectorAll('[data-ht]').forEach(cv => drawIntroIcon(cv, cv.dataset.ht, 48));
  $('htClose').onclick = closeOverlay;
  track('howto_open', { seen: open.length });
}
if ($('btnHowTo')) $('btnHowTo').onclick = showHowTo;

// Harita: 3 yıldızı eksik leveller arasında sırayla atlar (tekrar oynayıp yıldız sandıklarını doldurmak için).
let missingAt = 0;
const missingLevels = () => { const out = []; for (let n = 1; n < P.level; n++) if ((P.stars[n] || 0) < 3) out.push(n); return out; };
$('mapMissing').onclick = () => {
  const list = missingLevels();
  if (!list.length) return;
  const n = list.find(k => k > missingAt) || list[0];
  missingAt = n;
  const sc = $('mapScroll');
  sc.scrollTop = Math.max(0, nodeY(n) - sc.clientHeight * 0.5);
  showLevelPopup(n);
};

let last = performance.now(), slowTick = 0;
// Kare döngüsü hataya dayanıklı: bir karede çizim hatası olursa hata günlüğe yazılır, tuvaller sıfırlanır
// (yarıda kalan save/clip durumu sonraki kareye taşınmasın) ve döngü sonraki karede sürer. Oyun donmaz.
// Aynı hata her karede tekrarlarsa günlükte tek satır kalır; sayacı 5 sn'de bir topluca artar (her karede depolamaya yazılmaz).
let frameErr = { key: '', at: 0, n: 0, wait: 0 };
function frame(now) {
  try { drawFrame(now); } catch (e) { frameFailed(e, now); }
  requestAnimationFrame(frame);
}
function frameFailed(e, now) {
  const key = String(e?.message || e);
  const fresh = key !== frameErr.key;
  frameErr.n = fresh ? 1 : frameErr.n + 1;
  frameErr.wait = fresh ? 1 : frameErr.wait + 1;
  if (fresh || now - frameErr.at > 5000) {
    logError(`Kare (${screen}): ${key}`, e?.stack, frameErr.wait);
    frameErr.at = now;
    frameErr.wait = 0;
  }
  frameErr.key = key;
  if (fresh || frameErr.n % 60 === 0) resetCanvases();
}
function resetCanvases() {
  for (const v of [village, visitView, homeView]) { try { if (v.W) v.resize(); } catch { /* sonraki karede yine denenir */ } }
  try { if (run) board.resize(); } catch { /* yoksay */ }
  // fitCanvas ile her karede çizilenler: genişlik 0 olunca sonraki karede durumu temiz yeniden ayrılır
  for (const id of ['mapCanvas', 'homePofi', 'roomCanvas', 'wardrobePofi', 'wardrobeFloatPofi']) { const cv = $(id); if (cv) cv.width = 0; }
}
function drawFrame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = now / 1000;
  if (screen === 'game' && run) { board.update(dt); board.draw(t); }
  else if (screen === 'map') drawMap(t);
  else if (screen === 'village') {
    const open = BUILDINGS.filter(b => isUnlocked(P, b) && !P.village[b.id]);
    village.draw(t, dt, {
      ...villageScene(),
      plots: open.map(b => b.id), ready: open.filter(b => P.flakes >= b.costs[0]).map(b => b.id),
      upgradable: upgradeHint(),
      cocoa: { cups: Math.floor(cocoaNow()), cap: cocoaCap() }, pier: pierInfo(), orders: orderMarks(), homeReady: homesReady(), task: taskMarker(),
      merchant: !!merchantToday(),
    });
    if ((slowTick += dt) > 1) { slowTick = 0; renderCocoa(); }
    if (village.panel !== shownPanel) renderZoneTag();
  } else if (screen === 'visit' && visit) {
    visitView.draw(t, dt, { village: visit.village, vl: villageLevel({ village: visit.village }), outfit: visit.outfit, colors: COLORS, plots: [], ready: [], land: landOf(visit.village), teaser: false });
  } else if (screen === 'home') {
    if (!homeView.W) homeView.resize();
    homeView.draw(t, dt, { ...villageScene(), plots: [], ready: [], teaser: false, scene: true, pet: null });
    const r = $('homePofi').getBoundingClientRect(), s = r.height;
    if (s) {
      const ctx = fitCanvas($('homePofi'), r.width, s);
      drawPofi(ctx, P.pet ? r.width * 0.38 : r.width / 2, s - 3, s * 0.82, { outfit: P.outfit, wave: Math.max(0, Math.sin(t * 2.2)) * 0.6, blink: (t % 3.4) < 0.12 });
      if (P.pet) drawPet(ctx, r.width * 0.76, s - 3, s * 0.38, { kind: P.pet.kind, pose: petFedToday(P) ? 'stand' : 'sleep', t, collar: collarHex() });
    }
  } else if (screen === 'interior' && room) {
    const r = $('roomCanvas').getBoundingClientRect();
    if (r.width) {
      // Önizlenen kademe odada gerçekmiş gibi görünür; satın alınmadan kaydedilmez.
      const items = { ...(P.interior[room.id] || {}) };
      if (room.draft) items[room.slot] = room.draft;
      const a = room.anim, p = a ? (t - a.t0) / 0.85 : 0;
      const door = a && p < 1 ? { k: a.out ? p : 1 - p, x0: a.out ? a.x0 : 0.56 + 0.08 * Math.sin(t * 0.5), face: a.out ? 1 : -1 } : null;
      drawRoom(fitCanvas($('roomCanvas'), r.width, r.height), r.width, r.height, t, { items, highlight: a?.out ? null : room.slot, highlightTier: items[room.slot] || 0, outfit: P.outfit, door, cheer: t < (room.cheer || 0), pet: P.pet ? { kind: P.pet.kind, collar: collarHex(), awake: petFedToday(P) } : null });
      if (a && p >= 1) { if (a.out) leaveRoom(); else room.anim = null; }
    }
  } else if (screen === 'wardrobe') {
    const r = $('wardrobePofi').getBoundingClientRect();
    if (r.width) {
      const ctx = fitCanvas($('wardrobePofi'), r.width, r.height);
      // Denenen (henüz alınmamış) parça burada görünür: önce dene, sonra satın al. İfade sekmesinde seçili ifade oynar.
      drawPofi(ctx, r.width / 2, r.height - 12 - emoteBob(t), r.height * 0.8, { outfit: previewOutfit(), ...emotePose(wardrobeCat === 'emote' ? emoteDraft || 'wave' : null, t), ...(t < wardrobeCheer ? { happy: true } : {}) });
      // Büyük önizleme kaydırınca görünmez olursa küçük önizleme sağ üstte takip eder (denenen parça anlık görünür).
      const off = r.bottom < $('screenWardrobe').getBoundingClientRect().top + 70;
      $('wardrobeFloat').classList.toggle('hidden', !off);
      if (off) {
        const fr = $('wardrobeFloatPofi').getBoundingClientRect();
        if (fr.width) drawPofi(fitCanvas($('wardrobeFloatPofi'), fr.width, fr.height), fr.width / 2, fr.height - 6, fr.height * 0.8, { outfit: previewOutfit(), wave: Math.max(0, Math.sin(t * 2.2)) * 0.6, blink: (t % 3.4) < 0.12 });
      }
    }
  }
}

noteAway();
if (bLevel(P, 'pier') && !P.pierTs) bankPier(); // eski kayıtlarda iskele bugünden itibaren tutar
ensureFestival(); // ay değiştiyse geçen ayın kalan ödülleri verilir
updateWallet();
requestAnimationFrame(frame);
boot();
