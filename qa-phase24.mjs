import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('game.js','utf8');
const nodes={};const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),measureText:()=>({width:20})},{get:(obj,k)=>k in obj?obj[k]:()=>{}});
function element(k){return nodes[k]??={textContent:'',disabled:false,setAttribute(){},addEventListener(){},getContext(){return ctx},replaceChildren(){},getBoundingClientRect(){return {left:0,top:0,width:640,height:640}}}}
const saved=new Map();const env={document:{querySelector:element,createElement:()=>({textContent:''}),addEventListener(){},hidden:false},window:{matchMedia:()=>({matches:false})},localStorage:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)},performance:{now:()=>1000},requestAnimationFrame:()=>1,console};
vm.createContext(env);vm.runInContext(source,env);const run=x=>vm.runInContext(x,env);
// Targeting regression: when an ally and building occupy equally distant squares,
// an enemy prefers pressuring the ally rather than instantly draining infrastructure.
run("fullRestart();state.units=state.units.filter(u=>u.side==='ally');state.units=[{id:101,type:'vig',name:'Vigía',side:'enemy',x:3,y:1,hp:2,max:2},{id:1,type:'pen',name:'Penitente',side:'ally',x:3,y:3,hp:5,max:5}];state.buildings=[{x:4,y:2,hp:2}];state.intent=[]");
assert.equal(run("chooseIntent(state.units[0]).x"),3);
assert.equal(run("chooseIntent(state.units[0]).y"),3);
// Buildings must remain attackable when they are much closer.
run("state.units[1].x=7;state.units[1].y=7");
assert.equal(run("chooseIntent(state.units[0]).x"),4);
assert.equal(run("chooseIntent(state.units[0]).y"),2);
// Corruption from three unattended rifts: 6 rather than 9 points per round.
run("fullRestart();state.units=state.units.filter(u=>u.side==='ally');state.intent=[];state.omen=null;state.resonance=null;state.rifts=[{x:0,y:0},{x:7,y:0},{x:0,y:7}];state.corruption=0;state.integrity=50;state.maxIntegrity=50");
run('resolveEnemy()');assert.equal(run('state.corruption'),6);
// No telegraph/intent is mutated after the player's turn starts.
run('campaign.sector=2;init()');const frozen=run('JSON.stringify(state.intent)');run('render()');assert.equal(run('JSON.stringify(state.intent)'),frozen);
console.log('Fase 24: prioridad de objetivos, corrupción pasiva y amenazas fijadas: PASS');
