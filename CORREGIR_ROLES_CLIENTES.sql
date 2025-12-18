-- ============================================
-- CORREGIR ROLES DE USUARIOS CLIENTES
-- ============================================
-- Este script asegura que todos los usuarios de client_portal_users
-- tengan el rol 'Client' para que vean las pantallas correctas

-- ============================================
-- PASO 1: Verificar roles actuales
-- ============================================
SELECT 
  id,
  email,
  role,
  CASE 
    WHEN role = 'Client' THEN '✅ Correcto'
    WHEN role IS NULL THEN '⚠️ NULL - Se corregirá a Client'
    ELSE '⚠️ ' || role || ' - Se corregirá a Client'
  END as estado
FROM client_portal_users
ORDER BY email;

-- ============================================
-- PASO 2: Actualizar roles a 'Client'
-- ============================================
-- Esto actualiza todos los usuarios de client_portal_users para que tengan rol 'Client'
UPDATE client_portal_users
SET role = 'Client'
WHERE role IS NULL OR role != 'Client';

-- ============================================
-- PASO 3: Verificar que se actualizó correctamente
-- ============================================
SELECT 
  id,
  email,
  role,
  CASE 
    WHEN role = 'Client' THEN '✅ Correcto'
    ELSE '❌ Error - Debe ser Client'
  END as estado
FROM client_portal_users
ORDER BY email;

-- ============================================
-- NOTA IMPORTANTE
-- ============================================
-- El código en authService.js ahora fuerza el rol 'Client' para usuarios
-- de client_portal_users, pero es buena práctica tener el valor correcto
-- en la base de datos también.

