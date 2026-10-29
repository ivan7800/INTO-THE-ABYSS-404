#!/usr/bin/env python3
"""INTO THE ABYSS 404: static loopback server with stable origin and health probe."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.request import build_opener, ProxyHandler
from urllib.error import URLError
import threading
import webbrowser
import sys
import os

ROOT = Path(__file__).resolve().parent
HOST, PORT = '127.0.0.1', 8765
SIGNATURE = b'INTO_THE_ABYSS_404_REBIRTH_v065'
URL = f'http://{HOST}:{PORT}/'

class GameHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if self.path.split('?')[0] == '/__abyss_health':
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.send_header('Content-Length', str(len(SIGNATURE)))
            self.end_headers()
            self.wfile.write(SIGNATURE)
            return
        super().do_GET()

    def do_HEAD(self):
        if self.path.split('?')[0] == '/__abyss_health':
            self.send_response(200)
            self.send_header('Content-Length', str(len(SIGNATURE)))
            self.end_headers()
            return
        super().do_HEAD()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        super().end_headers()

    def log_message(self, format, *args):
        if self.path.split('?')[0] != '/__abyss_health':
            super().log_message(format, *args)


def is_existing_game():
    try:
        opener = build_opener(ProxyHandler({}))
        with opener.open(URL + '__abyss_health', timeout=1.5) as reply:
            return reply.status == 200 and reply.read(128).strip() == SIGNATURE
    except (URLError, OSError, TimeoutError):
        return False


def launch_browser():
    if os.environ.get('ABYSS_NO_BROWSER') == '1':
        return True
    try:
        return webbrowser.open(URL)
    except Exception:
        return False

if __name__ == '__main__':
    try:
        ThreadingHTTPServer.allow_reuse_address = True
        server = ThreadingHTTPServer((HOST, PORT), GameHandler)
    except OSError as exc:
        if is_existing_game():
            print('La partida ya esta abierta. Abriendo otra pestana: ' + URL, flush=True)
            launch_browser()
            sys.exit(0)
        print('ERROR: puerto 8765 ocupado por otro programa. No se cambia para proteger la ruta de guardados.', file=sys.stderr)
        print('Cierra el programa que use el puerto 8765 y vuelve a intentarlo. Detalle: ' + str(exc), file=sys.stderr)
        sys.exit(2)
    print('INTO THE ABYSS 404 — REBIRTH v0.65', flush=True)
    print('Juego: ' + URL + '  |  Ctrl+C para detener', flush=True)
    threading.Thread(target=launch_browser, daemon=True).start()
    try:
        with server:
            server.serve_forever(poll_interval=0.2)
    except KeyboardInterrupt:
        print('\nServidor detenido.')
