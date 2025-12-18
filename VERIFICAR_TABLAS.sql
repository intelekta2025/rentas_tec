-- ============================================
-- SCRIPT DE VERIFICACIÓN DE TABLAS
-- ============================================
-- Ejecuta esto en el SQL Editor de Supabase para verificar el estado

-- 1. Verificar que las tablas existen
SELECT 
  'Tablas Existentes' as verificacion,
  table_name as tabla,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ Existe'
    ELSE '❌ No existe'
  END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('system_users', 'client_portal_users', 'clients', 'receivables', 'payments')
ORDER BY table_name;

-- 2. Verificar estado de RLS
SELECT 
  'Estado RLS' as verificacion,
  tablename as tabla,
  CASE 
    WHEN rowsecurity THEN '⚠️ RLS HABILITADO'
    ELSE '✅ RLS DESHABILITADO'
  END as estado
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('system_users', 'client_portal_users', 'clients', 'receivables', 'payments')
ORDER BY tablename;

-- 3. Verificar políticas existentes
SELECT 
  'Políticas RLS' as verificacion,
  tablename as tabla,
  policyname as politica,
  cmd as operacion,
  CASE 
    WHEN policyname IS NOT NULL THEN '✅ Tiene política'
    ELSE '❌ Sin política'
  END as estado
FROM pg_policies 
WHERE tablename IN ('system_users', 'client_portal_users', 'clients', 'receivables', 'payments')
ORDER BY tablename, policyname;

-- 4. Verificar usuarios en auth.users
SELECT 
  'Usuarios Auth' as verificacion,
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as con_email
FROM auth.users;

-- 5. Verificar usuarios en system_users
SELECT 
  'Usuarios System' as verificacion,
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN role IS NOT NULL THEN 1 END) as con_rol
FROM system_users;

-- 6. Verificar usuarios en client_portal_users
SELECT 
  'Usuarios Client Portal' as verificacion,
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN client_id IS NOT NULL THEN 1 END) as con_client_id
FROM client_portal_users;

