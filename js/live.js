// Canlı içerik: haftalık etkinlik ve arkadaş köyü ziyareti.
// Sunucu yok: etkinlik yerel saatten hesaplanır, köy bağlantının içine kodlanır.
import {
  EVENT_THEMES, EVENT_CALENDAR, EVENT_CALENDAR_START, EVENT_TOKENS, EVENT_BONUS, EVENT_TRACK, BUILDINGS, COLORS, WARDROBE,
} from './config.js';
import { generateLevel } from './engine.js';

const DAY = 864e5;
const CAL0 = new Date(...EVENT_CALENDAR_START); // takvimin ilk pazartesisi

const pad = n => String(n).padStart(2, '0');
const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Bu haftanın pazartesisi (yerel saat, 00:00)
function weekStart(now) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

// Takvim 52 haftada bir tekrar eder; takvimden önceki haftalar da aynı sıradan (yılın o dönemine denk) gelir.
export function currentEvent(now = new Date()) {
  const start = weekStart(now);
  const week = Math.round((start - CAL0) / (7 * DAY)); // yaz saati kaymasına karşı yuvarla
  // Test: ?etkinlik=valentine gibi bir tema zorlanabilir.
  const force = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('etkinlik') : null;
  const id = EVENT_THEMES[force] ? force : EVENT_CALENDAR[((week % EVENT_CALENDAR.length) + EVENT_CALENDAR.length) % EVENT_CALENDAR.length];
  const ends = new Date(start);
  ends.setDate(ends.getDate() + 7);
  return { id, ...EVENT_THEMES[id], key: `${keyOf(start)}:${id}`, week, ends };
}

// Hafta değişince kalan jeton coin'e çevrilir (P.eventNote ile oyuncuya söylenir) ve ilerleme sıfırlanır.
// base: etkinlik levellerinin zorluğu hafta başındaki seviyeden sabitlenir.
export function ensureEvent(P) {
  const ev = currentEvent();
  if (!P.event || P.event.key !== ev.key) {
    const old = P.event;
    if (old && old.tokens > 0 && String(old.key).includes(':')) {
      const coins = old.tokens * EVENT_TOKENS.coinRate;
      P.coins += coins;
      P.eventNote = { name: old.name, tokens: old.tokens, coins };
    }
    P.event = {
      key: ev.key, name: ev.name, earned: 0, tokens: 0, claimed: [], done: {}, bought: {},
      base: Math.max(12, Math.min(700, (P.level || 1) - 6)),
    };
  }
  return ev;
}

export function timeLeft(ends, now = new Date()) {
  const ms = Math.max(0, ends - now);
  const d = Math.floor(ms / DAY), h = Math.floor((ms % DAY) / 36e5), m = Math.floor((ms % 36e5) / 6e4);
  return d ? `${d}g ${h}s` : h ? `${h}s ${m}dk` : `${m}dk`;
}

export function addTokens(P, n) {
  P.event.earned += n;
  P.event.tokens += n;
  return n;
}

// Bir level bitince kazanılan jeton: taban + yıldız + temanın bonusu.
export function levelTokens(ev, { stars, fish, daily, hintsUsed, eventLevel, firstClear }) {
  let t = eventLevel
    ? (firstClear ? EVENT_TOKENS.eventLevel + stars * EVENT_TOKENS.eventStar : EVENT_TOKENS.replay)
    : EVENT_TOKENS.level + stars * EVENT_TOKENS.star + (daily ? EVENT_TOKENS.daily : 0);
  if (ev.bonus === 'fish') t += fish * EVENT_BONUS.fish;
  if (ev.bonus === 'star3' && stars === 3) t += EVENT_BONUS.star3;
  if (ev.bonus === 'nohint' && !hintsUsed) t += EVENT_BONUS.nohint;
  if (ev.bonus === 'daily' && daily) t += EVENT_BONUS.daily;
  return t;
}

export const BONUS_TEXT = {
  fish: `Topladığın her balık +${EVENT_BONUS.fish} jeton`,
  star3: `3 yıldızla bitirdiğin her level +${EVENT_BONUS.star3} jeton`,
  nohint: `İpucu kullanmadan bitirdiğin her level +${EVENT_BONUS.nohint} jeton`,
  daily: `Günlük bulmaca +${EVENT_BONUS.daily} jeton`,
  visit: `Arkadaş köyü ziyareti +${EVENT_BONUS.visit} jeton`,
};

export const claimable = P => EVENT_TRACK.map((m, i) => i).filter(i => P.event.earned >= EVENT_TRACK[i].pts && !P.event.claimed.includes(i));
export const nextMilestone = P => EVENT_TRACK.find(m => P.event.earned < m.pts) || null;

// Etkinlik kıyafeti: { slot, id, name } ya da tema kıyafetsizse null.
export function prizeOf(ev) {
  if (!ev.prize) return null;
  const slot = ev.prize.hat ? 'hat' : 'scarf';
  const id = ev.prize[slot];
  return { slot, id, name: WARDROBE[slot].find(x => x.id === id).name };
}

// Etkinlik leveli k (0'dan): hafta başındaki seviyeye yakın zorluk, haftaya özel tohum, temanın kuralı.
// Oyunda anlık üretilir ve oturum boyunca saklanır.
const evLevels = new Map();
export function eventLevelDef(ev, k, base) {
  const key = `${ev.key}:${k}:${base}`;
  if (!evLevels.has(key)) {
    const def = generateLevel(base + k * 2, { seed: (ev.week + 5000) * 97 + k * 13 + 1, rule: ev.rule, maxAttempts: 3000 });
    if (ev.rule?.limit) def.limit = def.limit ? Math.min(def.limit, def.min + 3) : def.min + 3;
    evLevels.set(key, { ...def, n: 10000 + k });
  }
  return evLevels.get(key);
}

// ---------- köy paylaşımı ----------
// Bağlantıya yalnızca görünüm bilgisi girer: ad, yapı seviyesi/stil/renk, kıyafet. Coin vb. paylaşılmaz.
export function encodeVillage(P) {
  const data = {
    n: P.profile?.name || 'Kaşif',
    ...(P.villageName ? { k: P.villageName } : {}),
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
    const vname = typeof d.k === 'string' ? d.k.replace(/[\u0000-\u001f]/g, '').slice(0, 18) : '';
    return { name, vname, village, outfit };
  } catch {
    return null;
  }
}

// Bağlantıdan ya da yapıştırılan metinden kodu çıkar.
export function extractCode(text) {
  const m = String(text).match(/ziyaret=([A-Za-z0-9_-]+)/);
  return m ? m[1] : String(text).trim();
}
