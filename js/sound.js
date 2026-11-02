// Tüm sesler Web Audio ile kodda üretilir: dosya indirme yok, lisans derdi yok.
// Kayma hışırtısı, çarpma, buz çatlaması, su sıçraması; toplanan her balıkta pentatonik yükselen nota.

const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];

let ctx = null, master, sfxBus, ambBus, noiseBuf;
let sfxOn = true, ambientOn = true, ambientWanted = false, ambientNodes = null, dropTimer = 0;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.connect(master);
    ambBus = ctx.createGain();
    ambBus.gain.value = 0;
    ambBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return ctx;
}

// Tarayıcılar sesi ilk dokunuştan önce başlatmaz; her dokunuşta çağrılır.
export function unlock() {
  const c = ac();
  if (c && c.state === 'suspended' && !document.hidden) c.resume().then(syncAmbient);
}

document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend();
  else ctx.resume();
});

export function configure({ sfx, ambient }) {
  sfxOn = sfx;
  ambientOn = ambient;
  syncAmbient();
}

const ready = () => sfxOn && ctx && ctx.state === 'running';

function tone(freq, { type = 'sine', dur = 0.3, vol = 0.2, attack = 0.005, when = 0, slideTo = 0, dest = sfxBus } = {}) {
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise({ dur = 0.1, vol = 0.2, type = 'bandpass', freq = 1500, Q = 1, when = 0, sweepTo = 0 } = {}) {
  const t = ctx.currentTime + when;
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = noiseBuf;
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  f.Q.value = Q;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(sfxBus);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

// Marimba: temel ton + ~4 kat üst ses, hızlı sönüm.
function marimba(freq, when = 0, vol = 0.22) {
  tone(freq, { dur: 0.7, vol, when });
  tone(freq * 3.93, { dur: 0.12, vol: vol * 0.35, when });
  tone(freq * 2, { type: 'triangle', dur: 0.25, vol: vol * 0.15, when });
}

function bell(freq, when = 0, vol = 0.12) {
  tone(freq, { dur: 0.9, vol, when });
  tone(freq * 2.76, { dur: 0.4, vol: vol * 0.4, when });
}

const jitter = () => 0.94 + Math.random() * 0.12;

export const sfx = {
  // ---------- Pofi ----------
  slide(cells) {
    if (!ready() || cells < 1) return;
    noise({ dur: 0.07 * cells + 0.1, vol: 0.09, freq: 2600, Q: 0.9, sweepTo: 900 });
  },
  bump() {
    if (!ready()) return;
    tone(170, { type: 'triangle', dur: 0.13, vol: 0.18, slideTo: 95 });
    noise({ dur: 0.08, vol: 0.1, type: 'lowpass', freq: 500 });
  },
  fish(k) {
    if (!ready()) return;
    marimba(PENTA[Math.min(k, PENTA.length - 1)] * 1.5, 0, 0.18);
    bell(PENTA[Math.min(k, PENTA.length - 1)] * 3, 0.04, 0.05);
  },
  crack() {
    if (!ready()) return;
    [0, 0.03, 0.07].forEach(w => noise({ dur: 0.05, vol: 0.22, type: 'highpass', freq: 2800, when: w }));
    tone(1300, { type: 'triangle', dur: 0.12, vol: 0.06, slideTo: 500 });
  },
  splash() {
    if (!ready()) return;
    noise({ dur: 0.55, vol: 0.28, type: 'lowpass', freq: 1500, sweepTo: 250 });
    [0.1, 0.2, 0.32].forEach((w, i) => tone(320 + i * 90, { dur: 0.1, vol: 0.08, slideTo: 900 + i * 200, when: w }));
  },
  lever() {
    if (!ready()) return;
    noise({ dur: 0.03, vol: 0.2, freq: 3200, Q: 2 });
    tone(900, { type: 'triangle', dur: 0.06, vol: 0.12 });
    tone(680, { type: 'triangle', dur: 0.08, vol: 0.12, when: 0.09 });
    noise({ dur: 0.04, vol: 0.15, freq: 2400, Q: 2, when: 0.09 });
  },
  crate() {
    if (!ready()) return;
    tone(210, { type: 'triangle', dur: 0.1, vol: 0.2, slideTo: 150 });
    noise({ dur: 0.08, vol: 0.14, freq: 800, Q: 3 });
    noise({ dur: 0.35, vol: 0.05, freq: 1400, Q: 0.8, sweepTo: 700, when: 0.05 });
  },
  rotate() {
    if (!ready()) return;
    const j = jitter();
    noise({ dur: 0.045, vol: 0.22, freq: 1900 * j, Q: 1.6 });
    tone(330 * j, { type: 'triangle', dur: 0.07, vol: 0.12, slideTo: 230 * j });
  },
  locked() {
    if (!ready()) return;
    tone(150, { type: 'triangle', dur: 0.16, vol: 0.22, slideTo: 90 });
    noise({ dur: 0.08, vol: 0.12, type: 'lowpass', freq: 600 });
  },
  flow() {
    if (!ready()) return;
    const j = jitter();
    tone(420 * j, { dur: 0.14, vol: 0.14, slideTo: 980 * j });
    noise({ dur: 0.25, vol: 0.05, freq: 1200, Q: 0.8, sweepTo: 2600 });
  },
  bloom(k) {
    if (!ready()) return;
    marimba(PENTA[Math.min(k, PENTA.length - 1)]);
    tone(PENTA[Math.min(k, PENTA.length - 1)] * 4, { dur: 0.3, vol: 0.04, when: 0.05 });
  },
  wilt() {
    if (!ready()) return;
    tone(330, { dur: 0.4, vol: 0.14, slideTo: 165 });
    tone(247, { type: 'triangle', dur: 0.4, vol: 0.06, slideTo: 124, when: 0.05 });
  },
  win() {
    if (!ready()) return;
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => marimba(f, 0.15 + i * 0.09, 0.2));
    [2093, 2637, 3136].forEach((f, i) => bell(f, 0.62 + i * 0.07, 0.05));
    noise({ dur: 0.9, vol: 0.06, type: 'lowpass', freq: 400, sweepTo: 3000 });
  },
  star(i) {
    if (!ready()) return;
    bell(1046.5 * Math.pow(1.26, i), 0, 0.11);
  },
  coin() {
    if (!ready()) return;
    tone(1568, { type: 'triangle', dur: 0.09, vol: 0.11 });
    tone(2093, { type: 'triangle', dur: 0.22, vol: 0.11, when: 0.07 });
  },
  reward() {
    if (!ready()) return;
    [1046.5, 1318.51, 1567.98, 2093].forEach((f, i) => bell(f, i * 0.07, 0.08));
  },
  task() {
    if (!ready()) return;
    [523.25, 659.25, 783.99].forEach(f => marimba(f, 0, 0.13));
    for (let i = 0; i < 6; i++) bell(1567.98 * Math.pow(1.12, i), 0.12 + i * 0.05, 0.04);
  },
  fail() {
    if (!ready()) return;
    marimba(392, 0, 0.2);
    marimba(311.13, 0.18, 0.2);
  },
  ui() {
    if (!ready()) return;
    tone(620, { dur: 0.07, vol: 0.12, slideTo: 340 });
  },
  drop() {
    if (!ready()) return;
    tone(900, { dur: 0.12, vol: 0.16, slideTo: 1900 });
    noise({ dur: 0.18, vol: 0.05, freq: 2500, Q: 2 });
  },
};

// ---------- ortam: hafif kutup rüzgârı + ara sıra buz çınlaması ----------
export function setAmbient(on) {
  ambientWanted = on;
  syncAmbient();
}

function syncAmbient() {
  if (!ctx) return;
  const want = ambientWanted && ambientOn && ctx.state === 'running';
  if (want && !ambientNodes) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 500;
    bp.Q.value = 0.5;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.value = 0.04;
    const lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
    lfo.frequency.value = 0.09;
    lfoGain.gain.value = 0.025;
    lfo.connect(lfoGain).connect(g.gain);
    src.connect(bp).connect(lp).connect(g).connect(ambBus);
    src.start();
    lfo.start();
    ambientNodes = { src, lfo };
    scheduleDrop();
  }
  const t = ctx.currentTime;
  ambBus.gain.cancelScheduledValues(t);
  ambBus.gain.setTargetAtTime(want ? 1 : 0, t, 0.4);
  if (!want && ambientNodes) {
    const n = ambientNodes;
    ambientNodes = null;
    clearTimeout(dropTimer);
    setTimeout(() => { n.src.stop(); n.lfo.stop(); }, 1500);
  }
}

function scheduleDrop() {
  dropTimer = setTimeout(() => {
    if (!ambientNodes) return;
    const f = 2400 + Math.random() * 1400;
    tone(f, { dur: 0.5, vol: 0.02, dest: ambBus });
    tone(f * 2.76, { dur: 0.2, vol: 0.008, dest: ambBus });
    scheduleDrop();
  }, 2500 + Math.random() * 4000);
}
