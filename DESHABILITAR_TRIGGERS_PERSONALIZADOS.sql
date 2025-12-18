-- ============================================
-- DESHABILITAR TRIGGERS PERSONALIZADOS
-- ============================================
-- ⚠️ IMPORTANTE: Este script solo deshabilita triggers PERSONALIZADOS
-- Los triggers del sistema (RI_*) NO se pueden deshabilitar y no deben hacerlo

-- Paso 1: Ver qué triggers personalizados existen
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('system_users', 'client_portal_users', 'clients', 'receivables', 'payments')
AND trigger_name NOT LIKE 'RI_%'  -- Excluir triggers del sistema
AND trigger_name NOT LIKE 'pg_%'  -- Excluir triggers de PostgreSQL
ORDER BY event_object_table, trigger_name;

-- Paso 2: Si encuentras triggers personalizados arriba, deshabilítalos uno por uno
-- Ejemplo (reemplaza 'nombre_del_trigger' con el nombre real que encontraste):
-- ALTER TABLE system_users DISABLE TRIGGER nombre_del_trigger;
-- ALTER TABLE client_portal_users DISABLE TRIGGER nombre_del_trigger;

-- ============================================
-- NOTA IMPORTANTE
-- ============================================
-- Si NO encuentras triggers personalizados en el Paso 1, entonces:
-- 1. El problema NO son los triggers
-- 2. El error 500 probablemente se debe a:
--    - Usuario no existe en auth.users
--    - Problema de configuración en Supabase Auth
--    - Funciones que se ejecutan automáticamente
--
-- Continúa con el diagnóstico en SOLUCION_ERROR_500.md

