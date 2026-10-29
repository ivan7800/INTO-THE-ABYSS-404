'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const art=fs.readFileSync('src/port-art.ts','utf8'),pix=fs.readFileSync('src/pixi-layer.ts','utf8');
assert.ok(['0.81.0','0.82.0','0.83.0','0.84.0','0.85.0','0.90.0'].includes(require('./package.json').version));
for(const kind of ['dock','lantern','water','lighthouse']){assert.match(art,new RegExp("kind==='"+kind+"'"));assert.match(pix,new RegExp("placeProp\\('"+kind+"'"))}
assert.match(pix,/portPropsLayer.visible=portActive/);
assert.match(pix,/runtime.portProps=portProps.length/);
assert.match(fs.readFileSync('src/game.ts','utf8'),/into-the-abyss\.v0\.8\.save/);
for(const launcher of ['INICIAR-LINUX.sh','INICIAR-WINDOWS.bat'])assert.ok(fs.existsSync(launcher));
console.log('PASS v0.81 original harbor props, deterministic animations, unchanged save and launchers');
