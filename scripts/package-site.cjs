'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),dest=path.join(root,'_site');
const primary=['index.html','style.css','rebirth.css','game.js','environment-art.js','pixel-art.js','.nojekyll'];
const scripts=['art','creatures','bestiary','cinematics','atmosphere','weather','panorama','guidance','rebirth','pixi-layer'].map(n=>'dist/'+n+'.js');
const vendor=['vendor/pixi.min.js','vendor/PIXIJS-LICENSE.txt'];
const all=[...primary,...scripts,...vendor];
for(const rel of all){
 const src=path.join(root,rel);if(!fs.existsSync(src))throw Error('Missing public file '+rel);
 const dst=path.join(dest,rel);fs.mkdirSync(path.dirname(dst),{recursive:true});
 if(rel===all[0])fs.rmSync(dest,{recursive:true,force:true}),fs.mkdirSync(dest,{recursive:true});
 fs.copyFileSync(src,dst);
}
const manifest={version:require('../package.json').version,files:{}};
for(const rel of all)manifest.files[rel]=crypto.createHash('sha256').update(fs.readFileSync(path.join(dest,rel))).digest('hex');
const html=fs.readFileSync(path.join(dest,'index.html'),'utf8');
for(const m of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/g)){
 const rel=m[1];if(/^(?:https?:)?\/\//.test(rel)||!fs.existsSync(path.join(dest,rel)))throw Error('Unsafe or missing HTML asset '+rel);
}
fs.writeFileSync(path.join(dest,'build-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('PASS packaged '+all.length+' assets, PixiJS official required');
