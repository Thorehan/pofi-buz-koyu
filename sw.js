// Servis çalışanı: oyunu telefona kurulabilir ve çevrimdışı açılabilir yapar.
// Kod ve veri (html, js, css, json) her zaman önce ağdan, tarayıcı önbelleğini atlayarak alınır; böylece
// güncellemeden sonra eski ve yeni dosyalar karışmaz. Ağ yoksa son kaydedilen sürüm açılır.
// Görseller önbellekten gelir (değişmezler; değişirse adları değişir).
// Müzik ve jingle'lar (assets/music) ilk çalındıklarında tam dosya olarak önbelleğe alınır. Tarayıcı sesi
// parça parça (Range) ister; önbellekteki dosyadan istenen parça kesilip verilir. Böylece uçak modunda da çalar.
const CODE = 'pofi-code-v1';
const MEDIA = 'pofi-media-v1';
const AUDIO = 'pofi-audio-v1';

self.addEventListener('install', () => self.skipWaiting());
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
