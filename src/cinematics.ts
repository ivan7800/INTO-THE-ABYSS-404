/** REBIRTH 0.50: frame-based attack trajectories, visual only; no authority over rules. */
(() => {
 type Pos={x:number;y:number};
 type Shot={from:Pos;to:Pos;at:number;duration:number;kind:'ally'|'enemy';seed:number};
 type API={fire:(from:Pos,to:Pos,kind:'ally'|'enemy',seed?:number)=>void;paint:(ctx:CanvasRenderingContext2D,project:(x:number,y:number)=>Pos,now:number,reduced:boolean)=>void;active:()=>number};
 const shots:Shot[]=[];const MAX=24;
 const fire=(from:Pos,to:Pos,kind:'ally'|'enemy',seed=0)=>{
  if(!Number.isFinite(from.x+from.y+to.x+to.y))return;
  shots.push({from:{...from},to:{...to},at:performance.now(),duration:kind==='enemy'?460:340,kind,seed});
  if(shots.length>MAX)shots.splice(0,shots.length-MAX);
 };
 function paint(ctx:CanvasRenderingContext2D,project:(x:number,y:number)=>Pos,now:number,reduced:boolean){
  for(let i=shots.length-1;i>=0;i--){
   const s=shots[i],dt=now-s.at;
   if(dt>s.duration){shots.splice(i,1);continue}
   if(dt<0)continue;
   const a=project(s.from.x,s.from.y),b=project(s.to.x,s.to.y);
   const from={x:a.x,y:a.y-34},to={x:b.x,y:b.y-10};
   const t=Math.min(1,dt/s.duration),ease=1-Math.pow(1-t,2.6);
   const cx=from.x+(to.x-from.x)*ease,cy=from.y+(to.y-from.y)*ease-(reduced?0:Math.sin(t*Math.PI)*30);
   const color=s.kind==='ally'?'#a0ffdc':'#ff9cbb',highlight=s.kind==='ally'?'#effff5':'#ffedc6';
   ctx.save();ctx.globalAlpha=Math.min(1,(1-t)*2.5);
   // White leading pixel and stepped, hand-drawn-style trajectory.
   if(!reduced){
    ctx.strokeStyle=color;ctx.lineWidth=3;ctx.lineCap='square';ctx.beginPath();
    const trail=Math.max(0,ease-.21);
    ctx.moveTo(from.x+(to.x-from.x)*trail,from.y+(to.y-from.y)*trail-Math.sin(trail*Math.PI)*30);
    ctx.lineTo(cx,cy);ctx.stroke();
    for(let j=0;j<3;j++){
     const px=cx+(j-1)*7+Math.sin(s.seed+j*7)*2,py=cy+(j%2?7:-5);
     ctx.fillStyle=j===0?highlight:color;ctx.fillRect(Math.round(px),Math.round(py),j===0?3:2,j===0?3:2);
    }
   }
   ctx.fillStyle=highlight;ctx.fillRect(Math.round(cx)-3,Math.round(cy)-3,6,6);
   if(t>.68){
    ctx.globalAlpha=Math.max(0,1-t)*2.8;
    ctx.strokeStyle=color;ctx.lineWidth=3;
    ctx.beginPath();ctx.ellipse(to.x,to.y,9+(t-.68)*85,5+(t-.68)*35,0,0,Math.PI*2);ctx.stroke();
   }
   ctx.restore();
  }
 }
 (window as Window & {AbyssCinematicFX?:API}).AbyssCinematicFX={fire,paint,active:()=>shots.length};
})();
