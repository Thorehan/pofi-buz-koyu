// Üretilmiş görseller (assets/art). Yüklenemeyen ya da kapatılan görselin yerine
// kodla çizilen eski hâli kullanılır; bu yüzden her çağıran null'a hazırlıklıdır.
// Açılışta yalnızca Pofi, karolar ve köy katmanları yüklenir; yapılar ilk istendiklerinde yüklenir.
const PRELOAD = [
  'pofi_stand_front', 'pofi_stand_side', 'pofi_slide_side', 'pofi_slide_front', 'pofi_slide_back', 'pofi_happy', 'pofi_recover',
  'tile_ice', 'tile_snow', 'tile_rock', 'tile_water', 'tile_crack', 'tile_ramp', 'tile_hole', 'tile_melt',
  'bg_sky', 'bg_ground', 'bg_aurora',
];

const imgs = {};
const requested = new Set();
let enabled = true;

function request(id) {
  if (requested.has(id)) return;
  requested.add(id);
  const im = new Image();
  im.decoding = 'async';
  im.src = `assets/art/${id}.webp`;
  im.onload = () => { imgs[id] = im; };
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

// Renk paleti seçilmiş yapılar için görseli renkle çarpıp önbelleğe alır.
const tintCache = new Map();
export function tinted(id, hex) {
  const im = art(id);
  if (!im || !hex) return im;
  const key = id + hex;
  if (!tintCache.has(key)) {
    const c = document.createElement('canvas');
    c.width = im.width;
    c.height = im.height;
    const x = c.getContext('2d');
    x.drawImage(im, 0, 0);
    x.globalCompositeOperation = 'multiply';
    x.fillStyle = hex;
    x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'destination-in';
    x.drawImage(im, 0, 0);
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

// Yapı görselleri: 512×512, taban ortası 496. satırda. cell = hücrenin köydeki genişliği (u cinsinden);
// üç seviye aynı ölçekte çizildiği için seviye büyümesi görselin içinde, ayrıca ölçeklenmez.
// Değerler, Lv3 yapının zemin katmanındaki temeli kapatacağı şekilde ayarlandı.
export const BLD = {
  igloo: 0.3, cocoa: 0.24, fort: 0.28, snowman: 0.2, tree: 0.28, observatory: 0.32,
  sled: 0.34, hut: 0.33, rink: 0.37, pier: 0.3, lighthouse: 0.26,
};
