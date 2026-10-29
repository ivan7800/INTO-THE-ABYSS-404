const assert=require('node:assert/strict');
const {simulate,STRATEGIES}=require('./simulador-tactico.cjs');
const results=[];
for(let sec=0;sec<5;sec++){
 for(const strategy of STRATEGIES){
  const a=simulate(sec,strategy,{upgrades:sec>0});
  const b=simulate(sec,strategy,{upgrades:sec>0});
  assert.deepEqual(a,b,'replay deterministic: sector '+sec+' '+strategy);
  assert.ok(['won','lost'].includes(a.phase),'simulation reaches terminal state');
  assert.ok(a.rounds>0 && a.rounds<=12,'bounded rounds');
  assert.ok(a.metrics.moves>0 && a.metrics.attacks>0,'policy really moves and attacks');
  assert.ok(a.metrics.specials>0,'policy really uses special abilities');
  assert.ok(a.metrics.turnsResolved<=a.rounds,'round counter sane');
  results.push(a);
 }
}
assert.ok(results.some(r=>r.sector===5&&r.phase==='won'),'final boss can be defeated by tactical policy');
assert.ok(results.every(r=>r.strategy!=='agresiva'||r.phase==='won'),'aggressive policy has path to victory in five sectors');
console.log('Fase 27: 15 simulaciones reproducibles, movimientos/ataques/habilidades, 5 sectores y jefe final: PASS');
