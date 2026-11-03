// Kullanım: node tools/gen-masters.mjs
// Usta levellerini (MASTER_LEVELS) üretip çözücüyle doğrular ve data/masters.json dosyasına yazar.
// Oyunda anlık üretmek büyük tahtalarda birkaç saniye sürdüğü için önceden üretilir.
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = await import(pathToFileURL(join(root, 'js', 'engine.js')).href);
const C = await import(pathToFileURL(join(root, 'js', 'config.js')).href);

const out = C.MASTER_LEVELS.map((m, i) => {
  const d = E.generateLevel(m.n, { seed: 770000 + i * 131, rule: { tier: 'veryhard', fish: 1 }, maxAttempts: 4000 });
  const { L, S } = E.parseLevel(d);
  const sol = E.solve(L, S, 200000);
  if (!sol || sol.length !== d.min) throw new Error(`Usta ${i} doğrulanamadı`);
  console.log(`Usta ${i + 1} (${C.MAP_REGIONS[i].name}): ${d.rows[0].length}x${d.rows.length} en kısa ${d.min}, sınır ${d.limit}, ${d.mech.join('+')}`);
  return d;
});
writeFileSync(join(root, 'data', 'masters.json'), JSON.stringify(out));
