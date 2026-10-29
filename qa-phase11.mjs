import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const store=new Map(), events={};
const context2d=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(obj,k)=>obj[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const nodes={};function node(id){return nodes[id]??={textContent:'',hidden:false,value:'ada',addEventListener:(evt,fn)=>events[id+evt]=fn,getContext:()=>context2d,getBoundingClientRect:()=>({left:0,top:0,width:640,height:640}),replaceChildren(){}}}
const sandbox={document:{querySelector:node,createElement:()=>({}),addEventListener:()=>{},hidden:false},window:{matchMedia:()=>({matches:false})},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},performance:{now:()=>1000},requestAnimationFrame:()=>{},console};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(new URL('./game.js',import.meta.url),'utf8'),sandbox);
const run=x=>vm.runInContext(x,sandbox);
assert.equal(run('SECTORS.length'),5);
assert.equal(run('CHAPTERS.length'),5);
for(let s=0;s<5;s++){
 run(`campaign.sector=${s};init()`);
 assert.equal(run('state.phase'),'player');
 assert.ok(run('state.units.every(u=>inside(u.x,u.y))'));
 assert.ok(run('state.units.filter(u=>u.hp>0).every((u,i,a)=>a.findIndex(v=>v.x===u.x&&v.y===u.y)===i)'));
 assert.equal(run('state.objectiveDone'),false);
 assert.ok(run('state.intent.length')>=3);
 run('draw()');
}
run('campaign.sector=4;init()');
assert.ok(run('alive("enemy").some(u=>u.type==="leviathan")'));
assert.equal(run('state.intent.find(i=>i.id===103).attack'),'rupture');
run('state.units.find(u=>u.type==="leviathan").hp=6;freezeIntent()');
assert.equal(run('state.intent.find(i=>i.id===103).attack'),'cataclysm');
const locked=run('JSON.stringify(state.intent.find(i=>i.id===103))');
run('state.units.find(u=>u.type==="leviathan").hp=7');
assert.equal(run('JSON.stringify(state.intent.find(i=>i.id===103))'),locked);
run('state.rifts=[];state.corruption=0;state.integrity=100;state.phase="player";state.turn=2;resolveEnemy()');
assert.ok(run('state.corruption')>=10);
// Final mission is not a survival-only victory if the boss remains alive.
run('campaign.sector=4;init();state.turn=state.maxTurns;state.integrity=100;state.corruption=0;state.rifts=[];state.intent=[];state.omen=null;resolveEnemy()');
assert.equal(run('state.phase'),'lost');
// It remains possible to finish the final stage on the turn limit when boss is dead.
run('campaign.sector=4;init();state.turn=state.maxTurns;state.integrity=100;state.corruption=0;state.rifts=[];state.intent=[];state.omen=null;state.units=state.units.filter(u=>u.type!=="leviathan");resolveEnemy()');
assert.equal(run('state.phase'),'won');
// Legacy completed saves must keep their explicit completion status rather than silently extending.
run('campaign.sector=2;init();state.phase="complete";campaign.complete=true;persist()');
assert.ok(store.has('into-the-abyss.v0.8.save'));
assert.equal(run('restore()'),true);
assert.equal(run('campaign.complete'),true);
console.log('PASS phase11: 5 unique sectors, locked two-phase boss, final victory condition, legacy save completion');
