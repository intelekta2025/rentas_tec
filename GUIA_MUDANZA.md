# Guía para Mover el Proyecto Rentas Tec

Sigue estos pasos para mover tu carpeta de proyecto (`rentas_tec`) a otra ubicación en tu disco duro (por ejemplo, a `D:\Proyectos` o a otra carpeta en `C:\`) sin perder tu historial de Git ni tu configuración.

## Paso 1: Preparación (IMPORTANTE)

1.  **Detener Servidores**: Si tienes la terminal corriendo (`npm run dev`), detenla con `Ctrl + C`.
2.  **Cerrar VS Code**: Cierra completamente Visual Studio Code para asegurarte de que ningún archivo esté bloqueado.
3.  **Cerrar otras herramientas**: Cierra cualquier otra terminal o explorador de archivos que tenga abierta la carpeta.

## Paso 2: Mover la Carpeta

1.  Abre el Explorador de Archivos de Windows.
2.  Ve a la carpeta actual del proyecto: `c:\Users\rosaa\`
3.  Selecciona la carpeta `rentas_tec`.
4.  Corta la carpeta (`Ctrl + X`).
5.  Navega a la **nueva ubicación** donde quieres guardarla.
6.  Pega la carpeta (`Ctrl + V`).

> [!NOTE]
> Al mover la carpeta completa, la carpeta oculta `.git` (que contiene tu historial y conexión con GitHub) se mueve con ella. **Tu conexión con GitHub se mantendrá intacta.**

## Paso 3: Reanudar el Trabajo

1.  Abre VS Code.
2.  Ve a **Archivo > Abrir Carpeta...** (File > Open Folder...).
3.  Selecciona la carpeta `rentas_tec` en su **nueva ubicación**.
4.  Abre una nueva terminal en VS Code (`Terminal > New Terminal`).
5.  Verifica que todo esté bien ejecutando:

```bash
npm run dev
```

6.  (Opcional) Verifica tu conexión con GitHub:

```bash
git remote -v
```
(Debería mostrar las mismas URLs de `origin` que tenías antes).

## ¿Problemas?

- **Error de permisos**: Asegúrate de haber cerrado VS Code y todas las terminales antes de mover la carpeta.
- **VS Code no encuentra archivos**: Si abres VS Code desde "Recientes", puede fallar. Asegúrate de usar "Abrir Carpeta" y buscar la nueva ruta.
