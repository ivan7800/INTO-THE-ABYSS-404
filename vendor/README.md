# PixiJS oficial — estado v0.60

El adaptador para PixiJS 8 está escrito, pero **la biblioteca PixiJS oficial NO está incluida en este paquete**. El juego funciona con WebGL2 propio o Canvas 2D y es completamente offline.

Para activar PixiJS 8.19.0 en un equipo de desarrollo con acceso a npm:

```bash
npm install
npm run vendor:pixi
npm run build
```

Esto copia la distribución de `node_modules/pixi.js/dist/pixi.min.js` a `vendor/pixi.min.js` y su licencia cuando está disponible. Tras ello, prueba en un navegador con soporte WebGL y comprueba la etiqueta de motor. No llames a esta operación migración completa a PixiJS: la capa sigue presentando un Canvas táctico de referencia; separar cada sprite y loseta es trabajo pendiente.

Referencias: https://github.com/pixijs/pixijs (licencia MIT); versión fijada en `package.json`.
