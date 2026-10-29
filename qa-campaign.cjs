const assert=require('node:assert/strict');
const {simulateCampaign}=require('./simulador-tactico.cjs');
const first=simulateCampaign('agresiva'),replay=simulateCampaign('agresiva');
assert.deepEqual(first,replay,'La campaña enlazada debe poder reproducirse');
assert.equal(first.complete,true,'Debe existir una ruta de victoria en campaña enlazada');
assert.deepEqual(first.sectors.map(s=>s.phase),['won','won','won','won','won']);
assert.deepEqual(first.sectors.map(s=>s.upgrades),[[],['pen'],['pen','her'],['pen','her'],['pen','her','viu']]);
assert.ok(first.sectors.every(s=>s.metrics.moves>0&&s.metrics.attacks>0));
console.log('PASS campaign: 5 sectores consecutivos, desbloqueos reales, jefe final, replay');
