// Meta: Pofi'nin köyü. 12 yapı × 3 seviye × 3 stil + renk paleti, köy seviyesine göre sahne efektleri.
import { roundRect, circle, ellipse, drawPofi } from './draw.js';
import { art, tinted, BLD, BLD_Z2 } from './art.js';
import { DISTRICTS, DECOR_SLOTS } from './config.js';

// Yapı görseli (varsa). Çağıran tuvali SCALE[lvFull] ile büyütmüş olur; görselde seviye büyümesi
// zaten çizili olduğundan burada geri alınır. Lv4-5 görseli yoksa Lv3 görseli kodun büyütmesiyle çizilir.
// Lv4-5 tam 1/r ile çizilince köy kalabalıklaşıyor (yapılar birbirine biniyor); Lv4 ≈ Lv3 × 1.1 olacak şekilde küçültülür.
const Z2_FIT = 0.72;
const z2Art = (id, o) => o.lvFull >= 4 && BLD_Z2[`${id}_s${o.style}`] && art(`bld_${id}_s${o.style}_lv${o.lvFull}`);
function bldArt(ctx, u, id, o) {
  if (!BLD[id]) return false;
  const lvFull = o.lvFull || o.lv, z2 = z2Art(id, o);
  const key = `bld_${id}_s${o.style}_lv${z2 ? lvFull : o.lv}`;
  const im = typeof o.col === 'string' && o.col.startsWith('#') ? tinted(key, o.col) : art(key);
  if (!im) return false;
  const k = z2
    ? ((u * BLD[id]) / 512 / BLD_Z2[`${id}_s${o.style}`]) * Z2_FIT / SCALE[lvFull]
    : (u * BLD[id]) / 512 / SCALE[o.lv];
  // Taban görselin 496. satırında.
  ctx.drawImage(im, -256 * k, -496 * k, 512 * k, 512 * k);
  return true;
}

// Sahnedeki konumlar (genişlik/yükseklik oranı, yapının taban ortası)
const AT = {
  lights: [0.5, 0.3], observatory: [0.2, 0.46], sled: [0.85, 0.46], tree: [0.08, 0.6],
  igloo: [0.48, 0.59], fort: [0.74, 0.61], snowman: [0.93, 0.7], cocoa: [0.29, 0.69],
  lighthouse: [0.06, 0.8], hut: [0.38, 0.87], pier: [0.17, 0.92], rink: [0.7, 0.88],
  // Buz Limanı: ikinci panel (x 1-2). Tekne denizde, temeli yok.
  cafe: [1.22, 0.63], market: [1.47, 0.6], bell: [1.76, 0.53], ferry: [1.64, 0.94],
};
// Temeli olmayan (suyun üstündeki ya da asılı) yapılar ve ana yola patikası olmayanlar.
const NO_PAD = new Set(['lights', 'lighthouse', 'pier', 'ferry']);
const NO_SPUR = new Set(['lights', 'lighthouse', 'ferry']);
const SCALE = [0, 0.85, 1, 1.15, 1.2, 1.26]; // seviyeye göre boyut

// Ana yol (penguenlerin yürüdüğü meydan yolu); her yapı yerine buradan bir patika ayrılır.
// Ana yol bölgeler boyunca uzar; Buz Limanı'nda kıyı boyunca devam eder.
// Limanın zemin görselinde yolun ortası y≈0.765; köy panelinden oraya yumuşakça geçer.
const PROMENADE = [[0.1, 0.8], [0.3, 0.775], [0.5, 0.765], [0.7, 0.775], [0.92, 0.8], [1.08, 0.772], [1.3, 0.765], [1.5, 0.765], [1.72, 0.765], [1.92, 0.765]];
const walkRange = land => [0.16, land >= 2 ? 1.86 : 0.88]; // yürüyüş aralığı (x)
function promenadeY(x) {
  for (let i = 1; i < PROMENADE.length; i++) {
    const [x0, y0] = PROMENADE[i - 1], [x1, y1] = PROMENADE[i];
    if (x <= x1) return y0 + ((y1 - y0) * Math.max(0, x - x0)) / (x1 - x0);
  }
  return PROMENADE[PROMENADE.length - 1][1];
}
// Kakao satışı: Pofi stantın önünden tepsiyi alır, yolculara götürür (iskele kuruluysa iskeleye,
// değilse ana yolun sol ucuna), coin'ler sayaca uçar.
const STAND = [0.29, 0.715];
const SALE_SPEED = 0.24; // kesir/saniye
const TRAVELERS = [
  { hat: 'earmuffs', scarf: 'green' }, { hat: 'north', scarf: 'blue' }, { hat: 'beanieRed', scarf: 'yellow' },
];
const travelerSpots = pier => (pier
  ? [[0.11, 0.935], [0.165, 0.955], [0.22, 0.935]]
  : [[0.175, promenadeY(0.175) + 0.004], [0.145, promenadeY(0.145) + 0.022], [0.12, promenadeY(0.12) + 0.002]]);

// Köy yaşamı (GDD 12.5): köylüler cihaz saatine göre rutin izler.
// Yerler, Lv3 yapı görsellerinin kapladığı alanların dışında seçildi (önde duran yapı köylüyü örtmesin).
const FIRE = [0.612, 0.5]; // kamp ateşi: iglo ile kale arasındaki açık kar
const HOME = [0.48, 0.61]; // gece iglo kapısından içeri girerler
export const phaseOf = h => (h >= 7 && h < 11 ? 'morning' : h >= 11 && h < 17 ? 'day' : h >= 17 && h < 21 ? 'evening' : 'night');
// Gece karanlığı (köy Lv6 ödülü): 18'den sonra kararır, 21-6 arası tam gece, 6-8 arası aydınlanır.
const nightOf = h => (h >= 21 || h < 6 ? 1 : h >= 18 ? (h - 18) / 3 : h < 8 ? (8 - h) / 2 : 0);
const LAKE_FISH = [[0.13, 0.797], [0.185, 0.791]]; // iskele yoksa ana yolun göl ucunda, yüzü göle dönük
const PIER_FISH = [[0.12, 0.93], [0.2, 0.935]]; // iskele varsa güvertenin ön kenarında
const HARBOR_FISH = [[1.4, 0.845], [1.56, 0.843], [1.84, 0.84]];
const QUEUE = [[0.29, 0.727], [0.29, 0.752]]; // kakao standına çıkan patikada sıra

// Fener dizisi gökyüzünde asılı; kurulmamışken yeri ufuk çizgisinde gösterilir.
const plotAt = id => (id === 'lights' ? [0.5, 0.42] : AT[id]);

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

  cafe(ctx, u, o) {
    const wall = ['#b07a4a', '#c98b5a', '#d6ecff'][o.style], awn = o.col || ['#e5484d', '#e5484d', '#4fb3ff'][o.style];
    const w = u * (0.14 + o.lv * 0.02), h = u * (0.08 + o.lv * 0.01);
    ctx.fillStyle = wall;
    ctx.fillRect(-w / 2, -h, w, h);
    ctx.fillStyle = '#7a4a2e';
    ctx.beginPath();
    ctx.moveTo(-w / 2 - u * 0.015, -h);
    ctx.lineTo(0, -h - u * 0.06);
    ctx.lineTo(w / 2 + u * 0.015, -h);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-w / 2 - u * 0.015, -h - u * 0.004, w + u * 0.03, u * 0.008);
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = k % 2 ? '#ffffff' : awn;
      ctx.fillRect(-w / 2 + (k * w) / 6, -h * 0.66, w / 6, h * 0.18);
    }
    ctx.fillStyle = '#ffd98a';
    ctx.fillRect(-w * 0.38, -h * 0.42, w * 0.3, h * 0.26);
    ctx.fillStyle = '#4a3324';
    ctx.fillRect(w * 0.1, -h * 0.44, w * 0.2, h * 0.44);
    if (o.night > 0.3) glow(ctx, -w * 0.23, -h * 0.3, u * 0.05, '#ffe7a8', o.night * 0.5);
    mug(ctx, 0, -h - u * 0.075, u * 0.012, o.t);
    if (o.lv >= 2) {
      ctx.fillStyle = '#9a6a42';
      ctx.fillRect(w / 2 + u * 0.02, -u * 0.03, u * 0.04, u * 0.006);
      ctx.fillRect(w / 2 + u * 0.037, -u * 0.03, u * 0.006, u * 0.03);
      ctx.fillStyle = awn;
      ctx.beginPath();
      ctx.moveTo(w / 2 + u * 0.005, -u * 0.06);
      ctx.lineTo(w / 2 + u * 0.04, -u * 0.08);
      ctx.lineTo(w / 2 + u * 0.075, -u * 0.06);
      ctx.fill();
      ctx.fillRect(w / 2 + u * 0.039, -u * 0.06, u * 0.003, u * 0.03);
    }
    if (o.lv >= 3) {
      for (let k = 0; k <= 6; k++) {
        ctx.fillStyle = ['#ffd166', '#ff5a6a', '#3cc977'][k % 3];
        circle(ctx, -w / 2 + (k * w) / 6, -h * 0.7 + Math.sin(k) * u * 0.003, u * 0.005);
        ctx.fill();
      }
    }
  },

  market(ctx, u, o) {
    const top = o.col || ['#3d7bd9', '#9a6a42', '#8fd0ff'][o.style];
    const w = u * (0.13 + o.lv * 0.025);
    ctx.fillStyle = o.style === 2 ? '#cfe9ff' : '#9a6a42';
    ctx.fillRect(-w / 2, -u * 0.05, w, u * 0.05);
    ctx.fillStyle = '#e8f6ff';
    ctx.fillRect(-w / 2, -u * 0.058, w, u * 0.012);
    const nf = 2 + o.lv;
    for (let k = 0; k < nf; k++) {
      ctx.fillStyle = k % 2 ? '#ff9f43' : '#ffb870';
      ellipse(ctx, -w / 2 + ((k + 0.5) * w) / nf, -u * 0.064, u * 0.014, u * 0.007, 0.2);
      ctx.fill();
    }
    ctx.fillStyle = '#5b4636';
    ctx.fillRect(-w / 2, -u * 0.13, u * 0.008, u * 0.08);
    ctx.fillRect(w / 2 - u * 0.008, -u * 0.13, u * 0.008, u * 0.08);
    for (let k = 0; k < 5; k++) {
      ctx.fillStyle = k % 2 ? '#ffffff' : top;
      ctx.beginPath();
      const x = -w / 2 - u * 0.01 + (k * (w + u * 0.02)) / 5, ww = (w + u * 0.02) / 5;
      ctx.moveTo(x, -u * 0.15);
      ctx.lineTo(x + ww, -u * 0.15);
      ctx.lineTo(x + ww, -u * 0.125);
      ctx.quadraticCurveTo(x + ww / 2, -u * 0.11, x, -u * 0.125);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-w / 2 - u * 0.01, -u * 0.155, w + u * 0.02, u * 0.007);
    if (o.lv >= 3) {
      ctx.fillStyle = '#7a5434';
      roundRect(ctx, -u * 0.04, -u * 0.2, u * 0.08, u * 0.035, u * 0.008);
      ctx.fill();
      ctx.fillStyle = '#ff9f43';
      ellipse(ctx, 0, -u * 0.183, u * 0.022, u * 0.009);
      ctx.fill();
    }
  },

  bell(ctx, u, o) {
    const metal = o.col || ['#c98b3f', '#c9d2dc', '#ffd166'][o.style];
    const h = u * (0.12 + o.lv * 0.025), w = u * 0.1;
    ctx.fillStyle = '#7a5434';
    ctx.fillRect(-w / 2, -h, u * 0.012, h);
    ctx.fillRect(w / 2 - u * 0.012, -h, u * 0.012, h);
    ctx.fillRect(-w / 2 - u * 0.01, -h, w + u * 0.02, u * 0.014);
    if (o.lv >= 2) {
      ctx.fillStyle = '#8e3b2e';
      ctx.beginPath();
      ctx.moveTo(-w / 2 - u * 0.025, -h);
      ctx.lineTo(0, -h - u * 0.05);
      ctx.lineTo(w / 2 + u * 0.025, -h);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-w / 2 - u * 0.025, -h - u * 0.004, w + u * 0.05, u * 0.007);
    }
    ctx.save();
    ctx.translate(0, -h + u * 0.014);
    ctx.rotate(Math.sin(o.t * 2) * 0.12);
    ctx.fillStyle = metal;
    ctx.beginPath();
    ctx.moveTo(-u * 0.012, 0);
    ctx.quadraticCurveTo(-u * 0.016, u * 0.03, -u * 0.03, u * 0.045);
    ctx.lineTo(u * 0.03, u * 0.045);
    ctx.quadraticCurveTo(u * 0.016, u * 0.03, u * 0.012, 0);
    ctx.fill();
    ctx.fillStyle = shade(metal.startsWith('#') ? metal : '#c98b3f', -0.3);
    circle(ctx, 0, u * 0.05, u * 0.007);
    ctx.fill();
    ctx.restore();
    if (o.lv >= 3) {
      const cols = ['#ff5a6a', '#ffd166', '#3cc977', '#3d9bff'];
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = cols[k];
        ctx.beginPath();
        const x = -w / 2 - u * 0.02 + k * u * 0.035;
        ctx.moveTo(x, -h - u * 0.01);
        ctx.lineTo(x + u * 0.025, -h - u * 0.01);
        ctx.lineTo(x + u * 0.0125, -h + u * 0.012);
        ctx.fill();
      }
    }
  },

  ferry(ctx, u, o) {
    const hull = o.col || ['#e5484d', '#3d7bd9', '#f5b81c'][o.style];
    const w = u * (0.16 + o.lv * 0.03), bob = Math.sin(o.t * 1.5) * u * 0.004;
    ctx.save();
    ctx.translate(0, bob);
    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.moveTo(-w / 2, -u * 0.045);
    ctx.lineTo(w / 2, -u * 0.045);
    ctx.lineTo(w * 0.4, 0);
    ctx.lineTo(-w * 0.42, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-w / 2 + u * 0.01, -u * 0.03, w - u * 0.02, u * 0.007);
    ctx.fillRect(-w * 0.28, -u * 0.095, w * 0.48, u * 0.05);
    ctx.fillStyle = '#4fb3ff';
    for (let k = 0; k < 3 + o.lv; k++) {
      circle(ctx, -w * 0.22 + k * u * 0.028, -u * 0.07, u * 0.008);
      ctx.fill();
    }
    if (o.lv >= 2) {
      ctx.fillStyle = '#1d3557';
      ctx.fillRect(w * 0.08, -u * 0.13, u * 0.02, u * 0.035);
      smoke(ctx, w * 0.09, -u * 0.13, u, o.t);
    }
    if (o.lv >= 3) {
      ctx.strokeStyle = '#5b4636';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-w * 0.35, -u * 0.045);
      ctx.lineTo(-w * 0.35, -u * 0.15);
      ctx.stroke();
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.moveTo(-w * 0.35, -u * 0.15);
      ctx.lineTo(-w * 0.35 + u * 0.035, -u * 0.138);
      ctx.lineTo(-w * 0.35, -u * 0.125);
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, u * 0.004);
    ctx.quadraticCurveTo(0, u * 0.012 + bob, w * 0.5, u * 0.004);
    ctx.stroke();
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
    this.walkers = [{ x: 0.5, tx: 0.6, face: 1, wait: 0, lane: 0, size: 0.12, speed: 0.06 }];
    this.vs = new Map(); // köylü durumları
    this.onVillager = null; // köylüye dokunulunca (id)
    this.onDecorSlot = null; // süsleme modunda süs yerine dokunulunca (yer id)
    this.decorMode = false;
    this.decorSel = null; // seçili süs yeri
    this.decorPreview = null; // { slot, item } satın almadan önce sahnede
    this.cam = { x: 0, y: 0, z: 1 };
    this.focus = null;
    this.preview = null; // { id, style, color } — satın almadan önce sahnede gösterilir
    this.onSelect = null;
    this.onDistrict = null; // kilitli bölge tabelasına dokunulunca (bölge indeksi)
    this.sx = this.sxT = 0; // yatay kaydırma (piksel); sxT hedef
    this.panels = 1;
    let down = null;
    canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, sx: this.sx, drag: false }; });
    canvas.addEventListener('pointermove', e => {
      if (!down || this.focus) return;
      const dx = e.clientX - down.x;
      if (!down.drag && Math.abs(dx) > 8) down.drag = true;
      if (down.drag) this.sx = this.sxT = this.clampSx(down.sx - dx);
    });
    canvas.addEventListener('pointerup', e => {
      const d = down;
      down = null;
      if (!d || d.drag || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10) return;
      const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      // panel okları (ekran koordinatı)
      if (!this.focus && y > this.H * 0.3 && y < this.H * 0.7) {
        const cur = Math.round(this.sx / this.W);
        if (x > this.W - 40 && cur < this.panels - 1) { this.goPanel(cur + 1); return; }
        if (x < 40 && cur > 0) { this.goPanel(cur - 1); return; }
      }
      if (this.decorMode) {
        const slot = this.decorHit(x, y);
        if (slot) this.onDecorSlot?.(slot);
        return;
      }
      const vid = this.villagerHit(x, y);
      if (vid) { this.onVillager?.(vid); return; }
      const lock = this.lockHit(x, y);
      if (lock !== null) { this.onDistrict?.(lock); return; }
      const id = this.hit(x, y);
      if (id) this.onSelect?.(id);
    });
    canvas.addEventListener('pointercancel', () => { down = null; });
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
  // o: { cups, coins, pier, done } — done, yolculara servis anında çağrılır.
  playSale(o) {
    if (this.sale || !this.W) return false;
    const h = this.walkers[0], py = promenadeY;
    const spot = o.pier ? [0.165, 0.928] : [0.205, py(0.205)];
    const wp = [
      [STAND[0], py(STAND[0])],
      [STAND[0], STAND[1], 'pick'],
      [STAND[0], py(STAND[0])],
      ...(o.pier ? [[0.165, py(0.165)]] : []),
      [spot[0], spot[1], 'serve'],
      ...(o.pier ? [[0.165, py(0.165)]] : []),
      [0.42, py(0.42), 'end'],
    ];
    this.sale = { ...o, wp, i: 0, x: h.x, y: py(h.x) + h.lane, wait: 0, tray: false, served: false, face: 1 };
    return true;
  }

  stepSale(dt) {
    const s = this.sale;
    if (s.wait > 0) { s.wait -= dt; return; }
    const [tx, ty, act] = s.wp[s.i];
    const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy), step = SALE_SPEED * dt;
    if (d > step) {
      s.x += (dx / d) * step;
      s.y += (dy / d) * step;
      if (Math.abs(dx) > 0.001) s.face = Math.sign(dx);
      return;
    }
    s.x = tx;
    s.y = ty;
    if (act === 'pick') { s.tray = true; s.wait = 0.45; }
    else if (act === 'serve') {
      s.tray = false;
      s.served = true;
      s.wait = 0.8;
      this.travCup = true;
      this.travLeave = 0;
      this.coinBurst(tx, ty, s.coins);
      s.done?.();
    } else if (act === 'end') {
      const h = this.walkers[0];
      h.x = h.tx = s.x;
      h.wait = 0.8;
      this.sale = null;
      return;
    }
    s.i++;
  }

  // Köylünün bu saatteki yeri: [x, y, yön, iş] ya da null (ana yolda gezinir).
  villagerSpot(i, list, phase, village, land) {
    if (phase === 'night') return [HOME[0], HOME[1], 0, 'sleep'];
    if (phase === 'evening') {
      const a = (i / list.length) * Math.PI * 2 + 0.4;
      return [FIRE[0] + Math.cos(a) * 0.045, FIRE[1] + Math.sin(a) * 0.022, Math.cos(a) > 0 ? -1 : 1, 'warm'];
    }
    // sabah ve öğlen: işler önce yetişkinlere dağıtılır, çocuklar gezinir
    const adults = list.filter(v => !v.kid), k = adults.indexOf(list[i]);
    if (k < 0) return null;
    if (phase === 'morning') {
      const spots = [...(land >= 2 ? HARBOR_FISH.map(p => [...p, 0]) : []), ...(village.pier ? PIER_FISH : LAKE_FISH).map(p => [...p, -1])];
      return spots[k] ? [spots[k][0], spots[k][1], spots[k][2], 'fish'] : null;
    }
    return village.cocoa && QUEUE[k] ? [QUEUE[k][0], QUEUE[k][1], 0, 'queue'] : null;
  }

  stepVillagers(dt, list, phase, village, land) {
    const py = promenadeY, wr = walkRange(land);
    list.forEach((v, i) => {
      const spot = this.villagerSpot(i, list, phase, village, land);
      const lane = (i % 3) * 0.012;
      let st = this.vs.get(v.id);
      if (!st) {
        // ilk açılışta yerinde başlar (yürüyerek gelmez)
        const x = spot ? spot[0] : wr[0] + Math.random() * (wr[1] - wr[0]);
        st = { x, y: spot ? spot[1] : py(x) + lane, route: [], wait: Math.random() * 2, face: spot ? spot[2] : 1, phase, act: spot?.[3] || null, wander: !spot, hidden: phase === 'night' };
        this.vs.set(v.id, st);
      }
      if (st.phase !== phase) {
        // yeni saat dilimi: ana yola in, yol boyunca git, hedefe çık
        st.phase = phase;
        st.act = null;
        st.hidden = false;
        st.wander = !spot;
        st.route = [];
        if (Math.abs(st.y - py(st.x)) > 0.012) st.route.push([st.x, py(st.x) + lane]);
        if (spot) {
          if (Math.abs(spot[1] - py(spot[0])) > 0.012) st.route.push([spot[0], py(spot[0]) + lane]);
          st.route.push([spot[0], spot[1]]);
        }
      }
      if (st.route.length) {
        const [tx, ty] = st.route[0], dx = tx - st.x, dy = ty - st.y, d = Math.hypot(dx, dy), step = 0.07 * dt;
        if (d > step) { st.x += (dx / d) * step; st.y += (dy / d) * step; if (Math.abs(dx) > 0.001) st.face = Math.sign(dx); return; }
        st.x = tx;
        st.y = ty;
        st.route.shift();
        if (!st.route.length && spot) { st.act = spot[3]; st.face = spot[2]; if (spot[3] === 'sleep') st.hidden = true; }
        return;
      }
      if (!st.wander) return;
      // gezinme: ana yolda rastgele noktalara yürür, arada durur
      if (st.wait > 0) { st.wait -= dt; return; }
      if (st.tx === undefined || Math.abs(st.tx - st.x) < 0.01) { st.tx = wr[0] + Math.random() * (wr[1] - wr[0]); st.wait = 1 + Math.random() * 3; return; }
      st.x += Math.sign(st.tx - st.x) * dt * 0.045;
      st.y = py(st.x) + lane;
      st.face = Math.sign(st.tx - st.x);
    });
  }

  decorHit(sx, sy) {
    const { cam, W, H } = this;
    const wx = (sx - W / 2) / cam.z + cam.x, wy = (sy - H / 2) / cam.z + cam.y;
    let best = null, bd = Infinity;
    for (const [id, x, y, r] of this.slotPos || []) {
      const d = Math.hypot(wx - x, wy - y);
      if (d < r + 14 && d < bd) { bd = d; best = id; }
    }
    return best;
  }

  villagerHit(sx, sy) {
    const { cam, W, H } = this;
    const wx = (sx - W / 2) / cam.z + cam.x, wy = (sy - H / 2) / cam.z + cam.y;
    for (const [id, x, y, r] of this.vpos || []) if (Math.hypot(wx - x, wy - y) < r + 8) return id;
    return null;
  }

  say(id, text) { this.speech = { id, text, until: performance.now() + 3200 }; }

  drawSpeech(ctx, u, t) {
    const sp = this.speech;
    if (!sp || performance.now() > sp.until) return;
    const p = (this.vpos || []).find(v => v[0] === sp.id);
    if (!p) return;
    const [, x, y, r] = p;
    ctx.font = `600 ${Math.round(u * 0.045)}px Fredoka, sans-serif`;
    const w = ctx.measureText(sp.text).width + u * 0.06, h = u * 0.08, by = y - r - h - u * 0.03;
    const bx = Math.max(this.sx + 6, Math.min(this.sx + this.W - w - 6, x - w / 2));
    ctx.fillStyle = 'rgba(255,255,255,.96)';
    roundRect(ctx, bx, by, w, h, h / 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - u * 0.015, by + h);
    ctx.lineTo(x, by + h + u * 0.025);
    ctx.lineTo(x + u * 0.015, by + h);
    ctx.fill();
    ctx.fillStyle = '#1d3557';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sp.text, bx + w / 2, by + h / 2 + 1);
  }

  // Coin'ler satış noktasından sağ üstteki sayaca doğru yay çizerek uçar.
  coinBurst(fx, fy, coins) {
    this.coinFx = this.coinFx || [];
    const n = Math.min(14, 4 + Math.floor(coins / 15));
    for (let i = 0; i < n; i++) this.coinFx.push({ x0: fx, y0: fy - 0.05, t: -i * 0.06, dx: (Math.random() - 0.5) * 0.08 });
  }

  drawCoinFx(ctx, W, H, u, dt) {
    if (!this.coinFx?.length) return;
    const tx = this.sx / W + 0.94, ty = 0.04;
    this.coinFx = this.coinFx.filter(c => (c.t += dt) < 0.9);
    for (const c of this.coinFx) {
      if (c.t < 0) continue;
      const k = c.t / 0.9, e = k * k;
      const x = (c.x0 + c.dx * Math.sin(k * Math.PI) + (tx - c.x0) * e) * W;
      const y = (c.y0 + (ty - c.y0) * e) * H - Math.sin(k * Math.PI) * u * 0.12;
      ctx.fillStyle = '#ffcf3f';
      circle(ctx, x, y, u * 0.018);
      ctx.fill();
      ctx.strokeStyle = '#d99a12';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  clampSx(v) { return Math.max(0, Math.min((this.panels - 1) * this.W, v)); }
  get panel() { return this.W ? Math.round(this.sx / this.W) : 0; }
  goPanel(i) { this.sxT = this.clampSx(i * this.W); }

  // Kilitli bölge tabelası (dünya koordinatında kaydedilir)
  lockHit(sx, sy) {
    const { cam, W, H } = this;
    const wx = (sx - W / 2) / cam.z + cam.x, wy = (sy - H / 2) / cam.z + cam.y;
    for (const [i, x0, y0, x1, y1] of this.lockRects || []) if (wx > x0 && wx < x1 && wy > y0 && wy < y1) return i;
    return null;
  }

  hit(sx, sy) {
    const { cam, W, H } = this;
    const wx = (sx - W / 2) / cam.z + cam.x, wy = (sy - H / 2) / cam.z + cam.y;
    const u = Math.min(W, H);
    let best = null, bd = u * 0.12;
    for (const id of Object.keys(AT)) {
      if (!this.visible?.has(id)) continue;
      const [fx, fy] = this.lastVillage?.[id] ? AT[id] : plotAt(id);
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
  // land: açılmış bölge sayısı; sıradaki bölge sisli bir panel olarak sağda görünür.
  // villagers: köydeki köylüler; hour: günün saati (varsayılan cihaz saati); task: { giver, done } günlük iş
  draw(time, dt, { village, vl, plots, ready, upgradable = [], outfit, colors, cocoa = null, land = 1, teaser = true, homeReady = [], villagers = [], hour = null, task = null, decor = {} }) {
    if (hour === null) { const d = new Date(); hour = d.getHours() + d.getMinutes() / 60; }
    if (!this.W) this.resize();
    const { ctx, W, H } = this;
    const u = Math.min(W, H);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.land = land;
    this.panels = Math.min(DISTRICTS.length, land + (teaser ? 1 : 0));
    this.sxT = this.clampSx(this.sxT);
    this.sx += (this.sxT - this.sx) * Math.min(1, dt * 8);
    const n = this.panels;

    // kamera
    // seçili yapıya ya da süs yerine yaklaşır (alttaki panel sahnenin altını kapatır)
    const fp = this.focus ? AT[this.focus] : this.decorSel ? DECOR_SLOTS.find(sl => sl.id === this.decorSel)?.at : null;
    const tgt = fp ? { x: fp[0] * W, y: fp[1] * H - u * 0.08, z: 1.8 } : { x: W / 2 + this.sx, y: H / 2, z: 1 };
    if (fp) {
      // yakınlaşınca görüntü sahnenin dışına taşmasın
      tgt.x = Math.max(W / (2 * tgt.z), Math.min(this.panels * W - W / (2 * tgt.z), tgt.x));
      tgt.y = Math.max(H / (2 * tgt.z), Math.min(H - H / (2 * tgt.z), tgt.y));
    }
    const k = Math.min(1, dt * 6);
    this.cam.x += (tgt.x - this.cam.x) * k;
    this.cam.y += (tgt.y - this.cam.y) * k;
    this.cam.z += (tgt.z - this.cam.z) * k;
    const night = vl >= 6 ? nightOf(hour) : 0;
    const phase = phaseOf(hour);

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

    const skyArt = art('bg_sky'), ground = art('bg_ground'), aurora = art('bg_aurora');
    if (skyArt && ground) {
      // Katmanlı görsel: gökyüzü, (Lv5'ten itibaren) kuzey ışıkları, yol ve temelleri çizili zemin.
      // Zemin, AT konumlarına göre çizildiği için tuvale birebir oturtulur. Sonraki panellerde gökyüzü
      // aynalanarak tekrarlanır (kenarlar dikişsiz birleşir), zemin kodla çizilir.
      for (let i = 0; i < n; i++) {
        panelImage(ctx, skyArt, i, W, H);
        if (vl >= 5 && aurora) {
          ctx.globalAlpha = Math.min(1, (vl >= 9 ? 0.75 : 0.5) + night * 0.4) * (0.85 + 0.15 * Math.sin(time * 0.8));
          panelImage(ctx, aurora, i, W, H);
          ctx.globalAlpha = 1;
        }
      }
      if (vl >= 11) this.fireworks(ctx, W, H, u, time);
      ctx.drawImage(ground, 0, 0, W, H);
      for (let i = 1; i < n; i++) this.districtGround(ctx, i, W, H, u, night, vl, sampleColor(ground, 0.99, 0.7, '#eef4fb'));
      if (night > 0) {
        ctx.fillStyle = `rgba(20,26,70,${night * 0.35})`;
        ctx.fillRect(0, 0, W * n, H);
      }
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
    ctx.lineTo(W * (n + 1), H * 0.2);
    ctx.lineTo(W * (n + 1), H * 0.45);
    ctx.lineTo(-W, H * 0.45);
    ctx.fill();

    ctx.fillStyle = mix('#f4faff', '#c3cbe6', night);
    ctx.fillRect(-W, H * 0.38, W * (n + 2), H * 1.2);
    ctx.fillStyle = mix('#5aa0d8', '#2c4f86', night);
    ctx.beginPath();
    ctx.moveTo(-W, H * 0.7);
    ctx.lineTo(0, H * 0.72);
    ctx.quadraticCurveTo(W * 0.2, H * 0.7, W * 0.3, H * 1.05);
    ctx.lineTo(-W, H * 1.6);
    ctx.fill();

    this.paths(ctx, W, H, u, night, vl);
    for (let i = 1; i < n; i++) this.districtGround(ctx, i, W, H, u, night, vl, null);
    }

    if (vl >= 7) {
      // fok gölün kenarındaki buz kütlesinde dinlenir
      ctx.fillStyle = mix('#ffffff', '#c3cbe6', night);
      ellipse(ctx, W * 0.1, H * 0.87, u * 0.07, u * 0.022);
      ctx.fill();
      const sx = W * 0.1, sy = H * 0.86 + Math.sin(time * 2) * 1.5;
      ctx.fillStyle = '#8f9bb0';
      ellipse(ctx, sx, sy, u * 0.04, u * 0.022);
      ctx.fill();
      circle(ctx, sx - u * 0.035, sy - u * 0.012, u * 0.017);
      ctx.fill();
      ctx.fillStyle = '#1b1b24';
      circle(ctx, sx - u * 0.04, sy - u * 0.016, u * 0.003);
      ctx.fill();
    }

    // Yapılar, penguenler ve heykeller tabanlarının yüksekliğine göre arkadan öne çizilir;
    // böylece bir penguen hiçbir zaman önündeki yapının çatısında görünmez.
    this.visible = new Set();
    this.lastVillage = village;
    const items = [], markers = [];
    for (const [id, [fx, fy]] of Object.entries(AT)) {
      let st = village[id];
      if (this.preview && this.preview.id === id && st) st = { ...st, style: this.preview.style, color: this.preview.color };
      if (st) {
        this.visible.add(id);
        const x = fx * W, y = fy * H;
        const col = st.color ? colors.find(c => c.id === st.color)?.hex : null;
        if (upgradable.includes(id)) markers.push([x, id === 'lights' ? y : y - u * 0.17 * SCALE[st.lv]]);
        if (homeReady.includes(id)) markers.push([x - u * (upgradable.includes(id) ? 0.06 : 0), y - u * 0.17 * SCALE[st.lv], 'home']);
        items.push([id === 'lights' ? -1 : y, () => {
          if (this.focus === id) {
            ctx.fillStyle = 'rgba(255,209,102,.35)';
            ellipse(ctx, x, y + u * 0.01, u * 0.15, u * 0.035);
            ctx.fill();
          }
          if (id === 'lights') { this.lights(ctx, x, y, u, W, { lv: Math.min(st.lv, 3), lvFull: st.lv, style: st.style, col, night: st.lv >= 4 ? Math.max(night, 0.6) : night, t: time }); return; }
          ctx.save();
          ctx.translate(x, y);
          ctx.scale(SCALE[st.lv], SCALE[st.lv]);
          // Bölge 2 seviyeleri (Lv4-5): görseli varsa kristaller ve yıldız görselde çizili; yoksa yapının
          // Lv3 çizimi kullanılır ve üstüne kodla hale ve parıltı eklenir.
          const dopt = { lv: Math.min(st.lv, 3), lvFull: st.lv, style: st.style, col, night, t: time };
          const deco = st.lv >= 4 && !z2Art(id, dopt);
          if (deco) auroraHalo(ctx, u, time + x);
          if (!bldArt(ctx, u, id, dopt)) DRAW[id](ctx, u, dopt);
          if (deco) sparkles(ctx, u, time + x, st.lv);
          ctx.restore();
        }]);
      } else if (plots.includes(id)) {
        this.visible.add(id);
        const [px, py] = plotAt(id);
        items.push([py * H, () => this.plot(ctx, px * W, py * H, u, time, ready.includes(id), this.focus === id)]);
      }
    }

    // penguenler yalnızca ana yolda yürür
    for (const w of this.walkers) {
      const hero = w === this.walkers[0];
      if (hero && this.sale) this.stepSale(dt);
      else if (w.wait > 0) w.wait -= dt;
      else {
        const d = w.tx - w.x;
        if (Math.abs(d) < 0.01) { w.wait = 1 + Math.random() * 2.5; const wr = walkRange(land); w.tx = wr[0] + Math.random() * (wr[1] - wr[0]); }
        else { w.x += Math.sign(d) * dt * w.speed; w.face = Math.sign(d); }
      }
      const sale = hero ? this.sale : null;
      const wx = sale ? sale.x : w.x, y = (sale ? sale.y : promenadeY(w.x) + w.lane) * H;
      const moving = sale ? sale.wait <= 0 : w.wait <= 0;
      const face = moving ? (sale ? sale.face : w.face) : 0;
      items.push([y, () => {
        const bob = moving ? Math.abs(Math.sin(time * 8)) * u * 0.01 : 0;
        drawPofi(ctx, wx * W, y - bob, u * w.size, {
          face, lean: moving ? Math.sin(time * 8) * 0.08 : 0,
          outfit: w.outfit || outfit, blink: (time % 3.4) < 0.12, wave: !moving && !w.outfit && !sale ? Math.sin(time * 6) * 0.4 : 0,
        });
        if (sale?.tray) tray(ctx, wx * W + (face || 1) * u * w.size * 0.32, y - bob - u * w.size * 0.42, u * w.size * 0.42, time);
      }]);
    }

    // Kakao: stantta biriken fincan balonu ve bekleyen yolcular
    if (cocoa && village.cocoa) {
      const lv = Math.min(village.cocoa.lv, 3);
      const showCups = cocoa.cups >= 1 && !(this.sale && (this.sale.tray || this.sale.served));
      if (showCups) markers.push([STAND[0] * W + u * 0.08, AT.cocoa[1] * H - u * [0.15, 0.2, 0.24][lv - 1], 'cups']);
      const waiting = cocoa.cups >= 1 || (this.sale && !this.sale.served);
      if (waiting && this.travLeave == null) this.travCup = false;
      if (this.travLeave != null) {
        this.travLeave += dt / 2.6;
        if (this.travLeave >= 1) this.travLeave = null;
      }
      if (waiting || this.travLeave != null) {
        const k = this.travLeave ?? 0;
        travelerSpots(!!village.pier).forEach(([fx, fy], i) => {
          const x = (fx - k * 0.3) * W, y = fy * H;
          items.push([y, () => {
            ctx.globalAlpha = 1 - k;
            const bob = k ? Math.abs(Math.sin(time * 8 + i)) * u * 0.008 : 0;
            drawPofi(ctx, x, y - bob, u * 0.085, { face: k ? -1 : 0, outfit: TRAVELERS[i], blink: ((time + i) % 3.1) < 0.12, lean: k ? Math.sin(time * 8 + i) * 0.08 : 0 });
            if (this.travCup) mug(ctx, x + u * 0.03, y - bob - u * 0.035, u * 0.016, time + i);
            ctx.globalAlpha = 1;
          }]);
        });
      }
      this.cocoaInfo = cocoa;
    }
    if (vl >= 10) for (const [fx, fy] of [[0.58, 0.71], [0.9, 0.86]]) items.push([fy * H, () => iceSculpture(ctx, fx * W, fy * H, u, time)]);
    this.slotPos = [];
    for (const sl of DECOR_SLOTS) {
      if (Math.floor(sl.at[0]) >= land) continue;
      const x = sl.at[0] * W, y = sl.at[1] * H;
      const pv = this.decorPreview?.slot === sl.id ? this.decorPreview.item : null;
      const item = pv || decor[sl.id];
      this.slotPos.push([sl.id, x, y - u * 0.03, u * 0.05]);
      if (item) items.push([y, () => { if (pv) ctx.globalAlpha = 0.85; drawDecor(ctx, x, y, u, item, time, night); ctx.globalAlpha = 1; }]);
      if (this.decorMode && (!item || this.decorSel === sl.id)) markers.push([x, y, this.decorSel === sl.id ? 'slotSel' : 'slot']);
    }
    if (villagers.length) {
      items.push([FIRE[1] * H, () => campfire(ctx, FIRE[0] * W, FIRE[1] * H, u, time, phase)]);
      this.stepVillagers(dt, villagers, phase, village, land);
      this.vpos = [];
      villagers.forEach((v, i) => {
        const st = this.vs.get(v.id);
        if (st.hidden) return;
        const size = u * (v.kid ? 0.068 : 0.088), x = st.x * W, y = st.y * H;
        this.vpos.push([v.id, x, y - size * 0.45, size * 0.6]);
        items.push([y, () => {
          const moving = !!st.route.length || (st.wander && st.wait <= 0);
          const bob = moving ? Math.abs(Math.sin(time * 8 + i)) * u * 0.008 : 0;
          drawPofi(ctx, x, y - bob, size, {
            face: moving ? st.face : st.act === 'fish' || st.act === 'warm' || st.act === 'queue' ? st.face : 0,
            outfit: v.outfit, blink: ((time + i) % 3.3) < 0.12,
            lean: moving ? Math.sin(time * 8 + i) * 0.08 : st.act === 'warm' ? 0.08 * st.face : 0,
            wave: st.act === 'warm' ? Math.max(0, Math.sin(time * 2 + i)) * 0.5 : 0,
          });
          if (st.act === 'fish' && !moving) rod(ctx, x, y, size, st.face, st.x > 1, time + i);
          if (task?.giver === v.id) taskMark(ctx, x, y - size * 1.05 - bob, u, time, task.done);
        }]);
      });
      if (phase === 'night') for (const id of ['igloo', 'hut']) if (village[id]) zzz(ctx, AT[id][0] * W, AT[id][1] * H - u * 0.2, u, time);
    }
    items.sort((a, b) => a[0] - b[0]);
    for (const [, draw] of items) draw();
    if (vl >= 8) this.bunting(ctx, W, H, u, time);
    this.lockRects = [];
    for (let i = land; i < n; i++) this.lockedPanel(ctx, i, W, H, u, time, vl);
    for (const [x, y, kind] of markers) {
      if (kind === 'cups') cupBubble(ctx, x, y, u, time, this.cocoaInfo);
      else if (kind === 'home') homeMarker(ctx, x, y, u, time);
      else if (kind === 'slot' || kind === 'slotSel') slotMarker(ctx, x, y, u, time, kind === 'slotSel');
      else upgradeMarker(ctx, x, y, u, time);
    }
    this.drawCoinFx(ctx, W, H, u, dt);
    this.drawSpeech(ctx, u, time);
    if (vl >= 12) this.lanterns(ctx, W, H, u, time);
    if (night > 0) {
      ctx.fillStyle = `rgba(20,24,60,${night * 0.25})`;
      ctx.fillRect(-W, -H, W * 3, H * 3);
    }
    ctx.restore();

    if (vl >= 2) this.snowfall(ctx, W, H, time);
    if (!this.focus && n > 1) this.panelNav(ctx, W, H, u, time);

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

  // Sıkıştırılmış kar patikalar: ana yol, her yapı yerine giden kol ve yapı temelleri.
  // x0-x1: yalnızca bu aralıktaki (bölgedeki) yapıların patikaları ve temelleri; ana yol aralığa kırpılır.
  paths(ctx, W, H, u, night, vl, x0 = -Infinity, x1 = Infinity) {
    const edge = mix('#cbd9e8', '#8a93b8', night), fill = mix('#e3ebf5', '#a9b1d0', night);
    const inRange = ([id, [fx]]) => fx >= x0 && fx < x1;
    const spurs = Object.entries(AT).filter(e => !NO_SPUR.has(e[0]) && inRange(e)).map(([, [fx, fy]]) => [fx, fy]);
    ctx.save();
    if (x0 > -Infinity) {
      ctx.beginPath();
      ctx.rect(x0 * W, 0, (x1 - x0) * W, H);
      ctx.clip();
    }
    const stroke = w => {
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      PROMENADE.forEach(([x, y], i) => (i ? ctx.lineTo(x * W, y * H) : ctx.moveTo(x * W, y * H)));
      ctx.stroke();
      ctx.lineWidth = w * 0.55;
      for (const [fx, fy] of spurs) {
        const py = promenadeY(fx);
        ctx.beginPath();
        ctx.moveTo(fx * W, py * H);
        // tepedeki yapılara giden patika kıvrılarak çıkar
        ctx.quadraticCurveTo((fx + (fx > 0.5 ? -0.04 : 0.04)) * W, ((py + fy) / 2) * H, fx * W, fy * H);
        ctx.stroke();
      }
    };
    ctx.strokeStyle = edge;
    stroke(u * 0.06);
    ctx.strokeStyle = fill;
    stroke(u * 0.045);
    // Köy Lv4: ana yola taş döşenir
    if (vl >= 4) {
      ctx.fillStyle = mix('#e4dccb', '#9d9aa8', night);
      for (let k = 0; k < 14; k++) {
        const x = 0.14 + k * 0.057;
        ellipse(ctx, x * W, promenadeY(x) * H, u * 0.017, u * 0.008);
        ctx.fill();
      }
    }
    // temeller: her yapının sabit yeri (suyun üstündekilerin temeli yok)
    for (const e of Object.entries(AT)) {
      const [id, [fx, fy]] = e;
      if (NO_PAD.has(id) || !inRange(e)) continue;
      ctx.fillStyle = fill;
      ellipse(ctx, fx * W, fy * H, u * 0.1, u * 0.026);
      ctx.fill();
      ctx.strokeStyle = edge;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();
  }

  // Bölge zemini (i ≥ 1). snow verilirse görsel zeminin rengiyle kar ve yollar da çizilir;
  // verilmezse (kod çizimi) yalnızca bölgeye özgü su eklenir, yollar paths() ile zaten çizilmiştir.
  districtGround(ctx, i, W, H, u, night, vl, snow) {
    const x0 = i * W;
    // arazinin kendi zemin görseli varsa (yol, temeller ve deniz çizili) onu kullan
    const img = snow && DISTRICTS[i]?.ground && art(`bg_ground_${DISTRICTS[i].id}`);
    if (img) { ctx.drawImage(img, x0, 0, W, H); return; }
    if (snow) {
      ctx.fillStyle = mix(snow, '#c3cbe6', night);
      ctx.fillRect(x0, H * 0.38, W, H * 0.62);
      // önceki panelin görsel zeminiyle dikişi yumuşat
      const sc = mix(snow, '#c3cbe6', night), seam = ctx.createLinearGradient(x0 - W * 0.08, 0, x0, 0);
      seam.addColorStop(0, sc.replace('rgb(', 'rgba(').replace(')', ',0)'));
      seam.addColorStop(1, sc);
      ctx.fillStyle = seam;
      ctx.fillRect(x0 - W * 0.08, H * 0.39, W * 0.08, H * 0.61);
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      for (let k = 0; k < 5; k++) {
        ellipse(ctx, x0 + W * (0.1 + k * 0.2), H * (0.47 + (k % 2) * 0.05), u * 0.06, u * 0.015);
        ctx.fill();
      }
      this.paths(ctx, W, H, u, night, vl, i, i + 1);
    }
    if (DISTRICTS[i]?.id === 'harbor') {
      // liman: alt kenarda deniz, kıyıda buz kenarı ve yüzen buz parçaları
      ctx.fillStyle = mix('#3f93d9', '#2c4f86', night);
      ctx.beginPath();
      ctx.moveTo(x0 + W * 0.26, H);
      ctx.quadraticCurveTo(x0 + W * 0.36, H * 0.87, x0 + W * 0.5, H * 0.865);
      ctx.lineTo(x0 + W * 1.02, H * 0.855);
      ctx.lineTo(x0 + W * 1.02, H);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.85)';
      ctx.lineWidth = u * 0.012;
      ctx.beginPath();
      ctx.moveTo(x0 + W * 0.26, H);
      ctx.quadraticCurveTo(x0 + W * 0.36, H * 0.87, x0 + W * 0.5, H * 0.865);
      ctx.lineTo(x0 + W * 1.02, H * 0.855);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      for (const [fx, fy, r] of [[0.42, 0.95, 0.03], [0.86, 0.92, 0.025], [0.95, 0.97, 0.02]]) {
        ellipse(ctx, x0 + W * fx, H * fy, u * r, u * r * 0.4);
        ctx.fill();
      }
    }
  }

  // Açılmamış bölge: üstünde sis, ortada fiyat ve şartı yazan tabela.
  lockedPanel(ctx, i, W, H, u, t, vl) {
    const d = DISTRICTS[i], x0 = i * W;
    ctx.fillStyle = 'rgba(236,244,252,.74)';
    ctx.fillRect(x0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    for (let k = 0; k < 6; k++) {
      const cx = x0 + W * ((k * 0.19 + t * 0.01) % 1.05), cy = H * (0.3 + (k % 3) * 0.2);
      ellipse(ctx, cx, cy, u * 0.16, u * 0.05);
      ctx.fill();
    }
    const bx = x0 + W / 2, by = H * 0.6, bw = u * 0.62, bh = u * 0.24;
    ctx.fillStyle = '#7a5434';
    ctx.fillRect(bx - u * 0.012, by, u * 0.024, u * 0.16);
    ctx.fillStyle = '#9a6a42';
    roundRect(ctx, bx - bw / 2, by - bh, bw, bh, u * 0.03);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx - bw / 2 + u * 0.02, by - bh - u * 0.008, bw - u * 0.04, u * 0.016);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff6e6';
    ctx.font = `700 ${Math.round(u * 0.06)}px Fredoka, sans-serif`;
    ctx.fillText(d.name, bx, by - bh * 0.68);
    ctx.font = `600 ${Math.round(u * 0.042)}px Fredoka, sans-serif`;
    const line = d.soon ? 'Yakında' : vl < d.vl ? `Köy Lv${d.vl}'te açılır` : `Aç · ${d.price} coin`;
    ctx.fillStyle = !d.soon && vl >= d.vl ? '#ffd166' : '#f3e2c8';
    ctx.fillText(line, bx, by - bh * 0.3);
    this.lockRects.push([i, bx - bw / 2, by - bh, bx + bw / 2, by + u * 0.16]);
  }

  // Panel okları (sağ/sol kenar) ve hangi panelde olunduğunu gösteren noktalar; ekran koordinatında.
  panelNav(ctx, W, H, u, t) {
    const cur = Math.round(this.sx / W), n = this.panels;
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const arrow = (x, dir) => {
      const y = H / 2 + Math.sin(t * 3) * 2;
      ctx.fillStyle = 'rgba(29,53,87,.45)';
      circle(ctx, x, y, 15);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - dir * 4, y - 7);
      ctx.lineTo(x + dir * 4, y);
      ctx.lineTo(x - dir * 4, y + 7);
      ctx.stroke();
    };
    if (cur < n - 1) arrow(W - 20, 1);
    if (cur > 0) arrow(20, -1);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i === cur ? '#ffffff' : 'rgba(255,255,255,.5)';
      circle(ctx, W / 2 + (i - (n - 1) / 2) * 14, H - 10, i === cur ? 4 : 3);
      ctx.fill();
    }
    ctx.restore();
  }

  // Kurulmamış ama açık yapı yeri: temel üstünde kazıklar, ip ve tabela; parası yetiyorsa zıplayan "!"
  plot(ctx, x, y, u, t, ready, focused) {
    if (focused) {
      ctx.fillStyle = 'rgba(255,209,102,.45)';
      ellipse(ctx, x, y, u * 0.1, u * 0.026);
      ctx.fill();
    }
    // dört köşede kazık, aralarında ip: "burası inşaat yeri"
    const corners = [[-0.07, -0.012], [0.07, -0.012], [0.07, 0.012], [-0.07, 0.012]];
    ctx.strokeStyle = '#c99a5b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    corners.forEach(([cx, cy], i) => (i ? ctx.lineTo(x + cx * u, y + cy * u - u * 0.012) : ctx.moveTo(x + cx * u, y + cy * u - u * 0.012)));
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = '#8a5a34';
    for (const [cx, cy] of corners) ctx.fillRect(x + cx * u - 1, y + cy * u - u * 0.02, 2, u * 0.02);
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
    const full = `bld_lights_s${o.style}_lv${o.lvFull}`;
    const key = o.lvFull >= 4 && art(full) ? full : `bld_lights_s${o.style}_lv${o.lv}`;
    const im = o.col ? tinted(key, o.col, { all: true }) : art(key);
    if (im) {
      // görselde ip 8. pikselden 1528. piksele uzanır, kancalar ≈ 50. satırda; fenerler arka sıradaki
      // yapıların önüne sarkmasın diye ip kod çizimine göre biraz yukarı asılır
      const k = (W * 0.72) / 1520;
      ctx.drawImage(im, W * 0.14 - 8 * k, y - u * 0.07 - 50 * k, 1536 * k, 384 * k);
      return;
    }
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

// Kakao fincanı (kırmızı, beyaz şeritli, buharlı).
function mug(ctx, x, y, r, t) {
  ctx.fillStyle = '#e5484d';
  roundRect(ctx, x - r, y - r, r * 2, r * 2.1, r * 0.35);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - r, y - r * 0.15, r * 2, r * 0.4);
  ctx.strokeStyle = '#e5484d';
  ctx.lineWidth = Math.max(1, r * 0.35);
  ctx.beginPath();
  ctx.arc(x + r * 1.05, y + r * 0.1, r * 0.5, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.8)';
  ctx.lineWidth = Math.max(1, r * 0.25);
  ctx.beginPath();
  const sw = Math.sin(t * 3) * r * 0.3;
  ctx.moveTo(x, y - r * 1.2);
  ctx.quadraticCurveTo(x + r * 0.5 + sw, y - r * 1.8, x - sw, y - r * 2.4);
  ctx.stroke();
}

// Pofi'nin taşıdığı tepsi: üstünde üç fincan.
function tray(ctx, x, y, w, t) {
  ctx.fillStyle = '#9a6a42';
  ellipse(ctx, x, y, w * 0.55, w * 0.14);
  ctx.fill();
  for (let i = -1; i <= 1; i++) mug(ctx, x + i * w * 0.3, y - w * 0.16, w * 0.11, t + i);
}

// Stantın yanında biriken fincan balonu; doluysa turuncu.
function cupBubble(ctx, x, y, u, t, info) {
  const full = info.cups >= info.cap;
  const b = Math.sin(t * 3) * u * 0.006;
  const w = u * 0.13, h = u * 0.065;
  ctx.fillStyle = full ? '#ff8a3d' : '#ffffff';
  roundRect(ctx, x - w / 2, y - h + b, w, h, h / 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - u * 0.012, y + b);
  ctx.lineTo(x, y + u * 0.018 + b);
  ctx.lineTo(x + u * 0.012, y + b);
  ctx.fill();
  mug(ctx, x - w * 0.24, y - h * 0.45 + b, u * 0.012, t);
  ctx.fillStyle = full ? '#ffffff' : '#1d3557';
  ctx.font = `700 ${Math.round(u * 0.036)}px Fredoka, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(info.cups), x + w * 0.14, y - h / 2 + b + 1);
}

// Gökyüzü gibi tam panel görseller: tek sıradaki paneller aynalanır, böylece kenarlar dikişsiz birleşir.
function panelImage(ctx, im, i, W, H) {
  if (i % 2 === 0) { ctx.drawImage(im, i * W, 0, W, H); return; }
  ctx.save();
  ctx.translate((i + 1) * W, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(im, 0, 0, W, H);
  ctx.restore();
}

// Görseldeki bir noktanın rengi (zemin katmanının kar rengiyle kodla çizilen bölgeyi eşlemek için).
const colorCache = new Map();
function sampleColor(im, fx, fy, fallback) {
  const key = im.src + fx + fy;
  if (!colorCache.has(key)) {
    let col = fallback;
    try {
      const c = document.createElement('canvas');
      c.width = c.height = 1;
      const x = c.getContext('2d');
      x.drawImage(im, Math.floor(im.width * fx), Math.floor(im.height * fy), 1, 1, 0, 0, 1, 1);
      const [r, g, b] = x.getImageData(0, 0, 1, 1).data;
      col = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    } catch { /* örneklenemezse varsayılan */ }
    colorCache.set(key, col);
  }
  return colorCache.get(key);
}

// İçine coin'le eşya alınabilecek yapı: sarı daire içinde küçük ev.
function homeMarker(ctx, x, y, u, t) {
  const b = Math.abs(Math.sin(t * 3 + 1)) * u * 0.012, r = u * 0.03;
  y -= b;
  ctx.fillStyle = '#ffb400';
  circle(ctx, x, y, r);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.55, y);
  ctx.lineTo(x, y - r * 0.55);
  ctx.lineTo(x + r * 0.55, y);
  ctx.fill();
  ctx.fillRect(x - r * 0.38, y, r * 0.76, r * 0.45);
}

// Kamp ateşi: taş halka ve kütükler hep durur; akşam alev, gece kor yanar.
function campfire(ctx, x, y, u, t, phase) {
  ctx.fillStyle = '#8f9bb0';
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    ellipse(ctx, x + Math.cos(a) * u * 0.035, y + Math.sin(a) * u * 0.012, u * 0.01, u * 0.007);
    ctx.fill();
  }
  ctx.fillStyle = '#7a4a2e';
  ellipse(ctx, x, y - u * 0.004, u * 0.028, u * 0.006, 0.4);
  ctx.fill();
  ellipse(ctx, x, y - u * 0.004, u * 0.028, u * 0.006, -0.4);
  ctx.fill();
  if (phase !== 'evening' && phase !== 'night') return;
  const big = phase === 'evening' ? 1 : 0.45;
  glow(ctx, x, y - u * 0.02, u * 0.12 * big, '#ffb347', 0.35 * big);
  for (let k = 0; k < 3; k++) {
    const f = 1 + Math.sin(t * 9 + k * 2) * 0.15, h = u * 0.05 * big * f * (k === 1 ? 1.2 : 0.8);
    ctx.fillStyle = ['#ff8a3d', '#ffd166', '#ff8a3d'][k];
    ctx.beginPath();
    const bx = x + (k - 1) * u * 0.01;
    ctx.moveTo(bx - u * 0.012 * big, y - u * 0.006);
    ctx.quadraticCurveTo(bx, y - h * 1.3, bx + u * 0.012 * big, y - u * 0.006);
    ctx.fill();
  }
}

// Olta: elden göle/denize uzanan ip, suda inip kalkan şamandıra.
function rod(ctx, x, y, size, face, sea, t) {
  const dir = face || 1;
  const hx = x + dir * size * 0.28, hy = y - size * 0.45;
  const tx = hx + dir * size * 0.45, ty = hy - size * 0.35;
  const wx = sea ? x + size * 0.25 : x + dir * size * 0.9, wy = y + size * (sea ? 0.45 : 0.25) + Math.sin(t * 3) * size * 0.03;
  ctx.strokeStyle = '#7a4a2e';
  ctx.lineWidth = Math.max(1.5, size * 0.04);
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.quadraticCurveTo((tx + wx) / 2, ty, wx, wy);
  ctx.stroke();
  ctx.fillStyle = '#e5484d';
  circle(ctx, wx, wy, Math.max(1.5, size * 0.05));
  ctx.fill();
}

// Günlük iş işareti: sarı "!" (iş var) ya da yeşil "✓" (bitti, ödül bekliyor).
function taskMark(ctx, x, y, u, t, done) {
  const b = Math.abs(Math.sin(t * 3)) * u * 0.01, r = u * 0.026;
  ctx.fillStyle = done ? '#3cc977' : '#ffb400';
  circle(ctx, x, y - b, r);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${Math.round(u * 0.036)}px Fredoka, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(done ? '✓' : '!', x, y - b + 1);
}

// Gece uyuyan köylülerin evlerinin üstünde yükselen "z"ler.
function zzz(ctx, x, y, u, t) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let k = 0; k < 3; k++) {
    const f = (t * 0.35 + k / 3) % 1;
    ctx.globalAlpha = Math.sin(f * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.round(u * (0.03 + f * 0.025))}px Fredoka, sans-serif`;
    ctx.fillText('z', x + Math.sin(f * 6 + k) * u * 0.02 + f * u * 0.04, y - f * u * 0.12);
  }
  ctx.globalAlpha = 1;
}

// Süsleme modunda süs yeri: boşsa kesik çizgili daire ve "+", seçiliyse turuncu.
function slotMarker(ctx, x, y, u, t, sel) {
  ctx.save();
  ctx.setLineDash([4, 3]);
  ctx.lineDashOffset = -t * 10;
  ctx.strokeStyle = sel ? '#ff8a3d' : 'rgba(29,53,87,.6)';
  ctx.lineWidth = 2;
  ctx.fillStyle = sel ? 'rgba(255,138,61,.18)' : 'rgba(255,255,255,.55)';
  ellipse(ctx, x, y, u * 0.04, u * 0.016);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  if (sel) return;
  ctx.fillStyle = 'rgba(29,53,87,.7)';
  ctx.font = `700 ${Math.round(u * 0.04)}px Fredoka, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+', x, y - u * 0.03 + Math.sin(t * 3) * u * 0.004);
}

// Süsler (kodla çizilir; taban ortası (x, y)).
// Süs görselleri (pofi-r7): 256×256, taban 248. satırda, hepsi aynı ölçekte; fenerin boyu (240 px) u×0.1 olur.
export function drawDecor(ctx, x, y, u, id, t, night = 0) {
  const im = art(`decor_${id}`);
  if (im) {
    const k = (u * 0.1) / 240;
    ctx.drawImage(im, x - 128 * k, y - 248 * k, 256 * k, 256 * k);
    if (night > 0 && (id === 'lantern' || id === 'aurora')) glow(ctx, x, y - u * 0.085, u * 0.05, id === 'lantern' ? '#ffe7a8' : '#7fe0d0', night * 0.45);
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(29,53,87,.12)';
  ellipse(ctx, 0, 0, u * 0.03, u * 0.008);
  ctx.fill();
  if (id === 'fence') {
    ctx.fillStyle = '#9a6a42';
    for (const px of [-0.03, 0, 0.03]) ctx.fillRect(px * u - u * 0.004, -u * 0.035, u * 0.008, u * 0.035);
    ctx.fillRect(-u * 0.035, -u * 0.028, u * 0.07, u * 0.006);
    ctx.fillRect(-u * 0.035, -u * 0.014, u * 0.07, u * 0.006);
    ctx.fillStyle = '#ffffff';
    for (const px of [-0.03, 0, 0.03]) { ellipse(ctx, px * u, -u * 0.036, u * 0.006, u * 0.003); ctx.fill(); }
  } else if (id === 'snowballs') {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#c9dbee';
    ctx.lineWidth = 1;
    for (const [bx, by, r] of [[-0.012, -0.008, 0.01], [0.01, -0.008, 0.01], [0, -0.022, 0.009]]) { circle(ctx, bx * u, by * u, r * u); ctx.fill(); ctx.stroke(); }
  } else if (id === 'lantern') {
    ctx.fillStyle = '#1d3557';
    ctx.fillRect(-u * 0.003, -u * 0.07, u * 0.006, u * 0.07);
    ctx.fillRect(-u * 0.01, -u * 0.072, u * 0.02, u * 0.004);
    ctx.fillStyle = '#ffd98a';
    roundRect(ctx, -u * 0.008, -u * 0.088, u * 0.016, u * 0.016, u * 0.003);
    ctx.fill();
    glow(ctx, 0, -u * 0.08, u * 0.04, '#ffe7a8', 0.25 + night * 0.4);
  } else if (id === 'bench') {
    ctx.fillStyle = '#7a4a2e';
    ctx.fillRect(-u * 0.03, -u * 0.018, u * 0.06, u * 0.006);
    ctx.fillRect(-u * 0.03, -u * 0.032, u * 0.06, u * 0.006);
    ctx.fillRect(-u * 0.026, -u * 0.018, u * 0.005, u * 0.018);
    ctx.fillRect(u * 0.021, -u * 0.018, u * 0.005, u * 0.018);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-u * 0.03, -u * 0.035, u * 0.06, u * 0.004);
  } else if (id === 'pine') {
    ctx.fillStyle = '#7a4a2e';
    ctx.fillRect(-u * 0.004, -u * 0.012, u * 0.008, u * 0.012);
    for (let k = 0; k < 3; k++) {
      ctx.fillStyle = '#2f7d4a';
      ctx.beginPath();
      ctx.moveTo(-u * (0.026 - k * 0.005), -u * (0.012 + k * 0.016));
      ctx.lineTo(0, -u * (0.04 + k * 0.016));
      ctx.lineTo(u * (0.026 - k * 0.005), -u * (0.012 + k * 0.016));
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-u * (0.012 - k * 0.003), -u * (0.03 + k * 0.016), u * (0.024 - k * 0.006), u * 0.003);
    }
  } else if (id === 'flag') {
    ctx.fillStyle = '#c9d2dc';
    ctx.fillRect(-u * 0.003, -u * 0.09, u * 0.006, u * 0.09);
    ctx.fillStyle = '#e5484d';
    const w = Math.sin(t * 4) * u * 0.004;
    ctx.beginPath();
    ctx.moveTo(u * 0.003, -u * 0.088);
    ctx.quadraticCurveTo(u * 0.02, -u * 0.084 + w, u * 0.038, -u * 0.08);
    ctx.lineTo(u * 0.038, -u * 0.06);
    ctx.quadraticCurveTo(u * 0.02, -u * 0.064 - w, u * 0.003, -u * 0.068);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    circle(ctx, u * 0.018, -u * 0.074, u * 0.004);
    ctx.fill();
  } else if (id === 'statue') {
    ctx.fillStyle = '#cfe9ff';
    ctx.fillRect(-u * 0.016, -u * 0.012, u * 0.032, u * 0.012);
    ctx.fillStyle = 'rgba(160,215,255,.95)';
    ctx.beginPath();
    ctx.ellipse(0, -u * 0.035, u * 0.014, u * 0.024, 0, 0, Math.PI * 2);
    ctx.fill();
    circle(ctx, 0, -u * 0.064, u * 0.011);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.6 + Math.sin(t * 3) * 0.3;
    circle(ctx, -u * 0.005, -u * 0.068, u * 0.003);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (id === 'aurora') {
    ctx.fillStyle = '#1d3557';
    ctx.fillRect(-u * 0.003, -u * 0.075, u * 0.006, u * 0.075);
    const cols = ['#3cdc9a', '#4fb3ff', '#8f5bd6'], c = cols[Math.floor(t * 1.5) % 3];
    ctx.fillStyle = c;
    circle(ctx, 0, -u * 0.084, u * 0.011);
    ctx.fill();
    glow(ctx, 0, -u * 0.084, u * 0.05, c, 0.3 + night * 0.4);
  }
  ctx.restore();
}
