# INTO THE ABYSS 404 — REBIRTH v0.65

Juego táctico de horror cósmico por turnos con **tablero isométrico 8 × 8**, cinco sectores, Custodios, monstruos y jefe final. Continúa la campaña de v0.60 con **nuevos panoramas pixel art 16 bits y clima diferenciado**. Todo el juego funciona sin conexión cuando se lanza localmente.

## Iniciar

**Windows 10/11:** extrae el ZIP completo y haz doble clic en `INICIAR-WINDOWS.bat`. Utiliza Windows PowerShell 5.1, sin Python/Node ni elevación de administrador. Lanzador preparado pero **aún no validado en Windows real**.

**Linux Mint/Ubuntu:** abre la carpeta extraída y ejecuta:

```bash
bash INICIAR-LINUX.sh
```

O marca el `.sh` como ejecutable para usar doble clic. Requiere **Python 3 o Node.js**, usa el que encuentre primero. Ambos lanzadores abren `http://127.0.0.1:8765/`. Mantén abierta la terminal mientras juegas.

Si el puerto 8765 está ocupado por otra versión del juego, ciérrala antes de arrancar. El puerto se conserva para que los guardados del navegador mantengan su origen. Exporta siempre una copia JSON de tu partida antes de cambiar de versión.

## Controles

- Ratón o pantalla táctil: selecciona Custodio y después casilla turquesa; usa modo ATAQUE para atacar.
- 1/2/3: Custodios; M: modo; H: habilidad; Espacio: finalizar turno.
- K: navegación por casillas; flechas para mover el cursor; Enter: actuar; Escape: cancelar la navegación.
- Botón «GRÁFICOS: DETALLADOS» cambia al modo ligero para reducir efectos y partículas.
- Exportación/importación de partida: botones en el panel lateral.

## Desarrollo y verificación

`npm run build` compila TypeScript y genera `game.js` y `dist/*.js` usando `tsc`. `npm test` ejecuta regresiones tácticas y gráficas sin dependencias de terceros. `python3 qa-v065-browser.py` requiere Chromium + Playwright; `python3 qa-launchers.py` verifica los servidores Python/Node en Linux.

Los panoramas están en `src/panorama.ts` y el clima en `src/weather.ts`. La lógica táctica está en `src/tactics.ts` y el controlador principal en `src/game.ts`. El renderizador visible es Canvas2D o WebGL2 opcional. **PixiJS real sigue sin incluirse en el ZIP** porque no se ha podido descargar en el entorno de construcción; el adaptador está preparado pero no es el renderizador nativo del tablero.

Consulta `README-REBIRTH.md`, `QA-V065.md`, `PLAN-REBIRTH.md` y `LANZADORES-README.md`.
