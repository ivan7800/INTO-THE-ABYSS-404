/* Into the Abyss — Fase 18: sprites pixel-art originales, generados localmente. */
(()=>{'use strict';
const P={ink:'#101a2a',edge:'#283847',metal:'#556975',light:'#b6c2b5',gold:'#d1af72',teal:'#87e8d0',violet:'#c4afe4',red:'#b56787',bone:'#d2aca7',deep:'#4c2c4d',glow:'#ffdb9c'};
const cache=new Map();
function create(type,frame,variant){
 const c=document.createElement('canvas');c.width=32;c.height=44;
 const g=c.getContext('2d');if(!g)return null;
 const R=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};
 const L=(points,col)=>{g.fillStyle=col;g.beginPath();g.moveTo(...points[0]);for(let i=1;i<points.length;i++)g.lineTo(...points[i]);g.closePath();g.fill()};
 const e=frame?1:0;
 // Pixel-art technique: low resolution, explicit silhouette / material / highlight layers.
 if(type==='pen'||type==='her'||type==='viu'){
  const major=type==='pen'?P.gold:type==='her'?P.teal:P.violet;
  R(7,36+e,7,6,P.ink);R(19,36-e,7,6,P.ink);
  R(8,32,6,9,P.metal);R(20,32,5,9,P.metal);
  R(8,17,17,18,P.ink);R(9,18,15,15,P.metal);
  R(10,20,13,11,P.edge);R(11,21,11,6,major);
  R(11,12,11,10,P.ink);R(12,13,9,8,P.metal);
  R(13,16,7,3,P.teal);R(7,17,4,13,major);R(23,17,4,13,major);
  R(9,18,2,10,P.light);R(25,18,2,8,P.ink);
  R(14,29,5,4,P.gold);R(11,34,10,2,P.ink);
  R(14,9,5,4,P.edge);
  if(type==='pen'){
    R(4,14,8,7,P.gold);R(22,14,8,7,P.gold);R(5,15,5,3,P.light);
    R(28,12,2,29,P.gold);R(25,8,7,8,P.ink);R(26,9,6,5,P.light);R(27,10,5,2,P.gold);
    R(13,13,6,2,P.gold);
  } else if(type==='her'){
    R(10,5,12,10,P.ink);R(12,3,8,11,P.gold);R(13,1,6,6,P.light);
    R(4,8,2,14,P.gold);R(26,8,2,14,P.gold);R(3,7,4,4,P.teal);R(25,7,4,4,P.teal);
    R(12,25,8,3,P.teal);R(14,29,4,3,P.light);
  } else {
    R(3,15,2,19,P.violet);R(27,15,2,19,P.violet);
    R(7,7,18,2,P.violet);R(5,9,3,6,P.violet);R(24,9,3,6,P.violet);
    R(13,0,6,6,P.violet);R(15,2,2,5,P.glow);R(14,22,4,5,P.glow);
    R(3,33-e,4,5,P.violet);R(26,33+e,4,5,P.violet);
  }
  R(10,31,3,2,P.ink);R(21,31,3,2,P.ink);
 } else {
  const boss=type==='boss'||type==='leviathan';
  const main=boss?'#794768':type==='seer'?'#637989':type==='anchor'?'#68536d':type==='weaver'?'#85517f':type==='lar'?'#997184':'#925068';
  const tint=boss?'#c583a5':type==='seer'?'#d9d0b3':'#d6a2b5';
  // Distinct body structures and appendages per species, on a strict 32x44 raster.
  if(type==='weaver'){
   for(let i=0;i<4;i++){R(i*8,8+(i%2)*4,3,30,P.red);R(i*8+1,28-(i%2)*5+e,4,4,tint)}
   L([[16,5],[25,17],[20,35],[12,36],[7,20]],main);R(13,15,6,7,tint);R(15,17,2,4,P.ink);
  }else if(type==='seer'){
   L([[16,1],[26,17],[23,39],[8,39],[6,17]],P.edge);L([[16,3],[23,18],[20,32],[12,32],[9,18]],main);
   R(9,16,14,11,tint);R(13,18,6,7,P.ink);R(15,19,2,4,P.glow);
   R(1,19+e,5,6,P.violet);R(26,16-e,5,6,P.violet);
  }else if(type==='anchor'){
   L([[16,0],[27,16],[22,39],[10,39],[5,16]],P.ink);L([[16,3],[23,17],[19,34],[12,34],[9,17]],main);
   R(14,13,4,19,tint);R(2,30,7,3,P.red);R(23,30,7,3,P.red);R(4,27+e,3,11,P.red);R(26,27-e,3,11,P.red);
  }else if(type==='stalker'){
   R(9,15,14,21,P.ink);R(11,17,10,16,main);
   R(5,19,4,17,P.red);R(24,18,4,17,P.red);R(1,31-e,5,9,tint);R(27,30+e,5,10,tint);
   L([[9,18],[12,7],[17,3],[24,18]],main);R(13,16,3,3,P.glow);R(20,16,3,3,P.glow);
  }else if(type==='lar'){
   for(let i=0;i<4;i++){R(6+i*5,20-i%2*3,5,18,main);R(8+i*5,36-i%2*3,3,5,tint)}
   L([[16,10],[26,19],[25,32],[7,32],[6,18]],main);
   R(9,18,5,4,tint);R(19,18,5,4,tint);
  }else if(type==='vig'){
   R(6,16,20,23,P.ink);R(8,17,16,20,main);
   for(let i=0;i<5;i++)R(7+i*4,5+i%2*2,2,13,tint);
   R(9,19,14,11,tint);R(13,21,6,7,P.ink);R(15,23,2,3,P.glow);
   R(2,33,5,8,P.red);R(25,33,5,8,P.red);
  }else if(type==='herald'){
   L([[16,4],[26,20],[24,35],[7,35],[5,19]],main);R(8,15,16,19,tint);
   R(10,19,12,11,P.ink);R(13,22,6,5,P.glow);
   R(5,3,4,15,P.red);R(23,3,4,15,P.red);
  }else{
   for(let i=0;i<5;i++){R(2+i*6,28+(i%2)*3,4,12,main);R(2+i*6,38+(i%2)*2+e,4,4,tint)}
   L([[16,4],[26,12],[29,30],[22,37],[9,37],[3,30],[6,12]],P.ink);
   L([[16,7],[24,14],[25,29],[20,34],[11,34],[7,29],[9,14]],main);
   if(boss){for(let i=0;i<5;i++)R(6+i*5,2+(i%2)*3,3,12,tint);for(let i=0;i<3;i++){R(9+i*7,19,5,6,tint);R(11+i*7,21,2,3,P.ink)}}
   else {R(11,18,5,5,tint);R(19,18,5,5,tint);R(13,20,2,2,P.ink);R(21,20,2,2,P.ink)}
  }
  if(type==='eng'){R(7,5,4,11,tint);R(22,5,4,11,tint)}
  if(boss&&variant){R(3,16,5,4,P.glow);R(24,16,5,4,P.glow);R(14,15,4,4,P.glow)}
 }

 // FASE 28: material passes painted on the original low-resolution sprite.
 // Highlights, joints and damage marks are manually pixel-placed, not blurred vector overlays.
 if(['pen','her','viu'].includes(type)){
   const accent=type==='pen'?P.gold:type==='her'?P.teal:P.violet;
   // Segmented plating, two-tone leg armor, rivets and shadowed joints.
   for(const x of [10,21]){R(x,24,2,2,P.ink);R(x,29,2,2,P.light);R(x-1,36,5,1,P.edge)}
   R(12,14,2,3,P.light);R(20,14,2,3,P.edge);
   R(12,24,8,1,P.light);R(11,27,10,2,P.ink);R(13,28,6,1,accent);
   for(const x of [8,24]){R(x,20,1,2,P.glow);R(x,26,1,2,P.ink)}
   if(type==='pen'){
     R(3,18,8,2,P.edge);R(5,21,5,2,P.ink);R(13,12,6,2,P.light);
     R(24,10,8,2,P.glow);R(27,16,3,2,P.ink);R(29,28,2,2,P.light);
   }else if(type==='her'){
     R(11,7,10,2,P.ink);R(13,4,6,2,P.light);R(6,11,2,2,P.glow);
     R(24,11,2,2,P.glow);R(10,22,3,2,P.teal);R(20,22,3,2,P.teal);
     R(3,5+e,3,2,P.light);R(26,5-e,3,2,P.light);
   }else{
     R(6,13,3,2,P.glow);R(23,13,3,2,P.glow);R(14,8,4,2,P.light);
     for(const x of [5,26]){R(x,22+e,2,4,P.deep);R(x,27+e,2,2,P.glow)}
     R(14,20,4,2,P.ink);R(15,22,2,3,P.glow);
   }
 }else{
   // Species-specific pixel silhouettes: eyes, vents, scales and animated extremities.
   if(type==='weaver'){
     for(const x of [3,10,20,27]){R(x,25+e,2,5,P.deep);R(x,31-e,2,2,P.bone)}
     R(12,11,8,2,P.bone);R(13,22,6,2,P.ink);R(15,19,2,3,P.glow);
   }else if(type==='seer'){
     for(const x of [8,22]){R(x,7,2,10,P.light);R(x,13,2,3,P.violet)}
     R(12,28,8,2,P.edge);R(14,30,4,4,P.ink);R(15,20,2,2,P.glow);
   }else if(type==='anchor'){
     for(const y of [19,25,31]){R(13,y,6,2,P.ink);R(15,y,2,1,P.glow)}
     R(4,26+e,4,2,P.bone);R(25,26-e,4,2,P.bone);R(12,5,8,2,P.edge);
   }else if(type==='stalker'){
     R(6,23,4,3,P.edge);R(23,23,4,3,P.edge);R(14,10,5,2,P.light);
     R(11,28,3,4,P.deep);R(20,28,3,4,P.deep);R(13,18,2,2,P.glow);R(20,18,2,2,P.glow);
   }else if(type==='lar'){
     for(let i=0;i<4;i++){R(7+i*5,28+(i%2)*2,3,2,P.bone);R(8+i*5,33+(i%2)*2,2,2,P.ink)}
     R(12,14,8,2,P.edge);R(13,23,2,2,P.glow);R(20,23,2,2,P.glow);
   }else if(type==='vig'){
     for(let i=0;i<4;i++)R(8+i*4,10+(i%2)*2,2,3,P.glow);
     R(10,32,12,2,P.deep);R(12,34,8,2,P.edge);
   }else if(type==='herald'){
     R(7,6,3,11,P.light);R(22,6,3,11,P.light);R(11,12,10,3,P.deep);
     R(12,24,8,2,P.gold);R(15,25,2,3,P.glow);
   }else{
     for(let i=0;i<4;i++)R(9+i*4,12+(i%2)*2,2,3,(type==='boss'||type==='leviathan')?P.glow:P.bone);
     R(12,29,8,2,P.deep);R(14,31,4,2,P.red);
     if(type==='boss'||type==='leviathan'){R(9,9,4,3,P.glow);R(20,9,4,3,P.glow);R(13,17,6,2,P.bone)}
   }
 }
 // Scar palette on second boss form while retaining exact tactical silhouette.
 if((type==='boss'||type==='leviathan')&&variant){
   for(const xy of [[7,14],[23,19],[11,27],[19,33]]){R(xy[0],xy[1],3,2,P.glow);R(xy[0]+1,xy[1]+2,1,3,P.red)}
 }
 return c;
}
function sprite(type,frame=0,variant=0){let k=type+'-'+frame+'-'+variant;if(!cache.has(k))cache.set(k,create(type,frame,variant));return cache.get(k)}
function paint(ctx,p,u,time,reduced){if(!ctx?.drawImage)return false;const frame=reduced?0:Math.floor(time/440+u.id)%2;const pic=sprite(u.type,frame,u.type==='leviathan'&&u.hp<=6?1:0);if(!pic)return false;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=1;
 // Avoid broad color blocks behind enemies: silhouettes stay distinct.
 const boss=u.type==='leviathan'||u.type==='boss';
 const width=boss?52:44,height=boss?72:61;
 ctx.drawImage(pic,Math.round(p.x-width/2),Math.round(p.y-height+8),width,height);
 ctx.restore();return true;
}

// REBIRTH 0.83: native-ready, original 48x64 horror silhouettes.
// Pure graphics, cached by pose; never alters tactical data.
const monsterCache=new Map();
function monster(type,frame=0,hurt=false,attack=false){
 const key=[type,frame,hurt,attack].join(':');
 if(monsterCache.has(key))return monsterCache.get(key);
 const c=document.createElement('canvas');c.width=48;c.height=64;
 const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const R=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h)};
 const L=(pts,col)=>{g.fillStyle=col;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill()};
 const bright=hurt?'#f1a0a9':'#a4c2b5',flesh=hurt?'#a65b74':'#624c68',ink='#0a1725',bone='#c8a9a4';
 const k=(frame%4),s=attack?6:0,wig=(frame%2?2:-2);
 // Body planes are distinct by species (stalker, seer, weaver, anchor and larva).
 if(type==='stalker'){
  L([[7,24],[12,13],[24,5],[36,14],[41,31],[32,54],[17,53]],ink);
  L([[14,22],[20,12],[29,14],[35,31],[26,48],[18,39]],flesh);
  for(let i=0;i<3;i++){R(3+i*6,33+i*6,4,17,bone);R(38-i*6,30+i*6,4,18,bright)}
  R(16,22,5,3,bright);R(29,23,5,3,bright);R(21,34,6,6,ink);
 }else if(type==='seer'){
  L([[24,2],[38,19],[34,52],[12,54],[9,21]],ink);
  L([[24,7],[33,22],[28,49],[18,47],[15,24]],flesh);
  for(let i=0;i<3;i++){R(7+i*12,11+(i%2)*5,3,24,bright);R(16+i*7,28,3,7,bone)}
  R(16,19,16,13,bone);R(21,22,8,9,ink);R(24,23,2,6,'#f5d78c');
 }else if(type==='weaver'){
  L([[23,7],[37,17],[29,48],[17,50],[8,21]],flesh);
  for(let i=0;i<4;i++){const x=3+i*12;L([[x,22],[x+wig,40],[x-4,61],[x+6,53],[x+7,22]],i%2?bone:ink)}
  R(19,22,10,9,ink);R(22,24,4,5,'#e3c6ad');
 }else if(type==='anchor'){
  L([[24,0],[39,16],[34,54],[15,53],[9,15]],ink);
  L([[24,5],[33,19],[29,50],[18,46],[16,18]],flesh);
  for(const y of [21,31,41]){R(17,y,15,3,bone);R(22,y+3,6,2,ink)}
  R(2,35,15,5,bright);R(32,35,14,5,bright);
 }else if(type==='lar'){
  L([[23,10],[39,22],[37,40],[29,49],[12,48],[8,30]],flesh);
  for(let i=0;i<6;i++){R(5+i*7,36+(i%3)*2,4,20+(i%2)*3,ink);R(6+i*7,50+(i%3)*2,2,5,bone)}
  R(15,22,6,4,bright);R(28,22,6,4,bright);
 }else{
  L([[24,2],[42,15],[45,38],[34,54],[10,52],[3,34],[8,12]],ink);
  L([[24,7],[37,19],[36,43],[26,51],[14,43],[12,18]],flesh);
  for(let i=0;i<5;i++){R(7+i*8,4+(i%2)*5,3,16,bright);R(8+i*7,40,4,18,bone)}
  R(13,25,6,4,bright);R(29,25,6,4,bright);
 }
 // Bioluminescent scars and independently animated eldritch appendages.
 for(let i=0;i<4;i++){const x=12+i*7;R(x,14+((i+k)%4)*6,2,2,i%2?'#a987bd':'#d8ba8e')}
 if(attack){
  const off=k%2?1:0;
  L([[24,30],[20-s,36],[24,53],[28+s,36]],'#f3b67f');
  R(21,33,6,10,'#ffe7bd');
  R(2+off,14,4,19,bright);R(42-off,11,4,22,bright);
 }
 if(hurt){R(12,33,8,3,'#ffb7ae');R(29,20,9,3,'#ffb7ae');}
 monsterCache.set(key,c);return c;
}

window.AbyssPixel={paint,sprite,monster,monsterTypes:['stalker','seer','weaver','anchor','lar','vig','eng','herald','boss','leviathan'],types:['pen','her','viu','eng','vig','lar','boss','leviathan','seer','anchor','weaver','stalker','herald']};
})();
