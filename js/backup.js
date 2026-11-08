// Kayıt yedeği: kayıt sıkıştırılıp metin koduna çevrilir, başka cihaza yapıştırılır. Sunucu yok.
// Kayıt bütünüyle (her alan) taşınır; yeni alanlar için burada bir şey yapmak gerekmez.
// tools/smoke.mjs bu modülü doğrudan dener (yedek → geri yükleme kayıpsız mı).

function b64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const unb64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
async function streamBytes(bytes, stream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}

export async function backupEncode(save, { gzip = typeof CompressionStream !== 'undefined' } = {}) {
  const raw = new TextEncoder().encode(JSON.stringify(save));
  if (!gzip) return `PF0.${b64(raw)}`;
  return `PF1.${b64(await streamBytes(raw, new CompressionStream('gzip')))}`;
}

// Kodun içinde HTML olamaz: isimler ekranda gösterildiği için başkasının kodu da güvenli kalsın.
// Eskiden "<" ya da ">" içeren kod tümden reddediliyordu; oyuncu adında "<3" olan biri kendi yedeğini
// yükleyemiyordu. Artık bu işaretler metinlerden silinir, kayıt yüklenir.
function stripTags(v) {
  if (typeof v === 'string') return v.replace(/[<>]/g, '');
  if (Array.isArray(v)) return v.map(stripTags);
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) o[k.replace(/[<>]/g, '')] = stripTags(x);
    return o;
  }
  return v;
}

// Geçersizse null.
export async function backupDecode(code) {
  const m = /^PF([01])\.([\w-]+)$/.exec(String(code).replace(/\s+/g, ''));
  if (!m) return null;
  try {
    const bytes = m[1] === '1' ? await streamBytes(unb64(m[2]), new DecompressionStream('gzip')) : unb64(m[2]);
    const s = JSON.parse(new TextDecoder().decode(bytes));
    if (!s || typeof s !== 'object' || Array.isArray(s)) return null;
    return Number.isInteger(s.level) && Number.isFinite(s.coins) && s.stars && s.village ? stripTags(s) : null;
  } catch { return null; }
}
