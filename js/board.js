// Oyun tahtası: çizim, kayma animasyonu, kaydırma/klavye girdisi.
import { T, tileOf, isRamp } from './engine.js';
import { roundRect, circle, ellipse, drawPofi, drawPofiBelly, drawFish, drawSeal } from './draw.js';
import { art, tinted } from './art.js';

export const STEP = 0.075; // saniye / hücre

const ICE = '#e4f5ff';
const ICE_HI = '#ffffff';
const FRAME = '#2a5d8f';
const GAP = '#a9d3ef';
const WATER = '#3a86c8';
// Pipi (ikinci penguen, level 500+): Pofi görseli farklı kıyafetle.
export const PIPI_OUTFIT = { hat: 'beanieRed', scarf: 'yellow' };

// Nesne görselleri (pofi-r9): 256×256 saydam, hücreyi tam kaplar (taban 236. satırda).
// (x, y) hücre merkezi. Görsel yoksa false döner ve kod çizimi kullanılır.
function objArt(ctx, id, x, y, s, { rot = 0, flip = false, im = null } = {}) {
  im = im || art(id);
  if (!im) return false;
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(im, -s / 2, -s / 2, s, s);
  ctx.restore();
  return true;
}

export function drawCrate(ctx, x, y, s, alpha = 1) {
  if (alpha === 1 && objArt(ctx, 'obj_crate', x, y, s)) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  const k = s * 0.78;
  roundRect(ctx, x - k / 2, y - k / 2, k, k, s * 0.08);
  ctx.fillStyle = '#c98b4f';
  ctx.fill();
  ctx.lineWidth = s * 0.06;
  ctx.strokeStyle = '#8e5a2b';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - k * 0.36, y - k * 0.36);
  ctx.lineTo(x + k * 0.36, y + k * 0.36);
  ctx.moveTo(x + k * 0.36, y - k * 0.36);
  ctx.lineTo(x - k * 0.36, y + k * 0.36);
  ctx.lineWidth = s * 0.05;
  ctx.stroke();
  ctx.restore();
}

// Kar topu: itilince kayar, durduğu yerde kar yığını olur.
export function drawBall(ctx, x, y, s) {
  if (objArt(ctx, 'obj_snowball', x, y, s)) return;
  ctx.fillStyle = 'rgba(29,53,87,.18)';
  ellipse(ctx, x, y + s * 0.3, s * 0.3, s * 0.07);
  ctx.fill();
  const g = ctx.createRadialGradient(x - s * 0.1, y - s * 0.12, s * 0.04, x, y, s * 0.36);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#bcd9ef');
  ctx.fillStyle = g;
  circle(ctx, x, y + s * 0.02, s * 0.32);
  ctx.fill();
  ctx.strokeStyle = '#7fa9cc';
  ctx.lineWidth = Math.max(1.5, s * 0.04);
  ctx.stroke();
}

// Buz salı: suyun üstünde yüzen yassı buz parçası.
export function drawRaft(ctx, x, y, s, time = 0) {
  const bob = Math.sin(time * 2 + x * 0.1) * s * 0.02;
  if (objArt(ctx, 'obj_raft', x, y + bob, s)) return;
  ctx.fillStyle = 'rgba(15,42,77,.25)';
  ellipse(ctx, x, y + s * 0.12 + bob, s * 0.4, s * 0.16);
  ctx.fill();
  ctx.fillStyle = '#eaf7ff';
  roundRect(ctx, x - s * 0.38, y - s * 0.2 + bob, s * 0.76, s * 0.4, s * 0.12);
  ctx.fill();
  ctx.strokeStyle = '#7fb8e6';
  ctx.lineWidth = Math.max(1.5, s * 0.04);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.9)';
  ctx.beginPath();
  ctx.moveTo(x - s * 0.24, y - s * 0.08 + bob);
  ctx.lineTo(x - s * 0.08, y - s * 0.08 + bob);
  ctx.stroke();
}

// Anahtar balık: altın balık, kuyruğu anahtar dişli.
export function drawKey(ctx, x, y, s, time = 0) {
  const bob = Math.sin(time * 3) * s * 0.03;
  if (objArt(ctx, 'obj_keyfish', x, y + bob, s * 0.9)) return;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = '#ffd166';
  ctx.strokeStyle = '#b07d12';
  ctx.lineWidth = Math.max(1.5, s * 0.04);
  ellipse(ctx, -s * 0.06, 0, s * 0.2, s * 0.13);
  ctx.fill();
  ctx.stroke();
  roundRect(ctx, s * 0.1, -s * 0.04, s * 0.22, s * 0.08, s * 0.03);
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(s * 0.22, s * 0.02, s * 0.05, s * 0.08);
  ctx.fillStyle = '#1d3557';
  circle(ctx, -s * 0.14, -s * 0.03, s * 0.03);
  ctx.fill();
  ctx.restore();
}

// Görseli olan karolar (rampa ayrıca, döndürülerek çizilir).
const TILE_ART = {
  [T.ICE]: 'tile_ice', [T.SNOW]: 'tile_snow', [T.ROCK]: 'tile_rock', [T.WATER]: 'tile_water', [T.CRACK]: 'tile_crack',
  [T.HOLE]: 'tile_hole', [T.MELT]: 'tile_melt', [T.BRIDGE]: 'tile_bridge',
};
// Buz zemin üstüne konan nesne görselleri.
const OBJ_ART = {
  [T.TURN]: 'obj_turntable', [T.ICICLE]: 'obj_icicle', [T.LOCK]: 'obj_icelock',
};

function tileArt(ctx, t, x, y, s, g) {
  const im = art(isRamp(t) ? 'tile_ramp' : TILE_ART[t]);
  if (!im) return false;
  ctx.save();
  roundRect(ctx, x + g, y + g, s - 2 * g, s - 2 * g, s * 0.14);
  ctx.clip();
  // Rampa görseli sağa doğru yükselir; diğer yönler döndürülerek elde edilir.
  if (isRamp(t)) {
    ctx.translate(x + s / 2, y + s / 2);
    ctx.rotate(((t - T.RAMP_RIGHT) * Math.PI) / 2);
    ctx.translate(-(x + s / 2), -(y + s / 2));
  }
  ctx.drawImage(im, x + g, y + g, s - 2 * g, s - 2 * g);
  ctx.restore();
  return true;
}

// Tek karo (tahtada ve "YENİ" kartlarındaki küçük resimlerde kullanılır).
export function paintTile(ctx, t, x, y, s, time, opt = {}) {
  const g = Math.max(1, s * 0.03);
  const cx = x + s / 2, cy = y + s / 2;
  const base = () => {
    if (tileArt(ctx, T.ICE, x, y, s, g)) return;
    roundRect(ctx, x + g, y + g, s - 2 * g, s - 2 * g, s * 0.14);
    ctx.fillStyle = ICE;
    ctx.fill();
    ctx.strokeStyle = ICE_HI;
    ctx.lineWidth = Math.max(1.5, s * 0.04);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + s * 0.22, y + s * 0.34);
    ctx.lineTo(x + s * 0.34, y + s * 0.22);
    ctx.moveTo(x + s * 0.24, y + s * 0.5);
    ctx.lineTo(x + s * 0.5, y + s * 0.24);
    ctx.stroke();
  };
  const water = () => {
    if (tileArt(ctx, T.WATER, x, y, s, g)) return;
    roundRect(ctx, x + g, y + g, s - 2 * g, s - 2 * g, s * 0.14);
    ctx.fillStyle = WATER;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.45)';
    ctx.lineWidth = Math.max(1.5, s * 0.035);
    for (let k = 0; k < 2; k++) {
      ctx.beginPath();
      const yy = y + s * (0.38 + k * 0.28);
      for (let i = 0; i <= 8; i++) {
        const xx = x + s * (0.18 + i * 0.08);
        const w = Math.sin(time * 3 + i * 0.9 + k * 2 + x * 0.05) * s * 0.03;
        if (i === 0) ctx.moveTo(xx, yy + w); else ctx.lineTo(xx, yy + w);
      }
      ctx.stroke();
    }
  };

  if (t === T.WATER) { water(); return; }
  if (t === T.BRIDGE && tileArt(ctx, t, x, y, s, g)) return;
  if (t === T.BRIDGE) {
    water();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.sin(time * 1.5 + x) * 0.05);
    drawCrate(ctx, 0, 0, s * 0.95);
    ctx.restore();
    return;
  }
  if (t !== T.ICE && (TILE_ART[t] || isRamp(t)) && tileArt(ctx, t, x, y, s, g)) return;
  base();
  // Görseli olan nesneler buz zeminin üstüne çizilir.
  const id = OBJ_ART[t]
    || (t === T.LEVER ? (opt.leverOn ? 'obj_lever_on' : 'obj_lever_off') : null)
    || (t === T.GATE ? 'obj_gate_closed' : opt.gateOpen && t === T.ICE ? 'obj_gate_open' : null)
    || (t === T.PLATE ? (opt.pressed ? 'obj_plate_on' : 'obj_plate_off') : null)
    || (t === T.FRAGILE ? (opt.cracked ? 'obj_rock_fragile_cracked' : 'obj_rock_fragile') : null);
  // Sarkıt görseli ince; tavana yapışık kalacak şekilde 1,6 kat büyütülür (altı saydam).
  if (t === T.ICICLE && art('obj_icicle')) { ctx.drawImage(art('obj_icicle'), cx - s * 0.8, y - s * 0.02, s * 1.6, s * 1.6); return; }
  if (id && objArt(ctx, id, cx, cy, s)) return;
  // Plaka kapısı: aynı kapı görseli yeşile boyanır (kol kapısından ayırt edilsin).
  if ((t === T.PGATE || (opt.pgateOpen && t === T.ICE)) && art('obj_gate_closed')) {
    const pid = t === T.PGATE ? 'obj_gate_closed' : 'obj_gate_open';
    objArt(ctx, pid, cx, cy, s, { im: tinted(pid, '#3fbf7f', { all: true }) });
    return;
  }
  if (t >= T.UP && t <= T.LEFT && objArt(ctx, 'obj_arrow', cx, cy, s * (0.92 + 0.05 * Math.sin(time * 5)), { rot: ((t - T.UP - 1) * Math.PI) / 2 })) return;
  if (t === T.FLAG && art('obj_windflag')) {
    const d = opt.wind ?? 1;
    objArt(ctx, 'obj_windflag', cx, cy, s, { flip: d === 3 });
    // rüzgârın yönü: köşede küçük ok
    ctx.save();
    ctx.translate(x + s * 0.22, y + s * 0.78);
    ctx.rotate((d * Math.PI) / 2);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1d3557';
    ctx.lineWidth = Math.max(1.5, s * 0.03);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.13);
    ctx.lineTo(s * 0.1, 0);
    ctx.lineTo(s * 0.04, 0);
    ctx.lineTo(s * 0.04, s * 0.11);
    ctx.lineTo(-s * 0.04, s * 0.11);
    ctx.lineTo(-s * 0.04, 0);
    ctx.lineTo(-s * 0.1, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (t === T.ROCK) {
    ctx.fillStyle = '#7d8aa0';
    ellipse(ctx, cx, cy + s * 0.04, s * 0.36, s * 0.3);
    ctx.fill();
    ctx.fillStyle = '#9aa7bc';
    ellipse(ctx, cx - s * 0.06, cy - s * 0.04, s * 0.24, s * 0.18);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, cx - s * 0.04, cy - s * 0.2, s * 0.2, s * 0.08);
    ctx.fill();
  } else if (t === T.SNOW) {
    ctx.fillStyle = '#c4dff2';
    ellipse(ctx, cx, cy + s * 0.12, s * 0.4, s * 0.22);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, cx - s * 0.1, cy + s * 0.02, s * 0.24, s * 0.2);
    ctx.fill();
    ellipse(ctx, cx + s * 0.14, cy + s * 0.06, s * 0.2, s * 0.16);
    ctx.fill();
  } else if (t === T.CRACK) {
    ctx.strokeStyle = '#5f8fb5';
    ctx.lineWidth = Math.max(1.5, s * 0.035);
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x + s * 0.18, y + s * 0.3);
    ctx.lineTo(x + s * 0.42, y + s * 0.46);
    ctx.lineTo(x + s * 0.38, y + s * 0.62);
    ctx.lineTo(x + s * 0.62, y + s * 0.82);
    ctx.moveTo(x + s * 0.42, y + s * 0.46);
    ctx.lineTo(x + s * 0.7, y + s * 0.38);
    ctx.lineTo(x + s * 0.84, y + s * 0.2);
    ctx.moveTo(x + s * 0.38, y + s * 0.62);
    ctx.lineTo(x + s * 0.2, y + s * 0.74);
    ctx.stroke();
  } else if (t === T.LEVER) {
    ctx.fillStyle = '#7d8aa0';
    roundRect(ctx, cx - s * 0.22, cy + s * 0.14, s * 0.44, s * 0.14, s * 0.05);
    ctx.fill();
    const a = opt.leverOn ? 0.6 : -0.6;
    ctx.save();
    ctx.translate(cx, cy + s * 0.16);
    ctx.rotate(a);
    ctx.fillStyle = '#5b4636';
    ctx.fillRect(-s * 0.03, -s * 0.36, s * 0.06, s * 0.36);
    ctx.fillStyle = '#e5484d';
    circle(ctx, 0, -s * 0.38, s * 0.08);
    ctx.fill();
    ctx.restore();
  } else if (t === T.GATE || opt.gateOpen) {
    ctx.save();
    ctx.globalAlpha = t === T.GATE ? 1 : 0.22;
    ctx.fillStyle = '#7fb8e6';
    roundRect(ctx, x + s * 0.12, y + s * 0.12, s * 0.76, s * 0.12, s * 0.05);
    ctx.fill();
    for (let k = 0; k < 3; k++) {
      roundRect(ctx, x + s * (0.2 + k * 0.24), y + s * 0.2, s * 0.12, s * 0.62, s * 0.06);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    for (let k = 0; k < 3; k++) ctx.fillRect(x + s * (0.22 + k * 0.24), y + s * 0.24, s * 0.03, s * 0.5);
    ctx.restore();
  } else if (t >= T.UP && t <= T.LEFT) {
    const d = t - T.UP;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((d * Math.PI) / 2);
    ctx.strokeStyle = '#4ea8de';
    ctx.lineWidth = s * 0.1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const pulse = 0.04 * Math.sin(time * 5);
    for (const off of [0.08, -0.14]) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.2, (off + 0.12 + pulse) * s);
      ctx.lineTo(0, (off - 0.08 + pulse) * s);
      ctx.lineTo(s * 0.2, (off + 0.12 + pulse) * s);
      ctx.stroke();
    }
    ctx.restore();
  } else if (t === T.HOLE) {
    // Buz deliği: koyu su ve dönen halka; eşleşen delikler aynı görünür.
    ctx.fillStyle = '#9cc8ea';
    ellipse(ctx, cx, cy, s * 0.36, s * 0.3);
    ctx.fill();
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.3);
    g.addColorStop(0, '#0f2a4d');
    g.addColorStop(1, '#2a5d8f');
    ctx.fillStyle = g;
    ellipse(ctx, cx, cy, s * 0.29, s * 0.23);
    ctx.fill();
    ctx.strokeStyle = 'rgba(160,220,255,.8)';
    ctx.lineWidth = Math.max(1.5, s * 0.035);
    for (let k = 0; k < 2; k++) {
      const a = time * 2.4 + k * Math.PI;
      ctx.beginPath();
      ctx.ellipse(cx, cy, s * 0.18, s * 0.13, 0, a, a + 1.6);
      ctx.stroke();
    }
  } else if (t === T.MELT) {
    // Eriyen kar: karın altından su sızar.
    ctx.fillStyle = 'rgba(90,160,216,.35)';
    ellipse(ctx, cx, cy + s * 0.2, s * 0.42, s * 0.14);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, cx - s * 0.08, cy + s * 0.04, s * 0.22, s * 0.17);
    ctx.fill();
    ellipse(ctx, cx + s * 0.12, cy + s * 0.08, s * 0.17, s * 0.13);
    ctx.fill();
    ctx.fillStyle = '#5aa0d8';
    for (let k = 0; k < 3; k++) {
      const f = (time * 0.7 + k / 3) % 1;
      ctx.globalAlpha = 1 - f;
      ellipse(ctx, cx + (k - 1) * s * 0.15, cy + s * (0.14 + f * 0.12), s * 0.025, s * 0.04);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (isRamp(t)) {
    // Rampa: alçak kenardan yüksek dudağa doğru yükselen buz; dudak rampanın yönünde.
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(((t - T.RAMP_UP) * Math.PI) / 2);
    ctx.fillStyle = 'rgba(42,93,143,.22)';
    roundRect(ctx, -s * 0.3, -s * 0.44, s * 0.6, s * 0.1, s * 0.04);
    ctx.fill();
    const g = ctx.createLinearGradient(0, s * 0.34, 0, -s * 0.34);
    g.addColorStop(0, '#eef8ff');
    g.addColorStop(1, '#8fbfe6');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-s * 0.32, s * 0.36);
    ctx.lineTo(s * 0.32, s * 0.36);
    ctx.lineTo(s * 0.26, -s * 0.32);
    ctx.lineTo(-s * 0.26, -s * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#4f86b8';
    roundRect(ctx, -s * 0.27, -s * 0.36, s * 0.54, s * 0.07, s * 0.03);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = s * 0.07;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const lift = 0.05 * Math.sin(time * 5);
    ctx.beginPath();
    ctx.moveTo(-s * 0.14, (0.12 - lift) * s);
    ctx.lineTo(0, (-0.02 - lift) * s);
    ctx.lineTo(s * 0.14, (0.12 - lift) * s);
    ctx.stroke();
    ctx.restore();
  } else if (t === T.PLATE) {
    // Basınç plakası: üstünde bir şey durunca içe çöker ve yeşil yanar.
    const on = !!opt.pressed;
    ctx.fillStyle = 'rgba(29,53,87,.18)';
    roundRect(ctx, cx - s * 0.3, cy - s * 0.26, s * 0.6, s * 0.56, s * 0.1);
    ctx.fill();
    ctx.fillStyle = on ? '#4cc38a' : '#9aa7bc';
    roundRect(ctx, cx - s * 0.27, cy - s * 0.26 + (on ? s * 0.06 : 0), s * 0.54, s * (on ? 0.44 : 0.5), s * 0.09);
    ctx.fill();
    ctx.strokeStyle = on ? '#2b8a5e' : '#6b7890';
    ctx.lineWidth = Math.max(1.5, s * 0.04);
    ctx.stroke();
  } else if (t === T.PGATE || opt.pgateOpen) {
    // Plaka kapısı: yeşil çubuklu; açıkken soluk görünür.
    ctx.save();
    ctx.globalAlpha = t === T.PGATE ? 1 : 0.22;
    ctx.fillStyle = '#4cc38a';
    roundRect(ctx, x + s * 0.12, y + s * 0.12, s * 0.76, s * 0.12, s * 0.05);
    ctx.fill();
    for (let k = 0; k < 3; k++) {
      roundRect(ctx, x + s * (0.2 + k * 0.24), y + s * 0.2, s * 0.12, s * 0.62, s * 0.06);
      ctx.fill();
    }
    ctx.restore();
  } else if (t === T.TURN) {
    // Döner tabla: üstünden geçeni saat yönünde 90° çevirir.
    ctx.fillStyle = '#9fd0f2';
    circle(ctx, cx, cy, s * 0.34);
    ctx.fill();
    ctx.strokeStyle = '#2a5d8f';
    ctx.lineWidth = Math.max(1.5, s * 0.07);
    ctx.lineCap = 'round';
    const a0 = time * 1.8;
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.2, a0, a0 + Math.PI * 1.4);
    ctx.stroke();
    const a1 = a0 + Math.PI * 1.4, ex = cx + Math.cos(a1) * s * 0.2, ey = cy + Math.sin(a1) * s * 0.2;
    ctx.fillStyle = '#2a5d8f';
    ctx.beginPath();
    ctx.moveTo(ex + Math.cos(a1 + Math.PI / 2) * s * 0.12, ey + Math.sin(a1 + Math.PI / 2) * s * 0.12);
    ctx.lineTo(ex + Math.cos(a1) * s * 0.09, ey + Math.sin(a1) * s * 0.09);
    ctx.lineTo(ex - Math.cos(a1) * s * 0.09, ey - Math.sin(a1) * s * 0.09);
    ctx.closePath();
    ctx.fill();
  } else if (t === T.FRAGILE) {
    // Kırılgan kaya: açık renkli; ilk çarpmada çatlak belirir.
    ctx.fillStyle = '#b9a58f';
    ellipse(ctx, cx, cy + s * 0.04, s * 0.36, s * 0.3);
    ctx.fill();
    ctx.fillStyle = '#d6c5b0';
    ellipse(ctx, cx - s * 0.06, cy - s * 0.04, s * 0.24, s * 0.18);
    ctx.fill();
    if (opt.cracked) {
      ctx.strokeStyle = '#5b4636';
      ctx.lineWidth = Math.max(1.5, s * 0.045);
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.04, cy - s * 0.24);
      ctx.lineTo(cx + s * 0.04, cy - s * 0.06);
      ctx.lineTo(cx - s * 0.06, cy + s * 0.06);
      ctx.lineTo(cx + s * 0.06, cy + s * 0.26);
      ctx.moveTo(cx + s * 0.04, cy - s * 0.06);
      ctx.lineTo(cx + s * 0.22, cy - s * 0.02);
      ctx.stroke();
    }
  } else if (t === T.ICICLE) {
    // Sarkıt: hücrenin üstünden sarkar; altından geçilince düşüp kaya olur.
    ctx.fillStyle = 'rgba(29,53,87,.12)';
    ellipse(ctx, cx, cy + s * 0.28, s * 0.22, s * 0.06);
    ctx.fill();
    ctx.fillStyle = '#cdeeff';
    ctx.strokeStyle = '#6fb0e0';
    ctx.lineWidth = Math.max(1.5, s * 0.035);
    for (const [ox, len] of [[-0.18, 0.3], [0, 0.42], [0.18, 0.26]]) {
      ctx.beginPath();
      ctx.moveTo(cx + (ox - 0.08) * s, y + s * 0.08);
      ctx.lineTo(cx + (ox + 0.08) * s, y + s * 0.08);
      ctx.lineTo(cx + ox * s, y + s * (0.08 + len));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (t === T.LOCK) {
    // Buz kilidi: anahtar balık alınınca açılır.
    ctx.fillStyle = '#9fd0f2';
    roundRect(ctx, cx - s * 0.34, cy - s * 0.34, s * 0.68, s * 0.68, s * 0.12);
    ctx.fill();
    ctx.strokeStyle = '#2a5d8f';
    ctx.lineWidth = Math.max(1.5, s * 0.045);
    ctx.stroke();
    ctx.fillStyle = '#ffd166';
    circle(ctx, cx, cy - s * 0.04, s * 0.12);
    ctx.fill();
    ctx.fillStyle = '#1d3557';
    circle(ctx, cx, cy - s * 0.05, s * 0.045);
    ctx.fill();
    ctx.fillRect(cx - s * 0.02, cy - s * 0.04, s * 0.04, s * 0.12);
  } else if (t === T.FLAG) {
    // Rüzgâr bayrağı: direk ve rüzgârın estiği yönü gösteren bayrak.
    const d = opt.wind ?? 1;
    ctx.fillStyle = 'rgba(29,53,87,.18)';
    ellipse(ctx, cx, cy + s * 0.34, s * 0.2, s * 0.06);
    ctx.fill();
    ctx.fillStyle = '#5b4636';
    ctx.fillRect(cx - s * 0.03, cy - s * 0.36, s * 0.06, s * 0.7);
    ctx.save();
    ctx.translate(cx, cy - s * 0.1);
    ctx.rotate(((d - 1) * Math.PI) / 2);
    const flap = Math.sin(time * 8) * s * 0.03;
    ctx.fillStyle = '#e5484d';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.14);
    ctx.quadraticCurveTo(s * 0.2, -s * 0.14 + flap, s * 0.36, 0);
    ctx.quadraticCurveTo(s * 0.2, s * 0.14 - flap, 0, s * 0.14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (t === 'ball') {
    drawBall(ctx, cx, cy, s);
  } else if (t === 'raft') {
    water();
    drawRaft(ctx, cx, cy, s, time);
  } else if (t === 'key') {
    drawKey(ctx, cx, cy, s, time);
  } else if (t === 'pipi') {
    drawPofi(ctx, cx, cy + s * 0.42, s * 0.8, { outfit: PIPI_OUTFIT });
  } else if (t === 'seal') {
    drawSeal(ctx, cx, cy + s * 0.38, s * 0.8, 1, time);
  } else if (t === 'order') {
    drawFish(ctx, cx, cy, s * 0.8, time);
    orderBadge(ctx, cx, cy, s, 1);
  } else if (t === 'fish') {
    drawFish(ctx, cx, cy, s * 0.8, time);
  } else if (t === 'crate') {
    drawCrate(ctx, cx, cy, s);
  }
}

// Sıralı balığın numarası (sağ üst köşede).
function orderBadge(ctx, cx, cy, s, k) {
  ctx.fillStyle = '#ffffff';
  circle(ctx, cx + s * 0.24, cy - s * 0.22, s * 0.15);
  ctx.fill();
  ctx.strokeStyle = '#ff8c42';
  ctx.lineWidth = Math.max(1.5, s * 0.03);
  ctx.stroke();
  ctx.fillStyle = '#1d3557';
  ctx.font = `700 ${Math.round(s * 0.2)}px Fredoka, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(k), cx + s * 0.24, cy - s * 0.21);
}

export class BoardView {
  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.L = null;
    this.onMove = null;
    this.onFx = null;
    this.onSettled = null;
    this.active = false;
    this.hintDir = -1;
    this.ghost = null; // ipucu gölgesi
    this.tutorialDir = -1;
    this.parts = [];
    this.outfit = {};
    this.queued = -1;
    this.sel = 0; // seçili penguen: 0 Pofi, 1 Pipi

    let start = null;
    canvas.addEventListener('pointerdown', e => { start = { x: e.clientX, y: e.clientY, used: false }; });
    canvas.addEventListener('pointermove', e => {
      if (!start || start.used) return;
      const dir = swipeDir(e.clientX - start.x, e.clientY - start.y, 28);
      if (dir >= 0) { start.used = true; this.input(dir); }
    });
    canvas.addEventListener('pointerup', e => {
      if (start && !start.used) {
        const dir = swipeDir(e.clientX - start.x, e.clientY - start.y, 14);
        if (dir >= 0) this.input(dir);
        else this.tap(e);
      }
      start = null;
    });
    window.addEventListener('keydown', e => {
      if (!this.active) return;
      const dir = { ArrowUp: 0, KeyW: 0, ArrowRight: 1, KeyD: 1, ArrowDown: 2, KeyS: 2, ArrowLeft: 3, KeyA: 3 }[e.code];
      if (dir !== undefined) { e.preventDefault(); this.input(dir); }
    });
    window.addEventListener('resize', () => this.L && this.resize());
  }

  input(dir) {
    if (this.anim) { this.queued = dir; return; }
    this.onMove?.(dir + (this.S?.q >= 0 ? this.sel * 4 : 0));
  }

  // Dokunma: Pipi'li levelde dokunulan penguen seçilir.
  tap(e) {
    if (!this.L || this.anim) return;
    const r = this.c.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left - this.ox) / this.s), y = Math.floor((e.clientY - r.top - this.oy) / this.s);
    if (x < 0 || y < 0 || x >= this.L.w || y >= this.L.h) return;
    const c = y * this.L.w + x;
    // güçlendirici hedefi seçiliyorsa (kazma, kürek) yalnızca geçerli hücreler kabul edilir
    if (this.target) { if (this.target.cells.has(c)) this.onTarget?.(c); return; }
    if (!(this.S.q >= 0)) return;
    if (c === this.S.p) this.sel = 0;
    else if (c === this.S.q) this.sel = 1;
    else return;
    this.onSelect?.(this.sel);
  }

  setLevel(L, S) {
    this.L = L;
    this.S = S;
    this.S0gates = S.gates;
    this.prev = null;
    this.anim = null;
    this.parts = [];
    this.hintDir = -1;
    this.ghost = null;
    this.queued = -1;
    this.face = 1;
    this.squash = 0;
    this.brace = 0;
    this.cheer = 0;
    this.spray = 0;
    this.leverOn = false;
    this.sel = 0;
    this.resize();
  }

  // Geri alma gibi animasyonsuz durum değişimi.
  setState(S) {
    this.S = S;
    this.anim = null;
    this.clearHint(); // geri alınınca eski ipucu geçersiz
    this.queued = -1;
    this.leverOn = S.gates !== this.S0gates;
  }

  play(result, prevS) {
    this.prev = prevS;
    this.S = result.state;
    const pEnd = result.pPath.length - 1;
    const cEnd = result.crate ? result.crate.at0 + result.crate.path.length - 1 : 0;
    // Foklar Pofi ve kasa durduktan sonra 2 adımlık sürede yürür.
    const sealEnd = result.seals.some(m => m.from !== m.to) ? 2 : 0;
    this.anim = { t: 0, r: result, moveEnd: Math.max(pEnd, cEnd), end: Math.max(pEnd, cEnd) + sealEnd, fired: new Set() };
    this.clearHint(true);
    this.tutorialDir = -1;
    if (result.dir % 4 === 1) this.face = 1;
    if (result.dir % 4 === 3) this.face = -1;
  }

  resize() {
    const p = this.c.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.W = p.width;
    this.H = p.height;
    this.c.width = Math.round(p.width * dpr);
    this.c.height = Math.round(p.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const { w, h } = this.L;
    const pad = 16;
    this.s = Math.floor(Math.min((p.width - pad * 2) / w, (p.height - pad * 2) / h, 84));
    this.ox = Math.round((p.width - this.s * w) / 2);
    this.oy = Math.round((p.height - this.s * h) / 2);
  }

  cellXY(c) {
    return [this.ox + (c % this.L.w) * this.s, this.oy + Math.floor(c / this.L.w) * this.s];
  }

  burst(c, color, n, speed, life = 0.6, up = 0, shape = null) {
    const [x, y] = this.cellXY(c);
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.4 + Math.random() * 0.8);
      this.parts.push({ x: x + this.s / 2, y: y + this.s / 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v - up, life: life * (0.6 + Math.random() * 0.6), col: color, r: this.s * (0.04 + Math.random() * 0.04) * (shape === 'star' ? 1.8 : 1), shape });
    }
  }

  // Kar tozu bulutu: Pofi'nin durduğu yerde, çarptığı yöne doğru (hafif, yukarı süzülür).
  puff(c, dir) {
    const [x, y] = this.cellXY(c), s = this.s;
    const cx = x + s / 2 + [0, 1, 0, -1][dir] * s * 0.45, cy = y + s * 0.75 + [-1, 0, 1, 0][dir] * s * 0.3;
    for (let k = 0; k < 10; k++) {
      const a = Math.random() * Math.PI * 2, v = s * (0.5 + Math.random());
      this.parts.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.5 - s * 0.6, life: 0.45, col: 'rgba(255,255,255,.95)', r: s * (0.05 + Math.random() * 0.05), g: 80 });
    }
  }

  // ---------- ipucu: gölge penguen ----------
  // İpucu, yapılacak hamleyi yarı saydam bir "gölge" Pofi ile önden gösterir; oyuncu hamle yapana kadar
  // tekrar eder. dir: oyuncunun kaydıracağı yön (ters kontrolde çevrilmiş), r: hamlenin simülasyonu.
  showHint(dir, r) {
    this.hintDir = dir;
    this.ghost = { r, t: 0 };
  }

  // Rota göster: çözümün hamleleri art arda hayalet olarak oynar, sonunda kısa bekleyip baştan başlar
  showRoute(seq) {
    this.hintDir = -1;
    this.ghost = { r: seq[0], seq, i: 0, t: 0 };
  }

  // puff: gölge bulunduğu yerde kar tozu olup dağılır (hamle yapıldığında)
  clearHint(puff = false) {
    const g = this.ghost;
    if (puff && g?.pos) {
      for (let k = 0; k < 16; k++) {
        const a = Math.random() * Math.PI * 2, v = this.s * (0.8 + Math.random() * 1.4);
        this.parts.push({ x: g.pos[0], y: g.pos[1], vx: Math.cos(a) * v, vy: Math.sin(a) * v - this.s * 0.6, life: 0.5, col: k % 3 ? 'rgba(255,255,255,.95)' : '#bfe3ff', r: this.s * (0.05 + Math.random() * 0.06), g: 60 });
      }
    }
    this.ghost = null;
    this.hintDir = -1;
  }

  drawGhost(time) {
    const { ctx, s } = this, g = this.ghost, step = STEP * 2.2;
    // rota: her hamleden sonra kısa durak, son hamleden sonra uzun durak; sonra sıradaki hamle
    const stop = (gg, j) => (j === gg.seq.length - 1 ? 1.2 : 0.3);
    if (g.seq) {
      let per = (g.r.pPath.length - 1) * step + stop(g, g.i);
      while (g.t >= per) { g.t -= per; g.i = (g.i + 1) % g.seq.length; g.r = g.seq[g.i]; per = (g.r.pPath.length - 1) * step + stop(g, g.i); }
    }
    const path = g.r.pPath, last = path.length - 1;
    const travel = last * step, period = travel + (g.seq ? stop(g, g.i) : 1.1);
    const k = g.seq ? g.t : g.t % period;
    // yolun izi: soluk noktalar
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (let i = 1; i <= last; i++) {
      const [x, y] = this.cellXY(path[i]);
      if (Math.abs(x - this.cellXY(path[i - 1])[0]) + Math.abs(y - this.cellXY(path[i - 1])[1]) > s * 1.5) continue;
      circle(ctx, x + s / 2, y + s / 2, s * 0.06);
      ctx.fill();
    }
    const u = Math.min(k / step, last);
    const [px, py] = this.lerpPath(path, u);
    const outfit = g.r.who ? PIPI_OUTFIT : this.outfit, size = s * (g.r.who ? 0.78 : 0.88);
    g.pos = [px + s / 2, py + s / 2];
    const first = !g.seq || g.i === 0, final = !g.seq || g.i === g.seq.length - 1;
    const fadeIn = first ? Math.min(1, k / 0.25) : 1, fadeOut = final && k > period - 0.3 ? (period - k) / 0.3 : 1;
    ctx.save();
    ctx.globalAlpha = 0.62 * fadeIn * fadeOut;
    if (k < travel) {
      const i = Math.min(Math.floor(u), last - 1);
      const [x0, y0] = this.cellXY(path[i]), [x1, y1] = this.cellXY(path[i + 1]);
      const dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0);
      const belly = dx > 0 ? 1 : dx < 0 ? 3 : dy > 0 ? 2 : 0;
      ctx.translate(px + s / 2, py + s * 0.9);
      drawPofiBelly(ctx, 0, 0, size, belly, { outfit, t: time });
    } else {
      ctx.translate(px + s / 2, py + s * 0.9);
      drawPofi(ctx, 0, 0, size, { outfit, wave: Math.sin(time * 6) * 0.4 });
    }
    ctx.restore();
    if (g.seq) {
      // hamle sırası rozeti
      const [bx, by] = this.cellXY(path[0]);
      ctx.fillStyle = 'rgba(29,53,87,.78)';
      roundRect(ctx, bx + s * 0.08, by + s * 0.06, s * 0.5, s * 0.28, s * 0.14);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `700 ${Math.round(s * 0.2)}px Fredoka, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${g.i + 1}/${g.seq.length}`, bx + s * 0.33, by + s * 0.2);
    }
  }

  // Bölüm sonu konfeti yağmuru: tahtanın üstünden renkli kâğıtlar dökülür.
  confetti() {
    const cols = ['#ff5a6a', '#ffd166', '#3cc977', '#3d9bff', '#a46bff', '#ff9f43'];
    for (let k = 0; k < 70; k++) {
      this.parts.push({
        x: this.ox + Math.random() * this.s * this.L.w, y: this.oy - 20 - Math.random() * this.s * 2,
        vx: (Math.random() - 0.5) * this.s * 1.5, vy: Math.random() * this.s, life: 1.6 + Math.random() * 1.2,
        col: cols[k % cols.length], r: this.s * (0.06 + Math.random() * 0.04), g: this.s * 3, shape: 'rect', rot: Math.random() * 6, spin: (Math.random() - 0.5) * 12,
      });
    }
  }

  update(dt) {
    this.parts = this.parts.filter(p => (p.life -= dt) > 0);
    for (const p of this.parts) { p.vy += (p.g ?? 600) * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.spin) { p.rot += p.spin * dt; p.vx *= 1 - dt; } }
    if (this.ghost && !this.anim) this.ghost.t += dt;
    this.squash = Math.max(0, this.squash - dt * 5);
    this.brace = Math.max(0, this.brace - dt * 2.2);
    this.cheer = Math.max(0, this.cheer - dt);
    const a = this.anim;
    if (!a) return;
    // Karnı üstünde kayarken arkasından kar tozu savrulur.
    if (this.slide && !this.slide.air) {
      this.spray += dt;
      while (this.spray > 0.03) {
        this.spray -= 0.03;
        const { x, y, dx, dy } = this.slide, s = this.s;
        this.parts.push({ x: x - dx * s * 0.35 + (Math.random() - 0.5) * s * 0.2, y: y - dy * s * 0.35 - s * 0.05, vx: -dx * s * (1 + Math.random()) + (Math.random() - 0.5) * s, vy: -dy * s * (1 + Math.random()) - s * (0.8 + Math.random()), life: 0.35, col: '#ffffff', r: s * (0.025 + Math.random() * 0.03) });
      }
    }
    a.t += dt;
    const u = a.t / STEP;
    a.r.fx.forEach((f, i) => {
      if (a.fired.has(i) || u < f.at) return;
      a.fired.add(i);
      this.fx(f);
      this.onFx?.(f, a.r);
    });
    if (u >= a.end + 1.6) {
      this.anim = null;
      this.onSettled?.();
      if (this.queued >= 0) { const d = this.queued; this.queued = -1; this.input(d); }
    }
  }

  fx(f) {
    const s = this.s;
    if (f.k === 'fish') { this.burst(f.cell, '#ffd166', 10, s * 3, 0.5, s * 2); this.burst(f.cell, '#fff3b0', 6, s * 2, 0.7, s * 2.5, 'star'); }
    else if (f.k === 'crack') this.burst(f.cell, '#bfe3ff', 12, s * 2.5, 0.5, s);
    else if (f.k === 'sink') this.burst(f.cell, '#8fd0ff', 18, s * 3.5, 0.7, s * 3);
    else if (f.k === 'lever') this.leverOn = !this.leverOn;
    else if (f.k === 'land') { this.squash = 1; this.burst(f.cell, '#ffffff', 12, s * 2.2, 0.45, s); }
    else if (f.k === 'warp') { this.burst(f.cell, '#9fd3ff', 14, s * 2.4, 0.5, s); this.burst(f.to, '#9fd3ff', 14, s * 2.4, 0.5, s); }
    else if (f.k === 'melt') this.burst(f.cell, '#5aa0d8', 10, s * 1.6, 0.5, s * 0.5);
    else if (f.k === 'skip') this.burst(f.cell, '#c9d6e3', 6, s * 1.5, 0.35, s * 0.5);
    else if (f.k === 'bump') { this.squash = 1; this.brace = 1; if (this.anim) this.puff(this.anim.r.pPath[Math.min(this.anim.r.pPath.length - 1, Math.round(f.at))], this.anim.r.dir % 4); }
    else if (f.k === 'snow') this.squash = 1;
    else if (f.k === 'rock') this.burst(f.cell, f.broke ? '#b9a58f' : '#d6c5b0', f.broke ? 18 : 8, s * 2.5, 0.5, s);
    else if (f.k === 'icicle') this.burst(f.cell, '#cdeeff', 12, s * 2, 0.5, s * 0.5);
    else if (f.k === 'drift') this.burst(f.cell, '#ffffff', 16, s * 2.4, 0.5, s);
    else if (f.k === 'key') this.burst(f.cell, '#ffd166', 18, s * 3, 0.6, s * 2);
    else if (f.k === 'raft') this.burst(f.cell, '#8fd0ff', 8, s * 1.6, 0.4, s);
  }

  // Bölüm bitince Pofi zıplayıp sevinir.
  celebrate() { this.cheer = 1.6; this.confetti(); }

  // Animasyon sırasında henüz "olmamış" değişiklikler önceki durumdan çizilir.
  visTile(c, u) {
    const a = this.anim;
    if (a) {
      for (const f of a.r.fx) {
        if (['crack', 'sink', 'melt', 'rock', 'icicle', 'drift'].includes(f.k) && f.cell === c && u < f.at) return tileOf(this.L, this.prev, c);
        if (f.k === 'lever' && u < f.at && this.L.t[c] === T.GATE) return tileOf(this.L, this.prev, c);
        if (f.k === 'plate' && u < f.at && this.L.t[c] === T.PGATE) return tileOf(this.L, this.prev, c);
        if (f.k === 'key' && u < f.at && this.L.t[c] === T.LOCK) return tileOf(this.L, this.prev, c);
      }
    }
    return tileOf(this.L, this.S, c);
  }

  draw(time) {
    const { ctx, s, L } = this;
    const a = this.anim;
    const u = a ? a.t / STEP : 0;
    ctx.clearRect(0, 0, this.W, this.H);

    roundRect(ctx, this.ox - 8, this.oy - 8, s * L.w + 16, s * L.h + 16, 18);
    ctx.fillStyle = FRAME;
    ctx.fill();
    roundRect(ctx, this.ox - 2, this.oy - 2, s * L.w + 4, s * L.h + 4, 14);
    ctx.fillStyle = GAP;
    ctx.fill();

    for (let c = 0; c < L.w * L.h; c++) {
      const [x, y] = this.cellXY(c);
      const t = this.visTile(c, u);
      const crackAt = a && a.r.fx.some(f => f.k === 'rock' && f.cell === c && u < f.at);
      paintTile(ctx, t, x, y, s, time, {
        leverOn: this.leverOn, gateOpen: L.t[c] === T.GATE, pgateOpen: L.t[c] === T.PGATE,
        pressed: (a && a.r.fx.some(f => f.k === 'plate' && u < f.at) ? this.prev : this.S).pg,
        cracked: L.t[c] === T.FRAGILE && (crackAt ? this.prev : this.S).dyn[L.dynIdx[c]] === 1,
        wind: (a ? this.prev : this.S).wind,
      });
    }

    // buz parıltısı: her buz karosu birkaç saniyede bir kısa süre ışıldar
    for (let c = 0; c < L.w * L.h; c++) {
      const ph = (time * 0.45 + ((c * 0.618) % 1) * 9) % 9;
      if (ph > 0.5 || this.visTile(c, u) !== T.ICE) continue;
      const [x, y] = this.cellXY(c), k = Math.sin((ph / 0.5) * Math.PI), r = s * 0.12 * k;
      const gx = x + s * (0.25 + ((c * 0.37) % 0.5)), gy = y + s * (0.25 + ((c * 0.71) % 0.4));
      ctx.fillStyle = `rgba(255,255,255,${0.9 * k})`;
      ctx.beginPath();
      ctx.moveTo(gx, gy - r); ctx.lineTo(gx + r * 0.25, gy - r * 0.25); ctx.lineTo(gx + r, gy); ctx.lineTo(gx + r * 0.25, gy + r * 0.25);
      ctx.lineTo(gx, gy + r); ctx.lineTo(gx - r * 0.25, gy + r * 0.25); ctx.lineTo(gx - r, gy); ctx.lineTo(gx - r * 0.25, gy - r * 0.25);
      ctx.closePath();
      ctx.fill();
    }

    // sallar: Pofi'yi taşırken onunla birlikte kayar
    this.S.rafts.forEach((rc, i) => {
      let pos = this.cellXY(rc);
      const ride = a && a.r.rides.find(rd => rd.raft === i);
      if (ride && u < ride.from) pos = this.cellXY(this.prev.rafts[i]);
      else if (ride && u < ride.to) pos = this.lerpPath(a.r.pPath, u);
      drawRaft(ctx, pos[0] + s / 2, pos[1] + s / 2, s, time);
    });

    // anahtar balık
    if (L.keys.length) {
      const pendingKey = a && a.r.fx.some(f => f.k === 'key' && u < f.at);
      if (!this.S.key || pendingKey) for (const c of L.keys) { const [x, y] = this.cellXY(c); drawKey(ctx, x + s / 2, y + s / 2, s, time); }
    }

    // balıklar (sıralı olanlarda numara; sırası gelmeyen soluk)
    const fishNow = a ? this.prev.fish : this.S.fish;
    L.fishCells.forEach((c, i) => {
      const got = (this.S.fish >> i) & 1;
      const pending = a && a.r.fx.some(f => f.k === 'fish' && f.cell === c && u < f.at);
      if (got && !pending) return;
      const [x, y] = this.cellXY(c);
      const ord = L.fishOrder[i];
      const waiting = ord && L.fishOrder.some((o, j) => o && o < ord && !((fishNow >> j) & 1));
      ctx.globalAlpha = waiting ? 0.5 : 1;
      if (this.rare && this.rare.i === i) {
        const cx = x + s / 2, cy = y + s / 2, k = 0.5 + 0.5 * Math.sin(time * 4);
        const g = ctx.createRadialGradient(cx, cy, s * 0.1, cx, cy, s * 0.55);
        g.addColorStop(0, `rgba(255,214,90,${0.7 + 0.25 * k})`);
        g.addColorStop(1, 'rgba(255,230,120,0)');
        ctx.fillStyle = g;
        circle(ctx, cx, cy, s * 0.55);
        ctx.fill();
        const by = cy + Math.sin((time + i) * 3) * s * 0.03;
        if (!objArt(ctx, `fish_${this.rare.f.id}`, cx, by, s * 0.86)) drawFish(ctx, cx, by, s * 0.75, time + i, this.rare.f.color, '#fff8dc');
        // dönen küçük yıldızlar
        ctx.fillStyle = '#fff3b0';
        for (let j = 0; j < 3; j++) {
          const an = time * 1.6 + j * 2.094, rr = s * 0.4;
          circle(ctx, cx + Math.cos(an) * rr, cy + Math.sin(an) * rr * 0.7, s * (0.035 + 0.02 * Math.sin(time * 5 + j)));
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (ord) orderBadge(ctx, x + s / 2, y + s / 2, s, ord);
        return;
      }
      if (!objArt(ctx, 'obj_fish', x + s / 2, y + s / 2 + Math.sin((time + i) * 3) * s * 0.03, s * 0.86)) drawFish(ctx, x + s / 2, y + s / 2, s * 0.75, time + i);
      ctx.globalAlpha = 1;
      if (ord) orderBadge(ctx, x + s / 2, y + s / 2, s, ord);
    });

    // foklar: hamle bitince eski yerinden yenisine yürür
    const sealK = a ? Math.max(0, Math.min(1, (u - a.moveEnd) / 2)) : 1;
    this.S.seals.forEach((sv, i) => {
      const m = a && a.r.seals[i];
      const to = sv >> 2, from = m ? m.from : to;
      const [x0, y0] = this.cellXY(from), [x1, y1] = this.cellXY(to);
      const x = x0 + (x1 - x0) * sealK, y = y0 + (y1 - y0) * sealK;
      const face = (sv & 3) === 3 ? -1 : 1;
      const hop = Math.abs(Math.sin(sealK * Math.PI)) * s * 0.08;
      if (!objArt(ctx, 'obj_seal', x + s / 2, y + s / 2 - hop, s, { flip: face < 0 })) drawSeal(ctx, x + s / 2, y + s * 0.88 - hop, s * 0.85, face, time + i);
      if (this.S.frz > 0) {
        // düdükle uyuyan fok: üstünde "z"ler ve kalan hamle
        ctx.fillStyle = '#5a6f8c';
        ctx.font = `700 ${Math.round(s * 0.26)}px Fredoka, sans-serif`;
        ctx.textAlign = 'center';
        const zz = (time * 1.2 + i * 0.3) % 1;
        ctx.globalAlpha = 1 - zz;
        ctx.fillText('z', x + s * 0.72, y + s * (0.2 - zz * 0.15));
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#5a6f8c';
        ctx.lineWidth = 2;
        circle(ctx, x + s * 0.2, y + s * 0.18, s * 0.13);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#1d3557';
        ctx.font = `700 ${Math.round(s * 0.18)}px Fredoka, sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.fillText(this.S.frz, x + s * 0.2, y + s * 0.19);
      }
    });

    // kasalar
    const mc = a && a.r.crate;
    const movingEnd = mc && !mc.sunk && mc.kind === 'crate' ? mc.path[mc.path.length - 1] : -1;
    for (const c of this.S.crates) {
      if (c === movingEnd && u < mc.at0 + mc.path.length - 1) continue;
      const [x, y] = this.cellXY(c);
      drawCrate(ctx, x + s / 2, y + s / 2, s);
    }
    for (const c of this.S.balls) { const [x, y] = this.cellXY(c); drawBall(ctx, x + s / 2, y + s / 2, s); }
    if (mc) {
      const k = u - mc.at0;
      const last = mc.path.length - 1;
      if (k < last || (!mc.sunk && !mc.drift && k < last + 0.01)) {
        const [x, y] = this.lerpPath(mc.path, Math.max(0, Math.min(k, last)));
        (mc.kind === 'ball' ? drawBall : drawCrate)(ctx, x + s / 2, y + s / 2, s);
      }
    }

    // Pipi: hareket etmeyen penguen yerinde durur; hamle Pipi'ninse Pofi durur.
    const who = a ? a.r.who : 0;
    if (this.S.q >= 0) {
      const still = a && who ? this.S.p : this.S.q, isPipi = !(a && who);
      const [x, y] = this.cellXY(still);
      if (!a) {
        // seçili penguenin altında halka
        const [sx, sy] = this.cellXY(this.sel ? this.S.q : this.S.p);
        ctx.strokeStyle = 'rgba(255,204,51,.95)';
        ctx.lineWidth = Math.max(2, s * 0.06);
        ellipse(ctx, sx + s / 2, sy + s * 0.84, s * 0.34, s * 0.12);
        ctx.stroke();
      }
      drawPofi(ctx, x + s / 2, y + s * 0.9, s * (isPipi ? 0.78 : 0.88), {
        outfit: isPipi ? PIPI_OUTFIT : this.outfit, squash: Math.sin(time * 2.6 + 1) * 0.03, blink: (time % 3.1) < 0.12,
      });
    }

    // Pofi (rampadan uçarken yay çizerek yükselir, yerde gölgesi kalır)
    let px, py, lean = 0, lift = 0, warpScale = 1, belly = -1, spin = 0;
    this.slide = null;
    if (a) {
      const path = a.r.pPath, last = path.length - 1;
      [px, py] = this.lerpPath(path, Math.min(u, last));
      if (u < last) lean = a.r.dir % 4 === 1 ? 0.22 : a.r.dir % 4 === 3 ? -0.22 : 0;
      for (const j of a.r.jumps) {
        if (u > j.from && u < j.to) lift = Math.sin(((u - j.from) / (j.to - j.from)) * Math.PI);
      }
      // Buz deliği: girişte küçülerek kaybolur, çıkışta büyüyerek belirir.
      for (const w of a.r.warps) {
        if (u > w - 1 && u < w) { const k = u - (w - 1); warpScale = k < 0.5 ? 1 - k * 2 : (k - 0.5) * 2; spin = k * Math.PI * 2; }
      }
      // Hareket ederken göbek üstü kayış; yön o anki parçadan okunur.
      if (u < last - 0.05) {
        const i = Math.min(Math.floor(u), last - 1);
        const [x0, y0] = this.cellXY(path[i]), [x1, y1] = this.cellXY(path[i + 1]);
        const adj = Math.abs(x1 - x0) + Math.abs(y1 - y0) < s * 1.5;
        const dx = adj ? Math.sign(x1 - x0) : [0, 1, 0, -1][a.r.dir % 4], dy = adj ? Math.sign(y1 - y0) : [-1, 0, 1, 0][a.r.dir % 4];
        belly = dx > 0 ? 1 : dx < 0 ? 3 : dy > 0 ? 2 : 0;
        if (dx) this.face = dx;
        this.slide = { x: px + s / 2, y: py + s * 0.9, dx, dy, air: lift > 0.05 };
      }
    } else {
      [px, py] = this.cellXY(this.S.p);
    }
    if (lift > 0) {
      ctx.fillStyle = `rgba(29,53,87,${0.22 - lift * 0.1})`;
      ellipse(ctx, px + s / 2, py + s * 0.85, s * 0.3 * (1 - lift * 0.35), s * 0.08 * (1 - lift * 0.35));
      ctx.fill();
    }
    const blink = (time % 3.4) < 0.12;
    const moverPipi = a && who === 1;
    const moverOutfit = moverPipi ? PIPI_OUTFIT : this.outfit;
    const size = s * (moverPipi ? 0.78 : 0.88) * (1 + lift * 0.22) * warpScale;
    const cx = px + s / 2;
    let cy = py + s * 0.9 - lift * s * 0.95;
    if (warpScale > 0.02 && belly >= 0) {
      // Rampadan uçarken süpermen pozu: aynı göbek pozu, havada hafif yukarı bakar.
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(spin + (belly === 1 ? -lift * 0.25 : belly === 3 ? lift * 0.25 : 0));
      drawPofiBelly(ctx, 0, 0, size, belly, { outfit: moverOutfit, t: time, face: this.face });
      ctx.restore();
    } else if (warpScale > 0.02) {
      // Sevinç zıplaması, çarpınca sallanma, boşta nefes alma.
      const ch = this.cheer > 0 ? Math.abs(Math.sin((1.6 - this.cheer) * Math.PI * 2.5)) * Math.min(1, this.cheer * 2) : 0;
      cy -= ch * s * 0.35;
      // durunca gidiş yönünün tersine kısa bir yaslanma
      const dirX = a ? [0, 1, 0, -1][a.r.dir % 4] : 0;
      const wobble = -dirX * 0.18 * this.brace;
      const breathe = !a && !this.cheer ? Math.sin(time * 2.6) * 0.03 : 0;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(spin);
      drawPofi(ctx, 0, 0, size, {
        face: a ? this.face : 0, recover: this.brace > 0.15, lean: lean + wobble, squash: Math.max(this.squash, breathe), blink: blink && !this.cheer, happy: this.cheer > 0, outfit: moverOutfit, wave: this.cheer > 0 ? 1 : lift * 0.8,
      });
      ctx.restore();
    }

    for (const p of this.parts) {
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.fillStyle = p.col;
      if (p.shape === 'rect') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.rot * 1.7)); // dönerken ince görünür
        ctx.fillRect(-p.r, -p.r * 0.6, p.r * 2, p.r * 1.2);
        ctx.restore();
      } else if (p.shape === 'star') {
        ctx.beginPath();
        for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4 + p.life * 3, rr = k % 2 ? p.r * 0.35 : p.r; ctx.lineTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr); }
        ctx.fill();
      } else {
        circle(ctx, p.x, p.y, p.r);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Karanlık tahta (etkinlik kuralı): yalnızca penguenlerin çevresi aydınlık; kalan balıklar hafifçe parlar.
    if (this.dark) {
      const R = s * 2.3, lights = [[px + s / 2, py + s / 2]];
      if (this.S.q >= 0) { const [qx, qy] = this.cellXY(a && who ? this.S.p : this.S.q); lights.push([qx + s / 2, qy + s / 2]); }
      ctx.save();
      roundRect(ctx, this.ox - 2, this.oy - 2, s * L.w + 4, s * L.h + 4, 14);
      ctx.clip();
      ctx.beginPath();
      ctx.rect(this.ox - 8, this.oy - 8, s * L.w + 16, s * L.h + 16);
      for (const [lx, ly] of lights) { ctx.moveTo(lx + R, ly); ctx.arc(lx, ly, R, 0, Math.PI * 2, true); }
      ctx.fillStyle = 'rgba(8,18,40,.9)';
      ctx.fill('evenodd');
      for (const [lx, ly] of lights) {
        const g = ctx.createRadialGradient(lx, ly, R * 0.55, lx, ly, R);
        g.addColorStop(0, 'rgba(8,18,40,0)');
        g.addColorStop(1, 'rgba(8,18,40,.9)');
        ctx.fillStyle = g;
        circle(ctx, lx, ly, R);
        ctx.fill();
      }
      L.fishCells.forEach((c, i) => {
        if ((this.S.fish >> i) & 1) return;
        const [fx, fy] = this.cellXY(c);
        ctx.fillStyle = `rgba(255,209,102,${0.45 + 0.25 * Math.sin(time * 4 + i)})`;
        circle(ctx, fx + s / 2, fy + s / 2, s * 0.09);
        ctx.fill();
      });
      ctx.restore();
    }

    // güçlendirici hedefleri: geçerli hücreler nabız gibi parlar
    if (this.target) {
      const k = 0.5 + 0.5 * Math.sin(time * 6);
      for (const c of this.target.cells) {
        const [x, y] = this.cellXY(c);
        ctx.fillStyle = `rgba(255,209,102,${0.18 + 0.2 * k})`;
        roundRect(ctx, x + 2, y + 2, s - 4, s - 4, s * 0.16);
        ctx.fill();
        ctx.strokeStyle = '#ffb703';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    }
    if (!a && this.ghost) this.drawGhost(time);
    if (!a && this.ghost && this.hintDir >= 0) this.arrow(this.hintDir, time, '#ffcc33');
    if (!a && this.tutorialDir >= 0) this.hand(this.tutorialDir, time);
  }

  lerpPath(path, f) {
    const i = Math.floor(f), k = f - i;
    const [x0, y0] = this.cellXY(path[i]);
    if (i >= path.length - 1) return [x0, y0];
    const [x1, y1] = this.cellXY(path[i + 1]);
    // Komşu olmayan iki hücre = buz deliğinden geçiş: süzülmez, yarı yolda ışınlanır.
    if (Math.abs(x1 - x0) + Math.abs(y1 - y0) > this.s * 1.5) return k < 0.5 ? [x0, y0] : [x1, y1];
    return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k];
  }

  arrow(dir, time, col) {
    const { ctx, s } = this;
    const [x, y] = this.cellXY(dir >= 4 ? this.S.q : this.S.p);
    dir %= 4;
    const cx = x + s / 2, cy = y + s / 2;
    const off = s * (0.7 + 0.15 * Math.sin(time * 8));
    ctx.save();
    ctx.translate(cx + [0, 1, 0, -1][dir] * off, cy + [-1, 0, 1, 0][dir] * off);
    ctx.rotate((dir * Math.PI) / 2);
    ctx.fillStyle = col;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.3);
    ctx.lineTo(s * 0.26, s * 0.05);
    ctx.lineTo(s * 0.1, s * 0.05);
    ctx.lineTo(s * 0.1, s * 0.28);
    ctx.lineTo(-s * 0.1, s * 0.28);
    ctx.lineTo(-s * 0.1, s * 0.05);
    ctx.lineTo(-s * 0.26, s * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Eğitim: kaydırma hareketi yapan el.
  hand(dir, time) {
    const { ctx, s } = this;
    const [x, y] = this.cellXY(dir >= 4 ? this.S.q : this.S.p);
    dir %= 4;
    const p = (time * 0.8) % 1;
    const k = p < 0.7 ? p / 0.7 : 1;
    const dist = s * 1.6 * (k * k * (3 - 2 * k));
    const hx = x + s / 2 + [0, 1, 0, -1][dir] * dist + s * 0.25;
    const hy = y + s / 2 + [-1, 0, 1, 0][dir] * dist + s * 0.35;
    ctx.save();
    ctx.globalAlpha = p < 0.85 ? 1 : (1 - p) / 0.15;
    ctx.translate(hx, hy);
    ctx.rotate(-0.4);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1d3557';
    ctx.lineWidth = 2.5;
    roundRect(ctx, -s * 0.08, -s * 0.3, s * 0.16, s * 0.42, s * 0.08);
    ctx.fill();
    ctx.stroke();
    roundRect(ctx, -s * 0.15, 0, s * 0.3, s * 0.28, s * 0.1);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function swipeDir(dx, dy, min) {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < min) return -1;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
}
