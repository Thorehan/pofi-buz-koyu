// Üretilmiş görseller (assets/art). Yüklenemeyen ya da kapatılan görselin yerine
// kodla çizilen eski hâli kullanılır; bu yüzden her çağıran null'a hazırlıklıdır.
const IDS = [
  'pofi_stand_front', 'pofi_stand_side', 'pofi_slide_side', 'pofi_slide_front', 'pofi_happy',
  'tile_ice', 'tile_snow', 'tile_rock', 'tile_water', 'tile_crack', 'tile_ramp', 'tile_hole', 'tile_melt',
  'bld_igloo_s0_lv1', 'bld_igloo_s0_lv2', 'bld_igloo_s0_lv3',
];

const imgs = {};
let enabled = true;

export function loadArt() {
  for (const id of IDS) {
    const im = new Image();
    im.decoding = 'async';
    im.src = `assets/art/${id}.webp`;
    im.onload = () => { imgs[id] = im; };
  }
}

export function setArtEnabled(on) { enabled = on; }

export function art(id) {
  return enabled ? imgs[id] || null : null;
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
  slide_side: { foot: 378, h: 245, head: [385, 165, 200], rot: 0.1, neck: [288, 262, 190, Math.PI / 2] },
  slide_front: { foot: 392, h: 273, head: [252, 180, 230], rot: 0 },
};
