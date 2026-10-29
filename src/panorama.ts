/** REBIRTH v0.65 — five original hand-coded pixel-art panoramas at half resolution.
 * They are cached. Drawing them does not affect tactical state or hit testing.
 */
(() => {
  type Ctx=CanvasRenderingContext2D;
  type API={paint:(ctx:Ctx,sector:number)=>void;get:(sector:number)=>HTMLCanvasElement;version:string};
  const cache=new Map<number,HTMLCanvasElement>();
  const palettes=[
    ['#101f2a','#1a3440','#2c4c55','#829795','#d3b887'],
    ['#101e22','#1e3534','#355449','#79a48a','#c4d4a4'],
    ['#141a31','#272944','#424464','#8578a9','#cec2de'],
    ['#16212a','#2b363d','#465359','#9d9585','#d8bc95'],
    ['#1d192d','#352b43','#55415a','#a88caa','#edc5de']
  ];
  const r=(g:Ctx,x:number,y:number,w:number,h:number,c:string)=>{g.fillStyle=c;g.fillRect(x|0,y|0,w|0,h|0)};
  const poly=(g:Ctx,pts:number[][],col:string)=>{g.fillStyle=col;g.beginPath();g.moveTo(pts[0][0],pts[0][1]);pts.slice(1).forEach(p=>g.lineTo(p[0],p[1]));g.closePath();g.fill()};
  const hash=(a:number,b:number)=>{let x=Math.imul(a+37,73856093)^Math.imul(b+17,19349663);x=Math.imul(x^(x>>>13),1274126177);return (x>>>0)/4294967296};
  function create(sector:number){
    const id=Math.max(0,Math.min(4,sector|0)), c=document.createElement('canvas');c.width=320;c.height=88;
    const g=c.getContext('2d');if(!g)return c;g.imageSmoothingEnabled=false;
    const [deep,mid,near,edge,light]=palettes[id];
    // Gradient composed as chunky color strips for genuine pixel-art edges.
    for(let y=0;y<88;y+=4){const z=y<30?deep:y<58?mid:near;r(g,0,y,320,4,z)}
    // Occasional floating horizon glints (deterministic, no randomness per frame).
    for(let i=0;i<28;i++){const x=hash(i,id)*320,y=12+hash(i,id+19)*59;
      r(g,x,y,hash(i,id+7)>.7?2:1,1,i%3===0?light:edge)}
    if(id===0){ // PORT OF THE DROWNED: piers, ships, warped cranes, warning lamps
      for(let j=0;j<8;j++){const x=j*43-14,base=74+((j*7)%9);
        r(g,x,base-27,29,30,near);r(g,x+3,base-30,21,3,edge);
        for(let k=0;k<3;k++){r(g,x+5+k*7,base-16,3,6,deep);if(k===1&&j%2===0)r(g,x+6+k*7,base-14,1,3,light)}
        r(g,x+15,base-51,2,25,edge);r(g,x-2,base-48,35,2,edge);
        r(g,x-1,base-47,2,17,deep);r(g,x+31,base-47,2,19,deep);
      }
      poly(g,[[8,75],[80,75],[70,83],[20,83]],deep);poly(g,[[229,79],[310,79],[301,86],[239,86]],deep);
      r(g,283,14,8,51,edge);poly(g,[[279,16],[287,4],[296,16]],near);
      r(g,284,17,6,3,light);r(g,282,23,10,3,deep);
      for(let i=0;i<8;i++)r(g,5+i*44,84,25,1,edge);
    }else if(id===1){ // WITHERED FOREST: crooked trees, nests and sickly lanterns
      for(let j=0;j<23;j++){const x=(j*27+11)%328,h=17+((j*17)%46),y=81-h;
        r(g,x,y,3+(j%3),h,near);r(g,x+2,y-8,2,12,edge);
        poly(g,[[x+2,y+11],[x-13,y-7],[x-9,y-8],[x+3,y+1]],mid);
        poly(g,[[x+2,y+16],[x+17,y-4],[x+15,y-7],[x+2,y+5]],mid);
        if(j%5===0){r(g,x+8,y+4,2,2,light);r(g,x+12,y+1,1,1,light)}
      }
      for(let i=0;i<12;i++){const x=i*29-3,y=74+(i%3)*4;poly(g,[[x,y+8],[x+8,y-6],[x+18,y+8]],deep)}
    }else if(id===2){ // DROWNED CITY: cyclopean spires and impossible angles
      for(let j=0;j<13;j++){const x=j*27-6,h=29+(j*29)%40,top=78-h;
        poly(g,[[x,78],[x+4,top+8],[x+13,top-7],[x+22,top+5],[x+24,78]],near);
        r(g,x+10,top+13,3,15,deep);r(g,x+11,top+16,1,3,light);
        r(g,x+2,79,19,2,edge);if(j%3===0){poly(g,[[x-3,top+1],[x+8,top-13],[x+18,top+3]],mid)}
      }
      for(let i=0;i<8;i++)r(g,12+i*41,57+(i%3)*5,12,2,edge);
    }else if(id===3){ // STATION: iron viaduct, telegraph poles, fatal clock
      r(g,0,60,320,16,near);r(g,5,77,310,4,deep);
      for(let j=0;j<12;j++){const x=j*28-8;r(g,x,63,3,18,edge);r(g,x+2,68,17,3,mid);
        r(g,x+7,38,3,22,near);r(g,x+5,33,7,6,edge);r(g,x+7,43,3,10,light)}
      r(g,194,15,29,57,near);r(g,189,19,39,5,edge);r(g,200,7,18,11,near);
      g.fillStyle=light;g.beginPath();g.arc(208,30,10,0,Math.PI*2);g.fill();g.fillStyle=deep;g.beginPath();g.arc(208,30,8,0,Math.PI*2);g.fill();r(g,207,23,1,8,light);r(g,208,30,5,1,light);
      for(let i=0;i<6;i++)r(g,i*58,85,37,1,edge);
    }else{ // SALT CATHEDRAL: gothic arches, rose windows, uncanny towers
      r(g,0,67,320,16,near);
      for(let j=0;j<9;j++){const x=j*42-17,top=15+(j%3)*9;
        poly(g,[[x,72],[x,top+20],[x+16,top-8],[x+32,top+20],[x+32,72]],near);
        poly(g,[[x+8,49],[x+8,37],[x+16,25],[x+24,37],[x+24,49]],deep);
        r(g,x+15,33,3,6,light);r(g,x+13,42,7,3,edge);
        r(g,x+3,59,27,2,edge);r(g,x+15,top-14,2,13,light);
      }
      // Central illuminated rose window: pixel-ring on black stone.
      for(let k=0;k<16;k++){const a=k*Math.PI/8,x=160+Math.cos(a)*18,y=43+Math.sin(a)*18;
        r(g,x,y,3,3,k%2?edge:light)}
      g.fillStyle=deep;g.beginPath();g.arc(160,43,12,0,Math.PI*2);g.fill();
      for(let k=0;k<8;k++){const a=k*Math.PI/4;r(g,160+Math.cos(a)*7,43+Math.sin(a)*7,2,2,light)}
    }
    // Dark horizon silhouette to blend into board, never over the tactical grid.
    r(g,0,85,320,3,deep);
    return c;
  }
  const get=(sector:number)=>{const s=Math.max(0,Math.min(4,sector|0));if(!cache.has(s))cache.set(s,create(s));return cache.get(s)!};
  const paint=(ctx:Ctx,sector:number)=>{if(!ctx?.drawImage)return;ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=.78;ctx.drawImage(get(sector),0,0,320,88,0,0,640,175);ctx.restore()};
  (window as Window & {AbyssPanorama?:API}).AbyssPanorama={paint,get,version:'0.65'};
})();
