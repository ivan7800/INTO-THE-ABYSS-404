# INTO THE ABYSS 404 — Release v0.95.0

## Alcance
Versión de estabilización de la v0.94. Mantiene las mecánicas, los cinco sectores y la presentación actuales; **no es una reescritura artística ni una certificación v1.0**.

## Cambios
- La versión visible y `package.json` pasan a v0.95.0.
- `npm ci` y `package-lock.json` fijan el grafo de dependencias en CI y publicación.
- `qa-campaign.cjs` comprueba cinco victorias enlazadas mediante las reglas reales en una VM de Node.
- `qa-v095-browser.py` repite la campaña en Chromium, con PixiJS activo y la misma política táctica. No se eliminan enemigos ni se inyecta un estado de victoria.
- La publicación de Pages queda bloqueada si falla la prueba de campaña completa.
- La auditoría `release-readiness.cjs` sigue siendo informativa: v1.0 requiere evidencia real adicional.

## Cómo verificar
En Node.js 22:

```bash
npm ci --no-audit --no-fund --ignore-scripts
npm run vendor:pixi
npm run check
npm run package:site && npm run verify:site
python3 -m pip install playwright==1.55.0
python3 -m playwright install chromium
python3 qa-v095-browser.py
npm run audit:release
```

El resultado de `qa-v095-browser.py` es un JSON con los cinco sectores, métricas y errores del navegador. Los resultados reales de la CI deben consultarse en GitHub Actions; la existencia del test no demuestra que haya pasado.

## Pendientes conocidos de v1.0
- Sesión manual completa: jugabilidad, claridad de interfaz, curva de dificultad, narrativa y bugs emergentes.
- Pruebas en Windows, Linux Mint, iPhone/iPad y Steam Deck reales.
- FPS y latencia en GPU física, incluyendo dispositivos modestos.
- Pruebas de accesibilidad (teclado, lector de pantalla, contraste, ajustes de movimiento).
- Configuración de GitHub Pages: verificar en Settings → Pages que la fuente de publicación es **GitHub Actions** para evitar dobles procesos de despliegue. La automatización no puede modificar esa opción de administración desde el conector actual.

## Política de calidad
Una CI aprobada demuestra que las pruebas automatizadas existentes pasan, pero no permite declarar una puntuación de 9,5/10 ni calidad final de v1.0.
