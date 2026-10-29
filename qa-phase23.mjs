import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('game.js','utf8');
const events={};const nodes={};const saved=new Map();
const context2d=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),measureText:()=>({width:20})},{get:(o,k)=>k in o?o[k]:()=>{}});
function el(id){return nodes[id]??={textContent:'',disabled:false,setAttribute(){},addEventListener(name,cb){events[id+':'+name]=cb},getBoundingClientRect(){return {left:0,top:0,width:640,height:640}},replaceChildren(){},getContext(){return context2d}}}
const sandbox={document:{querySelector:el,createElement:()=>({textContent:''}),addEventListener(){},hidden:false},window:{matchMedia:()=>({matches:false})},localStorage:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)},performance:{now:()=>1000},requestAnimationFrame:()=>1,console};
vm.createContext(sandbox);vm.runInContext(source,sandbox);const run=src=>vm.runInContext(src,sandbox);
// A lethal rift movement must finish the game on the SAME input action.
run("fullRestart();state.units=state.units.filter(u=>u.side==='enemy'||u.id===1);state.units.find(u=>u.id===1).hp=1;state.units.find(u=>u.id===1).shield=0;state.rifts=[{x:1,y:5}];state.intent=[];state.selected=1;state.phase='player';state.mode='move'");
run('tryAction(1,5)');
assert.equal(run('state.phase'),'lost');
assert.equal(run('alive("ally").length'),0);
// Optional malformed telemetry must never crash rendering, movement or manual export.
run("fullRestart();state.metrics={moves:NaN,byUnit:{pen:null},turnsResolved:-1};render()");
assert.equal(run('metrics().moves'),0);
assert.equal(run('metrics().turnsResolved'),0);
assert.equal(run('metrics().byUnit.pen.attacks'),0);
assert.equal(run('metrics().byUnit.her.moves'),0);
run('tryAction(1,5)');
assert.equal(run('metrics().moves'),1);
run('persist()');
assert.equal(run('restore()'),true);
assert.equal(run('metrics().moves'),1);
console.log('Fase 23: daño letal de grietas, métricas incompletas y restauración: PASS');
