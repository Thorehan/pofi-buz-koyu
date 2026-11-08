// Sayıdan sonra gelen Türkçe ek: sayının okunuşundaki son kelimeye göre seçilir.
// ek(3, 'de') → "3'te", ek(6, 'de') → "6'da", ek(2, 'e') → "2'ye", ek(9, 'i') → "9'u", ek(40, 'den') → "40'tan".
// Sabit "'te" yazılınca "Lv2'te", "Lv6'te" gibi yanlışlar çıkıyordu (tools/smoke.mjs bunları dener).
const ONES = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
const TENS = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
const VOWELS = 'aeıioöuü';

// sayının okunuşundaki son kelime (eki o belirler)
function lastWord(n) {
  n = Math.abs(Math.trunc(n));
  if (n === 0) return 'sıfır';
  if (n % 10) return ONES[n % 10];
  if (n % 100) return TENS[(n % 100) / 10];
  if (n % 1000) return 'yüz';
  if (n % 1e6) return 'bin';
  return 'milyon';
}

export function ek(n, kind) {
  const w = lastWord(n), end = w.at(-1);
  const v = [...w].reverse().find(c => VOWELS.includes(c));
  const back = 'aıou'.includes(v), vowelEnd = VOWELS.includes(end), hard = 'pçtkfhsş'.includes(end);
  const d = hard ? 't' : 'd';
  const suffix = {
    de: `${d}${back ? 'a' : 'e'}`,
    den: `${d}${back ? 'an' : 'en'}`,
    e: `${vowelEnd ? 'y' : ''}${back ? 'a' : 'e'}`,
    i: `${vowelEnd ? 'y' : ''}${{ a: 'ı', ı: 'ı', e: 'i', i: 'i', o: 'u', u: 'u', ö: 'ü', ü: 'ü' }[v]}`,
  }[kind];
  if (!suffix) throw new Error(`bilinmeyen ek: ${kind}`);
  return `${n}'${suffix}`;
}
