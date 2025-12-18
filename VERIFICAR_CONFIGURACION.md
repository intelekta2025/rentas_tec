# ✅ Verificación de Configuración de Supabase

## 🔍 Pasos para Verificar

### 1. Verificar Variables de Entorno

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Función de verificación (disponible automáticamente en desarrollo)
verificarSupabase()
```

**O verifica manualmente:**

```javascript
// Verificar el cliente de Supabase
import { supabase } from './src/lib/supabase.js'
console.log('URL:', supabase.supabaseUrl)
console.log('Cliente:', supabase)
```

**Resultado esperado:**
- ✅ URL debe ser algo como: `https://lfxglcvphlwntathpucx.supabase.co`
- ✅ Key debe estar configurada (se muestra como prefijo)
- ✅ Cliente debe estar creado

**Si aparecen errores o `undefined`:**
- Verifica que el archivo `.env` existe en la raíz del proyecto
- Verifica que las variables empiezan con `VITE_`
- **Reinicia el servidor de desarrollo** (`npm run dev`)
- Verifica que no hay errores en la consola al cargar la página

### 2. Verificar Cliente de Supabase

En la consola del navegador (F12):

```javascript
// El cliente está disponible automáticamente en window.supabase
console.log('Cliente Supabase:', window.supabase)
console.log('URL:', window.supabase.supabaseUrl)
```

**O usa la función de verificación:**

```javascript
verificarSupabase()
```

**Resultado esperado:**
- ✅ Debe mostrar el objeto del cliente
- ✅ URL debe coincidir con tu proyecto
- ✅ Cliente debe estar creado correctamente

### 3. Verificar Conexión a Supabase

En la consola del navegador (F12):

```javascript
// Función disponible automáticamente
await probarConexionSupabase()
```

**O manualmente:**

```javascript
// El cliente está en window.supabase
const { data, error } = await window.supabase.from('system_users').select('count').limit(1)
console.log('Conexión:', { data, error })
```

**Resultado esperado:**
- ✅ `success: true` si la conexión funciona
- ❌ `success: false` si hay error (revisa el mensaje)

### 4. Verificar Usuario en auth.users

Ejecuta este SQL en el SQL Editor de Supabase:

```sql
-- Reemplaza con tu email
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'admin.norte@tec.mx';
```

**Resultado esperado:**
- ✅ Debe aparecer un registro con tu email
- ✅ `email_confirmed_at` puede ser NULL (no es crítico para desarrollo)
- ✅ Copia el `id` (UUID) para el siguiente paso

### 5. Verificar Perfil del Usuario

Ejecuta este SQL (reemplaza el UUID del paso anterior):

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

**Resultado esperado:**
- ✅ Debe aparecer un registro en una de las dos tablas
- ✅ El `id` debe coincidir EXACTAMENTE con el UUID de `auth.users`
- ✅ El campo `role` NO debe ser NULL

### 6. Verificar Configuración de Auth en Supabase

1. Ve a: https://supabase.com/dashboard/project/lfxglcvphlwntathpucx
2. Navega a **Authentication → Settings**
3. Verifica:
   - ✅ **Enable Email Signup**: Habilitado
   - ✅ **Enable Email Confirmations**: Puede estar deshabilitado para desarrollo
   - ✅ **Site URL**: Debe ser `http://localhost:5173` (o tu URL de desarrollo)
   - ✅ **Redirect URLs**: Debe incluir `http://localhost:5173/**`

### 7. Verificar RLS (Row Level Security)

Ejecuta este SQL:

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

## 🐛 Problemas Comunes

### Error: "Faltan las variables de entorno"
**Solución:**
1. Crea archivo `.env` en la raíz del proyecto
2. Agrega:
   ```
   VITE_SUPABASE_URL=https://lfxglcvphlwntathpucx.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
   ```
3. Reinicia el servidor: `npm run dev`

### Error: "URL debe ser una URL válida"
**Solución:**
- Verifica que `VITE_SUPABASE_URL` empieza con `https://`
- No debe terminar con `/`
- Ejemplo correcto: `https://lfxglcvphlwntathpucx.supabase.co`

### Error: "Usuario no existe en auth.users"
**Solución:**
1. Ve a Authentication → Users
2. Crea el usuario desde el dashboard
3. Copia el UUID
4. Inserta el UUID en `system_users` o `client_portal_users`

### Error: "UUID no coincide"
**Solución:**
- El UUID en `system_users` o `client_portal_users` DEBE ser exactamente el mismo que en `auth.users`
- Verifica que no hay espacios extra
- Verifica que es un UUID válido (formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

## ✅ Checklist Final

Antes de intentar login, verifica:

- [ ] Variables de entorno configuradas en `.env`
- [ ] Servidor de desarrollo reiniciado después de crear `.env`
- [ ] URL de Supabase es correcta (empieza con `https://`)
- [ ] Anon Key es correcta (empieza con `eyJ`)
- [ ] Usuario existe en `auth.users`
- [ ] Usuario tiene perfil en `system_users` o `client_portal_users`
- [ ] UUID coincide entre `auth.users` y la tabla de perfiles
- [ ] Campo `role` no es NULL
- [ ] RLS está deshabilitado en todas las tablas
- [ ] Email Auth está habilitado en Supabase
- [ ] Site URL está configurado en Supabase

