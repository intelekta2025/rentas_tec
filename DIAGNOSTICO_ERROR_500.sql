-- ============================================
-- DIAGNÓSTICO: Error 500 "Database error querying schema"
-- ============================================
-- Este error generalmente ocurre cuando hay triggers o funciones
-- que se ejecutan durante el login y tienen problemas de permisos

-- 1. Verificar si hay triggers en las tablas relacionadas
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('system_users', 'client_portal_users', 'clients', 'receivables', 'payments')
ORDER BY event_object_table, trigger_name;

-- 2. Verificar si hay funciones que se ejecutan automáticamente
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (
  routine_definition LIKE '%auth%' 
  OR routine_definition LIKE '%system_users%'
  OR routine_definition LIKE '%client_portal_users%'
)
ORDER BY routine_name;

-- 3. Verificar si el usuario existe en auth.users
-- (Ejecuta esto reemplazando 'admin.norte@tec.mx' con el email que estás usando)
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'admin.norte@tec.mx';

-- 4. Verificar si hay políticas RLS en auth.users (no debería haber, pero verificar)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'auth'
AND tablename = 'users';

-- 5. Verificar si hay funciones de seguridad definidas
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname LIKE '%auth%'
OR proname LIKE '%user%'
ORDER BY proname;

-- ============================================
-- SOLUCIÓN 1: Verificar triggers personalizados (excluyendo triggers del sistema)
-- ============================================
-- ⚠️ IMPORTANTE: Los triggers del sistema (RI_*) NO se pueden deshabilitar
-- Solo deshabilita triggers personalizados que puedas haber creado

-- Ver solo triggers personalizados
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('system_users', 'client_portal_users')
AND trigger_name NOT LIKE 'RI_%'  -- Excluir triggers del sistema (Referential Integrity)
ORDER BY event_object_table, trigger_name;

-- Si encuentras triggers personalizados, deshabilítalos por nombre:
-- ALTER TABLE system_users DISABLE TRIGGER nombre_del_trigger;
-- ALTER TABLE client_portal_users DISABLE TRIGGER nombre_del_trigger;

-- ============================================
-- SOLUCIÓN 2: Verificar configuración de Supabase Auth
-- ============================================
-- Ve a: Supabase Dashboard → Authentication → Settings
-- Verifica que:
-- - Email Auth está habilitado
-- - No hay restricciones de dominio
-- - No hay políticas de contraseña muy estrictas

-- ============================================
-- SOLUCIÓN 3: Verificar que el usuario existe correctamente
-- ============================================
-- Si el usuario NO existe en auth.users, créalo desde el dashboard:
-- 1. Ve a Authentication → Users
-- 2. Click en "Add user" o "Invite user"
-- 3. Ingresa email y contraseña
-- 4. Copia el UUID generado
-- 5. Inserta ese UUID en system_users o client_portal_users

