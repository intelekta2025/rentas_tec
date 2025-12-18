# 🔧 Solución Definitiva: Error "Database error querying schema"

## 📋 El Problema

El error **"Database error querying schema"** ocurre cuando Supabase Auth intenta consultar el esquema de la base de datos durante el proceso de login y falla. Este error viene del **servidor de Supabase**, no del código del frontend.

## 🎯 Causas Posibles

1. **Funciones o triggers** que se ejecutan automáticamente durante el login y tienen errores
2. **Políticas RLS** en el schema `auth` (menos común)
3. **Configuración de Supabase Auth** que intenta consultar tablas relacionadas
4. **Problemas con el proyecto de Supabase** (pausado, límites excedidos, etc.)

## ✅ Soluciones (en orden de prioridad)

### Solución 1: Verificar Estado del Proyecto

1. Ve a: https://supabase.com/dashboard/project/lfxglcvphlwntathpucx
2. Verifica:
   - ✅ El proyecto está **activo** (no pausado)
   - ✅ No has excedido los **límites de API**
   - ✅ El proyecto no está en **modo de mantenimiento**

### Solución 2: Verificar Logs de Supabase

1. Ve a **Logs → Postgres Logs** o **Logs → API Logs**
2. Busca errores relacionados con:
   - "schema"
   - "permission"
   - "auth"
   - El email que estás usando

**Los logs te darán el error exacto que está causando el problema.**

### Solución 3: Verificar Funciones y Triggers

Ejecuta el script `SOLUCION_ERROR_SCHEMA_LOGIN.sql` en el SQL Editor de Supabase para verificar si hay funciones o triggers problemáticos.

**Si encuentras funciones problemáticas:**
```sql
-- Deshabilitar función temporalmente
ALTER FUNCTION nombre_funcion() DISABLE;
```

### Solución 4: Verificar Configuración de Auth

1. Ve a **Authentication → Settings**
2. Verifica:
   - ✅ **Site URL**: `http://localhost:5173`
   - ✅ **Redirect URLs**: Incluye `http://localhost:5173/**`
   - ✅ **Enable Email Signup**: Habilitado
   - ✅ **Enable Email Confirmations**: Puede estar deshabilitado para desarrollo

### Solución 5: Crear Usuario Nuevo (Prueba)

Si el problema persiste, intenta crear un usuario completamente nuevo:

1. Ve a **Authentication → Users**
2. Click en **"Add user"**
3. Crea un usuario nuevo con email y contraseña diferentes
4. Copia el UUID
5. Inserta el UUID en `system_users`:
   ```sql
   INSERT INTO system_users (id, email, full_name, role, unit_id)
   VALUES (
     'UUID-NUEVO-USUARIO',
     'nuevo@test.com',
     'Usuario Test',
     'Admin',
     1
   );
   ```
6. Intenta hacer login con el nuevo usuario

**Si el nuevo usuario funciona**, el problema está específicamente con el usuario original.

### Solución 6: Contactar Soporte de Supabase

Si ninguna de las soluciones anteriores funciona:

1. Ve a **Settings → Support**
2. Crea un ticket de soporte
3. Incluye:
   - El mensaje de error completo
   - Los logs de Postgres/API
   - El email del usuario que está fallando
   - Los pasos que has intentado

## 🔍 Diagnóstico Detallado

### Paso 1: Verificar Usuario en auth.users

```sql
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  banned_until
FROM auth.users
WHERE email = 'admin.norte@tec.mx';
```

**Verificaciones:**
- ✅ Usuario existe
- ✅ `banned_until` es NULL (no está baneado)
- ✅ `email_confirmed_at` puede ser NULL (no es crítico para desarrollo)

### Paso 2: Verificar Perfil del Usuario

```sql
SELECT 
  'system_users' as tabla,
  id,
  email,
  full_name,
  role
FROM system_users
WHERE email = 'admin.norte@tec.mx'
UNION ALL
SELECT 
  'client_portal_users' as tabla,
  id,
  email,
  full_name,
  role
FROM client_portal_users
WHERE email = 'admin.norte@tec.mx';
```

**Verificaciones:**
- ✅ Usuario tiene perfil en una de las tablas
- ✅ UUID coincide con `auth.users`
- ✅ Campo `role` no es NULL

### Paso 3: Probar Login Directo desde Supabase

1. Ve a **Authentication → Users**
2. Click en el usuario
3. Click en **"Send Magic Link"** o **"Reset Password"**
4. Esto verifica que el usuario puede autenticarse desde el dashboard

**Si esto funciona**, el problema está en el código del frontend o en la configuración de Auth.

## 📝 Checklist Final

Antes de contactar soporte, verifica:

- [ ] Proyecto está activo (no pausado)
- [ ] No has excedido límites de API
- [ ] Usuario existe en `auth.users`
- [ ] Usuario no está baneado (`banned_until` es NULL)
- [ ] Usuario tiene perfil en `system_users` o `client_portal_users`
- [ ] UUID coincide entre `auth.users` y la tabla de perfiles
- [ ] Campo `role` no es NULL
- [ ] RLS está deshabilitado en todas las tablas
- [ ] Site URL está configurado correctamente
- [ ] No hay funciones o triggers problemáticos
- [ ] Logs de Supabase no muestran errores adicionales

## 🆘 Si Nada Funciona

El error "Database error querying schema" puede ser un problema del servidor de Supabase. En este caso:

1. **Espera unos minutos** y vuelve a intentar (puede ser un problema temporal)
2. **Verifica el estado de Supabase**: https://status.supabase.com/
3. **Contacta soporte de Supabase** con toda la información de diagnóstico

