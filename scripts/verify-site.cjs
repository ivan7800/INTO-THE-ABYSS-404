'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..','_site'),mf=JSON.parse(fs.readFileSync(path.join(root,'build-manifest.json'),'utf8'));
for(const [rel,sum] of Object.entries(mf.files)){
 const file=path.resolve(root,rel);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file))throw Error('Unsafe path '+rel);
 if(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==sum)throw Error('Bad hash '+rel);
}
for(const rel of ['vendor/pixi.min.js','vendor/PIXIJS-LICENSE.txt'])if(!mf.files[rel])throw Error('PixiJS missing: '+rel);
for(const rel of ['src/game.ts','package.json','launch-local.py','.github/workflows/ci.yml'])if(fs.existsSync(path.join(root,rel)))throw Error('Source leak '+rel);
console.log('PASS verified '+Object.keys(mf.files).length+' site files');
