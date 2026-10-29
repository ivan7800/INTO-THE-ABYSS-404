const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('style.css','utf8');
const nodes={};
const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),measureText:()=>({width:20})},{get:(o,k)=>k in o?o[k]:()=>{}});
function el(k){return nodes[k]??={textContent:'',disabled:false,hidden:false,value:'ada',handlers:{},setAttribute(){},addEventListener(type,fn){this.handlers[type]=fn},getContext(){return ctx},replaceChildren(){},getBoundingClientRect(){return {left:0,top:0,width:640,height:640}},click(){this.handlers.click?.()}}}
const store=new Map();
const sandbox={document:{querySelector:el,createElement:()=>({textContent:''}),addEventListener(){},hidden:false},window:{matchMedia:()=>({matches:false})},localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},performance:{now:()=>1000},requestAnimationFrame:()=>0,console};
vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'game.js'});
const run=x=>vm.runInContext(x,sandbox);
// Forecast must match the corruption actually added with a fixed set of threats.
run("state.units=state.units.filter(u=>u.side==='ally');state.intent=[];state.omen=null;state.resonance=null;state.buildings=[];state.rifts=[{x:0,y:0},{x:7,y:0}];state.corruption=0;state.integrity=50;state.maxIntegrity=50");
assert.equal(run('threatForecast().corruption'),4);
run('resolveEnemy()');assert.equal(run('state.corruption'),4);
run("fullRestart();state.buildings=[];state.rifts=[{x:0,y:0},{x:7,y:0}];state.units=[{id:101,name:'Ancla',type:'anchor',side:'enemy',x:1,y:1,hp:4,max:4},{id:1,name:'Penitente',type:'pen',side:'ally',pilot:'ada',x:1,y:6,hp:5,max:5,range:2,moved:false,acted:false}];state.intent=[{id:101,x:3,y:3,attack:'anchor',damage:1}];state.omen={x:2,y:5,type:'fracture'};state.resonance=null;state.corruption=0;state.integrity=50;state.maxIntegrity=50");
const predicted=run('threatForecast().corruption');
run('resolveEnemy()');assert.equal(predicted,11);assert.equal(run('state.corruption'),predicted);
// A phone can access the two essential actions directly alongside unit selection.
assert.match(html,/id="touchSpecial"/);assert.match(html,/id="touchEnd"/);
assert.match(css,/\.mobile-action\{display:none\}/);assert.match(css,/@media\(max-width:520px\)[\s\S]*?\.touch-toolbar \.mobile-action\{display:block\}/);
run('fullRestart()');assert.equal(el('#touchSpecial').disabled,false);
el('#touchSpecial').click();assert.equal(run('state.units[0].specialUsed'),true);
assert.equal(el('#touchSpecial').disabled,true);
el('#touchEnd').click();assert.equal(run('state.turn'),2);
run("state.phase='lost';render()");assert.equal(el('#touchEnd').disabled,true);
// The larger hit area should accept a narrow outer rim without selecting neighbours.
assert.equal(run('hitTile(320+34*1.15,155).x'),0);
assert.equal(run('hitTile(320+34*1.15,155).y'),0);
console.log('PASS phase30: forecast vs real turn, mobile actions, disabled state, touch margin');
