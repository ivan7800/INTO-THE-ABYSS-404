import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const events={};const nodes={};const saved=new Map();const localStorage={setItem:(k,v)=>saved.set(k,v),getItem:k=>saved.get(k)??null,removeItem:k=>saved.delete(k)};const fakeContext=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),measureText:()=>({width:20})}, {get(t,k){return k in t?t[k]:()=>{}},set(t,k,v){t[k]=v;return true}});
function el(id){return nodes[id]??=( {textContent:'',disabled:false,addEventListener(name,fn){events[id+':'+name]=fn},getBoundingClientRect(){return {left:0,top:0,width:640,height:640}},replaceChildren(){},getContext(){return fakeContext}})}
const context={document:{querySelector:el,createElement:()=>({textContent:''}),addEventListener:(n,fn)=>events['document:'+n]=fn,hidden:false},window:{matchMedia:()=>({matches:false})},localStorage,performance:{now:()=>1000},requestAnimationFrame:()=>1,console};vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('./game.js',import.meta.url),'utf8'),context);
function run(src){return vm.runInContext(src,context)};
assert.equal(run('state.units.length'),6);
for(let x=0;x<8;x++)for(let y=0;y<8;y++){const p=run(`project(${x},${y})`);const q=run(`unproject(${p.x},${p.y})`);assert.equal(q.x,x,`iso x ${x},${y}`);assert.equal(q.y,y,`iso y ${x},${y}`)}
assert.ok(run('pathCells(state.units[0]).size')>0);
const locked=JSON.stringify(run('state.intent'));
run('tryAction(1,5)');assert.equal(run('state.units[0].moved'),true);assert.equal(JSON.stringify(run('state.intent')),locked);
run("state.mode='attack';tryAction(1,1)");assert.equal(run('state.units[0].acted'),false);
run('resolveEnemy()');assert.equal(run('state.turn'),2);
run('init()');assert.equal(run('state.turn'),1);
assert.equal(run('state.integrity'),5);
run('for(let i=0;i<7&&state.phase===\'player\';i++)resolveEnemy()');assert.ok(['won','lost'].includes(run('state.phase')));
console.log('PASS: initialization, 64 isometric coordinate roundtrips, reachable cells, moving, fixed threats, invalid attack, enemy turn, reset, game completion');
// Campaign progression, upgrade preservation, mission-specific configurations, and terminal state.
run('fullRestart()');
assert.equal(run('campaign.sector'),0);
run("state.phase='won';nextMission()");
assert.equal(run('campaign.sector'),1);
assert.equal(run('state.units.find(u=>u.type===\"pen\").max'),6);
assert.equal(run('state.maxTurns'),6);
assert.ok(run('alive("enemy").some(u=>u.type===\"herald\")'));
run('freezeIntent();resolveEnemy()');
assert.equal(run('state.turn'),2);
run("state.phase='won';nextMission()");
assert.equal(run('campaign.sector'),2);
assert.equal(run('state.units.find(u=>u.type===\"her\").range'),4);
assert.ok(run('alive("enemy").some(u=>u.type===\"boss\")'));
run('state.integrity=50;state.rifts=[]; state.corruption=0; freezeIntent();resolveEnemy()');
assert.equal(run('state.turn'),2);
run("state.phase='won';nextMission()");
assert.equal(run('campaign.sector'),3);
run("state.phase='won';nextMission()");
assert.equal(run('campaign.sector'),4);
assert.equal(run('state.units.find(u=>u.type==="viu").max'),4);
run("state.phase='won';nextMission()");
assert.equal(run('campaign.complete'),true);
assert.equal(run('state.phase'),'complete');
run('fullRestart()');
assert.equal(run('campaign.sector'),0);
assert.equal(run('campaign.upgrades.length'),0);
assert.equal(run('state.units.find(u=>u.type===\"pen\").max'),5);
console.log('PASS: 5 sectors, pilot upgrades, new enemy intents, boss, campaign victory, full reset');

// Persistence must survive a page reload and reject malformed old saves.
run('fullRestart()');run('tryAction(1,5)');
assert.equal(run('state.units[0].moved'),true);
assert.ok(saved.has('into-the-abyss.v0.8.save'));
run('state.units[0].moved=false');
assert.equal(run('restore()'),true);
assert.equal(run('state.units[0].moved'),true);
saved.set('into-the-abyss.v0.8.save','{bad json');
assert.equal(run('restore()'),false);
run('init()');
assert.equal(run('state.turn'),1);
// All requested buttons and keyboard listeners must be wired.
for(const id of ['mode','end','restart','next','sound','save'])assert.equal(typeof events['#'+id+':click'],'function',id);
assert.equal(typeof events['document:keydown'],'function');
events['#sound:click']();assert.equal(run('audioEnabled'),true);
events['#sound:click']();assert.equal(run('audioEnabled'),false);
events['#save:click']();assert.ok(saved.has('into-the-abyss.v0.8.save'));
console.log('PASS: autosave, restored moved state, invalid save rejection, sound toggle, save button, keyboard listener');

// Phase 6: pilots, assignments, traits, attack intents and corruption risk.
run('fullRestart()');
assert.equal(run('Object.keys(PILOTS).length'),6);
assert.equal(run('state.units.find(u=>u.id===1).shield'),1);
assert.equal(run('state.units.find(u=>u.id===2).range'),3);
assert.equal(typeof events['#pilot:change'],'function');
events['#pilot:change']({target:{value:'ines'}});
assert.equal(run('state.units.find(u=>u.id===1).pilot'),'ines');
assert.equal(run('state.units.find(u=>u.id===1).max'),6);
events['#pilot:change']({target:{value:'elias'}}); // no duplicates
assert.equal(run('state.units.find(u=>u.id===1).pilot'),'ines');
run('state.selected=3;state.mode="move";render()');
events['#pilot:change']({target:{value:'isa'}});
assert.equal(run('damageFor(state.units.find(u=>u.id===3),1)'),2);
assert.equal(run('damageFor(state.units.find(u=>u.id===3),1)'),1);
run('fullRestart(); campaign.sector=2; init()');
assert.ok(run('state.intent.some(i=>i.attack==="anchor")'));
assert.ok(run('state.intent.some(i=>i.attack==="drain")'));
run('state.corruption=99;resolveEnemy()');
assert.equal(run('state.phase'),'lost');
console.log('PASS: 6 pilots, pilot swapping, uniqueness, traits, new hostile intents, corruption game-over');

run('fullRestart();state.selected=3;render()');
const oldRifts=run('state.rifts.length');
run('state.rifts.push({x:5,y:5});state.mode="attack";tryAction(5,5)');
assert.equal(run('state.rifts.length'),oldRifts);
console.log('PASS: exorcist purifies empty rift');
