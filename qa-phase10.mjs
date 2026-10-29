import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const events={},store=new Map();
const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const nodes={};function node(id){return nodes[id]??={textContent:'',hidden:false,addEventListener:(name,fn)=>events[id+name]=fn,getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:640,height:640}),replaceChildren(){}}}
let time=1000,reduce=false;
const sandbox={document:{querySelector:node,createElement:()=>({}),addEventListener:()=>{},hidden:false},window:{matchMedia:()=>({matches:reduce})},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},performance:{now:()=>time},requestAnimationFrame:()=>{},console};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(new URL('./game.js',import.meta.url),'utf8'),sandbox);const run=x=>vm.runInContext(x,sandbox);
assert.equal(run('motion.size'),0);run('tryAction(1,5)');assert.equal(run('motion.has(1)'),true);assert.equal(run('state.units[0].y'),5);
time+=400;run('draw()');assert.equal(run('motion.has(1)'),false);assert.equal(run('particles.length')>0,true);
time+=1500;run('draw()');assert.equal(run('particles.length'),0);
run("transition('PRUEBA')");assert.equal(run('curtain.text'),'PRUEBA');time+=1400;run('draw()');assert.equal(run('curtain'),null);
reduce=true;run('trail(1,1)');assert.equal(run('particles.length'),0);run('tryAction(3,5)');run('draw()');
run('fullRestart()');assert.equal(run('motion.size'),0);assert.ok(store.has('into-the-abyss.v0.8.save'));
console.log('PASS phase10: movement interpolation, transient particles, transitions, reduced motion, reset, persistence');
