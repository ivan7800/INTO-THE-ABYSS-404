import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
let paints=0;const ctx=new Proxy({save(){},restore(){},drawImage(){paints++},fillRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){}},{get:(o,k)=>o[k],set(o,k,v){o[k]=v;return true}});
const sandbox={window:{},document:{createElement(tag){assert.equal(tag,'canvas');return {width:0,height:0,getContext(){return ctx}}}}};
vm.runInNewContext(fs.readFileSync('environment-art.js','utf8'),sandbox);
const e=sandbox.window.AbyssEnvironment;assert.equal(e.themes,5);
for(let s=0;s<5;s++)for(const type of ['tile','building','rock','rift']){assert.ok(e.sprite(type,s));assert.equal(e.paint(ctx,type,{x:100,y:100},s),true)}
assert.equal(paints,20);assert.strictEqual(e.sprite('building',1),e.sprite('building',1));assert.equal(e.paint({},'tile',{x:0,y:0}),false);
const html=fs.readFileSync('index.html','utf8'),game=fs.readFileSync('game.js','utf8');
assert.ok(html.indexOf('environment-art.js')<html.indexOf('game.js'));
for(const type of ['tile','building','rock','rift'])assert.ok(game.includes("'"+type+"'"));
console.log('PASS: 5 sector themes, 4 atlas types, cache, fallback and script order');
