// Canlı içerik: haftalık etkinlik ve arkadaş köyü ziyareti.
// Sunucu yok: etkinlik yerel saatten hesaplanır, köy bağlantının içine kodlanır.
import { EVENTS, EVENT_POINTS, EVENT_TRACK, BUILDINGS, COLORS, WARDROBE } from './config.js';

const DAY = 864e5;
const EPOCH = new Date(2026, 0, 5); // bir pazartesi: tema sırasının başlangıcı

const pad = n => String(n).padStart(2, '0');
const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Bu haftanın pazartesisi (yerel saat, 00:00)
function weekStart(now) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export function currentEvent(now = new Date()) {
  const start = weekStart(now);
  const week = Math.round((start - EPOCH) / (7 * DAY)); // yaz saati kaymasına karşı yuvarla
  const ev = EVENTS[((week % EVENTS.length) + EVENTS.length) % EVENTS.length];
  const ends = new Date(start);
  ends.setDate(ends.getDate() + 7);
  return { ...ev, key: `${ev.id}-${keyOf(start)}`, ends };
}

// Hafta değişince ilerleme sıfırlanır (alınmamış ödüller de gider).
export function ensureEvent(P) {
  const ev = currentEvent();
  if (!P.event || P.event.key !== ev.key) P.event = { key: ev.key, points: 0, claimed: [] };
  return ev;
}

export function timeLeft(ends, now = new Date()) {
  const ms = Math.max(0, ends - now);
  const d = Math.floor(ms / DAY), h = Math.floor((ms % DAY) / 36e5), m = Math.floor((ms % 36e5) / 6e4);
  return d ? `${d}g ${h}s` : h ? `${h}s ${m}dk` : `${m}dk`;
}

// Bir level bitince kazanılan etkinlik puanı: taban + yıldız + temanın odak bonusu.
export function eventPoints(ev, { stars, fish, daily, hintsUsed }) {
  let pts = EVENT_POINTS.level + stars * EVENT_POINTS.star + (daily ? EVENT_POINTS.daily : 0);
  if (ev.id === 'fish') pts += fish * 5;
  if (ev.id === 'flake' && stars === 3) pts += 15;
  if (ev.id === 'sled' && daily) pts += 60;
  if (ev.id === 'aurora' && !hintsUsed) pts += 15;
  return pts;
}

export const claimable = P => EVENT_TRACK.map((m, i) => i).filter(i => P.event.points >= EVENT_TRACK[i].pts && !P.event.claimed.includes(i));
export const nextMilestone = P => EVENT_TRACK.find(m => P.event.points < m.pts) || null;

// Etkinlik kıyafeti: { slot, id, name }
export function prizeOf(ev) {
  const slot = ev.reward.hat ? 'hat' : 'scarf';
  const id = ev.reward[slot];
  return { slot, id, name: WARDROBE[slot].find(x => x.id === id).name };
}

// ---------- köy paylaşımı ----------
// Bağlantıya yalnızca görünüm bilgisi girer: ad, yapı seviyesi/stil/renk, kıyafet. Coin vb. paylaşılmaz.
export function encodeVillage(P) {
  const data = {
    n: P.profile?.name || 'Kaşif',
    v: BUILDINGS.map(b => {
      const s = P.village[b.id];
      return s ? [s.lv, s.style, s.color ? COLORS.findIndex(c => c.id === s.color) + 1 : 0] : 0;
    }),
    o: [P.outfit.hat, P.outfit.scarf],
  };
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const clampInt = (x, lo, hi) => Math.max(lo, Math.min(hi, Math.floor(Number(x)) || 0));

// Başkasından gelen kod güvenilmez veridir: her alan doğrulanır, bilinmeyen değerler atılır.
export function decodeVillage(code) {
  try {
    if (typeof code !== 'string' || code.length > 2000) return null;
    const bin = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
    const d = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
    if (!d || !Array.isArray(d.v)) return null;
    const village = {};
    BUILDINGS.forEach((b, i) => {
      const e = d.v[i];
      if (!Array.isArray(e)) return;
      const ci = clampInt(e[2], 0, COLORS.length);
      village[b.id] = { lv: clampInt(e[0], 1, b.costs.length), style: clampInt(e[1], 0, b.styles.length - 1), color: ci ? COLORS[ci - 1].id : null };
    });
    const valid = (slot, id) => (WARDROBE[slot].some(x => x.id === id) ? id : 'none');
    const outfit = { hat: valid('hat', d.o?.[0]), scarf: valid('scarf', d.o?.[1]) };
    const name = String(d.n ?? 'Kaşif').replace(/[\u0000-\u001f]/g, '').slice(0, 16) || 'Kaşif';
    return { name, village, outfit };
  } catch {
    return null;
  }
}

// Bağlantıdan ya da yapıştırılan metinden kodu çıkar.
export function extractCode(text) {
  const m = String(text).match(/ziyaret=([A-Za-z0-9_-]+)/);
  return m ? m[1] : String(text).trim();
}
