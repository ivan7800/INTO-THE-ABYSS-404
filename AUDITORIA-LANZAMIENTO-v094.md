# INTO THE ABYSS 404 — Auditoría de lanzamiento v0.94

**Estado:** NO APTO aún para declarar versión 1.0 hasta cerrar la matriz de dispositivos y confirmar una campaña completa jugada sin alterar el estado.

## Qué verifica la CI
- `qa-launch-audit.py`: recorre cada uno de los cinco sectores con la estrategia pasiva de terminar turnos; registra integridad, corrupción, unidades vivas, número de fases y resultado. **No demuestra una victoria con una estrategia humana.**
- Comprobación separada de las cinco transiciones de campaña: se inyecta un estado de victoria artificial y se llama a las funciones reales `checkEnd()/nextMission()`. **No es una partida completa legítima.**
- Guardado y restauración al terminar cada sector.
- 150 mediciones de `requestAnimationFrame` por modo gráfico, con mediana y percentil 95 del tiempo entre fotogramas. **No son tiempos de GPU física, ni prueba de FPS sostenidos del juego durante combate.**
- Control táctil en viewport emulado 390×844 (Chromium). **No equivale a un dispositivo iOS/Android real.**
- Los 13 juegos de pruebas históricas siguen ejecutándose en CI.

## Cómo registrar rendimiento real (obligatorio antes de 1.0)
Para cada máquina y navegador, registrar resolución, frecuencia del monitor, escala, modo `DETALLADOS/LIGEROS`, sistema operativo, GPU, conexión de alimentación y versión del navegador. **No recolectar datos personales.**

1. Abrir la URL publicada en navegador, recargar y abrir DevTools → Performance (cuando estén disponibles).
2. En **Puerto**, capturar 60 segundos: 20 s exploración estática, 20 s mover/seleccionar unidades y 20 s turnos enemigos. Repetir en **Catedral** con el jefe.
3. Medir FPS p50/p95 de frame times y tirones mayores de 33,3 ms. Informar si hay WebGL o fallback Canvas, memoria, temperatura y consumo de batería si el dispositivo lo permite.
4. Repetir con gráficos ligeros y con movimiento reducido. Anotar problemas de legibilidad, audio, mandos, latencia táctil y errores de consola.
5. Guardar partida → cerrar por completo → volver a abrir → comprobar sector, turnos, escudos y objetivo.
6. Registrar evidencia de cada falla con vídeo/captura, hora, pasos de reproducción y estado de la partida, nunca sobrescribir el original de guardado sin exportarlo.

### Dispositivos mínimos
| Dispositivo real | Ensayo obligatorio |
|---|---|
| Windows + Chrome/Edge, GPU dedicada | 1440p y 1080p, 60 Hz y opcional 144 Hz |
| Windows + iGPU | modo ligero, 1080p y estrés térmico |
| Linux Mint + Chrome/Firefox | lanzamiento `INICIAR-LINUX.sh`, guardado persistente |
| Steam Deck (SteamOS) | navegador en modo juego y escritorio, mando/pantalla táctil |
| iPhone + Safari | controles táctiles, orientación vertical/horizontal y recarga |
| Android + Chrome | navegador móvil, batería/temperatura y accesibilidad |

### Criterios de bloqueo sugeridos para 1.0
- 0 errores que impidan progresar, 0 pérdidas de guardado, 0 bloqueos sin salida.
- Cinco sectores completados consecutivamente por usuarios o por bot basado en acciones legales, con el jefe derrotado realmente; no utilizar inyección artificial de victorias.
- En la matriz de referencia acordada: FPS p95 de frame time ≤ 33,3 ms en modo ligero (30 FPS), y objetivo 60 FPS en hardware recomendado. Medir por dispositivo y escenario.
- Todos los controles usados por juego funcionan con ratón, teclado, táctil y mando donde corresponda.
- Revisar contraste, foco visible, pantalla reducida, reducción de movimiento y audio desactivado.
- El botón `SILENCIADO` no reinicia audio sin gesto del usuario; guardar/restaurar una partida no reinicia automáticamente música.

## Incidencias iniciales identificadas
1. **P0 — Faltan resultados de campaña completa, sin trampas de estado.** El conjunto existente prueba componentes y turnos, no completa cinco sectores encadenados de forma legítima.
2. **P0 — Ausencia de hardware físico verificado.** GitHub CI suele usar un renderizador de software y no representa GPU real, Steam Deck o Safari.
3. **P1 — Doble despliegue GitHub Pages.** La rama principal ejecuta publicación verificada y compilación Pages tradicional; conviene dejar una sola vía reproducible.
4. **P1 — Reproducibilidad npm.** CI utiliza `npm install` en lugar de `npm ci`; verificar y fijar `package-lock.json`.
5. **P1 — Auditoría de IA y equilibrio insuficiente.** Los 600 casos actuales prueban la elección determinista; no son campañas completas.
6. **P1 — Riesgo de navegabilidad en móvil.** Controles visibles en emulación no garantizan comodidad táctil ni mando.

## Evidencia
- CI review: resultados en Actions y `abyss-launch-audit-v094/audit-report.json`.
- Código: `qa-launch-audit.py`, con etiquetado explícito de pruebas sintéticas.
- Ninguna medición se debe presentar como FPS de Steam Deck, GPU Windows o iPhone sin ensayo real de ese dispositivo.

**Dictamen previo:** release candidate 1.0 NO APROBADO. Se actualizará tras examinar los resultados CI y ensayos físicos.
