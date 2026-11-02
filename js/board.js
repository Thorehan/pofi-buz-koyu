// Oyun tahtası: çizim, kayma animasyonu, kaydırma/klavye girdisi.
import { T, tileOf } from './engine.js';
import { roundRect, circle, ellipse, drawPofi, drawFish } from './draw.js';

export const STEP = 0.075; // saniye / hücre

const ICE = '#e4f5ff';
const ICE_HI = '#ffffff';
const FRAME = '#2a5d8f';
const GAP = '#a9d3ef';
const WATER = '#3a86c8';

export function drawCrate(ctx, x, y, s, alpha = 1) {
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

// Tek karo (tahtada ve "YENİ" kartlarındaki küçük resimlerde kullanılır).
export function paintTile(ctx, t, x, y, s, time, opt = {}) {
  const g = Math.max(1, s * 0.03);
  const cx = x + s / 2, cy = y + s / 2;
  const base = () => {
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
  if (t === T.BRIDGE) {
    water();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.sin(time * 1.5 + x) * 0.05);
    drawCrate(ctx, 0, 0, s * 0.95);
    ctx.restore();
    return;
  }
  base();
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
  } else if (t === 'fish') {
    drawFish(ctx, cx, cy, s * 0.8, time);
  } else if (t === 'crate') {
    drawCrate(ctx, cx, cy, s);
  }
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
    this.hintT = 0;
    this.tutorialDir = -1;
    this.parts = [];
    this.outfit = {};
    this.queued = -1;

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
    this.onMove?.(dir);
  }

  setLevel(L, S) {
    this.L = L;
    this.S = S;
    this.S0gates = S.gates;
    this.prev = null;
    this.anim = null;
    this.parts = [];
    this.hintDir = -1;
    this.queued = -1;
    this.face = 1;
    this.squash = 0;
    this.leverOn = false;
    this.resize();
  }

  // Geri alma gibi animasyonsuz durum değişimi.
  setState(S) {
    this.S = S;
    this.anim = null;
    this.queued = -1;
    this.leverOn = S.gates !== this.S0gates;
  }

  play(result, prevS) {
    this.prev = prevS;
    this.S = result.state;
    const pEnd = result.pPath.length - 1;
    const cEnd = result.crate ? result.crate.at0 + result.crate.path.length - 1 : 0;
    this.anim = { t: 0, r: result, end: Math.max(pEnd, cEnd), fired: new Set() };
    this.hintDir = -1;
    this.tutorialDir = -1;
    if (result.dir === 1) this.face = 1;
    if (result.dir === 3) this.face = -1;
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

  burst(c, color, n, speed, life = 0.6, up = 0) {
    const [x, y] = this.cellXY(c);
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.4 + Math.random() * 0.8);
      this.parts.push({ x: x + this.s / 2, y: y + this.s / 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v - up, life: life * (0.6 + Math.random() * 0.6), col: color, r: this.s * (0.04 + Math.random() * 0.04) });
    }
  }

  update(dt) {
    this.parts = this.parts.filter(p => (p.life -= dt) > 0);
    for (const p of this.parts) { p.vy += 600 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    this.hintT = Math.max(0, this.hintT - dt);
    this.squash = Math.max(0, this.squash - dt * 5);
    const a = this.anim;
    if (!a) return;
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
    if (f.k === 'fish') this.burst(f.cell, '#ffd166', 14, s * 3, 0.5, s * 2);
    else if (f.k === 'crack') this.burst(f.cell, '#bfe3ff', 12, s * 2.5, 0.5, s);
    else if (f.k === 'sink') this.burst(f.cell, '#8fd0ff', 18, s * 3.5, 0.7, s * 3);
    else if (f.k === 'lever') this.leverOn = !this.leverOn;
    else if (f.k === 'bump' || f.k === 'snow') this.squash = 1;
  }

  // Animasyon sırasında henüz "olmamış" değişiklikler önceki durumdan çizilir.
  visTile(c, u) {
    const a = this.anim;
    if (a) {
      for (const f of a.r.fx) {
        if ((f.k === 'crack' || f.k === 'sink') && f.cell === c && u < f.at) return tileOf(this.L, this.prev, c);
        if (f.k === 'lever' && u < f.at && this.L.t[c] === T.GATE) return tileOf(this.L, this.prev, c);
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
      paintTile(ctx, t, x, y, s, time, { leverOn: this.leverOn, gateOpen: L.t[c] === T.GATE });
    }

    // balıklar
    L.fishCells.forEach((c, i) => {
      const got = (this.S.fish >> i) & 1;
      const pending = a && a.r.fx.some(f => f.k === 'fish' && f.cell === c && u < f.at);
      if (got && !pending) return;
      const [x, y] = this.cellXY(c);
      drawFish(ctx, x + s / 2, y + s / 2, s * 0.75, time + i);
    });

    // kasalar
    const mc = a && a.r.crate;
    const movingEnd = mc && !mc.sunk ? mc.path[mc.path.length - 1] : -1;
    for (const c of this.S.crates) {
      if (c === movingEnd && u < mc.at0 + mc.path.length - 1) continue;
      const [x, y] = this.cellXY(c);
      drawCrate(ctx, x + s / 2, y + s / 2, s);
    }
    if (mc) {
      const k = u - mc.at0;
      const last = mc.path.length - 1;
      if (k < last || (!mc.sunk && k < last + 0.01)) {
        const [x, y] = this.lerpPath(mc.path, Math.max(0, Math.min(k, last)));
        drawCrate(ctx, x + s / 2, y + s / 2, s);
      }
    }

    // Pofi
    let px, py, lean = 0;
    if (a) {
      const path = a.r.pPath, last = path.length - 1;
      [px, py] = this.lerpPath(path, Math.min(u, last));
      if (u < last) lean = a.r.dir === 1 ? 0.22 : a.r.dir === 3 ? -0.22 : 0;
    } else {
      [px, py] = this.cellXY(this.S.p);
    }
    const blink = (time % 3.4) < 0.12;
    drawPofi(ctx, px + s / 2, py + s * 0.9, s * 0.88, { face: this.face, lean, squash: this.squash, blink, outfit: this.outfit });

    for (const p of this.parts) {
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.fillStyle = p.col;
      circle(ctx, p.x, p.y, p.r);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (!a && this.hintT > 0 && this.hintDir >= 0) this.arrow(this.hintDir, time, '#ffcc33');
    if (!a && this.tutorialDir >= 0) this.hand(this.tutorialDir, time);
  }

  lerpPath(path, f) {
    const i = Math.floor(f), k = f - i;
    const [x0, y0] = this.cellXY(path[i]);
    if (i >= path.length - 1) return [x0, y0];
    const [x1, y1] = this.cellXY(path[i + 1]);
    return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k];
  }

  arrow(dir, time, col) {
    const { ctx, s } = this;
    const [x, y] = this.cellXY(this.S.p);
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
    const [x, y] = this.cellXY(this.S.p);
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
