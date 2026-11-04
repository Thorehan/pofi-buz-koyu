// Yeni köy içeriğinin çizimleri: kar tilkisi (evcil hayvan), yatağı ve oyuncakları, gezgin tüccar (Kaptan Mors)
// ve teknesi, Çam Ormanı'ndaki köy projeleri. Görsel (assets/art) varsa o, yoksa kod çizimi kullanılır.
import { art } from './art.js';
import { circle, ellipse, roundRect } from './draw.js';

// Görseli tek renge boyar: açık tüyler hedef renge döner, koyu ayrıntılar (göz, burun) koyu kalır.
const tintCache = new Map();
function multiplied(id, hex) {
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

// ---------- kar tilkisi ----------
// Görseller (pet_fox_<poz>): 512×512, ayak/taban çizgisi 470. satırda, ayakta boyu ≈ 300 px, yüzü sağa dönük.
const FOX_FOOT = 470, FOX_H = 300;
// Görsellerde boynun (çenenin hemen altı) yeri: boyun oranı cinsinden [sağa, yukarı] (pofi-r12 ölçümü)
const FOX_NECK = { stand: [0.21, 0.32], walk: [0.25, 0.3], happy: [0.21, 0.28] };
const mixHex = (a, b, k) => {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',')})`;
};

// (x, y) taban ortası, size ≈ ayakta boy. o: { pose: stand|walk|sleep|happy, face: 1|-1, t, fur, collar, sleepy }
export function drawFox(ctx, x, y, size, o = {}) {
  const pose = o.pose || 'stand', face = o.face || 1, t = o.t || 0;
  // Yürürken ayakta ve yürüme kareleri sırayla çizilir (kare görselleri gelene kadar basit iki kareli yürüyüş).
  const framePose = pose === 'walk' && Math.floor(t * 7) % 2 ? 'stand' : pose;
  const im = multiplied(`pet_fox_${framePose}`, o.fur);
  if (im) {
    const k = size / FOX_H;
    // Tek görselden kodla canlandırma: nefes, yürürken sekme ve yalpalama, sevinçte zıplama (yere inince basılır).
    const wave = Math.sin(t * (pose === 'sleep' ? 1.6 : 2.4));
    let bob = 0, rot = 0, sq = wave * (pose === 'sleep' ? 0.03 : 0.015);
    if (pose === 'walk') { bob = Math.abs(Math.sin(t * 11)) * size * 0.05; rot = Math.sin(t * 11) * 0.05; sq = 0; }
    else if (pose === 'happy') {
      const hop = Math.abs(Math.sin(t * 7));
      bob = hop * size * 0.24;
      rot = Math.sin(t * 7) * 0.08;
      sq = hop < 0.2 ? 0.08 * (1 - hop / 0.2) : -0.03;
    }
    ctx.save();
    ctx.fillStyle = 'rgba(29,53,87,.12)';
    ellipse(ctx, x, y, size * 0.32 * (1 - bob / size), size * 0.05);
    ctx.fill();
    ctx.translate(x, y - bob);
    ctx.rotate(face * rot);
    ctx.scale(face * k * (1 + sq), k * (1 - sq));
    ctx.drawImage(im, -256, -FOX_FOOT, 512, 512);
    ctx.restore();
    const nk = FOX_NECK[framePose];
    if (o.collar && nk) collarBand(ctx, x + face * size * nk[0], y - bob - size * nk[1], size, o.collar, face);
    return;
  }
  const fur = o.fur || '#f7fbff', shade = o.fur ? mixHex(o.fur.startsWith('#') ? o.fur : '#f7fbff', '#7d8aa3', 0.25) : '#dfe8f3', s = size;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(face, 1);
  ctx.fillStyle = 'rgba(29,53,87,.12)';
  ellipse(ctx, 0, 0, s * 0.34, s * 0.06);
  ctx.fill();
  if (pose === 'sleep') {
    // kıvrılmış: gövde yuvarlak, kuyruk burnu sarar, gözler kapalı
    ctx.fillStyle = fur;
    ellipse(ctx, 0, -s * 0.17, s * 0.32, s * 0.18);
    ctx.fill();
    ctx.fillStyle = shade;
    ellipse(ctx, s * 0.12, -s * 0.1, s * 0.26, s * 0.1, -0.2);
    ctx.fill();
    ctx.fillStyle = fur;
    circle(ctx, s * 0.2, -s * 0.18, s * 0.13);
    ctx.fill();
    ear(ctx, s * 0.14, -s * 0.28, s * 0.07, -0.5, fur);
    ctx.strokeStyle = '#1b1b24';
    ctx.lineWidth = s * 0.02;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(s * 0.24, -s * 0.2, s * 0.03, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.fillStyle = '#1b1b24';
    circle(ctx, s * 0.33, -s * 0.15, s * 0.02);
    ctx.fill();
    ctx.restore();
    return;
  }
  const walk = pose === 'walk', happy = pose === 'happy';
  const hop = happy ? Math.abs(Math.sin(t * 7)) * s * 0.18 : 0, step = walk ? Math.sin(t * 12) : 0;
  ctx.translate(0, -hop);
  // kuyruk: kabarık, ucu beyaz
  const wag = Math.sin(t * (happy ? 14 : 4)) * 0.25;
  ctx.save();
  ctx.translate(-s * 0.2, -s * 0.3);
  ctx.rotate(-0.9 + wag);
  ctx.fillStyle = fur;
  ellipse(ctx, 0, -s * 0.16, s * 0.1, s * 0.2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, 0, -s * 0.31, s * 0.06, s * 0.07);
  ctx.fill();
  ctx.restore();
  // bacaklar
  ctx.fillStyle = shade;
  for (const [lx, ph] of [[-0.12, 0], [0.1, Math.PI]]) {
    const lift = walk ? Math.max(0, Math.sin(t * 12 + ph)) * s * 0.05 : 0;
    roundRect(ctx, s * lx - s * 0.04, -s * 0.2 - lift, s * 0.08, s * 0.2, s * 0.035);
    ctx.fill();
  }
  // gövde (oturur: dik, yürür: yatay)
  ctx.fillStyle = fur;
  if (walk) ellipse(ctx, 0, -s * 0.3 - Math.abs(step) * s * 0.02, s * 0.26, s * 0.14);
  else ellipse(ctx, 0, -s * 0.32, s * 0.2, s * 0.2);
  ctx.fill();
  // baş
  const hx = walk ? s * 0.22 : s * 0.06, hy = walk ? -s * 0.48 : -s * 0.6;
  ear(ctx, hx - s * 0.09, hy - s * 0.12, s * 0.08, -0.35, fur);
  ear(ctx, hx + s * 0.08, hy - s * 0.13, s * 0.08, 0.35, fur);
  ctx.fillStyle = fur;
  circle(ctx, hx, hy, s * 0.15);
  ctx.fill();
  // burun ucu (sağa uzar)
  ctx.beginPath();
  ctx.moveTo(hx + s * 0.08, hy - s * 0.06);
  ctx.quadraticCurveTo(hx + s * 0.26, hy + s * 0.02, hx + s * 0.08, hy + s * 0.08);
  ctx.fill();
  ctx.fillStyle = '#1b1b24';
  circle(ctx, hx + s * 0.235, hy + s * 0.02, s * 0.025);
  ctx.fill();
  if (happy) {
    ctx.strokeStyle = '#1b1b24';
    ctx.lineWidth = s * 0.02;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(hx + s * 0.05, hy - s * 0.01, s * 0.03, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else if (o.sleepy) {
    ctx.fillRect(hx + s * 0.02, hy - s * 0.02, s * 0.06, s * 0.015);
  } else {
    circle(ctx, hx + s * 0.05, hy - s * 0.02, s * 0.028);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    circle(ctx, hx + s * 0.06, hy - s * 0.03, s * 0.009);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,140,160,.5)';
  ellipse(ctx, hx + s * 0.02, hy + s * 0.05, s * 0.03, s * 0.018);
  ctx.fill();
  ctx.restore();
  if (o.collar) collarBand(ctx, x + face * (walk ? s * 0.16 : s * 0.05), y - hop - s * (walk ? 0.38 : 0.47), size, o.collar, face);
}

function ear(ctx, x, y, r, rot, fur) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, r * 0.6);
  ctx.lineTo(0, -r * 1.1);
  ctx.lineTo(r * 0.7, r * 0.6);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,170,190,.7)';
  ctx.beginPath();
  ctx.moveTo(-r * 0.35, r * 0.45);
  ctx.lineTo(0, -r * 0.55);
  ctx.lineTo(r * 0.35, r * 0.45);
  ctx.fill();
  ctx.restore();
}

function collarBand(ctx, x, y, s, hex, face) {
  ctx.fillStyle = hex;
  ellipse(ctx, x, y, s * 0.1, s * 0.03, face * 0.3);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  circle(ctx, x + face * s * 0.02, y + s * 0.04, s * 0.022);
  ctx.fill();
}

// Yatak (iglonun önünde). tier 0: yatak yok (tilki karda kıvrılır), 1-3: pet_bed_<tier>.
// Görsel: 512×512, taban ortası 470. satırda, genişliği ≈ 380 px; sahnede 0.09u genişlikte.
export function drawPetBed(ctx, x, y, u, tier) {
  if (!tier) return;
  const im = art(`pet_bed_${tier}`);
  const w = u * 0.09;
  if (im) {
    const k = w / 380;
    ctx.drawImage(im, x - 256 * k, y - 470 * k, 512 * k, 512 * k);
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  const cols = [['#c9a26b', '#e4c896'], ['#d9605a', '#f4b8b0'], ['#6c7fd6', '#b9c6ff']][tier - 1];
  ctx.fillStyle = cols[0];
  ellipse(ctx, 0, -w * 0.12, w * 0.5, w * 0.2);
  ctx.fill();
  ctx.fillStyle = cols[1];
  ellipse(ctx, 0, -w * 0.15, w * 0.38, w * 0.12);
  ctx.fill();
  if (tier === 3) {
    // kubbeli yuva: arkada yarım kubbe
    ctx.fillStyle = cols[0];
    ctx.beginPath();
    ctx.ellipse(0, -w * 0.18, w * 0.46, w * 0.42, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = 'rgba(29,53,87,.35)';
    ctx.beginPath();
    ctx.ellipse(0, -w * 0.18, w * 0.3, w * 0.28, 0, Math.PI, 0);
    ctx.fill();
  }
  ctx.restore();
}

// Oyuncak (tilkinin yanında). Görsel: pet_toy_<id>, 256×256, taban ortası 240. satırda.
export function drawToy(ctx, x, y, u, id, t = 0) {
  const im = art(`pet_toy_${id}`), w = u * 0.04;
  if (im) {
    const k = w / 200;
    ctx.drawImage(im, x - 128 * k, y - 240 * k, 256 * k, 256 * k);
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  if (id === 'ball') {
    ctx.fillStyle = '#ffffff';
    circle(ctx, 0, -w * 0.35, w * 0.35);
    ctx.fill();
    ctx.strokeStyle = '#b9d4ee';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (id === 'yarn') {
    ctx.fillStyle = '#e5484d';
    circle(ctx, 0, -w * 0.35, w * 0.35);
    ctx.fill();
    ctx.strokeStyle = '#ff9a9e';
    ctx.lineWidth = 1;
    for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.arc(k * w * 0.1, -w * 0.35, w * 0.25, 0.5, 2.6); ctx.stroke(); }
  } else if (id === 'plush') {
    ctx.fillStyle = '#ff8c42';
    ellipse(ctx, 0, -w * 0.3, w * 0.45, w * 0.25);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-w * 0.4, -w * 0.3);
    ctx.lineTo(-w * 0.7, -w * 0.55);
    ctx.lineTo(-w * 0.7, -w * 0.05);
    ctx.fill();
  } else if (id === 'sled') {
    ctx.fillStyle = '#c0392b';
    roundRect(ctx, -w * 0.6, -w * 0.45, w * 1.2, w * 0.25, w * 0.08);
    ctx.fill();
    ctx.strokeStyle = '#5b4636';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-w * 0.6, -w * 0.08);
    ctx.lineTo(w * 0.6, -w * 0.08);
    ctx.quadraticCurveTo(w * 0.8, -w * 0.08, w * 0.75, -w * 0.3);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- gezgin tüccar: Kaptan Mors ----------
// Görseller: merchant_walrus (512×512, ayak çizgisi 470, boy ≈ 380 px, yüzü sağa),
// merchant_stall (tezgâh, 512×512, taban ortası 496. satırda), merchant_boat (tekne, 512×512, su hattı 430. satırda).
export function drawWalrus(ctx, x, y, size, t = 0, face = 1) {
  const im = art('merchant_walrus');
  if (im) {
    const k = size / 380;
    ctx.save();
    ctx.translate(x, y + Math.sin(t * 2) * size * 0.005);
    ctx.scale(face * k, k);
    ctx.drawImage(im, -256, -470, 512, 512);
    ctx.restore();
    return;
  }
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(face, 1);
  ctx.fillStyle = 'rgba(29,53,87,.14)';
  ellipse(ctx, 0, 0, s * 0.36, s * 0.07);
  ctx.fill();
  // sırt çantası
  ctx.fillStyle = '#8e5a2b';
  roundRect(ctx, -s * 0.42, -s * 0.72, s * 0.26, s * 0.42, s * 0.05);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(-s * 0.42, -s * 0.56, s * 0.26, s * 0.04);
  // gövde
  ctx.fillStyle = '#a77c62';
  ellipse(ctx, 0, -s * 0.36, s * 0.32, s * 0.36);
  ctx.fill();
  // yelek
  ctx.fillStyle = '#2f5d8c';
  ellipse(ctx, s * 0.04, -s * 0.34, s * 0.24, s * 0.26);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  for (const by of [-0.42, -0.3]) { circle(ctx, s * 0.12, s * by, s * 0.02); ctx.fill(); }
  // baş
  ctx.fillStyle = '#b8896c';
  circle(ctx, s * 0.06, -s * 0.74, s * 0.2);
  ctx.fill();
  // bıyık ve dişler
  ctx.fillStyle = '#f0e2cf';
  ellipse(ctx, s * 0.0, -s * 0.66, s * 0.09, s * 0.06);
  ctx.fill();
  ellipse(ctx, s * 0.16, -s * 0.66, s * 0.09, s * 0.06);
  ctx.fill();
  ctx.fillStyle = '#fffaf0';
  for (const tx of [0.03, 0.13]) {
    ctx.beginPath();
    ctx.moveTo(s * tx - s * 0.02, -s * 0.62);
    ctx.lineTo(s * tx, -s * 0.48);
    ctx.lineTo(s * tx + s * 0.02, -s * 0.62);
    ctx.fill();
  }
  ctx.fillStyle = '#1b1b24';
  for (const ex of [0.0, 0.14]) { circle(ctx, s * ex, -s * 0.8, s * 0.022); ctx.fill(); }
  // kaptan şapkası
  ctx.fillStyle = '#1d3557';
  roundRect(ctx, -s * 0.12, -s * 1.0, s * 0.36, s * 0.12, s * 0.04);
  ctx.fill();
  ctx.fillRect(-s * 0.16, -s * 0.9, s * 0.44, s * 0.03);
  ctx.fillStyle = '#ffd166';
  circle(ctx, s * 0.06, -s * 0.94, s * 0.025);
  ctx.fill();
  ctx.restore();
}

export function drawStall(ctx, x, y, u, t = 0) {
  const im = art('merchant_stall'), w = u * 0.26;
  if (im) {
    const k = w / 512;
    ctx.drawImage(im, x - 256 * k, y - 496 * k, 512 * k, 512 * k);
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  // tezgâh
  ctx.fillStyle = '#9a6a42';
  ctx.fillRect(-w * 0.4, -w * 0.28, w * 0.8, w * 0.28);
  ctx.fillStyle = '#7a5434';
  ctx.fillRect(-w * 0.42, -w * 0.3, w * 0.84, w * 0.05);
  // sandıklar ve mallar
  const goods = ['#e5484d', '#3d7bd9', '#ffd166', '#8f5bd6', '#3fae5a'];
  goods.forEach((c, i) => { ctx.fillStyle = c; circle(ctx, -w * 0.3 + i * w * 0.15, -w * 0.36, w * 0.045); ctx.fill(); });
  // direkler ve çizgili tente
  ctx.fillStyle = '#7a5434';
  ctx.fillRect(-w * 0.4, -w * 0.72, w * 0.03, w * 0.44);
  ctx.fillRect(w * 0.37, -w * 0.72, w * 0.03, w * 0.44);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? '#ffffff' : '#2f8f8b';
    ctx.beginPath();
    const x0 = -w * 0.46 + i * w * 0.153;
    ctx.moveTo(x0, -w * 0.72);
    ctx.lineTo(x0 + w * 0.153, -w * 0.72);
    ctx.lineTo(x0 + w * 0.153, -w * 0.6);
    ctx.quadraticCurveTo(x0 + w * 0.076, -w * 0.54, x0, -w * 0.6);
    ctx.fill();
  }
  // bayrak
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.moveTo(0, -w * 0.72);
  ctx.lineTo(0, -w * 0.92);
  ctx.lineTo(w * 0.12 + Math.sin(t * 4) * w * 0.01, -w * 0.86);
  ctx.lineTo(0, -w * 0.8);
  ctx.fill();
  ctx.restore();
}

export function drawMerchantBoat(ctx, x, y, u, t = 0) {
  const im = art('merchant_boat'), w = u * 0.3, bob = Math.sin(t * 1.6) * u * 0.004;
  if (im) {
    const k = w / 512;
    ctx.drawImage(im, x - 256 * k, y - 430 * k + bob, 512 * k, 512 * k);
    return;
  }
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = '#7a5434';
  ctx.beginPath();
  ctx.moveTo(-w * 0.45, -w * 0.12);
  ctx.lineTo(w * 0.45, -w * 0.12);
  ctx.lineTo(w * 0.32, w * 0.04);
  ctx.lineTo(-w * 0.36, w * 0.04);
  ctx.fill();
  ctx.fillStyle = '#2f8f8b';
  ctx.fillRect(-w * 0.45, -w * 0.15, w * 0.9, w * 0.04);
  ctx.fillStyle = '#5b4636';
  ctx.fillRect(-w * 0.01, -w * 0.62, w * 0.02, w * 0.5);
  ctx.fillStyle = '#fff6e6';
  ctx.beginPath();
  ctx.moveTo(w * 0.02, -w * 0.6);
  ctx.quadraticCurveTo(w * 0.3, -w * 0.4, w * 0.02, -w * 0.18);
  ctx.fill();
  ctx.fillStyle = '#2f8f8b';
  ctx.beginPath();
  ctx.moveTo(-w * 0.01, -w * 0.62);
  ctx.lineTo(-w * 0.14, -w * 0.58);
  ctx.lineTo(-w * 0.01, -w * 0.54);
  ctx.fill();
  ctx.restore();
}

// ---------- köy projeleri ----------
// Görseller: proj_<id>_s<aşama> (aşama 1-3), 512×512, taban ortası 496. satırda (yapı görselleriyle aynı sözleşme);
// hücre genişliği PROJECTS[].cell (u cinsinden).
export function drawProject(ctx, x, y, u, p, stage, t = 0) {
  const w = u * p.cell;
  const im = stage > 0 && art(`proj_${p.id}_s${stage}`);
  if (im) {
    const k = w / 512;
    ctx.drawImage(im, x - 256 * k, y - 496 * k, 512 * k, 512 * k);
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  // temel: zemin görselinde ped çizili; yalnızca kod zemininde çizilir
  if (!art('bg_ground_forest')) {
    ctx.fillStyle = '#c7d3e0';
    ellipse(ctx, 0, -w * 0.03, w * 0.42, w * 0.1);
    ctx.fill();
  }
  if (stage === 0) {
    // inşaat yeri: kazıklar ve ip
    ctx.strokeStyle = '#9a6a42';
    ctx.lineWidth = 2;
    for (const [px, py] of [[-0.32, -0.02], [0.32, -0.02], [-0.22, -0.1], [0.22, -0.1]]) {
      ctx.beginPath();
      ctx.moveTo(px * w, py * w);
      ctx.lineTo(px * w, py * w - w * 0.08);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  const full = stage === 3, half = stage >= 2;
  if (p.id === 'spring') {
    // sıcak kaplıca: taş havuz, buhar
    ctx.fillStyle = '#8d98a8';
    ellipse(ctx, 0, -w * 0.08, w * 0.4, w * 0.14);
    ctx.fill();
    if (half) {
      ctx.fillStyle = full ? '#7fd3e6' : '#b9e3ee';
      ellipse(ctx, 0, -w * 0.1, w * 0.32, w * 0.09);
      ctx.fill();
    }
    if (full) {
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      for (let k = 0; k < 3; k++) {
        const p2 = (t * 0.4 + k / 3) % 1;
        ctx.globalAlpha = 1 - p2;
        circle(ctx, (k - 1) * w * 0.14, -w * (0.15 + p2 * 0.35), w * (0.05 + p2 * 0.05));
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  } else if (p.id === 'clock') {
    // saat kulesi: taş gövde, en üstte saat ve çatı
    const h = full ? 0.95 : half ? 0.6 : 0.25;
    ctx.fillStyle = '#d9cbb8';
    ctx.fillRect(-w * 0.16, -w * h, w * 0.32, w * h);
    ctx.fillStyle = '#b9a88f';
    for (let k = 0.1; k < h; k += 0.12) ctx.fillRect(-w * 0.16, -w * k, w * 0.32, w * 0.012);
    if (full) {
      ctx.fillStyle = '#ffffff';
      circle(ctx, 0, -w * 0.78, w * 0.1);
      ctx.fill();
      ctx.strokeStyle = '#1d3557';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -w * 0.78);
      ctx.lineTo(Math.cos(t * 0.5) * w * 0.07, -w * 0.78 + Math.sin(t * 0.5) * w * 0.07);
      ctx.moveTo(0, -w * 0.78);
      ctx.lineTo(0, -w * 0.84);
      ctx.stroke();
      ctx.fillStyle = '#3d7bd9';
      ctx.beginPath();
      ctx.moveTo(-w * 0.2, -w * 0.95);
      ctx.lineTo(0, -w * 1.15);
      ctx.lineTo(w * 0.2, -w * 0.95);
      ctx.fill();
    } else scaffold(ctx, w, h);
  } else if (p.id === 'lift') {
    // telesiyej: istasyon, direk ve yukarı giden halat, koltuklar
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-w * 0.3, -w * 0.25, w * 0.3, w * 0.22);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-w * 0.34, -w * 0.25);
    ctx.lineTo(-w * 0.15, -w * 0.36);
    ctx.lineTo(w * 0.04, -w * 0.25);
    ctx.fill();
    if (half) {
      ctx.fillStyle = '#6b7f9c';
      ctx.fillRect(w * 0.25, -w * 0.7, w * 0.04, w * 0.68);
      ctx.fillRect(w * 0.18, -w * 0.72, w * 0.18, w * 0.03);
    }
    if (full) {
      ctx.strokeStyle = '#3c4a5e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-w * 0.1, -w * 0.3);
      ctx.lineTo(w * 0.27, -w * 0.7);
      ctx.lineTo(w * 0.6, -w * 1.05);
      ctx.stroke();
      for (let k = 0; k < 3; k++) {
        const p2 = (t * 0.06 + k / 3) % 1, cx = -w * 0.1 + p2 * w * 0.7, cy = -w * 0.3 - p2 * w * 0.75;
        ctx.fillStyle = ['#ffd166', '#3d7bd9', '#e5484d'][k];
        ctx.fillRect(cx - w * 0.03, cy + w * 0.04, w * 0.06, w * 0.04);
        ctx.fillRect(cx - w * 0.003, cy, w * 0.006, w * 0.04);
      }
    } else if (!half) scaffold(ctx, w, 0.3);
  }
  ctx.restore();
}

function scaffold(ctx, w, h) {
  ctx.strokeStyle = '#c99a5b';
  ctx.lineWidth = 2;
  for (const sx of [-0.22, 0.22]) {
    ctx.beginPath();
    ctx.moveTo(sx * w, 0);
    ctx.lineTo(sx * w, -w * (h + 0.08));
    ctx.stroke();
  }
  for (let k = 0.1; k <= h + 0.05; k += 0.15) {
    ctx.beginPath();
    ctx.moveTo(-w * 0.22, -w * k);
    ctx.lineTo(w * 0.22, -w * k);
    ctx.stroke();
  }
}
