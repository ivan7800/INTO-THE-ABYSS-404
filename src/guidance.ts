/** REBIRTH 0.50: optional, accessible onboarding. No changes to simulation. */
(() => {
 type Unit={side:string;id:number;moved?:boolean;acted?:boolean;hp:number};
 type View={sectorName:string;turn:number;phase:string;mode:string;selected:number|null;units:Unit[];intent:{id:number;x:number;y:number}[];buildings:{x:number;y:number;hp:number}[];rifts:{x:number;y:number}[]};
 const stored=()=>{try{return localStorage.getItem('abyss-guide-v050')==='dismissed'}catch{return false}};
 let dismissed=stored();let lastText='';
 const root=document.createElement('section');root.id='rebirth-guide';root.className='rebirth-guide';root.setAttribute('aria-label','Guía táctica inicial');
 root.innerHTML=`<div class="guide-heading"><strong>PROTOCOLO DE SUPERVIVENCIA</strong><button type="button" id="guide-close" aria-label="Ocultar guía inicial">×</button></div><p id="guide-message"></p><div class="guide-controls"><button type="button" id="guide-dismiss">OCULTAR GUÍA</button><span id="guide-step">FASE 1 / 3</span></div>`;
 const mount=document.querySelector('.battle');mount?.insertBefore(root,mount.querySelector('.rebirth-stage')??mount.firstChild);
 const hide=()=>{dismissed=true;root.hidden=true;try{localStorage.setItem('abyss-guide-v050','dismissed')}catch{}};
 root.querySelector('#guide-close')?.addEventListener('click',hide);
 root.querySelector('#guide-dismiss')?.addEventListener('click',hide);
 const link=document.createElement('button');link.type='button';link.id='guide-reopen';link.textContent='? GUÍA';link.setAttribute('aria-label','Mostrar guía táctica');
 document.querySelector('.quality-bar')?.appendChild(link);
 link.addEventListener('click',()=>{dismissed=false;root.hidden=false;lastText='';try{localStorage.removeItem('abyss-guide-v050')}catch{}});
 const sync=(s:View)=>{
  if(!root.isConnected)return;
  root.hidden=dismissed||s.phase!=='player'||s.turn>2;
  if(root.hidden)return;
  const ally=s.units.find(u=>u.id===s.selected&&u.side==='ally'&&u.hp>0);
  const threatened=s.intent.filter(i=>s.units.some(u=>u.id===i.id&&u.hp>0));
  const exposed=s.buildings.some(b=>b.hp>0&&threatened.some(i=>i.x===b.x&&i.y===b.y));
  const step=!ally||!ally.moved?1:!ally.acted?2:3;
  const message=step===1?'1. Selecciona un Custodio (teclas 1–3). Las losetas turquesas indican a dónde puede desplazarse. Evita las casillas rojas.'
    :step===2?'2. Cambia a ATAQUE (tecla M). El Penitente golpea de cerca; el Heraldo dispara a distancia; la Viuda interrumpe ataques enemigos.'
    :'3. Comprueba las líneas rojas de ataque. Pulsa FINALIZAR TURNO (Espacio) cuando hayas protegido los edificios.';
  const warning=exposed?' AVISO: hay un edificio bajo amenaza en este turno.':` ${threatened.length} ataques enemigos anunciados.`;
  if(lastText!==message+warning){const el=root.querySelector('#guide-message');if(el)el.textContent=message+warning;lastText=message+warning}
  const el=root.querySelector('#guide-step');if(el)el.textContent=`PASO ${step} / 3`;
 };
 (window as Window & {AbyssGuide?:{sync:(s:View)=>void}}).AbyssGuide={sync};
})();
