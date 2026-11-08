// Test saati: gizli test panelinden (Ayarlar > sürüm yazısına 7 dokunuş) oyunun saati ileri alınabilir.
// Günlük ödül, sipariş, festival, tüccar, köy gece/gündüz ve kakao birikimi gibi her şey aynı saati görür.
// Kayma yalnızca bu cihazda tutulur (pofi.dev.v1), kayda girmez. Kayma yoksa Date'e dokunulmaz.
// main.js'in ilk import'u: başka modüller saat okumadan önce yüklenir. Kayma değişince sayfa yeniden yüklenir.
const KEY = 'pofi.dev.v1';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
export const devState = read();
export function setDev(patch) {
  Object.assign(devState, patch);
  try { localStorage.setItem(KEY, JSON.stringify(devState)); } catch { /* yer yoksa tutulmaz */ }
}

export const clockShift = Number.isFinite(+devState.shift) ? +devState.shift : 0;
if (clockShift) {
  const RealDate = Date;
  globalThis.Date = class extends RealDate {
    constructor(...a) { if (a.length) super(...a); else super(RealDate.now() + clockShift); }
    static now() { return RealDate.now() + clockShift; }
  };
}

// "+1 gün 3 saat" gibi kısa yazı
export function shiftText(ms = clockShift) {
  const h = Math.round(ms / 36e5), d = Math.trunc(h / 24), r = h % 24;
  return [d && `${d > 0 ? '+' : ''}${d} gün`, r && `${!d && r > 0 ? '+' : ''}${r} saat`].filter(Boolean).join(' ') || 'yok';
}
