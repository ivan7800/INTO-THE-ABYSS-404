import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=process.cwd();
const html=readFileSync('index.html','utf8');
const css=readFileSync('style.css','utf8');
const game=readFileSync('game.js','utf8');
for (const src of [...html.matchAll(/(?:src|href)="([^"#?]+)"/g)].map(x=>x[1])) {
  if (/^(?:https?:|data:|mailto:|\/\/)/.test(src)) continue;
  assert.ok(!src.includes('..'),`Ruta externa inesperada: ${src}`);
  assert.ok(existsSync(resolve(root,src)),`Archivo ausente: ${src}`);
}
for (const src of ['environment-art.js','pixel-art.js','game.js']) {
  assert.ok(html.includes(`src="${src}"`), `Script omitido: ${src}`);
}
assert.match(html,/id="game"/);
assert.match(html,/id="status"/);
assert.match(game,/if\s*\(!restore\(\)\)\s*init\(\)/);
assert.match(game,/localStorage\.setItem\(SAVE_KEY/);
assert.match(css,/canvas/);
assert.ok(existsSync('.nojekyll'));
assert.ok(existsSync('LICENSE'));
console.log('Fase 22: distribución, dependencias y archivos locales: PASS');
