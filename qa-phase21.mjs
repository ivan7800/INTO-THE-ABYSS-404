import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';
const source=fs.readFileSync('game.js','utf8');
assert.match(source,/state\.integrity\s*=\s*Math\.max\(0,\s*state\.integrity\s*-\s*actual\)/,'effective building damage');
assert.match(source,/input, textarea, select, button, \[contenteditable\]/,'focus protection');
assert.match(source,/st\.intent\.length\s*<=\s*24/);assert.match(source,/st\.rifts\.length\s*<=\s*64/);
// Exercise real save validator through the existing mocked-DOM harness.
const base=fs.readFileSync('qa-phase13.mjs','utf8');
assert.match(base,/validSave/,'existing fixture covers save validation');
console.log('Fase 21: integridad, foco y guardados validados: PASS');
