import fs from 'node:fs';import assert from 'node:assert/strict';
const js=fs.readFileSync('game.js','utf8'),html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('style.css','utf8');
assert.match(js,/visualQuality\s*=\s*'full'/);assert.match(js,/localStorage\.setItem\('abyss-visual-quality'/);assert.match(js,/liteVisual\(\)\s*\?\s*66\s*:\s*33/);assert.match(js,/u\.id\s*===\s*state\.selected/);assert.match(html,/id="visualQuality"/);assert.match(css,/touch-action:none/);console.log('Fase 20: opciones gráficas, selección y táctil: PASS');
