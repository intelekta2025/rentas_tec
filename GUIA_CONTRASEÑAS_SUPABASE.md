# 🔐 Guía: Contraseñas en Supabase

## 📍 ¿Dónde se Guardan las Contraseñas?

Las contraseñas de los usuarios se guardan en la tabla `auth.users` del schema `auth` en Supabase. Esta tabla es **manejada automáticamente por Supabase Auth** y no deberías modificarla directamente.

### Estructura de `auth.users`

```sql
-- Ver estructura de auth.users
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth'
AND table_name = 'users'
ORDER BY ordinal_position;
```

**Campos importantes:**
- `id` (UUID) - ID único del usuario
- `email` - Email del usuario
- `encrypted_password` - Contraseña encriptada (hasheada con bcrypt)
- `email_confirmed_at` - Fecha de confirmación de email
- `created_at` - Fecha de creación
- `last_sign_in_at` - Último inicio de sesión
- `banned_until` - Fecha hasta la cual el usuario está baneado (NULL si no está baneado)

## 🔒 Seguridad de las Contraseñas

### ✅ Lo que Supabase Hace Automáticamente

1. **Encriptación**: Las contraseñas se hashean con bcrypt antes de guardarse
2. **No se pueden ver**: Las contraseñas nunca se almacenan en texto plano
3. **No se pueden recuperar**: Si olvidas una contraseña, debes usar "Reset Password"
4. **Validación automática**: Supabase valida la contraseña durante el login

### ⚠️ Lo que NO Debes Hacer

- ❌ **NO intentes ver las contraseñas** - Están encriptadas
- ❌ **NO modifiques `encrypted_password` directamente** - Usa las funciones de Supabase Auth
- ❌ **NO guardes contraseñas en otras tablas** - Solo en `auth.users`

## 👥 Ver Usuarios en Supabase

### Opción 1: Desde el Dashboard (Recomendado)

1. Ve a: https://supabase.com/dashboard/project/lfxglcvphlwntathpucx
2. Navega a **Authentication → Users**
3. Verás la lista de todos los usuarios con:
   - Email
   - UUID
   - Fecha de creación
   - Último login
   - Estado (activo/banneado)

### Opción 2: Desde SQL Editor

```sql
-- Ver usuarios (sin contraseñas, están encriptadas)
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  banned_until,
  -- encrypted_password está ahí pero no puedes verla en texto plano
  CASE 
    WHEN encrypted_password IS NOT NULL THEN '✅ Contraseña configurada'
    ELSE '❌ Sin contraseña'
  END as password_status
FROM auth.users
ORDER BY created_at DESC;
```

## 🔑 Gestión de Contraseñas

### Crear Usuario con Contraseña

#### Opción 1: Desde el Dashboard (Recomendado)

1. Ve a **Authentication → Users**
2. Click en **"Add user"** o **"Invite user"**
3. Ingresa:
   - **Email**: `usuario@ejemplo.com`
   - **Password**: La contraseña que quieras
   - **Auto Confirm User**: ✅ Marca esta opción (para desarrollo)
4. Click en **"Create user"**

#### Opción 2: Desde el Código (Frontend)

```javascript
// Crear usuario desde el frontend
const { data, error } = await supabase.auth.signUp({
  email: 'usuario@ejemplo.com',
  password: 'contraseña_segura',
  options: {
    emailRedirectTo: 'http://localhost:5173'
  }
})
```

#### Opción 3: Desde SQL (NO RECOMENDADO)

```sql
-- ⚠️ NO RECOMENDADO: Crear usuario directamente en auth.users
-- Es mejor usar el dashboard o las funciones de Supabase Auth
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'usuario@ejemplo.com',
  crypt('contraseña_segura', gen_salt('bf')),  -- Encriptar con bcrypt
  NOW(),
  NOW(),
  NOW()
);
```

### Cambiar Contraseña

#### Opción 1: Desde el Dashboard

1. Ve a **Authentication → Users**
2. Click en el usuario
3. Click en **"Reset Password"**
4. Se enviará un email al usuario con un link para cambiar la contraseña

#### Opción 2: Desde el Código (Frontend)

```javascript
// Usuario solicita reset de contraseña
const { data, error } = await supabase.auth.resetPasswordForEmail(
  'usuario@ejemplo.com',
  {
    redirectTo: 'http://localhost:5173/reset-password'
  }
)

// Usuario cambia la contraseña (después de hacer click en el link del email)
const { data, error } = await supabase.auth.updateUser({
  password: 'nueva_contraseña_segura'
})
```

### Verificar si Usuario Tiene Contraseña

```sql
-- Verificar si un usuario tiene contraseña configurada
SELECT 
  id,
  email,
  CASE 
    WHEN encrypted_password IS NOT NULL THEN '✅ Tiene contraseña'
    ELSE '❌ Sin contraseña (solo OAuth)'
  END as password_status,
  created_at
FROM auth.users
WHERE email = 'admin.norte@tec.mx';
```

## 🔍 Verificar Usuario para Login

### Verificar que Usuario Existe y Tiene Contraseña

```sql
-- Verificar usuario completo
SELECT 
  id,
  email,
  email_confirmed_at,
  CASE 
    WHEN encrypted_password IS NOT NULL THEN '✅ Tiene contraseña'
    ELSE '❌ Sin contraseña'
  END as password_status,
  CASE 
    WHEN banned_until IS NULL THEN '✅ Activo'
    WHEN banned_until > NOW() THEN '❌ Banneado'
    ELSE '✅ Activo (ban expirado)'
  END as status,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'admin.norte@tec.mx';
```

## 🛠️ Solución de Problemas

### Problema: "Invalid login credentials"

**Causas posibles:**
1. Email incorrecto
2. Contraseña incorrecta
3. Usuario no existe en `auth.users`
4. Usuario no tiene contraseña configurada (solo OAuth)

**Solución:**
```sql
-- Verificar usuario
SELECT 
  id,
  email,
  CASE 
    WHEN encrypted_password IS NOT NULL THEN '✅ Tiene contraseña'
    ELSE '❌ Sin contraseña'
  END as password_status
FROM auth.users
WHERE email = 'admin.norte@tec.mx';
```

Si el usuario no tiene contraseña:
1. Ve a **Authentication → Users**
2. Click en el usuario
3. Click en **"Reset Password"**
4. O crea un nuevo usuario con contraseña

### Problema: Usuario existe pero no puede hacer login

**Verificaciones:**
1. ¿El usuario tiene contraseña? (ver SQL arriba)
2. ¿El usuario está baneado? (`banned_until` no es NULL)
3. ¿El email está confirmado? (puede ser necesario según configuración)

```sql
-- Verificar estado completo del usuario
SELECT 
  id,
  email,
  email_confirmed_at,
  banned_until,
  encrypted_password IS NOT NULL as has_password,
  CASE 
    WHEN banned_until IS NOT NULL AND banned_until > NOW() THEN '❌ BANNEADO'
    WHEN encrypted_password IS NULL THEN '❌ SIN CONTRASEÑA'
    WHEN email_confirmed_at IS NULL THEN '⚠️ EMAIL NO CONFIRMADO'
    ELSE '✅ OK'
  END as login_status
FROM auth.users
WHERE email = 'admin.norte@tec.mx';
```

## 📝 Resumen

- ✅ **Las contraseñas se guardan en `auth.users`** (schema `auth`)
- ✅ **Están encriptadas** (hasheadas con bcrypt)
- ✅ **No se pueden ver en texto plano**
- ✅ **Se gestionan desde el Dashboard o funciones de Supabase Auth**
- ❌ **NO modifiques `auth.users` directamente** (usa el dashboard o las funciones)

## 🔗 Recursos

- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Gestión de Usuarios](https://supabase.com/docs/guides/auth/managing-users)
- [Reset de Contraseñas](https://supabase.com/docs/guides/auth/reset-password-email)

