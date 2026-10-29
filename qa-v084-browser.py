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
  page.wait_for_function("window.AbyssPixi?.status==='active'",timeout=25000)
  result=page.evaluate("""() => {
   const a=window.AbyssSectorArt;
   const hashes=[];
   for(let s=1;s<=4;s++){
    const c=a.create(s,'tile',2,0);
    let h=0;for(const b of c.getContext('2d').getImageData(0,0,c.width,c.height).data)h=(Math.imul(h,31)+b)>>>0;
    hashes.push(h);
   }
   return {hashes,nativeBiomes:AbyssPixi.nativeBiomes,tiles:AbyssPixi.nativeTiles};
  }""")
  assert len(set(result['hashes']))==4,result
  assert result['nativeBiomes']==4 and result['tiles']==64,result
  page.locator('#end').click()
  saved=page.evaluate("JSON.stringify({turn:state.turn,sector:campaign.sector,integrity:state.integrity})")
  page.reload(wait_until='domcontentloaded')
  page.wait_for_function("window.AbyssPixi?.status==='active'",timeout=25000)
  assert saved==page.evaluate("JSON.stringify({turn:state.turn,sector:campaign.sector,integrity:state.integrity})")
  assert not errors,errors
  print(json.dumps({'pass':True,'biomes':result,'saveReload':True,'jsErrors':errors}))
  browser.close()
finally:
 server.shutdown();server.server_close()
