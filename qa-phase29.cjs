const fs=require('fs'), assert=require('assert');
const game=fs.readFileSync('game.js','utf8'), environment=fs.readFileSync('environment-art.js','utf8'),pixel=fs.readFileSync('pixel-art.js','utf8');
assert.match(game,/ISO_W\s*=\s*78,\s*ISO_H\s*=\s*48/);
assert.match(game,/const TILE_RX\s*=\s*34,\s*TILE_RY\s*=\s*19/);
assert.match(game,/Math\.abs\(px\s*-\s*p\.x\)\s*\/\s*TILE_RX\s*\+\s*Math\.abs\(py\s*-\s*p\.y\)\s*\/\s*TILE_RY/);
assert.match(environment,/,66,36\)/);
assert.match(environment,/,52,92\)/);
assert.match(pixel,/width=boss\?52:44,height=boss\?72:61/);
// Verify tiles never overlap on the screen and all centres are inside the game viewport.
const cells=[];for(let x=0;x<8;x++)for(let y=0;y<8;y++)cells.push({x:320+(x-y)*39,y:155+(x+y)*24});
for(const cell of cells){assert(cell.x>=34&&cell.x<=606);assert(cell.y>=19&&cell.y<=621)}
for(let a=0;a<cells.length;a++)for(let b=a+1;b<cells.length;b++){
 const dx=Math.abs(cells[a].x-cells[b].x),dy=Math.abs(cells[a].y-cells[b].y);
 assert(dx/34+dy/19>2,'Tiles overlap');
}
console.log('Fase 29: geometry, hit test, atlas and sprites PASS');
