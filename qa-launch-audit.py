#!/usr/bin/env python3
"""Launch readiness audit. Five genuine enemy-resolution runs, plus labelled synthetic
progression tests. Headless Chromium benchmarks are NOT physical-device FPS."""
import json,statistics,threading,os
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent
srv=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root/'_site')))
threading.Thread(target=srv.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{srv.server_port}/'
report={'schema':'abyss-launch-audit-v1','environment':'GitHub Ubuntu Chromium headless; NOT a physical GPU or mobile device',
        'campaign_runs':[],'synthetic_progression':[],'performance':[],'errors':[]}
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
  page=browser.new_page(viewport={'width':1440,'height':900},reduced_motion='reduce')
  page.on('pageerror',lambda e:report['errors'].append(str(e)))
  page.goto(url,wait_until='domcontentloaded')
  page.wait_for_function("window.AbyssPixi?.status==='active' && state.turn===1",timeout=30000)
  for sector in range(5):
   # Test isolation: explicitly selects a sector. This is NOT an uninterrupted successful campaign.
   page.evaluate("""n => {campaign.sector=n;campaign.complete=false;init()}""",sector)
   start=page.evaluate("({sector:campaign.sector,name:state.sectorName,turn:state.turn,maxTurns:state.maxTurns,units:state.units.length,phase:state.phase})")
   traces=[]
   for step in range(start['maxTurns']+1):
    if page.evaluate("state.phase")!='player':break
    page.locator('#end').click()
    snap=page.evaluate("""() => ({turn:state.turn,phase:state.phase,integrity:state.integrity,
      corruption:state.corruption,enemy:state.units.filter(u=>u.side==='enemy'&&u.hp>0).length,
      allies:state.units.filter(u=>u.side==='ally'&&u.hp>0).length,turnsResolved:state.metrics.turnsResolved,
      history:campaign.history?.length||0})""")
    assert 0<=snap['corruption']<=100 and snap['integrity']>=0 and snap['turnsResolved']==step+1,(sector,snap)
    traces.append(snap)
    if snap['phase']!='player':break
   result={'sector':sector+1,'name':start['name'],'start':start,'turns':traces,
      'outcome':page.evaluate("state.phase"),'strategy':'No actions; click End Turn repeatedly. Non-winning stress baseline.'}
   report['campaign_runs'].append(result)
   # Save and reload at every sector terminal state.
   snapshot=page.evaluate("JSON.stringify({sector:campaign.sector,turn:state.turn,phase:state.phase,corruption:state.corruption})")
   page.reload(wait_until='domcontentloaded')
   page.wait_for_function("window.AbyssPixi?.status==='active'",timeout=30000)
   assert snapshot==page.evaluate("JSON.stringify({sector:campaign.sector,turn:state.turn,phase:state.phase,corruption:state.corruption})")
  # Controlled progression after injecting explicit victory state: tests transitions, not legitimate gameplay.
  page.evaluate("() => {window.confirm=()=>true;fullRestart()}")
  for sector in range(5):
   vals=page.evaluate("""() => {
     const index=campaign.sector;
     // Test fixture: remove all enemies, then call genuine checkEnd/nextMission.
     state.units=state.units.filter(u=>u.side==='ally');
     checkEnd();
     const won=state.phase==='won';
     if(won)nextMission();
     return {index,won,nextSector:campaign.sector,complete:campaign.complete,phase:state.phase,wins:campaign.wins};
   }""")
   assert vals['index']==sector and vals['won'],vals
   assert vals['nextSector']==sector+1 and vals['wins']==sector+1,vals
   report['synthetic_progression'].append(vals)
  assert report['synthetic_progression'][-1]['complete']
  # Benchmark during ACTIVE gameplay, not after a synthetic five-sector completion.
  page.evaluate("() => {window.confirm=()=>true;fullRestart();campaign.sector=2;init()}")
  assert page.evaluate("campaign.sector===2 && state.phase==='player'")
  # Headless, software-renderer timing; record rather than label as GPU hardware performance.
  for mode in ('full','lite'):
   page.evaluate("""mode => {
      localStorage.setItem('abyss-visual-quality',mode);visualQuality=mode;render();
   }""",mode)
   measurement=page.evaluate("""async () => {
    const samples=[];let prior=0;
    await new Promise(resolve => {
      let count=0;
      function step(t){
        if(prior)samples.push(t-prior);
        prior=t;count++;
        if(count>=121)resolve();else requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
    samples.sort((a,b)=>a-b);
    const p=i=>samples[Math.min(samples.length-1,Math.floor(samples.length*i))];
    const probe=document.createElement('canvas');
    const gl=probe.getContext('webgl2')||probe.getContext('webgl');
    const dbg=gl?.getExtension('WEBGL_debug_renderer_info');
    return {samples:samples.length,medianFrameMs:p(.5),p95FrameMs:p(.95),
      slowFramesOver33ms:samples.filter(x=>x>33.34).length,
      webglRenderer:gl?gl.getParameter(dbg?.UNMASKED_RENDERER_WEBGL||gl.RENDERER):'unavailable',
      pixi:AbyssPixi.status,sector:campaign.sector};
   }""")
   assert measurement['samples']>=110 and measurement['pixi']=='active'
   report['performance'].append({'quality':mode,**measurement})
  # Touch-oriented viewport smoke; no real iPhone/Steam Deck hardware assertions.
  mobile=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2)
  mobile.on('pageerror',lambda e:report['errors'].append(str(e)))
  mobile.goto(url,wait_until='domcontentloaded')
  mobile.wait_for_function("window.AbyssPixi?.status==='active'",timeout=30000)
  assert mobile.locator('#touchEnd').count()==1 and mobile.locator('#touchMode').count()==1
  mobile.locator('#touchEnd').click()
  report['touch_emulation']={'viewport':'390x844, Chromium emulation','turn':mobile.evaluate('state.turn'),
      'pixi':mobile.evaluate('AbyssPixi.status'),'device':'NOT a physical phone'}
  assert report['touch_emulation']['turn']>=2
  mobile.close();browser.close()
finally:
 srv.shutdown();srv.server_close()
Path(os.environ.get('ABYSS_AUDIT_OUTPUT','audit-report.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'pass':len(report['errors'])==0,'sectorOutcomes':[x['outcome'] for x in report['campaign_runs']],
 'syntheticProgression':len(report['synthetic_progression']), 'performance':report['performance'],
 'touch':report.get('touch_emulation'),'jsErrors':report['errors']},ensure_ascii=False))
assert not report['errors'],report['errors']
