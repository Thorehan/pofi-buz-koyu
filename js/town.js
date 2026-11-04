// Coin harcama yerlerinin hesapları (DOM yok): pazar takası, gezgin tüccar takvimi ve vitrini,
// evcil hayvan, köy projeleri ve gazete sayısı. Sunucu yok; takvim yerel saatten hesaplanır.
import { FLAKE_TRADE, MERCHANT, PET, PET_TOYS, PROJECTS, WARDROBE, DECOR_ITEMS, ALBUM } from './config.js';

const DAY = 864e5;
const pad = n => String(n).padStart(2, '0');
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const query = k => (typeof location !== 'undefined' ? new URLSearchParams(location.search).get(k) : null);

// Haftanın pazartesisi (yerel saat, 00:00). Gazetenin 1. sayısı 2 Kasım 2026 haftası.
function weekStart(now) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}
const GZ0 = new Date(2026, 10, 2);
export const weekIndex = (now = new Date()) => Math.round((weekStart(now) - GZ0) / (7 * DAY));
export const gazetteIssue = (now = new Date()) => weekIndex(now) + 1;

// ---------- pazar: coin → kar tanesi ----------
export const tradeN = P => (P.flakeTrade?.day === dayKey() ? P.flakeTrade.n : 0);
export const flakePrice = (n, k = 1) => Math.round((FLAKE_TRADE.base * FLAKE_TRADE.mult ** n * k) / FLAKE_TRADE.round) * FLAKE_TRADE.round;

// ---------- gezgin tüccar ----------
// Hafta w'deki geliş günleri (0 = pazartesi). Çift haftalarda iki gün, tek haftalarda bir gün; gün haftadan haftaya kayar.
export function merchantDays(w) {
  const a = (((w * 5 + 4) % 7) + 7) % 7;
  return w % 2 ? [a] : [a, (a + 3) % 7].sort((x, y) => x - y);
}
// Bugün limanda mı? Test: ?tuccar=1. visit: ziyaretin kimliği, no: vitrinin sırası.
export function merchantToday(now = new Date()) {
  const w = weekIndex(now), wd = (now.getDay() + 6) % 7, days = merchantDays(w), i = days.indexOf(wd);
  if (i < 0 && query('tuccar') !== '1') return null;
  return { visit: dayKey(now), no: w * 2 + Math.max(0, i) };
}
// Sıradaki geliş (bugün geldiyse bugün); en fazla 3 hafta ileri bakılır.
export function nextMerchant(now = new Date()) {
  for (let k = 0; k < 21; k++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + k);
    if (merchantDays(weekIndex(d)).includes((d.getDay() + 6) % 7)) return d;
  }
  return null;
}
// Bu haftanın geliş tarihleri (gazete için)
export function merchantWeek(now = new Date(), offset = 0) {
  const ws = weekStart(now);
  ws.setDate(ws.getDate() + offset * 7);
  return merchantDays(weekIndex(ws)).map(i => new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + i));
}
export const DAY_NAMES = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
export const dayName = d => DAY_NAMES[(d.getDay() + 6) % 7];

export const MERCHANT_OUTFITS = ['hat', 'scarf'].flatMap(slot => WARDROBE[slot].filter(x => x.merchant).map(x => ({ slot, ...x })));
export const MERCHANT_DECOR = DECOR_ITEMS.filter(d => d.merchant);
// Vitrin: kıyafet, süs ve oyuncak sırayla döner (no ile); balık yemi, gizemli paket ve kar tanesi her gelişte var.
export function merchantStock(no, P) {
  const o = MERCHANT_OUTFITS[no % MERCHANT_OUTFITS.length], d = MERCHANT_DECOR[no % MERCHANT_DECOR.length];
  const toy = PET_TOYS[no % PET_TOYS.length];
  return [
    { key: 'outfit', kind: 'outfit', slot: o.slot, id: o.id, name: o.slot === 'scarf' ? `${o.name} atkı` : o.name, price: o.merchant, max: 1, owned: P.owned[o.slot].includes(o.id) },
    { key: 'decor', kind: 'decor', id: d.id, name: d.name, price: d.merchant, max: 1, owned: P.decorOwned.includes(d.id) },
    { key: 'toy', kind: 'toy', id: toy.id, name: toy.name, price: toy.price, max: 1, owned: !!P.pet?.toys?.includes(toy.id), needPet: !P.pet },
    { key: 'bait', kind: 'bait', name: 'Balık yemi', price: MERCHANT.bait.price, max: 2 },
    { key: 'mystery', kind: 'mystery', name: 'Gizemli paket', price: MERCHANT.mystery.price, max: 3 },
    { key: 'flakes', kind: 'flakes', name: 'Kar tanesi', price: flakePrice(tradeN(P), MERCHANT.flakes.mult), max: MERCHANT.flakes.limit },
  ];
}

// ---------- evcil hayvan ----------
export const petFedToday = P => !!P.pet && P.pet.fedDay === dayKey();
export const fishToday = P => (P.fishDay?.day === dayKey() ? P.fishDay.n : 0);
export const petUnlocked = (P, vl) => vl >= PET.vl || P.level > PET.level;
export const furHex = P => PET.furs.find(f => f.id === P.pet?.fur)?.hex || null;

// ---------- köy projeleri ----------
export const projectSpent = (P, p) => P.projects?.[p.id] || 0;
// 0: başlanmadı, 1: temel, 2: yarısı, 3: tamamlandı
export function projectStage(P, p) {
  const s = projectSpent(P, p);
  return s <= 0 ? 0 : s >= p.cost ? 3 : s >= (p.cost * 2) / 3 ? 2 : 1;
}
export const projectBonus = (P, key) => PROJECTS.filter(p => p.bonus === key && projectStage(P, p) === 3).reduce((a, p) => a + p.value, 0);

// Nadir balık şansı: albüm tabanı + beslenmiş tilki + balık yemi + kaplıca
export const rareChance = P => ALBUM.chance + (petFedToday(P) ? PET.rareBonus : 0) + (P.bait > 0 ? MERCHANT.bait.bonus : 0) + projectBonus(P, 'rare');
