# REBIRTH v0.65 — El Abismo Toma Forma

Esta versión se basa en la v0.60 y se centra en **dirección artística isométrica y ambientación**. Conserva la campaña, los tres Custodios, las reglas tácticas, los guardados y los lanzadores.

### Cambios implementados

- **Cinco panoramas pixel art originales y distintos**, cada uno diseñado en un lienzo de resolución reducida y escalado sin suavizado: puerto con grúas, bosque de árboles deformados, ciudad ciclópea, estación y catedral de sal.
- **Climatología por sector**, con lluvia negra, esporas, filamentos, ceniza y sal astral. Dibujada en dos capas y con menos partículas en el modo de gráficos ligeros.
- Compatible con **movimiento reducido** (`prefers-reduced-motion`).
- Los elementos visuales son módulos TypeScript `src/panorama.ts` y `src/weather.ts` y no modifican simulación ni guardados.
- Los lanzadores de Linux/Windows identifican la versión 0.65 y mantienen el origen estable `127.0.0.1:8765`.

### Pruebas realizadas

Compilación `npm run build`, batería completa `npm test`, Chromium con cinco escenas y sin errores JavaScript, exportación y fin de turno; Python/Node bajo Linux, estabilidad del puerto y rechazo de rutas fuera de carpeta. Consulta `QA-V065.md`.

### Límites reales

**PixiJS no viene empaquetado y no se ha probado PixiJS real.** Está disponible el adaptador existente (`src/pixi-layer.ts`) para su instalación desde un equipo con acceso a npm. WebGL2 tampoco ha podido validarse sobre una GPU real; la prueba de navegador ha utilizado Canvas 2D. No se ha transformado todavía el tablero completo en sprites nativos PixiJS, ni se han creado binarios `.exe`/`.AppImage`.
