# Lanzadores Windows / Linux — v0.65

## Windows 10 y 11

1. Extrae el **ZIP completo** en una carpeta normal, por ejemplo `C:\Juegos\INTO_THE_ABYSS`.
2. Haz doble clic en **`INICIAR-WINDOWS.bat`**. Se inicia `launch-windows.ps1`, que sirve los archivos localmente con PowerShell 5.1 o superior. No requiere ejecutar como administrador.
3. Se abrirá el navegador predeterminado en **http://127.0.0.1:8765/**. Si no se abre, copia la dirección en Chrome, Edge o Firefox.
4. Mantén abierta la consola mientras juegas; ciérrala al terminar.

Si Windows SmartScreen bloquea la ejecución de un archivo procedente de Internet, inspecciona el contenido del BAT/PS1 antes de autorizarlo. Si una política corporativa impide ejecutar scripts, utiliza otro equipo autorizado; el juego no necesita privilegios elevados.

**Limitación:** el funcionamiento real del lanzador en Windows no se ha podido verificar en este entorno Linux. Incluye un servidor HTTP implementado en PowerShell, pero todavía necesita prueba en Windows 10/11.

## Linux Mint / Ubuntu

En terminal, desde la carpeta extraída:

```bash
bash INICIAR-LINUX.sh
```

Para lanzar mediante doble clic: Propiedades → Permisos → permitir ejecutar como programa; selecciona «Ejecutar en terminal» cuando el gestor de archivos pregunte. Si se requiere permiso desde terminal:

```bash
chmod +x INICIAR-LINUX.sh
./INICIAR-LINUX.sh
```

Usa Python 3 si está instalado; si no, recurre a Node.js. Ninguno requiere `sudo` para ejecutar el juego. Si se muestra `puerto 8765 ocupado`, cierra la aplicación que lo utiliza o la instancia antigua del juego.

## Guardados y seguridad

- Servidor escuchando **solo en 127.0.0.1**, no en la red doméstica.
- Origen fijo 8765: los guardados se mantienen entre arranques desde la misma dirección y navegador.
- Ruta de comprobación `GET /__abyss_health` identifica la versión en ejecución y permite abrir una segunda pestaña sin lanzar otro servidor.
- Se bloquean rutas relativas que intenten salir del directorio del juego.
- No ejecuta descargas ni instala paquetes. Tampoco pide permisos administrativos.
- No se ofrecen ejecutables `.exe` ni `.AppImage`: son **lanzadores de navegador** para una PWA/juego web local, no aplicaciones empaquetadas.

**No abras dos versiones distintas del juego simultáneamente en el puerto 8765.** Antes de actualizar, exporta tu partida con el botón del juego.
