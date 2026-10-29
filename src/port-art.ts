/**
 * REBIRTH 0.80 — Original deterministic, pixelated Porto dos Ahogados artwork.
 * These atlas canvases provide real textures for independent PIXI.Sprite objects.
 * No network requests and no game-state mutation.
 */
(() => {
 type ArtKind='tile'|'building'|'rock';
 const cache=new Map<string,HTMLCanvasElement>();
 const C={ink:'#0b1825',slate:'#243947',stone:'#405962',edge:'#718b8c',salt:'#8c9c93',
 moss:'#315957',gold:'#e0b975',glass:'#e3d7a6',roof:'#3b555d',sea:'#193b46'};
 function make(kind:ArtKind,variant:number,damage:number){
  const key=kind+':'+variant+':'+damage;
  const existing=cache.get(key);if(existing)return existing;
  const canvas=document.createElement('canvas');
  canvas.width=kind==='tile'?78:kind==='building'?84:72;
  canvas.height=kind==='tile'?48:kind==='building'?120:64;
  const g=canvas.getContext('2d');if(!g)throw Error('No 2D texture context');
  g.imageSmoothingEnabled=false;
  const rect=(x:number,y:number,w:number,h:number,color:string)=>{g.fillStyle=color;g.fillRect(x,y,w,h)};
  const path=(points:number[][],fill:string,stroke?:string)=>{
   g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();
   g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=1;g.stroke()}
  };
  if(kind==='tile'){
   const k=variant%4;
   path([[39,1],[76,24],[39,47],[2,24]],k===1?'#38545b':k===2?'#435960':C.stone,C.edge);
   path([[4,24],[39,45],[74,24],[39,27]],'#223c48');
   const cracks=[[[18,21],[30,24],[35,22]],[[52,17],[46,23],[53,27]],[[29,34],[39,32],[44,36]]];
   for(let i=0;i<3;i++){if((variant+i)%3===0){const p=cracks[i];g.strokeStyle='#172d39';g.beginPath();g.moveTo(p[0][0],p[0][1]);for(const xy of p.slice(1))g.lineTo(xy[0],xy[1]);g.stroke()}}
   if(k===2){rect(28,24,3,2,C.moss);rect(48,31,4,2,C.moss)}
   if(k===3){rect(38,18,4,2,C.sea);rect(35,20,9,2,'#2c6570')}
   rect(30,9,4,1,C.salt);rect(52,24,3,1,'#829ca0');
  }else if(kind==='building'){
   const roof=variant%3,damaged=damage<=1;
   path([[14,95],[42,108],[69,94],[42,79]],'#152b38');
   path([[17,30],[41,17],[41,99],[17,85]],'#354e5b','#74878a');
   path([[41,17],[67,30],[67,85],[41,99]],'#263f50','#617f80');
   path([[12,30],[41,10],[72,30],[42,45]],roof===1?'#4a5d5e':'#51656a','#8a918a');
   for(let i=0;i<4;i++){rect(22+i*10,47+(i%2)*3,4,6,i%2?C.gold:'#98b0a7')}
   rect(47,62,7,12,C.ink);rect(49,64,3,8,damaged?'#4d2027':C.glass);
   rect(31,66,7,10,C.ink);rect(33,68,3,6,damaged?'#4d2027':C.gold);
   for(let i=0;i<6;i++)rect(21+i*7,35+i%2,3,2,C.slate);
   if(roof===2){rect(40,2,4,13,C.edge);rect(37,1,10,3,C.gold)}
   if(roof===1){rect(16,75,11,3,C.edge);rect(20,82,7,2,C.gold)}
   if(damaged){rect(55,41,8,3,C.ink);rect(52,44,4,9,C.ink);rect(28,88,9,4,C.ink)}
   rect(31,102,22,7,C.ink);
   for(let i=0;i<Math.max(0,Math.min(3,damage));i++)rect(34+i*6,104,4,3,C.gold);
  }else{
   path([[8,43],[17,24],[32,13],[52,24],[64,46],[38,56]],'#3d5c65','#8a9997');
   path([[17,24],[32,13],[44,24],[32,39]],'#738e8c');
   rect(29,22,4,3,C.salt);rect(45,37,6,3,C.ink);
  }
  cache.set(key,canvas);return canvas;
 }
 (window as any).AbyssPortArt={version:'0.80',create:make,cacheSize:()=>cache.size};
})();
