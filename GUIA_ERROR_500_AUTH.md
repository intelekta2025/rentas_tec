# 🔧 Guía Completa: Error 500 en /auth/v1/token

## 📋 ¿Qué significa este error?

El error **500 Internal Server Error** en el endpoint `/auth/v1/token` indica que **Supabase está fallando al procesar tu solicitud de login**. Esto es un error del **servidor**, no del código del frontend.

## 🎯 Causa Más Común (90% de los casos)

**El usuario NO existe en `auth.users` de Supabase.**

Cuando intentas hacer login con un email que no está registrado en `auth.users`, Supabase devuelve un error 500.

## ✅ Solución Paso a Paso

### Paso 1: Verificar si el usuario existe

1. Ve a tu proyecto: https://supabase.com/dashboard/project/lfxglcvphlwntathpucx
2. Navega a **Authentication → Users**
3. Busca el usuario con el email que estás usando (ej: `admin.norte@tec.mx`)

**¿Qué hacer según el resultado?**

#### ❌ Si el usuario NO existe:

**Opción A: Crear desde el Dashboard (Recomendado)**
1. Click en **"Add user"** o **"Invite user"**
2. Ingresa:
   - **Email**: `admin.norte@tec.mx` (o el que estés usando)
   - **Password**: La contraseña que quieras usar
   - **Auto Confirm User**: ✅ Marca esta opción (importante)
3. Click en **"Create user"**
4. **IMPORTANTE**: Copia el **UUID** del usuario creado (aparece en la lista de usuarios)

**Opción B: Crear con SQL (Alternativa)**
```sql
-- Esto crea el usuario en auth.users
-- Nota: Necesitas permisos de superusuario, puede que no funcione desde el SQL Editor
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin.norte@tec.mx',
  crypt('tu_contraseña', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);
```

#### ✅ Si el usuario SÍ existe:

1. Copia el **UUID** del usuario (aparece en la lista)
2. Continúa con el Paso 2

### Paso 2: Verificar registro en tablas de perfiles

Ejecuta este SQL en el SQL Editor de Supabase (reemplaza el email y UUID):

```sql
-- Verificar si el usuario tiene perfil
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  su.id as system_user_id,
  su.email as system_user_email,
  su.role as system_user_role,
  cpu.id as client_user_id,
  cpu.email as client_user_email,
  cpu.role as client_user_role
FROM auth.users au
LEFT JOIN system_users su ON au.id = su.id
LEFT JOIN client_portal_users cpu ON au.id = cpu.id
WHERE au.email = 'admin.norte@tec.mx';  -- ⚠️ Reemplaza con tu email
```

**Interpretación de resultados:**

- ✅ Si `system_user_id` o `client_user_id` tiene un valor: El usuario tiene perfil, continúa con el Paso 3
- ❌ Si ambos son `NULL`: El usuario NO tiene perfil, necesitas crearlo (Paso 2.1)

#### Paso 2.1: Crear perfil del usuario

**Para `system_users` (administradores):**
```sql
-- Reemplaza 'UUID-DEL-USUARIO' con el UUID que copiaste del Paso 1
INSERT INTO system_users (id, email, full_name, role, unit_id)
VALUES (
  'UUID-DEL-USUARIO',  -- ⚠️ DEBE ser exactamente el mismo UUID de auth.users
  'admin.norte@tec.mx',
  'Admin Norte',
  'Admin',
  1  -- Ajusta el unit_id según corresponda
);
```

**Para `client_portal_users` (clientes):**
```sql
-- Reemplaza 'UUID-DEL-USUARIO' con el UUID que copiaste del Paso 1
INSERT INTO client_portal_users (id, email, full_name, role, client_id, is_active)
VALUES (
  'UUID-DEL-USUARIO',  -- ⚠️ DEBE ser exactamente el mismo UUID de auth.users
  'cliente@ejemplo.com',
  'Cliente Test',
  'Admin',
  1,  -- Ajusta el client_id según corresponda
  true
);
```

### Paso 3: Verificar configuración de Auth

1. Ve a **Authentication → Settings**
2. Verifica que:
   - ✅ **Enable Email Signup** está habilitado
   - ✅ **Enable Email Confirmations** puede estar deshabilitado para desarrollo
   - ✅ No hay restricciones de dominio de email

### Paso 4: Probar login de nuevo

1. Recarga la página con hard refresh: `Ctrl+Shift+R`
2. Intenta hacer login con el email y contraseña que configuraste
3. Si aún falla, revisa los logs (Paso 5)

### Paso 5: Revisar logs de Supabase

1. Ve a **Logs → Postgres Logs** o **Logs → API Logs**
2. Busca errores relacionados con el email que estás usando
3. Los logs te darán más detalles sobre qué está fallando

## 🔍 Diagnóstico Avanzado

Si después de seguir todos los pasos el error persiste, ejecuta el script `SOLUCION_ERROR_500_AUTH.sql` que incluye verificaciones más detalladas.

## 📝 Checklist Final

Antes de intentar login, verifica:

- [ ] Usuario existe en `auth.users` (verificado en Authentication → Users)
- [ ] El email del usuario está confirmado (o `email_confirmed_at` no es NULL)
- [ ] Usuario tiene registro en `system_users` O `client_portal_users`
- [ ] El UUID en la tabla de perfiles coincide EXACTAMENTE con el UUID en `auth.users`
- [ ] El campo `role` en la tabla de perfiles tiene un valor (no es NULL)
- [ ] RLS está deshabilitado en las tablas (ya lo verificaste antes)
- [ ] Email Auth está habilitado en Authentication → Settings

## ⚠️ Errores Comunes

### Error: "Usuario no autorizado. No se encontró perfil en el sistema."
**Solución**: El usuario existe en `auth.users` pero NO tiene registro en `system_users` o `client_portal_users`. Ejecuta el Paso 2.1.

### Error: "Usuario sin rol asignado"
**Solución**: El usuario tiene perfil pero el campo `role` es NULL. Actualiza el registro:
```sql
UPDATE system_users SET role = 'Admin' WHERE email = 'admin.norte@tec.mx';
```

### Error: "UUID no coincide"
**Solución**: El UUID en `system_users` o `client_portal_users` no coincide con el UUID en `auth.users`. Actualiza el registro:
```sql
-- Primero obtén el UUID correcto de auth.users
SELECT id FROM auth.users WHERE email = 'admin.norte@tec.mx';

-- Luego actualiza el registro en system_users
UPDATE system_users 
SET id = 'UUID-CORRECTO' 
WHERE email = 'admin.norte@tec.mx';
```

## 🆘 Si Nada Funciona

1. Verifica los logs de Supabase: **Logs → Postgres Logs**
2. Verifica el estado del proyecto: **Settings → General**
3. Intenta crear un usuario completamente nuevo desde cero
4. Contacta al soporte de Supabase si el problema persiste

