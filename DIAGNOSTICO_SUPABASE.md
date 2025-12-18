# 🔍 Diagnóstico: Database error querying schema

## Pasos para Diagnosticar

### 1. Verificar que las Tablas Existen

Ejecuta en el SQL Editor de Supabase:

```sql
-- Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('system_users', 'client_portal_users')
ORDER BY table_name;
```

**Resultado esperado:**
- Debe mostrar ambas tablas: `system_users` y `client_portal_users`

### 2. Verificar Estado de RLS

```sql
-- Verificar si RLS está habilitado
SELECT 
  tablename, 
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN 'RLS HABILITADO ⚠️'
    ELSE 'RLS DESHABILITADO ✅'
  END as estado
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('system_users', 'client_portal_users');
```

### 3. Verificar Políticas Existentes

```sql
-- Ver políticas de system_users
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'system_users';

-- Ver políticas de client_portal_users
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'client_portal_users';
```

### 4. Probar Consulta Directa

```sql
-- Obtener tu UUID de usuario
SELECT id, email FROM auth.users WHERE email = 'tu-email@ejemplo.com';

-- Probar consulta a system_users (reemplaza el UUID)
SELECT * FROM system_users WHERE id = 'tu-uuid-aqui';

-- Probar consulta a client_portal_users (reemplaza el UUID)
SELECT * FROM client_portal_users WHERE id = 'tu-uuid-aqui';
```

## 🔧 Soluciones Según el Diagnóstico

### Si RLS está HABILITADO y NO hay políticas:

**Solución:** Crear las políticas o deshabilitar RLS temporalmente

```sql
-- OPCIÓN 1: Crear políticas (RECOMENDADO)
CREATE POLICY "Users can read own system_user profile" 
ON system_users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Users can read own client_portal_user profile" 
ON client_portal_users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- OPCIÓN 2: Deshabilitar RLS temporalmente (SOLO DESARROLLO)
ALTER TABLE system_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_portal_users DISABLE ROW LEVEL SECURITY;
```

### Si las Tablas NO Existen:

**Solución:** Crear las tablas

```sql
-- Crear tabla system_users
CREATE TABLE system_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  unit_id INTEGER,
  full_name VARCHAR,
  email VARCHAR,
  role VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla client_portal_users
CREATE TABLE client_portal_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  client_id INTEGER NOT NULL,
  full_name VARCHAR,
  email VARCHAR,
  role VARCHAR DEFAULT 'Admin',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Si hay Políticas pero NO Funcionan:

**Solución:** Eliminar y recrear las políticas

```sql
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can read own system_user profile" ON system_users;
DROP POLICY IF EXISTS "Users can read own client_portal_user profile" ON client_portal_users;

-- Crear nuevas políticas
CREATE POLICY "Users can read own system_user profile" 
ON system_users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Users can read own client_portal_user profile" 
ON client_portal_users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);
```

## 🧪 Prueba Rápida desde el Navegador

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Verificar conexión a Supabase
import { supabase } from './src/lib/supabase.js'

// Probar consulta directa
const { data, error } = await supabase
  .from('system_users')
  .select('*')
  .limit(1)

console.log('Datos:', data)
console.log('Error:', error)
```

## 📋 Checklist Completo

- [ ] Las tablas `system_users` y `client_portal_users` existen
- [ ] El usuario existe en `auth.users`
- [ ] El usuario tiene un registro en `system_users` o `client_portal_users` con el mismo UUID
- [ ] RLS está configurado correctamente (políticas o deshabilitado)
- [ ] Las políticas permiten que `auth.uid() = id`
- [ ] El archivo `.env` tiene las credenciales correctas
- [ ] El código usa `client_portal_users` (no `client_users`)

## 🚨 Solución de Emergencia (Solo Desarrollo)

Si necesitas que funcione inmediatamente para desarrollo:

```sql
-- Deshabilitar RLS completamente (SOLO PARA DESARROLLO)
ALTER TABLE system_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_portal_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE receivables DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
```

⚠️ **ADVERTENCIA**: Esto permite acceso completo. Solo para desarrollo local.

