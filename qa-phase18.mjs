import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
let drawCalls=0;
const ctx=new Proxy({drawImage(){drawCalls++},save(){},restore(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){}},{get(o,k){return k in o?o[k]:undefined},set(o,k,v){o[k]=v;return true}});
const sandbox={window:{},document:{createElement(t){assert.equal(t,'canvas');return {width:0,height:0,getContext(){return ctx}}}}};
vm.runInNewContext(fs.readFileSync('pixel-art.js','utf8'),sandbox);
const layer=sandbox.window.AbyssPixel;
assert.equal(layer.types.length,13);
for(const type of layer.types){for(const f of [0,1]){const spr=layer.sprite(type,f);assert.equal(spr.width,32);assert.equal(spr.height,44)}}
assert.equal(layer.sprite('pen',0),layer.sprite('pen',0),'Sprite cache not stable');
for(const type of layer.types){assert.equal(layer.paint(ctx,{x:320,y:320},{type,id:2,hp:8,side:type==='pen'?'ally':'enemy'},500,false),true)}
assert.equal(drawCalls,13);
assert.equal(layer.paint({}, {x:1,y:1},{type:'pen'},0,true),false);
console.log('PASS: 13 sprites, 2 animation frames, cache, 13 draws, graceful fallback');
