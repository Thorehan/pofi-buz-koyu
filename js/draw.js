// Ortak çizim yardımcıları ve Pofi karakteri (kıyafetleriyle).

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
  for (const ex of [-1, 1]) {
    if (o.blink) {
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
    if (outfit.scarf === 'aurora') {
      const g = ctx.createLinearGradient(-s * 0.3, 0, s * 0.3, 0);
      g.addColorStop(0, '#3cdc9a');
      g.addColorStop(0.5, '#4fb3ff');
      g.addColorStop(1, '#8f5bd6');
      ctx.fillStyle = g;
    } else ctx.fillStyle = SCARF[outfit.scarf];
    roundRect(ctx, -s * 0.3, -s * 0.43, s * 0.6, s * 0.09, s * 0.04);
    ctx.fill();
    roundRect(ctx, -face * s * 0.12 + s * 0.08 - s * 0.05, -s * 0.38, s * 0.1, s * 0.2, s * 0.03);
    ctx.fill();
    if (outfit.scarf === 'striped') {
      ctx.fillStyle = '#ffffff';
      for (let k = -2; k <= 2; k++) ctx.fillRect(k * s * 0.11 - s * 0.02, -s * 0.43, s * 0.04, s * 0.09);
    }
  }

  // şapka
  const hat = outfit.hat;
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
  ctx.restore();
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
