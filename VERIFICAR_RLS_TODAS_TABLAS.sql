-- ============================================
-- VERIFICAR RLS EN TODAS LAS TABLAS
-- ============================================
-- Ejecuta esto para ver el estado de RLS en todas las tablas relevantes

SELECT 
  tablename as tabla,
  CASE 
    WHEN rowsecurity THEN '⚠️ RLS HABILITADO'
    ELSE '✅ RLS DESHABILITADO'
  END as estado_rls,
  CASE 
    WHEN rowsecurity THEN 'Necesita políticas o deshabilitar RLS'
    ELSE 'OK - Sin restricciones'
  END as accion_necesaria
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'system_users', 
  'client_portal_users', 
  'clients', 
  'receivables', 
  'payments'
)
ORDER BY 
  CASE WHEN rowsecurity THEN 0 ELSE 1 END, -- RLS habilitado primero
  tablename;

-- ============================================
-- SOLUCIÓN: Deshabilitar RLS en todas las tablas
-- ============================================
-- Si alguna tabla tiene RLS habilitado, ejecuta esto:

ALTER TABLE system_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_portal_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE receivables DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Verificar que todas están deshabilitadas
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '⚠️ AÚN HABILITADO'
    ELSE '✅ DESHABILITADO'
  END as estado_final
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('system_users', 'client_portal_users', 'clients', 'receivables', 'payments')
ORDER BY tablename;

