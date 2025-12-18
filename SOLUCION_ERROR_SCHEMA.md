# 🔧 Solución: "Database error querying schema"

## 🔍 Causa del Error

El error "Database error querying schema" generalmente ocurre por:

1. **Políticas RLS (Row Level Security) bloqueando el acceso**
2. **RLS habilitado sin políticas que permitan lectura**
3. **El usuario autenticado no tiene permisos para leer las tablas**

## ✅ Solución Rápida (Temporal para Desarrollo)

Si estás en desarrollo y quieres probar rápidamente, puedes deshabilitar temporalmente RLS:

```sql
-- Deshabilitar RLS temporalmente (SOLO PARA DESARROLLO)
ALTER TABLE system_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_portal_users DISABLE ROW LEVEL SECURITY;
```

⚠️ **ADVERTENCIA**: Esto permite acceso completo a las tablas. Solo úsalo en desarrollo.

## 🔒 Solución Correcta (Políticas RLS)

### 1. Verificar Estado de RLS

```sql
-- Verificar si RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('system_users', 'client_portal_users');
```

### 2. Crear Políticas RLS para system_users

```sql
-- Política: Los usuarios pueden leer su propio perfil
CREATE POLICY "Users can read their own system_user profile" 
ON system_users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Si necesitas que los administradores vean otros perfiles:
-- (Ajusta según tus necesidades)
CREATE POLICY "Admins can read all system_users" 
ON system_users FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM system_users 
    WHERE id = auth.uid() 
    AND role IN ('Admin', 'SuperAdmin')
  )
);
```

### 3. Crear Políticas RLS para client_portal_users

```sql
-- Política: Los usuarios pueden leer su propio perfil
CREATE POLICY "Users can read their own client_portal_user profile" 
ON client_portal_users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);
```

### 4. Verificar Políticas Existentes

```sql
-- Ver políticas de system_users
SELECT * FROM pg_policies WHERE tablename = 'system_users';

-- Ver políticas de client_portal_users
SELECT * FROM pg_policies WHERE tablename = 'client_portal_users';
```

### 5. Eliminar Políticas Incorrectas (si es necesario)

```sql
-- Eliminar política específica
DROP POLICY "nombre_de_la_politica" ON system_users;
DROP POLICY "nombre_de_la_politica" ON client_portal_users;
```

## 🧪 Probar las Políticas

### Opción 1: Desde Supabase Dashboard

1. Ve a: https://supabase.com/dashboard/project/lfxglcvphlwntathpucx
2. Navega a **Authentication → Policies**
3. Selecciona la tabla `system_users` o `client_portal_users`
4. Verifica que existan políticas de SELECT para usuarios autenticados

### Opción 2: Desde SQL Editor

```sql
-- Probar consulta como usuario autenticado
-- (Esto simula lo que hace tu aplicación)
SELECT * FROM system_users WHERE id = auth.uid();
```

## 📋 Checklist de Verificación

- [ ] RLS está habilitado en las tablas
- [ ] Existe al menos una política de SELECT para usuarios autenticados
- [ ] La política permite que `auth.uid() = id` (usuario lee su propio perfil)
- [ ] El usuario está autenticado cuando se hace la consulta
- [ ] El UUID del usuario en `auth.users` coincide con el `id` en `system_users` o `client_portal_users`

## 🔍 Debugging

### Ver el Error Completo

Abre la consola del navegador (F12) y busca el error completo. Debería mostrar algo como:

```
Error al obtener perfil de system_users: {
  message: "...",
  code: "...",
  details: "..."
}
```

### Verificar que el Usuario Está Autenticado

En la consola del navegador, ejecuta:

```javascript
// Verificar sesión
const { data: { session } } = await supabase.auth.getSession()
console.log('Sesión:', session)

// Verificar usuario
const { data: { user } } = await supabase.auth.getUser()
console.log('Usuario:', user)
```

### Verificar Acceso a las Tablas

```javascript
// Probar acceso directo
const { data, error } = await supabase
  .from('system_users')
  .select('*')
  .eq('id', 'tu-uuid-aqui')
  .single()

console.log('Datos:', data)
console.log('Error:', error)
```

## 💡 Políticas Recomendadas para Producción

### system_users

```sql
-- Permitir que usuarios lean su propio perfil
CREATE POLICY "Users read own profile" 
ON system_users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Permitir que super admins lean todos los perfiles
CREATE POLICY "SuperAdmins read all" 
ON system_users FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM system_users 
    WHERE id = auth.uid() 
    AND role = 'SuperAdmin'
  )
);
```

### client_portal_users

```sql
-- Permitir que usuarios lean su propio perfil
CREATE POLICY "Users read own profile" 
ON client_portal_users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);
```

## 🚨 Si el Error Persiste

1. **Verifica que las tablas existen**:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('system_users', 'client_portal_users');
   ```

2. **Verifica que el usuario tiene el UUID correcto**:
   ```sql
   -- En auth.users
   SELECT id, email FROM auth.users WHERE email = 'tu-email@ejemplo.com';
   
   -- En system_users
   SELECT id, email FROM system_users WHERE email = 'tu-email@ejemplo.com';
   
   -- Deben coincidir
   ```

3. **Prueba deshabilitar RLS temporalmente** para confirmar que es un problema de políticas:
   ```sql
   ALTER TABLE system_users DISABLE ROW LEVEL SECURITY;
   ```
   Si funciona, el problema es definitivamente RLS.

4. **Revisa los logs de Supabase**:
   - Ve a Dashboard → Logs → Postgres Logs
   - Busca errores relacionados con las consultas

## 📝 Nota Importante

Después de configurar las políticas, **recarga la página** y vuelve a intentar el login. Las políticas RLS se evalúan en cada consulta.

