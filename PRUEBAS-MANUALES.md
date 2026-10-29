# Pruebas manuales recomendadas — v0.60

1. Descomprime el ZIP **completo**. Inicia `INICIAR-WINDOWS.bat` en Windows o `bash INICIAR-LINUX.sh` en Linux. Confirma que abre `127.0.0.1:8765` y aparece Puerto de los Ahogados.
2. Selecciona los Custodios 1–3; mueve, alterna MODO, usa una habilidad y termina el turno. Comprueba líneas rojas de amenaza, enemigos y pérdida de HP prevista.
3. Activa NAVEGACIÓN (K), recorre varias casillas con flechas y confirma una acción legal con Enter. Sal con Escape. Inspecciona también casillas apuntando con el ratón.
4. Guarda y exporta un expediente. Detén el lanzador y ejecútalo de nuevo; comprueba que la partida reaparece. Prueba importación desde el JSON exportado.
5. Pulsa REINICIAR CAMPAÑA y **cancela**; verifica que no se borra el progreso. Exporta antes de aceptar un reinicio intencionado.
6. Ejecuta el lanzador otra vez mientras sigue abierto: debe abrir otra pestaña en la misma dirección y sin perder los datos.
7. Prueba el sector 5 y el jefe final. Valida el modo gráficos ligeros con `prefers-reduced-motion` y el comportamiento móvil.

**Reporta:** sistema operativo exacto, navegador, error mostrado, pasos para reproducir, captura y el resultado esperado. Nunca adjuntes una partida exportada si contiene información que no quieres compartir.
