// Servis çalışanı: oyunu telefona kurulabilir ve çevrimdışı açılabilir yapar.
// Kod ve veri (html, js, css, json) her zaman önce ağdan, tarayıcı önbelleğini atlayarak alınır; böylece
// güncellemeden sonra eski ve yeni dosyalar karışmaz. Ağ yoksa son kaydedilen sürüm açılır.
// Görseller önbellekten gelir (değişmezler; değişirse adları değişir). Sesler tarayıcıya bırakılır.
const CODE = 'pofi-code-v1';
const MEDIA = 'pofi-media-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (![CODE, MEDIA].includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

const isMedia = url => /\/assets\/.*\.(webp|png|jpg|svg)$/.test(url.pathname);

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return; // yazı tipleri vb. tarayıcıya kalsın
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
