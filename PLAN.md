# INTO THE ABYSS — Estado actual v0.30.0 (historial desde fase 27)

**Estado: RC condicionada. No declarar STABLE ni publicar automáticamente.**

## Realizado

- Simulador táctico reproducible (`simulador-tactico.cjs`) con 3 políticas: defensiva, agresiva y mixta.
- Las políticas ejecutan movimientos legales con `pathCells()` y `tryAction()`, ataques con `tryAction()`, decisiones de evento con `chooseEvent()`, habilidades con `special()` y resolución enemiga real con `resolveEnemy()`.
- Se respetan las amenazas fijadas y el alcance de las unidades: el simulador no reescribe estados para fabricar victorias. Para escenarios 2–5 se simulan mejoras de campaña ya disponibles (pen, her, viu) como una **hipótesis favorable**; no implica que todas estén realmente desbloqueadas al iniciar cada sector.
- Nueva suite `qa-phase27.cjs`, añadida a `qa-all.sh` y por tanto a GitHub Actions.
- Resultados: 12 victorias sobre 15 casos (3 políticas × 5 sectores); **agresiva gana 5/5** y **vence al Innombrable** en la simulación. Cifras deterministas, no porcentajes estadísticos.

## Pendientes

- Simular progresión real de campaña con mejoras desbloqueadas únicamente cuando corresponde.
- Probar diversidad de posiciones/pilotos/protocolos y estrategias humanas reales.
- Validar renderizado y entrada con navegador escritorio e iPhone Safari.
- Revisar las rutas de derrota por corrupción; no modificar más cifras de balance sin más evidencias.


## Fase 28 — Ejecutada
- [x] Mejorar rasgos pixelados, materiales y diferenciación de Custodios y criaturas.
- [x] Reforzar texturas de suelos, tejados, fachadas, grietas y rocas en cinco biomas.
- [x] Mantener geometría y reglas tácticas sin cambios.
- [x] Añadir QA gráfico específico.
- [ ] Validar estética y control con navegador real e iPhone.


## Fase 29 (implementada)
Rework de geometría del tablero, hit-testing y reducción de escala y ruido visual. La certificación artística requiere una revisión en navegador real.


## Fase 30 (implementada)
- [x] Corregir previsión táctica de corrupción y probarla frente a resolución real.
- [x] Reducir toques perdidos entre rombos; añadir habilidad y fin de turno al tablero móvil.
- [x] Incluir QA de fases 29/30 y campaña consecutiva con progresión real en GitHub Actions.
- [ ] Inspección visual real en escritorio e iPhone; campaña jugada por personas y ajuste de dificultad basado en resultados.
