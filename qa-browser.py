#!/usr/bin/env python3
"""Chromium real DOM/Canvas test, with scripts injected due sandbox URL policy."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,re,shutil
root=Path(__file__).resolve().parent
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('google-chrome') or '/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
 page=browser.new_page(viewport={'width':1440,'height':1100},device_scale_factor=1)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)+' '+(e.stack or '')))
 raw=(root/'index.html').read_text();raw=re.sub(r'<script[^>]+src="[^"]+"[^>]*></script>','',raw)
 page.set_content(raw,wait_until='domcontentloaded')
 # The sandbox blocks localhost/file navigations; about:blank has no localStorage.
 # Emulate localStorage ONLY for the browser test, not for the shipped application.
 page.evaluate('''() => {const mem={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>mem[k]??null,setItem:(k,v)=>{mem[k]=String(v)},removeItem:k=>{delete mem[k]}}});}''')
 page.add_style_tag(content=(root/'style.css').read_text()+'\n'+(root/'rebirth.css').read_text())
 for name in ['environment-art.js','pixel-art.js','dist/art.js','dist/creatures.js','dist/bestiary.js','dist/cinematics.js','dist/atmosphere.js','dist/guidance.js','game.js','dist/rebirth.js','dist/pixi-layer.js']:
  page.add_script_tag(content=(root/name).read_text())
 page.wait_for_timeout(600)
 assert page.locator('#game').count()==1
 assert page.evaluate('document.body.dataset.rebirth') in ('webgl2','canvas-fallback')
 assert page.locator('#status').inner_text().strip()
 assert page.locator('#sector').inner_text().strip()
 assert page.locator('#bestiary summary').inner_text().strip()
 assert page.locator('#rebirth-guide').is_visible()
 assert page.locator('#rebirth-guide').inner_text().find('PASO 1 / 3')>=0
 assert page.evaluate('window.AbyssCinematicFX.active()')==0
 assert page.evaluate('window.AbyssGPU.status()') in ('webgl2','webgl2-unavailable','shader-error','runtime-error','context-lost')
 assert page.locator('.codex-entry').count() >= 2
 assert page.evaluate("window.AbyssPixel.version.includes('0.45')")
 assert page.evaluate("window.AbyssPixel.sprite('leviathan',2,true).width === 48")
 assert page.evaluate("window.AbyssPixel.sprite('pen',3,false).height === 64")
 # Visual-only damage and impact animations must never modify tactical state.
 before_fx=page.evaluate("JSON.stringify({turn:state.turn,integrity:state.integrity,units:state.units.map(u=>[u.id,u.hp])})")
 page.evaluate("window.AbyssCombatFX.impact(3,3,'#ffaacc');window.AbyssCombatFX.damage(3,3,2,true,true)")
 page.wait_for_timeout(90)
 after_fx=page.evaluate("JSON.stringify({turn:state.turn,integrity:state.integrity,units:state.units.map(u=>[u.id,u.hp])})")
 assert before_fx == after_fx, 'Visual effects modified game rules'
 page.screenshot(path=str(root/'PREVIEW-REBIRTH-v055.png'),full_page=True)
 mode=page.locator('#mode');mode.click();assert 'ATAQUE' in mode.inner_text()
 mode.click();assert 'MOVER' in mode.inner_text()
 page.locator('[data-unit="2"]').click()
 page.locator('#guide-dismiss').click();assert page.locator('#rebirth-guide').is_hidden()
 page.locator('#guide-reopen').click();assert page.locator('#rebirth-guide').is_visible()
 # Portable save import must restore a valid snapshot and reject malformed JSON.
 with page.expect_download(timeout=5000) as dl:
  page.locator('#exportSave').click()
 assert dl.value.suggested_filename.endswith('.json')
 rawSave=page.evaluate('JSON.stringify({version:8,campaign,state})')
 page.evaluate('window.confirm=()=>true')
 page.locator('#saveFileInput').set_input_files({'name':'expediente.json','mimeType':'application/json','buffer':rawSave.encode('utf8')})
 page.wait_for_timeout(140)
 assert 'IMPORTADA' in page.locator('#saveStatus').inner_text(),page.locator('#saveStatus').inner_text()
 page.locator('#saveFileInput').set_input_files({'name':'corrupto.json','mimeType':'application/json','buffer':b'{"version":1}'})
 page.wait_for_timeout(140)
 assert 'RECHAZADA' in page.locator('#saveStatus').inner_text(),page.locator('#saveStatus').inner_text()
 page.locator('#save').click();assert 'GUARDADO' in page.locator('#saveStatus').inner_text().upper()
 # Validate a real in-game tactical move, not merely the DOM buttons.
 route=page.evaluate('''() => {const u=state.units.find(x=>x.id===state.selected);return [...pathCells(u).keys()].map(s=>s.split(',').map(Number)).map(([x,y])=>({x,y})).filter(p=>!obstacle(p.x,p.y)).sort((a,b)=>Math.abs(b.x-u.x)+Math.abs(b.y-u.y)-Math.abs(a.x-u.x)-Math.abs(a.y-u.y)).slice(0,1)}''')
 assert route,'No available movement cells'
 before=page.evaluate('''() => {const u=state.units.find(x=>x.id===state.selected);return [u.x,u.y]}''')
 cell=route[0];coords=page.evaluate('''([x,y]) => project(x,y)''',[cell['x'],cell['y']])
 page.locator('#game').scroll_into_view_if_needed();bounds=page.locator('#game').bounding_box()
 page.mouse.click(bounds['x']+coords['x']*bounds['width']/640,bounds['y']+coords['y']*bounds['height']/640)
 after=page.evaluate('''() => {const u=state.units.find(x=>x.id===state.selected);return [u.x,u.y]}''')
 assert after!=before,(before,after,cell)
 turn=page.evaluate('state.turn')
 page.locator('#end').click()
 assert page.evaluate('window.AbyssCinematicFX.active()')>=1
 assert page.evaluate('state.turn')>turn or page.evaluate('state.phase')!='player'
 page.screenshot(path=str(root/'QA-POST-TURNO-v055.png'),full_page=True)
 src=page.evaluate("() => [...document.querySelector('#game').getContext('2d').getImageData(320,320,1,1).data]")
 gpu=page.evaluate('document.body.dataset.rebirth')
 print(json.dumps({'gpu':gpu,'gpu_reason':page.evaluate('document.body.dataset.gpuReason||null'),'gpu_frames':page.evaluate('window.AbyssGPU.frames()'),'source_pixel':src,'errors':errors,'controls_passed':True,'move':True,'turn':True,'save':True},ensure_ascii=False))
 assert src[3]>0
 assert not errors,errors
 # Responsive controls: small viewport still exposes touch toolbar and all actions.
 page.set_viewport_size({'width':390,'height':844})
 assert page.locator('#touchMode').is_visible()
 assert page.locator('#touchEnd').is_visible()
 assert page.locator('#game').bounding_box()['width'] <= 390
 assert page.locator('#bestiary summary').count() == 1
 assert not errors,errors
 browser.close()
