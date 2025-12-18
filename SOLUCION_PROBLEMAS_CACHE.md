# 🔄 Solución de Problemas de Caché y Actualización

## ✅ Pasos Realizados

1. ✅ Servidor detenido
2. ✅ Caché de Vite limpiada (`node_modules/.vite`)
3. ✅ Carpeta `dist` limpiada
4. ✅ Servidor reiniciado

## 🔧 Comandos Útiles para Asegurar Actualización

### Limpiar Caché y Reiniciar (Recomendado)

```bash
# Detener todos los procesos de Node
taskkill /F /IM node.exe

# Limpiar caché de Vite
Remove-Item -Path node_modules/.vite -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path dist -Recurse -Force -ErrorAction SilentlyContinue

# Reiniciar servidor
npm run dev
```

### Limpiar Todo y Reinstalar (Si persisten problemas)

```bash
# Detener servidor
taskkill /F /IM node.exe

# Limpiar todo
Remove-Item -Path node_modules -Recurse -Force
Remove-Item -Path node_modules/.vite -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path dist -Recurse -Force -ErrorAction SilentlyContinue

# Reinstalar dependencias
npm install

# Reiniciar
npm run dev
```

## 🎯 Verificar que los Cambios se Reflejan

### 1. Verificar en el Navegador

1. **Abre las DevTools** (F12)
2. **Ve a la pestaña Network**
3. **Recarga la página con Ctrl+Shift+R** (hard refresh)
4. Verifica que los archivos `.js` se están cargando con timestamps recientes

### 2. Verificar en la Consola del Terminal

El servidor de Vite debería mostrar:
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

Si ves errores de compilación, revísalos.

### 3. Verificar Hot Module Replacement (HMR)

1. Haz un cambio pequeño en un archivo (ej: agregar un comentario)
2. Guarda el archivo (Ctrl+S)
3. Deberías ver en la terminal: `[vite] hmr update`
4. El navegador debería recargar automáticamente

## 🐛 Problemas Comunes

### Problema: Los cambios no se reflejan

**Soluciones:**
1. **Hard refresh en el navegador**: `Ctrl+Shift+R` o `Ctrl+F5`
2. **Limpiar caché del navegador**: 
   - Chrome/Edge: `Ctrl+Shift+Delete` → Limpiar caché
   - O usar modo incógnito: `Ctrl+Shift+N`
3. **Verificar que el archivo se guardó**: Revisa la fecha de modificación
4. **Reiniciar el servidor**: Detener y volver a iniciar `npm run dev`

### Problema: Errores de compilación

**Solución:**
1. Revisa la consola del terminal para ver el error específico
2. Verifica la sintaxis del archivo que modificaste
3. Revisa los linters: `npm run lint`

### Problema: Cambios en archivos de servicios no se reflejan

**Solución:**
1. Verifica que estás editando el archivo correcto
2. Asegúrate de que el import en el componente esté correcto
3. Reinicia el servidor después de cambios en servicios

## 📝 Mejores Prácticas

### 1. Guardar Archivos Correctamente

- **Cursor/VSCode**: Guarda con `Ctrl+S` antes de verificar cambios
- **Auto-save**: Puedes habilitar auto-save en Cursor (File → Auto Save)

### 2. Verificar que el Servidor Está Corriendo

- Deberías ver la URL en la terminal: `http://localhost:5173`
- Si no ves nada, el servidor no está corriendo

### 3. Usar Hard Refresh

- Siempre usa `Ctrl+Shift+R` después de cambios importantes
- O cierra y vuelve a abrir la pestaña del navegador

### 4. Verificar la Consola del Navegador

- Abre DevTools (F12)
- Revisa la pestaña Console para errores
- Revisa la pestaña Network para ver qué archivos se cargan

## 🔍 Verificar Archivos Específicos

### Verificar que authService.js se está usando

1. Abre DevTools (F12)
2. Ve a Sources → Page → src/services/authService.js
3. Verifica que el código coincide con tu archivo actual
4. Si no coincide, haz hard refresh (`Ctrl+Shift+R`)

### Verificar Imports

Asegúrate de que los imports estén correctos:

```javascript
// En useAuth.js
import { signIn, signOut, getCurrentUser } from '../services/authService'

// Verifica que la ruta sea correcta
```

## ⚡ Script Rápido de Limpieza

Crea un archivo `clean-restart.ps1` en la raíz del proyecto:

```powershell
# clean-restart.ps1
Write-Host "Deteniendo servidor..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null

Write-Host "Limpiando caché..." -ForegroundColor Yellow
Remove-Item -Path node_modules/.vite -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path dist -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Iniciando servidor..." -ForegroundColor Green
npm run dev
```

Luego ejecuta: `.\clean-restart.ps1`

## ✅ Checklist de Verificación

Antes de reportar que los cambios no se reflejan:

- [ ] El archivo se guardó correctamente (Ctrl+S)
- [ ] El servidor está corriendo (`npm run dev`)
- [ ] Hice hard refresh en el navegador (Ctrl+Shift+R)
- [ ] Revisé la consola del navegador (F12) para errores
- [ ] Revisé la terminal para errores de compilación
- [ ] Limpié la caché de Vite
- [ ] Reinicié el servidor

## 🎯 Para tu Caso Específico

Si los cambios en `authService.js` no se reflejan:

1. **Verifica que estás editando el archivo correcto**:
   - `src/services/authService.js`

2. **Verifica que el hook lo está importando correctamente**:
   - `src/hooks/useAuth.js` debe importar desde `../services/authService`

3. **Reinicia el servidor**:
   ```bash
   taskkill /F /IM node.exe
   npm run dev
   ```

4. **Hard refresh en el navegador**: `Ctrl+Shift+R`

5. **Verifica en DevTools**:
   - Sources → src/services/authService.js
   - Verifica que el código coincide

