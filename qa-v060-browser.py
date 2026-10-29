#!/usr/bin/env python3
"""Browser validation for new keyboard navigation, inspector and tactical integrity."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re, json, shutil
root=Path(__file__).resolve().parent
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=shutil.which('chromium') or '/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'])
    page=browser.new_page(viewport={'width':1440,'height':1100},accept_downloads=True)
    errors=[]
    page.on('pageerror',lambda exc: errors.append(str(exc)))
    html=(root/'index.html').read_text()
    html=re.sub(r'<script[^>]+src="[^"]+"[^>]*></script>','',html)
    page.set_content(html,wait_until='domcontentloaded')
    page.evaluate('''() => {const mem={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>mem[k]??null,setItem:(k,v)=>{mem[k]=String(v)},removeItem:k=>{delete mem[k]}}});}''')
    page.add_style_tag(content=(root/'style.css').read_text()+'\n'+(root/'rebirth.css').read_text())
    for name in ['environment-art.js','pixel-art.js','dist/art.js','dist/creatures.js','dist/bestiary.js','dist/cinematics.js','dist/atmosphere.js','dist/guidance.js','game.js','dist/rebirth.js','dist/pixi-layer.js']:
        page.add_script_tag(content=(root/name).read_text())
    page.wait_for_timeout(230)
    assert page.locator('#game').is_visible()
    assert page.locator('#tileInspector').is_visible()
    assert page.locator('#keyboardMode').inner_text().find('NAVEGACIÓN')>=0
    assert page.locator('#status').inner_text()
    before=page.evaluate('''() => JSON.stringify({turn:state.turn,integrity:state.integrity,corruption:state.corruption,units:state.units.map(u=>[u.id,u.x,u.y,u.hp])})''')
    page.keyboard.press('k')
    assert page.evaluate('keyboardNavigation') is True
    start=page.evaluate('({x:cursorCell.x,y:cursorCell.y})')
    key='ArrowRight' if start['x']<7 else 'ArrowLeft'
    page.keyboard.press(key)
    after=page.evaluate('({x:cursorCell.x,y:cursorCell.y})')
    assert after['x']!=start['x']
    assert 'CASILLA' in page.locator('#tileInspector').inner_text()
    assert 'NAVEGACIÓN: ACTIVA' in page.locator('#keyboardMode').inner_text()
    # Cursor movement cannot change the simulation.
    assert before==page.evaluate('''() => JSON.stringify({turn:state.turn,integrity:state.integrity,corruption:state.corruption,units:state.units.map(u=>[u.id,u.x,u.y,u.hp])})''')
    # Position cursor on an actual legal move, via arrow presses, and confirm with Enter.
    route=page.evaluate('''() => {const u=state.units.find(a=>a.id===state.selected);return [...pathCells(u).keys()].map(k=>k.split(',').map(Number)).map(([x,y])=>({x,y})).filter(p=>!obstacle(p.x,p.y))[0]}''')
    assert route, 'no legal move to validate'
    while after['x']!=route['x']:
        page.keyboard.press('ArrowRight' if after['x']<route['x'] else 'ArrowLeft')
        after=page.evaluate('({x:cursorCell.x,y:cursorCell.y})')
    while after['y']!=route['y']:
        page.keyboard.press('ArrowDown' if after['y']<route['y'] else 'ArrowUp')
        after=page.evaluate('({x:cursorCell.x,y:cursorCell.y})')
    page.keyboard.press('Enter')
    assert page.evaluate('''() => {const u=state.units.find(a=>a.id===state.selected);return u.moved}''') is True
    assert page.evaluate('''() => {const u=state.units.find(a=>a.id===state.selected);return {x:u.x,y:u.y}}''') == route
    page.screenshot(path=str(root/'PREVIEW-REBIRTH-v060.png'),full_page=True)
    # Saving, turn resolution and shortcuts stay functional.
    with page.expect_download(timeout=5000) as dl:
        page.locator('#exportSave').click()
    assert dl.value.suggested_filename.endswith('.json')
    page.keyboard.press('Escape')
    assert page.evaluate('keyboardNavigation') is False
    page.locator('#end').click()
    assert page.evaluate('state.turn')>1 or page.evaluate('state.phase')!='player'
    # Accidental campaign reset must be cancellable, without destroying progress.
    previous=page.evaluate('JSON.stringify({turn:state.turn,sector:campaign.sector,units:state.units.map(u=>u.hp)})')
    page.on('dialog',lambda dialog:dialog.dismiss())
    page.locator('#restart').click()
    assert previous==page.evaluate('JSON.stringify({turn:state.turn,sector:campaign.sector,units:state.units.map(u=>u.hp)})')
    page.screenshot(path=str(root/'QA-POST-TURNO-v060.png'),full_page=True)
    assert not errors,errors
    browser.close()
    print(json.dumps({'pass':True,'keyboard':True,'inspector':True,'move':True,'turn':True,'save':True,'page_errors':errors},ensure_ascii=False))
