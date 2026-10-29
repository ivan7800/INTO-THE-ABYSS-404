import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const events={},saved=new Map(),nodes={};const fakeCtx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const element=id=>nodes[id]??={dataset:{},style:{},disabled:false,hidden:false,value:'ada',setAttribute(){},addEventListener:(type,fn)=>events[id+':'+type]=fn,click(){events[id+':click']?.()},getContext:()=>fakeCtx,getBoundingClientRect:()=>({left:0,top:0,width:640,height:640}),replaceChildren(){}};
const units=[1,2,3].map(i=>{const el=element('unit'+i);el.dataset.unit=String(i);return el});
const env={document:{querySelector:element,querySelectorAll:s=>s==='[data-unit]'?units:[],addEventListener(){},createElement:()=>({}),hidden:false},window:{matchMedia:()=>({matches:false})},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},performance:{now:()=>1000},requestAnimationFrame(){},console};vm.createContext(env);vm.runInContext(fs.readFileSync(new URL('./game.js',import.meta.url),'utf8'),env);const run=x=>vm.runInContext(x,env);
const initial=run('threatForecast()');assert(initial.buildings>=0);assert(initial.allies>=0);assert(initial.corruption>=0);assert.match(element('#threatSummary').textContent,/RIESGO ACTUAL:/);
run('state.intent=[{id:100,x:3,y:2,attack:"claw",damage:1}];render()');assert.equal(run('threatForecast().buildings'),1);
run('state.intent=[{id:100,x:1,y:6,attack:"drain",damage:1}];render()');assert.equal(run('threatForecast().allies'),0); // Ada starts shielded
run('state.units.find(u=>u.id===1).shield=0;render()');assert.equal(run('threatForecast().allies'),1);
const valid=JSON.parse(saved.get('into-the-abyss.v0.8.save'));assert.equal(run('validSave('+JSON.stringify(valid)+')'),true);
for(const [field,value] of [['integrity',-3],['corruption',105],['maxTurns',0]]){const bad=structuredClone(valid);bad.state[field]=value;assert.equal(run('validSave('+JSON.stringify(bad)+')'),false,field)}
const badUnit=structuredClone(valid);badUnit.state.units[0].hp=-10;assert.equal(run('validSave('+JSON.stringify(badUnit)+')'),false);
console.log('PASS phase13: forecast building/ally damage and shields, corrupted save values rejected');
// Baseline stress: deterministic zero-action player, across all sector starting states, not a balance verdict.
for(let sector=0;sector<5;sector++){
 run(`campaign.sector=${sector};init()`);let rounds=0;
 while(run('state.phase')==='player'&&rounds<12){run('resolveEnemy()');rounds++}
 console.log(`BASELINE sector ${sector+1}: ${run('state.phase')} after ${rounds} turns; integrity=${run('state.integrity')}, corruption=${run('state.corruption')}`);
 assert(rounds<=12);
}
