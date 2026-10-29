#!/usr/bin/env python3
"""Run on CI's actual PixiJS 8.19.0 distribution and HTTP server."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from playwright.sync_api import sync_playwright
import threading,json
root=Path(__file__).resolve().parent
site=root/'_site'
assert (site/'vendor/pixi.min.js').stat().st_size>100000
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(site)))
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
  page=browser.new_page(viewport={'width':1440,'height':1000})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='domcontentloaded')
  page.wait_for_function("typeof state !== 'undefined' && state.turn>=1")
  page.wait_for_function("window.AbyssPixi?.status==='active' && window.AbyssPixi?.nativeUnits>=3",timeout=20000)
  before=page.evaluate("JSON.stringify({turn:state.turn,sector:campaign.sector,integrity:state.integrity})")
  obj=page.evaluate("({pixi:window.AbyssPixi.status,units:window.AbyssPixi.nativeUnits,objects:window.AbyssPixi.nativeObjects,tiles:window.AbyssPixi.nativeTiles,hidden:window.AbyssPixi.hideCanvasUnits,renderer:document.body.dataset.rebirth})")
  assert obj['units']>=3 and obj['objects']>65 and obj['tiles']==64 and obj['hidden']
  assert obj['renderer']=='pixijs-webgl',obj
  page.locator('#end').click()
  page.wait_for_timeout(200)
  saved=page.evaluate("JSON.stringify({turn:state.turn,sector:campaign.sector,integrity:state.integrity})")
  page.reload(wait_until='domcontentloaded')
  page.wait_for_function("typeof state !== 'undefined' && state.turn>=1")
  page.wait_for_function("window.AbyssPixi?.status==='active' && window.AbyssPixi?.nativeUnits>=3",timeout=20000)
  assert page.evaluate("JSON.stringify({turn:state.turn,sector:campaign.sector,integrity:state.integrity})")==saved
  assert not errors,errors
  print(json.dumps({'pass':True,'pixi':obj,'saveReload':True,'js_errors':errors}))
  browser.close()
finally:
 server.shutdown();server.server_close()
