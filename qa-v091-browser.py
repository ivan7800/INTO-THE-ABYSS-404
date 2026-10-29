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
  page.locator('#encounter-recovery').click()
  page.wait_for_function("state.encounterMode==='recovery'")
  initial=page.evaluate("({deadline:state.recovery.deadline,shields:state.units.filter(u=>u.side==='ally').map(u=>u.shield||0),phase:state.phase})")
  assert initial['deadline']==4 and initial['phase']=='player',initial
  assert page.locator('#encounter-recovery').is_disabled()
  # Simulate a legal rescue at the objective, testing reward and no duplication.
  awarded=page.evaluate("""() => {
    const u=state.units.find(u=>u.side==='ally'&&u.hp>0),o=state.objective;
    const before=state.units.filter(u=>u.side==='ally').map(u=>u.shield||0);
    u.x=o.x;u.y=o.y;checkObjective();checkObjective();
    const after=state.units.filter(u=>u.side==='ally').map(u=>u.shield||0);
    render();return {before,after,complete:state.objectiveDone,recovery:state.recovery};
  }""")
  assert awarded['complete'] and awarded['recovery']['success'],awarded
  assert all(a==b+1 for a,b in zip(awarded['after'],awarded['before'])),awarded
  saved=page.evaluate("JSON.stringify({turn:state.turn,sector:campaign.sector,mode:state.encounterMode,recovery:state.recovery})")
  page.reload(wait_until='domcontentloaded')
  page.wait_for_function("AbyssPixi?.status==='active'",timeout=25000)
  assert saved==page.evaluate("JSON.stringify({turn:state.turn,sector:campaign.sector,mode:state.encounterMode,recovery:state.recovery})")
  assert not errors,errors
  print(json.dumps({'pass':True,'reward':awarded,'saveReload':True,'jsErrors':errors}))
  browser.close()
finally:
 server.shutdown();server.server_close()
