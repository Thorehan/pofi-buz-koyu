// Kullanım: node tools/smoke.mjs [levelSayısı]   (varsayılan: hepsi, yaklaşık 2 sn)
// Hızlı duman testi: her geliştirme turunda çalışır. Hiçbir dosyayı değiştirmez, yalnızca okur.
// 1. Leveller: ilk N level, yan yollar ve usta levelleri çözülebilir mi, en kısa çözüm kayıtlı "min" ile aynı mı?
// 2. Ayarlar: her başarımın sayacı var mı; kod ve CSS'teki her ikon, görsel ve müzik dosyası diskte var mı?
// 3. Kayıt: boş kayıt ve eski biçimli kayıt hatasız açılıyor mu?
// Hata varsa çıkış kodu 1 olur ve sorunlar listelenir.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rel = p => join(root, p);
const read = p => readFileSync(rel(p), 'utf8');
const E = await import(pathToFileURL(rel('js/engine.js')).href);
const C = await import(pathToFileURL(rel('js/config.js')).href);

const N = Math.max(1, +process.argv[2] || Infinity);
const fails = [], notes = [];
const fail = m => fails.push(m);
const t0 = Date.now();

// ---------- 1. leveller ----------
function check(def, label) {
  let L, S;
  try { ({ L, S } = E.parseLevel(def)); } catch (e) { fail(`${label}: okunamadı (${e.message})`); return; }
  const sol = E.solve(L, S, 400000);
  if (!sol) { fail(`${label}: çözüm bulunamadı`); return; }
  if (def.min && sol.length !== def.min) fail(`${label}: en kısa çözüm ${sol.length}, kayıtlı min ${def.min}`);
  if (def.limit && sol.length > def.limit) fail(`${label}: çözüm ${sol.length} hamle, limit ${def.limit}`);
}
const levels = JSON.parse(read('data/levels.json'));
for (const def of levels.slice(0, N)) check(def, `Level ${def.n}`);
const sides = JSON.parse(read('data/goals.json'));
sides.forEach((d, i) => check(d, `Yan yol ${i + 1} (${d.goal})`));
if (sides.length < C.SIDE_LEVELS.count) fail(`Yan yol sayısı ${sides.length}, ayarda ${C.SIDE_LEVELS.count}`);
const masters = JSON.parse(read('data/masters.json'));
masters.forEach((d, i) => check(d, `Usta ${i + 1}`));
notes.push(`${Math.min(N, levels.length)} level, ${sides.length} yan yol, ${masters.length} usta leveli çözüldü (${((Date.now() - t0) / 1000).toFixed(1)} sn)`);

// ---------- 2. ayarlar ve dosyalar ----------
const main = read('js/main.js'), css = read('css/style.css'), html = read('index.html');
const statCases = new Set([...main.matchAll(/case '([a-z]+)':/g)].map(m => m[1]));
const achCounters = new Set([...main.matchAll(/P\.ach\.([a-zA-Z]+)\s*=/g)].map(m => m[1]));
for (const a of C.ACHIEVEMENTS) {
  if (!statCases.has(a.stat) && !achCounters.has(a.stat)) fail(`Başarım "${a.id}": "${a.stat}" sayacı hiçbir yerde artmıyor`);
}
// CSS'teki her görsel
for (const [, p] of css.matchAll(/url\(\.\.\/(assets\/[^)]+)\)/g)) if (!existsSync(rel(p))) fail(`CSS görseli yok: ${p}`);
// kodda ve HTML'de kullanılan her .ui-<id> sınıfının CSS kuralı
const uiRules = new Set([...css.matchAll(/\.ui-([a-z_0-9]+)\s*\{/g)].map(m => m[1]));
const uiUsed = new Set([
  ...[...main.matchAll(/ui\('([a-z_0-9]+)'\)/g)].map(m => m[1]),
  ...[...html.matchAll(/class="ui ui-([a-z_0-9]+)"/g)].map(m => m[1]),
  ...[...read('js/config.js').matchAll(/\bui: '([a-z_0-9]+)'/g)].map(m => m[1]),
]);
for (const id of uiUsed) if (!uiRules.has(id)) fail(`İkon kuralı yok: .ui-${id}`);
// UNLOCKS ikonları (ico: 'x' biçimi, ui() ile çizilir)
const unl = main.slice(main.indexOf('const UNLOCKS = ['), main.indexOf('];', main.indexOf('const UNLOCKS = [')));
for (const [, id] of unl.matchAll(/ico: '([a-z_0-9]+)'/g)) if (!uiRules.has(id)) fail(`Tanıtım kartı ikonu yok: .ui-${id}`);
// art('...') ile istenen sabit görseller
for (const [, id] of main.matchAll(/art\('([a-z_0-9]+)'\)/g)) if (!existsSync(rel(`assets/art/${id}.webp`))) fail(`Görsel yok: assets/art/${id}.webp`);
// müzik dosyaları
const tracks = [];
const walk = v => { if (typeof v === 'string') tracks.push(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
walk(C.MUSIC);
for (const t of tracks.filter(t => t.startsWith('assets/'))) if (!existsSync(rel(t))) fail(`Müzik dosyası yok: ${t}`);
notes.push(`${C.ACHIEVEMENTS.length} başarım, ${uiUsed.size} ikon, ${tracks.length} müzik yolu denetlendi`);

// ---------- 3. kayıt ----------
const store = {};
globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
const SV = await import(pathToFileURL(rel('js/save.js')).href);
try {
  const fresh = SV.load();
  for (const k of ['orders', 'festival', 'pierFish', 'village', 'ach']) if (!(k in fresh)) fail(`Boş kayıtta "${k}" alanı yok`);
  // eski biçim: köy yapısı sayı, kakao coin olarak birikmiş, ara reklam sayaçları duruyor
  store['pofi.v1'] = JSON.stringify({ level: 12, coins: 300, village: { igloo: 1, pier: 0 }, cocoaBank: 50, levelsSinceInter: 3 });
  const old = SV.load();
  if (typeof old.village.igloo !== 'object' || old.village.igloo.lv !== 1) fail('Eski köy kaydı yeni biçime çevrilmedi');
  if (old.cocoaBank !== undefined || old.cocoaCups !== 10) fail('Eski kakao birikimi fincana çevrilmedi');
  if ('levelsSinceInter' in old) fail('Ara reklam sayacı temizlenmedi');
  if (old.orders !== null || old.festival !== null) fail('Eski kayda yeni alanlar varsayılanla eklenmedi');
  store['pofi.v1'] = '{bozuk';
  if (SV.load().level !== 1) fail('Bozuk kayıt boş kayda dönmedi');
} catch (e) { fail(`Kayıt testi patladı: ${e.message}`); }
notes.push('Kayıt: boş, eski ve bozuk kayıt denendi');

// ---------- sonuç ----------
for (const n of notes) console.log('·', n);
if (fails.length) {
  console.log(`\n✗ ${fails.length} sorun:`);
  for (const f of fails) console.log('  -', f);
  process.exit(1);
}
console.log('\n✓ Duman testi geçti');
