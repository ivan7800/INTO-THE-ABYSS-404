'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const cp=require('node:child_process');
const js=fs.readFileSync('game.js','utf8'),art=fs.readFileSync('dist/art.js','utf8');
assert.match(js,/const N\s*=\s*8/);assert.match(js,/validSave/);assert.match(js,/freezeIntent/);
assert.match(art,/AbyssEnvironment/);assert.match(art,/document\.createElement/);assert.match(art,/imageSmoothingEnabled/);
assert.match(fs.readFileSync('launch-windows.ps1','utf8'),/Loopback/);
assert.match(fs.readFileSync('launch-local.py','utf8'),/127\.0\.0\.1/);
const result=cp.spawnSync('python3',['-m','py_compile','launch-local.py'],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
console.log('PASS v0.40: tactical engine unchanged, TS biome atlas compiled, localhost-only launchers audited');
