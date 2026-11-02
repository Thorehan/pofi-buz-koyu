// Ortak çizim yardımcıları ve Pofi karakteri (kıyafetleriyle).
import { art, POFI } from './art.js';

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

export function ellipse(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
}

const SCARF = { red: '#e5484d', blue: '#3d7bd9', green: '#3fae5a', yellow: '#f5b81c', striped: '#e5484d' };

// Pofi: (x, y) ayakların ortası, size ≈ boy. o: { face: -1|0|1, lean, squash, blink, outfit, wave }
export function drawPofi(ctx, x, y, size, o = {}) {
  const face = o.face || 0, squash = o.squash || 0, outfit = o.outfit || {};
  const pose = o.happy ? 'happy' : o.recover ? 'recover' : face ? 'stand_side' : 'stand_front';
  if (drawPofiArt(ctx, x, y, size, pose, { flip: face < 0, rot: o.lean, squash, outfit })) return;
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(o.lean || 0);
  ctx.scale(1 + squash * 0.18, 1 - squash * 0.18);

  // ayaklar
  ctx.fillStyle = '#ff9f43';
  ellipse(ctx, -s * 0.13, -s * 0.03, s * 0.12, s * 0.05);
  ctx.fill();
  ellipse(ctx, s * 0.13, -s * 0.03, s * 0.12, s * 0.05);
  ctx.fill();

  // gövde
  ctx.fillStyle = '#22314f';
  ellipse(ctx, 0, -s * 0.42, s * 0.33, s * 0.4);
  ctx.fill();
  // kanatlar
  const wave = o.wave || 0;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * s * 0.3, -s * 0.45);
    ctx.rotate(side * (0.35 + (side === 1 ? wave : 0)));
    ellipse(ctx, 0, s * 0.1, s * 0.08, s * 0.2);
    ctx.fill();
    ctx.restore();
  }
  // karın
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, face * s * 0.05, -s * 0.36, s * 0.23, s * 0.3);
  ctx.fill();

  // yüz
  const fx = face * s * 0.07;
  ctx.fillStyle = '#ffffff';
  for (const ex of [-1, 1]) {
    circle(ctx, fx + ex * s * 0.1, -s * 0.6, s * 0.075);
    ctx.fill();
  }
  ctx.fillStyle = '#1b1b24';
  ctx.strokeStyle = '#1b1b24';
  for (const ex of [-1, 1]) {
    if (o.happy) {
      // ^ ^ mutlu gözler
      ctx.lineWidth = s * 0.025;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(fx + ex * s * 0.1, -s * 0.58, s * 0.04, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else if (o.blink) {
      ctx.fillRect(fx + ex * s * 0.1 - s * 0.04, -s * 0.6, s * 0.08, s * 0.018);
    } else {
      circle(ctx, fx + ex * s * 0.1 + face * s * 0.02, -s * 0.595, s * 0.04);
      ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(255,140,160,.55)';
  for (const ex of [-1, 1]) {
    ellipse(ctx, fx + ex * s * 0.17, -s * 0.5, s * 0.045, s * 0.028);
    ctx.fill();
  }
  ctx.fillStyle = '#ff9f43';
  ctx.beginPath();
  ctx.moveTo(fx - s * 0.06, -s * 0.52);
  ctx.lineTo(fx + s * 0.06, -s * 0.52);
  ctx.lineTo(fx + face * s * 0.04, -s * 0.44);
  ctx.closePath();
  ctx.fill();

  // atkı
  if (outfit.scarf && outfit.scarf !== 'none') {
    ctx.fillStyle = scarfFill(ctx, outfit.scarf, s);
    roundRect(ctx, -s * 0.3, -s * 0.43, s * 0.6, s * 0.09, s * 0.04);
    ctx.fill();
    roundRect(ctx, -face * s * 0.12 + s * 0.08 - s * 0.05, -s * 0.38, s * 0.1, s * 0.2, s * 0.03);
    ctx.fill();
    if (outfit.scarf === 'striped') {
      ctx.fillStyle = '#ffffff';
      for (let k = -2; k <= 2; k++) ctx.fillRect(k * s * 0.11 - s * 0.02, -s * 0.43, s * 0.04, s * 0.09);
    }
    if (outfit.scarf === 'flakes') {
      ctx.fillStyle = '#ffffff';
      for (let k = -2; k <= 2; k++) { circle(ctx, k * s * 0.11, -s * 0.385, s * 0.018); ctx.fill(); }
    }
  }

  drawHat(ctx, outfit.hat, s);
  ctx.restore();
}

// Görsel Pofi. (x, y) ayak/karın hizası. Görsel yoksa false döner.
function drawPofiArt(ctx, x, y, size, pose, o = {}) {
  const im = art('pofi_' + pose);
  if (!im) return false;
  const f = POFI[pose], k = (size * 0.92) / POFI.stand_front.h, sq = o.squash || 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(o.rot || 0);
  ctx.scale((1 + sq * 0.18) * k * (o.flip ? -1 : 1), (1 - sq * 0.18) * k);
  ctx.translate(-256, -f.foot);
  ctx.drawImage(im, 0, 0, 512, 512);
  const outfit = o.outfit || {};
  if (f.neck && outfit.scarf && outfit.scarf !== 'none') {
    const [nx, ny, nw, nr = 0] = f.neck, u = nw / 0.6;
    ctx.save();
    ctx.translate(nx, ny);
    ctx.rotate(nr);
    ctx.fillStyle = scarfFill(ctx, outfit.scarf, u);
    roundRect(ctx, -nw / 2, -u * 0.045, nw, u * 0.09, u * 0.04);
    ctx.fill();
    roundRect(ctx, u * 0.04, 0, u * 0.1, u * 0.2, u * 0.03);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    if (outfit.scarf === 'striped') for (let j = -2; j <= 2; j++) ctx.fillRect(j * u * 0.11 - u * 0.02, -u * 0.045, u * 0.04, u * 0.09);
    if (outfit.scarf === 'flakes') for (let j = -2; j <= 2; j++) { circle(ctx, j * u * 0.11, 0, u * 0.018); ctx.fill(); }
    ctx.restore();
  }
  if (outfit.hat && outfit.hat !== 'none') {
    // Şapka kodu kafa tepesi -0.8s, kafa genişliği ≈ 0.66s varsayar.
    const [hx, hy, hw] = f.head, u = hw / 0.66;
    ctx.translate(hx, hy);
    ctx.rotate(f.rot);
    ctx.translate(0, u * 0.8);
    drawHat(ctx, outfit.hat, u);
  }
  ctx.restore();
  return true;
}

function scarfFill(ctx, scarf, s) {
  if (scarf === 'aurora') {
    const g = ctx.createLinearGradient(-s * 0.3, 0, s * 0.3, 0);
    g.addColorStop(0, '#3cdc9a');
    g.addColorStop(0.5, '#4fb3ff');
    g.addColorStop(1, '#8f5bd6');
    return g;
  }
  return scarf === 'flakes' ? '#9fd3ff' : SCARF[scarf];
}

// Göbek üstü kayan Pofi. dir: 0 yukarı (sırtı görünür), 1 sağ, 2 aşağı (yüzü görünür), 3 sol.
// (x, y) zemindeki orta nokta. t: sallanma için zaman.
export function drawPofiBelly(ctx, x, y, size, dir, o = {}) {
  const s = size, outfit = o.outfit || {}, t = o.t || 0;
  const pose = ['slide_back', 'slide_side', 'slide_front', 'slide_side'][dir];
  if (drawPofiArt(ctx, x, y, size, pose, { flip: dir === 3, outfit })) return;
  ctx.save();
  ctx.translate(x, y);
  if (dir === 1 || dir === 3) {
    if (dir === 3) ctx.scale(-1, 1);
    const flap = Math.sin(t * 18) * 0.08;
    // ayaklar arkada
    ctx.fillStyle = '#ff9f43';
    ellipse(ctx, -s * 0.46, -s * 0.1, s * 0.09, s * 0.04, -0.3);
    ctx.fill();
    ellipse(ctx, -s * 0.44, -s * 0.05, s * 0.09, s * 0.04, 0.2);
    ctx.fill();
    // gövde yatay, karın altta
    ctx.fillStyle = '#22314f';
    ellipse(ctx, -s * 0.02, -s * 0.18, s * 0.42, s * 0.18);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, 0, -s * 0.09, s * 0.36, s * 0.09);
    ctx.fill();
    // kanat geriye uzanmış
    ctx.fillStyle = '#22314f';
    ellipse(ctx, -s * 0.12, -s * 0.27, s * 0.22, s * 0.055, -0.18 + flap);
    ctx.fill();
    // atkı: boyunda bant, rüzgârda uçuşan uç
    if (outfit.scarf && outfit.scarf !== 'none') {
      ctx.fillStyle = scarfFill(ctx, outfit.scarf, s);
      ellipse(ctx, s * 0.25, -s * 0.2, s * 0.06, s * 0.15);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(s * 0.22, -s * 0.3);
      ctx.quadraticCurveTo(s * 0.05, -s * (0.42 + flap), -s * 0.12, -s * (0.36 - flap));
      ctx.lineTo(-s * 0.1, -s * (0.31 - flap));
      ctx.quadraticCurveTo(s * 0.05, -s * 0.34, s * 0.22, -s * 0.24);
      ctx.fill();
    }
    // baş önde, yüz yönde
    const hx = s * 0.36, hy = -s * 0.26;
    ctx.fillStyle = '#22314f';
    circle(ctx, hx, hy, s * 0.17);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    circle(ctx, hx + s * 0.06, hy + s * 0.02, s * 0.11);
    ctx.fill();
    circle(ctx, hx + s * 0.09, hy - s * 0.04, s * 0.05);
    ctx.fill();
    ctx.fillStyle = '#1b1b24';
    circle(ctx, hx + s * 0.11, hy - s * 0.04, s * 0.028);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,140,160,.55)';
    ellipse(ctx, hx + s * 0.05, hy + s * 0.06, s * 0.035, s * 0.022);
    ctx.fill();
    ctx.fillStyle = '#ff9f43';
    ctx.beginPath();
    ctx.moveTo(hx + s * 0.15, hy - s * 0.01);
    ctx.lineTo(hx + s * 0.27, hy + s * 0.02);
    ctx.lineTo(hx + s * 0.15, hy + s * 0.06);
    ctx.closePath();
    ctx.fill();
    // şapka: kafanın üstünde, rüzgârla geriye yatmış
    if (outfit.hat && outfit.hat !== 'none') {
      ctx.save();
      ctx.translate(hx - s * 0.03, hy - s * 0.01);
      ctx.rotate(-0.45);
      ctx.scale(0.55, 0.55);
      ctx.translate(0, s * 0.6);
      drawHat(ctx, outfit.hat, s);
      ctx.restore();
    }
  } else {
    // Dikey kayış: aşağı giderken yüzü, yukarı giderken sırtı görünür.
    const toward = dir === 2;
    const flap = Math.sin(t * 18) * 0.12;
    ctx.fillStyle = '#22314f';
    for (const side of [-1, 1]) {
      ellipse(ctx, side * s * 0.3, -s * 0.22, s * 0.2, s * 0.05, side * (0.35 + flap));
      ctx.fill();
    }
    ctx.fillStyle = '#ff9f43';
    for (const side of [-1, 1]) {
      ellipse(ctx, side * s * 0.08, toward ? -s * 0.52 : -s * 0.04, s * 0.06, s * 0.04);
      ctx.fill();
    }
    ctx.fillStyle = '#22314f';
    ellipse(ctx, 0, -s * 0.27, s * 0.24, s * 0.22);
    ctx.fill();
    if (outfit.scarf && outfit.scarf !== 'none') {
      ctx.fillStyle = scarfFill(ctx, outfit.scarf, s);
      roundRect(ctx, -s * 0.2, toward ? -s * 0.2 : -s * 0.4, s * 0.4, s * 0.07, s * 0.03);
      ctx.fill();
    }
    const hy = toward ? -s * 0.12 : -s * 0.46;
    ctx.fillStyle = '#22314f';
    circle(ctx, 0, hy, s * 0.17);
    ctx.fill();
    if (toward) {
      ctx.fillStyle = '#ffffff';
      ellipse(ctx, 0, hy + s * 0.02, s * 0.13, s * 0.11);
      ctx.fill();
      ctx.fillStyle = '#1b1b24';
      for (const ex of [-1, 1]) { circle(ctx, ex * s * 0.055, hy - s * 0.01, s * 0.028); ctx.fill(); }
      ctx.fillStyle = '#ff9f43';
      ctx.beginPath();
      ctx.moveTo(-s * 0.04, hy + s * 0.05);
      ctx.lineTo(s * 0.04, hy + s * 0.05);
      ctx.lineTo(0, hy + s * 0.12);
      ctx.closePath();
      ctx.fill();
    }
    if (outfit.hat && outfit.hat !== 'none') {
      ctx.save();
      ctx.translate(0, hy + (toward ? -s * 0.06 : 0));
      ctx.scale(0.55, toward ? 0.4 : 0.55);
      ctx.translate(0, s * 0.6);
      drawHat(ctx, outfit.hat, s);
      ctx.restore();
    }
  }
  ctx.restore();
}

// Şapka, ayakta duran Pofi'nin koordinatlarında çizilir (kafa merkezi ≈ (0, -0.6s)).
// Yatma/uçma pozlarında çizim alanı kafaya göre dönüştürülüp aynı fonksiyon kullanılır.
function drawHat(ctx, hat, s) {
  const top = -s * 0.8;
  if (hat === 'sealhood') {
    ctx.fillStyle = '#8f9bb0';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.62, s * 0.36, s * 0.3, 0, Math.PI * 1.02, Math.PI * 1.98);
    ctx.fill();
    ctx.fillStyle = '#1b1b24';
    for (const ex of [-1, 1]) { circle(ctx, ex * s * 0.1, top - s * 0.06, s * 0.03); ctx.fill(); }
    ctx.fillStyle = '#5b6578';
    ellipse(ctx, 0, top, s * 0.05, s * 0.03);
    ctx.fill();
    ctx.strokeStyle = '#5b6578';
    ctx.lineWidth = s * 0.012;
    for (const ex of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(ex * s * 0.05, top + s * 0.01);
      ctx.lineTo(ex * s * 0.16, top - s * 0.01);
      ctx.stroke();
    }
  } else if (hat === 'beanieRed' || hat === 'beanieBlue' || hat === 'north') {
    let c = hat === 'beanieRed' ? '#e5484d' : '#3d7bd9';
    if (hat === 'north') {
      c = ctx.createLinearGradient(-s * 0.27, 0, s * 0.27, 0);
      c.addColorStop(0, '#3cdc9a');
      c.addColorStop(1, '#8f5bd6');
    }
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(0, top + s * 0.04, s * 0.27, s * 0.2, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, -s * 0.28, top + s * 0.01, s * 0.56, s * 0.07, s * 0.03);
    ctx.fill();
    circle(ctx, 0, top - s * 0.17, s * 0.06);
    ctx.fill();
  } else if (hat === 'tophat') {
    ctx.fillStyle = '#1b1b24';
    roundRect(ctx, -s * 0.28, top + s * 0.02, s * 0.56, s * 0.05, s * 0.02);
    ctx.fill();
    roundRect(ctx, -s * 0.17, top - s * 0.25, s * 0.34, s * 0.29, s * 0.03);
    ctx.fill();
    ctx.fillStyle = '#e5484d';
    ctx.fillRect(-s * 0.17, top - s * 0.04, s * 0.34, s * 0.05);
  } else if (hat === 'fishhat') {
    // Başın üstünde yatan turuncu balık
    ctx.fillStyle = '#ff8c42';
    ellipse(ctx, 0, top - s * 0.02, s * 0.2, s * 0.09);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s * 0.16, top - s * 0.02);
    ctx.lineTo(s * 0.3, top - s * 0.12);
    ctx.lineTo(s * 0.3, top + s * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd3b0';
    ellipse(ctx, -s * 0.02, top + s * 0.02, s * 0.1, s * 0.035);
    ctx.fill();
    ctx.fillStyle = '#1b1b24';
    circle(ctx, -s * 0.12, top - s * 0.04, s * 0.02);
    ctx.fill();
  } else if (hat === 'helmet') {
    ctx.fillStyle = '#e5484d';
    ctx.beginPath();
    ctx.ellipse(0, top + s * 0.06, s * 0.3, s * 0.24, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-s * 0.03, top - s * 0.18, s * 0.06, s * 0.24);
    ctx.fillStyle = '#1d3557';
    roundRect(ctx, -s * 0.24, top + s * 0.03, s * 0.48, s * 0.07, s * 0.03);
    ctx.fill();
    ctx.fillStyle = '#9fd3ff';
    roundRect(ctx, -s * 0.2, top + s * 0.04, s * 0.17, s * 0.05, s * 0.02);
    ctx.fill();
    roundRect(ctx, s * 0.03, top + s * 0.04, s * 0.17, s * 0.05, s * 0.02);
    ctx.fill();
  } else if (hat === 'starhat') {
    ctx.fillStyle = '#5b3fa8';
    ctx.beginPath();
    ctx.moveTo(-s * 0.24, top + s * 0.05);
    ctx.lineTo(s * 0.06, top - s * 0.38);
    ctx.lineTo(s * 0.24, top + s * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8f5bd6';
    roundRect(ctx, -s * 0.28, top + s * 0.01, s * 0.56, s * 0.07, s * 0.03);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    for (const [dx, dy, r] of [[-0.06, -0.08, 0.025], [0.06, -0.18, 0.02], [0.02, -0.02, 0.018], [0.06, -0.38, 0.03]]) {
      circle(ctx, dx * s, top + dy * s, r * s);
      ctx.fill();
    }
  } else if (hat === 'icecrown') {
    ctx.fillStyle = '#bfe7ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = s * 0.012;
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, top + s * 0.04);
    [[-0.17, -0.12], [-0.1, -0.02], [-0.05, -0.2], [0, -0.04], [0.05, -0.2], [0.1, -0.02], [0.17, -0.12], [0.2, 0.04]]
      .forEach(([dx, dy]) => ctx.lineTo(dx * s, top + dy * s));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#8f5bd6';
    circle(ctx, 0, top - s * 0.01, s * 0.025);
    ctx.fill();
  } else if (hat === 'crown') {
    ctx.fillStyle = '#f5c518';
    ctx.beginPath();
    ctx.moveTo(-s * 0.18, top + s * 0.04);
    ctx.lineTo(-s * 0.2, top - s * 0.14);
    ctx.lineTo(-s * 0.09, top - s * 0.05);
    ctx.lineTo(0, top - s * 0.18);
    ctx.lineTo(s * 0.09, top - s * 0.05);
    ctx.lineTo(s * 0.2, top - s * 0.14);
    ctx.lineTo(s * 0.18, top + s * 0.04);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e5484d';
    circle(ctx, 0, top - s * 0.02, s * 0.025);
    ctx.fill();
  } else if (hat === 'earmuffs') {
    ctx.strokeStyle = '#8f5bd6';
    ctx.lineWidth = s * 0.04;
    ctx.beginPath();
    ctx.arc(0, -s * 0.55, s * 0.31, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.fillStyle = '#c9a6ff';
    for (const side of [-1, 1]) {
      circle(ctx, side * s * 0.31, -s * 0.6, s * 0.08);
      ctx.fill();
    }
  }
}

// Fok: (x, y) taban ortası; face: -1 sola, 1 sağa bakar.
export function drawSeal(ctx, x, y, size, face = 1, t = 0) {
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(face, 1);
  ctx.fillStyle = '#8f9bb0';
  ellipse(ctx, 0, -s * 0.22, s * 0.38, s * 0.2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-s * 0.32, -s * 0.2);
  ctx.lineTo(-s * 0.5, -s * 0.34);
  ctx.lineTo(-s * 0.46, -s * 0.12);
  ctx.fill();
  circle(ctx, s * 0.24, -s * 0.38 + Math.sin(t * 3) * s * 0.02, s * 0.17);
  ctx.fill();
  ctx.fillStyle = '#c3cbd8';
  ellipse(ctx, s * 0.02, -s * 0.12, s * 0.26, s * 0.08);
  ctx.fill();
  ctx.fillStyle = '#6f7b90';
  ellipse(ctx, s * 0.08, -s * 0.06, s * 0.1, s * 0.05, 0.5);
  ctx.fill();
  const hy = -s * 0.38 + Math.sin(t * 3) * s * 0.02;
  ctx.fillStyle = '#1b1b24';
  circle(ctx, s * 0.29, hy - s * 0.04, s * 0.03);
  ctx.fill();
  circle(ctx, s * 0.39, hy + s * 0.02, s * 0.03);
  ctx.fill();
  ctx.strokeStyle = '#4a5466';
  ctx.lineWidth = Math.max(1, s * 0.015);
  for (const dy of [-0.01, 0.03]) {
    ctx.beginPath();
    ctx.moveTo(s * 0.36, hy + s * (0.04 + dy));
    ctx.lineTo(s * 0.5, hy + s * (0.02 + dy * 2));
    ctx.stroke();
  }
  ctx.restore();
}

// Balık (tahtada ve arayüzde).
export function drawFish(ctx, x, y, size, t = 0) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 4) * size * 0.05);
  ctx.rotate(Math.sin(t * 3) * 0.12);
  ctx.fillStyle = '#ff8c42';
  ellipse(ctx, 0, 0, size * 0.32, size * 0.18);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(size * 0.26, 0);
  ctx.lineTo(size * 0.48, -size * 0.16);
  ctx.lineTo(size * 0.48, size * 0.16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd3b0';
  ellipse(ctx, -size * 0.05, size * 0.05, size * 0.16, size * 0.07);
  ctx.fill();
  ctx.fillStyle = '#1b1b24';
  circle(ctx, -size * 0.17, -size * 0.04, size * 0.035);
  ctx.fill();
  ctx.restore();
}
