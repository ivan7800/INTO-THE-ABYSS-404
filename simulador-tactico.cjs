#!/usr/bin/env node
// Phase 27: deterministic, rules-respecting tactical probe. No modification of game rules.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'game.js'),'utf8');
function engine(){
 const elements={};const canvasCtx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),measureText:()=>({width:20})},{get:(o,k)=>k in o?o[k]:()=>{}});
 const store=new Map();function elem(s){return elements[s]??={value:'ada',textContent:'',hidden:false,disabled:false,setAttribute(){},addEventListener(){},replaceChildren(){},getContext(){return canvasCtx},getBoundingClientRect(){return {left:0,top:0,width:640,height:640}}}}
 const globals={document:{querySelector:elem,createElement:()=>({textContent:''}),addEventListener(){},hidden:false},window:{matchMedia:()=>({matches:false})},localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},performance:{now:()=>1000},requestAnimationFrame:()=>0,console};
 vm.createContext(globals);vm.runInContext(source,globals,{filename:'game.js'});return code=>vm.runInContext(code,globals);
}
const STRATEGIES=['defensa','agresiva','mixta'];
// These plans are deterministic and do not see enemy actions beyond the announced intent tiles.
const PLAN=`(function(){
 const strategy=__strategy;
 if(!state.choiceMade)chooseEvent(strategy==='agresiva'?'seal':'fortify');
 const danger=(x,y)=>state.intent.reduce((n,i)=>n+(i.x===x&&i.y===y?i.damage:0),0)+(state.omen&&state.omen.x===x&&state.omen.y===y?2:0)+(state.resonance&&state.resonance.x===x&&state.resonance.y===y?2:0)+(state.rifts.some(r=>r.x===x&&r.y===y)?2:0);
 const enemies=()=>alive('enemy');
 const scorePos=(u,p)=>{
  const nearest=Math.min(12,...enemies().map(e=>dist(p,e)));
  const ranged=u.type==='pen'?1:3+(u.attackBonus||0);
  const attackable=enemies().filter(e=>dist(p,e)<=ranged && dist(p,e)>=1).length;
  const canHit=attackable?8:0;
  const obj=state.objective&&!state.objectiveDone?Math.max(0,5-dist(p,state.objective))*0.55:0;
  const pressure=strategy==='agresiva'?2.8:strategy==='mixta'?1.6:.6;
  return canHit*pressure-nearest*pressure+obj-danger(p.x,p.y)*4-(state.rifts.some(r=>r.x===p.x&&r.y===p.y)?3:0);
 };
 for(const uid of [3,2,1]){
  let u=alive('ally').find(z=>z.id===uid);if(!u||state.phase!=='player')continue;
  state.selected=u.id;
  if(u.type==='viu'&&state.rifts.some(r=>dist(r,u)<=3)&&(!u.specialUsed||state.turn-(u.specialTurn||0)>=3))special();
  if(u.type==='pen'&&(!u.specialUsed||state.turn-(u.specialTurn||0)>=3)&&danger(u.x,u.y)>0)special();
  if(u.type==='her'&&enemies().filter(e=>dist(u,e)<=2).length>=2&&(!u.specialUsed||state.turn-(u.specialTurn||0)>=3))special();
  if(state.phase!=='player')break;
  const current=scorePos(u,u),possible=[...pathCells(u).keys()].map(k=>{const [x,y]=k.split(',').map(Number);return {x,y}}).sort((a,b)=>scorePos(u,b)-scorePos(u,a)||a.y-b.y||a.x-b.x);
  const best=possible[0];
  if(best&&scorePos(u,best)>current+0.15){state.selected=uid;state.mode='move';tryAction(best.x,best.y)}
  u=alive('ally').find(z=>z.id===uid);if(!u||state.phase!=='player')continue;
  const targets=enemies().filter(e=>u.type==='pen'?dist(u,e)===1:dist(u,e)>=1&&dist(u,e)<=3+(u.attackBonus||0))
   .sort((a,b)=>(a.hp-b.hp)||dist(u,a)-dist(u,b)||a.id-b.id);
  if(targets.length){const t=targets[0];state.selected=uid;state.mode='attack';tryAction(t.x,t.y)}
  if(u.type==='pen'&&(!u.specialUsed||state.turn-(u.specialTurn||0)>=3)&&state.phase==='player')special();
  if(u.type==='her'&&enemies().some(e=>dist(u,e)<=2)&&(!u.specialUsed||state.turn-(u.specialTurn||0)>=3)&&state.phase==='player')special();
 }
 if(state.phase==='player')resolveEnemy();
})()`;
function simulate(sector,strategy,{maxRounds=12,upgrades=false}={}){
 const run=engine();run(`campaign.sector=${sector};campaign.upgrades=${JSON.stringify(upgrades?['pen','her','viu']:[])};init()`);
 let rounds=0;while(run(`state.phase==='player'`)&&rounds<maxRounds){run(`var __strategy=${JSON.stringify(strategy)};`);run(PLAN);rounds++}
 return JSON.parse(run(`JSON.stringify({sector:campaign.sector+1,strategy:__strategy,phase:state.phase,turn:state.turn,rounds:${rounds},integrity:state.integrity,corruption:state.corruption,allies:alive('ally').length,enemies:alive('enemy').length,metrics:metrics()})`));
}
function simulateCampaign(strategy,{maxRoundsPerSector=12}={}){
 const run=engine(),sectors=[];
 for(let sector=0;sector<5;sector++){
  let rounds=0;
  while(run("state.phase==='player'")&&rounds<maxRoundsPerSector){run(`var __strategy=${JSON.stringify(strategy)};`);run(PLAN);rounds++}
  const result=JSON.parse(run(`JSON.stringify({sector:campaign.sector+1,phase:state.phase,rounds:${rounds},integrity:state.integrity,corruption:state.corruption,upgrades:campaign.upgrades.slice(),metrics:metrics()})`));
  sectors.push(result);
  if(result.phase!=='won')break;
  run('nextMission()');
 }
 return {strategy,complete:run('campaign.complete'),sectors};
}
function main(){const runs=[];for(let i=0;i<5;i++)for(const s of STRATEGIES)runs.push(simulate(i,s,{upgrades:i>0}));const report={format:'abyss-tactical-benchmark',version:1,scope:'deterministic scripted policies, no manual browser playtest',runs};if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));else{console.log('SECTOR | POLÍTICA | RESULTADO | RONDAS | INTEGRIDAD | CORRUPCIÓN | ENEMIGOS | ACCIONES');for(const r of runs)console.log([r.sector,r.strategy,r.phase,r.rounds,r.integrity,r.corruption,r.enemies,`${r.metrics.moves}/${r.metrics.attacks}/${r.metrics.specials}`].join(' | '));console.log(`Victorias: ${runs.filter(x=>x.phase==='won').length}/${runs.length}; jefe final: ${runs.filter(x=>x.sector===5&&x.phase==='won').length}/3`)}return report}
if(require.main===module)main();module.exports={simulate,simulateCampaign,main,STRATEGIES};
