#!/usr/bin/env python3
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from playwright.sync_api import sync_playwright
import threading,json
root=Path(__file__).resolve().parent
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root/'_site')))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
  page=browser.new_page(viewport={'width':1440,'height':1000})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='domcontentloaded')
  page.wait_for_function("window.AbyssPixi?.status==='active' && window.AbyssPixi?.portProps>=9",timeout=25000)
  scene=page.evaluate("({status:AbyssPixi.status,props:AbyssPixi.portProps,buildings:AbyssPixi.nativeBuildings,tiles:AbyssPixi.nativeTiles,atlas:AbyssPixi.portAtlas,units:AbyssPixi.nativeUnits})")
  assert scene['props']==9 and scene['tiles']==64 and scene['buildings']>=4 and scene['atlas']>=8 and scene['units']>=3,scene
  page.locator('#end').click()
  saved=page.evaluate("JSON.stringify({turn:state.turn,sector:campaign.sector,integrity:state.integrity})")
  page.reload(wait_until='domcontentloaded')
  page.wait_for_function("window.AbyssPixi?.status==='active' && window.AbyssPixi?.portProps>=9",timeout=25000)
  assert page.evaluate("JSON.stringify({turn:state.turn,sector:campaign.sector,integrity:state.integrity})")==saved
  assert not errors,errors
  print(json.dumps({'pass':True,'scene':scene,'saveReload':True,'js_errors':errors}))
  browser.close()
finally:
 server.shutdown();server.server_close()
