'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const pkg=require('./package.json');
assert.equal(pkg.dependencies['pixi.js'],'8.19.0');
assert.match(fs.readFileSync('.github/workflows/publish-pages.yml','utf8'),/workflow_dispatch/);
assert.doesNotMatch(fs.readFileSync('.github/workflows/ci.yml','utf8'),/deploy-pages/);
for(const file of ['src/game.ts','game.js'])assert.match(fs.readFileSync(file,'utf8'),/into-the-abyss\.v0\.8\.save/);
console.log('PASS v070 release safety and compatible save key');
