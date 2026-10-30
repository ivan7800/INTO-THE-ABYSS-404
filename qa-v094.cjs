'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const g=fs.readFileSync('src/game.ts','utf8'),t=fs.readFileSync('src/tactics.ts','utf8');
assert.equal(require('./package.json').version,'0.94.0');
assert.match(g,/target\.entangled=true/);
assert.match(g,/u\.moved=!!u\.entangled;u\.entangled=false/);
assert.match(g,/target\.shield=Math\.max\(0,target\.shield-1\)/);
assert.match(g,/const snare=target\?\.side==='ally'/);
assert.match(t,/A web that catches an unshielded Custodian/);
assert.match(g,/into-the-abyss\.v0\.8\.save/);
for(const x of ['INICIAR-LINUX.sh','INICIAR-WINDOWS.bat'])assert.ok(fs.existsSync(x));
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('build-tmp/tactics.js','utf8'),ctx);
const a=ctx.AbyssTactics;
let checks=0,seed=941;
const random=()=>seed=(Math.imul(seed,1664525)+1013904223)>>>0;
for(let i=0;i<600;i++){
 const enemy={id:100,x:random()%8,y:random()%4,hp:3,side:'enemy',type:i%2?'weaver':'seer'};
 const allies=[
  {id:1,x:random()%8,y:4+random()%4,hp:3,shield:0,side:'ally',type:'pen'},
  {id:2,x:random()%8,y:4+random()%4,hp:3,shield:2,side:'ally',type:'viu'}
 ];
 const state={units:[enemy,...allies],buildings:[{x:3,y:3,hp:2}],intent:[],turn:2};
 const before=JSON.stringify(state),intent=a.intentFor(enemy,state),repeat=a.intentFor(enemy,state);
 assert.ok(intent&&a.inside(intent.x,intent.y));
 assert.equal(JSON.stringify(intent),JSON.stringify(repeat));
 assert.equal(JSON.stringify(state),before);
 checks++;
}
console.log('PASS v0.94: '+checks+' deterministic Weaver/Oracle forecasts, announced attacks, save key and launchers');
