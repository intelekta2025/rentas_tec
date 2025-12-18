# 🔍 Diagnóstico Completo: Error 500 en /auth/v1/token

## 📋 Información del Error

**Error:** `500 Internal Server Error`  
**Endpoint:** `https://lfxglcvphlwntathpucx.supabase.co/auth/v1/token?grant_type=password`  
**Método:** `POST`

Este error ocurre **antes** de que el código del frontend pueda procesar la respuesta, lo que indica un problema en el **servidor de Supabase**.

## ✅ Verificaciones Paso a Paso

### 1. Verificar Variables de Entorno

**En la consola del navegador (F12):**

```javascript
// Verificar que las variables están cargadas
console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
```

**Resultado esperado:**
- ✅ URL: `https://lfxglcvphlwntathpucx.supabase.co`
- ✅ Key: `eyJ...` (debe empezar con `eyJ`)

**Si aparecen `undefined`:**
1. Verifica que existe el archivo `.env` en la raíz del proyecto
2. Verifica que las variables empiezan con `VITE_`
3. **Reinicia el servidor de desarrollo** (`npm run dev`)

### 2. Verificar Usuario en auth.users

**En Supabase Dashboard:**
1. Ve a: https://supabase.com/dashboard/project/lfxglcvphlwntathpucx
2. Navega a **Authentication → Users**
3. Busca el usuario con el email que estás usando

**O ejecuta este SQL:**

```sql
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  banned_until
FROM auth.users
WHERE email = 'admin.norte@tec.mx';  -- ⚠️ Reemplaza con tu email
```

**Verificaciones:**
- ✅ El usuario debe existir
- ✅ `banned_until` debe ser NULL (si no, el usuario está baneado)
- ✅ Copia el `id` (UUID) para el siguiente paso

### 3. Verificar Perfil del Usuario

**Ejecuta este SQL (reemplaza el UUID del paso anterior):**

```sql
-- Reemplaza 'UUID-DEL-USUARIO' con el UUID que copiaste
SELECT 
  'system_users' as tabla,
  id,
  email,
  full_name,
  role,
  unit_id
FROM system_users
WHERE id = 'UUID-DEL-USUARIO'
UNION ALL
SELECT 
  'client_portal_users' as tabla,
  id,
  email,
  full_name,
  role,
  client_id::text as unit_id
FROM client_portal_users
WHERE id = 'UUID-DEL-USUARIO';
```

**Verificaciones:**
- ✅ Debe aparecer un registro en una de las dos tablas
- ✅ El `id` debe coincidir EXACTAMENTE con el UUID de `auth.users`
- ✅ El campo `role` NO debe ser NULL

### 4. Verificar Configuración de Auth en Supabase

**En Supabase Dashboard:**
1. Ve a **Authentication → Settings**
2. Verifica:
   - ✅ **Enable Email Signup**: Habilitado
   - ✅ **Enable Email Confirmations**: Puede estar deshabilitado para desarrollo
   - ✅ **Site URL**: Debe ser `http://localhost:5173` (o tu URL de desarrollo)
   - ✅ **Redirect URLs**: Debe incluir `http://localhost:5173/**`

### 5. Verificar RLS (Row Level Security)

**Ejecuta este SQL:**

```sql
SELECT 
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN 'RLS HABILITADO ⚠️'
    ELSE 'RLS DESHABILITADO ✅'
  END as estado
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('system_users', 'client_portal_users', 'clients', 'receivables', 'payments')
ORDER BY tablename;
```

**Para desarrollo, todas deben estar deshabilitadas:**
- ✅ `RLS DESHABILITADO ✅`

### 6. Verificar Logs de Supabase

**En Supabase Dashboard:**
1. Ve a **Logs → Postgres Logs** o **Logs → API Logs**
2. Busca errores relacionados con:
   - El email que estás usando
   - El endpoint `/auth/v1/token`
   - Errores de "schema" o "permission"

**Los logs te darán más detalles sobre qué está fallando.**

### 7. Probar Login Directo desde Supabase

**En Supabase Dashboard:**
1. Ve a **Authentication → Users**
2. Click en el usuario
3. Click en **"Reset Password"** o **"Send Magic Link"**
4. Esto verifica que el usuario puede autenticarse

## 🔧 Soluciones Según el Problema

### Problema: Variables de entorno no cargadas

**Solución:**
1. Crea/verifica archivo `.env` en la raíz:
   ```
   VITE_SUPABASE_URL=https://lfxglcvphlwntathpucx.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
   ```
2. **Reinicia el servidor:** `npm run dev`

### Problema: Usuario no existe en auth.users

**Solución:**
1. Ve a **Authentication → Users**
2. Click en **"Add user"**
3. Ingresa email y contraseña
4. Marca **"Auto Confirm User"**
5. Copia el UUID generado
6. Inserta el UUID en `system_users` o `client_portal_users`

### Problema: UUID no coincide

**Solución:**
```sql
-- Obtener UUID correcto de auth.users
SELECT id FROM auth.users WHERE email = 'admin.norte@tec.mx';

-- Actualizar system_users con el UUID correcto
UPDATE system_users 
SET id = 'UUID-CORRECTO' 
WHERE email = 'admin.norte@tec.mx';
```

### Problema: Usuario baneado

**Solución:**
```sql
-- Desbanear usuario
UPDATE auth.users 
SET banned_until = NULL 
WHERE email = 'admin.norte@tec.mx';
```

### Problema: RLS habilitado

**Solución:**
```sql
-- Deshabilitar RLS en todas las tablas
ALTER TABLE system_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_portal_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE receivables DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
```

### Problema: Configuración de Auth incorrecta

**Solución:**
1. Ve a **Authentication → Settings**
2. Verifica que **Site URL** es `http://localhost:5173`
3. Agrega a **Redirect URLs**: `http://localhost:5173/**`
4. Guarda los cambios

## 🧪 Prueba de Conexión Directa

**En la consola del navegador (F12):**

```javascript
// Importar cliente de Supabase
import { supabase } from './src/lib/supabase.js'

// Intentar login directo
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin.norte@tec.mx',  // ⚠️ Reemplaza con tu email
  password: 'tu_contraseña'      // ⚠️ Reemplaza con tu contraseña
})

console.log('Data:', data)
console.log('Error:', error)
```

**Si esto funciona**, el problema está en el código del frontend.  
**Si esto falla**, el problema está en la configuración de Supabase.

## 📝 Información para Debugging

Si el error persiste, comparte:

1. **Resultado de verificar variables de entorno** (paso 1)
2. **Resultado de verificar usuario en auth.users** (paso 2)
3. **Resultado de verificar perfil** (paso 3)
4. **Mensaje de error completo** de la consola del navegador
5. **Logs de Supabase** (si están disponibles)

## 🆘 Si Nada Funciona

1. **Verifica el estado del proyecto:**
   - Ve a **Settings → General**
   - Verifica que el proyecto esté activo

2. **Verifica límites de API:**
   - Ve a **Settings → Usage**
   - Verifica que no hayas excedido los límites

3. **Contacta soporte de Supabase:**
   - Si el problema persiste, puede ser un problema del servidor de Supabase
   - Comparte los logs y el mensaje de error completo

