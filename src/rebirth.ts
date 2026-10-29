/** REBIRTH v0.50 — Offline WebGL2 atmospheric compositor.
 * Keeps original Canvas 2D tactical engine authoritative; never alters clicks or combat.
 * Pixel-preserving nearest-neighbour screen shader; recovers visibly on GPU loss.
 * PixiJS v8 uses a separate local-vendored adapter when its bundle is present.
 */
(() => {
 type Point={x:number;y:number};
 type Scene={corruption:number;sector:number;quality:'lite'|'full';lights:Point[]};
 type GPUApi={setScene:(value:Scene)=>void;status:()=>string;frames:()=>number;pause:()=>void};
 const source=document.querySelector<HTMLCanvasElement>('#game');if(!source)return;
 const output=document.createElement('canvas');output.id='rebirth-screen';
 output.width=source.width;output.height=source.height;output.setAttribute('aria-hidden','true');
 const stage=document.createElement('div');stage.className='rebirth-stage';
 source.parentElement?.insertBefore(stage,source);stage.append(source,output);
 source.classList.add('rebirth-source');
 const api:GPUApi={setScene:s=>{scene={corruption:Math.max(0,Math.min(100,s.corruption)),sector:s.sector,quality:s.quality,lights:s.lights.slice(0,3)}},status:()=>status,frames:()=>frames,pause:()=>{suspended=true;status='pixijs-delegated'}};
 (window as Window & {AbyssGPU?:GPUApi}).AbyssGPU=api;
 let scene:Scene={corruption:0,sector:0,quality:'full',lights:[]};
 let status='initializing';let frames=0;let suspended=false;
 const gpuLabel=document.createElement('span');gpuLabel.className='gpu-label';gpuLabel.setAttribute('aria-label','Motor gráfico activo');document.querySelector('.quality-bar')?.appendChild(gpuLabel);
 const paintStatus=(message:string)=>{gpuLabel.textContent=message};
 paintStatus('RENDER · INICIANDO');
 const fallback=(reason:string)=>{status=reason;output.remove();source.classList.remove('rebirth-source');document.body.dataset.rebirth='canvas-fallback';document.body.dataset.gpuReason=reason;paintStatus('CANVAS 2D · COMPATIBLE')};
 let gl:WebGL2RenderingContext|null=null;
 try{gl=output.getContext('webgl2',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false});}catch{}
 if(!gl){fallback('webgl2-unavailable');return}
 const gpu=gl;const inputCanvas=source;
 const vertex=`#version 300 es
 precision mediump float;
 in vec2 a;out vec2 uv;
 void main(){uv=(a+1.)*.5;gl_Position=vec4(a,0.,1.);}`;
 const fragment=`#version 300 es
 precision highp float;
 in vec2 uv;out vec4 frag;
 uniform sampler2D tex;uniform float time;uniform float strength;
 uniform float corruption;uniform float sector;
 uniform vec3 lights[3];uniform float lighting;
 float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 void main(){
  vec2 p=uv;
  vec3 c=texture(tex,p).rgb;
  float edge=length((p-.5)*vec2(1.55));
  float vignette=1.-.29*pow(edge,1.7);
  // Per-sector grading is subtle; the 8x8 tactical telegraphs keep their hue.
  vec3 grade=sector<.5?vec3(.86,1.02,1.05):sector<1.5?vec3(.91,1.05,.9):sector<2.5?vec3(.98,.91,1.07):sector<3.5?vec3(.96,.99,1.01):vec3(1.06,.90,1.02);
  float darkFactor=smoothstep(.30,.04,dot(c,vec3(.2126,.7152,.0722)));
  c=mix(c,c*grade,strength*(.09+darkFactor*.12));
  // Soft green / violet rift halos, lighting only on dim pixels.
  vec3 emission=vec3(0.);
  for(int i=0;i<3;i++){
   float power=lights[i].z;
   float d=length((p-lights[i].xy)*vec2(1.,1.));
   float v=exp(-d*d*170.)*power;
   emission+=v*vec3(.14,.34,.29);
  }
  c+=emission*strength*lighting*(.28+.45*darkFactor);
  float haze=pow(max(0.,p.y-.18),2.)*(.08+.03*sin(p.x*11.+time*.14));
  c+=vec3(.018,.04,.055)*haze*strength;
  // Distortion only at extreme corruption; low amplitude avoids moving tile coordinates.
  float corrupt=clamp(corruption*.01,0.,1.);
  c=mix(c,c*vec3(1.04,.90,1.03),strength*corrupt*.11);
  float grain=(noise(floor(p*vec2(640.))+floor(time*6.))-.5)*.016*strength;
  c=c*vignette+grain;
  frag=vec4(clamp(c,0.,1.),1.);
 }`;
 const shader=(type:number,code:string)=>{
  const s=gpu.createShader(type);if(!s)throw Error('shader allocation');gpu.shaderSource(s,code);gpu.compileShader(s);
  if(!gpu.getShaderParameter(s,gpu.COMPILE_STATUS))throw Error(String(gpu.getShaderInfoLog(s)));return s;
 };
 let program:WebGLProgram|null=null;
 try{
  program=gpu.createProgram();if(!program)throw Error('program allocation');
  gpu.attachShader(program,shader(gpu.VERTEX_SHADER,vertex));gpu.attachShader(program,shader(gpu.FRAGMENT_SHADER,fragment));gpu.linkProgram(program);
  if(!gpu.getProgramParameter(program,gpu.LINK_STATUS))throw Error(String(gpu.getProgramInfoLog(program)));
 }catch(e){console.warn('REBIRTH WebGL compilation:',e);fallback('shader-error');return}
 const buf=gpu.createBuffer();const texture=gpu.createTexture();if(!buf||!texture){fallback('gpu-allocation-error');return}
 gpu.bindBuffer(gpu.ARRAY_BUFFER,buf);gpu.bufferData(gpu.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gpu.STATIC_DRAW);
 gpu.useProgram(program);const loc=gpu.getAttribLocation(program,'a');gpu.enableVertexAttribArray(loc);gpu.vertexAttribPointer(loc,2,gpu.FLOAT,false,0,0);
 gpu.activeTexture(gpu.TEXTURE0);gpu.bindTexture(gpu.TEXTURE_2D,texture);
 gpu.texParameteri(gpu.TEXTURE_2D,gpu.TEXTURE_MIN_FILTER,gpu.NEAREST);
 gpu.texParameteri(gpu.TEXTURE_2D,gpu.TEXTURE_MAG_FILTER,gpu.NEAREST);
 gpu.texParameteri(gpu.TEXTURE_2D,gpu.TEXTURE_WRAP_S,gpu.CLAMP_TO_EDGE);
 gpu.texParameteri(gpu.TEXTURE_2D,gpu.TEXTURE_WRAP_T,gpu.CLAMP_TO_EDGE);
 gpu.pixelStorei(gpu.UNPACK_FLIP_Y_WEBGL,1);
 gpu.texImage2D(gpu.TEXTURE_2D,0,gpu.RGBA,output.width,output.height,0,gpu.RGBA,gpu.UNSIGNED_BYTE,null);
 const uniform=(name:string)=>gpu.getUniformLocation(program!,name);
 const timeLoc=uniform('time'),strengthLoc=uniform('strength'),corruptionLoc=uniform('corruption'),sectorLoc=uniform('sector'),lightsLoc=uniform('lights[0]'),lightingLoc=uniform('lighting');
 gpu.uniform1i(uniform('tex'),0);
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 let active=true;let last=-Infinity;
 output.addEventListener('webglcontextlost',ev=>{ev.preventDefault();active=false;fallback('context-lost')});
 document.body.dataset.rebirth='webgl2';status='webgl2';paintStatus('WEBGL2 · GPU');
 function tick(now:number){
  if(!active||suspended)return;
  requestAnimationFrame(tick);
  if(document.hidden)return;
  // Do not upload a 640x640 texture at the monitor refresh rate when Canvas paints 30/15 fps.
  const interval=scene.quality==='lite'||reduced.matches?66:32;
  if(now-last<interval)return;
  last=now;
  try{
   gpu.viewport(0,0,output.width,output.height);
   gpu.activeTexture(gpu.TEXTURE0);gpu.bindTexture(gpu.TEXTURE_2D,texture);
   gpu.texSubImage2D(gpu.TEXTURE_2D,0,0,0,gpu.RGBA,gpu.UNSIGNED_BYTE,inputCanvas);
   gpu.uniform1f(timeLoc,now/1000);
   gpu.uniform1f(strengthLoc,scene.quality==='lite'||reduced.matches?.38:.9);
   gpu.uniform1f(corruptionLoc,scene.corruption);
   gpu.uniform1f(sectorLoc,scene.sector);
   gpu.uniform1f(lightingLoc,reduced.matches?0:1);
   const points=new Float32Array(9);
   scene.lights.forEach((p,i)=>{points[i*3]=p.x/output.width;points[i*3+1]=1-p.y/output.height;points[i*3+2]=1});
   gpu.uniform3fv(lightsLoc,points);
   gpu.drawArrays(gpu.TRIANGLES,0,6);
   if(gpu.getError()!==gpu.NO_ERROR)throw Error('WebGL runtime error');
   frames++;
  }catch(e){console.warn('REBIRTH WebGL fallback:',e);active=false;fallback('runtime-error')}
 }
 requestAnimationFrame(tick);
})();
