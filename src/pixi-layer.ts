/** PixiJS v8 display adapter: GPU presentation of the unchanged, authoritative
 * tactical canvas. It can be enabled OFFLINE by running `npm run vendor:pixi`.
 * IMPORTANT: this is a genuine PixiJS Application/Sprite/TextureSource path,
 * not a homemade renderer masquerading as PixiJS. No external CDN is required.
 */
(() => {
 type PixiGlobal={Application:new()=>any;Sprite:new(texture:any)=>any;Graphics?:new()=>any;Texture:{from:(src:HTMLCanvasElement)=>any}};
 type Scene={corruption:number;sector:number;quality:'lite'|'full';lights:{x:number;y:number}[]};
 const runtime={status:'pending',frames:0,reason:'bundle-unavailable',engineVersion:'8.19.0',nativeObjects:0};
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
    event.preventDefault();runtime.status='fallback';runtime.reason='webglcontextlost';
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
   let previous=-Infinity;
   const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
   function tick(now:number){
    if(runtime.status!=='active')return;
    requestAnimationFrame(tick);
    if(document.hidden||now-previous<(reduced?66:32))return;
    previous=now;
    try{texture.source.update();runtime.frames++}
    catch(e){runtime.status='fallback';runtime.reason='texture-upload-failed';
      output.remove();canvas.classList.remove('rebirth-source');document.body.dataset.rebirth='canvas-fallback';
      const label=document.querySelector('.gpu-label');if(label)label.textContent='CANVAS 2D · COMPATIBLE';
      console.warn('PixiJS texture update failed:',e);try{app.destroy(true)}catch{}}
   }
   requestAnimationFrame(tick);
   return true;
  } catch(e) {runtime.status='fallback';runtime.reason='pixijs-init-failed';
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
