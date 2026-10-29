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
  page.wait_for_function("window.AbyssPixi?.status==='active' && window.AbyssPixi?.monsterSprites>=1",timeout=25000)
  before=page.evaluate("({units:AbyssPixi.nativeUnits,monsters:AbyssPixi.monsterSprites,turn:state.turn})")
  assert before['monsters']>=1,before
  page.locator('#end').click()
  page.wait_for_function("state.turn>1",timeout=12000)
  page.wait_for_function("AbyssPixi.attackAnimations>=1",timeout=12000)
  result=page.evaluate("({attacks:AbyssPixi.attackAnimations,monsters:AbyssPixi.monsterSprites,turn:state.turn})")
  assert result['attacks']>=1,result
  saved=page.evaluate("JSON.stringify({turn:state.turn,sector:campaign.sector,integrity:state.integrity})")
  page.reload(wait_until='domcontentloaded')
  page.wait_for_function("window.AbyssPixi?.status==='active' && window.AbyssPixi?.monsterSprites>=1",timeout=25000)
  assert saved==page.evaluate("JSON.stringify({turn:state.turn,sector:campaign.sector,integrity:state.integrity})")
  assert not errors,errors
  print(json.dumps({'pass':True,'scene':result,'saveReload':True,'errors':errors}))
  browser.close()
finally:
 server.shutdown();server.server_close()
