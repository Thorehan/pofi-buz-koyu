// İç mekân: iglonun içi. Oda ve 6 yuvanın eşyaları (her biri 3 kademe) kodla çizilir;
// görseller gelene kadar geçerli. items: { yuvaId: kademe (0 = boş) }.
import { roundRect, circle, ellipse, drawPofi } from './draw.js';
import { art } from './art.js';

// Yuvaların odadaki yeri (genişlik/yükseklik oranı). Lamba 3. kademede tavana asılır.
const BOX = {
  window: [0.2, 0.16, 0.4, 0.5],
  wall: [0.52, 0.14, 0.72, 0.46],
  shelf: [0.68, 0.34, 0.88, 0.68],
  bed: [0.03, 0.4, 0.37, 0.93],
  rug: [0.36, 0.8, 0.7, 0.97],
  lamp: [0.36, 0.6, 0.46, 0.84],
  lampTop: [0.4, 0.02, 0.62, 0.26],
};
const slotBox = (slot, tier) => BOX[slot === 'lamp' && tier === 3 ? 'lampTop' : slot];

// Eşya görselleri (pofi-r6): 512×512, bir yuvanın 3 kademesi aynı ölçekte. Ölçek, en büyük kademenin (t3)
// görünen boyutu [genişlik, yükseklik] kendi kutusuna sığacak şekilde seçilir.
// Çapa: yerdekiler taban ortası (496. satır), avize üst orta (16. satır), duvardakiler hücre ortası.
const ITEM_T3 = { bed: [388, 480], rug: [473, 273], lamp: [302, 480], shelf: [373, 480], window: [478, 466], wall: [306, 480] };
const ON_WALL = new Set(['shelf', 'window', 'wall']);
function itemArt(ctx, W, H, slot, tier) {
  const im = art(`int_igloo_${slot}_t${tier}`);
  if (!im) return false;
  const [bw, bh] = ITEM_T3[slot], top = slotBox(slot, 3), [x0, y0, x1, y1] = slotBox(slot, tier);
  const k = Math.min(((top[2] - top[0]) * W) / bw, ((top[3] - top[1]) * H) / bh);
  const cx = ((x0 + x1) / 2) * W;
  if (ON_WALL.has(slot)) ctx.drawImage(im, cx - 256 * k, ((y0 + y1) / 2) * H - 256 * k, 512 * k, 512 * k);
  else if (slot === 'lamp' && tier === 3) ctx.drawImage(im, cx - 256 * k, y0 * H - 16 * k, 512 * k, 512 * k);
  else ctx.drawImage(im, cx - 256 * k, y1 * H - 496 * k, 512 * k, 512 * k);
  return true;
}

export function drawRoom(ctx, W, H, t, { items = {}, highlight = null, highlightTier = 0, outfit = {} } = {}) {
  ctx.clearRect(0, 0, W, H);
  const bg = art('room_igloo_bg');
  if (bg) ctx.drawImage(bg, 0, 0, W, H);
  else drawShell(ctx, W, H);
  drawItems(ctx, W, H, t, items);
  finishRoom(ctx, W, H, t, items, highlight, highlightTier, outfit);
}

// Kodla çizilen boş oda (görsel yoksa): buz kubbe, zemin, kapı tüneli.
function drawShell(ctx, W, H) {
  // duvar: iglo kubbesi, buz blokları
  const wall = ctx.createLinearGradient(0, 0, 0, H);
  wall.addColorStop(0, '#cfe7fb');
  wall.addColorStop(1, '#eaf5ff');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(120,170,215,.45)';
  ctx.lineWidth = 1.5;
  for (let r = 1; r <= 6; r++) {
    const ry = H * (0.14 + r * 0.13);
    ctx.beginPath();
    ctx.ellipse(W / 2, H * 0.98, W * 0.62, ry, 0, Math.PI, 0);
    ctx.stroke();
    for (let k = 0; k < 7; k++) {
      const a = Math.PI + ((k + (r % 2) * 0.5 + 0.5) * Math.PI) / 7.5;
      const r0 = H * (0.14 + (r - 1) * 0.13);
      ctx.beginPath();
      ctx.moveTo(W / 2 + Math.cos(a) * W * 0.62 * (r0 / ry), H * 0.98 + Math.sin(a) * r0);
      ctx.lineTo(W / 2 + Math.cos(a) * W * 0.62, H * 0.98 + Math.sin(a) * ry);
      ctx.stroke();
    }
  }
  // zemin
  ctx.fillStyle = '#d7e6f3';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.74);
  ctx.quadraticCurveTo(W / 2, H * 0.68, W, H * 0.74);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.fill();
  // kapı tüneli (sağda)
  ctx.fillStyle = '#5b8fc2';
  ctx.beginPath();
  ctx.moveTo(W * 0.88, H * 0.76);
  ctx.lineTo(W * 0.88, H * 0.56);
  ctx.quadraticCurveTo(W * 0.94, H * 0.46, W * 1.0, H * 0.54);
  ctx.lineTo(W, H * 0.78);
  ctx.fill();

}

// Eşyalar arkadan öne: arka duvar → raf → yer → lamba. Görseli olan eşya görselle çizilir.
function drawItems(ctx, W, H, t, items) {
  const u = Math.min(W, H);
  const code = { window: win, wall: wallDeco, shelf, rug, bed, lamp };
  for (const slot of ['window', 'wall', 'shelf', 'rug', 'bed', 'lamp']) {
    const tier = items[slot] || 0;
    if (tier && !itemArt(ctx, W, H, slot, tier)) code[slot](ctx, W, H, u, tier, t);
  }
}

function finishRoom(ctx, W, H, t, items, highlight, highlightTier, outfit) {
  const tier = s => items[s] || 0;
  const u = Math.min(W, H);

  const px = W * (0.56 + 0.08 * Math.sin(t * 0.5)), face = Math.cos(t * 0.5) > 0 ? 1 : -1;
  const moving = Math.abs(Math.cos(t * 0.5)) > 0.2;
  drawPofi(ctx, px, H * 0.92 - (moving ? Math.abs(Math.sin(t * 7)) * u * 0.01 : 0), u * 0.25, { face: moving ? face : 0, outfit, blink: (t % 3.4) < 0.12 });

  // lamba yanınca oda ısınır
  const lt = tier('lamp');
  if (lt) {
    const [cx, cy] = lt === 3 ? [W * 0.51, H * 0.16] : [W * 0.41, H * 0.7];
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, u * (0.5 + lt * 0.15));
    g.addColorStop(0, `rgba(255,214,140,${0.18 + lt * 0.06 + Math.sin(t * 6) * 0.02})`);
    g.addColorStop(1, 'rgba(255,214,140,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // seçili yuva: önizlenen eşya yoksa kesik çizgili "boş yuva" çerçevesi
  if (highlight) {
    const [x0, y0, x1, y1] = slotBox(highlight, highlightTier);
    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.lineDashOffset = -t * 12;
    ctx.strokeStyle = 'rgba(255,138,61,.9)';
    ctx.lineWidth = 2.5;
    roundRect(ctx, x0 * W, y0 * H, (x1 - x0) * W, (y1 - y0) * H, 10);
    ctx.stroke();
    ctx.restore();
    if (!highlightTier) {
      ctx.fillStyle = 'rgba(255,138,61,.9)';
      ctx.font = `700 ${Math.round(u * 0.09)}px Fredoka, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', ((x0 + x1) / 2) * W, ((y0 + y1) / 2) * H);
    }
  }
}

// Yuva listesindeki küçük resim: eşyayı kendi kutusuna sığdırıp ortalar.
export function drawItemIcon(ctx, size, slot, tier, t = 0) {
  const im = art(`int_igloo_${slot}_t${tier}`);
  if (im) {
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(im, 0, 0, size, size);
    return;
  }
  const W = 300, H = 200, [x0, y0, x1, y1] = slotBox(slot, tier);
  const bw = (x1 - x0) * W, bh = (y1 - y0) * H, k = (size * 0.86) / Math.max(bw, bh);
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.scale(k, k);
  ctx.translate(-((x0 + x1) / 2) * W, -((y0 + y1) / 2) * H);
  const u = Math.min(W, H);
  ({ window: win, wall: wallDeco, shelf, lamp }[slot] || (() => {}))(ctx, W, H, u, tier, t);
  if (slot === 'rug') rug(ctx, W, H, u, tier);
  if (slot === 'bed') bed(ctx, W, H, u, tier);
  ctx.restore();
}

function win(ctx, W, H, u, tier, t) {
  if (!tier) return;
  const cx = W * 0.3, cy = H * 0.33, r = u * 0.13;
  const sky = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  sky.addColorStop(0, '#1b2650');
  sky.addColorStop(1, '#3b5fa0');
  ctx.fillStyle = sky;
  circle(ctx, cx, cy, r);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  for (let k = 0; k < 6; k++) {
    circle(ctx, cx + Math.cos(k * 2.1) * r * 0.6, cy + Math.sin(k * 1.7) * r * 0.5, 1.2 + ((k + Math.floor(t * 2)) % 3 === 0 ? 0.8 : 0));
    ctx.fill();
  }
  if (tier >= 3) {
    // vitray: renkli dilimler
    const cols = ['#ff5a6a', '#ffd166', '#3cc977', '#3d9bff', '#a46bff', '#ff8a3d'];
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = cols[k];
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, (k * Math.PI) / 3, ((k + 1) * Math.PI) / 3);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = tier >= 3 ? '#c9a227' : '#ffffff';
  ctx.lineWidth = u * 0.025;
  circle(ctx, cx, cy, r);
  ctx.stroke();
  ctx.lineWidth = u * 0.012;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx + r, cy);
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx, cy + r);
  ctx.stroke();
  if (tier >= 2) {
    // perdeler
    ctx.fillStyle = tier >= 3 ? '#8f5bd6' : '#e5484d';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + s * r * 0.5, cy - r * 1.25);
      ctx.lineTo(cx + s * r * 1.45, cy - r * 1.25);
      ctx.quadraticCurveTo(cx + s * r * 1.2, cy, cx + s * r * 1.5, cy + r * 1.2);
      ctx.lineTo(cx + s * r * 1.05, cy + r * 1.2);
      ctx.quadraticCurveTo(cx + s * r * 0.95, cy - r * 0.2, cx + s * r * 0.5, cy - r * 1.25);
      ctx.fill();
    }
    ctx.fillStyle = '#7a5434';
    ctx.fillRect(cx - r * 1.6, cy - r * 1.32, r * 3.2, u * 0.014);
  }
}

function wallDeco(ctx, W, H, u, tier, t) {
  if (!tier) return;
  const cx = W * 0.62, cy = H * 0.3;
  if (tier === 1) {
    ctx.fillStyle = '#9a6a42';
    roundRect(ctx, cx - u * 0.12, cy - u * 0.08, u * 0.24, u * 0.16, u * 0.015);
    ctx.fill();
    ctx.fillStyle = '#e8f6ff';
    ctx.fillRect(cx - u * 0.1, cy - u * 0.06, u * 0.2, u * 0.12);
    ctx.fillStyle = '#ff9f43';
    ellipse(ctx, cx - u * 0.01, cy, u * 0.06, u * 0.03);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + u * 0.045, cy);
    ctx.lineTo(cx + u * 0.08, cy - u * 0.025);
    ctx.lineTo(cx + u * 0.08, cy + u * 0.025);
    ctx.fill();
    ctx.fillStyle = '#1b1b24';
    circle(ctx, cx - u * 0.045, cy - u * 0.006, u * 0.006);
    ctx.fill();
  } else if (tier === 2) {
    ctx.strokeStyle = '#2f7d4a';
    ctx.lineWidth = u * 0.045;
    circle(ctx, cx, cy, u * 0.1);
    ctx.stroke();
    ctx.fillStyle = '#e5484d';
    for (let k = 0; k < 8; k++) {
      circle(ctx, cx + Math.cos(k * 0.79) * u * 0.1, cy + Math.sin(k * 0.79) * u * 0.1, u * 0.012);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(cx, cy + u * 0.1);
    ctx.lineTo(cx - u * 0.05, cy + u * 0.15);
    ctx.lineTo(cx - u * 0.03, cy + u * 0.17);
    ctx.lineTo(cx, cy + u * 0.12);
    ctx.lineTo(cx + u * 0.03, cy + u * 0.17);
    ctx.lineTo(cx + u * 0.05, cy + u * 0.15);
    ctx.fill();
  } else {
    // aurora halısı: dalgalanan kumaş
    ctx.fillStyle = '#7a5434';
    ctx.fillRect(cx - u * 0.16, cy - u * 0.15, u * 0.32, u * 0.018);
    const g = ctx.createLinearGradient(cx - u * 0.15, 0, cx + u * 0.15, 0);
    g.addColorStop(0, '#3cdc9a');
    g.addColorStop(0.5, '#4fb3ff');
    g.addColorStop(1, '#8f5bd6');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(cx - u * 0.15, cy - u * 0.135);
    ctx.lineTo(cx + u * 0.15, cy - u * 0.135);
    for (let k = 0; k <= 6; k++) ctx.lineTo(cx + u * 0.15 - (k * u * 0.3) / 6, cy + u * 0.13 + Math.sin(t * 2 + k) * u * 0.008 + (k % 2) * u * 0.02);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    for (let k = 0; k < 5; k++) {
      circle(ctx, cx + Math.cos(k * 1.9) * u * 0.1, cy + Math.sin(k * 2.3) * u * 0.07, u * 0.007);
      ctx.fill();
    }
  }
}

function shelf(ctx, W, H, u, tier) {
  if (!tier) return;
  const cx = W * 0.78, top = H * 0.42, w = u * 0.26;
  if (tier === 3) {
    ctx.fillStyle = '#7a4a2e';
    roundRect(ctx, cx - w / 2, top, w, u * 0.38, u * 0.02);
    ctx.fill();
    ctx.fillStyle = 'rgba(200,235,255,.75)';
    ctx.fillRect(cx - w / 2 + u * 0.02, top + u * 0.02, w - u * 0.04, u * 0.34);
    for (const [fx, fy] of [[-0.06, 0.14], [0.05, 0.14], [0, 0.3]]) cup(ctx, cx + fx * u, top + fy * u, u * 0.03);
    ctx.fillStyle = '#7a4a2e';
    ctx.fillRect(cx - w / 2, top + u * 0.17, w, u * 0.014);
    return;
  }
  const rows = tier === 1 ? 1 : 2;
  for (let r = 0; r < rows; r++) {
    const y = top + u * (0.1 + r * 0.13);
    ctx.fillStyle = '#9a6a42';
    ctx.fillRect(cx - w / 2, y, w, u * 0.016);
    ctx.fillStyle = '#7a5434';
    ctx.fillRect(cx - w / 2 + u * 0.02, y, u * 0.01, u * 0.03);
    ctx.fillRect(cx + w / 2 - u * 0.03, y, u * 0.01, u * 0.03);
    if (tier === 1) {
      mugIcon(ctx, cx - u * 0.05, y - u * 0.03, u * 0.025);
      ctx.fillStyle = 'rgba(160,215,255,.8)';
      roundRect(ctx, cx + u * 0.02, y - u * 0.07, u * 0.06, u * 0.07, u * 0.01);
      ctx.fill();
      ctx.fillStyle = '#ff9f43';
      ellipse(ctx, cx + u * 0.05, y - u * 0.035, u * 0.018, u * 0.009);
      ctx.fill();
    } else {
      const cols = ['#e5484d', '#3d7bd9', '#f5b81c', '#3fae5a', '#8f5bd6', '#ff8a3d'];
      for (let k = 0; k < 6; k++) {
        ctx.fillStyle = cols[(k + r * 2) % 6];
        const bh = u * (0.06 + ((k * 7 + r) % 3) * 0.012);
        ctx.fillRect(cx - w / 2 + u * 0.025 + k * u * 0.035, y - bh, u * 0.028, bh);
      }
    }
  }
}

function rug(ctx, W, H, u, tier) {
  if (!tier) return;
  const cx = W * 0.53, cy = H * 0.885;
  if (tier === 1) {
    for (const [r, c] of [[0.14, '#e5484d'], [0.1, '#ffffff'], [0.06, '#e5484d']]) {
      ctx.fillStyle = c;
      ellipse(ctx, cx, cy, u * r * 1.6, u * r * 0.45);
      ctx.fill();
    }
  } else if (tier === 2) {
    ctx.fillStyle = '#3d7bd9';
    ellipse(ctx, cx, cy, u * 0.36, u * 0.09);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = u * 0.012;
    ctx.beginPath();
    for (let k = 0; k <= 12; k++) ctx.lineTo(cx - u * 0.28 + (k * u * 0.56) / 12, cy + (k % 2 ? -1 : 1) * u * 0.025);
    ctx.stroke();
    ctx.strokeStyle = '#f5b81c';
    ellipse(ctx, cx, cy, u * 0.33, u * 0.075);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#1d3557';
    ellipse(ctx, cx, cy, u * 0.42, u * 0.1);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 0.035 : 0.085;
      ctx.lineTo(cx + Math.cos(a) * u * r * 2.4, cy + Math.sin(a) * u * r * 0.7);
    }
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    for (let k = 0; k < 8; k++) {
      circle(ctx, cx + Math.cos(k * 0.8) * u * 0.32, cy + Math.sin(k * 0.8) * u * 0.07, u * 0.006);
      ctx.fill();
    }
  }
}

function bed(ctx, W, H, u, tier) {
  if (!tier) return;
  const cx = W * 0.2, base = H * 0.9;
  if (tier === 1) {
    ctx.fillStyle = '#d9b26f';
    ellipse(ctx, cx, base - u * 0.03, u * 0.2, u * 0.05);
    ctx.fill();
    ctx.strokeStyle = '#b48a48';
    ctx.lineWidth = 1.2;
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath();
      ctx.moveTo(cx + k * u * 0.06, base - u * 0.07);
      ctx.lineTo(cx + k * u * 0.06, base + u * 0.01);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, cx - u * 0.13, base - u * 0.06, u * 0.05, u * 0.022);
    ctx.fill();
    return;
  }
  const w = u * 0.4;
  if (tier === 3) {
    // cibinlik direkleri ve perdesi
    ctx.fillStyle = '#7a4a2e';
    ctx.fillRect(cx - w / 2, base - u * 0.42, u * 0.018, u * 0.42);
    ctx.fillRect(cx + w / 2 - u * 0.018, base - u * 0.42, u * 0.018, u * 0.42);
    ctx.fillRect(cx - w / 2, base - u * 0.43, w, u * 0.02);
    ctx.fillStyle = 'rgba(164,107,255,.55)';
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, base - u * 0.41);
    ctx.quadraticCurveTo(cx, base - u * 0.3, cx + w / 2, base - u * 0.41);
    ctx.lineTo(cx + w / 2, base - u * 0.36);
    ctx.quadraticCurveTo(cx, base - u * 0.25, cx - w / 2, base - u * 0.36);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    for (const s of [-1, 1]) { circle(ctx, cx + s * (w / 2 - u * 0.009), base - u * 0.44, u * 0.016); ctx.fill(); }
  }
  ctx.fillStyle = '#9a6a42';
  ctx.fillRect(cx - w / 2, base - u * 0.16, u * 0.03, u * 0.16);
  ctx.fillRect(cx - w / 2, base - u * 0.06, w, u * 0.06);
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, cx - w * 0.3, base - u * 0.085, u * 0.06, u * 0.028);
  ctx.fill();
  ctx.fillStyle = tier === 3 ? '#8f5bd6' : '#3d7bd9';
  roundRect(ctx, cx - w * 0.15, base - u * 0.1, w * 0.62, u * 0.05, u * 0.02);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  for (let k = 0; k < 4; k++) { circle(ctx, cx - w * 0.05 + k * w * 0.13, base - u * 0.075, u * 0.007); ctx.fill(); }
}

function lamp(ctx, W, H, u, tier, t) {
  if (!tier) return;
  if (tier === 3) {
    // tavandan sarkan aurora avizesi
    const cx = W * 0.51, cy = H * 0.16;
    ctx.strokeStyle = '#5b4636';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, cy - u * 0.04);
    ctx.stroke();
    ctx.fillStyle = '#c9a227';
    ellipse(ctx, cx, cy - u * 0.03, u * 0.1, u * 0.02);
    ctx.fill();
    const cols = ['#3cdc9a', '#4fb3ff', '#8f5bd6', '#ff95b2'];
    for (let k = 0; k < 7; k++) {
      const x = cx - u * 0.09 + k * u * 0.03, len = u * (0.05 + (k % 3) * 0.02);
      ctx.fillStyle = cols[k % 4];
      ctx.globalAlpha = 0.75 + Math.sin(t * 3 + k) * 0.2;
      ctx.beginPath();
      ctx.moveTo(x - u * 0.008, cy - u * 0.02);
      ctx.lineTo(x + u * 0.008, cy - u * 0.02);
      ctx.lineTo(x, cy - u * 0.02 + len);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    return;
  }
  const cx = W * 0.41, base = H * 0.82;
  if (tier === 1) {
    ctx.fillStyle = '#9a6a42';
    ellipse(ctx, cx, base, u * 0.03, u * 0.01);
    ctx.fill();
    ctx.fillStyle = '#fff6e6';
    ctx.fillRect(cx - u * 0.012, base - u * 0.07, u * 0.024, u * 0.07);
    flame(ctx, cx, base - u * 0.07, u * 0.02, t);
    return;
  }
  ctx.fillStyle = '#7a5434';
  ctx.fillRect(cx - u * 0.05, base - u * 0.07, u * 0.1, u * 0.014);
  ctx.fillRect(cx - u * 0.04, base - u * 0.07, u * 0.01, u * 0.07);
  ctx.fillRect(cx + u * 0.03, base - u * 0.07, u * 0.01, u * 0.07);
  ctx.fillStyle = '#1d3557';
  ctx.fillRect(cx - u * 0.025, base - u * 0.19, u * 0.05, u * 0.014);
  ctx.fillRect(cx - u * 0.03, base - u * 0.085, u * 0.06, u * 0.015);
  ctx.fillStyle = 'rgba(255,224,150,.85)';
  roundRect(ctx, cx - u * 0.025, base - u * 0.175, u * 0.05, u * 0.09, u * 0.01);
  ctx.fill();
  flame(ctx, cx, base - u * 0.11, u * 0.018, t);
}

function flame(ctx, x, y, r, t) {
  const f = 1 + Math.sin(t * 12) * 0.12;
  ctx.fillStyle = '#ffb347';
  ctx.beginPath();
  ctx.moveTo(x, y - r * 2 * f);
  ctx.quadraticCurveTo(x + r, y - r * 0.4, x, y);
  ctx.quadraticCurveTo(x - r, y - r * 0.4, x, y - r * 2 * f);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ellipse(ctx, x, y - r * 0.6, r * 0.35, r * 0.6);
  ctx.fill();
}

function mugIcon(ctx, x, y, r) {
  ctx.fillStyle = '#e5484d';
  roundRect(ctx, x - r, y - r, r * 2, r * 2, r * 0.3);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - r, y - r * 0.15, r * 2, r * 0.4);
}

function cup(ctx, x, y, r) {
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.moveTo(x - r, y - r);
  ctx.lineTo(x + r, y - r);
  ctx.quadraticCurveTo(x + r, y + r * 0.4, x, y + r * 0.5);
  ctx.quadraticCurveTo(x - r, y + r * 0.4, x - r, y - r);
  ctx.fill();
  ctx.fillRect(x - r * 0.15, y + r * 0.4, r * 0.3, r * 0.6);
  ctx.fillRect(x - r * 0.6, y + r, r * 1.2, r * 0.25);
}
