'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const game=fs.readFileSync('src/game.ts','utf8'),html=fs.readFileSync('index.html','utf8');
assert.equal(require('./package.json').version,'0.93.0');
for(const p of [/function defensiveStance\(/,/u\.acted=true/,/Math\.min\(2,\(friend\.shield\|\|0\)\+1\)/,/metrics\(\)\.decisions\+\+/,/into-the-abyss\.v0\.8\.save/])assert.match(game,p);
assert.match(html,/id="defensiveStance"/);assert.match(html,/id="defenseForecast"/);
for(const name of ['INICIAR-LINUX.sh','INICIAR-WINDOWS.bat'])assert.ok(fs.existsSync(name));
const c={};vm.createContext(c);vm.runInContext(fs.readFileSync('build-tmp/tactics.js','utf8'),c);
let seed=93;const rnd=()=>seed=(Math.imul(seed,1664525)+1013904223)>>>0;
for(let i=0;i<500;i++){
 const e={id:100,x:rnd()%8,y:rnd()%4,hp:2+rnd()%7,side:'enemy',type:['stalker','seer','weaver','anchor','leviathan'][rnd()%5]};
 const t={id:1,x:rnd()%8,y:4+rnd()%4,hp:1+rnd()%5,side:'ally',type:'pen'};
 const state={units:[e,t],buildings:[{x:3,y:3,hp:2}],intent:[],turn:2};
 const old=JSON.stringify(state),a=c.AbyssTactics.intentFor(e,state),b=c.AbyssTactics.intentFor(e,state);
 assert.ok(a&&c.AbyssTactics.inside(a.x,a.y));assert.equal(JSON.stringify(a),JSON.stringify(b));assert.equal(JSON.stringify(state),old);
}
console.log('PASS v0.93 defensive stance, 500 deterministic tactical forecasts, save compatibility');
