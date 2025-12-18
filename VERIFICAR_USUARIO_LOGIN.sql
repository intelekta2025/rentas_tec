-- ============================================
-- VERIFICAR USUARIO PARA LOGIN
-- ============================================
-- Este script verifica que un usuario puede hacer login
-- Reemplaza 'admin.norte@tec.mx' con el email que quieras verificar

-- ============================================
-- PASO 1: Verificar Usuario en auth.users
-- ============================================
SELECT 
  'auth.users' as tabla,
  id,
  email,
  email_confirmed_at,
  CASE 
    WHEN encrypted_password IS NOT NULL THEN '✅ Tiene contraseña'
    ELSE '❌ Sin contraseña'
  END as password_status,
  CASE 
    WHEN banned_until IS NULL THEN '✅ Activo'
    WHEN banned_until > NOW() THEN '❌ Banneado hasta ' || banned_until::text
    ELSE '✅ Activo (ban expirado)'
  END as status,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'admin.norte@tec.mx';  -- ⚠️ Reemplaza con tu email

-- ============================================
-- PASO 2: Verificar Perfil del Usuario
-- ============================================
-- Verificar si el usuario tiene perfil en system_users o client_portal_users
SELECT 
  'system_users' as tabla,
  id,
  email,
  full_name,
  role,
  unit_id,
  created_at
FROM system_users
WHERE email = 'admin.norte@tec.mx'  -- ⚠️ Reemplaza con tu email
   OR id = (SELECT id FROM auth.users WHERE email = 'admin.norte@tec.mx')
UNION ALL
SELECT 
  'client_portal_users' as tabla,
  id,
  email,
  full_name,
  role,
  client_id::text as unit_id,
  created_at
FROM client_portal_users
WHERE email = 'admin.norte@tec.mx'  -- ⚠️ Reemplaza con tu email
   OR id = (SELECT id FROM auth.users WHERE email = 'admin.norte@tec.mx');

-- ============================================
-- PASO 3: Verificación Completa
-- ============================================
-- Verificar que todo está correcto para hacer login
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  au.email_confirmed_at,
  CASE 
    WHEN au.encrypted_password IS NOT NULL THEN '✅ Tiene contraseña'
    ELSE '❌ Sin contraseña'
  END as password_status,
  CASE 
    WHEN au.banned_until IS NOT NULL AND au.banned_until > NOW() THEN '❌ BANNEADO'
    WHEN au.encrypted_password IS NULL THEN '❌ SIN CONTRASEÑA'
    WHEN su.id IS NULL AND cpu.id IS NULL THEN '❌ SIN PERFIL'
    WHEN su.role IS NULL AND cpu.role IS NULL THEN '❌ SIN ROL'
    ELSE '✅ OK PARA LOGIN'
  END as login_status,
  COALESCE(su.role, cpu.role) as role,
  COALESCE(su.full_name, cpu.full_name) as full_name
FROM auth.users au
LEFT JOIN system_users su ON au.id = su.id
LEFT JOIN client_portal_users cpu ON au.id = cpu.id
WHERE au.email = 'admin.norte@tec.mx';  -- ⚠️ Reemplaza con tu email

-- ============================================
-- SOLUCIÓN: Si el Usuario No Tiene Contraseña
-- ============================================
-- Si el usuario no tiene contraseña, créala desde el dashboard:
-- 1. Ve a Authentication → Users
-- 2. Click en el usuario
-- 3. Click en "Reset Password"
-- 4. O crea un nuevo usuario con contraseña

-- ============================================
-- SOLUCIÓN: Si el Usuario No Tiene Perfil
-- ============================================
-- Si el usuario no tiene perfil, créalo:
-- (Reemplaza 'UUID-DEL-USUARIO' con el UUID de auth.users)

-- Para system_users:
/*
INSERT INTO system_users (id, email, full_name, role, unit_id)
VALUES (
  'UUID-DEL-USUARIO',  -- ⚠️ DEBE ser el UUID de auth.users
  'admin.norte@tec.mx',
  'Admin Norte',
  'Admin',
  1
);
*/

-- Para client_portal_users:
/*
INSERT INTO client_portal_users (id, email, full_name, role, client_id, is_active)
VALUES (
  'UUID-DEL-USUARIO',  -- ⚠️ DEBE ser el UUID de auth.users
  'cliente@ejemplo.com',
  'Cliente Test',
  'Admin',
  1,
  true
);
*/

