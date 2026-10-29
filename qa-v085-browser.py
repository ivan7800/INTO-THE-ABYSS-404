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
  page.wait_for_function("typeof AbyssSoundscape?.status==='function' && AbyssPixi?.status==='active'",timeout=25000)
  assert not page.evaluate("AbyssSoundscape.status().enabled")
  page.locator('#sound').click()
  page.wait_for_function("AbyssSoundscape.status().enabled",timeout=10000)
  first=page.evaluate("AbyssSoundscape.status()")
  assert first['voices']==3 and first['available'],first
  page.locator('#end').click()
  page.wait_for_function("state.turn>1",timeout=12000)
  assert page.evaluate("AbyssSoundscape.status().notes")>=2
  page.locator('#sound').click()
  page.wait_for_function("!AbyssSoundscape.status().enabled")
  assert page.evaluate("AbyssSoundscape.status().voices")==0
  saved=page.evaluate("JSON.stringify({turn:state.turn,sector:campaign.sector,integrity:state.integrity})")
  page.reload(wait_until='domcontentloaded')
  page.wait_for_function("AbyssPixi?.status==='active'",timeout=25000)
  assert saved==page.evaluate("JSON.stringify({turn:state.turn,sector:campaign.sector,integrity:state.integrity})")
  assert not page.evaluate("AbyssSoundscape.status().enabled")
  assert not errors,errors
  print(json.dumps({'pass':True,'sound':first,'mutedAfterReload':True,'saveReload':True,'errors':errors}))
  browser.close()
finally:
 server.shutdown();server.server_close()
