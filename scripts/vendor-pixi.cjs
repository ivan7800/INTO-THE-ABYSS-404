/** Copy the official installed PixiJS v8 browser bundle for fully offline use.
 * Never download it at runtime. Version is pinned in package.json.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const entry=path.join(root,'node_modules','pixi.js','dist','pixi.min.js');
const dest=path.join(root,'vendor','pixi.min.js');
if(!fs.existsSync(entry)){
 console.error('No se encuentra PixiJS 8 instalado. Ejecuta: npm install (con conexión)');process.exit(1);
}
fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(entry,dest);
const license=path.join(root,'node_modules','pixi.js','LICENSE');
if(fs.existsSync(license))fs.copyFileSync(license,path.join(root,'vendor','PIXIJS-LICENSE.txt'));
const bytes=fs.statSync(dest).size;
if(bytes<10000){console.error('El bundle no parece válido.');process.exit(1)}
console.log(`PixiJS incorporado en vendor/pixi.min.js (${bytes} bytes). El juego ya es offline.`);
