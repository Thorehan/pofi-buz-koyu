// Hata günlüğü: oyunda yakalanan hatalar yalnızca bu cihazda tutulur (son 30 kayıt), sunucuya gitmez.
// Oyuncu ya da test eden kişi Ayarlar > Hata kaydı'ndan metni kopyalayıp gönderir.
// Aynı hata art arda gelirse yeni satır açılmaz, sayacı artar (kare döngüsünde tekrarlayan hata günlüğü doldurmasın).
// main.js'te ilk import olarak yüklenir ki açılışta çıkan hatalar da yakalansın.
const KEY = 'pofi.err.v1';
const MAX = 30;
let context = () => ({});

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function write(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* yer yoksa tutulmaz */ }
}

// O anki ekran ve level gibi bilgiler (main.js verir).
export function setErrContext(fn) { context = fn; }

export function logError(message, stack = '') {
  const list = read(), last = list[list.length - 1];
  const m = String(message || 'Bilinmeyen hata').slice(0, 300);
  const s = String(stack || '').split('\n').slice(0, 4).map(x => x.trim()).filter(Boolean).join(' | ').slice(0, 400);
  if (last && last.m === m && last.s === s) {
    last.n = (last.n || 1) + 1;
    last.t = Date.now();
  } else {
    let c = {};
    try { c = context() || {}; } catch { /* bağlam alınamazsa boş kalır */ }
    list.push({ t: Date.now(), m, s, n: 1, ...c });
    while (list.length > MAX) list.shift();
  }
  write(list);
}

export const errList = () => read();
export function clearErrors() { write([]); }

// Kopyalanacak düz metin: sürüm, ekran boyutu, tarayıcı ve her hata.
export function errText() {
  const list = read(), ver = document.querySelector('.version')?.textContent || '';
  const head = [`Pofi: Buz Köyü ${ver} · hata kaydı · ${list.length} kayıt`, `Ekran ${innerWidth}x${innerHeight} · ${navigator.userAgent}`];
  const rows = list.map((e, i) => {
    const when = new Date(e.t).toLocaleString('tr-TR');
    const where = [e.ekran && `ekran: ${e.ekran}`, e.level && `level: ${e.level}`, e.oyun && `oynanan: ${e.oyun}`].filter(Boolean).join(', ');
    return `${i + 1}. ${when}${e.n > 1 ? ` (x${e.n})` : ''}${where ? ` [${where}]` : ''}\n   ${e.m}${e.s ? `\n   ${e.s}` : ''}`;
  });
  return [...head, '', ...rows].join('\n');
}

addEventListener('error', e => {
  if (e.target && e.target !== window) return; // görsel ya da ses yüklenemedi: oyun bunu zaten yedekle karşılar
  logError(e.message, e.error?.stack || `${e.filename || ''}:${e.lineno || ''}:${e.colno || ''}`);
}, true);
addEventListener('unhandledrejection', e => {
  const r = e.reason;
  logError(`Promise: ${r?.message || r}`, r?.stack);
});
