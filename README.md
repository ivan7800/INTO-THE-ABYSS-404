# INTO THE ABYSS 404 — REBIRTH v0.94

Juego táctico de terror cósmico por turnos con tablero isométrico 8 × 8, cinco sectores, Custodios, enemigos y jefe final.

> **Estado de lanzamiento:** v0.94 publicada; **v1.0 todavía no certificada**. La CI comprueba compilación, regresiones, pruebas automatizadas de navegador y transiciones sintéticas. No demuestra una campaña ganada de forma legítima ni sustituye pruebas sobre dispositivos físicos. Véase [AUDITORIA-LANZAMIENTO-v094.md](AUDITORIA-LANZAMIENTO-v094.md).

## Jugar en navegador

[GitHub Pages](https://ivan7800.github.io/INTO-THE-ABYSS-404/). Se recomienda exportar una copia JSON de las partidas antes de cambiar de versión.

## Ejecutar localmente

**Windows 10/11:** extrae el paquete completo y ejecuta `INICIAR-WINDOWS.bat`. No requiere elevación de administrador. La compatibilidad con distintas instalaciones de Windows debe comprobarse en hardware real.

**Linux Mint/Ubuntu:** desde la carpeta extraída ejecuta:

```bash
bash INICIAR-LINUX.sh
```

El lanzador requiere Python 3 o Node.js, utiliza el primero disponible y sirve el juego en `http://127.0.0.1:8765/`. Mantén abierto el proceso. Si el puerto está ocupado, cierra el servidor anterior. Conservar el origen permite reutilizar los guardados del navegador.

## Controles

- Ratón/táctil: selecciona un Custodio y una casilla disponible; usa el modo de ataque para atacar.
- Teclas 1/2/3: seleccionar Custodio; M: modo; H: habilidad; Espacio: terminar turno.
- K: navegación por casillas; flechas: cursor; Enter: actuar; Escape: cancelar.
- `GRÁFICOS: DETALLADOS`: alterna al modo ligero.
- Exporta una copia de seguridad de la partida antes de reinstalar o cambiar de versión.

## Desarrollo

Requiere Node.js 22 y npm. Las dependencias declaradas incluyen TypeScript 5.8.x y PixiJS 8.19.0.

```bash
npm install --no-audit --no-fund
npm run vendor:pixi
npm run check
npm run package:site
npm run verify:site
```

`npm run check` compila TypeScript y ejecuta la batería de regresión Node. Los tests de navegador usan Python, Playwright y Chromium; consulta `.github/workflows/ci.yml` para los comandos y versiones utilizados. La publicación verificada usa `.github/workflows/publish-pages.yml`.

**Reproducibilidad pendiente:** el repositorio aún no incluye `package-lock.json`; no se debe sustituir `npm install` por `npm ci` hasta generar, revisar y versionar el lockfile.

## Alcance de la validación

Las pruebas automatizadas no equivalen a una victoria real de principio a fin. El informe [AUDITORIA-LANZAMIENTO-v094.md](AUDITORIA-LANZAMIENTO-v094.md) describe las pruebas de cinco sectores, guardados, controles emulados, mediciones de renderizado por software y la matriz pendiente de hardware físico. Los datos de Chromium headless no representan FPS reales en una GPU.

## Estructura principal

- `src/game.ts` y `src/tactics.ts`: juego y reglas tácticas.
- `src/pixi-layer.ts`: capa de renderizado PixiJS.
- `src/panorama.ts` y `src/weather.ts`: escenarios y clima.
- `scripts/build-game.cjs`: genera `game.js` desde TypeScript.
- `scripts/package-site.cjs`: empaqueta archivos públicos en `_site/`.
- `qa-v094.cjs`, `qa-v094-browser.py`, `qa-launch-audit.py`: verificaciones de la versión y auditoría de lanzamiento.

**Objetivo de la rama `audit/v095-stabilization`:** cerrar riesgos de lanzamiento sin introducir cambios de jugabilidad no verificados. No publicar como v1.0 hasta demostrar campaña legítima y compatibilidad física.
