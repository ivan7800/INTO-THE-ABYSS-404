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
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='domcontentloaded')
  page.wait_for_function("AbyssPixi?.status==='active' && state.turn===1",timeout=25000)
  before=page.evaluate("({corruption:state.corruption,shields:state.units.filter(u=>u.side==='ally').map(u=>u.shield||0)})")
  page.locator('#encounter-vigil').click()
  after=page.evaluate("({corruption:state.corruption,shields:state.units.filter(u=>u.side==='ally').map(u=>u.shield||0),mode:state.encounterMode,locked:state.encounterLocked})")
  assert after['corruption']==min(100,before['corruption']+15),after
  assert after['mode']=='vigil' and after['locked'],after
  assert all(a==b+1 for a,b in zip(after['shields'],before['shields'])),after
  assert page.locator('#encounter-vigil').is_disabled()
  page.locator('#end').click()
  page.wait_for_function("state.turn>1",timeout=12000)
  saved=page.evaluate("JSON.stringify({turn:state.turn,sector:campaign.sector,integrity:state.integrity,encounterMode:state.encounterMode})")
  page.reload(wait_until='domcontentloaded')
  page.wait_for_function("AbyssPixi?.status==='active' && state.turn>1",timeout=25000)
  assert saved==page.evaluate("JSON.stringify({turn:state.turn,sector:campaign.sector,integrity:state.integrity,encounterMode:state.encounterMode})")
  assert not errors,errors
  print(json.dumps({'pass':True,'vigil':after,'saveReload':True,'jsErrors':errors}))
  browser.close()
finally:
 server.shutdown();server.server_close()
