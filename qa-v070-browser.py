#!/usr/bin/env python3
"""CI verifies the genuine, offline-vendored PixiJS browser build over HTTP."""
import json, threading, time
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent
site=root/'_site'
assert (site/'vendor/pixi.min.js').stat().st_size>100000
handler=partial(SimpleHTTPRequestHandler,directory=str(site))
server=ThreadingHTTPServer(('127.0.0.1',0),handler)
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
base=f'http://127.0.0.1:{server.server_port}/'
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
  page=browser.new_page(viewport={'width':1440,'height':1050},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base,wait_until='domcontentloaded',timeout=30000)
  page.wait_for_function("typeof state!=='undefined' && state.turn>=1")
  page.wait_for_function("window.AbyssPixi && window.AbyssPixi.status !== 'pending'",timeout=18000)
  pixi=page.evaluate("({status:window.AbyssPixi.status,reason:window.AbyssPixi.reason,objects:window.AbyssPixi.nativeObjects,renderer:document.body.dataset.rebirth,frames:window.AbyssPixi.frames,official:!!window.PIXI?.Application})")
  assert pixi['official'],pixi
  assert pixi['status']=='active',pixi
  assert pixi['objects']>=1,pixi
  page.locator('#end').click()
  before=page.evaluate("JSON.stringify({turn:state.turn,integrity:state.integrity,sector:campaign.sector})")
  page.reload(wait_until='domcontentloaded')
  page.wait_for_function("typeof state!=='undefined' && state.turn>=1")
  after=page.evaluate("JSON.stringify({turn:state.turn,integrity:state.integrity,sector:campaign.sector})")
  assert before==after,(before,after)
  assert not errors,errors
  print(json.dumps({'pass':True,'pixi':pixi,'save_reload':True,'js_errors':errors}))
  browser.close()
finally:
 server.shutdown();server.server_close()
