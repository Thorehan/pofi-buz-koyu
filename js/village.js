// Meta: Pofi'nin köyü. Yapılar kar tanesiyle kurulur, her birinin 3 stili var.
import { VILLAGE, ECON } from './config.js';
import { roundRect, circle, ellipse, drawPofi } from './draw.js';

// Sahnede konumlar (genişlik/yükseklik oranı)
const AT = {
  igloo: [0.5, 0.56], pier: [0.15, 0.8], snowman: [0.82, 0.62], cocoa: [0.32, 0.66],
  lights: [0.5, 0.34], tree: [0.12, 0.52], rink: [0.68, 0.84], sled: [0.86, 0.4],
};

export function cocoaRatePerHour(village) {
  return village.cocoa !== undefined ? ECON.cocoaPerBuildingPerHour * Object.keys(village).length : 0;
}

export class VillageView {
  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.parts = [];
    this.walk = { x: 0.5, tx: 0.6, face: 1, wait: 0 };
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const p = this.c.parentElement.getBoundingClientRect();
    if (!p.width) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.W = p.width;
    this.H = p.height;
    this.c.width = Math.round(p.width * dpr);
    this.c.height = Math.round(p.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  sparkle(id) {
    const [fx, fy] = AT[id];
    for (let k = 0; k < 30; k++) {
      const a = Math.random() * Math.PI * 2, v = 40 + Math.random() * 140;
      this.parts.push({ x: fx * this.W, y: fy * this.H, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0.8 + Math.random() * 0.6 });
    }
  }

  draw(time, dt, village, outfit) {
    if (!this.W) this.resize();
    const { ctx, W, H } = this;
    const u = Math.min(W, H);
    const built = Object.keys(village).length;
    const prog = built / VILLAGE.buildings.length;

    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.45);
    sky.addColorStop(0, '#9fc9f2');
    sky.addColorStop(1, '#fde3ec');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff6d6';
    circle(ctx, W * 0.84, H * 0.1, u * 0.06);
    ctx.fill();

    // dağlar
    ctx.fillStyle = '#c9dcef';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.4);
    ctx.lineTo(W * 0.18, H * 0.16);
    ctx.lineTo(W * 0.36, H * 0.36);
    ctx.lineTo(W * 0.58, H * 0.12);
    ctx.lineTo(W * 0.8, H * 0.34);
    ctx.lineTo(W, H * 0.2);
    ctx.lineTo(W, H * 0.45);
    ctx.lineTo(0, H * 0.45);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    for (const [x, y] of [[0.18, 0.16], [0.58, 0.12]]) {
      ctx.beginPath();
      ctx.moveTo(W * x, H * y);
      ctx.lineTo(W * (x - 0.05), H * (y + 0.07));
      ctx.lineTo(W * (x + 0.05), H * (y + 0.07));
      ctx.fill();
    }

    // zemin ve deniz
    ctx.fillStyle = '#f4faff';
    ctx.fillRect(0, H * 0.38, W, H * 0.62);
    ctx.fillStyle = '#5aa0d8';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.72);
    ctx.quadraticCurveTo(W * 0.2, H * 0.7, W * 0.3, H);
    ctx.lineTo(0, H);
    ctx.fill();

    // Köy ilerledikçe kar parıltısı artar.
    ctx.fillStyle = `rgba(190,225,255,${0.25 + 0.5 * prog})`;
    for (let k = 0; k < 18; k++) {
      const x = ((k * 0.618) % 1) * W, y = H * (0.45 + ((k * 0.37) % 1) * 0.5);
      circle(ctx, x, y, u * 0.006);
      ctx.fill();
    }

    const order = Object.entries(AT).sort((a, b) => a[1][1] - b[1][1]);
    for (const [id, [fx, fy]] of order) {
      const x = fx * W, y = fy * H;
      if (village[id] === undefined) continue;
      this[id](x, y, u, time, village[id]);
    }

    const next = VILLAGE.buildings.find(b => village[b.id] === undefined);
    if (next) {
      const [fx, fy] = AT[next.id];
      const x = fx * W, y = fy * H, p = 0.5 + 0.5 * Math.sin(time * 4);
      ctx.fillStyle = `rgba(255,255,255,${0.6 + 0.3 * p})`;
      circle(ctx, x, y, u * (0.05 + 0.01 * p));
      ctx.fill();
      ctx.fillStyle = '#ff8a3d';
      ctx.font = `700 ${Math.round(u * 0.07)}px Fredoka, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', x, y + 1);
    }

    // Pofi köyde dolaşır.
    const wk = this.walk;
    if (wk.wait > 0) wk.wait -= dt;
    else {
      const d = wk.tx - wk.x;
      if (Math.abs(d) < 0.01) { wk.wait = 1 + Math.random() * 2; wk.tx = 0.3 + Math.random() * 0.5; }
      else { wk.x += Math.sign(d) * dt * 0.06; wk.face = Math.sign(d); }
    }
    const bob = wk.wait > 0 ? 0 : Math.abs(Math.sin(time * 8)) * u * 0.01;
    drawPofi(ctx, wk.x * W, H * 0.75 - bob, u * 0.15, {
      face: wk.wait > 0 ? 0 : wk.face, lean: wk.wait > 0 ? 0 : Math.sin(time * 8) * 0.08,
      outfit, blink: (time % 3.4) < 0.12, wave: wk.wait > 0 ? Math.sin(time * 6) * 0.4 : 0,
    });

    this.parts = this.parts.filter(p => (p.life -= dt) > 0);
    ctx.fillStyle = '#fff6a8';
    for (const p of this.parts) {
      p.vy += 120 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      ctx.globalAlpha = Math.min(1, p.life);
      circle(ctx, p.x, p.y, 3);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ---------- yapılar (v: seçili stil) ----------
  igloo(x, y, u, t, v) {
    const { ctx } = this;
    const body = ['#ffffff', '#cfe9ff', '#ffd9e8'][v], line = ['#c9dcef', '#8fbfe6', '#f2a7c3'][v];
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(x, y, u * 0.16, u * 0.13, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = line;
    ctx.lineWidth = 1.5;
    for (let k = 1; k <= 3; k++) {
      ctx.beginPath();
      ctx.ellipse(x, y, u * 0.16, u * 0.13 * (1 - k * 0.25), 0, Math.PI, 0);
      ctx.stroke();
    }
    ctx.fillStyle = '#5d7a99';
    ctx.beginPath();
    ctx.ellipse(x, y, u * 0.05, u * 0.06, 0, Math.PI, 0);
    ctx.fill();
  }

  pier(x, y, u, t, v) {
    const { ctx } = this;
    const wood = ['#b07a4c', '#a8463c', '#8c8f99'][v];
    ctx.fillStyle = wood;
    for (let k = 0; k < 5; k++) ctx.fillRect(x - u * 0.12 + k * u * 0.05, y - u * 0.02, u * 0.04, u * 0.04);
    ctx.fillRect(x - u * 0.12, y + u * 0.02, u * 0.02, u * 0.06);
    ctx.fillRect(x + u * 0.1, y + u * 0.02, u * 0.02, u * 0.06);
    ctx.strokeStyle = '#5b4636';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + u * 0.08, y - u * 0.02);
    ctx.lineTo(x + u * 0.16, y - u * 0.12);
    ctx.lineTo(x + u * 0.17, y + u * 0.02 + Math.sin(t * 2) * u * 0.01);
    ctx.stroke();
  }

  snowman(x, y, u, t, v) {
    const { ctx } = this;
    ctx.fillStyle = '#ffffff';
    circle(ctx, x, y, u * 0.06);
    ctx.fill();
    circle(ctx, x, y - u * 0.085, u * 0.042);
    ctx.fill();
    ctx.fillStyle = '#1b1b24';
    circle(ctx, x - u * 0.013, y - u * 0.095, u * 0.006);
    ctx.fill();
    circle(ctx, x + u * 0.013, y - u * 0.095, u * 0.006);
    ctx.fill();
    ctx.fillStyle = '#ff8c42';
    ctx.beginPath();
    ctx.moveTo(x, y - u * 0.085);
    ctx.lineTo(x + u * 0.04, y - u * 0.08);
    ctx.lineTo(x, y - u * 0.075);
    ctx.fill();
    if (v === 1) {
      ctx.fillStyle = '#e5484d';
      ctx.fillRect(x - u * 0.04, y - u * 0.055, u * 0.08, u * 0.014);
      ctx.fillRect(x + u * 0.015, y - u * 0.05, u * 0.014, u * 0.04);
    }
    if (v === 2) {
      ctx.fillStyle = '#1b1b24';
      ctx.fillRect(x - u * 0.04, y - u * 0.125, u * 0.08, u * 0.01);
      ctx.fillRect(x - u * 0.026, y - u * 0.17, u * 0.052, u * 0.045);
    }
  }

  cocoa(x, y, u, t, v) {
    const { ctx } = this;
    const awn = ['#e5484d', '#3fae5a', '#8f5bd6'][v];
    ctx.fillStyle = '#b07a4c';
    ctx.fillRect(x - u * 0.08, y - u * 0.04, u * 0.16, u * 0.07);
    ctx.fillStyle = awn;
    ctx.fillRect(x - u * 0.09, y - u * 0.12, u * 0.18, u * 0.04);
    ctx.fillStyle = '#ffffff';
    for (let k = 0; k < 3; k++) ctx.fillRect(x - u * 0.09 + k * u * 0.06 + u * 0.03, y - u * 0.12, u * 0.03, u * 0.04);
    ctx.fillStyle = '#7a5235';
    ctx.fillRect(x - u * 0.07, y - u * 0.08, u * 0.01, u * 0.05);
    ctx.fillRect(x + u * 0.06, y - u * 0.08, u * 0.01, u * 0.05);
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.lineWidth = 1.5;
    for (let k = 0; k < 2; k++) {
      const yy = y - u * 0.06 - ((t * 0.5 + k * 0.5) % 1) * u * 0.06;
      ctx.beginPath();
      ctx.moveTo(x - u * 0.01 + k * u * 0.03, yy);
      ctx.quadraticCurveTo(x + k * u * 0.03, yy - u * 0.015, x - u * 0.01 + k * u * 0.03, yy - u * 0.03);
      ctx.stroke();
    }
  }

  lights(x, y, u, t, v) {
    const { ctx, W } = this;
    ctx.strokeStyle = '#5b4636';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W * 0.2, y - u * 0.03);
    ctx.quadraticCurveTo(x, y + u * 0.06, W * 0.8, y - u * 0.03);
    ctx.stroke();
    const pal = [['#ffd166'], ['#ff5a6a', '#ffd166', '#3cc977', '#3d9bff', '#a46bff'], ['#9fe1ff', '#cfefff']][v];
    for (let k = 0; k <= 10; k++) {
      const f = k / 10, xx = W * 0.2 + f * W * 0.6;
      const yy = y - u * 0.03 + 4 * f * (1 - f) * u * 0.045 + u * 0.012;
      const glow = 0.6 + 0.4 * Math.sin(t * 3 + k);
      ctx.fillStyle = pal[k % pal.length];
      ctx.globalAlpha = glow;
      circle(ctx, xx, yy, u * 0.012);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  tree(x, y, u, t, v) {
    const { ctx } = this;
    ctx.fillStyle = '#7a5235';
    ctx.fillRect(x - u * 0.012, y, u * 0.024, u * 0.05);
    for (let k = 0; k < 3; k++) {
      ctx.fillStyle = v === 2 ? (k % 2 ? '#2f7a4a' : '#ffffff') : '#2f7a4a';
      ctx.beginPath();
      ctx.moveTo(x, y - u * (0.2 - k * 0.05));
      ctx.lineTo(x - u * (0.06 + k * 0.025), y - u * (0.06 - k * 0.04));
      ctx.lineTo(x + u * (0.06 + k * 0.025), y - u * (0.06 - k * 0.04));
      ctx.fill();
    }
    if (v === 1) {
      const cols = ['#e5484d', '#ffd166', '#3d9bff'];
      [[-0.03, -0.08], [0.03, -0.04], [-0.05, 0], [0.05, -0.0], [0, -0.13]].forEach(([dx, dy], k) => {
        ctx.fillStyle = cols[k % 3];
        circle(ctx, x + dx * u, y + dy * u, u * 0.01 * (1 + 0.2 * Math.sin(t * 4 + k)));
        ctx.fill();
      });
      ctx.fillStyle = '#ffd166';
      circle(ctx, x, y - u * 0.2, u * 0.015);
      ctx.fill();
    }
  }

  rink(x, y, u, t, v) {
    const { ctx } = this;
    ctx.fillStyle = ['#cfefff', '#ffffff', '#3b4f7a'][v];
    ellipse(ctx, x, y, u * 0.14, u * 0.05);
    ctx.fill();
    if (v === 1) {
      ['#ff5a6a', '#ffd166', '#3cc977', '#3d9bff'].forEach((c, k) => {
        ctx.strokeStyle = c;
        ctx.lineWidth = 2;
        ellipse(ctx, x, y, u * (0.13 - k * 0.025), u * (0.045 - k * 0.009));
        ctx.stroke();
      });
    } else {
      ctx.strokeStyle = v === 2 ? '#9fe1ff' : '#8fbfe6';
      ctx.lineWidth = 2;
      ellipse(ctx, x, y, u * 0.14, u * 0.05);
      ctx.stroke();
      if (v === 2) {
        ctx.fillStyle = '#ffffff';
        for (let k = 0; k < 6; k++) {
          circle(ctx, x + Math.cos(k + t) * u * 0.1, y + Math.sin(k * 2) * u * 0.03, 1.5);
          ctx.fill();
        }
      }
    }
  }

  sled(x, y, u, t, v) {
    const { ctx } = this;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x - u * 0.16, y + u * 0.1);
    ctx.quadraticCurveTo(x, y - u * 0.16, x + u * 0.12, y + u * 0.1);
    ctx.fill();
    ctx.strokeStyle = '#d6e6f5';
    ctx.lineWidth = 2;
    ctx.stroke();
    const col = ['#e5484d', '#3d7bd9', '#f5c518'][v];
    const k = (Math.sin(t * 0.8) + 1) / 2;
    const sx = x - u * 0.1 + k * u * 0.16, sy = y + u * 0.02 - Math.sin(k * Math.PI) * u * 0.08;
    ctx.fillStyle = col;
    roundRect(ctx, sx - u * 0.03, sy - u * 0.012, u * 0.06, u * 0.02, u * 0.006);
    ctx.fill();
    ctx.strokeStyle = '#5b4636';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx - u * 0.035, sy + u * 0.014);
    ctx.lineTo(sx + u * 0.04, sy + u * 0.014);
    ctx.stroke();
  }
}
