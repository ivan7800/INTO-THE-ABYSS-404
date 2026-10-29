#!/usr/bin/env python3
"""Real loopback tests for Linux launchers and duplicate-run behavior."""
from pathlib import Path
from urllib.request import urlopen
from urllib.error import HTTPError
import os, subprocess, time, signal, json, sys
root=Path(__file__).resolve().parent
url='http://127.0.0.1:8765/'
assert os.path.isfile(root/'INICIAR-LINUX.sh')
env=dict(os.environ,ABYSS_NO_BROWSER='1')

def wait_started():
    for i in range(35):
        try:
            with urlopen(url+'__abyss_health',timeout=.5) as resp:
                if resp.read()==b'INTO_THE_ABYSS_404_REBIRTH_v065':return
        except Exception:time.sleep(.1)
    raise RuntimeError('No sirve /__abyss_health')

def check_files():
    with urlopen(url,timeout=3) as r: assert b'INTO THE' in r.read()
    with urlopen(url+'game.js',timeout=3) as r: assert b'function draw()' in r.read()
    with urlopen(url+'__abyss_health',timeout=3) as r:assert r.read()==b'INTO_THE_ABYSS_404_REBIRTH_v065'
    try:urlopen(url+'%2e%2e/%2e%2e/etc/passwd',timeout=3)
    except HTTPError as e:assert e.code in (403,404)
    else:raise AssertionError('Traversal not rejected')

def run(command):
    proc=subprocess.Popen(command,cwd=root,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,start_new_session=True)
    try:
        wait_started();check_files()
        duplicate=subprocess.run(command,cwd=root,env=env,capture_output=True,text=True,timeout=6)
        assert duplicate.returncode==0,duplicate.stdout+duplicate.stderr
        assert 'ya ' in duplicate.stdout.lower() or 'already' in duplicate.stdout.lower(),duplicate.stdout
        assert proc.poll() is None
    finally:
        if proc.poll() is None:
            os.killpg(proc.pid,signal.SIGTERM)
            try:proc.wait(timeout=4)
            except subprocess.TimeoutExpired:os.killpg(proc.pid,signal.SIGKILL)
    # Wait for socket close before the next implementation.
    time.sleep(.3)

run(['bash',str(root/'INICIAR-LINUX.sh')])
run(['node',str(root/'launch-local.cjs')])
print('PASS v0.65: Linux .sh, Python + Node servers, HTTP, traversal defense, stable port and duplicate launch')
