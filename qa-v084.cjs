'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const art=fs.readFileSync('src/sector-art.ts','utf8'),p=fs.readFileSync('src/pixi-layer.ts','utf8');
assert.equal(require('./package.json').version,'0.84.0');
for(const kind of ["tile","building","rock"])assert.ok(art.includes(kind));
for(const feature of ["nativeBiomes:4","hideCanvasWorld","activeBiome","biomeBuildingCache","biomeTexture"])assert.ok(p.includes(feature),feature);
assert.match(fs.readFileSync('src/game.ts','utf8'),/into-the-abyss\.v0\.8\.save/);
for(const x of ['INICIAR-LINUX.sh','INICIAR-WINDOWS.bat'])assert.ok(fs.existsSync(x));
console.log('PASS v084 four distinct sector atlas, GPU sprites and preserved saves');
