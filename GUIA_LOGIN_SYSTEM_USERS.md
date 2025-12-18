# 🔐 Guía para Iniciar Sesión con system_users

## ✅ Verificaciones Necesarias

### 1. Usuario en Supabase Auth

El usuario **DEBE existir** en `auth.users` de Supabase:

1. Ve a tu proyecto: https://supabase.com/dashboard/project/lfxglcvphlwntathpucx
2. Navega a **Authentication → Users**
3. Verifica que el usuario existe con el email que quieres usar
4. Si no existe, créalo:
   - Click en **"Add user"** o **"Invite user"**
   - Ingresa el email y contraseña
   - Guarda el **UUID** del usuario (lo necesitarás para el paso 2)

### 2. Registro en la Tabla `system_users`

El usuario **DEBE tener un registro** en la tabla `system_users` con:

- `id` = UUID del usuario en `auth.users` (debe ser exactamente el mismo)
- `email` = Email del usuario
- `full_name` = Nombre completo
- `role` = Rol (ej: "Admin", "SuperAdmin")
- `unit_id` = ID de la unidad (puede ser null)

**Ejemplo de registro:**
```sql
INSERT INTO system_users (id, email, full_name, role, unit_id)
VALUES (
  'uuid-del-usuario-de-auth-users',  -- ⚠️ DEBE ser el mismo UUID de auth.users
  'admin@tec.mx',
  'Admin Test',
  'Admin',
  1
);
```

### 3. Verificar Políticas RLS (Row Level Security)

Asegúrate de que las políticas RLS permitan leer la tabla:

```sql
-- Verificar si RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'system_users';

-- Si RLS está habilitado, crear política para permitir lectura
-- (ajusta según tus necesidades de seguridad)
CREATE POLICY "Users can read their own profile" ON system_users
  FOR SELECT
  USING (auth.uid() = id);
```

### 4. Verificar Estructura de la Tabla

Asegúrate de que la tabla `system_users` tenga estos campos:

```sql
-- Ver estructura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'system_users'
ORDER BY ordinal_position;
```

Debe tener:
- ✅ `id` (uuid, NOT NULL)
- ✅ `email` (varchar)
- ✅ `full_name` (varchar)
- ✅ `role` (varchar, NOT NULL)
- ✅ `unit_id` (integer, nullable)
- ✅ `created_at` (timestamp)

## 🧪 Cómo Probar

### Paso 1: Verificar que el usuario existe en ambas tablas

Ejecuta en el SQL Editor de Supabase:

```sql
-- Verificar usuario en auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'tu-email@ejemplo.com';

-- Verificar usuario en system_users
SELECT id, email, full_name, role, unit_id 
FROM system_users 
WHERE email = 'tu-email@ejemplo.com';

-- Verificar que los IDs coinciden
SELECT 
  au.id as auth_id,
  su.id as system_user_id,
  au.email as auth_email,
  su.email as system_email,
  CASE 
    WHEN au.id = su.id THEN '✅ IDs coinciden'
    ELSE '❌ IDs NO coinciden'
  END as status
FROM auth.users au
LEFT JOIN system_users su ON au.email = su.email
WHERE au.email = 'tu-email@ejemplo.com';
```

### Paso 2: Probar el login en tu aplicación

1. Inicia tu servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Ve a la página de login
3. Ingresa el email y contraseña del usuario
4. Revisa la consola del navegador (F12) para ver errores

### Paso 3: Verificar en la Consola

Si hay errores, revisa:

1. **Error de autenticación**: El email/password no coinciden en `auth.users`
2. **Error "relation does not exist"**: La tabla `system_users` no existe o tiene otro nombre
3. **Error "permission denied"**: Las políticas RLS están bloqueando el acceso
4. **Error "no rows returned"**: El usuario no existe en `system_users` o el UUID no coincide

## 🔧 Solución de Problemas

### Problema: "Invalid login credentials"
**Solución**: 
- Verifica que el usuario existe en `auth.users`
- Verifica que el email y password son correctos
- Si acabas de crear el usuario, asegúrate de que la contraseña esté correctamente configurada

### Problema: "No se pudo obtener el perfil del usuario"
**Solución**:
- Verifica que el usuario existe en `system_users`
- Verifica que el `id` en `system_users` coincide exactamente con el `id` en `auth.users`
- Verifica las políticas RLS

### Problema: "permission denied for table system_users"
**Solución**:
- Deshabilita temporalmente RLS para probar:
  ```sql
  ALTER TABLE system_users DISABLE ROW LEVEL SECURITY;
  ```
- O crea una política que permita lectura:
  ```sql
  CREATE POLICY "Allow authenticated users to read system_users" 
  ON system_users FOR SELECT 
  TO authenticated 
  USING (true);
  ```

### Problema: El usuario se autentica pero no tiene datos del perfil
**Solución**:
- Verifica que el registro en `system_users` tiene todos los campos necesarios
- Revisa la consola del navegador para ver el error específico
- Verifica que `full_name` y `role` no son null

## 📝 Checklist Final

Antes de intentar iniciar sesión, verifica:

- [ ] Usuario existe en `auth.users`
- [ ] Usuario existe en `system_users`
- [ ] El `id` (UUID) es el mismo en ambas tablas
- [ ] El `email` coincide en ambas tablas
- [ ] `full_name` tiene un valor
- [ ] `role` tiene un valor
- [ ] Las políticas RLS permiten lectura (o RLS está deshabilitado)
- [ ] El archivo `.env` tiene las credenciales correctas de Supabase
- [ ] El servidor de desarrollo está corriendo

## 🎯 Ejemplo Completo

```sql
-- 1. Crear usuario en auth.users (desde el dashboard o con SQL)
-- Nota: Normalmente se hace desde el dashboard de Supabase

-- 2. Obtener el UUID del usuario creado
SELECT id, email FROM auth.users WHERE email = 'admin@tec.mx';

-- 3. Insertar en system_users con el mismo UUID
INSERT INTO system_users (id, email, full_name, role, unit_id)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  -- UUID de auth.users
  'admin@tec.mx',
  'Administrador Test',
  'Admin',
  1
);

-- 4. Verificar
SELECT * FROM system_users WHERE email = 'admin@tec.mx';
```

## 💡 Nota Importante

El campo `id` en `system_users` **DEBE ser exactamente el mismo UUID** que el `id` en `auth.users`. Este es el vínculo entre la autenticación y el perfil del usuario.

