// Servis çalışanı: oyunu telefona kurulabilir ve çevrimdışı açılabilir yapar.
// Kod ve veri (html, js, css, json) her zaman önce ağdan, tarayıcı önbelleğini atlayarak alınır; böylece
// güncellemeden sonra eski ve yeni dosyalar karışmaz. Ağ yoksa son kaydedilen sürüm açılır.
// Görseller önbellekten gelir (değişmezler; değişirse adları değişir).
// Müzik ve jingle'lar (assets/music) ilk çalındıklarında tam dosya olarak önbelleğe alınır. Tarayıcı sesi
// parça parça (Range) ister; önbellekteki dosyadan istenen parça kesilip verilir. Böylece uçak modunda da çalar.
// İlk açılış çevrimdışı: kurulurken temel dosyalar önceden indirilir; oyun bir kez açıldıktan sonra uçak modunda
// baştan açılabilir. Liste elle tutulur; tools/smoke.mjs her js/ ve data/ dosyasının, CSS görsellerinin ve
// art.js'teki PRELOAD görsellerinin burada olduğunu ve listedeki her dosyanın diskte durduğunu denetler.
const CODE = 'pofi-code-v1';
const MEDIA = 'pofi-media-v1';
const AUDIO = 'pofi-audio-v1';

const CORE = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/ads.js', 'js/art.js', 'js/backup.js', 'js/board.js', 'js/clock.js', 'js/config.js',
  'js/draw.js', 'js/engine.js', 'js/errlog.js', 'js/interior.js', 'js/live.js', 'js/main.js',
  'js/meta.js', 'js/save.js', 'js/sound.js', 'js/stats.js', 'js/town.js', 'js/townart.js',
  'js/tr.js', 'js/update.js', 'js/village.js',
  'data/goals.json', 'data/levels.json', 'data/masters.json',
];
const CORE_MEDIA = [
  'assets/funday-morning-logo.webp', 'assets/icons/icon-192.png', 'assets/icons/apple-180.png',
  'assets/art/pofi_stand_front.webp', 'assets/art/pofi_stand_side.webp', 'assets/art/pofi_slide_side.webp',
  'assets/art/pofi_slide_front.webp', 'assets/art/pofi_slide_back.webp', 'assets/art/pofi_happy.webp',
  'assets/art/pofi_recover.webp', 'assets/art/tile_ice.webp', 'assets/art/tile_snow.webp',
  'assets/art/tile_rock.webp', 'assets/art/tile_water.webp', 'assets/art/tile_crack.webp',
  'assets/art/tile_ramp.webp', 'assets/art/tile_hole.webp', 'assets/art/tile_melt.webp',
  'assets/art/bg_sky_pano.webp', 'assets/art/bg_village_pano.webp', 'assets/art/bg_aurora.webp',
  'assets/art/tile_bridge.webp', 'assets/art/obj_crate.webp', 'assets/art/obj_fish.webp',
  'assets/art/obj_seal.webp', 'assets/art/obj_arrow.webp', 'assets/art/booster_pick.webp',
  'assets/art/booster_shovel.webp', 'assets/art/booster_whistle.webp', 'assets/art/ui_lock.webp',
  'assets/art/ui_tab_home.webp', 'assets/art/map_castle.webp', 'assets/art/ui_ad.webp',
  'assets/art/ui_back.webp', 'assets/art/ui_close.webp', 'assets/art/ui_coin.webp',
  'assets/art/ui_decor.webp', 'assets/art/ui_emote.webp', 'assets/art/ui_event.webp',
  'assets/art/ui_flake.webp', 'assets/art/ui_gazette.webp', 'assets/art/ui_gift.webp',
  'assets/art/ui_hat.webp', 'assets/art/ui_hint.webp', 'assets/art/ui_map.webp',
  'assets/art/ui_market.webp', 'assets/art/ui_merchant.webp', 'assets/art/ui_moves.webp',
  'assets/art/ui_music.webp', 'assets/art/ui_pet.webp', 'assets/art/ui_photo.webp',
  'assets/art/ui_power.webp', 'assets/art/ui_project.webp', 'assets/art/ui_puzzle.webp',
  'assets/art/ui_quests.webp', 'assets/art/ui_restart.webp', 'assets/art/ui_route.webp',
  'assets/art/ui_scarf.webp', 'assets/art/ui_share.webp', 'assets/art/ui_sound.webp',
  'assets/art/ui_tab_settings.webp', 'assets/art/ui_tab_shop.webp', 'assets/art/ui_tab_village.webp',
  'assets/art/ui_tab_wardrobe.webp', 'assets/art/ui_undo.webp', 'assets/art/ui_vibrate.webp',
  'assets/art/ui_villagers.webp', 'assets/art/ui_visit.webp',
];

// Bir dosya alınamazsa kurulum durmaz (o dosya ilk kullanıldığında yine önbelleğe girer).
async function precache() {
  const base = new URL('./', location.href);
  const code = await caches.open(CODE), media = await caches.open(MEDIA);
  await Promise.all([
    ...CORE.map(async p => {
      const url = new URL(p, base).href;
      try { const r = await fetch(url, { cache: 'no-cache' }); if (r.ok && r.status === 200) await code.put(url, r); } catch { /* ağ yok */ }
    }),
    ...CORE_MEDIA.map(async p => {
      const url = new URL(p, base).href;
      try { if (await media.match(url)) return; const r = await fetch(url); if (r.ok && r.status === 200) await media.put(url, r); } catch { /* ağ yok */ }
    }),
  ]);
}

self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(precache()); });
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (![CODE, MEDIA, AUDIO].includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

const isMedia = url => /\/assets\/.*\.(webp|png|jpg|svg)$/.test(url.pathname);
const isAudio = url => /\/assets\/music\/.*\.(m4a|mp3|ogg|wav)$/.test(url.pathname);

// Tam dosyayı (Range'siz) indirip önbelleğe koyar. Aynı dosya için aynı anda tek indirme yapılır.
const pending = new Map();
function cacheFullAudio(path) {
  if (!pending.has(path)) {
    pending.set(path, (async () => {
      try {
        const res = await fetch(path);
        if (res.ok && res.status === 200) await (await caches.open(AUDIO)).put(path, res);
      } catch { /* ağ yoksa sonraki çalışta yeniden denenir */ } finally { pending.delete(path); }
    })());
  }
  return pending.get(path);
}

// Önbellekteki tam dosyadan istenen parçayı 206 cevabı olarak kurar ("bytes=başlangıç-bitiş").
async function rangeResponse(full, range) {
  const buf = await full.arrayBuffer(), size = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(range || '');
  let start = m && m[1] !== '' ? +m[1] : 0, end = m && m[2] !== '' ? +m[2] : size - 1;
  if (m && m[1] === '' && m[2] !== '') { start = Math.max(0, size - +m[2]); end = size - 1; } // "bytes=-500": son 500 bayt
  end = Math.min(end, size - 1);
  if (start >= size || start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': full.headers.get('Content-Type') || 'audio/mp4',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return; // yazı tipleri vb. tarayıcıya kalsın
  if (isAudio(url)) {
    e.respondWith((async () => {
      const full = await (await caches.open(AUDIO)).match(url.pathname);
      if (full) return req.headers.has('range') ? rangeResponse(full, req.headers.get('range')) : full;
      // önbellekte yok: bu istek ağdan karşılanır, tam dosya arka planda önbelleğe alınır
      e.waitUntil(cacheFullAudio(url.pathname));
      return fetch(req);
    })());
    return;
  }
  if (isMedia(url)) {
    e.respondWith((async () => {
      const cache = await caches.open(MEDIA);
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok && res.status === 200) cache.put(req, res.clone()).catch(() => {});
      return res;
    })());
    return;
  }
  e.respondWith((async () => {
    const cache = await caches.open(CODE);
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res.ok && res.status === 200) cache.put(req, res.clone()).catch(() => {});
      return res;
    } catch {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      throw new Error('çevrimdışı ve önbellekte yok');
    }
  })());
});
