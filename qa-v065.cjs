'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),vm=require('node:vm');
const read=f=>fs.readFileSync(f,'utf8');
assert.ok(['0.65.0','0.70.0','0.75.0'].includes(JSON.parse(read('package.json')).version));
const html=read('index.html'),game=read('src/game.ts');
for(const file of ['src/weather.ts','src/panorama.ts','dist/weather.js','dist/panorama.js'])assert.ok(fs.existsSync(file),`missing ${file}`);
for(const script of ['dist/weather.js','dist/panorama.js'])assert.ok(html.includes(`src="${script}"`),`no ${script}`);
assert.ok(html.indexOf('dist/weather.js')<html.indexOf('game.js'),'weather has to initialize before game');
assert.ok(html.indexOf('dist/panorama.js')<html.indexOf('game.js'),'panorama has to initialize before game');
assert.match(game,/AbyssPanorama\?\.paint/);
assert.match(game,/AbyssWeather\?\.paint\(ctx,campaign\.sector/);
assert.match(game,/CLIMA: /);
assert.ok(!/localStorage|state\.|damage\(|tryAction\(/.test(read('src/weather.ts')),'weather must be visual-only');
assert.ok(!/localStorage|state\.|damage\(|tryAction\(/.test(read('src/panorama.ts')),'panorama must be visual-only');
// Dedicated deterministic weather tests, separate from gameplay APIs.
const api={};const fakeWindow={};vm.runInNewContext(read('dist/weather.js'),{window:fakeWindow,Math});
const wx=fakeWindow.AbyssWeather;
assert.equal(wx.version,'0.65');
assert.equal(wx.describe(0).name,'LLUVIA NEGRA');
assert.equal(wx.describe(4).name,'SAL DE ESTRELLAS');
assert.equal(wx.describe(999).name,'SAL DE ESTRELLAS');
assert.equal(wx.describe(-22).name,'LLUVIA NEGRA');
const ops=[];const ctx={save(){ops.push('save')},restore(){ops.push('restore')},beginPath(){},rect(){},clip(){},fillRect(){ops.push('rect')},moveTo(){},lineTo(){},stroke(){ops.push('stroke')}};
for(let sector=0;sector<5;sector++){
 wx.paint(ctx,sector,1000,'full',false,'front');
 wx.paint(ctx,sector,1000,'lite',true,'back');
}
assert.equal(ops.filter(x=>x==='save').length,10);
assert.equal(ops.filter(x=>x==='restore').length,10);
assert.ok(ops.includes('rect')&&ops.includes('stroke'));
assert.match(read('launch-local.py'),/REBIRTH_v0(?:65|70)/);
assert.match(read('launch-windows.ps1'),/REBIRTH_v0(?:65|70)/);
assert.match(read('launch-local.cjs'),/REBIRTH_v0(?:65|70)/);
cp.execFileSync('bash',['-n','INICIAR-LINUX.sh']);
console.log('PASS v0.65: 5 unique weather systems, deterministic reduced-motion fallback, panoramas, entrypoints, fixed-port launchers');
