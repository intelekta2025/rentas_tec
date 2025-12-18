-- ============================================
-- SOLUCIÓN: Error "Database error querying schema" durante login
-- ============================================
-- Este error ocurre cuando Supabase intenta consultar el esquema durante el login
-- y encuentra algún problema (triggers, funciones, políticas, etc.)

-- ============================================
-- PASO 1: Verificar funciones que se ejecutan automáticamente
-- ============================================
-- Buscar funciones que puedan ejecutarse durante el login

SELECT 
  proname as function_name,
  pronamespace::regnamespace as schema,
  prosrc as function_body
FROM pg_proc
WHERE proname LIKE '%auth%'
   OR proname LIKE '%user%'
   OR proname LIKE '%login%'
   OR proname LIKE '%trigger%'
ORDER BY proname;

-- ============================================
-- PASO 2: Verificar triggers en tablas relacionadas
-- ============================================
-- Buscar triggers que puedan ejecutarse durante el login

SELECT 
  trigger_name,
  event_object_table,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND (
  event_object_table IN ('system_users', 'client_portal_users', 'clients')
  OR trigger_name LIKE '%auth%'
  OR trigger_name LIKE '%user%'
  OR trigger_name LIKE '%login%'
)
ORDER BY event_object_table, trigger_name;

-- ============================================
-- PASO 3: Verificar políticas RLS en auth schema
-- ============================================
-- Aunque RLS en public está deshabilitado, verificar auth schema

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
ORDER BY tablename, policyname;

-- ============================================
-- PASO 4: Verificar si hay funciones de seguridad definidas
-- ============================================
-- Funciones que pueden ejecutarse automáticamente

SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'auth')
AND (
  pg_get_functiondef(p.oid) LIKE '%auth%'
  OR pg_get_functiondef(p.oid) LIKE '%system_users%'
  OR pg_get_functiondef(p.oid) LIKE '%client_portal_users%'
)
ORDER BY n.nspname, p.proname;

-- ============================================
-- SOLUCIÓN TEMPORAL: Deshabilitar funciones problemáticas
-- ============================================
-- Si encuentras funciones que se ejecutan durante el login,
-- puedes deshabilitarlas temporalmente:

-- Ejemplo (reemplaza 'nombre_funcion' con el nombre real):
-- ALTER FUNCTION nombre_funcion() DISABLE;

-- ============================================
-- SOLUCIÓN ALTERNATIVA: Verificar configuración de Supabase Auth
-- ============================================
-- El error puede deberse a que Supabase Auth está intentando
-- consultar tablas que no existen o tienen problemas.

-- Verificar que las tablas existen:
SELECT 
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('system_users', 'client_portal_users', 'clients', 'receivables', 'payments')
ORDER BY table_name;

-- ============================================
-- SOLUCIÓN RECOMENDADA: Verificar logs de Supabase
-- ============================================
-- Ve a: Supabase Dashboard → Logs → Postgres Logs
-- Busca errores relacionados con:
-- - "schema"
-- - "permission"
-- - "auth"
-- - El email que estás usando para login

