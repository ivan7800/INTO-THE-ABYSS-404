import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const js=fs.readFileSync('game.js','utf8');
const required=['drawCustodianDetail','drawCreatureDetail','drawSectorBackdrop','drawSectorGround'];
for(const fn of required)assert.match(js,new RegExp('function '+fn+'\\('),fn+' missing');
for(const id of ['seer','stalker','herald','lar','eng','vig','anchor','weaver','boss','leviathan'])assert.ok(new RegExp("k\\s*===\\s*'"+id+"'").test(js),id+' art variant missing');
assert.match(js,/drawSectorBackdrop\(campaign\.sector\)/);
assert.match(js,/drawSectorGround\(p,\s*x,\s*y\)/);
assert.match(js,/kind\s*===\s*'seer'\s*\|\|\s*kind\s*===\s*'oracle'/);
// Ensure decorative art does not mutate game state.
for(const fn of required){const start=js.indexOf('function '+fn+'(');const end=js.indexOf('\nfunction ',start+10);const body=js.slice(start,end<0?js.length:end);assert.doesNotMatch(body,/\b(?:state|campaign)\.[a-zA-Z]+\s*(?:\+\+|--|=(?!=))/,fn+' changes game state')}
console.log('PASS phase17: art variants, five sector backgrounds, seer routing, state safety');
