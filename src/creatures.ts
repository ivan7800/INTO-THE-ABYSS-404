/** REBIRTH 0.45: original 16-bit style character atlas + purely visual combat FX.
 * All sprites are painted on 48x64 low-resolution canvases, with nearest-neighbor scaling.
 * No rules, tactical coordinates, turns, damage or save data are modified here.
 */
(() => {
 type Ctx = CanvasRenderingContext2D;
 type Actor = {id:number;type:string;side:string;hp:number;max:number;acted?:boolean;stunned?:boolean};
 type Point = {x:number;y:number};
 type RenderApi = {paint:(ctx:Ctx,p:Point,u:Actor,now:number,reduced:boolean)=>boolean;sprite:(type:string,frame?:number,injured?:boolean)=>HTMLCanvasElement;types:string[];version:string};
 const pal={void:'#0b111d',outline:'#152332',deep:'#263445',iron:'#435866',steel:'#6f8790',bone:'#c1b7a6',ivory:'#eee0bc',gold:'#d0a66c',jade:'#71cfbd',ice:'#b9efe3',lilac:'#bba1da',wine:'#733650',meat:'#a45c75',flesh:'#d99a9e',eye:'#ffe5b2',black:'#130e20'};
 const actors=['pen','her','viu','eng','vig','lar','boss','leviathan','seer','anchor','weaver','stalker','herald'];
 const cache=new Map<string,HTMLCanvasElement>();
 function make(type:string,frame=0,injured=false):HTMLCanvasElement {
  const c=document.createElement('canvas');c.width=48;c.height=64;
  const g=c.getContext('2d');if(!g)return c;
  g.imageSmoothingEnabled=false;
  const r=(x:number,y:number,w:number,h:number,color:string)=>{g.fillStyle=color;g.fillRect(x|0,y|0,Math.max(1,w|0),Math.max(1,h|0))};
  const poly=(points:number[][],color:string)=>{g.fillStyle=color;g.beginPath();g.moveTo(points[0][0],points[0][1]);for(const p of points.slice(1))g.lineTo(p[0],p[1]);g.closePath();g.fill()};
  const line=(x:number,y:number,xx:number,yy:number,color:string,width=1)=>{g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x|0,y|0);g.lineTo(xx|0,yy|0);g.stroke()};
  const eye=(x:number,y:number,color:string)=>{r(x-3,y-2,7,5,pal.void);r(x-2,y-2,5,3,color);r(x,y-1,2,2,pal.ivory)};
  const ally=['pen','her','viu'].includes(type);const wave=frame%4===1?1:frame%4===3?-1:0;
  if(ally){
   const color=type==='pen'?pal.gold:type==='her'?pal.jade:pal.lilac;
   // Lower body / independent animated legs with chiseled armor highlights.
   r(13,49,9,12,pal.void);r(27,49,9,12,pal.void);r(14,50+wave,7,10,pal.iron);r(28,50-wave,7,10,pal.iron);
   r(13,58+wave,10,3,pal.steel);r(27,58-wave,10,3,pal.steel);r(15,52+wave,4,2,pal.bone);r(29,52-wave,4,2,pal.bone);
   poly([[10,24],[16,16],[32,16],[39,25],[36,48],[29,53],[17,53],[12,47]],pal.void);
   poly([[13,26],[18,20],[31,20],[36,27],[33,46],[27,49],[19,49],[15,44]],pal.iron);
   poly([[16,27],[24,24],[33,27],[30,43],[18,43]],pal.deep);r(19,29,10,4,color);
   for(const yy of [35,41]){r(17,yy,15,1,pal.steel);r(20,yy+2,9,1,pal.void)}
   for(const xx of [13,34]){r(xx,30,2,14,pal.void);r(xx,32,1,3,pal.ivory)}
   // Helm: deep dark recess, colored vision slit, carved metal ridges.
   poly([[17,10],[22,7],[29,8],[34,13],[33,26],[15,26]],pal.void);
   poly([[19,12],[24,9],[30,12],[31,23],[18,23]],pal.steel);
   r(19,17,12,4,pal.void);r(20,18,10,2,pal.ice);r(22,18,4,1,pal.ivory);
   r(16,13,2,10,color);r(32,13,2,10,color);r(21,24,8,2,pal.void);
   for(const xx of [12,36]){r(xx-2,25+wave,5,19,pal.void);r(xx-1,26+wave,4,15,color);r(xx,30+wave,2,4,pal.ivory)}
   if(type==='pen'){
    // Great scythe + reinforced pauldrons.
    poly([[7,21],[12,15],[17,21],[15,34],[8,31]],pal.gold);
    poly([[34,22],[39,15],[44,22],[40,33],[35,32]],pal.gold);
    r(41,8,2,50,pal.iron);r(40,5,4,4,pal.bone);poly([[30,9],[40,2],[46,3],[45,8],[38,11]],pal.ivory);
    r(8,24,3,3,pal.ivory);r(37,24,3,3,pal.ivory);r(23,28,4,3,pal.gold);
   }else if(type==='her'){
    // Cabled pylons on shoulders; luminous alchemical antenna.
    for(const xx of [6,39]){r(xx,17,4,27,pal.void);r(xx+1,9,2,29,pal.gold);r(xx-1,7,6,5,pal.ice);r(xx,7,4,3,pal.jade)}
    r(21,2,7,7,pal.void);r(23,1,3,9,pal.gold);r(23,0,3,3,pal.ice);
    r(19,31,11,8,pal.void);r(21,32,7,5,pal.jade);r(23,33,3,2,pal.ivory);
   }else{
    // Veiled mech; broken halo, ritual strings and asymmetric plates.
    poly([[9,17],[18,5],[30,5],[40,17],[35,26],[12,26]],pal.lilac);
    poly([[14,17],[21,10],[29,10],[36,18],[34,26],[15,26]],pal.deep);
    for(const xx of [5,41]){r(xx,18,2,28,pal.lilac);r(xx-2,44+wave,6,4,pal.ivory);r(xx,48+wave,1,6,pal.jade)}
    r(21,2,7,3,pal.ivory);r(22,0,5,2,pal.lilac);r(22,29,6,7,pal.void);r(23,30,4,5,pal.lilac);
    r(7,16,2,7,pal.ivory);r(40,16,2,7,pal.ivory);
   }
   for(let i=0;i<10;i++){const xx=14+(i*13)%21,yy=27+(i*11)%22;r(xx,yy,2,1,i%3===0?pal.ivory:pal.void)}
  } else {
   const isBoss=type==='boss'||type==='leviathan';
   const main=type==='seer'?pal.deep:type==='anchor'?pal.iron:type==='weaver'?pal.wine:pal.meat;
   // Distinct animated appendages. Each species is intentionally recognizable in silhouette.
   if(type==='weaver'){
    for(let i=0;i<4;i++){
     const xx=3+i*13;line(24,30,xx,17+((i+frame)%2)*8,pal.wine,4);line(xx,17+((i+frame)%2)*8,xx+(i-1)*3,53+wave,pal.flesh,3);
     r(xx-2,49+wave,4,5,pal.ivory);
    }
    poly([[15,18],[24,9],[36,22],[34,42],[22,53],[12,40]],pal.void);
    poly([[17,19],[24,13],[32,24],[31,39],[23,46],[16,36]],pal.wine);
    for(let i=0;i<5;i++)r(19+i*2,25+(i%2)*3,2,5,pal.flesh);
    eye(25,29,pal.eye);
   }else if(type==='seer'){
    poly([[24,4],[38,22],[34,49],[23,60],[10,49],[8,25]],pal.void);
    poly([[24,8],[34,24],[30,47],[23,55],[14,46],[13,25]],pal.iron);
    poly([[24,13],[33,27],[30,42],[17,42],[15,28]],pal.deep);
    eye(24,29,pal.eye);
    for(let i=0;i<3;i++){const xx=5+i*18,yy=13+(i%2)*8+wave;r(xx,yy,5,11,pal.lilac);r(xx+1,yy+2,3,5,pal.ivory)}
    for(let j=0;j<5;j++)r(17+j*3,46+j%2*2,2,6,pal.wine);
   }else if(type==='anchor'){
    poly([[22,2],[33,15],[37,41],[30,55],[17,55],[10,39],[13,16]],pal.void);
    poly([[23,6],[30,18],[32,39],[27,49],[19,49],[15,39],[17,17]],pal.iron);
    for(const dx of [-1,1]){const xx=dx<0?7:38;line(24,29,xx,41+wave,pal.meat,5);r(xx-4,41+wave,8,8,pal.void);r(xx-3,43+wave,6,4,pal.flesh)}
    r(22,13,5,30,pal.void);r(24,18,2,20,pal.eye);eye(24,22,pal.flesh);
   }else if(type==='stalker'){
    poly([[18,8],[29,7],[37,27],[32,48],[15,47],[10,25]],pal.void);
    poly([[19,11],[28,10],[33,27],[29,44],[17,43],[14,26]],pal.wine);
    for(const dx of [-1,1]){const xx=dx<0?8:39;line(24,28,xx,37+wave,pal.meat,6);line(xx,36+wave,xx+dx*6,58,pal.flesh,4);for(let j=0;j<3;j++)r(xx+dx*(4+j*2),55+j%2*3,3,5,pal.ivory)}
    eye(19,24,pal.eye);eye(30,24,pal.eye);r(22,34,6,7,pal.void);
   }else if(type==='lar'){
    for(let i=0;i<5;i++){const xx=9+i*7;r(xx,44+i%2*2+wave,4,15,pal.wine);r(xx,55+i%2*2+wave,3,4,pal.flesh)}
    poly([[7,24],[15,16],[31,15],[40,24],[38,47],[10,48]],pal.void);
    poly([[10,27],[17,19],[30,19],[37,28],[34,44],[13,44]],pal.meat);
    for(let j=0;j<5;j++){r(15+j*4,27+j%2,3,3,pal.ivory);r(15+j*4,34+j%2,3,2,pal.void)}
    eye(16,25,pal.eye);eye(32,25,pal.eye);
   }else if(type==='herald'){
    poly([[12,19],[24,2],[37,19],[39,48],[31,56],[17,56],[9,47]],pal.void);
    poly([[16,21],[24,8],[33,21],[34,46],[29,51],[20,51],[14,43]],pal.meat);
    for(let i=0;i<4;i++){const xx=8+i*11;r(xx,5+i%2*4,4,22,pal.wine);r(xx+1,6+i%2*4,2,12,pal.flesh)}
    poly([[17,28],[24,21],[32,28],[31,39],[17,39]],pal.void);r(20,30,9,5,pal.eye);r(22,32,4,3,pal.wine);
   }else{
    // Baseline aberration or final Leviathan, with multiple watching eyes.
    const tailCount=isBoss?7:5;
    for(let i=0;i<tailCount;i++){const xx=3+i*(isBoss?7:9);line(24,35,xx,55+((i+frame)%3)*2,pal.wine,isBoss?6:4);r(xx-2,54+((i+frame)%3)*2,5,4,pal.flesh)}
    poly([[24,4],[35,10],[43,27],[41,46],[31,55],[14,54],[6,43],[4,26],[14,11]],pal.void);
    poly([[24,9],[34,15],[38,29],[35,44],[29,48],[16,48],[10,42],[10,29],[16,15]],main);
    for(let i=0;i<(isBoss?5:3);i++){const xx=12+i*6;r(xx,7+(i%2)*3,4,11,pal.flesh);r(xx+1,5+(i%2)*3,2,4,pal.ivory)}
    for(let i=0;i<(isBoss?5:2);i++){eye(15+i*(isBoss?5:15),26+(i%2)*5,pal.eye)}
    if(isBoss){r(18,40,13,5,pal.void);for(let i=0;i<5;i++)r(19+i*3,40,2,3,pal.ivory)}
   }
   // Shared highlight/damage textures. Deliberately sparse to retain pixel silhouette.
   for(let i=0;i<15;i++){const xx=12+(i*11)%25,yy=14+(i*7)%33;r(xx,yy,1+(i%3===0?1:0),1,i%4===0?pal.flesh:pal.wine)}
   if(type==='vig'){for(let i=0;i<6;i++)r(10+i*5,4+i%2*3,3,13,pal.ivory);eye(24,28,pal.eye)}
   if(type==='eng'){r(7,8,5,22,pal.flesh);r(36,7,5,20,pal.flesh);eye(23,29,pal.eye)}
  }
  if(injured){for(let i=0;i<5;i++){const xx=14+(i*11)%23,yy=28+(i*13)%20;line(xx,yy,xx+4,yy+5,ally?'#ec856d':'#ffd09f',2)}}
  return c;
 }
 function sprite(type:string,frame=0,injured=false){const k=`${type}:${frame%4}:${injured?1:0}`;let c=cache.get(k);if(!c){c=make(type,frame,injured);cache.set(k,c)}return c}
 function paint(ctx:Ctx,p:Point,u:Actor,now:number,reduced:boolean){
  if(!ctx?.drawImage)return false;
  const isBoss=u.type==='boss'||u.type==='leviathan';const ally=u.side==='ally';
  const frame=reduced?0:Math.floor(now/(ally?180:260)+u.id)%4;
  const canvas=sprite(u.type,frame,u.hp/u.max<=.4);
  const width=isBoss?91:ally?58:64,height=isBoss?118:ally?78:86;
  ctx.save();ctx.imageSmoothingEnabled=false;
  // Contact shadow and faint luminescence, kept UNDER the raster sprite.
  ctx.fillStyle='#040b15ac';ctx.beginPath();ctx.ellipse(p.x,p.y+3,isBoss?38:24,isBoss?14:10,0,0,Math.PI*2);ctx.fill();
  if(!reduced && !ally){ctx.globalAlpha=.13+.06*Math.sin(now/400+u.id);ctx.fillStyle=isBoss?'#ffa3d0':'#ec7da8';ctx.beginPath();ctx.ellipse(p.x,p.y-height/2+8,width*.39,height*.41,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
  ctx.drawImage(canvas,Math.round(p.x-width/2),Math.round(p.y-height+9),width,height);
  if(u.stunned){ctx.strokeStyle='#c2e6ff';ctx.lineWidth=2;ctx.setLineDash([4,5]);ctx.beginPath();ctx.ellipse(p.x,p.y-height+18,width*.37,8,0,0,Math.PI*2);ctx.stroke()}
  ctx.restore();return true;
 }
 type Flare={x:number;y:number;color:string;start:number;seed:number};
 type Wound={x:number;y:number;amount:number;building:boolean;destroyed:boolean;start:number};
 const flares:Flare[]=[];const wounds:Wound[]=[];
 function damage(x:number,y:number,amount:number,building:boolean,destroyed:boolean){
  wounds.push({x,y,amount,building,destroyed,start:performance.now()});if(wounds.length>24)wounds.shift();
 }
 function impact(x:number,y:number,color:string){flares.push({x,y,color,start:performance.now(),seed:(x*13+y*41)%17});if(flares.length>16)flares.shift()}
 function effects(ctx:Ctx,project:(x:number,y:number)=>Point,now:number,reduced:boolean){
  for(let i=wounds.length-1;i>=0;i--){const w=wounds[i],age=now-w.start;if(age>950){wounds.splice(i,1);continue}
   const p=project(w.x,w.y),progress=age/950;ctx.save();ctx.globalAlpha=Math.max(0,1-progress);
   ctx.textAlign='center';ctx.font='bold 15px monospace';ctx.fillStyle=w.building?'#ffcc97':'#ffab9c';
   ctx.fillText(`−${w.amount}`,p.x,p.y-42-Math.floor(progress*23));
   if(w.destroyed && !reduced){const color=w.building?'#baa48b':'#b76c90';ctx.fillStyle=color;for(let j=0;j<16;j++){
    const vx=(j%7-3)*7,vy=((j*7)%5-3)*4;
    ctx.fillRect(Math.round(p.x+vx*progress),Math.round(p.y-16+vy*progress+30*progress*progress),j%3+2,j%4+2);
   }}ctx.restore();
  }
  for(let i=flares.length-1;i>=0;i--){const f=flares[i],life=now-f.start;if(life<0)continue;if(life>520){flares.splice(i,1);continue}
   const p=project(f.x,f.y),progress=life/520;ctx.save();ctx.globalAlpha=1-progress;
   ctx.strokeStyle=f.color;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y-12,10+progress*32,5+progress*16,0,0,Math.PI*2);ctx.stroke();
   if(!reduced)for(let n=0;n<12;n++){const angle=n*Math.PI/6+f.seed*.2,rr=progress*(24+n%3*9);ctx.fillStyle=n%2?f.color:'#ffecd0';ctx.fillRect(Math.round(p.x+Math.cos(angle)*rr),Math.round(p.y-14+Math.sin(angle)*rr-progress*14),n%3?3:5,n%3?3:4)}
   ctx.restore();
  }
 }
 const api:RenderApi={paint,sprite,types:actors,version:'REBIRTH 0.45 PIXEL ATLAS'};
 (window as Window & {AbyssPixel?:RenderApi;AbyssCombatFX?:unknown}).AbyssPixel=api;
 (window as Window & {AbyssCombatFX?:unknown}).AbyssCombatFX={impact,effects,damage};
})();
