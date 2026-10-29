'use strict';
// Local-only zero-dependency fallback, stable origin preserving localStorage saves.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=__dirname,port=8765,base=`http://127.0.0.1:${port}/`,signature='INTO_THE_ABYSS_404_REBIRTH_v065';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'};
const open=()=>{if(process.env.ABYSS_NO_BROWSER==='1')return;try{const c=cp.spawn('xdg-open',[base],{detached:true,stdio:'ignore'});c.on('error',()=>{});c.unref()}catch{console.log('Abre manualmente: '+base)}};
const server=http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return}
 let name;try{name=decodeURIComponent(new URL(req.url,base).pathname)}catch{res.writeHead(400);res.end();return}
 if(name==='/__abyss_health') {const data=Buffer.from(signature);res.writeHead(200,{'Content-Type':'text/plain','Content-Length':data.length,'Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:data);return}
 if(name.includes('\0')||name.includes('\\')){res.writeHead(400);res.end();return}
 const filepath=path.resolve(root,'.'+name,(name.endsWith('/')?'index.html':''));
 if(filepath!==root&&!filepath.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 fs.realpath(filepath,(realErr,real)=>{
  if(realErr||!real.startsWith(root+path.sep)){res.writeHead(404);res.end('Not found');return}
  fs.stat(real,(err,st)=>{
   if(err||!st.isFile()){res.writeHead(404);res.end('Not found');return}
   res.writeHead(200,{'Content-Type':types[path.extname(real)]||'application/octet-stream','Content-Length':st.size,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY'});
   if(req.method==='HEAD')res.end();else fs.createReadStream(real).pipe(res);
  });
 });
});
server.listen(port,'127.0.0.1',()=>{console.log(`REBIRTH v0.65 — ${base}\nCtrl+C para salir`);open()});
server.on('error',err=>{
 if(err.code!=='EADDRINUSE'){console.error('Servidor:',err.message);process.exitCode=1;return}
 http.get(base+'__abyss_health',res=>{
  let data='';res.on('data',c=>data+=c);res.on('end',()=>{
   if(res.statusCode===200&&data===signature){console.log('Juego ya abierto: '+base);open()}
   else{console.error('ERROR: puerto 8765 ocupado por otro programa. No se cambia para preservar los guardados.');process.exitCode=2}
  });
 }).on('error',()=>{console.error('ERROR: puerto 8765 ocupado.');process.exitCode=2});
});
