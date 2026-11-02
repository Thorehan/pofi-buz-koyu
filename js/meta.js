// Köy hesapları: yapı seviyeleri, buff'lar, köy seviyesi, indirimli fiyatlar.
import { BUILDINGS, VILLAGE_LEVELS, VILLAGE_BONUS_PCT } from './config.js';

export const building = id => BUILDINGS.find(b => b.id === id);
export const bLevel = (P, id) => P.village[id]?.lv || 0;
export const totalLevels = P => BUILDINGS.reduce((s, b) => s + bLevel(P, b.id), 0);

export function villageLevel(P) {
  const t = totalLevels(P);
  let lv = 1;
  for (const v of VILLAGE_LEVELS) if (t >= v.need) lv = v.lv;
  return lv;
}

export const nextVillageLevel = P => VILLAGE_LEVELS.find(v => v.lv === villageLevel(P) + 1) || null;
export const isUnlocked = (P, b) => villageLevel(P) >= b.unlock;
export const maxLevel = b => b.costs.length;

// Kurulum veya bir sonraki seviye için gereken kar tanesi; maks seviyedeyse null.
export function nextCost(P, b) {
  const lv = bLevel(P, b.id);
  return lv < b.costs.length ? b.costs[lv] : null;
}

// Buff'ın şu anki değeri (yapı yoksa taban değeri veya 0).
export function buff(P, key) {
  const b = BUILDINGS.find(x => x.buff === key);
  const lv = bLevel(P, b.id);
  return lv ? b.values[lv - 1] : (b.base ?? 0);
}

// Köy bonusu + iglo: level coin ödüllerine eklenen toplam yüzde.
export const villageBonusPct = P => (villageLevel(P) - 1) * VILLAGE_BONUS_PCT;
export const coinBonusPct = P => buff(P, 'coinPct') + villageBonusPct(P);

// Kartopu kalesi indirimi uygulanmış fiyat.
export const discounted = (P, price) => Math.round(price * (1 - buff(P, 'discount')));

// Kurulabilir veya yükseltilebilir yapı var mı?
export const canAffordAny = P => BUILDINGS.some(b => isUnlocked(P, b) && nextCost(P, b) !== null && P.flakes >= nextCost(P, b));

// Ana ekran için öneri: önce parası yeten en ucuz iş, yoksa en ucuz iş.
export function suggestion(P) {
  const jobs = BUILDINGS.filter(b => isUnlocked(P, b) && nextCost(P, b) !== null)
    .map(b => ({ b, cost: nextCost(P, b), lv: bLevel(P, b.id) }))
    .sort((a, c) => a.cost - c.cost);
  return jobs.find(j => P.flakes >= j.cost) || jobs[0] || null;
}
