-- ============================================
-- DIAGNÓSTICO ESPECÍFICO: Error 500 en /auth/v1/token
-- ============================================
-- Este error ocurre DURANTE el proceso de autenticación en Supabase
-- Generalmente se debe a que el usuario no existe o hay problemas de configuración

-- ============================================
-- PASO 1: Verificar si el usuario existe en auth.users
-- ============================================
-- Reemplaza 'admin.norte@tec.mx' con el email que estás usando
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at,
  confirmed_at,
  banned_until
FROM auth.users
WHERE email = 'admin.norte@tec.mx';

-- Si NO aparece ningún resultado, el usuario NO existe y necesitas crearlo
-- Si aparece un resultado, copia el UUID (columna 'id') y continúa con el Paso 2

-- ============================================
-- PASO 2: Verificar si el usuario tiene registro en system_users o client_portal_users
-- ============================================
-- Reemplaza 'UUID-DEL-USUARIO' con el UUID que copiaste del Paso 1
-- Si no tienes UUID aún, primero ejecuta el Paso 1

-- Verificar en system_users
SELECT 
  id,
  email,
  full_name,
  role,
  unit_id,
  created_at
FROM system_users
WHERE id = 'UUID-DEL-USUARIO'  -- ⚠️ Reemplaza con el UUID real
   OR email = 'admin.norte@tec.mx';  -- O busca por email

-- Verificar en client_portal_users
SELECT 
  id,
  email,
  full_name,
  role,
  client_id,
  is_active,
  created_at
FROM client_portal_users
WHERE id = 'UUID-DEL-USUARIO'  -- ⚠️ Reemplaza con el UUID real
   OR email = 'admin.norte@tec.mx';  -- O busca por email

-- ============================================
-- PASO 3: Verificar que los UUIDs coinciden
-- ============================================
-- Este query verifica que el UUID en auth.users coincide con el de las tablas de perfiles
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  au.email_confirmed_at,
  su.id as system_user_id,
  su.email as system_user_email,
  su.role as system_user_role,
  cpu.id as client_user_id,
  cpu.email as client_user_email,
  cpu.role as client_user_role,
  CASE 
    WHEN au.id = su.id THEN '✅ UUID coincide en system_users'
    WHEN au.id = cpu.id THEN '✅ UUID coincide en client_portal_users'
    WHEN su.id IS NULL AND cpu.id IS NULL THEN '❌ Usuario NO tiene perfil en ninguna tabla'
    ELSE '⚠️ UUID NO coincide'
  END as estado
FROM auth.users au
LEFT JOIN system_users su ON au.id = su.id
LEFT JOIN client_portal_users cpu ON au.id = cpu.id
WHERE au.email = 'admin.norte@tec.mx';  -- ⚠️ Reemplaza con tu email

-- ============================================
-- SOLUCIÓN: Crear usuario si no existe
-- ============================================
-- Si el usuario NO existe en auth.users, créalo desde el dashboard:
-- 1. Ve a: https://supabase.com/dashboard/project/lfxglcvphlwntathpucx
-- 2. Navega a Authentication → Users
-- 3. Click en "Add user" o "Invite user"
-- 4. Ingresa el email y contraseña
-- 5. Copia el UUID generado
-- 6. Ejecuta el INSERT de abajo con ese UUID

-- Para system_users (reemplaza los valores):
/*
INSERT INTO system_users (id, email, full_name, role, unit_id)
VALUES (
  'UUID-DEL-USUARIO',  -- ⚠️ DEBE ser el UUID de auth.users
  'admin.norte@tec.mx',
  'Admin Norte',
  'Admin',
  1  -- Ajusta el unit_id según corresponda
);
*/

-- Para client_portal_users (reemplaza los valores):
/*
INSERT INTO client_portal_users (id, email, full_name, role, client_id, is_active)
VALUES (
  'UUID-DEL-USUARIO',  -- ⚠️ DEBE ser el UUID de auth.users
  'cliente@ejemplo.com',
  'Cliente Test',
  'Admin',
  1,  -- Ajusta el client_id según corresponda
  true
);
*/

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
-- Después de crear el usuario, ejecuta esto para verificar que todo está correcto:
SELECT 
  'auth.users' as tabla,
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmado
FROM auth.users
WHERE email = 'admin.norte@tec.mx'
UNION ALL
SELECT 
  'system_users' as tabla,
  id,
  email,
  role IS NOT NULL as tiene_rol
FROM system_users
WHERE email = 'admin.norte@tec.mx'
UNION ALL
SELECT 
  'client_portal_users' as tabla,
  id,
  email,
  role IS NOT NULL as tiene_rol
FROM client_portal_users
WHERE email = 'admin.norte@tec.mx';

