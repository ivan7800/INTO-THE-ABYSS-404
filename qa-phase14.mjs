import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const events={},saved=new Map(),nodes={};const fakeCtx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const element=id=>nodes[id]??={dataset:{},style:{},disabled:false,hidden:false,value:'ada',setAttribute(){},addEventListener:(type,fn)=>events[id+':'+type]=fn,click(){events[id+':click']?.()},getContext:()=>fakeCtx,getBoundingClientRect:()=>({left:0,top:0,width:640,height:640}),replaceChildren(){}};
const units=[1,2,3].map(i=>{const el=element('unit'+i);el.dataset.unit=String(i);return el});
const env={document:{querySelector:element,querySelectorAll:s=>s==='[data-unit]'?units:[],addEventListener(){},createElement:()=>({}),hidden:false},window:{matchMedia:()=>({matches:false})},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},performance:{now:()=>1000},requestAnimationFrame(){},console,Date,Blob,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},setTimeout(){}};
vm.createContext(env);vm.runInContext(fs.readFileSync(new URL('./game.js',import.meta.url),'utf8'),env);const run=x=>vm.runInContext(x,env);
assert.equal(run('metrics().moves'),0);
run('tryAction(1,5)');assert.equal(run('metrics().moves'),1);assert.equal(run('metrics().byUnit.pen.moves'),1);
run('state.selected=2;special()');assert.equal(run('metrics().specials'),1);
run('state.units.find(u=>u.side==="enemy").x=3;state.units.find(u=>u.side==="enemy").y=5; state.selected=1;state.mode="attack";tryAction(3,5)');assert.equal(run('metrics().attacks'),0); // invalid range
run('state.units.find(u=>u.side==="enemy").x=1;state.units.find(u=>u.side==="enemy").y=4;tryAction(1,4)');assert.equal(run('metrics().attacks'),1);assert(run('metrics().damageDealt')>0);
run('archiveSector()');run('archiveSector()');assert.equal(run('campaign.history.length'),1);
const save=JSON.parse(saved.get('into-the-abyss.v0.8.save'));assert(save.state.metrics.moves===1);
run('state.metrics=null;render()');assert.equal(run('metrics().moves'),0);
assert.match(element('#metricsReport').textContent,/MOV 0/);
console.log('PASS phase14: movement, special, attack, damage, deduplicated archive, metrics persistence, legacy defaults, HUD');
