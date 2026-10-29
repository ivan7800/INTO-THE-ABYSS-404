#!/usr/bin/env python3
"""Real Chromium regression for v0.65 panorama and weather without modifying rules."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, shutil, hashlib, re
ROOT=Path(__file__).resolve().parent
with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=shutil.which('chromium') or '/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'])
  page=browser.new_page(viewport={'width':1440,'height':1100},accept_downloads=True)
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  html=(ROOT/'index.html').read_text()
  html=re.sub(r'<script[^>]+src="[^"]+"[^>]*></script>','',html)
  page.set_content(html,wait_until='domcontentloaded')
  page.evaluate("() => {const mem={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>mem[k]??null,setItem:(k,v)=>{mem[k]=String(v)},removeItem:k=>{delete mem[k]}}});}")
  page.add_style_tag(content=(ROOT/'style.css').read_text()+'\n'+(ROOT/'rebirth.css').read_text())
  for file in ['environment-art.js','pixel-art.js','dist/art.js','dist/creatures.js','dist/bestiary.js','dist/cinematics.js','dist/atmosphere.js','dist/weather.js','dist/panorama.js','dist/guidance.js','game.js','dist/rebirth.js','dist/pixi-layer.js']:
   page.add_script_tag(content=(ROOT/file).read_text())
  page.wait_for_timeout(650)
  assert page.evaluate('typeof AbyssTactics')!='undefined'
  assert page.evaluate('window.AbyssWeather?.version')=='0.65'
  assert page.evaluate('window.AbyssPanorama?.version')=='0.65'
  hashes=[]
  for sector in range(5):
   data=page.evaluate('(s)=>AbyssPanorama.get(s).toDataURL()',sector)
   hashes.append(hashlib.sha256(data.encode()).hexdigest())
  assert len(set(hashes))==5,'panoramas must be visibly distinct'
  state_before=page.evaluate('JSON.stringify({turn:state.turn,sector:campaign.sector,integrity:state.integrity,units:state.units.map(u=>[u.id,u.x,u.y,u.hp])})')
  for sector in range(5):
   page.evaluate('(s)=>{campaign.sector=s;draw()}',sector)
   page.screenshot(path=str(ROOT/f'ESCENARIO-v065-{sector+1}.png'),full_page=False)
  page.evaluate('()=>{campaign.sector=0;draw()}')
  state_after=page.evaluate('JSON.stringify({turn:state.turn,sector:campaign.sector,integrity:state.integrity,units:state.units.map(u=>[u.id,u.x,u.y,u.hp])})')
  assert state_before==state_after,'rendering changed tactical simulation'
  page.locator('#game').click(position={'x':20,'y':20}) # only check no JS exceptions, outside battlefield
  page.keyboard.press('k')
  assert page.evaluate('keyboardNavigation')==True
  page.keyboard.press('ArrowRight')
  page.keyboard.press('Escape')
  assert page.evaluate('keyboardNavigation')==False
  with page.expect_download() as d:page.locator('#exportSave').click()
  assert d.value.suggested_filename.endswith('.json')
  page.locator('#end').click()
  assert page.evaluate('state.turn>1||state.phase!="player"')
  assert not errors,errors
  page.screenshot(path=str(ROOT/'PREVIEW-REBIRTH-v065.png'),full_page=True)
  print(json.dumps({'pass':True,'sector_panorama_unique':len(set(hashes)),'weather':True,'keyboard':True,'save_export':True,'turn':True,'page_errors':errors,'renderer':page.evaluate('document.body.dataset.rebirth||"original"')},ensure_ascii=False))
  browser.close()

