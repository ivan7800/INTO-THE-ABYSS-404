'use strict';
const cp=require('node:child_process'), fs=require('node:fs'), path=require('node:path');
const root=path.resolve(__dirname,'..');
cp.execFileSync('tsc',['-p','tsconfig.game.json'],{cwd:root,stdio:'inherit'});
const tactics=fs.readFileSync(path.join(root,'build-tmp','tactics.js'),'utf8');
const game=fs.readFileSync(path.join(root,'build-tmp','game.js'),'utf8');
fs.writeFileSync(path.join(root,'game.js'),`/* GENERATED — source: src/tactics.ts + src/game.ts. Do not edit here. */\n${tactics}\n${game}`);
console.log('Build: game.js from typed TypeScript tactical rules + migrated gameplay.');
