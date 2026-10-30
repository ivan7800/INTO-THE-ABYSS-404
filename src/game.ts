'use strict';
const N=8,S=80,canvas=document.querySelector('#game') as HTMLCanvasElement,ctx=canvas.getContext('2d')!;
let visualQuality='full';try{visualQuality=localStorage.getItem('abyss-visual-quality')==='lite'?'lite':'full'}catch{}
// v0.60: keyboard and mouse inspection are presentation-only; not stored in the tactical save.
let cursorActive=false,keyboardNavigation=false,cursorCell={x:3,y:3};
const liteVisual=()=>visualQuality==='lite'||reducedMotion();
const $=(s:string):any=>document.querySelector(s),statusEl=$('#status'),statsEl=$('#stats'),unitEl=$('#unit'),logEl=$('#log'),endBtn=$('#end'),modeBtn=$('#mode'),helpEl=$('#help');
let state;
const EMPTY_METRICS=()=>({moves:0,attacks:0,specials:0,damageDealt:0,damageTaken:0,buildingDamage:0,turnsResolved:0,objectives:0,decisions:0,byUnit:{pen:{moves:0,attacks:0,specials:0,damage:0},her:{moves:0,attacks:0,specials:0,damage:0},viu:{moves:0,attacks:0,specials:0,damage:0}}});
function metrics(){
 const m=state.metrics;
 const expected=EMPTY_METRICS();
 if(!m||typeof m!=='object'||Array.isArray(m))return state.metrics=expected;
 for(const k of Object.keys(expected)){
  if(k==='byUnit')continue;
  if(!Number.isFinite(m[k])||m[k]<0)m[k]=0;
 }
 if(!m.byUnit||typeof m.byUnit!=='object')m.byUnit={};
 for(const [type,fields] of Object.entries(expected.byUnit)){
  if(!m.byUnit[type]||typeof m.byUnit[type]!=='object')m.byUnit[type]={};
  for(const field of Object.keys(fields))if(!Number.isFinite(m.byUnit[type][field])||m.byUnit[type][field]<0)m.byUnit[type][field]=0;
 }
 return m;
}
function scorecard(){const m=metrics();return {sector:campaign.sector+1,name:state.sectorName,outcome:state.phase,turn:state.turn,integrity:state.integrity,corruption:state.corruption,objective:state.objectiveDone,encounter:state.encounterMode||'base',metrics:JSON.parse(JSON.stringify(m))}}
function updateMetrics(){const el=document.querySelector('#metricsReport');if(!el)return;const m=metrics();el.textContent=`MOV ${m.moves} · ATAQUES ${m.attacks} · HABILIDADES ${m.specials} · DAÑO CAUSADO ${m.damageDealt} · RECIBIDO ${m.damageTaken} · EDIFICIOS ${m.buildingDamage} · TURNOS ${m.turnsResolved}`;}
function exportMetrics(){const payload={format:'into-the-abyss-metrics',version:1,exportedAt:new Date().toISOString(),current:scorecard(),history:campaign.history??[]};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='into-the-abyss-metricas.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),0);}
function archiveSector(){campaign.history??=[];if(campaign.history.some(a=>a.sector===campaign.sector+1))return;campaign.history.push(scorecard());}

const SAVE_KEY='into-the-abyss.v0.8.save',PREV_KEY='into-the-abyss.v0.7.save',LEGACY_KEY='into-the-abyss.v0.6.save',OLDER_KEY='into-the-abyss.v0.5.save';
let audioEnabled=false,audioCtx=null,storageOk=true,impact=null;
// Ephemeral visual effects are deliberately excluded from saved game state.
const motion=new Map(),particles=[];let curtain=null;
const reducedMotion=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function trail(x,y,color='#e2bb83',count=12){if(reducedMotion())return;const now=performance.now();for(let i=0;i<count;i++){const angle=i*2.39996,speed=18+(i%4)*11;particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,at:now,life:390+(i%3)*90,color});}if(particles.length>150)particles.splice(0,particles.length-150)}
function transition(text){curtain={text,start:performance.now()};}

const CHAPTERS=[
 'EXPEDIENTE I · 17 de octubre de 1927. A las 03:14, el faro de San Telmo dejó de proyectar luz. La marea devolvió barcos hundidos décadas atrás.',
 'EXPEDIENTE II · 19 de octubre de 1927. Una voz transmitida desde el bosque conoce los nombres de los pilotos antes de que nazcan.',
 'EXPEDIENTE III · 21 de octubre de 1927. Bajo la piedra ciclópea late una señal. Los Custodios fueron diseñados para abrir la puerta, no para cerrarla.',
 'EXPEDIENTE IV · 23 de octubre de 1927. Los relojes de la estación se detuvieron a las 03:14. En cada vagón viajaba una versión distinta de la misma persona.',
 'EXPEDIENTE V · 25 de octubre de 1927. Las sirenas de la Catedral de Sal repitieron un nombre que los archivos habían borrado: el del primer piloto.'
];
function persist(){
 try{localStorage.setItem(SAVE_KEY,JSON.stringify({version:8,campaign,state}));storageOk=true;return true}
 catch(e){storageOk=false;return false}
}
function validSave(data){
 const st=data?.state,ca=data?.campaign;
 return [5,6,7,8].includes(data?.version) && !!st && !!ca && Number.isInteger(ca.sector)&&ca.sector>=0&&ca.sector<SECTORS.length &&
 Array.isArray(ca.upgrades)&&ca.upgrades.length<=16&&Array.isArray(st.units)&&st.units.length<=24&&st.units.length>=1 &&
 Array.isArray(st.buildings)&&st.buildings.length<=64&&Array.isArray(st.rocks)&&st.rocks.length<=64&&Array.isArray(st.rifts)&&st.rifts.length<=64&&Array.isArray(st.intent)&&st.intent.length<=24&&Array.isArray(st.log)&&st.log.length<=100&&
 ['player','enemy','won','lost','complete'].includes(st.phase)&&Number.isInteger(st.turn)&&st.turn>=1&&st.turn<=20 &&
 st.units.every(u=>u&&Number.isInteger(u.id)&&Number.isInteger(u.x)&&Number.isInteger(u.y)&&inside(u.x,u.y)&&Number.isFinite(u.hp)&&u.hp>=0&&u.hp<=100&&['ally','enemy'].includes(u.side)&&typeof u.type==='string'&&u.type.length<=32) &&
 [st.integrity,st.maxIntegrity,st.corruption,st.maxTurns].every(Number.isFinite) && st.integrity>=0 && st.maxIntegrity>0 && st.corruption>=0 && st.corruption<=100 && st.maxTurns>=1 && st.maxTurns<=20 &&
 st.buildings.every(b=>Number.isInteger(b.x)&&Number.isInteger(b.y)&&inside(b.x,b.y)&&Number.isFinite(b.hp)) &&
 st.rifts.every(r=>r&&Number.isInteger(r.x)&&Number.isInteger(r.y)&&inside(r.x,r.y)) &&
 st.rocks.every(r=>r&&Number.isInteger(r.x)&&Number.isInteger(r.y)&&inside(r.x,r.y)) &&
 st.intent.every(i=>i&&Number.isInteger(i.id)&&Number.isInteger(i.x)&&Number.isInteger(i.y)&&inside(i.x,i.y)) &&
 st.log.every(line=>typeof line==='string'&&line.length<=500) &&
 (!st.omen||(Number.isInteger(st.omen.x)&&Number.isInteger(st.omen.y)&&inside(st.omen.x,st.omen.y))) &&
 (!st.resonance||(Number.isInteger(st.resonance.x)&&Number.isInteger(st.resonance.y)&&inside(st.resonance.x,st.resonance.y))); 
}
function restore(){
 try{const raw=localStorage.getItem(SAVE_KEY)||localStorage.getItem(PREV_KEY)||localStorage.getItem(LEGACY_KEY)||localStorage.getItem(OLDER_KEY);if(!raw)return false;
 const data=JSON.parse(raw);if(!validSave(data))return false;
 campaign=data.campaign;state=data.state;campaign.pilots??=['ada','elias','mara'];campaign.history??=[];metrics();state.encounterMode??='base';state.encounterLocked??=true;campaign.upgrades??=[];state.units.forEach(u=>{if(u.side==='ally')u.pilot??=campaign.pilots[u.id-1]});
 state.omen??=null;state.resonance??=null;state.objective??=SECTORS[campaign.sector].objective;state.objectiveDone??=false;state.choiceMade??=true;state.units.forEach(u=>{if(u.side==='ally'){u.specialUsed??=false;u.specialTurn??=(u.specialUsed?state.turn:0)}});
 if(state.phase==='enemy'){state.phase='player';freezeIntent()}
 state.selected=alive('ally').some(u=>u.id===state.selected)?state.selected:(alive('ally')[0]?.id??null);
 note('Expediente recuperado del archivo local.');render();return true
 }catch(e){storageOk=false;return false}
}
function sound(kind='select'){
 if(!audioEnabled)return;
 if(window.AbyssSoundscape){window.AbyssSoundscape.effect(kind);return;}
 try{const AudioCtor=window.AudioContext||window.webkitAudioContext;if(!AudioCtor)return;
 audioCtx??=new AudioCtor();if(audioCtx.state==='suspended')audioCtx.resume();
 const now=audioCtx.currentTime,osc=audioCtx.createOscillator(),gain=audioCtx.createGain();
 const spec={select:[380,240,.07,.025],move:[170,90,.11,.035],attack:[90,38,.23,.07],alarm:[330,120,.26,.045],victory:[440,660,.4,.04]}[kind]||[230,130,.08,.025];
 osc.type=kind==='attack'?'sawtooth':'sine';osc.frequency.setValueAtTime(spec[0],now);osc.frequency.exponentialRampToValueAtTime(spec[1],now+spec[2]);
 gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(spec[3],now+.01);gain.gain.exponentialRampToValueAtTime(.0001,now+spec[2]);
 osc.connect(gain);gain.connect(audioCtx.destination);osc.start(now);osc.stop(now+spec[2]+.02)
 }catch(e){audioEnabled=false;updateAudioLabel()}
}
function updateAudioLabel(){const el=$('#sound');if(el)el.textContent=audioEnabled?'SONIDO: ACTIVADO':'SONIDO: SILENCIADO'}
function pulse(x,y,color='#f4cc98'){impact={x,y,color,start:performance.now()};trail(x,y,color,15);window.AbyssCombatFX?.impact(x,y,color)}

const dist=AbyssTactics.distance;
const inside=AbyssTactics.inside;
const key=(x,y)=>`${x},${y}`;
const at=(x,y)=>state.units.find(u=>u.hp>0&&u.x===x&&u.y===y);
const building=(x,y)=>state.buildings.find(b=>b.hp>0&&b.x===x&&b.y===y);
const obstacle=(x,y)=>AbyssTactics.occupied(state,x,y);
const dirs=[[0,-1],[1,0],[0,1],[-1,0]];
const SECTORS=[
 {name:'Puerto de los Ahogados',subtitle:'Las campanas bajo el agua',turns:5,integrity:5,rocks:[{x:2,y:4},{x:5,y:4},{x:0,y:3}],rifts:[{x:0,y:1},{x:7,y:5}],enemies:[['eng',1,1],['vig',5,1],['lar',6,3]],reward:'Blindaje del Penitente',objective:{x:0,y:5,title:'Rescatar al farero'}},
 {name:'Bosque de los Susurros',subtitle:'Raíces que recuerdan nombres',turns:6,integrity:5,rocks:[{x:1,y:3},{x:2,y:3},{x:5,y:3},{x:6,y:4}],rifts:[{x:1,y:1},{x:6,y:1},{x:7,y:4}],enemies:[['weaver',1,1],['lar',4,1],['stalker',6,2],['herald',3,0]],reward:'Calibración del Heraldo',objective:{x:7,y:6,title:'Recuperar la bitácora'}},
 {name:'La Ciudad Sumergida',subtitle:'El corazón detrás de la señal',turns:7,integrity:6,rocks:[{x:0,y:4},{x:7,y:4},{x:2,y:3}],rifts:[{x:0,y:1},{x:7,y:1},{x:3,y:0}],enemies:[['anchor',1,1],['seer',6,1],['stalker',6,3],['boss',3,1]],reward:'Plano del transmisor',objective:{x:0,y:6,title:'Sellar el transmisor'}},
 {name:'Estación de las Horas Muertas',subtitle:'Todos los relojes señalan las 03:14',turns:6,integrity:6,rocks:[{x:1,y:3},{x:2,y:3},{x:5,y:3},{x:6,y:3}],rifts:[{x:0,y:2},{x:7,y:2},{x:4,y:0}],enemies:[['seer',2,1],['weaver',5,1],['stalker',6,4],['herald',1,0]],reward:'Blindaje de la Viuda',objective:{x:7,y:6,title:'Liberar el convoy desaparecido'}},
 {name:'La Catedral de Sal',subtitle:'El nombre del abismo se pronuncia',turns:8,integrity:7,rocks:[{x:0,y:3},{x:7,y:3},{x:2,y:4},{x:5,y:4}],rifts:[{x:0,y:0},{x:7,y:0},{x:1,y:2}],enemies:[['anchor',1,1],['weaver',6,1],['seer',6,3],['leviathan',3,1]],reward:'El silencio de 1927',objective:{x:0,y:6,title:'Desactivar la campana abisal'},finalBoss:true}
];
const PILOTS={ada:{name:'Ada Voss',trait:'Blindaje reactivo: ignora el primer daño recibido por misión',ability:'shield'},elias:{name:'Elías Mar',trait:'Cartógrafo: +1 al alcance de movimiento',ability:'scout'},mara:{name:'Mara Soler',trait:'Exorcista: elimina corrupción con sus sellos',ability:'purify'},ines:{name:'Inés Roca',trait:'Ingeniera: +1 PV máximo al Custodio',ability:'armor'},noah:{name:'Noah Vidal',trait:'Observador: +1 alcance a ataques de largo alcance',ability:'reach'},isa:{name:'Isa Beltrán',trait:'Resonancia: los ataques infligen +1 de daño una vez por turno',ability:'burst'}};
const ENEMY_INFO={eng:['Engendro',3],vig:['Vigía',2],lar:['Larva',2],herald:['Corista',3],stalker:['Acechador',3],anchor:['Ancla',4],boss:['El Durmiente',8],leviathan:['El Innombrable',12],weaver:['Tejedor',3],seer:['Oráculo',3]};
let campaign:any={sector:0,wins:0,upgrades:[],pilots:['ada','elias','mara'],complete:false};
function enemy(type,x,y,id){const [name,hp]=ENEMY_INFO[type];return {id,name,type,side:'enemy',x,y,hp,max:hp}}
function applyUpgrades(){for(const u of alive('ally')){u.pilot=campaign.pilots[u.id-1];const ability=PILOTS[u.pilot]?.ability;u.shield=ability==='shield'?1:0;u.burstUsed=false;if(ability==='scout')u.range++;if(ability==='armor'){u.hp++;u.max++;}if(ability==='reach')u.attackBonus=1;if(u.type==='pen'&&campaign.upgrades.includes('pen')){u.hp++;u.max++}if(u.type==='her'&&campaign.upgrades.includes('her'))u.range++;if(u.type==='viu'&&campaign.upgrades.includes('viu')){u.hp++;u.max++;}}}

function note(msg){state.log.unshift(msg);state.log.length=Math.min(state.log.length,9)}
function newUnits(){return [{id:1,name:'Penitente',type:'pen',side:'ally',x:1,y:6,hp:5,max:5,range:2,moved:false,acted:false,specialUsed:false},{id:2,name:'Heraldo',type:'her',side:'ally',x:3,y:6,hp:3,max:3,range:2,moved:false,acted:false,specialUsed:false},{id:3,name:'Viuda',type:'viu',side:'ally',x:5,y:6,hp:3,max:3,range:3,moved:false,acted:false,specialUsed:false},{id:4,name:'Engendro',type:'eng',side:'enemy',x:1,y:1,hp:3,max:3},{id:5,name:'Vigía',type:'vig',side:'enemy',x:5,y:1,hp:2,max:2},{id:6,name:'Larva',type:'lar',side:'enemy',x:6,y:3,hp:2,max:2}]}
function init(){motion.clear();const cfg=SECTORS[campaign.sector];const units=newUnits().filter(u=>u.side==='ally');cfg.enemies.forEach(([type,x,y],i)=>units.push(enemy(type,x,y,100+i)));
state={turn:1,maxTurns:cfg.turns,phase:'player',selected:1,mode:'move',integrity:cfg.integrity,maxIntegrity:cfg.integrity,corruption:0,units,buildings:[{x:3,y:2,hp:2},{x:4,y:2,hp:2},{x:3,y:3,hp:2},{x:4,y:3,hp:2}],rocks:cfg.rocks.map(r=>({...r})),rifts:cfg.rifts.map(r=>({...r})),log:[],intent:[],metrics:EMPTY_METRICS(),sectorName:cfg.name,objective:{...cfg.objective},objectiveDone:false,choiceMade:false,omen:null,resonance:null,encounterMode:'base',encounterLocked:false};applyUpgrades();note(CHAPTERS[campaign.sector]);note(`1927. ${cfg.subtitle}.`);freezeIntent();render()}
// Optional encounter protocols are selected once, before any tactical action.
// Their effects are deterministic, saved, and their new threats are telegraphed.
const ENCOUNTERS={
 base:{name:'Patrulla ordinaria',detail:'Disposición original del sector.'},
 containment:{name:'Contención de Grietas',detail:'Cumple el objetivo y reduce las grietas a una para vencer antes de tiempo.'},
 defense:{name:'Último Bastión',detail:'Resiste tres fases enemigas con tres edificios y al menos media integridad.'},
 recovery:{name:'Rescate del Expediente',detail:'Llega al objetivo antes del turno 5: +1 blindaje a cada Custodio. Si fracasas: +12 % corrupción.'},
 vigil:{name:'Vigilia del Umbral',detail:'Blindaje adicional para todos; +15 % de corrupción.'},
 siege:{name:'Asedio abisal',detail:'Aparece un refuerzo enemigo adelantado.'},
 tide:{name:'Marea negra',detail:'Una grieta adicional amenaza la retaguardia.'}
};
function chooseEncounter(mode){
 if(!['siege','tide','vigil','recovery','containment','defense'].includes(mode)||state.phase!=='player'||state.turn!==1||state.encounterLocked||
    metrics().moves||metrics().attacks||metrics().specials||metrics().turnsResolved)return false;
 if(mode==='containment'){
  state.missionOrder={kind:'containment',completed:false};
  note('CONTENCIÓN · Cumple el objetivo y deja como máximo una grieta activa.');
 }else if(mode==='defense'){
  state.missionOrder={kind:'defense',completed:false,rounds:3,requiredBuildings:3};
  note('BASTIÓN · Protege tres edificios y la mitad de la red durante tres asaltos.');
 }else if(mode==='recovery'){
  state.recovery={deadline:4,resolved:false,success:false};
  note('RESCATE · Alcanza el objetivo secundario antes del turno 5; el fracaso incrementará la corrupción.');
 }else if(mode==='siege'){
  const positions=[{x:0,y:2},{x:7,y:2},{x:0,y:4},{x:7,y:4}];
  const pos=positions.find(p=>!obstacle(p.x,p.y));
  if(!pos)return false;
  const types=['vig','stalker','weaver','herald','seer'];
  const extra=enemy(types[campaign.sector],pos.x,pos.y,900+campaign.sector);
  state.units.push(extra);
  note(`PROTOCOLO ASEDIO · ${extra.name} emerge en (${pos.x+1}, ${pos.y+1}).`);
  }else if(mode==='vigil'){
  state.corruption=Math.min(100,state.corruption+15);
  for(const ally of alive('ally'))ally.shield=(ally.shield||0)+1;
  note('VIGILIA · Cada Custodio obtiene un blindaje; la corrupción aumenta un 15 %.');
 }else{
  const positions=[{x:2,y:5},{x:6,y:5},{x:1,y:5},{x:7,y:5}];
  const pos=positions.find(p=>!obstacle(p.x,p.y)&&!state.rifts.some(r=>r.x===p.x&&r.y===p.y));
  if(!pos)return false;
  state.rifts.push({...pos});
  note(`PROTOCOLO MAREA · Nueva grieta en (${pos.x+1}, ${pos.y+1}).`);
 }
 state.encounterMode=mode;
 state.encounterLocked=true;
 freezeIntent(); // All attacks are announced again before the first player action.
 render();return true;
}
function updateEncounterHUD(){
 const box=document.querySelector('#encounterStatus');
 if(box)box.textContent=`ENCUENTRO · ${ENCOUNTERS[state.encounterMode||'base'].name} — ${ENCOUNTERS[state.encounterMode||'base'].detail}`;
 for(const id of ['siege','tide','vigil','recovery','containment','defense']){
  const btn=document.querySelector('#encounter-'+id) as HTMLButtonElement|null;
  if(btn){btn.disabled=state.phase!=='player'||state.turn!==1||state.encounterLocked||metrics().moves>0||metrics().attacks>0||metrics().specials>0;btn.setAttribute?.('aria-pressed',String(state.encounterMode===id));}
 }
 const panel=document.querySelector('#encounterPanel') as HTMLElement|null;
 if(panel)panel.hidden=state.phase!=='player'||state.turn!==1||state.encounterLocked;
}
function chooseEvent(choice){
 if(state.phase!=='player'||state.choiceMade)return false;
 if(choice==='fortify'){state.integrity=Math.min(state.maxIntegrity+2,state.integrity+2);state.maxIntegrity+=2;note('El Consejo refuerza la red: +2 integridad.');}
 else if(choice==='seal'){state.corruption=Math.max(0,state.corruption-10);const r=state.rifts.pop();if(r)note('El culto rompe un sello: una grieta desaparece.');else note('El ritual reduce la perturbación abisal.');}
 else return false;
 metrics().decisions++;state.choiceMade=true;render();return true;
}
function defensiveStance(){
 if(state.phase!=='player')return false;
 const u=alive('ally').find(a=>a.id===state.selected);
 if(!u||u.acted)return false;
 const friends=alive('ally').filter(a=>dist(a,u)<=1);
 for(const friend of friends)friend.shield=Math.min(2,(friend.shield||0)+1);
 u.acted=true;metrics().decisions++;
 note(`ÚLTIMA RESISTENCIA · ${u.name} sacrifica su ataque para proteger a ${friends.length} Custodio(s).`);
 sound('select');checkEnd();render();return true;
}
function special(){
 if(state.phase!=='player')return false;
 const u=alive('ally').find(a=>a.id===state.selected);
 if(!u||u.specialUsed&&(state.turn-(u.specialTurn||0)<3))return false;
 if(u.type==='pen'){u.shield=(u.shield||0)+1;note('PENITENTE · Guardia de hierro: bloquea el próximo impacto (recarga: 3 turnos).' );}
 else if(u.type==='her'){for(const enemy of alive('enemy').filter(e=>dist(e,u)<=2))hit(enemy,1,'onda de interferencia');note('HERALDO · Interferencia: 1 daño a cada entidad cercana.');}
 else if(u.type==='viu'){const r=[...state.rifts].sort((a,b)=>dist(a,u)-dist(b,u)).find(r=>dist(r,u)<=3);if(!r){note('La Viuda necesita una grieta a 3 casillas.');render();return false;}state.rifts=state.rifts.filter(a=>a!==r);state.corruption=Math.max(0,state.corruption-12);note('VIUDA · Liturgia: sella una grieta próxima.');}
 else return false;
 u.specialUsed=true;u.specialTurn=state.turn;metrics().specials++;metrics().byUnit[u.type].specials++;checkEnd();render();return true;
}
function checkObjective(){
 if(state.objectiveDone||!state.objective)return;
 const o=state.objective;
 if(alive('ally').some(u=>u.x===o.x&&u.y===o.y)){
 state.objectiveDone=true;metrics().objectives++;state.corruption=Math.max(0,state.corruption-15);
 if(state.recovery&&!state.recovery.resolved&&state.turn<=state.recovery.deadline){
  state.recovery.resolved=true;state.recovery.success=true;
  alive('ally').forEach(u=>u.shield=(u.shield||0)+1);
  note('RESCATE COMPLETADO · +1 blindaje para los Custodios supervivientes.');
 }
 note(`OBJETIVO CUMPLIDO · ${o.title}: -15 % de corrupción.`);sound('victory');
 }
}
function fullRestart(){if(typeof window.confirm==='function'&&!window.confirm('¿Reiniciar toda la campaña? Se sobrescribirá la partida actual. Exporta una copia antes si quieres conservarla.'))return;cursorActive=false;keyboardNavigation=false;updateCellInspector();motion.clear();particles.length=0;transition('EXPEDIENTE RESTABLECIDO');campaign={sector:0,wins:0,upgrades:[],pilots:['ada','elias','mara'],complete:false,history:[]};$('#next').hidden=true;motion.clear();particles.length=0;transition('NUEVO EXPEDIENTE · 1927');init()}
function nextMission(){if(state.phase!=='won'||campaign.complete)return;const completed=campaign.sector;archiveSector();campaign.wins++;if(completed===0)campaign.upgrades.push('pen');if(completed===1)campaign.upgrades.push('her');if(completed===3)campaign.upgrades.push('viu');if(completed+1>=SECTORS.length){campaign.complete=true;state.phase='complete';transition('LA SEÑAL SE DESVANECE');note('La transmisión cesa. Por esta noche.');sound('victory');$('#next').hidden=true;render();return}campaign.sector++;$('#next').hidden=true;init()}
function alive(side){return state.units.filter(u=>u.hp>0&&u.side===side)}
function pathCells(u){return AbyssTactics.reachable(state,u,N)}
function chooseIntent(e){return AbyssTactics.intentFor(e,state)}
// Every omen is deterministic, appears before player actions and resolves on the announced square.
function chooseOmen(){return AbyssTactics.omenFor(state.turn,campaign.sector)}
function resolveOmen(){
 const o=state.omen;if(!o)return;
 const target=at(o.x,o.y);
 if(o.type==='fracture'){
  if(!building(o.x,o.y)&&!state.rifts.some(r=>r.x===o.x&&r.y===o.y))state.rifts.push({x:o.x,y:o.y});
  if(target)hit(target,1,'fractura anunciada');note(`ANOMALÍA · La fractura alcanza (${o.x+1}, ${o.y+1}).`);
 }else{
  if(target)hit(target,1,'oleada anunciada');
  state.corruption=Math.min(100,state.corruption+6);note(`ANOMALÍA · Oleada de señal en (${o.x+1}, ${o.y+1}).`);
 }
 state.omen=null;
}
// Phase 16: an announced spatial resonance, locked at turn start. The source
// can be destroyed or interrupted; the targeting tile never moves mid-turn.
function chooseResonance(){return AbyssTactics.resonanceFor(state)}
function resolveResonance(){
 const r=state.resonance;if(!r)return;
 state.resonance=null;
 const caster=alive('enemy').find(e=>e.id===r.source);
 if(!caster){note('RESONANCIA INTERRUMPIDA · La entidad que sostenía el pulso ha desaparecido.');return}
 if(!state.rifts.some(g=>g.x===r.x&&g.y===r.y)){note('RESONANCIA INTERRUMPIDA · La grieta anunciada fue sellada.');return}
 const target=at(r.x,r.y);
 if(target)hit(target,1,'resonancia abisal');
 state.corruption=Math.min(100,state.corruption+4);
 note(`RESONANCIA · La grieta (${r.x+1},${r.y+1}) responde a ${caster.name}: +4 % corrupción.`);
}
function freezeIntent(){state.intent=[];for(const e of alive('enemy')){const intent=chooseIntent(e);if(intent)state.intent.push(intent)}state.omen=chooseOmen();state.resonance=chooseResonance()}
function hit(obj,dmg,origin){if(!obj||obj.hp<=0)return;if(obj.side==='ally'&&obj.shield>0){obj.shield--;note(`${obj.name}: blindaje de ${PILOTS[obj.pilot]?.name} absorbe el impacto.`);return}const actual=AbyssTactics.clampDamage(obj.hp,dmg);if(obj.side==='enemy'){metrics().damageDealt+=actual;const source=state._damageSource;if(source&&metrics().byUnit[source])metrics().byUnit[source].damage+=actual;}else if(obj.side==='ally')metrics().damageTaken+=actual;else if(state.buildings.includes(obj))metrics().buildingDamage+=actual;pulse(obj.x,obj.y);sound('attack');obj.hp=Math.max(0,obj.hp-dmg);window.AbyssCombatFX?.damage(obj.x,obj.y,actual,!!(obj.kind==='building'||state.buildings.includes(obj)),obj.hp<=0);if(obj.kind==='building'||state.buildings.includes(obj)){state.integrity=Math.max(0,state.integrity-actual);note(`Un edificio recibe ${actual} daño (${origin}).`)}else note(`${obj.name} recibe ${dmg} daño (${origin}).`)}
function push(target,dx,dy){if(!target||target.hp<=0)return;const x=target.x+dx,y=target.y+dy;if(!inside(x,y)||state.rocks.some(r=>r.x===x&&r.y===y)){hit(target,1,'colisión');return}const other=at(x,y)||building(x,y);if(other){hit(target,1,'choque');hit(other,1,'choque');return}motion.set(target.id,{x:target.x,y:target.y,at:performance.now(),duration:260});target.x=x;target.y=y;if(state.rifts.some(r=>r.x===x&&r.y===y)){hit(target,1,'grieta');note('La grieta devora parte de la materia.')}}
function damageFor(u,base){if(PILOTS[u.pilot]?.ability==='burst'&&!u.burstUsed){u.burstUsed=true;return base+1}return base}
function effect(u,x,y){if(!AbyssTactics.legalAttack(u,{x,y},at(x,y),building(x,y),state.rifts.some(r=>r.x===x&&r.y===y),PILOTS[u.pilot]?.ability==='purify'))return false;state._damageSource=u.type;if(u.type==='pen'){const target=at(x,y);if(!target||target.side!=='enemy'||dist(u,target)!==1)return false;window.AbyssCinematicFX?.fire(u,{x,y},'ally',u.id);hit(target,damageFor(u,2),'martillo del Penitente');push(target,Math.sign(x-u.x),Math.sign(y-u.y));note('El Penitente desplaza su objetivo.');return true}
if(u.type==='her'){if(dist(u,{x,y})>3+(u.attackBonus||0)||dist(u,{x,y})<1)return false;const target=at(x,y),b=building(x,y);if(target?.side==='ally'||b)return false;window.AbyssCinematicFX?.fire(u,{x,y},'ally',u.id);if(target)hit(target,damageFor(u,1),'obús del Heraldo');for(const [dx,dy] of dirs){const o=at(x+dx,y+dy);if(o)push(o,dx,dy)}note('El Heraldo detona una carga de repulsión.');return true}
if(u.type==='viu'){if(dist(u,{x,y})>3+(u.attackBonus||0)||dist(u,{x,y})<1)return false;const target=at(x,y);if((!target||target.side!=='enemy')&&!(PILOTS[u.pilot]?.ability==='purify'&&state.rifts.some(r=>r.x===x&&r.y===y)))return false;window.AbyssCinematicFX?.fire(u,{x,y},'ally',u.id);if(target)hit(target,damageFor(u,1),'sello de la Viuda');if(PILOTS[u.pilot]?.ability==='purify'){const before=state.rifts.length;state.rifts=state.rifts.filter(r=>!(r.x===x&&r.y===y));if(before!==state.rifts.length){state.corruption=Math.max(0,state.corruption-12);note('La Exorcista sella una grieta.')}}if(target){state.intent=state.intent.filter(i=>i.id!==target.id);note('La Viuda interrumpe la profecía del enemigo.')}else note('La Viuda ha sellado una anomalía.');return true}return false}
function tryAction(x,y){if(state.phase!=='player')return;const clicked=at(x,y);if(clicked?.side==='ally'){state.selected=clicked.id;state.mode='move';render();return}const u=alive('ally').find(a=>a.id===state.selected);if(!u)return;if(state.mode==='move'&&!u.moved&&!obstacle(x,y)&&pathCells(u).has(key(x,y))){motion.set(u.id,{x:u.x,y:u.y,at:performance.now(),duration:330});u.x=x;u.y=y;u.moved=true;metrics().moves++;metrics().byUnit[u.type].moves++;note(`${u.name} avanza.`);checkObjective();sound('move');pulse(x,y,'#81e4cf');if(state.rifts.some(r=>r.x===x&&r.y===y))hit(u,1,'grieta');checkEnd();render();return}if(state.mode==='attack'&&!u.acted&&effect(u,x,y)){u.acted=true;metrics().attacks++;metrics().byUnit[u.type].attacks++;state._damageSource=null;sound('attack');pulse(x,y);checkEnd();render();return}if(clicked?.side==='enemy'&&state.mode==='move'){state.mode='attack';sound('select');note('Modo de ataque activado.');render()}}
function resolveEnemy(){if(state.phase!=='player')return;state.phase='enemy';state._damageSource=null;metrics().turnsResolved++;sound('alarm');// Resolve the exact telegraphed tiles; no re-targeting after player actions.
for(const i of state.intent){const e=state.units.find(u=>u.id===i.id&&u.hp>0);if(!e)continue;window.AbyssCinematicFX?.fire(e,{x:i.x,y:i.y},'enemy',e.id);const target=at(i.x,i.y)||building(i.x,i.y);if(i.attack==='anchor'){state.corruption=Math.min(100,state.corruption+5);if(target)hit(target,1,'pulso del Ancla');note('El Ancla intensifica la señal abisal.')}else if(i.attack==='drain'){if(target)hit(target,1,'drenaje del Acechador');state.corruption=Math.min(100,state.corruption+4);note('El Acechador drena la estabilidad.')}else if(i.attack==='rupture'){if(!state.rifts.some(r=>r.x===i.x&&r.y===i.y)&&!building(i.x,i.y))state.rifts.push({x:i.x,y:i.y});if(target)hit(target,2,'onda del Durmiente');note('El Durmiente deforma el espacio.')}else if(i.attack==='cataclysm'){if(target)hit(target,3,'canto del Innombrable');state.corruption=Math.min(100,state.corruption+6);if(!building(i.x,i.y)&&!state.rifts.some(r=>r.x===i.x&&r.y===i.y))state.rifts.push({x:i.x,y:i.y});note('SEGUNDA FASE · El Innombrable desgarra la realidad en la casilla anunciada.')}else if(i.attack==='web'){
 const snare=target?.side==='ally'&&target.hp>0&&(target.shield||0)===0;
 if(target)hit(target,1,'red del Tejedor');
 if(snare&&target.hp>0){target.entangled=true;note(`${target.name} queda enredado: perderá el movimiento del siguiente turno.`);}if(!building(i.x,i.y)&&!state.rifts.some(r=>r.x===i.x&&r.y===i.y))state.rifts.push({x:i.x,y:i.y});note('El Tejedor anuda el espacio en la casilla profetizada.')}else if(i.attack==='vision'){
 if(target?.side==='ally'&&target.shield>0){
  target.shield=Math.max(0,target.shield-1);
  note('ORÁCULO · Su mirada deshace una capa de blindaje adicional.');
 }
 if(target)hit(target,1,'mirada del Oráculo');state.corruption=Math.min(100,state.corruption+4);note('El Oráculo alimenta la señal en el punto anunciado.')}else if(i.attack==='chorus'){if(target)hit(target,1,'coro imposible');state.corruption=Math.min(100,state.corruption+3);note('El Corista alimenta la corrupción.')}else if(i.attack==='corrupt'){if(!state.rifts.some(r=>r.x===i.x&&r.y===i.y)&&!building(i.x,i.y)){state.rifts.push({x:i.x,y:i.y});note('Una larva abre una grieta.')}if(target)hit(target,1,'espora');}else if(target&&target.id!==e.id){hit(target,i.damage,e.name)}else note(`${e.name} golpea una casilla vacía.`)}
resolveOmen();resolveResonance();state.rifts.forEach(r=>{const o=at(r.x,r.y);if(o)hit(o,1,'corrupción')});state.corruption=Math.min(100,state.corruption+state.rifts.length*2);state.units=state.units.filter(u=>u.hp>0);checkObjective();if(state.corruption>=100){state.integrity=0;note('La señal abisal alcanza masa crítica.')}checkEnd();if(state.phase==='enemy')missionVictory('defense');if(state.phase!=='enemy'){if(state.phase==='won'||state.phase==='lost')archiveSector();render();return}if(state.turn>=state.maxTurns){if(SECTORS[campaign.sector].finalBoss&&alive('enemy').some(u=>u.type==='leviathan')){state.phase='lost';archiveSector();transition('EL NOMBRE HA SIDO PRONUNCIADO');note('La campana ha sonado: el Innombrable debe ser derrotado antes de terminar el último turno.');render();return}state.phase='won';archiveSector();transition('SECTOR CONTENIDO');note('Sector contenido. Puedes continuar la expedición.');render();return}
state.turn++;
 if(state.recovery&&!state.recovery.resolved&&state.turn>state.recovery.deadline){
  state.recovery.resolved=true;state.recovery.success=false;
  state.corruption=Math.min(100,state.corruption+12);
  note('RESCATE FALLIDO · El expediente se pierde. Corrupción +12 %.');
 }
 alive('ally').forEach(u=>{
  u.moved=!!u.entangled;u.entangled=false;
  u.acted=false;u.burstUsed=false;
 });state.phase='player';state.mode='move';state.selected=alive('ally')[0]?.id??null;freezeIntent();note(`Turno ${state.turn}. Las amenazas quedan fijadas.`);render()}
function missionVictory(kind){
 if(state.phase==='won'||state.phase==='lost'||state.phase==='complete'||state.integrity<=0||!alive('ally').length)return false;
 if(SECTORS[campaign.sector].finalBoss&&alive('enemy').some(u=>u.type==='leviathan'))return false;
 const m=state.missionOrder;if(!m||m.completed||m.kind!==kind)return false;
 if(kind==='containment'&&!(state.objectiveDone&&state.rifts.length<=1))return false;
 if(kind==='defense'&&!(metrics().turnsResolved>=m.rounds&&state.buildings.filter(b=>b.hp>0).length>=m.requiredBuildings&&state.integrity>=Math.ceil(state.maxIntegrity/2)))return false;
 m.completed=true;state.phase='won';transition(kind==='defense'?'EL BASTIÓN RESISTE':'LAS GRIETAS CALLAN');
 note(kind==='defense'?'MISIÓN CUMPLIDA · El bastión ha resistido.':'MISIÓN CUMPLIDA · Las grietas han sido contenidas.');
 sound('victory');archiveSector();return true;
}
function checkEnd(){
 if(state.phase==='won'||state.phase==='lost'||state.phase==='complete')return;
 if(state.integrity<=0||!alive('ally').length){state.phase='lost';transition('LA CIUDAD HA CAÍDO');note('La ciudad ha sucumbido.');sound('alarm')}
 else if(missionVictory('containment'))return;
 else if(!alive('enemy').length){state.phase='won';transition('SECTOR CONTENIDO');note('Las criaturas han sido contenidas. Sector asegurado.');sound('victory')}
 if(state.phase==='won'||state.phase==='lost')archiveSector();
}
// Visual subsystem (Phase 3). All coordinates are cosmetic; game rules stay grid based.
const ISO_W=78,ISO_H=48,ORIGIN_X=320,ORIGIN_Y=155;
const TILE_RX=34,TILE_RY=19; // deliberate negative space between tactical diamonds
const project=(x,y)=>({x:ORIGIN_X+(x-y)*ISO_W/2,y:ORIGIN_Y+(x+y)*ISO_H/2});
(window as any).AbyssView=()=>({
 sector:campaign.sector,selected:state.selected,phase:state.phase,turn:state.turn,
 corruption:state.corruption,quality:visualQuality,
 units:state.units.filter((u:any)=>u.hp>0).map((u:any)=>({
  id:u.id,x:u.x,y:u.y,hp:u.hp,max:u.max,side:u.side,type:u.type,stunned:!!u.stunned
 })),
 threats:state.intent.map((i:any)=>({x:i.x,y:i.y})),
 rifts:state.rifts.map((r:any)=>({x:r.x,y:r.y})),
 cursor:cursorActive?{...cursorCell}:null,
 buildings:state.buildings.filter((b:any)=>b.hp>0).map((b:any)=>({x:b.x,y:b.y,hp:b.hp})),
 rocks:state.rocks.map((r:any)=>({x:r.x,y:r.y})),
 objective:state.objective&&!state.objectiveDone?{...state.objective}:null,
 omen:state.omen?{...state.omen}:null,
 reachable:(()=>{const u=state.units.find((a:any)=>a.id===state.selected&&a.hp>0&&a.side==='ally');return u&&!u.moved&&state.mode==='move'?[...pathCells(u).keys()]:[]})()
});

const unproject=(px,py)=>{const u=(px-ORIGIN_X)/(ISO_W/2),v=(py-ORIGIN_Y)/(ISO_H/2);return {x:Math.floor((u+v)/2),y:Math.floor((v-u)/2)}};
const hash=(x,y,z=0)=>((x*73856093^y*19349663^z*83492791)>>>0)/4294967295;
let visualTime=0;
function polygon(points,fill,stroke=null,line=1){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=line;ctx.strokeStyle=stroke;ctx.stroke()}}
function glow(x,y,r,c){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r)}
function tile(x,y,fill,edge){const p=project(x,y);if((window as any).AbyssPixi?.hideCanvasWorld&&campaign.sector!==0)return p;polygon([[p.x,p.y-TILE_RY],[p.x+TILE_RX,p.y],[p.x,p.y+TILE_RY],[p.x-TILE_RX,p.y]],fill,edge,1);return p}
function windows(px,py){ctx.fillStyle='#e3bc78';for(let i=0;i<3;i++){ctx.globalAlpha=.48+.35*hash(i,px|0,py|0);ctx.fillRect(px+i*10,py,5,8)}ctx.globalAlpha=1}
function house(p,b){if(window.AbyssEnvironment?.paint(ctx,'building',p,campaign.sector,(b.x*3+b.y)%3)){ctx.save();ctx.fillStyle='#08151e';ctx.fillRect(p.x-15,p.y+8,30,13);ctx.fillStyle='#e8d3a6';ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.fillText(b.hp,p.x,p.y+19);ctx.restore();return}const x=p.x,y=p.y,seed=hash(b.x??x,b.y??y),style=seed>.65?2:seed>.33?1:0;
 ctx.save();ctx.fillStyle='#07151d88';ctx.beginPath();ctx.ellipse(x+7,y+8,31,10,0,0,Math.PI*2);ctx.fill();
 const h=style===2?68:style===1?56:47;
 polygon([[x-25,y-h],[x,y-h-14],[x+25,y-h],[x,y-h+13]],style===2?'#4d646a':'#47535c','#82969b');
 polygon([[x-25,y-h],[x,y-h+13],[x,y+3],[x-25,y-11]],style===1?'#665957':'#52656e','#9a9f95');
 polygon([[x,y-h+13],[x+25,y-h],[x+25,y-11],[x,y+3]],style===2?'#2e4453':'#344a56','#879397');
 ctx.fillStyle='#1a2a34';for(let i=0;i<3;i++){ctx.fillRect(x-21+i*7,y-h+17,4,8);ctx.fillRect(x+4+i*6,y-h+19,4,8)}
 ctx.fillStyle='#ebc488';for(let i=0;i<4;i++){ctx.globalAlpha=.45+.45*hash(i,x|0,y|0);ctx.fillRect(x-17+i*9,y-h+25,5,8)}ctx.globalAlpha=1;
 if(style===2){ctx.strokeStyle='#9fada5';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+12,y-h-9);ctx.lineTo(x+12,y-h-30);ctx.stroke();ctx.fillStyle='#cfb581';ctx.fillRect(x+9,y-h-33,7,4)}
 if(style===1){ctx.fillStyle='#b89a77';ctx.fillRect(x-23,y-16,18,4);ctx.fillStyle='#d8b88c';ctx.fillRect(x-19,y-13,10,5)}
 ctx.fillStyle='#08151e';ctx.fillRect(x-15,y+8,30,13);ctx.fillStyle='#e8d3a6';ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.fillText(b.hp,x,y+19);ctx.restore()}
function rock(p){if(window.AbyssEnvironment?.paint(ctx,'rock',p,campaign.sector))return;polygon([[p.x-20,p.y],[p.x-12,p.y-19],[p.x+8,p.y-27],[p.x+24,p.y-3],[p.x+6,p.y+9]],'#5e7277','#829597');polygon([[p.x-12,p.y-19],[p.x+8,p.y-27],[p.x+1,p.y-4]],'#93a09a')}
function portal(p){if(window.AbyssEnvironment?.paint(ctx,'rift',p,campaign.sector))return;glow(p.x,p.y,32,'#aa4aca88');ctx.save();ctx.translate(p.x,p.y);ctx.rotate(visualTime*.0006);for(let k=0;k<3;k++){ctx.rotate(Math.PI*2/3);polygon([[-19,0],[-5,-9],[12,-2],[3,8]],'#7e376f','#ca91ce',1.5)}ctx.restore();glow(p.x,p.y,14,'#d46ff0b8')}
function mech(p,u){const x=p.x,y=p.y,major=u.type==='pen'?'#caaf7c':u.type==='her'?'#8fd2c8':'#b2a5d4',shadow='#10202b';glow(x,y-20,36,'#74d5bf28');
ctx.fillStyle=shadow;ctx.fillRect(x-18,y-16,12,19);ctx.fillRect(x+7,y-16,12,19);ctx.fillStyle='#536770';ctx.fillRect(x-16,y-16,10,16);ctx.fillRect(x+7,y-16,10,16);
polygon([[x-19,y-44],[x-11,y-59],[x+12,y-60],[x+20,y-44],[x+14,y-18],[x-12,y-18]],'#334e5b',major,2);
ctx.fillStyle=major;ctx.fillRect(x-23,y-43,9,20);ctx.fillRect(x+14,y-43,9,20);ctx.fillStyle='#1b2936';ctx.fillRect(x-7,y-51,16,10);ctx.fillStyle='#a8f7e6';ctx.fillRect(x-5,y-49,12,5);glow(x+1,y-46,13,'#81ead366');
if(u.type==='pen'){ctx.fillStyle='#ded0a7';ctx.fillRect(x+24,y-43,5,31);ctx.fillRect(x+19,y-49,16,10)}
if(u.type==='her'){ctx.fillStyle='#bda27e';ctx.fillRect(x-6,y-71,11,17);ctx.fillRect(x-13,y-73,25,8)}
if(u.type==='viu'){ctx.strokeStyle='#c0a2e7';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y-37,28,Math.PI*1.1,Math.PI*1.9);ctx.stroke()}
 drawCustodianDetail(x,y,u,major);
}
function monster(p,u){const x=p.x,y=p.y+1,t=visualTime*.001,kind=u.type;ctx.save();glow(x,y-22,31,kind==='boss'?'#bc468788':'#b1477566');
 const tentacle=(sx,sy,ex,ey,phase)=>{ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo((sx+ex)/2+8*Math.sin(t*1.3+phase),ey-18,ex,ey+3*Math.sin(t+phase));ctx.stroke()};
 if(kind==='boss'||kind==='leviathan'||kind==='vig'){ctx.fillStyle=(kind==='boss'||kind==='leviathan')?'#54233e':'#3c304e';ctx.beginPath();ctx.ellipse(x,y-30,(kind==='boss'||kind==='leviathan')?29:21,(kind==='boss'||kind==='leviathan')?38:27,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#9e567b';ctx.lineWidth=4;for(let i=-2;i<=2;i++)tentacle(x+i*8,y-10,x+i*14,y+9,i);ctx.fillStyle='#cf94a3';ctx.beginPath();ctx.ellipse(x,y-33,12,11,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#0c1421';ctx.beginPath();ctx.ellipse(x,y-33,6,8,0,0,Math.PI*2);ctx.fill();glow(x,y-35,15,'#f8bac477')}
 else if(kind==='weaver'||kind==='tej'||kind==='web'){ctx.strokeStyle='#c179ac';ctx.lineWidth=3;for(let i=0;i<8;i++){let a=i*Math.PI/4;tentacle(x,y-27,x+Math.cos(a)*33,y-15+Math.sin(a)*22,i)}polygon([[x-12,y-42],[x+3,y-54],[x+16,y-38],[x+11,y-18],[x-9,y-14]],'#59365c','#dd94c6',2);glow(x+1,y-35,11,'#f0b3e5cc')}
 else if(kind==='seer'||kind==='oracle'||kind==='ora'){ctx.strokeStyle='#d0b46e';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y-38,22,26,0,0,Math.PI*2);ctx.stroke();polygon([[x,y-67],[x+18,y-41],[x+11,y-13],[x-13,y-13],[x-17,y-39]],'#273d4d','#9cb4c2',2);glow(x,y-36,19,'#f2d8a577');ctx.fillStyle='#f1dca8';ctx.fillRect(x-4,y-41,8,5)}
 else if(kind==='anchor'||kind==='anc'){ctx.strokeStyle='#a96d8b';ctx.lineWidth=4;tentacle(x-8,y-22,x-22,y+8,1);tentacle(x+8,y-22,x+23,y+8,3);polygon([[x,y-60],[x+18,y-38],[x+12,y-13],[x-13,y-13],[x-19,y-38]],'#4e4458','#c594a8',2);ctx.fillStyle='#eaacbd';ctx.fillRect(x-3,y-42,6,13)}
 else{ctx.strokeStyle='#a94d75';ctx.lineWidth=4;for(let i=-2;i<=2;i++)tentacle(x+i*5,y-20,x+i*12,y+9,i);polygon([[x-20,y-23],[x-12,y-44],[x,y-51],[x+18,y-39],[x+21,y-17],[x,y-9]],kind==='lar'?'#70556b':'#713c53','#dc7c98',2);ctx.fillStyle='#f5c7ae';ctx.fillRect(x-8,y-36,5,4);ctx.fillRect(x+7,y-33,5,4)}
 drawCreatureDetail(x,y,u,t);ctx.restore()}

// FASE 17 — Procedural art pass. Pure rendering; no writes to tactical state.
// Silhouettes and structural markings stay readable at 640×640 and on touch displays.
function artStroke(x1,y1,x2,y2,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
function artDisc(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
function drawCustodianDetail(x,y,u,accent){
 ctx.save();
 // Rivets, segmented armor, enamel markings and unique equipment.
 ctx.fillStyle='#d6d7c1';for(const dx of [-13,13])for(const dy of [-40,-31])ctx.fillRect(x+dx-1,y+dy,2,2);
 artStroke(x-10,y-23,x-4,y-20,'#0e2730',2);artStroke(x+4,y-20,x+10,y-23,'#0e2730',2);
 if(u.type==='pen'){
  polygon([[x-19,y-55],[x-23,y-47],[x-14,y-39],[x-8,y-49]],'#a48d65','#e0d4a5',1);
  polygon([[x+15,y-56],[x+26,y-44],[x+23,y-33],[x+11,y-44]],'#8e7656','#e0c48c',1);
  ctx.fillStyle='#f4d6a1';ctx.fillRect(x-3,y-36,6,10);
  ctx.fillStyle='#8b5a41';ctx.fillRect(x+24,y-47,3,19);artStroke(x+21,y-48,x+33,y-48,'#e5d29f',4);
 }else if(u.type==='her'){
  artStroke(x-19,y-56,x-29,y-70,'#b9aa85',3);artStroke(x+19,y-56,x+29,y-70,'#b9aa85',3);
  artDisc(x-29,y-71,4,'#8fd2c8');artDisc(x+29,y-71,4,'#8fd2c8');
  polygon([[x-9,y-31],[x,y-39],[x+10,y-31],[x,y-24]],'#1d3a44','#b2e3d7',1);
  ctx.fillStyle='#d8bf8c';ctx.fillRect(x-2,y-81,4,10);
 }else{
  ctx.strokeStyle='#bba8eb';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y-44,25,30,0,-2.7,-.4);ctx.stroke();
  ctx.beginPath();ctx.ellipse(x,y-44,25,30,0,.4,2.7);ctx.stroke();
  for(const dx of [-14,14]){artStroke(x+dx,y-25,x+dx*1.6,y-7,'#b39aca',2);artDisc(x+dx*1.6,y-7,3,'#dbc0f5')}
  artDisc(x,y-36,5,'#d9b7ff');
 }
 // Health states change visual condition without changing saved data.
 if(u.hp/u.max<=.4){artStroke(x-9,y-45,x+4,y-34,'#ef917e',2);artStroke(x+4,y-34,x+8,y-40,'#ef917e',1)}
 ctx.restore();
}
function drawCreatureDetail(x,y,u,t){
 const k=u.type;ctx.save();
 if(k==='seer'){
  // Concentric prophetic eyes and three orbiting shards.
  for(let i=0;i<3;i++){const a=i*2.094+(reducedMotion()?0:t*.16),px=x+Math.cos(a)*21,py=y-37+Math.sin(a)*19;polygon([[px,py-6],[px+4,py],[px,py+6],[px-4,py]],'#8c7b9b','#e4c5e6',1)}
  artDisc(x,y-38,6,'#f2d8a5');artDisc(x,y-38,3,'#182633');
 }else if(k==='stalker'){
  // Long grasping arms with hooked ends, unmistakable diagonal silhouette.
  artStroke(x-14,y-33,x-29,y-19,'#a26279',5);artStroke(x-29,y-19,x-35,y+3,'#c28387',4);
  artStroke(x+14,y-33,x+29,y-19,'#a26279',5);artStroke(x+29,y-19,x+35,y+3,'#c28387',4);
  for(let i=-1;i<=1;i++){artStroke(x-35,y+3,x-35+i*5,y+10,'#dbc2b1',2);artStroke(x+35,y+3,x+35+i*5,y+10,'#dbc2b1',2)}
 }else if(k==='herald'){
  // A bell-mouth ring and sound-wave ribs.
  artDisc(x,y-32,14,'#cc9c8f');artDisc(x,y-32,10,'#251d34');artDisc(x,y-32,4,'#df9ec0');
  for(let i=0;i<3;i++)artStroke(x-19+i*19,y-52,x-22+i*22,y-64,'#b97e9e',2);
 }else if(k==='lar'){
  for(let i=0;i<4;i++){const xx=x-15+i*10;polygon([[xx,y-11],[xx+5,y-23],[xx+9,y-10]],'#d3adac','#f0d1b9',1)}
  artDisc(x-6,y-34,3,'#fff0b5');artDisc(x+7,y-33,3,'#fff0b5');
 }else if(k==='eng'){
  polygon([[x-13,y-48],[x-8,y-67],[x+1,y-50]],'#985f74','#d59ba9',1);
  polygon([[x+7,y-48],[x+17,y-65],[x+19,y-43]],'#985f74','#d59ba9',1);
  artDisc(x,y-34,6,'#ecb8af');artDisc(x,y-34,3,'#28192d');
 }else if(k==='vig'){
  for(let i=0;i<5;i++){const xx=x-16+i*8;artStroke(xx,y-55,xx+(i-2)*3,y-69,'#c79bac',2)}
  artDisc(x,y-33,8,'#f1c2d2');artDisc(x,y-33,4,'#291a32');
 }else if(k==='anchor'){
  for(let i=0;i<3;i++){artStroke(x-12+i*12,y-50,x-12+i*12,y-22,'#dcb59f',2)}
  artDisc(x,y-46,5,'#ffe0d0');
 }else if(k==='weaver'){
  for(let i=-2;i<=2;i++)artStroke(x+i*8,y-48,x+i*12,y-66,'#bd96c8',1.5);
  artDisc(x,y-35,7,'#f0c9ee');artDisc(x,y-35,3,'#2b193a');
 }else if(k==='boss'||k==='leviathan'){
  // Crown and multiple pupils on bosses; second phase glows brighter.
  const enraged=k==='leviathan'&&u.hp<=6;
  for(let i=-2;i<=2;i++)polygon([[x+i*10-5,y-59],[x+i*10,y-76-4*Math.abs(i)],[x+i*10+5,y-59]],enraged?'#ba5772':'#744363','#d09fae',1);
  for(let i=-1;i<=1;i++){artDisc(x+i*10,y-37,4,enraged?'#ffe9bb':'#ddb7c8');artDisc(x+i*10,y-37,2,'#341d33')}
  if(enraged){ctx.strokeStyle='#eea17c';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y-38,34,42,0,0,Math.PI*2);ctx.stroke()}
 }
 ctx.restore();
}
function drawSectorBackdrop(sector){
 ctx.save();ctx.globalAlpha=.78;
 if(sector===0){ // docks: hanging chains, mooring posts and nautical arcs
  for(let i=0;i<5;i++){let x=38+i*137;artStroke(x,46,x,113,'#89968b77',1);artStroke(x-5,111,x+5,111,'#b0a28b',3)}
 }else if(sector===1){ // forest: branching bare trees, not generic harbor cranes
  for(let i=0;i<12;i++){const x=12+i*56,h=31+(i%4)*12;artStroke(x,121,x+3,121-h,'#40594f',5);artStroke(x+3,121-h,x-16,97-h,'#526d5d',3);artStroke(x+3,121-h,x+18,91-h,'#526d5d',3)}
 }else if(sector===2){ // sunken city: impossible steep cyclopean spires
  for(let i=0;i<8;i++){let x=30+i*84;polygon([[x-13,128],[x-7,63-i%3*13],[x+4,28-i%3*10],[x+14,128]],'#283947','#75828b',1);artDisc(x+3,75-i%3*10,3,'#9b84bc')}
 }else if(sector===3){ // station: clock towers, tracks, repeating windows
  ctx.fillStyle='#273440';ctx.fillRect(74,32,490,90);for(let i=0;i<10;i++){let x=91+i*47;ctx.fillStyle='#ac9c7e';ctx.fillRect(x,57,15,28);ctx.fillStyle='#1b2732';ctx.fillRect(x+2,59,11,24)}
  artDisc(321,43,19,'#b8ac96');artDisc(321,43,15,'#2c3540');artStroke(321,43,321,34,'#e1d2aa',2);artStroke(321,43,328,46,'#e1d2aa',2);
 }else{ // cathedral: rose windows and salt spires
  for(let i=0;i<7;i++){let x=56+i*88;polygon([[x-15,126],[x-15,75],[x,37-i%2*10],[x+15,75],[x+15,126]],'#3f4051','#a88caa',1);artDisc(x,85,9,'#97738e');artDisc(x,85,5,'#2b233a')}
 }
 ctx.restore();
}
function drawSectorGround(p,x,y){
 // Sparse sector-specific floor pattern with alpha; tactical colors remain primary.
 const sector=campaign.sector;if(hash(x,y,sector+73)<.62)return;
 ctx.save();ctx.globalAlpha=.56;
 if(sector===0){artStroke(p.x-8,p.y+1,p.x+5,p.y+1,'#9db3ae',1);ctx.fillStyle='#9bb0ae';ctx.fillRect(p.x+7,p.y-5,3,3)}
 else if(sector===1){artStroke(p.x-10,p.y,p.x-4,p.y-7,'#8ca78d',1);artStroke(p.x-4,p.y-7,p.x+5,p.y-6,'#8ca78d',1)}
 else if(sector===2){artStroke(p.x-12,p.y+3,p.x-5,p.y-6,'#a6a1bf',1);artStroke(p.x-5,p.y-6,p.x+7,p.y-4,'#a6a1bf',1)}
 else if(sector===3){artStroke(p.x-12,p.y-4,p.x+12,p.y+4,'#a49b8f',1);artStroke(p.x-12,p.y,p.x+12,p.y+8,'#a49b8f',1)}
 else{ctx.fillStyle='#d0b8c7';ctx.fillRect(p.x-9,p.y-3,3,3);ctx.fillRect(p.x+8,p.y+3,2,2)}
 ctx.restore();
}
function unitIcon(p,u){const m=motion.get(u.id);if(m&&!reducedMotion()){const t=Math.min(1,(visualTime-m.at)/m.duration);if(t>=1)motion.delete(u.id);else{const origin=project(m.x,m.y),ease=1-Math.pow(1-t,3);p={x:origin.x+(p.x-origin.x)*ease,y:origin.y+(p.y-origin.y)*ease-10*Math.sin(Math.PI*t)}}}const wobble=reducedMotion()?0:Math.sin(visualTime*.004+u.id)*((u.side==='enemy')?2.4:1.2);p={x:p.x,y:p.y+wobble};if(!(window.AbyssPixel?.paint(ctx,p,u,visualTime,reducedMotion()))) {if(u.side==='ally')mech(p,u);else monster(p,u);}ctx.textAlign='center';ctx.font='bold 12px monospace';ctx.fillStyle='#08121a';ctx.fillRect(p.x-17,p.y+9,34,14);ctx.fillStyle=u.side==='ally'?'#a4e8d5':'#ffc2be';ctx.fillText(`${u.hp} HP`,p.x,p.y+20);if(u.id===state.selected){ctx.strokeStyle='#f4dda0';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,30,13,0,0,Math.PI*2);ctx.stroke()}}
function draw(){visualTime=performance.now();window.AbyssGPU?.setScene({corruption:state.corruption,sector:campaign.sector,quality:liteVisual()?'lite':'full',lights:state.rifts.slice(0,3).map(r=>project(r.x,r.y))});ctx.clearRect(0,0,640,640);
let sky=ctx.createLinearGradient(0,0,0,640);sky.addColorStop(0,'#0b1520');sky.addColorStop(.4,'#203542');sky.addColorStop(.8,'#111f2a');sky.addColorStop(1,'#071019');ctx.fillStyle=sky;ctx.fillRect(0,0,640,640);
// Distant moon, drifting cloud banks and deterministic silhouettes.
const sceneColors=[['#b5c7bb','#688397'],['#8bc4aa','#486b61'],['#a493bd','#4e506e'],['#c3b4a4','#667b81'],['#cc9cbb','#4e415b']][campaign.sector]||['#b5c7bb','#688397'];
 ctx.save();glow(112,72,76,'#c2d4c51a');ctx.fillStyle=sceneColors[0];ctx.globalAlpha=.5;ctx.beginPath();ctx.arc(112,72,18,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 for(let i=0;i<(liteVisual()?4:12);i++){const x=(i*103+visualTime*.008*(i%2?1:-1))%820-90,y=62+(i%4)*21;ctx.fillStyle='#8499a112';ctx.beginPath();ctx.ellipse(x,y,70+(i%3)*20,12,0,0,Math.PI*2);ctx.fill()}
 ctx.restore();
 // Premium 16-bit half-resolution backdrops: one distinct skyline per sector.
window.AbyssPanorama?.paint(ctx,campaign.sector);
window.AbyssWeather?.paint(ctx,campaign.sector,visualTime,liteVisual()?'lite':'full',reducedMotion(),'back');
 drawSectorBackdrop(campaign.sector);
ctx.fillStyle='#334954';ctx.globalAlpha=.3;for(let j=0;j<18;j++){let y=116+j*3;ctx.fillRect(0,y,640,1)}ctx.globalAlpha=1;
const selected=alive('ally').find(a=>a.id===state.selected),reachable=selected&&!selected.moved&&state.mode==='move'?pathCells(selected):new Map();
for(let depth=0;depth<=14;depth++){for(let x=0;x<8;x++){let y=depth-x;if(y<0||y>=8)continue;const k=key(x,y),threat=state.intent.some(i=>i.x===x&&i.y===y),rift=state.rifts.some(r=>r.x===x&&r.y===y);let c=(x+y)%2?'#354951':'#3c5158';if(reachable.has(k))c='#286b70';if(rift)c='#5b335c';if(threat)c='#7a3d48';const omen=state.omen&&state.omen.x===x&&state.omen.y===y;if(omen)c=state.omen.type==='fracture'?'#84623b':'#475e8a';const p=tile(x,y,c,threat?'#eaa2a0':'#587078');if(state.resonance&&state.resonance.x===x&&state.resonance.y===y){ctx.strokeStyle='#ef9df6';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y,29,14,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#f7c5ff';ctx.textAlign='center';ctx.font='bold 13px monospace';ctx.fillText('◎',p.x,p.y-15)}if(omen){ctx.fillStyle='#ffe1a1';ctx.font='bold 16px monospace';ctx.textAlign='center';ctx.fillText(state.omen.type==='fracture'?'✴':'◈',p.x,p.y+5)}if(state.objective&&!state.objectiveDone&&state.objective.x===x&&state.objective.y===y){ctx.strokeStyle='#f2c979';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y,21,10,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#ffe2a8';ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillText('◆',p.x,p.y+4)}
// Quiet, even ground pattern: threats and movement colors remain legible.
if(!((window as any).AbyssPixi?.hideCanvasWorld&&campaign.sector!==0)){drawSectorGround(p,x,y);window.AbyssEnvironment?.paint(ctx,'tile',p,campaign.sector,(x*7+y*13)%4);}
if(rift)portal(p);
const b=building(x,y);if(b&&!(window.AbyssPixi?.hideCanvasPort&&campaign.sector===0)&&!((window as any).AbyssPixi?.hideCanvasWorld&&campaign.sector!==0))house(p,b);
if(state.rocks.some(r=>r.x===x&&r.y===y)&&!(window.AbyssPixi?.hideCanvasPort&&campaign.sector===0)&&!((window as any).AbyssPixi?.hideCanvasWorld&&campaign.sector!==0))rock(p);
const u=at(x,y);if(u&&!window.AbyssPixi?.hideCanvasUnits){unitIcon(p,u);if(u.side==='ally'&&u.id===state.selected){ctx.save();ctx.strokeStyle='#f3d997';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(p.x,p.y+5,25,12,0,0,Math.PI*2);ctx.stroke();ctx.restore()}}
if(threat){ctx.strokeStyle='#ffa6a1';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,16,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#ffe5c6';ctx.font='bold 15px monospace';ctx.textAlign='center';ctx.fillText('!',p.x,p.y+5)}
}}
// Tactical inspection cursor: never obscures damage numbers or locked threats.
if(cursorActive){
 const cp=project(cursorCell.x,cursorCell.y);
 ctx.save();ctx.strokeStyle='#f9db9a';ctx.lineWidth=2.5;ctx.setLineDash([5,3]);ctx.beginPath();
 ctx.moveTo(cp.x,cp.y-TILE_RY-3);ctx.lineTo(cp.x+TILE_RX+4,cp.y);
 ctx.lineTo(cp.x,cp.y+TILE_RY+3);ctx.lineTo(cp.x-TILE_RX-4,cp.y);ctx.closePath();ctx.stroke();
 ctx.setLineDash([]);ctx.fillStyle='#f9db9a';ctx.font='bold 11px monospace';ctx.textAlign='center';
 ctx.fillText(`${cursorCell.x+1},${cursorCell.y+1}`,cp.x,cp.y-TILE_RY-10);ctx.restore();
}
window.AbyssAtmosphere?.paint(ctx,project,campaign.sector,state.rifts,visualTime,reducedMotion());
for(const intent of state.intent){const e=state.units.find(u=>u.id===intent.id&&u.hp>0);if(!e)continue;const a=project(e.x,e.y),b=project(intent.x,intent.y);ctx.save();ctx.setLineDash([5,5]);ctx.strokeStyle='#ffad9cb8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(a.x,a.y-12);ctx.lineTo(b.x,b.y-6);ctx.stroke();ctx.restore()}
if(impact){const dt=visualTime-impact.start;if(dt>=0&&dt<460){const p=project(impact.x,impact.y);ctx.save();ctx.globalAlpha=1-dt/460;ctx.strokeStyle=impact.color;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y,13+dt*.085,7+dt*.04,0,0,Math.PI*2);ctx.stroke();ctx.restore()}else if(dt>=460)impact=null}
// Transient attack fragments, resolved independently from game state.
for(let n=particles.length-1;n>=0;n--){const q=particles[n],age=visualTime-q.at;if(age>q.life){particles.splice(n,1);continue}const t=age/1000,p=project(q.x,q.y);ctx.globalAlpha=1-age/q.life;ctx.fillStyle=q.color;ctx.fillRect(p.x+q.vx*t,p.y-10+q.vy*t+35*t*t,3.5,3.5)}ctx.globalAlpha=1;
window.AbyssCombatFX?.effects(ctx,project,visualTime,reducedMotion());window.AbyssCinematicFX?.paint(ctx,project,visualTime,reducedMotion());
window.AbyssWeather?.paint(ctx,campaign.sector,visualTime,liteVisual()?'lite':'full',reducedMotion(),'front');
let fog=ctx.createLinearGradient(0,492,0,640);fog.addColorStop(0,'#0c1a2300');fog.addColorStop(1,'#0b1725');ctx.fillStyle=fog;ctx.fillRect(0,492,640,148);
ctx.save();ctx.strokeStyle='#a7c0bf32';ctx.lineWidth=1;const still=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;for(let i=0;i<(liteVisual()?12:48);i++){const xx=(hash(i,17)*640+(still?0:visualTime*.045))%640,yy=(hash(i,29)*640+(still?0:visualTime*.16))%640;ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx-3,yy+8);ctx.stroke()}ctx.restore();
 ctx.textAlign='left';ctx.fillStyle='#b6ad95';ctx.font='11px monospace';ctx.fillText('ESTACIÓN MARÍTIMA · CUADRANTE 07',17,25);ctx.fillStyle='#9bafb2';ctx.fillText('SEÑAL ACTIVA / 1927',17,41);ctx.fillStyle='#bbd2ca';ctx.font='10px monospace';ctx.fillText('CLIMA: '+(window.AbyssWeather?.describe(campaign.sector)?.name||'SIN DATOS'),17,57);ctx.textAlign='right';ctx.fillStyle='#e2cba0';ctx.fillText(`TURNO ${String(state.turn).padStart(2,'0')} / ${String(state.maxTurns).padStart(2,'0')}`,623,603);ctx.fillStyle='#89abb0';ctx.fillText('ARCHIVO DE CONTENCIÓN',623,621);
// Environmental accents differ by sector without changing hit-testing or visibility.
ctx.save();ctx.globalAlpha=.28;ctx.fillStyle=sceneColors[1];if(campaign.sector===1||campaign.sector===3){for(let n=0;n<14;n++){const x=hash(n,21)*640,y=80+hash(n,22)*530;ctx.beginPath();ctx.arc(x,y,2+hash(n,23)*5,0,Math.PI*2);ctx.fill()}}else if(campaign.sector===2||campaign.sector===4){for(let n=0;n<9;n++){const y=115+n*53+(reducedMotion()?0:Math.sin(visualTime*.001+n)*5);ctx.fillRect(0,y,640,1)}}ctx.restore();
if(curtain){const elapsed=visualTime-curtain.start;if(elapsed>1300)curtain=null;else{const alpha=Math.min(.8,Math.min(elapsed/150,(1300-elapsed)/420));ctx.fillStyle=`rgba(4,13,22,${Math.max(0,alpha)})`;ctx.fillRect(0,0,640,640);ctx.textAlign='center';ctx.font='bold 19px monospace';ctx.fillStyle='#eed9b1';ctx.fillText(curtain.text,320,315)}}
}
(window as any).AbyssDrawSource=()=>draw();
// Deterministic preview of *currently locked* threats; not a promise about later turns.
function threatForecast(){
 let buildings=0, allies=0, corruption=0;
 const projectedRifts=new Set(state.rifts.map(r=>key(r.x,r.y)));
 for(const i of state.intent){
  if(!alive('enemy').some(e=>e.id===i.id))continue;
  const b=building(i.x,i.y),u=alive('ally').find(a=>a.x===i.x&&a.y===i.y);
  const damage=i.attack==='cataclysm'?3:i.attack==='rupture'?2:i.damage;
  if(b)buildings+=Math.min(b.hp,damage);
  if(u)allies+=u.shield>0?0:Math.min(u.hp,damage);
  corruption+=({anchor:5,drain:4,cataclysm:6,vision:4,chorus:3})[i.attack]||0;
  if(['rupture','cataclysm','web','corrupt'].includes(i.attack)&&!b)projectedRifts.add(key(i.x,i.y));
 }
 if(state.omen?.type==='surge')corruption+=6;
 if(state.omen?.type==='fracture'&&!building(state.omen.x,state.omen.y))projectedRifts.add(key(state.omen.x,state.omen.y));
 if(state.resonance&&alive('enemy').some(e=>e.id===state.resonance.source)&&state.rifts.some(r=>r.x===state.resonance.x&&r.y===state.resonance.y))corruption+=4;
 corruption+=projectedRifts.size*2;
 return {buildings,allies,corruption};
}
function updateTacticalHUD(){
 window.AbyssBestiary?.update(state);
 const enemies=alive('enemy');const boss=enemies.find(u=>u.type==='leviathan'||u.type==='boss');
 const box=$('#bossHUD');box.hidden=!boss;
 if(boss){$('#bossName').textContent=boss.name.toUpperCase();$('#bossPhase').textContent=boss.type==='leviathan'&&boss.hp<=6?'FASE II · CATACLISMO':'FASE I · RUPTURA';($('#bossFill').style??={}).width=`${Math.max(0,Math.min(100,boss.hp/boss.max*100))}%`;$('#bossHealth').textContent=`${boss.hp} / ${boss.max} PV`}
 const attacks=state.intent.filter(i=>enemies.some(e=>e.id===i.id));
 const endangered=alive('ally').filter(u=>attacks.some(i=>i.x===u.x&&i.y===u.y));
 const defenseNotice=document.querySelector('#defenseForecast');
 if(defenseNotice)defenseNotice.textContent=`ALERTA DEFENSIVA · ${endangered.length} Custodio(s) amenazados · POSTURA DEFENSIVA bloquea un impacto a aliados próximos.`;
 const risk=threatForecast();
 $('#threatSummary').textContent=state.phase==='player'?`AMENAZAS: ${attacks.length} ataques anunciados · ${state.omen?'1 anomalía prevista':'sin anomalía'} · ${state.resonance?'1 resonancia anunciada':'sin resonancia'} · ${state.rifts.length} grietas activas · RIESGO ACTUAL: ${risk.buildings} daño a edificios, ${risk.allies} daño a Custodios, +${risk.corruption}% corrupción aproximada`:'Sin amenazas activas durante la resolución de misión';
 for(const btn of ((document.querySelectorAll?.('[data-unit]')??[]) as Iterable<HTMLButtonElement>)){const id=Number(btn.dataset.unit),unit=alive('ally').find(u=>u.id===id);btn.disabled=!unit||state.phase!=='player';btn.setAttribute('aria-pressed',String(!!unit&&state.selected===id));btn.textContent=unit?`${id} · ${unit.name.toUpperCase()} (${unit.hp} PV)`:`${id} · INACTIVO`}
 $('#touchMode').disabled=state.phase!=='player';$('#touchMode').textContent=state.mode==='move'?'MODO · MOVER':'MODO · ATACAR';$('#touchEnd').disabled=state.phase!=='player';const chosen=alive('ally').find(a=>a.id===state.selected);$('#touchSpecial').disabled=state.phase!=='player'||!chosen||(chosen.specialUsed&&state.turn-(chosen.specialTurn||0)<3);
}
function render(){draw();window.AbyssSoundscape?.sync((window as any).AbyssView?.());updateCellInspector();persist();window.AbyssGuide?.sync(state);const qualityButton=document.querySelector('#visualQuality');if(qualityButton){qualityButton.textContent=visualQuality==='lite'?'GRÁFICOS: LIGEROS':'GRÁFICOS: DETALLADOS';qualityButton.setAttribute?.('aria-pressed',String(visualQuality==='lite'))};updateTacticalHUD();updateMetrics();updateEncounterHUD();$('#saveStatus').textContent=storageOk?'ARCHIVO LOCAL · GUARDADO AUTOMÁTICO':'GUARDADO NO DISPONIBLE · UTILIZA NAVEGACIÓN PRIVADA O REVISA EL ALMACENAMIENTO';$('#story').textContent=CHAPTERS[campaign.sector];statusEl.textContent=state.phase==='complete'?'CAMPAÑA COMPLETADA — El abismo aguarda':state.phase==='won'?'SECTOR CONTENIDO — Continúa la expedición':state.phase==='lost'?'DERROTA — La ciudad desaparece':`Turno ${state.turn}/${state.maxTurns} · Amenazas fijadas${SECTORS[campaign.sector].finalBoss?' · DERROTA AL INNOMBRABLE ANTES DEL ÚLTIMO TURNO':''}`;$('#sector').textContent=`EXPEDIENTE ${campaign.sector+1}/${SECTORS.length} · ${state.sectorName} · Mejoras: ${campaign.upgrades.length}`;$('#next').hidden=state.phase!=='won';statsEl.textContent=`Red eléctrica: ${state.integrity}/${state.maxIntegrity} · Corrupción: ${state.corruption}% · Entidades: ${alive('enemy').length} · Anomalía: ${state.omen?`${state.omen.type==='fracture'?'FRACTURA':'OLEADA'} (${state.omen.x+1},${state.omen.y+1})`:'sin alerta'}`;const u=alive('ally').find(a=>a.id===state.selected);unitEl.textContent=u?`${u.name} · ${PILOTS[u.pilot]?.name||'Piloto desconocido'} (${u.hp}/${u.max} PV) · Mover: ${u.moved?'hecho':'disponible'} · Atacar: ${u.acted?'hecho':'disponible'}`:'Sin Custodio seleccionado';modeBtn.textContent=state.mode==='move'?'MODO: MOVER — cambiar a ATAQUE':'MODO: ATAQUE — cambiar a MOVER';modeBtn.disabled=endBtn.disabled=state.phase!=='player';helpEl.textContent=state.mode==='move'?'Turquesa: movimiento. ✴ = fractura, ◈ = oleada, ◎ = resonancia anunciada;  se resuelven al finalizar el turno.':'Penitente: golpea un enemigo adyacente. Heraldo: explosión hasta 3 casillas. Viuda: silencia una amenaza hasta 3 casillas.';$('#pilot').value=u?.pilot||'ada';$('#pilot').disabled=state.phase!=='player'||!u||u.moved||u.acted;$('#pilotInfo').textContent=u?PILOTS[u.pilot]?.trait||'Sin habilidad': 'Selecciona una unidad';$('#special').disabled=state.phase!=='player'||!u||(u.specialUsed&&state.turn-(u.specialTurn||0)<3);$('#defensiveStance').disabled=state.phase!=='player'||!u||u.acted;$('#special').textContent=u?`HABILIDAD · ${u.type==='pen'?'GUARDIA DE HIERRO':u.type==='her'?'INTERFERENCIA':'LITURGIA'}${u.specialUsed&&state.turn-(u.specialTurn||0)<3?' · RECARGA '+(3-(state.turn-(u.specialTurn||0)))+'T':''}`:'HABILIDAD ESPECIAL';const orderEl=document.querySelector('#missionOrderStatus');
 if(orderEl){const m=state.missionOrder;orderEl.textContent=m?(m.kind==='containment'?
 `CONTENCIÓN · Objetivo: ${state.objectiveDone?'CUMPLIDO':'PENDIENTE'} · Grietas: ${state.rifts.length}/1`:
 `BASTIÓN · Asaltos: ${metrics().turnsResolved}/${m.rounds} · Edificios: ${state.buildings.filter(b=>b.hp>0).length}/${m.requiredBuildings} · Red: ${state.integrity}/${Math.ceil(state.maxIntegrity/2)}`):'';}
 $('#objective').textContent=state.objective?`${state.objectiveDone?'✓ COMPLETADO':'◆ OBJETIVO SECUNDARIO'} · ${state.objective.title} (${state.objective.x+1}, ${state.objective.y+1}) · Recompensa: -15 % corrupción${state.recovery?' · RESCATE: '+(state.recovery.resolved?(state.recovery.success?'ÉXITO (+1 BLINDAJE)':'FALLIDO (+12 % CORRUPCIÓN)'):'ANTES DEL TURNO '+(state.recovery.deadline+1)):''}`:'';$('#event').hidden=state.choiceMade||state.phase!=='player';logEl.replaceChildren(...state.log.map(t=>{const p=document.createElement('p');p.textContent=t;return p}))}
// Inspect a cell without changing game state or consuming a tactical action.
function updateCellInspector(){
 const el=document.querySelector('#tileInspector');if(!el)return;
 const nav=document.querySelector<HTMLButtonElement>('#keyboardMode');
 if(nav){nav.textContent=keyboardNavigation?'NAVEGACIÓN: ACTIVA (K)':'NAVEGACIÓN (K)';nav.setAttribute?.('aria-pressed',String(keyboardNavigation))}
 if(!cursorActive){el.textContent='INSPECTOR TÁCTICO · Sitúa el puntero sobre el tablero, o pulsa NAVEGACIÓN (K).';return}
 const {x,y}=cursorCell,unit=at(x,y),b=building(x,y);
 const threats=state.intent.filter(i=>i.x===x&&i.y===y&&state.units.some(u=>u.id===i.id&&u.hp>0));
 const rift=state.rifts.some(r=>r.x===x&&r.y===y);
 const selected=alive('ally').find(u=>u.id===state.selected);
 const reachable=selected&&!selected.moved&&state.mode==='move'&&pathCells(selected).has(key(x,y))&&!obstacle(x,y);
 const canAttack=!!selected&&state.mode==='attack'&&!selected.acted&&AbyssTactics.legalAttack(selected,{x,y},unit,b,rift,selected.type==='viu');
 const label=unit?`${unit.side==='ally'?'CUSTODIO':'ENTIDAD'} ${unit.name} · ${unit.hp} PV`:b?`EDIFICIO · ${b.hp} PV`:rift?'GRIETA ABIERTA':state.rocks.some(r=>r.x===x&&r.y===y)?'ROCA':'TERRENO';
 const opportunity=reachable?' · MOVIMIENTO DISPONIBLE':canAttack?' · OBJETIVO DE ATAQUE':threats.length?` · ¡AMENAZA ${threats.length}!`:'';
 el.textContent=`CASILLA ${x+1},${y+1} · ${label}${opportunity}${threats.length?' · BAJO FUEGO':''}${state.omen?.x===x&&state.omen?.y===y?' · ANOMALÍA PREVISTA':''}`;
}
function setCursor(x:number,y:number,mode?:'keyboard'|'pointer'){
 cursorCell={x:Math.min(N-1,Math.max(0,x)),y:Math.min(N-1,Math.max(0,y))};cursorActive=true;
 if(mode==='keyboard')keyboardNavigation=true;
 updateCellInspector();
}
function toggleKeyboardNavigation(){
 keyboardNavigation=!keyboardNavigation;cursorActive=keyboardNavigation;
 if(keyboardNavigation){const selected=alive('ally').find(u=>u.id===state.selected);if(selected)setCursor(selected.x,selected.y,'keyboard');canvas.focus({preventScroll:true})}
 updateCellInspector();
}
function hitTile(px,py){
 // Choose a diamond by its centre, not floating-point floor which misses edges at mobile scale.
 const candidates=[];for(let x=0;x<N;x++)for(let y=0;y<N;y++){const p=project(x,y);const diamond=Math.abs(px-p.x)/TILE_RX+Math.abs(py-p.y)/TILE_RY;if(diamond<=1.18)candidates.push({x,y,score:diamond})}
 candidates.sort((a,b)=>a.score-b.score);return candidates[0]||null;
}
const navigationButton=document.createElement('button');navigationButton.id='keyboardMode';navigationButton.type='button';navigationButton.textContent='NAVEGACIÓN (K)';navigationButton.setAttribute?.('aria-pressed','false');
document.querySelector('.quality-bar')?.appendChild?.(navigationButton);
navigationButton.addEventListener?.('click',toggleKeyboardNavigation);
canvas.addEventListener('pointermove',ev=>{
 if(ev.pointerType==='touch'||keyboardNavigation)return;
 const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
 const cell=hitTile((ev.clientX-r.left)*canvas.width/r.width,(ev.clientY-r.top)*canvas.height/r.height);
 if(cell&&(cell.x!==cursorCell.x||cell.y!==cursorCell.y||!cursorActive))setCursor(cell.x,cell.y,'pointer');
});
canvas.addEventListener('pointerleave',()=>{if(!keyboardNavigation){cursorActive=false;updateCellInspector()}});
canvas.addEventListener('pointerdown',ev=>{
 if(state.phase!=='player')return;
 if(ev.pointerType==='touch')ev.preventDefault();
 const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
 const px=(ev.clientX-r.left)*canvas.width/r.width,py=(ev.clientY-r.top)*canvas.height/r.height;
 let cell=hitTile(px,py);
 // A visible upper sprite can be tapped; select the closest ally rather than the first in the array.
 const sprites=alive('ally').map(u=>({u,p:project(u.x,u.y)})).filter(o=>Math.abs(px-o.p.x)<=20&&py>=o.p.y-62&&py<=o.p.y-13);
 sprites.sort((a,b)=>Math.hypot(px-a.p.x,py-(a.p.y-35))-Math.hypot(px-b.p.x,py-(b.p.y-35)));
 if(sprites.length)cell={x:sprites[0].u.x,y:sprites[0].u.y};
 if(cell){setCursor(cell.x,cell.y,'pointer');tryAction(cell.x,cell.y)}
});
for(const button of ((document.querySelectorAll?.('[data-unit]')??[]) as Iterable<HTMLButtonElement>))button.addEventListener('click',()=>{if(state.phase!=='player')return;const u=alive('ally').find(a=>a.id===Number(button.dataset.unit));if(!u)return;state.selected=u.id;state.mode='move';sound('select');render()});
$('#visualQuality')?.addEventListener('click',()=>{visualQuality=visualQuality==='full'?'lite':'full';try{localStorage.setItem('abyss-visual-quality',visualQuality)}catch{}render()});
$('#touchMode').addEventListener('click',()=>modeBtn.click());$('#touchSpecial').addEventListener('click',special);$('#touchEnd').addEventListener('click',resolveEnemy);modeBtn.addEventListener('click',()=>{if(state.phase!=='player')return;state.mode=state.mode==='move'?'attack':'move';sound('select');render()});endBtn.addEventListener('click',resolveEnemy);$('#restart').addEventListener('click',fullRestart);$('#next').addEventListener('click',nextMission);
$('#special').addEventListener('click',special);$('#defensiveStance').addEventListener('click',defensiveStance);$('#fortify').addEventListener('click',()=>chooseEvent('fortify'));$('#seal').addEventListener('click',()=>chooseEvent('seal'));
$('#sound').addEventListener('click',async()=>{audioEnabled=!audioEnabled;if(window.AbyssSoundscape)audioEnabled=await window.AbyssSoundscape.setEnabled(audioEnabled);updateAudioLabel();if(audioEnabled)sound('select')});
$('#pilot').addEventListener('change',ev=>{const u=alive('ally').find(a=>a.id===state.selected),pilot=ev.target.value;if(!u||state.phase!=='player'||u.moved||u.acted||!PILOTS[pilot]||alive('ally').some(a=>a.id!==u.id&&a.pilot===pilot))return render();const old=PILOTS[u.pilot]?.ability;u.pilot=pilot;campaign.pilots[u.id-1]=pilot;const next=PILOTS[pilot].ability;if(old==='scout')u.range--;if(old==='armor'){u.max--;u.hp=Math.min(u.hp,u.max)}if(next==='scout')u.range++;if(next==='armor'){u.max++;u.hp++}u.shield=next==='shield'?1:0;u.attackBonus=next==='reach'?1:0;u.burstUsed=false;note(`${u.name}: piloto asignado, ${PILOTS[pilot].name}.`);render()});
$('#encounter-siege').addEventListener('click',()=>chooseEncounter('siege'));$('#encounter-tide').addEventListener('click',()=>chooseEncounter('tide'));$('#encounter-vigil')?.addEventListener('click',()=>chooseEncounter('vigil'));$('#encounter-recovery')?.addEventListener('click',()=>chooseEncounter('recovery'));$('#encounter-containment')?.addEventListener('click',()=>chooseEncounter('containment'));$('#encounter-defense')?.addEventListener('click',()=>chooseEncounter('defense'));$('#exportMetrics').addEventListener('click',exportMetrics);
// v0.50: portable save backup. Localhost port is fixed to keep browser origin stable.
function exportSaveFile(){
 const data={version:8,campaign,state};if(!validSave(data)){$('#saveStatus').textContent='ERROR: PARTIDA ACTUAL NO VÁLIDA';return false}
 const json=JSON.stringify(data,null,2),file=new Blob([json],{type:'application/json'});
 const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=`into-the-abyss-partida-sector-${campaign.sector+1}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 $('#saveStatus').textContent='COPIA DE PARTIDA EXPORTADA';return true;
}
async function importSaveFile(file){
 if(!file||file.size>1024*1024){$('#saveStatus').textContent='IMPORTACIÓN CANCELADA: ARCHIVO DEMASIADO GRANDE';return false}
 try{
  const data=JSON.parse(await file.text());
  if(!validSave(data)){$('#saveStatus').textContent='IMPORTACIÓN RECHAZADA: PARTIDA NO VÁLIDA';return false}
  if(!window.confirm('¿Sustituir tu partida actual por la copia seleccionada?'))return false;
  localStorage.setItem(SAVE_KEY,JSON.stringify(data));
  if(!restore())throw Error('No se pudo restaurar la partida');
  $('#saveStatus').textContent='COPIA IMPORTADA Y GUARDADA';return true;
 }catch(e){$('#saveStatus').textContent='ERROR AL IMPORTAR: FORMATO O ALMACENAMIENTO NO VÁLIDOS';return false}
}
$('#exportSave').addEventListener('click',exportSaveFile);
$('#importSave').addEventListener('click',()=>$('#saveFileInput').click());
$('#saveFileInput').addEventListener('change',async ev=>{const file=ev.target.files?.[0];if(file)await importSaveFile(file);ev.target.value=''});
$('#save').addEventListener('click',()=>{const ok=persist();$('#saveStatus').textContent=ok?'EXPEDIENTE GUARDADO MANUALMENTE':'NO HA SIDO POSIBLE GUARDAR EL EXPEDIENTE'});
document.addEventListener('keydown',ev=>{
 if(ev.altKey||ev.ctrlKey||ev.metaKey||ev.repeat)return;
 if(keyboardNavigation&&ev.key==='Escape'){ev.preventDefault();keyboardNavigation=false;cursorActive=false;updateCellInspector();return}
 if((ev.target as Element|null)?.matches?.('input, textarea, select, button, [contenteditable]'))return;
 if(ev.key.toLowerCase()==='k') {ev.preventDefault();toggleKeyboardNavigation();return}
 if(keyboardNavigation&&state.phase==='player'&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(ev.key)){
  ev.preventDefault();const dir:{[key:string]:[number,number]}={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
  const [dx,dy]=dir[ev.key];setCursor(cursorCell.x+dx,cursorCell.y+dy,'keyboard');return;
 }
 if(keyboardNavigation&&state.phase==='player'&&(ev.key==='Enter'||ev.code==='NumpadEnter')){
  ev.preventDefault();tryAction(cursorCell.x,cursorCell.y);updateCellInspector();return;
 }
 if(['1','2','3'].includes(ev.key)&&state.phase==='player'){
 const u=alive('ally').find(a=>a.id===Number(ev.key));if(u){state.selected=u.id;state.mode='move';if(keyboardNavigation)setCursor(u.x,u.y,'keyboard');sound('select');render()}
 }else if(ev.key.toLowerCase()==='m'&&state.phase==='player'){modeBtn.click()}
 else if(ev.key.toLowerCase()==='h'&&state.phase==='player'){special()}
 else if(ev.code==='Space'&&state.phase==='player'){ev.preventDefault();resolveEnemy()}
});
if(!restore())init();updateAudioLabel();
let lastFrame=0;function animate(now){if(!document.hidden&&state&&now-lastFrame>=(liteVisual()?66:33)){lastFrame=now;draw()}requestAnimationFrame(animate)}requestAnimationFrame(animate);
