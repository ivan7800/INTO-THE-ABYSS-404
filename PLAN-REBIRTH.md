# Plan de producción — INTO THE ABYSS 404

## v0.65 — TERMINADA Y VERIFICADA EN CHROMIUM/ LINUX

- Cinco panoramas diferenciados de pixel art 16 bits y clima por sector.
- Efectos climáticos compatibles con calidad ligera y movimiento reducido.
- Contraste táctico conservado, sin cambios en ataques, daño, IA o guardados.
- Lanzadores Python/Node en Linux comprobados en el puerto fijo.
- TypeScript compilado, regresiones heredadas y QA Chromium superadas.

## Próximos cambios (priorizados)

**P0 — PixiJS real y GPU:** obtener la dependencia oficial (actualmente bloqueada en este entorno), incluirla con su licencia, verificar inicialización real en Chromium con GPU WebGL y pasar objetos del tablero a sprites Pixi nativos. Evitar limitarse a presentar el Canvas como una textura. Medir consumo de GPU y memoria.

**P1 — Acabado visual profesional:** atlas dibujados a mano, más poses/animaciones, siluetas diferenciadas, profundidad arquitectónica, daños visibles en escenario y sombras de contacto. Comparar legibilidad de casillas, cursores y amenazas en distintas resoluciones.

**P2 — Jugabilidad y balance:** pruebas adversariales de los primeros turnos, curva de aprendizaje, evaluación de habilidades, IA y estadísticas victoria/derrota. No cambiar números sin repetir simulaciones.

**P3 — Audio y narrativa:** bandas originales, foley, motivos por sector, transiciones y texto reactivo a las decisiones. Mezcla dinámica con opción de silencio.

**P4 — Entrega definitiva:** pruebas reales en Windows 10/11, Linux Mint, Firefox/Edge, dispositivos táctiles y diferentes GPU; soporte de mandos; empaquetado opcional para Windows/Linux cuando la web sea estable.

**Regla de calidad:** marcar una fase como finalizada solo si existen código, pruebas y evidencia; no considerar «9,5/10» una nota alcanzada sin evaluación externa.
