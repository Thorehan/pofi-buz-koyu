// Kullanım: node tools/smoke.mjs [levelSayısı]   (varsayılan: hepsi, yaklaşık 2 sn)
// Hızlı duman testi: her geliştirme turunda çalışır. Hiçbir dosyayı değiştirmez, yalnızca okur.
// 1. Leveller: ilk N level, yan yollar ve usta levelleri çözülebilir mi, en kısa çözüm kayıtlı "min" ile aynı mı?
// 2. Ayarlar: her başarımın sayacı var mı; kod ve CSS'teki her ikon, görsel ve müzik dosyası diskte var mı?
// 3. Kayıt: boş kayıt ve eski biçimli kayıt hatasız açılıyor mu? Yedek kodu her alanı kayıpsız taşıyor mu?
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

// yedek kodu: dolu bir kayıt koda çevrilip geri açılınca aynı mı? (sıkıştırmalı ve sıkıştırmasız)
const BK = await import(pathToFileURL(rel('js/backup.js')).href);
try {
  const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  const rich = { ...SV.load(),
    profile: { name: 'Ayşe Öztürk 🐧', method: 'guest', createdAt: 1762600000000 },
    level: 312, coins: 98765, flakes: 42, stars: { 1: 3, 2: 2, 311: 1 },
    village: { igloo: { lv: 3, style: 1, color: 'mint' }, cocoa: { lv: 2, style: 0, color: null }, pier: { lv: 1, style: 0, color: null } },
    villageName: 'Kuzey Işığı Köyü', cocoaCups: 3.75, pierFish: 1.5,
    orders: { day: '2026-11-08', list: [{ giver: 'nana', kind: 'cups', n: 6, done: false }, { giver: 'kiko', kind: 'fish', n: 3, done: true }], bonus: false },
    festival: { month: '2026-11', pts: 412, claimed: [true, true, false], given: { cups: 40, fish: 30, coins: 2000 } },
    storySeen: [0, 1], shopSeen: '2026-11-08', unlocksSeen: ['orders', 'festival'],
    pet: { kind: 'fox', kinds: ['fox'], names: { fox: { name: 'Şimşek', named: true } }, collar: 'red', bed: null, toys: ['ball'], toy: 'ball', collars: ['red'], fedDay: '2026-11-08' },
    friends: { nana: { pts: 14, ch: 2, talk: '2026-11-08', gift: '' } },
    ach: { fish: 900, cups: 120, nohint: 80, events: 3, streak: 9, orders: 25 },
    settings: { haptics: false, sfx: true, ambient: true, music: false },
  };
  for (const gzip of [true, false]) {
    const code = await BK.backupEncode(rich, { gzip });
    const back = await BK.backupDecode(code);
    if (!back) { fail(`Yedek kodu geri açılmadı (${gzip ? 'sıkıştırmalı' : 'sıkıştırmasız'})`); continue; }
    for (const k of Object.keys(rich)) if (!same(rich[k], back[k])) fail(`Yedekte "${k}" alanı değişti`);
    // yüklenen kayıt oyunun açılışından (göç dahil) aynen geçmeli
    store['pofi.v1'] = JSON.stringify(back);
    const loaded = SV.load();
    for (const k of Object.keys(rich)) if (!same(rich[k], loaded[k])) fail(`Yedek yüklenince "${k}" alanı değişti`);
    // kodun başına/sonuna boşluk ve satır sonu girse de açılmalı (kopyala-yapıştır)
    if (!(await BK.backupDecode(`  ${code.slice(0, 20)}\n${code.slice(20)} `))) fail('Boşluklu yedek kodu açılmadı');
  }
  // "<" ve ">" içeren ad: kod reddedilmez, işaretler silinir
  const tag = await BK.backupDecode(await BK.backupEncode({ ...rich, profile: { ...rich.profile, name: '<3 Ali>' } }));
  if (!tag || tag.profile.name !== '3 Ali') fail('"<" içeren adlı yedek yüklenemedi ya da temizlenmedi');
  for (const bad of ['', 'PF1.', 'PF1.abc', 'XX1.AAAA', 'PF0.' + Buffer.from('[1,2]').toString('base64url'), 'PF0.' + Buffer.from('{"level":"5"}').toString('base64url')]) {
    if (await BK.backupDecode(bad)) fail(`Geçersiz yedek kodu kabul edildi: "${bad.slice(0, 20)}"`);
  }
} catch (e) { fail(`Yedek testi patladı: ${e.message}`); }
notes.push('Yedek: dolu kayıt koda çevrilip geri açıldı, her alan aynı');

// yeni sürüm denetimi: imza dosya değişince değişiyor mu, ağ yokken sessiz mi?
const UP = await import(pathToFileURL(rel('js/update.js')).href);
try {
  const page = new URL('https://x.github.io/pofi/');
  const files = UP.codeFiles([{ name: 'https://x.github.io/pofi/js/main.js?v=2' }, { name: 'https://x.github.io/pofi/css/style.css' },
    { name: 'https://x.github.io/pofi/assets/art/a.webp' }, { name: 'https://fonts.example/f.css' }, { name: 'https://x.github.io/pofi/sw.js' }], page);
  if (files.join(',') !== '/pofi/,/pofi/css/style.css,/pofi/js/main.js') fail(`Sürüm denetimi yanlış dosyalara bakıyor: ${files.join(',')}`);
  const server = { '/pofi/': { etag: 'a' }, '/pofi/css/style.css': { 'last-modified': 'Sun', 'content-length': '10' }, '/pofi/js/main.js': { etag: 'b' } };
  const head = async p => { if (!server[p]) throw new Error('ağ yok'); return new Map(Object.entries(server[p])); };
  const s1 = await UP.codeSignature(files, head), s2 = await UP.codeSignature(files, head);
  if (!s1 || s1 !== s2) fail('Sürüm imzası değişmediği hâlde farklı çıktı');
  server['/pofi/css/style.css']['content-length'] = '11';
  if ((await UP.codeSignature(files, head)) === s1) fail('Dosya değiştiği hâlde sürüm imzası aynı kaldı');
  delete server['/pofi/js/main.js'];
  if ((await UP.codeSignature(files, head)) !== null) fail('Ağ yokken sürüm denetimi sessiz kalmadı');
} catch (e) { fail(`Sürüm denetimi testi patladı: ${e.message}`); }
notes.push('Yeni sürüm: imza dosya değişince değişiyor, ağ yokken denetim atlanıyor');

// ---------- 4. servis çalışanı: çevrimdışı ses ----------
// sw.js sahte önbellek ve sahte ağla çalıştırılır (tarayıcı paneli servis çalışanı kaydına izin vermiyor).
try {
  const files = { '/assets/music/jingle_win.m4a': readFileSync(rel('assets/music/jingle_win.m4a')) };
  let online = true;
  const netFetch = async input => {
    const path = new URL(typeof input === 'string' ? input : input.url, 'http://localhost/').pathname;
    if (!online) throw new TypeError('çevrimdışı');
    const body = files[path];
    return body ? new Response(body, { status: 200, headers: { 'Content-Type': 'audio/mp4' } }) : new Response('yok', { status: 404 });
  };
  const stores = new Map();
  const keyOf = k => (typeof k === 'string' ? k : new URL(k.url).pathname);
  const cachesMock = {
    open: async name => {
      if (!stores.has(name)) stores.set(name, new Map());
      const m = stores.get(name);
      return { match: async k => m.get(keyOf(k))?.clone(), put: async (k, r) => { m.set(keyOf(k), r.clone()); } };
    },
    keys: async () => [...stores.keys()],
    delete: async n => stores.delete(n),
  };
  const handlers = {};
  const selfMock = { addEventListener: (t, fn) => { handlers[t] = fn; }, skipWaiting() {}, clients: { claim: async () => {} } };
  new Function('self', 'caches', 'fetch', 'location', read('sw.js'))(selfMock, cachesMock, netFetch, { origin: 'http://localhost' });
  const fire = async (path, range) => {
    const waits = [];
    let res;
    const headers = new Headers(range ? { Range: range } : {});
    handlers.fetch({ request: { url: `http://localhost${path}`, method: 'GET', headers }, respondWith: p => { res = p; }, waitUntil: p => waits.push(p) });
    const r = await res;
    await Promise.all(waits);
    return r;
  };
  const P = '/assets/music/jingle_win.m4a', size = files[P].length;
  const r1 = await fire(P, 'bytes=0-99');
  if (r1.status !== 200) fail(`Ses: ilk istek ağdan gelmeli, durum ${r1.status}`);
  const audio = stores.get('pofi-audio-v1');
  if (!audio?.has(P)) fail('Ses: ilk çalıştan sonra tam dosya önbelleğe girmedi');
  online = false;
  const r2 = await fire(P, 'bytes=100-199'), b2 = new Uint8Array(await r2.arrayBuffer());
  if (r2.status !== 206 || b2.length !== 100 || r2.headers.get('content-range') !== `bytes 100-199/${size}`) fail(`Ses: çevrimdışı parça isteği hatalı (${r2.status}, ${b2.length} bayt)`);
  if (!b2.every((v, i) => v === files[P][100 + i])) fail('Ses: kesilen parça dosyayla aynı değil');
  const r3 = await fire(P, 'bytes=-50');
  if (r3.headers.get('content-range') !== `bytes ${size - 50}-${size - 1}/${size}`) fail('Ses: "son N bayt" isteği hatalı');
  const r4 = await fire(P, `bytes=${size + 10}-`);
  if (r4.status !== 416) fail('Ses: dosya dışı parça isteği 416 dönmeli');
  const r5 = await fire(P);
  if (r5.status !== 200 || (await r5.arrayBuffer()).byteLength !== size) fail('Ses: çevrimdışı tam dosya isteği hatalı');
  notes.push('Servis çalışanı: ses önbelleğe giriyor, çevrimdışı parça ve tam istekler önbellekten karşılanıyor');
} catch (e) { fail(`Servis çalışanı testi patladı: ${e.message}`); }

// ---------- sonuç ----------
for (const n of notes) console.log('·', n);
if (fails.length) {
  console.log(`\n✗ ${fails.length} sorun:`);
  for (const f of fails) console.log('  -', f);
  process.exit(1);
}
console.log('\n✓ Duman testi geçti');
