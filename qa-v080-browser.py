#!/usr/bin/env python3
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from playwright.sync_api import sync_playwright
import threading,json
root=Path(__file__).resolve().parent;site=root/'_site'
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(site)))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
  page=browser.new_page(viewport={'width':1440,'height':1000})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='domcontentloaded')
  page.wait_for_function("window.AbyssPixi?.status==='active' && window.AbyssPixi?.nativeBuildings>=4",timeout=25000)
  scene=page.evaluate("({active:window.AbyssPixi.status,buildings:window.AbyssPixi.nativeBuildings,tiles:window.AbyssPixi.nativeTiles,atlas:window.AbyssPixi.portAtlas,hide:window.AbyssPixi.hideCanvasPort,units:window.AbyssPixi.nativeUnits})")
  assert scene['tiles']==64 and scene['buildings']>=4 and scene['atlas']>=4 and scene['hide'] and scene['units']>=3,scene
  page.locator('#end').click();page.wait_for_timeout(200)
  before=page.evaluate("JSON.stringify({turn:state.turn,sector:campaign.sector,integrity:state.integrity})")
  page.reload(wait_until='domcontentloaded')
  page.wait_for_function("window.AbyssPixi?.status==='active' && window.AbyssPixi?.nativeBuildings>=4",timeout=25000)
  after=page.evaluate("JSON.stringify({turn:state.turn,sector:campaign.sector,integrity:state.integrity})")
  assert before==after,(before,after)
  assert not errors,errors
  print(json.dumps({'pass':True,'scene':scene,'saveReload':True,'pageErrors':errors}))
  browser.close()
finally:
 server.shutdown();server.server_close()
