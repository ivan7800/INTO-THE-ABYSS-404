import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
let rects=0,draws=0;
const ctx=new Proxy({fillRect(){rects++},drawImage(){draws++},save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){}},{get(o,k){return o[k]},set(o,k,v){o[k]=v;return true}});
const sandbox={window:{},document:{createElement(){return {width:0,height:0,getContext(){return ctx}}}}};
for(const f of ['pixel-art.js','environment-art.js'])vm.runInNewContext(fs.readFileSync(f,'utf8'),sandbox);
const A=sandbox.window.AbyssPixel,E=sandbox.window.AbyssEnvironment;
for(const kind of A.types){assert.equal(A.sprite(kind,0).width,32);assert.equal(A.sprite(kind,1).height,44);assert.equal(A.sprite(kind,0),A.sprite(kind,0));}
for(let sector=0;sector<5;sector++)for(const kind of ['tile','building','rock','rift']){assert.ok(E.sprite(kind,sector));assert.ok(E.paint(ctx,kind,{x:200,y:200},sector,1))}
assert.equal(E.themes,5);assert.ok(rects>600,'Texture detail pass absent');assert.equal(draws,20);
assert.ok(fs.readFileSync('index.html','utf8').includes('pixel-art.js'));
assert.ok(fs.readFileSync('index.html','utf8').includes('environment-art.js'));
console.log('PASS phase28: 13 sprite silhouettes, detail pass, 5 sector environments, drawing and cache');
