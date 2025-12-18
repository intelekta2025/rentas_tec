# 🔍 Diagnóstico de Conexión a Supabase

## ⚠️ Problema: Timeout al Conectarse

Si Supabase no responde, puede ser por varias razones:

## ✅ Verificaciones Inmediatas

### 1. Verificar Estado de Supabase

1. Ve a: https://status.supabase.com/
2. Verifica que todos los servicios estén operativos (verde)

### 2. Verificar Estado de tu Proyecto

1. Ve a: https://supabase.com/dashboard/project/lfxglcvphlwntathpucx
2. Verifica:
   - ✅ El proyecto está **activo** (no pausado)
   - ✅ No aparece mensaje de "Project paused" o "Inactive"
   - ✅ El proyecto no está en modo de mantenimiento

### 3. Verificar Credenciales

En la consola del navegador (F12), ejecuta:

```javascript
verificarSupabase()
```

**Verifica:**
- ✅ URL debe ser: `https://lfxglcvphlwntathpucx.supabase.co`
- ✅ Key debe empezar con: `eyJ...`
- ✅ Cliente debe estar creado

### 4. Verificar Pestaña Network

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Network** (Red)
3. Intenta hacer login
4. Busca la petición a `/auth/v1/token`
5. Click en ella y revisa:
   - **Status**: ¿Qué código de estado muestra? (200, 500, timeout, etc.)
   - **Response**: ¿Qué respuesta muestra?
   - **Timing**: ¿Cuánto tiempo tarda?

### 5. Probar Conexión Simple

En la consola del navegador:

```javascript
// Probar conexión básica
fetch('https://lfxglcvphlwntathpucx.supabase.co/rest/v1/', {
  method: 'GET',
  headers: {
    'apikey': window.supabase.supabaseKey,
    'Authorization': `Bearer ${window.supabase.supabaseKey}`
  }
})
.then(r => console.log('✅ Conexión OK:', r.status))
.catch(e => console.error('❌ Error de conexión:', e))
```

## 🔧 Soluciones

### Solución 1: Verificar Variables de Entorno

Asegúrate de que el archivo `.env` tiene las credenciales correctas:

```env
VITE_SUPABASE_URL=https://lfxglcvphlwntathpucx.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

**Importante:**
- La URL NO debe terminar con `/`
- La Key debe ser la clave "anon public" (no service_role)

### Solución 2: Reiniciar el Servidor

1. Detén el servidor (Ctrl+C en la terminal)
2. Limpia la caché:
   ```bash
   rm -rf node_modules/.vite
   rm -rf dist
   ```
3. Reinicia:
   ```bash
   npm run dev
   ```

### Solución 3: Verificar Firewall/Proxy

Si estás en una red corporativa:
- Verifica que no haya firewall bloqueando conexiones a Supabase
- Verifica que no haya proxy que esté interfiriendo
- Prueba desde otra red (móvil, por ejemplo)

### Solución 4: Verificar CORS

1. Ve a Supabase Dashboard → Settings → API
2. Verifica que `http://localhost:5173` esté en la lista de URLs permitidas
3. Si no está, agrégalo

## 🆘 Si Nada Funciona

1. **Verifica los logs de Supabase:**
   - Ve a Logs → API Logs
   - Busca errores relacionados con tu IP o requests

2. **Contacta soporte de Supabase:**
   - Si el proyecto está activo pero no responde
   - Si hay errores en los logs

3. **Prueba desde otro navegador:**
   - A veces los problemas de CORS o extensiones pueden causar esto

