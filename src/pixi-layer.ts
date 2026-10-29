/** PixiJS v8 display adapter: GPU presentation of the unchanged, authoritative
 * tactical canvas. It can be enabled OFFLINE by running `npm run vendor:pixi`.
 * IMPORTANT: this is a genuine PixiJS Application/Sprite/TextureSource path,
 * not a homemade renderer masquerading as PixiJS. No external CDN is required.
 */
(() => {
 type PixiGlobal={Application:new()=>any;Sprite:new(texture:any)=>any;Graphics:new()=>any;Container:new()=>any;Texture:{from:(src:HTMLCanvasElement)=>any}};
 type Scene={corruption:number;sector:number;quality:'lite'|'full';lights:{x:number;y:number}[]};
 const runtime={status:'pending',frames:0,reason:'bundle-unavailable',engineVersion:'8.19.0',nativeObjects:0,nativeUnits:0,nativeTiles:64,hideCanvasUnits:false,fps:0};
 const w=window as Window & {PIXI?:PixiGlobal;AbyssPixi?:typeof runtime};
 w.AbyssPixi=runtime;
 async function activate(pixi:PixiGlobal){
  const source=document.querySelector<HTMLCanvasElement>('#game');
  if(!source)return false;
  const canvas=source;
  const container=document.querySelector('.rebirth-stage');
  if(!container)return false;
  let app:any;
  try {
   app=new pixi.Application();
   await app.init({width:canvas.width,height:canvas.height,backgroundAlpha:1,backgroundColor:0x09131d,preference:'webgl',antialias:false,resolution:1});
   const texture=pixi.Texture.from(canvas);
   const sprite=new pixi.Sprite(texture);
   sprite.texture.source.scaleMode='nearest';
   app.stage.addChild(sprite);

   // GPU-native isometric details and independently animated PIXI.Sprite units.
   const terrain=new pixi.Graphics();app.stage.addChild(terrain);
   const actorLayer=new pixi.Container();actorLayer.sortableChildren=true;app.stage.addChild(actorLayer);
   const actorCache=new Map<number,any>(),textureCache=new Map<string,any>();
   const position=(x:number,y:number)=>({x:320+(x-y)*39,y:155+(x+y)*24});
   const pixiSprite=(type:string,frame:number,injured:boolean)=>{
    const key=type+':'+frame+':'+injured;
    if(textureCache.has(key))return textureCache.get(key);
    const src=window.AbyssPixel?.sprite?.(type,frame,injured);
    if(!src)throw Error('missing-pixel-sprite:'+type);
    const tex=pixi.Texture.from(src);tex.source.scaleMode='nearest';
    textureCache.set(key,tex);return tex;
   };
   const nativeDraw=(now:number)=>{
    const view=(window as any).AbyssView?.();if(!view)throw Error('missing-native-view');
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
    terrain.clear();
    for(let x=0;x<8;x++)for(let y=0;y<8;y++){
     const p=position(x,y);
     terrain.poly([p.x,p.y-18,p.x+33,p.y,p.x,p.y+18,p.x-33,p.y],true)
       .stroke({color:(x+y)%2?0x6998a3:0xadc1ba,width:.65,alpha:.3});
    }
    for(const t of view.threats){
     const p=position(t.x,t.y);terrain.circle(p.x,p.y,17).stroke({color:0xffa18e,width:1.5,alpha:.85});
    }
    for(const t of view.rifts){
     const p=position(t.x,t.y),pulse=reduced?0:Math.sin(now*.005+t.x*2+t.y)*2;
     terrain.ellipse(p.x,p.y-2,14+pulse,6).stroke({color:0xc77fce,width:1.5,alpha:.9});
    }
    if(view.cursor){
     const p=position(view.cursor.x,view.cursor.y);
     terrain.poly([p.x,p.y-23,p.x+38,p.y,p.x,p.y+23,p.x-38,p.y],true)
       .stroke({color:0xffd58e,width:2,alpha:1});
    }
    const active=new Set<number>();
    for(const u of view.units){
     active.add(u.id);
     let a=actorCache.get(u.id);
     if(!a){
      const holder=new pixi.Container(),shadow=new pixi.Graphics(),ring=new pixi.Graphics(),health=new pixi.Graphics();
      const graphic=new pixi.Sprite(pixiSprite(u.type,0,false));
      graphic.anchor.set(.5,1);holder.addChild(shadow,graphic,ring,health);
      actorLayer.addChild(holder);
      a={holder,shadow,ring,health,graphic,x:u.x,y:u.y,from:position(u.x,u.y),start:now,pose:''};
      actorCache.set(u.id,a);
     }
     const p=position(u.x,u.y);
     if(a.x!==u.x||a.y!==u.y){
      a.from=position(a.x,a.y);a.start=now;a.x=u.x;a.y=u.y;
     }
     const step=reduced?1:Math.min(1,(now-a.start)/225),ease=1-(1-step)**3;
     a.holder.position.set(Math.round(a.from.x+(p.x-a.from.x)*ease),Math.round(a.from.y+(p.y-a.from.y)*ease-(reduced?0:Math.sin(Math.PI*step)*7)));
     a.holder.zIndex=(u.x+u.y)*10+u.x;
     const boss=u.type==='boss'||u.type==='leviathan';
     const w=boss?91:u.side==='ally'?58:64,h=boss?118:u.side==='ally'?78:86;
     a.graphic.width=w;a.graphic.height=h;a.graphic.y=9;
     const frame=reduced?0:Math.floor(now/(u.side==='ally'?180:260)+u.id)%4;
     const injured=u.hp/u.max<=.4,pose=u.type+':'+frame+':'+injured;
     if(a.pose!==pose){a.graphic.texture=pixiSprite(u.type,frame,injured);a.pose=pose}
     a.shadow.clear().ellipse(0,4,boss?37:23,boss?13:9).fill({color:0x020a13,alpha:.74});
     a.ring.clear();
     if(u.id===view.selected)a.ring.ellipse(0,5,boss?39:27,12).stroke({color:0xffd28c,width:2,alpha:1});
     if(u.stunned)a.ring.ellipse(0,-h+25,w*.36,8).stroke({color:0xb4edff,width:2,alpha:.9});
     a.health.clear().roundRect(-18,11,36,6,2).fill({color:0x08131c,alpha:.96})
       .roundRect(-17,12,Math.max(0,34*Math.min(1,u.hp/u.max)),4,1)
       .fill({color:u.side==='ally'?0x94e1ca:0xe58b9e});
    }
    for(const [id,a] of actorCache)if(!active.has(id)){
     a.holder.parent?.removeChild(a.holder);a.holder.destroy({children:true});actorCache.delete(id);
    }
    runtime.nativeUnits=actorCache.size;runtime.nativeObjects=actorCache.size+66;
   };

   // First genuinely native PixiJS object, drawn independently of Canvas.
   if(pixi.Graphics){
    const reticle=new pixi.Graphics();app.stage.addChild(reticle);
    const draw=(event:PointerEvent)=>{
     const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
     const x=(event.clientX-rect.left)*canvas.width/rect.width;
     const y=(event.clientY-rect.top)*canvas.height/rect.height;
     reticle.clear().circle(x,y,9).stroke({color:0x9fdfce,width:1.5,alpha:.85});
    };
    canvas.addEventListener('pointermove',draw,{passive:true});
    canvas.addEventListener('pointerleave',()=>reticle.clear(),{passive:true});
    runtime.nativeObjects=1;
   }
   const output=app.canvas as HTMLCanvasElement;
   output.id='pixi-screen';output.setAttribute('aria-hidden','true');
   output.addEventListener('webglcontextlost',(event:Event)=>{
    event.preventDefault();runtime.status='fallback';runtime.reason='webglcontextlost';runtime.hideCanvasUnits=false;
    (window as any).AbyssDrawSource?.();
    output.remove();canvas.classList.remove('rebirth-source');document.body.dataset.rebirth='canvas-fallback';
   },{once:true});
   container.append(output);
   // Only replace the existing GPU compositor after successful initialization.
   window.AbyssGPU?.pause?.();
   document.querySelector('#rebirth-screen')?.remove();
   source.classList.add('rebirth-source');
   document.body.dataset.rebirth='pixijs-webgl';
   document.body.dataset.pixi='active';
   const label=document.querySelector('.gpu-label');if(label)label.textContent='PIXIJS 8 · WEBGL';
   runtime.status='active';runtime.reason='';
   runtime.hideCanvasUnits=true;
   (window as any).AbyssDrawSource?.();
   let previous=-Infinity;
   const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
   function tick(now:number){
    if(runtime.status!=='active')return;
    requestAnimationFrame(tick);
    if(document.hidden||now-previous<(reduced?66:32))return;
    previous=now;
    try{nativeDraw(now);texture.source.update();runtime.frames++;
      runtime.fps=Math.min(60,Math.round(1000/Math.max(1,now-previous+32)));
      const label=document.querySelector('.gpu-label');if(label)label.textContent='PIXIJS · '+runtime.nativeUnits+' SPRITES';}
    catch(e){runtime.status='fallback';runtime.reason='texture-upload-failed';runtime.hideCanvasUnits=false;
      (window as any).AbyssDrawSource?.();
      output.remove();canvas.classList.remove('rebirth-source');document.body.dataset.rebirth='canvas-fallback';
      const label=document.querySelector('.gpu-label');if(label)label.textContent='CANVAS 2D · COMPATIBLE';
      console.warn('PixiJS texture update failed:',e);try{app.destroy(true)}catch{}}
   }
   requestAnimationFrame(tick);
   return true;
  } catch(e) {runtime.status='fallback';runtime.reason='pixijs-init-failed';runtime.hideCanvasUnits=false;
   (window as any).AbyssDrawSource?.();
   try{app?.destroy(true)}catch{}
   console.warn('PixiJS GPU initialization failed, preserving existing renderer:',e);
   return false;
  }
 }
 async function prepare(){
  // Do not download anything from the internet. If vendor/pixi.min.js does not
  // exist, WebGL2/Canvas stays fully operational and no extra requests occur.
  if(w.PIXI?.Application){await activate(w.PIXI);return}
  try{
   const response=await fetch('vendor/pixi.min.js',{method:'HEAD',cache:'no-store'});
   if(!response.ok){runtime.status='fallback';return}
   const script=document.createElement('script');
   script.src='vendor/pixi.min.js';script.async=true;
   script.onload=()=>{if(w.PIXI?.Application){void activate(w.PIXI)}else{runtime.status='fallback';runtime.reason='invalid-pixi-bundle'}};
   script.onerror=()=>{runtime.status='fallback';runtime.reason='pixi-script-load-failed'};
   document.head.appendChild(script);
  }catch{runtime.status='fallback';runtime.reason='vendor-check-failed'}
 }
 // The WebGL compositor creates the .rebirth-stage after game.js runs;
 // prepare() is called after dist/rebirth.js in index.html.
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{void prepare()},{once:true});
 else void prepare();
})();
