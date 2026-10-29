/** REBIRTH 0.85: original opt-in Web Audio horror score (no external media). */
(() => {
 type Kind='select'|'move'|'attack'|'alarm'|'victory'|'damage'|'rift';
 const Ctor=window.AudioContext||window.webkitAudioContext;
 let ctx:AudioContext|null=null, master:GainNode|null=null, ambient:GainNode|null=null;
 let enabled=false,sector=-1,notes=0,lastTurn=-1,lastHp=-1,lastRifts=-1,lastAmbient=0;
 let drones:OscillatorNode[]=[],gains:GainNode[]=[];
 const themes=[[43.65,65.41],[55,82.41],[38.89,58.27],[46.25,69.3],[36.71,55]];
 const status=()=>({enabled,sector,voices:drones.length,notes,available:!!Ctor});
 function beep(freq:number,duration:number,shape:OscillatorType='sine',volume=.025){
  if(!ctx||!master||!enabled)return;
  const t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();
  o.type=shape;o.frequency.setValueAtTime(freq,t);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.02);
  g.gain.exponentialRampToValueAtTime(.0001,t+duration);
  o.connect(g);g.connect(master);o.start(t);o.stop(t+duration+.03);notes++;
 }
 function stopDrones(){
  if(ctx)for(const g of gains)g.gain.setTargetAtTime(.0001,ctx.currentTime,.08);
  for(const o of drones)try{o.stop((ctx?.currentTime||0)+.4)}catch{}
  drones=[];gains=[];
 }
 function setSector(s:number){
  const next=Math.max(0,Math.min(4,s|0));if(next===sector)return;sector=next;
  if(!ctx||!ambient||!enabled)return;
  stopDrones();
  for(const f of [themes[next][0],themes[next][1],themes[next][0]*.502]){
   const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=f;
   g.gain.value=.0001;o.connect(g);g.connect(ambient);
   g.gain.setTargetAtTime(.024,ctx.currentTime,.7);o.start();drones.push(o);gains.push(g);
  }
 }
 async function setEnabled(value:boolean){
  if(!value){enabled=false;if(master&&ctx)master.gain.setTargetAtTime(.0001,ctx.currentTime,.05);stopDrones();return false}
  if(!Ctor)return false;
  try{
   ctx??=new Ctor();if(ctx.state==='suspended')await ctx.resume();
   if(!master){master=ctx.createGain();master.gain.value=.0001;master.connect(ctx.destination)}
   if(!ambient){ambient=ctx.createGain();ambient.gain.value=.4;ambient.connect(master)}
   enabled=true;master.gain.setTargetAtTime(.24,ctx.currentTime,.18);
   const s=Math.max(0,sector);sector=-1;setSector(s);beep(420,.12);return true;
  }catch{enabled=false;return false}
 }
 function effect(kind:Kind){
  const preset:{[key:string]:[number,number,OscillatorType,number]}={
   select:[380,.08,'sine',.028],move:[155,.12,'triangle',.042],
   attack:[78,.24,'sawtooth',.065],alarm:[260,.23,'triangle',.044],
   victory:[440,.45,'sine',.038],damage:[98,.3,'sawtooth',.055],rift:[305,.31,'triangle',.035]
  };
  const [f,d,shape,v]=preset[kind]||preset.select;beep(f,d,shape,v);
  if(kind==='attack'||kind==='rift')beep(f*1.48,d*.7,'sine',v*.35);
 }
 function sync(view:any){
  if(!view)return;setSector(view.sector);
  if(!enabled)return;
  if(lastHp>=0&&view.integrity<lastHp)effect('damage');
  if(lastTurn>=0&&view.turn>lastTurn)effect('alarm');
  if(lastRifts>=0&&view.rifts.length>lastRifts)effect('rift');
  lastHp=view.integrity;lastTurn=view.turn;lastRifts=view.rifts.length;
  if(ambient&&ctx)ambient.gain.setTargetAtTime(.33+Math.max(0,Math.min(100,view.corruption||0))*.0019,ctx.currentTime,.5);
 }
 function tick(now:number,view:any){
  if(!enabled||!view||now-lastAmbient<2200)return;lastAmbient=now;
  const phase=Math.floor(now/2200)%9;
  if([0,4,7].includes(phase))beep(themes[Math.max(0,Math.min(4,view.sector|0))][0]*3,1.65,'sine',.009);
 }
 (window as any).AbyssSoundscape={status,setEnabled,effect,sync,tick};
})();
