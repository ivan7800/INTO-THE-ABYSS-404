#!/usr/bin/env python3
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from playwright.sync_api import sync_playwright
import threading,json
site=Path(__file__).resolve().parent/'_site'
srv=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(site)))
threading.Thread(target=srv.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
  page=browser.new_page(viewport={'width':1440,'height':1000})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  url=f'http://127.0.0.1:{srv.server_port}/'
  page.goto(url,wait_until='domcontentloaded')
  page.wait_for_function("window.AbyssPixi?.status==='active' && state.turn===1",timeout=25000)
  page.locator('#encounter-containment').click()
  assert page.evaluate("state.encounterMode==='containment'")
  contained=page.evaluate("""() => {
    state.objectiveDone=true;state.rifts=state.rifts.slice(0,1);
    checkEnd();render();
    return {phase:state.phase,done:state.missionOrder.completed,rifts:state.rifts.length};
  }""")
  assert contained['phase']=='won' and contained['done'] and contained['rifts']==1,contained
  page.reload(wait_until='domcontentloaded')
  page.wait_for_function("window.AbyssPixi?.status==='active'",timeout=25000)
  assert page.evaluate("state.phase==='won' && state.missionOrder.completed")
  # Reset via explicit game restart; deterministic test-only state injection for resolution.
  page.evaluate("() => {window.confirm=()=>true;fullRestart();}")
  page.wait_for_function("state.turn===1 && state.phase==='player'")
  page.locator('#encounter-defense').click()
  defended=page.evaluate("""() => {
    state.intent=[];state.omen=null;state.resonance=null;state.rifts=[];
    state.turn=3;state.metrics.turnsResolved=2;state.integrity=state.maxIntegrity;
    resolveEnemy();return {phase:state.phase,done:state.missionOrder.completed,turns:state.metrics.turnsResolved};
  }""")
  assert defended['phase']=='won' and defended['done'] and defended['turns']==3,defended
  assert not errors,errors
  print(json.dumps({'pass':True,'containment':contained,'defense':defended,'jsErrors':errors}))
  browser.close()
finally:
 srv.shutdown();srv.server_close()
