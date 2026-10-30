#!/usr/bin/env python3
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from playwright.sync_api import sync_playwright
import threading,json
site=Path(__file__).resolve().parent/'_site'
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(site)))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
  page=browser.new_page(viewport={'width':1440,'height':1000})
  errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
  page.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='domcontentloaded')
  page.wait_for_function("AbyssPixi?.status==='active' && state.turn===1",timeout=25000)
  snare=page.evaluate("""() => {
    const u=state.units.find(u=>u.side==='ally'&&u.id===2);
    const e=state.units.find(u=>u.side==='enemy');
    u.shield=0;u.hp=u.max;e.type='weaver';
    state.intent=[{id:e.id,x:u.x,y:u.y,attack:'web',damage:1}];
    state.rifts=[];state.omen=null;state.resonance=null;
    const locked=JSON.stringify(state.intent);
    resolveEnemy();
    return {locked,turn:state.turn,moveBlocked:u.moved,entangled:u.entangled||false,hp:u.hp};
  }""")
  assert snare['turn']==2 and snare['moveBlocked'] and not snare['entangled'] and snare['hp']>0,snare
  page.reload(wait_until='domcontentloaded')
  page.wait_for_function("AbyssPixi?.status==='active' && state.turn===2",timeout=25000)
  assert page.evaluate("state.units.find(u=>u.side==='ally'&&u.id===2).moved")
  page.evaluate("() => {window.confirm=()=>true;fullRestart()}")
  page.wait_for_function("state.turn===1")
  seer=page.evaluate("""() => {
    const u=state.units.find(u=>u.side==='ally'&&u.id===2);
    const e=state.units.find(u=>u.side==='enemy');
    u.shield=2;u.hp=u.max;e.type='seer';
    state.intent=[{id:e.id,x:u.x,y:u.y,attack:'vision',damage:1}];
    state.rifts=[];state.omen=null;state.resonance=null;
    resolveEnemy();
    return {turn:state.turn,shield:u.shield,hp:u.hp};
  }""")
  assert seer['turn']==2 and seer['shield']==0 and seer['hp']>0,seer
  page.evaluate("() => {window.confirm=()=>true;fullRestart()}")
  page.wait_for_function("state.turn===1")
  rounds=[]
  for _ in range(3):
   if not page.locator('#end').is_enabled(): break
   page.locator('#end').click()
   rounds.append(page.evaluate("({turn:state.turn,phase:state.phase,integrity:state.integrity,corruption:state.corruption,turnsResolved:state.metrics.turnsResolved})"))
   if rounds[-1]['phase']!='player': break
  assert rounds and rounds[-1]['turnsResolved']==len(rounds),rounds
  assert all(0<=r['corruption']<=100 and r['integrity']>=0 for r in rounds),rounds
  assert not errors,errors
  print(json.dumps({'pass':True,'weaver':snare,'seer':seer,'rounds':rounds,'errors':errors}))
  browser.close()
finally:
 server.shutdown();server.server_close()
