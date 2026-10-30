#!/usr/bin/env python3
"""v0.95: real Chromium campaign through legal game actions (not injected victories).

This deterministic policy is shared with the Node campaign test. The campaign is
won by moving, attacking, using skills and resolving enemy turns through actual
game methods. This is automated browser play, not physical-device playtesting.
"""
import json
import re
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
policy_source = (ROOT / 'simulador-tactico.cjs').read_text(encoding='utf-8')
match = re.search(r'const PLAN=`([\s\S]*?)`;', policy_source)
assert match, 'Shared deterministic tactical policy not found'
POLICY = match.group(1)

server = ThreadingHTTPServer(
    ('127.0.0.1', 0),
    partial(SimpleHTTPRequestHandler, directory=str(ROOT / '_site')),
)
threading.Thread(target=server.serve_forever, daemon=True).start()
outcomes = []
errors = []
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
        )
        page = browser.new_page(viewport={'width': 1440, 'height': 900})
        page.on('pageerror', lambda err: errors.append(str(err)))
        page.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='domcontentloaded')
        page.wait_for_function("window.AbyssPixi?.status==='active' && state.turn===1", timeout=30000)
        assert page.evaluate("campaign.sector") == 0, 'Campaign must begin at sector one'
        page.evaluate("() => {window.__strategy='agresiva'; window.confirm=()=>true;}")

        for expected in range(5):
            assert page.evaluate("campaign.sector") == expected
            rounds = 0
            while page.evaluate("state.phase === 'player'") and rounds < 12:
                page.evaluate(POLICY)
                rounds += 1
            result = page.evaluate("""() => ({
                sector:campaign.sector+1, phase:state.phase, turn:state.turn,
                integrity:state.integrity, corruption:state.corruption,
                moves:state.metrics.moves, attacks:state.metrics.attacks,
                specials:state.metrics.specials, upgrades:campaign.upgrades.slice()
            })""")
            result['rounds'] = rounds
            outcomes.append(result)
            assert result['phase'] == 'won', f'Legitimate browser victory failed: {result}'
            assert result['moves'] > 0 and result['attacks'] > 0, result
            page.evaluate("() => nextMission()")
            assert not errors, errors

        assert page.evaluate("campaign.complete") is True, 'Final campaign not marked complete'
        assert page.evaluate("campaign.wins") == 5, 'Expected five legitimate wins'
        # Campaign persistence must survive a browser reload after the final win.
        page.reload(wait_until='domcontentloaded')
        page.wait_for_function("window.AbyssPixi?.status==='active'", timeout=30000)
        assert page.evaluate("campaign.complete") is True, 'Campaign completion not persisted'
        assert page.evaluate("campaign.wins") == 5, 'Persisted win counter corrupted'
        assert not errors, errors
        browser.close()
finally:
    server.shutdown()
    server.server_close()

print(json.dumps({
    'pass': True,
    'scope': 'Full, uninterrupted, deterministic legal-action campaign in headless Chromium',
    'physical_device': False,
    'outcomes': outcomes,
    'page_errors': errors
}, ensure_ascii=False))
