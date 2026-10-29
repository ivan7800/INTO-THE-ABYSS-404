/* Into the Abyss — Phase 19: deterministic low-resolution environment atlas. */
(()=>{'use strict';
const cache=new Map();
const themes=[
 {stone:'#52656b',edge:'#9caeaa',roof:'#44545b',light:'#e4bc78',accent:'#6c9297'},
 {stone:'#4a6259',edge:'#89a68a',roof:'#314c40',light:'#b7cf95',accent:'#638a6a'},
 {stone:'#515268',edge:'#a4a1bd',roof:'#37374f',light:'#c9a4d0',accent:'#77729e'},
 {stone:'#60666a',edge:'#b2afa1',roof:'#484a51',light:'#dab885',accent:'#8e8580'},
 {stone:'#665464',edge:'#b7a5bb',roof:'#50374f',light:'#e4b0ce',accent:'#9b7391'}
];
const H=(n,s=0)=>((Math.imul(n+17,1103515245)^Math.imul(s+3,12345))>>>0)/4294967295;
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function make(kind,sector,variant=0){
 const c=canvas(kind==='tile'?38:kind==='rift'?38:40,kind==='tile'?20:kind==='rift'?24:68);
 const g=c.getContext('2d');if(!g)return null;
 const t=themes[sector]||themes[0],R=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)},
 P=(pts,col)=>{g.fillStyle=col;g.beginPath();g.moveTo(...pts[0]);for(const xy of pts.slice(1))g.lineTo(...xy);g.closePath();g.fill()};
 if(kind==='tile'){
  // Transparent, sparse cobbles: base color and threats stay visible underneath.
  g.globalAlpha=.42;
  for(let i=0;i<5;i++){const x=(i*11+variant*7)%34+2,y=(i*7+variant*3)%13+4;
   if(Math.abs(x-19)/19+Math.abs(y-10)/10>=.85)continue;
   R(x,y,4+(i%3),1,t.edge);R(x+1,y+2,2,1,t.stone);
  }
  if(sector===0){R(13,9,12,1,t.accent);R(16,6,1,7,t.edge)}
  if(sector===1){R(8,7,2,5,t.accent);R(7,6,4,2,t.edge);R(27,12,3,2,t.accent)}
  if(sector===2){R(17,5,2,10,t.accent);R(12,8,12,1,t.edge)}
  if(sector===3){R(2,9,34,1,t.accent);for(let i=0;i<5;i++)R(3+i*7,6,2,8,t.edge)}
  if(sector===4){R(17,4,3,12,t.edge);R(12,11,14,1,t.accent)}
 }else if(kind==='building'){
  // Small isometric buildings with distinct sector architecture; base at y=65.
  const tall=variant%3===2, h=tall?43:variant%3===1?36:30, base=61;
  P([[3,base-h],[19,base-h-9],[37,base-h],[20,base-h+9]],t.roof);
  P([[3,base-h],[20,base-h+9],[20,base],[3,base-10]],t.stone);
  P([[20,base-h+9],[37,base-h],[37,base-10],[20,base]],t.accent);
  for(let k=0;k<3;k++){const yy=base-h+13+k*8;if(yy>base-9)break;R(7,yy,4,5,k===1?t.light:'#172733');R(14,yy+3,3,5,'#1b2a34');R(25,yy+1,4,5,k%2?t.light:'#1b2a34');R(33,yy-2,2,5,'#172733')}
  if(sector===0){R(7,base-h-8,2,9,t.edge);R(5,base-h-9,6,2,t.light)}
  if(sector===1){R(9,base-h-7,3,8,t.edge);R(5,base-h-11,12,5,t.accent);R(11,base-h-16,2,8,t.edge)}
  if(sector===2){P([[20,base-h-22],[25,base-h-3],[16,base-h-4]],t.edge);R(22,base-h-15,2,7,t.light)}
  if(sector===3){R(27,base-h-17,8,17,t.stone);R(28,base-h-13,6,6,t.light);R(30,base-h-11,2,2,'#162330')}
  if(sector===4){P([[19,base-h-24],[26,base-h],[12,base-h]],t.edge);R(18,base-h-12,3,8,t.light);R(8,base-h+12,4,8,t.light)}
  R(2,base,36,2,'#14222b');
 }else if(kind==='rock'){
   if(sector===1){R(16,24,5,35,'#3a5045');for(let i=0;i<3;i++){R(10-i*2,10+i*8,21+i*3,4,t.accent);R(13,4+i*7,13,4,t.edge)}}
   else if(sector===3){R(4,43,32,14,t.stone);R(7,37,26,6,t.edge);R(11,31,4,9,t.accent);R(24,31,4,9,t.accent)}
   else if(sector===4){P([[20,10],[32,33],[35,59],[7,59],[9,33]],t.stone);R(19,17,3,38,t.light);R(11,49,19,2,t.accent)}
   else{P([[5,53],[9,37],[24,29],[35,52],[29,61],[7,61]],t.stone);P([[9,37],[24,29],[27,42],[16,48]],t.edge);R(10,51,12,2,t.accent)}
 }else if(kind==='rift'){
   P([[2,13],[11,7],[19,10],[29,4],[37,11],[30,18],[17,16],[9,21]],'#4b2259');
   R(7,11,10,2,'#c872dc');R(19,13,12,2,'#ed9df2');R(22,9,3,3,'#e7bbff');
 }

 // FASE 28: dense, deterministic hand-placed texture motifs by biome.
 // Kept inside existing raster dimensions to preserve perspective and hit testing.
 if(kind==='tile'){
  g.globalAlpha=.36;
  for(let i=0;i<3;i++){
   const x=5+((i*13+variant*5+sector*3)%27),y=4+((i*7+variant*2)%12);
   if(Math.abs(x-19)/19+Math.abs(y-10)/10>.76)continue;
   R(x,y,3,1,i%3===0?t.light:t.edge);
   if(sector===0){R(x+1,y+2,2,1,t.roof)}
   if(sector===1){R(x,y-1,1,3,t.accent)}
   if(sector===2){R(x+2,y+1,1,2,'#c8b2e2')}
   if(sector===3){R(x,y+2,4,1,t.roof)}
   if(sector===4){R(x+1,y-2,1,3,t.light)}
  }
  g.globalAlpha=1;
 }else if(kind==='building'){
  const h=variant%3===2?43:variant%3===1?36:30,base=61;
  // Roof slates, facade seam lines, lit windows and unique landmarks.
  for(let i=0;i<4;i++){
    let x=8+i*7, yy=base-h-4+Math.abs(i-2)*2;
    R(x,yy,4,1,i%2?t.edge:t.accent);
  }
  for(let y=base-h+12;y<base-12;y+=7){R(4,y,14,1,t.roof);R(22,y-2,13,1,t.stone)}
  R(19,base-h+10,1,h-12,t.edge);R(5,base-6,12,2,t.roof);R(24,base-5,11,2,t.roof);
  if(sector===0){R(31,base-h-10,3,8,t.light);R(28,base-h-12,9,2,t.edge)}
  if(sector===1){for(let i=0;i<3;i++){R(3+i*5,base-h-13-i%2*3,3,7,t.accent)}}
  if(sector===2){R(18,base-h-18,2,8,t.light);R(14,base-h-10,10,2,t.accent)}
  if(sector===3){R(25,base-h-16,12,2,t.edge);R(33,base-h-14,2,10,t.light)}
  if(sector===4){R(13,base-h-14,2,7,t.light);R(26,base-h-9,2,8,t.light)}
 }else if(kind==='rock'){
  for(let i=0;i<5;i++){const x=10+(i*7)%20,y=39+(i*5)%17;R(x,y,3,1,i%2?t.edge:t.accent)}
 }else if(kind==='rift'){
  R(14,7,5,1,'#f2c6fc');R(22,13,3,1,'#fff2ff');R(28,9,2,2,'#d76ce9');
 }
 return c;
}
function sprite(kind,sector,variant=0){const id=`${kind}:${sector}:${variant}`;if(!cache.has(id))cache.set(id,make(kind,sector,variant));return cache.get(id)}
function paint(ctx,kind,p,sector=0,variant=0){if(!ctx?.drawImage)return false;const pic=sprite(kind,sector,variant);if(!pic)return false;
 ctx.save();ctx.imageSmoothingEnabled=false;
 if(kind==='tile')ctx.drawImage(pic,Math.round(p.x-33),Math.round(p.y-18),66,36);
 else if(kind==='rift')ctx.drawImage(pic,Math.round(p.x-28),Math.round(p.y-19),56,38);
 else ctx.drawImage(pic,Math.round(p.x-26),Math.round(p.y-89),52,92);
 ctx.restore();return true;
}
window.AbyssEnvironment={paint,sprite,themes:themes.length};
})();
