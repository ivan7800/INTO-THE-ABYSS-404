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
  before=page.evaluate("({shields:state.units.filter(u=>u.side==='ally').map(u=>u.shield||0),intent:JSON.stringify(state.intent)})")
  page.locator('#defensiveStance').click()
  after=page.evaluate("({shields:state.units.filter(u=>u.side==='ally').map(u=>u.shield||0),acted:state.units.find(u=>u.id===state.selected).acted,intent:JSON.stringify(state.intent),decisions:state.metrics.decisions})")
  assert after['acted'] and after['decisions']==1 and after['intent']==before['intent'],after
  assert after['shields'][0]==min(2,before['shields'][0]+1)
  assert page.locator('#defensiveStance').is_disabled()
  assert not page.evaluate("defensiveStance()")
  saved=page.evaluate("JSON.stringify({turn:state.turn,sector:campaign.sector,units:state.units.map(u=>({id:u.id,shield:u.shield||0,acted:u.acted||false}))})")
  page.reload(wait_until='domcontentloaded')
  page.wait_for_function("AbyssPixi?.status==='active' && state.turn===1",timeout=25000)
  assert saved==page.evaluate("JSON.stringify({turn:state.turn,sector:campaign.sector,units:state.units.map(u=>({id:u.id,shield:u.shield||0,acted:u.acted||false}))})")
  assert page.locator('#defensiveStance').is_disabled()
  assert not errors,errors
  print(json.dumps({'pass':True,'stance':after,'saveReload':True,'jsErrors':errors}))
  browser.close()
finally:
 server.shutdown();server.server_close()
