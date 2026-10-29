/** REBIRTH v0.84 original deterministic 16-bit inspired atlas for sectors 2-5.
 * Only rendering: cannot mutate campaign, state or saves. */
(() => {
 type Kind='tile'|'building'|'rock';
 type Pal={floor:string;rim:string;crack:string;wall:string;dark:string;roof:string;shine:string;glow:string};
 const palettes:Pal[]=[
  {floor:'#3a5749',rim:'#779886',crack:'#16362f',wall:'#526f60',dark:'#132c2a',roof:'#203f36',shine:'#a1bda1',glow:'#b0ed96'},
  {floor:'#45435f',rim:'#8986b5',crack:'#211d43',wall:'#655d81',dark:'#231e44',roof:'#373052',shine:'#b8a7cf',glow:'#aa99e8'},
  {floor:'#514e4a',rim:'#9c9183',crack:'#222e32',wall:'#665f57',dark:'#24323b',roof:'#6b4e41',shine:'#cfb899',glow:'#e4b774'},
  {floor:'#6b506c',rim:'#bda0be',crack:'#30223e',wall:'#7e6987',dark:'#322440',roof:'#51415c',shine:'#e3c8db',glow:'#f0d2d5'}
 ];
 const cache=new Map<string,HTMLCanvasElement>();
 function create(sector:number,kind:Kind,variant:number,health:number){
  const s=Math.max(1,Math.min(4,sector|0)),v=((variant%8)+8)%8,hp=Math.max(0,health|0),key=[s,kind,v,hp].join(':');
  const old=cache.get(key);if(old)return old;
  const c=document.createElement('canvas');
  c.width=kind==='tile'?78:kind==='building'?92:74;
  c.height=kind==='tile'?48:kind==='building'?124:70;
  const g=c.getContext('2d');if(!g)throw Error('Sector atlas Canvas unavailable');
  g.imageSmoothingEnabled=false;const P=palettes[s-1];
  const r=(x:number,y:number,w:number,h:number,color:string)=>{g.fillStyle=color;g.fillRect(x,y,w,h)};
  const poly=(pts:number[][],color:string,border:string)=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=color;g.fill();g.strokeStyle=border;g.lineWidth=1;g.stroke()};
  if(kind==='tile'){
   poly([[39,1],[76,24],[39,47],[2,24]],P.floor,P.rim);
   poly([[4,25],[39,46],[74,25],[39,28]],P.dark,P.crack);
   for(let i=0;i<4;i++)r(13+(v*13+i*17)%53,13+(v*7+i*9)%23,3+i%2,1,i%2?P.shine:P.crack);
   if(s===1){r(27,15,13,2,P.crack);r(33,11,3,9,P.crack);r(52,27,3,3,P.glow)}
   if(s===2){r(21,22,11,2,P.crack);r(29,25,2,7,P.glow);r(46,14,8,2,P.shine)}
   if(s===3){r(17,24,44,2,P.roof);r(20,20,2,9,P.shine);r(33,17,3,15,P.dark);r(47,19,3,13,P.rim)}
   if(s===4){r(28,15,19,2,P.shine);r(35,18,2,13,P.crack);r(41,22,3,3,P.glow);r(24,30,5,2,P.rim)}
  }else if(kind==='building'){
   poly([[15,96],[44,111],[78,95],[48,80]],P.dark,P.rim);
   if(s===1){
    poly([[16,96],[21,45],[38,17],[49,48],[44,102]],P.wall,P.dark);
    poly([[44,102],[48,48],[71,33],[75,91]],P.roof,P.rim);
    for(let i=0;i<5;i++){r(15+i*11,47+i%2*8,4,43,P.dark);r(17+i*11,44+i%2*8,2,11,P.rim)}
    r(35,51,10,9,P.crack);r(38,54,4,3,P.glow);
   }else if(s===2){
    poly([[13,96],[20,38],[45,11],[48,100]],P.wall,P.rim);
    poly([[48,100],[45,11],[74,39],[79,94]],P.roof,P.dark);
    for(let i=0;i<5;i++){r(20+i*5,38+i*10,20,3,P.rim);r(47,32+i*11,19,2,P.shine)}
    r(35,62,13,21,P.dark);r(39,66,5,13,P.glow);
   }else if(s===3){
    poly([[18,96],[19,27],[67,27],[70,96]],P.wall,P.rim);
    poly([[15,29],[43,10],[72,29],[45,39]],P.roof,P.shine);
    r(27,44,11,22,P.dark);r(51,44,11,22,P.dark);r(30,47,5,9,P.glow);r(54,47,5,9,P.glow);
    r(42,12,4,18,P.dark);r(39,5,10,8,P.shine);
   }else{
    poly([[12,96],[16,38],[45,6],[73,38],[77,96]],P.wall,P.rim);
    poly([[43,6],[73,38],[77,96],[43,100]],P.roof,P.dark);
    for(let i=0;i<4;i++){r(20+i*13,47,5,46,P.dark);r(21+i*13,51,3,28,P.shine)}
    for(let i=0;i<8;i++){const a=i*Math.PI/4;r(43+Math.round(Math.cos(a)*9),45+Math.round(Math.sin(a)*9),3,3,P.glow)}
    r(40,40,8,8,P.dark);
   }
   if(hp<=1){r(57,68,11,6,P.dark);r(27,81,12,6,P.crack)}
   for(let i=0;i<Math.min(hp,3);i++)r(35+i*7,109,4,3,P.glow);
  }else{
   poly([[8,49],[17,23],[32,10],[55,23],[68,49],[35,60]],P.wall,P.rim);
   poly([[17,23],[32,10],[46,23],[31,41]],P.shine,P.dark);
   r(29,15,3,18,P.crack);r(38,30,2,14,P.glow);
  }
  cache.set(key,c);return c;
 }
 (window as any).AbyssSectorArt={version:'0.84',create,cacheSize:()=>cache.size,palettes};
})();
