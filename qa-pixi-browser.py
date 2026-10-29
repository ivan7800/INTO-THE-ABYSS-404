#!/usr/bin/env python3
"""Smoke-test PixiJS adapter lifecycle with a strict API double.
NOTE: This does NOT certify actual third-party PixiJS/GPU operation; bundle unavailable.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
root=Path(__file__).resolve().parent
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium') or '/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page()
 errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content('''<html><body><div class="battle"><div class="quality-bar"></div><canvas id="game" width="640" height="640"></canvas></div></body></html>''')
 page.add_style_tag(content=(root/'rebirth.css').read_text())
 page.evaluate('''() => {
   window.PIXI = {
    Application:class {
      constructor(){this.stage={addChild(sprite){window.__sprite=sprite}};this.canvas=document.createElement('canvas')}
      async init(config){this.canvas.width=config.width;this.canvas.height=config.height;window.__pixiInit=config;}
      destroy(){}
    },
    Sprite:class {constructor(texture){this.texture=texture}},
    Texture:{from(canvas){return {source:{scaleMode:'linear',update(){window.__pixiUploads=(window.__pixiUploads||0)+1}}}}}
   }
   window.AbyssGPU={pause(){window.__pixiPaused=true},setScene(){},status(){return 'webgl2'},frames(){return 1}}
 }''')
 # Pixi plugin expects the stage supplied by the existing REBIRTH compositor.
 page.evaluate('''() => {const source=document.querySelector('#game');const stage=document.createElement('div');stage.className='rebirth-stage';source.parentNode.insertBefore(stage,source);stage.appendChild(source)}''')
 page.add_script_tag(content=(root/'dist/pixi-layer.js').read_text())
 page.wait_for_function("document.body.dataset.pixi === 'active' && window.AbyssPixi.frames>0")
 assert page.evaluate('window.__pixiPaused') is True
 assert page.evaluate('window.__pixiInit.preference')=='webgl'
 assert page.locator('#pixi-screen').count()==1
 assert page.evaluate('window.__pixiUploads')>0
 assert not errors,errors
 print('PASS PixiJS v8 adapter: lifecycle/init/texture uploads/renderer handoff under an API test double (NOT real PixiJS).')
 browser.close()
