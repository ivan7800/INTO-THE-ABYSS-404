'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const source=fs.readFileSync('src/game.ts','utf8'),html=fs.readFileSync('index.html','utf8');
assert.ok(['0.92.0','0.93.0','0.94.0'].includes(require('./package.json').version));
for(const kind of ['containment','defense']){assert.ok(source.includes("missionVictory('"+kind+"')"));assert.ok(html.includes('id="encounter-'+kind+'"'))}
assert.match(source,/leviathan/);assert.match(source,/into-the-abyss\.v0\.8\.save/);
for(const f of ['INICIAR-LINUX.sh','INICIAR-WINDOWS.bat'])assert.ok(fs.existsSync(f));
const sandbox={};vm.createContext(sandbox);vm.runInContext(fs.readFileSync('build-tmp/tactics.js','utf8'),sandbox);
const core=sandbox.AbyssTactics;let seed=92;const rnd=()=>seed=(Math.imul(seed,1664525)+1013904223)>>>0;
const kinds=['stalker','seer','weaver','anchor','vig','boss','leviathan','lar'];
for(let i=0;i<200;i++){
 const e={id:99,x:rnd()%8,y:rnd()%3,hp:2+rnd()%7,side:'enemy',type:kinds[rnd()%8]};
 const ally={id:1,x:rnd()%8,y:4+rnd()%4,hp:1+rnd()%5,side:'ally',type:'pen'};
 const s={units:[e,ally],buildings:[{x:3,y:3,hp:2}],intent:[],turn:2};
 const before=JSON.stringify(s),a=core.intentFor(e,s),b=core.intentFor(e,s);
 assert.ok(a&&core.inside(a.x,a.y));assert.equal(JSON.stringify(a),JSON.stringify(b));assert.equal(before,JSON.stringify(s));
}
console.log('PASS v0.92 two objective-based mission protocols + 200 deterministic targeting cases');
