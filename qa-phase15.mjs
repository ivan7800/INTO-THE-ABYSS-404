import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const saved=new Map(),nodes={};
const fakeCtx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
function node(id){return nodes[id]??={dataset:{},style:{},hidden:false,disabled:false,value:'ada',setAttribute(){},addEventListener(){},getContext:()=>fakeCtx,getBoundingClientRect:()=>({left:0,top:0,width:640,height:640}),replaceChildren(){}}}
const env={document:{querySelector:node,querySelectorAll:()=>[],addEventListener(){},createElement:()=>({}),hidden:false},window:{matchMedia:()=>({matches:false})},localStorage:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)},performance:{now:()=>1000},requestAnimationFrame(){},console,Date,Blob,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},setTimeout(){}};
vm.createContext(env);vm.runInContext(fs.readFileSync(new URL('./game.js',import.meta.url),'utf8'),env);
const run=src=>vm.runInContext(src,env);
for(let sector=0;sector<5;sector++){
 run(`campaign.sector=${sector};init()`);
 assert.equal(run('state.encounterMode'),'base');
 const initial=run('alive("enemy").length');
 assert.equal(run('chooseEncounter("siege")'),true,`siege sector ${sector}`);
 assert.equal(run('alive("enemy").length'),initial+1);
 assert.equal(run('state.intent.length'),initial+1,'new enemy is telegraphed before any action');
 assert.equal(run('chooseEncounter("tide")'),false,'no stacking encounter modes');
 assert.equal(run('state.encounterMode'),'siege');
 assert.equal(run('state.units.filter(u=>u.hp>0).some(u=>state.rocks.some(r=>r.x===u.x&&r.y===u.y))'),false,'no enemy inside rocks');
 run('init()');
 const cracks=run('state.rifts.length');
 assert.equal(run('chooseEncounter("tide")'),true);
 assert.equal(run('state.rifts.length'),cracks+1);
 assert.equal(run('chooseEncounter("siege")'),false);
 assert.equal(run('scorecard().encounter'),'tide');
 const save=JSON.parse(saved.get('into-the-abyss.v0.8.save'));
 assert.equal(save.state.encounterMode,'tide');
 assert.equal(save.state.encounterLocked,true);
}
run('campaign.sector=0;init();tryAction(1,5)');
assert.equal(run('chooseEncounter("siege")'),false,'cannot change layout after movement');
run('campaign.sector=0;init();chooseEncounter("siege")');
assert.equal(run('restore()'),true,'save reload');
assert.equal(run('state.encounterMode'),'siege');
assert.equal(run('chooseEncounter("tide")'),false,'reload cannot re-select');
assert.match(node('#encounterStatus').textContent,/Asedio/);
console.log('PASS phase15: both encounter variants across 5 sectors, no stacking, correct predicted reinforcements, blockers, metric tag, save/load lock, action lock');
