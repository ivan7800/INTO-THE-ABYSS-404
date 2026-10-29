/** INTO THE ABYSS 404 — REBIRTH v0.55
 * Type-checked, deterministic tactical rules. No DOM, Canvas, clock or storage.
 * Grid and combat forecasts are pure and may run in Node or any browser.
 */
namespace AbyssTactics {
  export const BOARD_SIZE = 8;
  export interface Cell { x:number; y:number }
  export interface Building extends Cell { hp:number; kind?:'building' }
  export interface Unit extends Cell { id:number; hp:number; side:'ally'|'enemy'; type:string; range?:number; name?:string; max?:number; shield?:number; pilot?:string; moved?:boolean; acted?:boolean }
  export type Attack='anchor'|'drain'|'beam'|'corrupt'|'chorus'|'rupture'|'cataclysm'|'web'|'vision'|'claw';
  export interface Intent extends Cell { id:number; attack:Attack; damage:number }
  export interface TacticalState { units:Unit[]; buildings:Building[]; rocks:Cell[]; rifts:Cell[]; intent:Intent[]; turn:number }
  export interface Omen extends Cell { type:'fracture'|'surge' }
  export interface Resonance extends Cell { source:number }
  export const DIRECTIONS:ReadonlyArray<readonly [number,number]> = [[0,-1],[1,0],[0,1],[-1,0]];
  export function inside(x:number,y:number,size=BOARD_SIZE):boolean {return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<size&&y>=0&&y<size}
  export function distance(a:Cell,b:Cell):number{return Math.abs(a.x-b.x)+Math.abs(a.y-b.y)}
  export function cellKey(x:number,y:number):string{return `${x},${y}`}
  export function occupied(s:Pick<TacticalState,'units'|'buildings'|'rocks'>,x:number,y:number):boolean {
    return s.units.some(u=>u.hp>0&&u.x===x&&u.y===y)||s.buildings.some(b=>b.hp>0&&b.x===x&&b.y===y)||s.rocks.some(r=>r.x===x&&r.y===y)
  }
  /** BFS ensures orthogonal reachability, avoids all occupied cells, and excludes the starting tile. */
  export function reachable(s:Pick<TacticalState,'units'|'buildings'|'rocks'>,u:Unit,size=BOARD_SIZE):Map<string,number> {
    const range=Math.max(0,Math.floor(u.range??0));
    const found=new Map<string,number>([[cellKey(u.x,u.y),0]]);
    const queue:{x:number;y:number;d:number}[]=[{x:u.x,y:u.y,d:0}];
    for(let i=0;i<queue.length;i++){
      const p=queue[i];if(p.d>=range)continue;
      for(const [dx,dy] of DIRECTIONS){const x=p.x+dx,y=p.y+dy,k=cellKey(x,y);
        if(!inside(x,y,size)||found.has(k)||occupied(s,x,y))continue;
        found.set(k,p.d+1);queue.push({x,y,d:p.d+1});
      }
    }
    found.delete(cellKey(u.x,u.y));return found;
  }
  /** Original threat priorities preserved. Intent is locked for the entire enemy phase. */
  export function intentFor(e:Unit,s:Pick<TacticalState,'units'|'buildings'|'intent'>):Intent|null {
    const candidates:(Cell&{hp:number;kind:'building'|'unit'})[]=[
      ...s.buildings.filter(b=>b.hp>0).map(b=>({...b,kind:'building' as const})),
      ...s.units.filter(u=>u.side==='ally'&&u.hp>0).map(u=>({...u,kind:'unit' as const}))
    ];
    if(!candidates.length)return null;
    const danger=(p:Cell)=>s.intent.some(i=>i.x===p.x&&i.y===p.y)?1:0;
    const score=(t:(typeof candidates)[number])=>distance(e,t)*10+(t.kind==='building'?45:0)+(t.hp===1?-3:0)+danger(t)*5;
    candidates.sort((a,b)=>score(a)-score(b)||a.y-b.y||a.x-b.x);
    const target=candidates[0];
    const attack:Attack=e.type==='anchor'?'anchor':e.type==='stalker'?'drain':e.type==='vig'?'beam':e.type==='lar'?'corrupt':e.type==='herald'?'chorus':e.type==='boss'?'rupture':e.type==='leviathan'?(e.hp<=6?'cataclysm':'rupture'):e.type==='weaver'?'web':e.type==='seer'?'vision':'claw';
    let x=target.x,y=target.y;
    if(e.type==='eng'&&distance(e,target)>1){
      const options=DIRECTIONS.map(([dx,dy])=>({x:e.x+dx,y:e.y+dy})).filter(p=>inside(p.x,p.y));
      options.sort((a,b)=>distance(a,target)-distance(b,target));
      if(options[0]){x=options[0].x;y=options[0].y}
    }
    return {id:e.id,x,y,attack,damage:['vig','boss','leviathan'].includes(e.type)?2:1};
  }
  export function omenFor(turn:number,sector:number):Omen|null {
    if(turn<2)return null;
    const locations:Cell[]=[{x:2,y:5},{x:6,y:5},{x:1,y:4},{x:5,y:5},{x:2,y:2},{x:6,y:4}];
    return {...locations[(turn+sector*2-2)%locations.length],type:turn%2===0?'fracture':'surge'};
  }
  export function resonanceFor(s:Pick<TacticalState,'units'|'rifts'|'turn'>):Resonance|null {
    if(s.turn<2)return null;
    const sources=s.units.filter(u=>u.side==='enemy'&&u.hp>0&&['anchor','weaver','seer','leviathan'].includes(u.type)).sort((a,b)=>a.id-b.id);
    for(const source of sources){
      const rifts=s.rifts.filter(r=>distance(r,source)<=3).sort((a,b)=>distance(a,source)-distance(b,source)||a.y-b.y||a.x-b.x);
      if(rifts.length)return {source:source.id,x:rifts[0].x,y:rifts[0].y};
    }
    return null;
  }
  export function legalAttack(u:Unit,target:Cell,targetUnit?:Unit|null,building?:Building|null,hasRift=false,purify=false):boolean {
    const d=distance(u,target);if(u.type==='pen')return d===1&&targetUnit?.side==='enemy';
    if(d<1||d>3+((u as Unit&{attackBonus?:number}).attackBonus??0))return false;
    if(u.type==='her')return !(targetUnit?.side==='ally'||building);
    if(u.type==='viu')return targetUnit?.side==='enemy'||(purify&&hasRift);
    return false;
  }
  /** Returns damage actually dealt. Caller handles shields, side effects, event log and metrics. */
  export function clampDamage(currentHP:number,amount:number):number {
    return Math.min(Math.max(0,currentHP),Math.max(0,amount));
  }
  export function corrupt(current:number,delta:number):number {return Math.min(100,Math.max(0,current+delta))}
}
