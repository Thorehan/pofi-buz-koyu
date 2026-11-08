// "Hareketi azalt": Ayarlar'daki anahtar; seçilmemişse cihazın "hareketi azalt" ayarına uyar.
// Açıkken parçacıklar azalır, konfeti ve havai fişek çıkmaz, kar seyrekleşir, arayüz animasyonları durur.
// Oyunun anlaşılması için gereken hareketler (Pofi'nin kayması, kasalar, foklar) aynen kalır.
export const motion = { reduced: false };

const osReduced = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// setting: true / false (oyuncu seçti) ya da undefined (cihaza uy)
export function applyMotion(setting) {
  motion.reduced = setting === undefined || setting === null ? osReduced() : !!setting;
  globalThis.document?.documentElement.classList.toggle('calm', motion.reduced);
  return motion.reduced;
}
export const osPrefersReduced = osReduced;
