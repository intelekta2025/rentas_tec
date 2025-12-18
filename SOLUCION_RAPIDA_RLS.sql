-- ============================================
-- SOLUCIÓN RÁPIDA: Deshabilitar RLS (SOLO DESARROLLO)
-- ============================================
-- Ejecuta esto en el SQL Editor de Supabase si necesitas que funcione inmediatamente
-- ⚠️ ADVERTENCIA: Esto permite acceso completo a las tablas. Solo para desarrollo local.

-- Deshabilitar RLS en todas las tablas
ALTER TABLE system_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_portal_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE receivables DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
SELECT 
  tablename, 
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN 'RLS HABILITADO ⚠️'
    ELSE 'RLS DESHABILITADO ✅'
  END as estado
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('system_users', 'client_portal_users', 'clients', 'receivables', 'payments')
ORDER BY tablename;

-- ============================================
-- SOLUCIÓN CORRECTA: Crear Políticas RLS
-- ============================================
-- Usa esto en producción o cuando quieras seguridad adecuada

-- Políticas para system_users
CREATE POLICY IF NOT EXISTS "Users can read own system_user profile" 
ON system_users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Políticas para client_portal_users
CREATE POLICY IF NOT EXISTS "Users can read own client_portal_user profile" 
ON client_portal_users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Políticas para clients (ajusta según tus necesidades)
CREATE POLICY IF NOT EXISTS "Users can read clients" 
ON clients FOR SELECT 
TO authenticated 
USING (true); -- Ajusta esta condición según tus necesidades

-- Políticas para receivables (ajusta según tus necesidades)
CREATE POLICY IF NOT EXISTS "Users can read receivables" 
ON receivables FOR SELECT 
TO authenticated 
USING (true); -- Ajusta esta condición según tus necesidades

-- Políticas para payments (ajusta según tus necesidades)
CREATE POLICY IF NOT EXISTS "Users can read payments" 
ON payments FOR SELECT 
TO authenticated 
USING (true); -- Ajusta esta condición según tus necesidades

