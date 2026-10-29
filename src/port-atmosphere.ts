/**
 * REBIRTH 0.82 — PixiJS harbor light and weather.
 * Purely presentational. No tactical-state mutation, network or timers.
 * Graphics redraw at bounded intervals and respond to reduced motion / lite mode.
 */
(() => {
 type PortView={
  sector:number;corruption:number;quality:string;
  units:{x:number;y:number;side:string;hp:number}[];
  rifts:{x:number;y:number}[];
  buildings:{x:number;y:number;hp:number}[];
 };
 const hash=(seed:number)=>{let x=Math.imul((seed|0)^0x63a91d3,2654435761);x^=x>>>16;return (x>>>0)/4294967296};
 const position=(x:number,y:number)=>({x:320+(x-y)*39,y:155+(x+y)*24});
 function attach(PIXI:{Graphics:new()=>any;Container:new()=>any},stage:any){
  const shadow=new PIXI.Graphics(),light=new PIXI.Graphics(),rain=new PIXI.Graphics(),fog=new PIXI.Graphics();
  stage.addChild(shadow,light,rain,fog);
  const particles=Array.from({length:70},(_,i)=>({
   x:hash(i+101)*750-55,y:hash(i+501)*660,
   speed:110+hash(i+901)*150,len:4+hash(i+1201)*12
  }));
  let count=0, lastStamp='',lastSector=-1,lastCorruption=-1;
  const tick=(now:number,view:PortView,reduced:boolean)=>{
   const on=view.sector===0;
   shadow.visible=light.visible=rain.visible=fog.visible=on;
   if(!on)return;
   const lite=view.quality==='lite',corruption=Math.min(100,Math.max(0,view.corruption||0));
   // Static structures are redrawn only when the tactical landscape changes.
   const stamp=view.buildings.map(b=>b.x+','+b.y+':'+b.hp).join('|')+'-'+
     view.units.map(u=>u.x+','+u.y+':'+u.side).join('|')+'-'+view.rifts.length;
   if(stamp!==lastStamp||view.sector!==lastSector||corruption!==lastCorruption){
    shadow.clear();
    for(const b of view.buildings){
     const p=position(b.x,b.y);
     shadow.ellipse(p.x+12,p.y+23,27,9)
      .fill({color:0x020811,alpha:.36});
    }
    for(const u of view.units){
     const p=position(u.x,u.y);
     shadow.ellipse(p.x+9,p.y+10,19,6)
      .fill({color:0x040a13,alpha:.24});
    }
    lastStamp=stamp;lastSector=view.sector;lastCorruption=corruption;
   }
   light.clear();rain.clear();fog.clear();
   const pulse=reduced?1:.89+Math.sin(now*.004)*.11;
   // Light pools are small enough not to wash out colored threat indicators.
   for(const [x,y] of [[121,337],[516,335],[563,155]]){
    light.circle(x,y,17*pulse).fill({color:0xe8b375,alpha:.07});
    light.circle(x,y,7*pulse).fill({color:0xffe2a0,alpha:.09});
   }
   for(const r of view.rifts){
    const p=position(r.x,r.y);
    const radius=18+(reduced?0:Math.sin(now*.006+r.x)*3);
    light.circle(p.x,p.y,radius).stroke({color:0xb77ae9,width:2,alpha:.32+.002*corruption});
   }
   const amount=lite?18:54;
   for(let i=0;i<amount;i++){
    const p=particles[i],t=reduced?0:now/1000;
    const x=((p.x+t*32)%730+730)%730-45;
    const y=((p.y+t*p.speed)%670+670)%670-10;
    rain.moveTo(x,y).lineTo(x-2,y+p.len).stroke({color:0xb3cbd3,width:1,alpha:.13+corruption/850});
   }
   if(!lite){
    for(let i=0;i<5;i++){
     const x=90+i*118+(reduced?0:Math.sin(now*.0003+i)*14);
     const y=395+(i%2)*28;
     fog.ellipse(x,y,56,7).fill({color:0x739ea3,alpha:.035});
    }
   }
   count++;
  };
  return {tick,stats:()=>({frames:count,particles:54,lights:3,shadows:shadow.visible?1:0})};
 }
 (window as any).AbyssPortAtmosphere={attach,version:'0.82'};
})();
