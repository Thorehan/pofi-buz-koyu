// Kullanım: node tools/gen-levels.mjs [adet=200]
// İlk N leveli üretip çözücüyle doğrular ve data/levels.json dosyasına yazar.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = await import(pathToFileURL(join(root, 'js', 'engine.js')).href);

const count = +(process.argv[2] || 200);
const levels = [];
const t0 = Date.now();
for (let n = 1; n <= count; n++) {
  const t = Date.now();
  const lvl = E.generateLevel(n);
  const { L, S } = E.parseLevel(lvl);
  const sol = E.solve(L, S, 200000);
  if (!sol || sol.length !== lvl.min) throw new Error(`Doğrulama hatası: level ${n}`);
  levels.push(lvl);
  const ms = Date.now() - t;
  if (n <= 12 || n % 10 === 0 || ms > 2000) console.log(`L${n} ${lvl.tier} ${lvl.rows[0].length}x${lvl.rows.length} min=${lvl.min} limit=${lvl.limit ?? '-'} mech=${lvl.mech.join('+') || 'temel'} (${ms}ms)`);
}
mkdirSync(join(root, 'data'), { recursive: true });
writeFileSync(join(root, 'data', 'levels.json'), JSON.stringify(levels));
console.log(`${count} level, ${((Date.now() - t0) / 1000).toFixed(1)} sn`);
