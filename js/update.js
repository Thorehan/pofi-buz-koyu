// Yeni sürüm denetimi: oyun açıkken (ya da telefonda arka planda beklerken) yeni sürüm yayına alınırsa bunu fark eder.
// Derleme adımı ve sürüm dosyası yok; bunun yerine sayfanın yüklediği kod dosyalarının (html, js, css, json)
// sunucudaki imzasına (ETag ya da Last-Modified + boyut) HEAD isteğiyle bakılır. Bir dosya değişince imza değişir.
// HEAD istekleri servis çalışanından geçmez, doğrudan sunucuya gider; ağ yoksa denetim sessizce atlanır.
// tools/smoke.mjs codeSignature'ı sahte ağla dener.

const CODE_RE = /\.(js|css|html|json)$/;

// Sayfanın şu ana kadar yüklediği kendi kod dosyaları ve sayfanın kendisi (sorgu dizesi olmadan).
export function codeFiles(entries = performance.getEntriesByType('resource'), page = location) {
  const own = entries.map(e => new URL(e.name, page.href)).filter(u => u.origin === page.origin && CODE_RE.test(u.pathname)).map(u => u.pathname);
  return [...new Set([page.pathname, ...own])].filter(p => !p.endsWith('/sw.js')).sort();
}

const headOf = async path => {
  const r = await fetch(path, { method: 'HEAD', cache: 'no-store' });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.headers;
};

// Dosyaların imzası; ağ yoksa ya da bir dosya alınamazsa null (yanlış "yeni sürüm" demesin).
export async function codeSignature(paths, head = headOf) {
  try {
    const parts = await Promise.all(paths.map(async p => {
      const h = await head(p);
      const tag = h.get('etag') || `${h.get('last-modified') || ''}/${h.get('content-length') || ''}`;
      return `${p}=${tag}`;
    }));
    return parts.join('\n');
  } catch { return null; }
}

// İlk imza açılıştan biraz sonra alınır (geç yüklenen modüller de girsin). Sonra sekme görünür olunca
// (en az 10 dk arayla) ve açık kaldıkça 30 dk'da bir bakılır. Değişiklik görülünce onNew bir kez çağrılır.
export function watchUpdates(onNew, { firstMs = 8000, minGapMs = 10 * 60e3, everyMs = 30 * 60e3 } = {}) {
  let files = null, base = null, lastCheck = 0, found = false, busy = false;
  const check = async () => {
    if (found || busy || document.visibilityState !== 'visible') return;
    busy = true;
    lastCheck = Date.now();
    try {
      if (!base) { files = codeFiles(); base = await codeSignature(files); return; }
      const now = await codeSignature(files);
      if (now && now !== base) { found = true; onNew(); }
    } finally { busy = false; }
  };
  setTimeout(check, firstMs);
  setInterval(check, everyMs);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - lastCheck > minGapMs) check();
  });
  return check; // deneme ve elle denetim için
}
