// Meta: Pofi'nin köyü. 12 yapı × 3 seviye × 3 stil + renk paleti, köy seviyesine göre sahne efektleri.
import { roundRect, circle, ellipse, drawPofi } from './draw.js';
import { art, tinted } from './art.js';

// Görseli gelen yapılar: [görselin piksel genişliği, köydeki genişlik (u cinsinden)] seviye başına.
const IGLOO_ART = [[291, 0.25], [365, 0.28], [454, 0.3]];

function igloArt(ctx, u, o) {
  if (o.style !== 0) return false;
  const id = 'bld_igloo_s0_lv' + o.lv;
  const im = typeof o.col === 'string' && o.col.startsWith('#') ? tinted(id, o.col) : art(id);
  if (!im) return false;
  const [px, w] = IGLOO_ART[o.lv - 1], k = (u * w) / px;
  // Taban görselin 496. satırında.
  ctx.drawImage(im, -256 * k, -496 * k, 512 * k, 512 * k);
  return true;
}

// Sahnedeki konumlar (genişlik/yükseklik oranı, yapının taban ortası)
const AT = {
  lights: [0.5, 0.3], observatory: [0.2, 0.46], sled: [0.85, 0.46], tree: [0.08, 0.6],
  igloo: [0.48, 0.59], fort: [0.74, 0.61], snowman: [0.93, 0.7], cocoa: [0.29, 0.69],
  lighthouse: [0.06, 0.8], hut: [0.38, 0.87], pier: [0.17, 0.92], rink: [0.7, 0.88],
};
const SCALE = [0, 0.85, 1, 1.15, 1.2, 1.26]; // seviyeye göre boyut

// hex rengi açar (k>0) veya koyulaştırır (k<0)
export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const ch = s => {
    const c = (n >> s) & 255;
    return Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k));
  };
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

function glow(ctx, x, y, r, col, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col);
  g.addColorStop(1, 'rgba(255,220,140,0)');
  ctx.globalAlpha = a;
  ctx.fillStyle = g;
  circle(ctx, x, y, r);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function flag(ctx, x, y, h, col, t) {
  ctx.strokeStyle = '#5b4636';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - h);
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x + h * 0.45, y - h * 0.85 + Math.sin(t * 4) * h * 0.04);
  ctx.lineTo(x, y - h * 0.7);
  ctx.fill();
}

// Yükseltilebilir yapının üstünde zıplayan yeşil ok.
function upgradeMarker(ctx, x, y, u, t) {
  const b = Math.abs(Math.sin(t * 4)) * u * 0.015;
  const r = u * 0.024;
  ctx.fillStyle = '#ffffff';
  circle(ctx, x, y - b, r + 2);
  ctx.fill();
  ctx.fillStyle = '#3fae5a';
  circle(ctx, x, y - b, r);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x, y - b - r * 0.6);
  ctx.lineTo(x + r * 0.55, y - b + r * 0.05);
  ctx.lineTo(x + r * 0.2, y - b + r * 0.05);
  ctx.lineTo(x + r * 0.2, y - b + r * 0.55);
  ctx.lineTo(x - r * 0.2, y - b + r * 0.55);
  ctx.lineTo(x - r * 0.2, y - b + r * 0.05);
  ctx.lineTo(x - r * 0.55, y - b + r * 0.05);
  ctx.closePath();
  ctx.fill();
}

// Bölge 2 süsleri: Lv4-5 yapının arkasında kuzey ışığı halesi, çevresinde parıltılar; Lv5 tepede altın yıldız.
function auroraHalo(ctx, u, t) {
  const g = ctx.createRadialGradient(0, -u * 0.08, 0, 0, -u * 0.08, u * 0.2);
  g.addColorStop(0, `rgba(80,255,180,${0.28 + 0.08 * Math.sin(t * 1.5)})`);
  g.addColorStop(0.6, 'rgba(170,120,255,.15)');
  g.addColorStop(1, 'rgba(170,120,255,0)');
  ctx.fillStyle = g;
  ellipse(ctx, 0, -u * 0.08, u * 0.2, u * 0.16);
  ctx.fill();
}

function sparkles(ctx, u, t, lv) {
  ctx.fillStyle = '#fffbe0';
  for (let k = 0; k < 6; k++) {
    const a = t * 0.8 + (k / 6) * Math.PI * 2;
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4 + k);
    circle(ctx, Math.cos(a) * u * 0.15, -u * 0.08 + Math.sin(a) * u * 0.06, u * 0.006);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (lv >= 5) {
    const y = -u * 0.25 - Math.sin(t * 2) * u * 0.01;
    glow(ctx, 0, y, u * 0.05, '#fff2b0', 0.6);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? u * 0.009 : u * 0.022, a = -Math.PI / 2 + (k * Math.PI) / 5;
      ctx.lineTo(Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.fill();
  }
}

// Köy Lv10: buzdan penguen heykeli.
function iceSculpture(ctx, x, y, u, t) {
  ctx.fillStyle = 'rgba(200,235,255,.85)';
  ellipse(ctx, x, y, u * 0.03, u * 0.008);
  ctx.fill();
  ctx.fillStyle = 'rgba(170,220,255,.75)';
  ellipse(ctx, x, y - u * 0.04, u * 0.025, u * 0.04);
  ctx.fill();
  circle(ctx, x, y - u * 0.085, u * 0.018);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  circle(ctx, x - u * 0.008, y - u * 0.05 + Math.sin(t * 2) * u * 0.004, u * 0.004);
  ctx.fill();
}

function smoke(ctx, x, y, u, t) {
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  for (let k = 0; k < 3; k++) {
    const f = (t * 0.4 + k / 3) % 1;
    ctx.globalAlpha = 0.7 * (1 - f);
    circle(ctx, x + Math.sin(f * 4 + k) * u * 0.01, y - f * u * 0.1, u * (0.01 + f * 0.015));
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ---------- yapılar: (0,0) taban ortası; o = { lv, style, col, night, t } ----------
const DRAW = {
  igloo(ctx, u, o) {
    const body = o.col || ['#ffffff', '#cfe9ff', '#fff4f8'][o.style];
    const line = shade(body.startsWith('#') ? body : '#ffffff', -0.2);
    if (o.lv >= 3) {
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(-u * 0.12, 0, u * 0.08, u * 0.07, 0, Math.PI, 0);
      ctx.fill();
    }
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 0, u * 0.13, u * 0.11, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = line;
    ctx.lineWidth = 1.4;
    if (o.style === 0) {
      for (let k = 1; k <= 3; k++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, u * 0.13, u * 0.11 * (1 - k * 0.25), 0, Math.PI, 0);
        ctx.stroke();
      }
    } else if (o.style === 1) {
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      for (let k = 0; k < 5; k++) {
        const a = Math.PI + 0.4 + k * 0.5, s = 1 + 0.4 * Math.sin(o.t * 3 + k);
        circle(ctx, Math.cos(a) * u * 0.08, Math.sin(a) * u * 0.06, u * 0.006 * s);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#ffffff';
      for (const [dx, r] of [[-0.06, 0.035], [0, 0.045], [0.06, 0.035]]) {
        circle(ctx, dx * u, -u * 0.095, u * r);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#4a6585';
    ctx.beginPath();
    ctx.ellipse(u * 0.02, 0, u * 0.04, u * 0.05, 0, Math.PI, 0);
    ctx.fill();
    if (o.lv >= 2) {
      ctx.fillStyle = '#ffd98a';
      circle(ctx, -u * 0.06, -u * 0.05, u * 0.017);
      ctx.fill();
      glow(ctx, -u * 0.06, -u * 0.05, u * 0.05, '#ffe7a8', 0.35 + o.night * 0.5);
      ctx.fillStyle = '#5b4636';
      ctx.fillRect(u * 0.075, -u * 0.05, u * 0.006, u * 0.05);
      ctx.fillStyle = '#ffd166';
      circle(ctx, u * 0.078, -u * 0.055, u * 0.01);
      ctx.fill();
    }
    if (o.lv >= 3) flag(ctx, 0, -u * 0.11, u * 0.08, o.col ? shade(body, -0.35) : '#e5484d', o.t);
  },

  pier(ctx, u, o) {
    const wood = o.col || ['#b07a4c', '#a8463c', '#8c8f99'][o.style];
    const n = [0, 4, 6, 8][o.lv];
    ctx.fillStyle = wood;
    for (let k = 0; k < n; k++) ctx.fillRect(-u * 0.04 + k * u * 0.04, -u * 0.015, u * 0.034, u * 0.03);
    ctx.fillStyle = shade(wood.startsWith('#') ? wood : '#b07a4c', -0.3);
    for (let k = 0; k < n; k += 3) ctx.fillRect(-u * 0.035 + k * u * 0.04, u * 0.015, u * 0.012, u * 0.05);
    const end = -u * 0.04 + n * u * 0.04;
    if (o.lv >= 2) {
      ctx.strokeStyle = '#5b4636';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(end - u * 0.03, -u * 0.015);
      ctx.lineTo(end + u * 0.03, -u * 0.09);
      ctx.lineTo(end + u * 0.04, u * 0.03 + Math.sin(o.t * 2) * u * 0.006);
      ctx.stroke();
      ctx.fillStyle = '#e5484d';
      circle(ctx, end + u * 0.04, u * 0.03 + Math.sin(o.t * 2) * u * 0.006, u * 0.007);
      ctx.fill();
    }
    if (o.lv >= 3) {
      const by = u * 0.05 + Math.sin(o.t * 1.6) * u * 0.005;
      ctx.fillStyle = o.col ? shade(wood, -0.2) : '#e5484d';
      ctx.beginPath();
      ctx.moveTo(-u * 0.02, by);
      ctx.lineTo(u * 0.12, by);
      ctx.lineTo(u * 0.1, by + u * 0.025);
      ctx.lineTo(0, by + u * 0.025);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(u * 0.035, by - u * 0.05, u * 0.004, u * 0.05);
      ctx.beginPath();
      ctx.moveTo(u * 0.039, by - u * 0.05);
      ctx.lineTo(u * 0.07, by - u * 0.01);
      ctx.lineTo(u * 0.039, by - u * 0.01);
      ctx.fill();
      ctx.fillStyle = '#5b4636';
      ctx.fillRect(-u * 0.045, -u * 0.07, u * 0.006, u * 0.06);
      glow(ctx, -u * 0.042, -u * 0.075, u * 0.04, '#ffe7a8', 0.4 + o.night * 0.5);
    }
  },

  snowman(ctx, u, o) {
    const acc = o.col || '#e5484d';
    const balls = o.lv >= 2 ? [[0, 0.045], [-0.07, 0.035], [-0.125, 0.026]] : [[0, 0.045], [-0.075, 0.032]];
    ctx.fillStyle = '#ffffff';
    for (const [dy, r] of balls) { circle(ctx, 0, dy * u - r * u * 0.2, r * u); ctx.fill(); }
    const head = balls[balls.length - 1], hy = head[0] * u - head[1] * u * 0.2, hr = head[1] * u;
    ctx.fillStyle = '#1b1b24';
    circle(ctx, -hr * 0.35, hy - hr * 0.2, u * 0.005); ctx.fill();
    circle(ctx, hr * 0.35, hy - hr * 0.2, u * 0.005); ctx.fill();
    ctx.fillStyle = '#ff8c42';
    ctx.beginPath();
    ctx.moveTo(0, hy);
    ctx.lineTo(u * 0.035, hy + u * 0.004);
    ctx.lineTo(0, hy + u * 0.01);
    ctx.fill();
    if (o.lv >= 2) {
      ctx.strokeStyle = '#6e4a2e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-u * 0.03, -u * 0.075); ctx.lineTo(-u * 0.075, -u * 0.105);
      ctx.moveTo(u * 0.03, -u * 0.075); ctx.lineTo(u * 0.075, -u * 0.1 + Math.sin(o.t * 3) * u * 0.008);
      ctx.stroke();
    }
    if (o.style === 1 || o.lv >= 3) {
      ctx.fillStyle = acc;
      ctx.fillRect(-hr * 0.9, hy + hr * 0.75, hr * 1.8, u * 0.01);
      ctx.fillRect(hr * 0.3, hy + hr * 0.75, u * 0.01, u * 0.03);
    }
    if (o.style === 2 || o.lv >= 3) {
      ctx.fillStyle = '#1b1b24';
      ctx.fillRect(-hr * 0.85, hy - hr * 0.9, hr * 1.7, u * 0.007);
      ctx.fillRect(-hr * 0.55, hy - hr * 1.8, hr * 1.1, hr * 0.95);
      ctx.fillStyle = acc;
      ctx.fillRect(-hr * 0.55, hy - hr * 1.05, hr * 1.1, u * 0.006);
    }
    if (o.lv >= 3) {
      ctx.fillStyle = '#3d7bd9';
      ellipse(ctx, u * 0.07, -u * 0.105 + Math.sin(o.t * 3) * u * 0.008, u * 0.012, u * 0.009);
      ctx.fill();
    }
  },

  cocoa(ctx, u, o) {
    const main = o.col || ['#e5484d', '#3fae5a', '#8f5bd6'][o.style];
    if (o.style === 2) {
      ctx.fillStyle = main;
      roundRect(ctx, -u * 0.1, -u * 0.08, u * 0.2, u * 0.07, u * 0.03);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-u * 0.1, -u * 0.05, u * 0.2, u * 0.012);
      ctx.fillStyle = '#9fd3ff';
      roundRect(ctx, -u * 0.07, -u * 0.075, u * 0.05, u * 0.022, u * 0.006);
      ctx.fill();
      ctx.fillStyle = '#1b1b24';
      circle(ctx, -u * 0.06, -u * 0.01, u * 0.014); ctx.fill();
      circle(ctx, u * 0.06, -u * 0.01, u * 0.014); ctx.fill();
    } else if (o.style === 1) {
      ctx.fillStyle = '#b07a4c';
      ctx.fillRect(-u * 0.08, -u * 0.08, u * 0.16, u * 0.08);
      ctx.fillStyle = main;
      ctx.beginPath();
      ctx.moveTo(-u * 0.1, -u * 0.08);
      ctx.lineTo(0, -u * 0.13);
      ctx.lineTo(u * 0.1, -u * 0.08);
      ctx.fill();
      ctx.fillStyle = '#ffd98a';
      ctx.fillRect(-u * 0.05, -u * 0.06, u * 0.1, u * 0.025);
    } else {
      ctx.fillStyle = '#b07a4c';
      ctx.fillRect(-u * 0.08, -u * 0.04, u * 0.16, u * 0.04);
      ctx.fillStyle = main;
      ctx.fillRect(-u * 0.09, -u * 0.11, u * 0.18, u * 0.035);
      ctx.fillStyle = '#ffffff';
      for (let k = 0; k < 3; k++) ctx.fillRect(-u * 0.09 + k * u * 0.06 + u * 0.03, -u * 0.11, u * 0.03, u * 0.035);
      ctx.fillStyle = '#7a5235';
      ctx.fillRect(-u * 0.075, -u * 0.075, u * 0.008, u * 0.035);
      ctx.fillRect(u * 0.067, -u * 0.075, u * 0.008, u * 0.035);
    }
    smoke(ctx, 0, -u * (o.style === 1 ? 0.13 : 0.11), u, o.t);
    if (o.lv >= 2) {
      ctx.fillStyle = '#9a6a42';
      ctx.fillRect(u * 0.11, -u * 0.02, u * 0.07, u * 0.012);
      ctx.fillRect(u * 0.115, -u * 0.008, u * 0.008, u * 0.01);
      ctx.fillRect(u * 0.165, -u * 0.008, u * 0.008, u * 0.01);
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, -u * 0.17, -u * 0.06, u * 0.04, u * 0.035, u * 0.008);
      ctx.fill();
      ctx.fillStyle = '#7a4a2a';
      ctx.fillRect(-u * 0.162, -u * 0.052, u * 0.024, u * 0.02);
    }
    if (o.lv >= 3) {
      for (let k = 0; k < 7; k++) {
        const x = -u * 0.1 + k * u * 0.033, y = -u * (o.style === 1 ? 0.085 : 0.115) + Math.sin(k) * u * 0.004;
        ctx.fillStyle = ['#ffd166', '#ff5a6a', '#3cc977'][k % 3];
        circle(ctx, x, y, u * 0.006);
        ctx.fill();
        if (o.night > 0.3) glow(ctx, x, y, u * 0.02, '#ffe7a8', o.night * 0.5);
      }
    }
  },

  tree(ctx, u, o) {
    ctx.fillStyle = '#7a5235';
    ctx.fillRect(-u * 0.012, -u * 0.04, u * 0.024, u * 0.04);
    for (let k = 0; k < 3; k++) {
      ctx.fillStyle = o.style === 2 && k % 2 ? '#ffffff' : '#2f7a4a';
      ctx.beginPath();
      ctx.moveTo(0, -u * (0.2 - k * 0.05));
      ctx.lineTo(-u * (0.06 + k * 0.025), -u * (0.06 - k * 0.04) - u * 0.04);
      ctx.lineTo(u * (0.06 + k * 0.025), -u * (0.06 - k * 0.04) - u * 0.04);
      ctx.fill();
    }
    if (o.style === 1 || o.lv >= 2) {
      const cols = o.col ? [o.col, shade(o.col, 0.4)] : ['#e5484d', '#ffd166', '#3d9bff'];
      [[-0.03, -0.12], [0.03, -0.085], [-0.05, -0.05], [0.05, -0.05], [0, -0.16], [0.02, -0.13]].forEach(([dx, dy], k) => {
        ctx.fillStyle = cols[k % cols.length];
        circle(ctx, dx * u, dy * u, u * 0.009 * (1 + 0.2 * Math.sin(o.t * 4 + k)));
        ctx.fill();
      });
    }
    if (o.lv >= 3) {
      ctx.fillStyle = '#ffd166';
      circle(ctx, 0, -u * 0.205, u * 0.016);
      ctx.fill();
      glow(ctx, 0, -u * 0.205, u * 0.05, '#fff2b0', 0.4 + o.night * 0.4);
      [[-0.05, '#e5484d'], [0.04, o.col || '#3d7bd9']].forEach(([dx, c]) => {
        ctx.fillStyle = c;
        ctx.fillRect(dx * u, -u * 0.025, u * 0.03, u * 0.025);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(dx * u + u * 0.012, -u * 0.025, u * 0.006, u * 0.025);
      });
    }
  },

  rink(ctx, u, o) {
    ctx.fillStyle = ['#cfefff', '#ffffff', '#3b4f7a'][o.style];
    ellipse(ctx, 0, 0, u * 0.13, u * 0.045);
    ctx.fill();
    if (o.style === 1) {
      ['#ff5a6a', '#ffd166', '#3cc977', '#3d9bff'].forEach((c, k) => {
        ctx.strokeStyle = c;
        ctx.lineWidth = 2;
        ellipse(ctx, 0, 0, u * (0.12 - k * 0.022), u * (0.04 - k * 0.008));
        ctx.stroke();
      });
    } else if (o.style === 2) {
      ctx.fillStyle = '#ffffff';
      for (let k = 0; k < 7; k++) { circle(ctx, Math.cos(k * 2 + o.t) * u * 0.09, Math.sin(k * 3) * u * 0.025, 1.5); ctx.fill(); }
    }
    ctx.strokeStyle = o.col || '#8fbfe6';
    ctx.lineWidth = 2.5;
    ellipse(ctx, 0, 0, u * 0.13, u * 0.045);
    ctx.stroke();
    if (o.lv >= 2) {
      ctx.fillStyle = o.col ? shade(o.col, -0.3) : '#9a6a42';
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        ctx.fillRect(Math.cos(a) * u * 0.135 - 1, Math.sin(a) * u * 0.05 - u * 0.02, 2, u * 0.02);
      }
    }
    if (o.lv >= 3) {
      const a = o.t * 0.9;
      drawPofi(ctx, Math.cos(a) * u * 0.08, Math.sin(a) * u * 0.02 + u * 0.01, u * 0.06, { face: Math.sin(a) > 0 ? -1 : 1, lean: 0.2, outfit: { scarf: 'yellow' } });
      flag(ctx, -u * 0.13, -u * 0.01, u * 0.06, '#ff5a6a', o.t);
      flag(ctx, u * 0.13, -u * 0.01, u * 0.06, '#3d9bff', o.t + 1);
    }
  },

  sled(ctx, u, o) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-u * 0.16, u * 0.02);
    ctx.quadraticCurveTo(0, -u * 0.24, u * 0.13, u * 0.02);
    ctx.fill();
    ctx.strokeStyle = '#d6e6f5';
    ctx.lineWidth = 2;
    ctx.stroke();
    const col = o.col || ['#e5484d', '#3d7bd9', '#f5c518'][o.style];
    const rider = (ph, c) => {
      const k = (Math.sin(o.t * 0.8 + ph) + 1) / 2;
      const sx = -u * 0.1 + k * u * 0.17, sy = -u * 0.02 - Math.sin(k * Math.PI) * u * 0.1;
      ctx.fillStyle = c;
      if (o.style === 1) {
        ctx.fillRect(sx - u * 0.03, sy, u * 0.06, u * 0.006);
        ctx.fillRect(sx - u * 0.028, sy + u * 0.008, u * 0.06, u * 0.006);
      } else {
        roundRect(ctx, sx - u * 0.03, sy - u * 0.008, u * 0.06, u * (o.style === 2 ? 0.012 : 0.018), u * 0.006);
        ctx.fill();
      }
      drawPofi(ctx, sx, sy, u * 0.05, { face: 1 });
    };
    rider(0, col);
    if (o.lv >= 2) { flag(ctx, -u * 0.005, -u * 0.11, u * 0.06, col, o.t); }
    if (o.lv >= 3) {
      rider(2.2, shade(col.startsWith('#') ? col : '#e5484d', 0.3));
      ctx.strokeStyle = '#5b4636';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-u * 0.15, u * 0.02); ctx.lineTo(-u * 0.15, -u * 0.07);
      ctx.moveTo(u * 0.14, -u * 0.16); ctx.lineTo(u * 0.14, -u * 0.04);
      ctx.moveTo(-u * 0.15, -u * 0.07); ctx.lineTo(u * 0.14, -u * 0.16);
      ctx.stroke();
      const f = (o.t * 0.15) % 1;
      ctx.fillStyle = col;
      ctx.fillRect(-u * 0.15 + f * u * 0.29 - u * 0.008, -u * 0.07 - f * u * 0.09, u * 0.016, u * 0.02);
    }
  },

  hut(ctx, u, o) {
    const wall = ['#9a6a42', '#9aa3b2', '#cfe9ff'][o.style], roof = o.col || '#7a3b2e';
    ctx.fillStyle = wall;
    ctx.fillRect(-u * 0.07, -u * 0.07, u * 0.14, u * 0.07);
    ctx.fillStyle = roof;
    ctx.beginPath();
    ctx.moveTo(-u * 0.09, -u * 0.07);
    ctx.lineTo(0, -u * 0.13);
    ctx.lineTo(u * 0.09, -u * 0.07);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-u * 0.09, -u * 0.075, u * 0.18, u * 0.008);
    ctx.fillStyle = '#4a3324';
    ctx.fillRect(-u * 0.015, -u * 0.04, u * 0.03, u * 0.04);
    ctx.fillStyle = '#ffd98a';
    ctx.fillRect(u * 0.03, -u * 0.05, u * 0.022, u * 0.018);
    if (o.night > 0.3) glow(ctx, u * 0.04, -u * 0.04, u * 0.04, '#ffe7a8', o.night * 0.5);
    if (o.lv >= 2) {
      ctx.strokeStyle = '#5b4636';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(u * 0.09, 0); ctx.lineTo(u * 0.09, -u * 0.06);
      ctx.moveTo(u * 0.16, 0); ctx.lineTo(u * 0.16, -u * 0.06);
      ctx.moveTo(u * 0.09, -u * 0.055); ctx.lineTo(u * 0.16, -u * 0.055);
      ctx.stroke();
      ctx.fillStyle = '#ff8c42';
      for (let k = 0; k < 3; k++) {
        ellipse(ctx, u * (0.105 + k * 0.022), -u * 0.04 + Math.sin(o.t * 2 + k) * u * 0.002, u * 0.006, u * 0.012);
        ctx.fill();
      }
    }
    if (o.lv >= 3) {
      ctx.fillStyle = shade('#7d8aa0', 0);
      ctx.fillRect(-u * 0.05, -u * 0.14, u * 0.02, u * 0.04);
      smoke(ctx, -u * 0.04, -u * 0.14, u, o.t);
      ctx.fillStyle = '#8e5a2b';
      roundRect(ctx, -u * 0.12, -u * 0.035, u * 0.03, u * 0.035, u * 0.006);
      ctx.fill();
    }
  },

  lighthouse(ctx, u, o) {
    const h = [0, 0.16, 0.21, 0.26][o.lv] * u;
    ctx.fillStyle = '#7d8aa0';
    ellipse(ctx, 0, 0, u * 0.07, u * 0.025);
    ctx.fill();
    const base = o.style === 1 ? '#b5bcc8' : '#ffffff';
    const band = o.col || (o.style === 2 ? '#3d7bd9' : '#e5484d');
    ctx.fillStyle = base;
    ctx.beginPath();
    ctx.moveTo(-u * 0.035, 0);
    ctx.lineTo(-u * 0.022, -h);
    ctx.lineTo(u * 0.022, -h);
    ctx.lineTo(u * 0.035, 0);
    ctx.fill();
    ctx.fillStyle = band;
    if (o.style === 0) for (let k = 1; k < 4; k += 2) ctx.fillRect(-u * 0.035, -h * (k + 1) / 4, u * 0.07, h / 8);
    else if (o.style === 1) { ctx.strokeStyle = '#8f96a3'; ctx.lineWidth = 1; for (let k = 1; k < 6; k++) { ctx.beginPath(); ctx.moveTo(-u * 0.03, -h * k / 6); ctx.lineTo(u * 0.03, -h * k / 6); ctx.stroke(); } }
    else ctx.fillRect(-u * 0.03, -h * 0.55, u * 0.06, h * 0.12);
    ctx.fillStyle = '#ffe08a';
    ctx.fillRect(-u * 0.018, -h - u * 0.025, u * 0.036, u * 0.025);
    ctx.fillStyle = band;
    ctx.beginPath();
    ctx.moveTo(-u * 0.026, -h - u * 0.025);
    ctx.lineTo(0, -h - u * 0.05);
    ctx.lineTo(u * 0.026, -h - u * 0.025);
    ctx.fill();
    if (o.lv >= 2) glow(ctx, 0, -h - u * 0.012, u * 0.06, '#fff2b0', 0.45 + o.night * 0.4);
    if (o.lv >= 3) {
      const a = o.t * 1.2;
      ctx.save();
      ctx.globalAlpha = 0.18 + o.night * 0.25;
      ctx.fillStyle = '#fff6c2';
      ctx.translate(0, -h - u * 0.012);
      ctx.rotate(Math.sin(a) * 0.9);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(u * 0.35, -u * 0.05);
      ctx.lineTo(u * 0.35, u * 0.05);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(u * 0.035, -u * 0.04, u * 0.05, u * 0.04);
      ctx.fillStyle = band;
      ctx.beginPath();
      ctx.moveTo(u * 0.03, -u * 0.04);
      ctx.lineTo(u * 0.06, -u * 0.065);
      ctx.lineTo(u * 0.09, -u * 0.04);
      ctx.fill();
    }
  },

  fort(ctx, u, o) {
    const snow = '#ffffff', edge = '#d6e6f5', fl = o.col || '#3d7bd9';
    const h = [0, 0.07, 0.085, 0.1][o.lv] * u;
    ctx.fillStyle = snow;
    if (o.style === 2) {
      ctx.fillRect(-u * 0.035, -h * 1.8, u * 0.07, h * 1.8);
      for (let k = 0; k < 3; k++) ctx.fillRect(-u * 0.035 + k * u * 0.028, -h * 1.8 - u * 0.015, u * 0.016, u * 0.015);
    } else {
      ctx.fillRect(-u * 0.11, -h, u * 0.22, h);
      for (let k = 0; k < 7; k++) ctx.fillRect(-u * 0.11 + k * u * 0.034, -h - u * 0.015, u * 0.02, u * 0.015);
      if (o.style === 1) {
        for (const side of [-1, 1]) {
          ctx.fillStyle = snow;
          ctx.fillRect(side * u * 0.11 - u * 0.025, -h * 1.5, u * 0.05, h * 1.5);
          ctx.fillStyle = fl;
          ctx.beginPath();
          ctx.moveTo(side * u * 0.11 - u * 0.03, -h * 1.5);
          ctx.lineTo(side * u * 0.11, -h * 1.5 - u * 0.05);
          ctx.lineTo(side * u * 0.11 + u * 0.03, -h * 1.5);
          ctx.fill();
        }
      }
    }
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-u * 0.1, -h * 0.5);
    ctx.lineTo(u * 0.1, -h * 0.5);
    ctx.stroke();
    flag(ctx, 0, o.style === 2 ? -h * 1.8 - u * 0.015 : -h - u * 0.015, u * 0.06, fl, o.t);
    if (o.lv >= 2) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = edge;
      for (const [dx, dy] of [[0.13, 0], [0.15, 0], [0.14, -0.017]]) {
        circle(ctx, dx * u, dy * u - u * 0.009, u * 0.01);
        ctx.fill();
        ctx.stroke();
      }
    }
    if (o.lv >= 3) {
      ctx.fillStyle = '#9fc3e6';
      ctx.beginPath();
      ctx.ellipse(0, 0, u * 0.022, u * 0.035, 0, Math.PI, 0);
      ctx.fill();
      flag(ctx, -u * 0.09, -h - u * 0.015, u * 0.05, shade(fl.startsWith('#') ? fl : '#3d7bd9', 0.3), o.t + 1);
    }
  },

  observatory(ctx, u, o) {
    const col = o.col || '#8f5bd6';
    const s = [0, 0.85, 1, 1.15][o.lv];
    ctx.fillStyle = '#9aa3b2';
    ctx.fillRect(-u * 0.07 * s, -u * 0.04 * s, u * 0.14 * s, u * 0.04 * s);
    if (o.style === 0) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(0, -u * 0.04 * s, u * 0.06 * s, u * 0.055 * s, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#1b2440';
      ctx.fillRect(-u * 0.008, -u * 0.095 * s, u * 0.016, u * 0.04 * s);
    } else if (o.style === 1) {
      ctx.save();
      ctx.translate(0, -u * 0.05 * s);
      ctx.rotate(-0.6 + Math.sin(o.t * 0.4) * 0.15);
      ctx.fillStyle = col;
      roundRect(ctx, -u * 0.015, -u * 0.08 * s, u * 0.03, u * 0.09 * s, u * 0.008);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -u * 0.08 * s, u * 0.04 * s, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -u * 0.04 * s);
      ctx.lineTo(0, -u * 0.07 * s);
      ctx.stroke();
    }
    if (o.lv >= 3) {
      ctx.fillStyle = '#fff6c2';
      for (let k = 0; k < 5; k++) {
        const a = 0.5 + 0.5 * Math.sin(o.t * 3 + k * 1.7);
        ctx.globalAlpha = a;
        circle(ctx, (k - 2) * u * 0.04, -u * (0.15 + (k % 2) * 0.03), u * 0.005);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  },
};

export class VillageView {
  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.parts = [];
    this.walkers = [
      { x: 0.5, tx: 0.6, face: 1, wait: 0, y: 0.79, size: 0.12, speed: 0.06 },
      { x: 0.7, tx: 0.4, face: -1, wait: 1, y: 0.83, size: 0.09, speed: 0.045, outfit: { hat: 'beanieBlue', scarf: 'yellow' } },
    ];
    this.cam = { x: 0, y: 0, z: 1 };
    this.focus = null;
    this.preview = null; // { id, style, color } — satın almadan önce sahnede gösterilir
    this.onSelect = null;
    let down = null;
    canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener('pointerup', e => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10) return;
      const r = canvas.getBoundingClientRect();
      const id = this.hit(e.clientX - r.left, e.clientY - r.top);
      if (id) this.onSelect?.(id);
    });
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
    this.dpr = dpr;
    if (!this.cam.x) this.cam = { x: this.W / 2, y: this.H / 2, z: 1 };
  }

  // Ekran koordinatından en yakın yapıyı bul (kamera dönüşümü hesaba katılır).
  hit(sx, sy) {
    const { cam, W, H } = this;
    const wx = (sx - W / 2) / cam.z + cam.x, wy = (sy - H / 2) / cam.z + cam.y;
    const u = Math.min(W, H);
    let best = null, bd = u * 0.12;
    for (const [id, [fx, fy]] of Object.entries(AT)) {
      if (!this.visible?.has(id)) continue;
      const d = Math.hypot(wx - fx * W, wy - (fy * H - u * 0.05));
      if (d < bd) { bd = d; best = id; }
    }
    return best;
  }

  sparkle(id) {
    const [fx, fy] = AT[id];
    for (let k = 0; k < 36; k++) {
      const a = Math.random() * Math.PI * 2, v = 40 + Math.random() * 150;
      this.parts.push({ x: fx * this.W, y: fy * this.H - 20, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 70, life: 0.8 + Math.random() * 0.7 });
    }
  }

  // village: P.village, vl: köy seviyesi, plots: kurulabilir yapılar, ready: parası yetenler
  // upgradable: kurulu ve bir sonraki seviyesine kar tanesi yeten yapılar
  draw(time, dt, { village, vl, plots, ready, upgradable = [], outfit, colors }) {
    if (!this.W) this.resize();
    const { ctx, W, H } = this;
    const u = Math.min(W, H);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // kamera
    const tgt = this.focus ? { x: AT[this.focus][0] * W, y: AT[this.focus][1] * H - u * 0.08, z: 1.8 } : { x: W / 2, y: H / 2, z: 1 };
    const k = Math.min(1, dt * 6);
    this.cam.x += (tgt.x - this.cam.x) * k;
    this.cam.y += (tgt.y - this.cam.y) * k;
    this.cam.z += (tgt.z - this.cam.z) * k;
    const night = vl >= 6 ? Math.max(0, Math.sin((time / 90) * Math.PI * 2)) : 0;

    // gökyüzü kamera dışında, tam ekran
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.5);
    sky.addColorStop(0, mix('#9fc9f2', '#1b2650', night));
    sky.addColorStop(1, mix('#fde3ec', '#3b3f74', night));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(this.cam.z, this.cam.z);
    ctx.translate(-this.cam.x, -this.cam.y);

    const bg = art('village_bg');
    if (bg) {
      // Panorama: kenarları eklenebilir, yana doğru tekrarlanır. Kar zemini ≈ H * 0.49'dan başlar.
      const ih = H * 1.15, iw = (ih * bg.width) / bg.height, x0 = W / 2 - iw / 2;
      for (let i = -1; i <= 1; i++) ctx.drawImage(bg, x0 + i * iw, -H * 0.15, iw, ih);
      if (night > 0) {
        ctx.fillStyle = `rgba(14,20,52,${night * 0.45})`;
        ctx.fillRect(-W, -H, W * 3, H * 3);
      }
      if (vl >= 11) this.fireworks(ctx, W, H, u, time);
    } else {
    if (vl >= 5) this.aurora(time, W, H, u, vl >= 9 ? Math.max(night, 0.7) : night);
    if (vl >= 11) this.fireworks(ctx, W, H, u, time);
    ctx.fillStyle = night > 0.5 ? '#f3f0d0' : '#fff6d6';
    circle(ctx, W * 0.86, H * 0.1, u * 0.05);
    ctx.fill();

    ctx.fillStyle = mix('#c9dcef', '#5a6896', night);
    ctx.beginPath();
    ctx.moveTo(-W, H * 0.4);
    ctx.lineTo(W * 0.18, H * 0.16);
    ctx.lineTo(W * 0.36, H * 0.36);
    ctx.lineTo(W * 0.58, H * 0.12);
    ctx.lineTo(W * 0.8, H * 0.34);
    ctx.lineTo(W * 2, H * 0.2);
    ctx.lineTo(W * 2, H * 0.45);
    ctx.lineTo(-W, H * 0.45);
    ctx.fill();

    ctx.fillStyle = mix('#f4faff', '#c3cbe6', night);
    ctx.fillRect(-W, H * 0.38, W * 3, H * 1.2);
    ctx.fillStyle = mix('#5aa0d8', '#2c4f86', night);
    ctx.beginPath();
    ctx.moveTo(-W, H * 0.7);
    ctx.lineTo(0, H * 0.72);
    ctx.quadraticCurveTo(W * 0.2, H * 0.7, W * 0.3, H * 1.05);
    ctx.lineTo(-W, H * 1.6);
    ctx.fill();
    }

    if (vl >= 4) {
      ctx.fillStyle = mix('#e4dccb', '#9d9aa8', night);
      for (let i = 0; i < 7; i++) {
        const f = i / 6;
        ellipse(ctx, W * (0.5 + 0.05 * Math.sin(f * 5)), H * (0.62 + f * 0.36), u * 0.03 * (1 + f * 0.3), u * 0.012 * (1 + f * 0.3));
        ctx.fill();
      }
    }
    if (vl >= 7) {
      const sx = W * 0.25, sy = H * 0.76 + Math.sin(time * 2) * 2;
      ctx.fillStyle = '#8f9bb0';
      ellipse(ctx, sx, sy, u * 0.04, u * 0.022);
      ctx.fill();
      circle(ctx, sx - u * 0.035, sy - u * 0.012, u * 0.017);
      ctx.fill();
      ctx.fillStyle = '#1b1b24';
      circle(ctx, sx - u * 0.04, sy - u * 0.016, u * 0.003);
      ctx.fill();
    }

    // yapılar (arkadan öne)
    this.visible = new Set();
    const order = Object.entries(AT).sort((a, b) => a[1][1] - b[1][1]);
    for (const [id, [fx, fy]] of order) {
      const x = fx * W, y = fy * H;
      let st = village[id];
      if (this.preview && this.preview.id === id && st) st = { ...st, style: this.preview.style, color: this.preview.color };
      if (st) {
        this.visible.add(id);
        const col = st.color ? colors.find(c => c.id === st.color)?.hex : null;
        if (this.focus === id) {
          ctx.fillStyle = 'rgba(255,209,102,.35)';
          ellipse(ctx, x, y + u * 0.01, u * 0.15, u * 0.035);
          ctx.fill();
        }
        if (id === 'lights') { this.lights(ctx, x, y, u, W, { lv: Math.min(st.lv, 3), style: st.style, col, night: st.lv >= 4 ? Math.max(night, 0.6) : night, t: time }); continue; }
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(SCALE[st.lv], SCALE[st.lv]);
        if (st.lv >= 4) auroraHalo(ctx, u, time + x);
        // Bölge 2 seviyeleri yapının kendi çizimini Lv3 ayrıntısıyla kullanır, üstüne süs ekler.
        const dopt = { lv: Math.min(st.lv, 3), style: st.style, col, night, t: time };
        if (!(id === 'igloo' && igloArt(ctx, u, dopt))) DRAW[id](ctx, u, dopt);
        if (st.lv >= 4) sparkles(ctx, u, time + x, st.lv);
        ctx.restore();
        if (upgradable.includes(id)) upgradeMarker(ctx, x, y - u * 0.17 * SCALE[st.lv], u, time);
      } else if (plots.includes(id)) {
        this.visible.add(id);
        this.plot(ctx, x, y, u, time, ready.includes(id), this.focus === id);
      }
    }

    // penguenler
    const wk = vl >= 3 ? this.walkers : this.walkers.slice(0, 1);
    for (const w of wk) {
      if (w.wait > 0) w.wait -= dt;
      else {
        const d = w.tx - w.x;
        if (Math.abs(d) < 0.01) { w.wait = 1 + Math.random() * 2.5; w.tx = 0.3 + Math.random() * 0.5; }
        else { w.x += Math.sign(d) * dt * w.speed; w.face = Math.sign(d); }
      }
      const bob = w.wait > 0 ? 0 : Math.abs(Math.sin(time * 8)) * u * 0.01;
      drawPofi(ctx, w.x * W, H * w.y - bob, u * w.size, {
        face: w.wait > 0 ? 0 : w.face, lean: w.wait > 0 ? 0 : Math.sin(time * 8) * 0.08,
        outfit: w.outfit || outfit, blink: (time % 3.4) < 0.12, wave: w.wait > 0 && !w.outfit ? Math.sin(time * 6) * 0.4 : 0,
      });
    }

    if (vl >= 8) this.bunting(ctx, W, H, u, time);
    if (vl >= 10) for (const [fx, fy] of [[0.58, 0.73], [0.83, 0.79]]) iceSculpture(ctx, fx * W, fy * H, u, time);
    if (vl >= 12) this.lanterns(ctx, W, H, u, time);
    if (night > 0) {
      ctx.fillStyle = `rgba(20,24,60,${night * 0.25})`;
      ctx.fillRect(-W, -H, W * 3, H * 3);
    }
    ctx.restore();

    if (vl >= 2) this.snowfall(ctx, W, H, time);

    this.parts = this.parts.filter(p => (p.life -= dt) > 0);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(this.cam.z, this.cam.z);
    ctx.translate(-this.cam.x, -this.cam.y);
    ctx.fillStyle = '#fff6a8';
    for (const p of this.parts) {
      p.vy += 120 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      ctx.globalAlpha = Math.min(1, p.life);
      circle(ctx, p.x, p.y, 3);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // Kurulmamış ama açık yapı yeri: tabela; parası yetiyorsa zıplayan "!"
  plot(ctx, x, y, u, t, ready, focused) {
    ctx.fillStyle = focused ? 'rgba(255,209,102,.45)' : 'rgba(180,205,230,.45)';
    ellipse(ctx, x, y, u * 0.07, u * 0.02);
    ctx.fill();
    ctx.fillStyle = '#9a6a42';
    ctx.fillRect(x - u * 0.004, y - u * 0.05, u * 0.008, u * 0.05);
    roundRect(ctx, x - u * 0.03, y - u * 0.07, u * 0.06, u * 0.03, u * 0.005);
    ctx.fill();
    if (ready) {
      const b = Math.abs(Math.sin(t * 4)) * u * 0.015;
      ctx.fillStyle = '#ff8a3d';
      circle(ctx, x, y - u * 0.1 - b, u * 0.022);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${Math.round(u * 0.03)}px Fredoka, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', x, y - u * 0.1 - b + 1);
    }
  }

  lights(ctx, x, y, u, W, o) {
    const strings = o.lv >= 2 ? 2 : 1;
    const pal = o.col ? [o.col] : [['#ffd166'], ['#ff5a6a', '#ffd166', '#3cc977', '#3d9bff', '#a46bff'], ['#9fe1ff', '#cfefff']][o.style];
    for (let s = 0; s < strings; s++) {
      const yy = y + s * u * 0.035, sag = u * (0.045 + s * 0.01);
      ctx.strokeStyle = '#5b4636';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(W * 0.14, yy);
      ctx.quadraticCurveTo(x, yy + sag * 2, W * 0.86, yy);
      ctx.stroke();
      for (let k = 0; k <= 11; k++) {
        const f = k / 11, xx = W * 0.14 + f * W * 0.72, by = yy + 4 * f * (1 - f) * sag + u * 0.01;
        const a = 0.6 + 0.4 * Math.sin(o.t * 3 + k + s);
        ctx.fillStyle = pal[(k + s) % pal.length];
        ctx.globalAlpha = a;
        circle(ctx, xx, by, u * 0.009);
        ctx.fill();
        ctx.globalAlpha = 1;
        if (o.night > 0.2) glow(ctx, xx, by, u * 0.025, '#ffe7a8', o.night * 0.4);
      }
    }
    if (o.lv >= 3) {
      for (const px of [W * 0.14, W * 0.86]) {
        ctx.fillStyle = '#3b4252';
        ctx.fillRect(px - u * 0.004, y - u * 0.01, u * 0.008, u * 0.14);
        ctx.fillStyle = '#ffe08a';
        circle(ctx, px, y - u * 0.015, u * 0.014);
        ctx.fill();
        glow(ctx, px, y - u * 0.015, u * 0.06, '#fff2b0', 0.35 + o.night * 0.5);
      }
    }
  }

  aurora(t, W, H, u, night) {
    const { ctx } = this;
    [['rgba(80,255,180,', 0], ['rgba(170,120,255,', 1.7]].forEach(([c, ph]) => {
      ctx.beginPath();
      for (let i = 0; i <= 20; i++) {
        const x = -W * 0.2 + (i / 20) * W * 1.4;
        const y = H * (0.12 + 0.04 * Math.sin(i * 0.6 + t * 0.5 + ph));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.lineWidth = u * 0.05;
      ctx.strokeStyle = c + (0.15 + night * 0.35) + ')';
      ctx.stroke();
    });
  }

  bunting(ctx, W, H, u, t) {
    const y = H * 0.48;
    ctx.strokeStyle = '#5b4636';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.3, y);
    ctx.quadraticCurveTo(W * 0.5, y + u * 0.05, W * 0.7, y);
    ctx.stroke();
    const cols = ['#ff5a6a', '#ffd166', '#3cc977', '#3d9bff', '#a46bff'];
    for (let k = 0; k < 10; k++) {
      const f = (k + 0.5) / 10, x = W * 0.3 + f * W * 0.4, yy = y + 4 * f * (1 - f) * u * 0.025;
      ctx.fillStyle = cols[k % cols.length];
      ctx.beginPath();
      ctx.moveTo(x - u * 0.012, yy);
      ctx.lineTo(x + u * 0.012, yy);
      ctx.lineTo(x, yy + u * 0.025 + Math.sin(t * 3 + k) * u * 0.003);
      ctx.fill();
    }
  }

  // Köy Lv11: gökyüzünde her 2,5 saniyede bir havai fişek.
  fireworks(ctx, W, H, u, t) {
    const slot = Math.floor(t / 2.5), k = (t / 2.5) % 1;
    for (let j = 0; j < 2; j++) {
      const seed = slot * 2 + j;
      const x = W * (0.2 + ((seed * 0.618) % 1) * 0.6), y = H * (0.1 + ((seed * 0.37) % 1) * 0.15);
      const col = ['#ffd166', '#ff5a6a', '#3cc977', '#9fd3ff', '#c3a2ff'][seed % 5];
      const p = Math.max(0, k - j * 0.3) / 0.7;
      if (p <= 0 || p >= 1) continue;
      ctx.strokeStyle = col;
      ctx.globalAlpha = 1 - p;
      ctx.lineWidth = 1.5;
      for (let a = 0; a < 12; a++) {
        const ang = (a / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(ang) * u * 0.02 * p, y + Math.sin(ang) * u * 0.02 * p);
        ctx.lineTo(x + Math.cos(ang) * u * 0.07 * p, y + Math.sin(ang) * u * 0.07 * p + p * p * u * 0.02);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  // Köy Lv12: yerden göğe yükselen fenerler.
  lanterns(ctx, W, H, u, t) {
    for (let k = 0; k < 8; k++) {
      const f = (t * 0.04 + k / 8) % 1;
      const x = W * (0.15 + ((k * 0.618) % 1) * 0.7) + Math.sin(t + k) * u * 0.02;
      const y = H * (0.8 - f * 0.75);
      ctx.globalAlpha = Math.min(1, (1 - f) * 2);
      glow(ctx, x, y, u * 0.05, '#ffcf7a', 0.5);
      ctx.fillStyle = '#ff9f43';
      roundRect(ctx, x - u * 0.012, y - u * 0.016, u * 0.024, u * 0.03, u * 0.006);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  snowfall(ctx, W, H, t) {
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (let k = 0; k < 40; k++) {
      const sx = (k * 0.618) % 1, sp = 18 + (k % 5) * 6;
      const y = (t * sp + k * 37) % (H + 10) - 5;
      const x = sx * W + Math.sin(t + k) * 8;
      circle(ctx, x, y, 1.2 + (k % 3) * 0.6);
      ctx.fill();
    }
  }
}

// iki hex rengi karıştır
function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = s => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
