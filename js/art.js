// Üretilmiş görseller (assets/art). Yüklenemeyen ya da kapatılan görselin yerine
// kodla çizilen eski hâli kullanılır; bu yüzden her çağıran null'a hazırlıklıdır.
// Açılışta yalnızca Pofi, karolar ve köy katmanları yüklenir; yapılar ilk istendiklerinde yüklenir.
const PRELOAD = [
  'pofi_stand_front', 'pofi_stand_side', 'pofi_slide_side', 'pofi_slide_front', 'pofi_slide_back', 'pofi_happy', 'pofi_recover',
  'tile_ice', 'tile_snow', 'tile_rock', 'tile_water', 'tile_crack', 'tile_ramp', 'tile_hole', 'tile_melt',
  'bg_sky_pano', 'bg_village_pano', 'bg_aurora', 'tile_bridge', 'obj_crate', 'obj_fish', 'obj_seal', 'obj_arrow',
  'booster_pick', 'booster_shovel', 'booster_whistle',
];

const imgs = {};
const requested = new Set();
const listeners = new Set();
let enabled = true;

// Bir kez çizilen küçük resimler (gardırop) görsel geç yüklenince yeniden çizilebilsin diye.
export const onArtLoad = fn => listeners.add(fn);

function request(id) {
  if (requested.has(id)) return;
  requested.add(id);
  const im = new Image();
  im.decoding = 'async';
  im.src = `assets/art/${id}.webp`;
  im.onload = () => { imgs[id] = im; listeners.forEach(fn => fn(id)); };
}

export function loadArt() {
  PRELOAD.forEach(request);
}

export function setArtEnabled(on) { enabled = on; }

export function art(id) {
  if (!enabled) return null;
  request(id);
  return imgs[id] || null;
}

// Renk paleti görselin tamamını değil yalnızca vurgu bölgesini boyar (tente, çatı, bayrak, çan metali…).
// Vurgu, görseldeki baskın canlı renk tonudur; kar ve buzun mavi tonları, kontur ve soluk renkler hariç.
// all: fener dizisi gibi çok renkli görsellerde bütün canlı renkler boyanır.
const rgb2hsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
};
const hsl2rgb = (h, s, l) => {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
};
const hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
const isIce = h => h >= 180 && h <= 250;
const vivid = (sat, l) => sat > 0.5 && l > 0.25 && l < 0.8;
// Malzeme renkleri vurgu sayılmaz: ahşap kahverengisi ve pencere/lamba ışığının açık sarısı.
const isMaterial = (h, sat, l) => (h >= 10 && h <= 50 && l < 0.66 && sat < 0.8) || (h >= 38 && h <= 62 && l > 0.6);
// Yapıya özel: buz iglo ve ahşap iskelenin vurgusu yok (renk seçeneği gizlenir); çamda yaprak yeşili atlanır.
const ACCENT_RULES = { igloo: null, pier: null, tree: { skip: [70, 170] } };
const ruleOf = id => { const m = id.match(/^bld_([a-z]+)_/); return m && m[1] in ACCENT_RULES ? ACCENT_RULES[m[1]] : {}; };
const skipped = (rule, h) => rule.skip && h >= rule.skip[0] && h <= rule.skip[1];
const accentHit = (h, sat, l, base) => sat > 0.35 && l > 0.15 && l < 0.88 && !isIce(h) && !isMaterial(h, sat, l) && hueDist(h, base) <= 22;

function pixels(im) {
  const c = document.createElement('canvas');
  c.width = im.width;
  c.height = im.height;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(im, 0, 0);
  return [c, x, x.getImageData(0, 0, c.width, c.height)];
}

// Görselin vurgu tonu (derece) ya da vurgusu yoksa null. Görsel henüz yüklenmediyse undefined.
const accentCache = new Map(), accentCov = new Map();
const ACCENT_MIN = 0.05; // boyanacak alan görselin en az %5'i olmalı (küçük ampul ve flamalar renk seçeneği için yetmez)
export const accentCoverage = id => accentCov.get(id);
export function accentHue(id) {
  if (accentCache.has(id)) return accentCache.get(id);
  const im = art(id);
  if (!im) return undefined;
  let hue = null;
  const rule = ruleOf(id);
  if (rule === null) { accentCache.set(id, null); return null; }
  try {
    const [, , data] = pixels(im), d = data.data, bins = new Array(36).fill(0);
    let opaque = 0;
    for (let i = 0; i < d.length; i += 16) { // her 4. piksel yeterli
      if (d[i + 3] < 200) continue;
      opaque++;
      const [h, sat, l] = rgb2hsl(d[i], d[i + 1], d[i + 2]);
      if (vivid(sat, l) && !isIce(h) && !isMaterial(h, sat, l) && !skipped(rule, h)) bins[Math.floor(h / 10) % 36]++;
    }
    const k = bins.indexOf(Math.max(...bins)), base = k * 10 + 5;
    // boyanacak alan (tinted ile aynı ölçütle) ölçülür; ACCENT_MIN'in altındaysa renk seçeneği anlamsız
    let hits = 0;
    for (let i = 0; i < d.length; i += 16) {
      if (d[i + 3] < 200) continue;
      const [h, sat, l] = rgb2hsl(d[i], d[i + 1], d[i + 2]);
      if (accentHit(h, sat, l, base)) hits++;
    }
    accentCov.set(id, opaque ? hits / opaque : 0);
    if (opaque && hits / opaque > ACCENT_MIN) hue = base;
  } catch { /* okunamazsa boyanmaz */ }
  accentCache.set(id, hue);
  return hue;
}

const tintCache = new Map();
export function tinted(id, hex, { all = false } = {}) {
  const im = art(id);
  if (!im || !hex) return im;
  const key = id + hex + all;
  if (!tintCache.has(key)) {
    const base = all ? null : accentHue(id);
    if (!all && base == null) return im;
    const [c, x, data] = pixels(im), d = data.data;
    const n = parseInt(hex.slice(1), 16);
    const [th, ts, tl] = rgb2hsl((n >> 16) & 255, (n >> 8) & 255, n & 255);
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 8) continue;
      const [h, sat, l] = rgb2hsl(d[i], d[i + 1], d[i + 2]);
      const hit = all ? sat > 0.45 && l > 0.2 && l < 0.85 : accentHit(h, sat, l, base);
      if (!hit) continue;
      // tonu hedefe çevir; gölge ve ışık (açıklık) korunur, açık hedef renklerde biraz aydınlatılır
      const nl = Math.min(0.92, l + (tl - 0.5) * 0.35);
      const [r, g, b] = hsl2rgb(th, Math.max(ts, sat * 0.85), nl);
      d[i] = r; d[i + 1] = g; d[i + 2] = b;
    }
    x.putImageData(data, 0, 0);
    tintCache.set(key, c);
  }
  return tintCache.get(key);
}

// Pofi kareleri: 512×512. foot = ayakların/karnın dayandığı satır, h = karakter yüksekliği,
// head = şapkanın oturacağı kafa tepesi (x, y; tüy perçemi değil, kafanın yuvarlağı) ve kafa genişliği (w), rot = kafa eğimi.
// neck = atkı bandının ortası (x, y), genişliği ve açısı; yüzüstü pozlarda atkı görünmez.
export const POFI = {
  stand_front: { foot: 450, h: 388, head: [255, 97, 270], rot: 0, neck: [255, 300, 230] },
  stand_side: { foot: 452, h: 392, head: [263, 97, 240], rot: 0, neck: [292, 292, 190] },
  happy: { foot: 450, h: 400, head: [253, 92, 250], rot: -0.04, neck: [255, 285, 220] },
  recover: { foot: 452, h: 388, head: [226, 100, 262], rot: -0.08, neck: [240, 288, 220] },
  slide_side: { foot: 378, h: 245, head: [385, 165, 200], rot: 0.1, neck: [288, 262, 190, Math.PI / 2] },
  slide_front: { foot: 374, h: 237, head: [256, 166, 257], rot: 0 },
  slide_back: { foot: 387, h: 262, head: [256, 152, 240], rot: 0 },
};

// Lv4-5 görselleri hücreye sığsın diye Lv1-3'e göre r oranında küçültülerek çizildi (scales.json, pofi-r4).
// Lv3 ile aynı ölçeğe dönmek için 1/r ile büyütülür.
export const BLD_Z2 = {
  cocoa_s0: 0.666, cocoa_s1: 0.585, cocoa_s2: 0.676, fort_s0: 0.614, fort_s1: 0.613, fort_s2: 0.605,
  hut_s0: 0.667, hut_s1: 0.669, hut_s2: 0.746, igloo_s0: 0.612, igloo_s1: 0.621, igloo_s2: 0.64,
  lighthouse_s0: 0.645, lighthouse_s1: 0.665, lighthouse_s2: 0.671, observatory_s0: 0.662, observatory_s1: 0.654, observatory_s2: 0.689,
  pier_s0: 0.725, pier_s1: 0.719, pier_s2: 0.704, rink_s0: 0.704, rink_s1: 0.783, rink_s2: 0.856,
  sled_s0: 0.648, sled_s1: 0.626, sled_s2: 0.678, snowman_s0: 0.692, snowman_s1: 0.722, snowman_s2: 0.668,
  tree_s0: 0.721, tree_s1: 0.667, tree_s2: 0.653,
};

// Yapı görselleri: 512×512, taban ortası 496. satırda. cell = hücrenin köydeki genişliği (u cinsinden);
// üç seviye aynı ölçekte çizildiği için seviye büyümesi görselin içinde, ayrıca ölçeklenmez.
// Değerler, Lv3 yapının zemin katmanındaki temeli kapatacağı şekilde ayarlandı.
export const BLD = {
  igloo: 0.3, cocoa: 0.24, fort: 0.28, snowman: 0.2, tree: 0.28, observatory: 0.32,
  sled: 0.34, hut: 0.33, rink: 0.37, pier: 0.3, lighthouse: 0.26,
  // Buz Limanı (tekne: taban satırı su hattı)
  cafe: 0.26, market: 0.28, bell: 0.26, ferry: 0.29,
};
