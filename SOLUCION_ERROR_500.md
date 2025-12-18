# 🔧 Solución: Error 500 "Database error querying schema"

## 📋 Diagnóstico

Este error ocurre durante `signInWithPassword` y generalmente se debe a:

1. **Triggers problemáticos**: Triggers que se ejecutan durante el login y tienen errores de permisos
2. **Funciones automáticas**: Funciones que se ejecutan en eventos de auth y fallan
3. **Usuario no existe**: El usuario no existe en `auth.users` de Supabase
4. **Configuración de Auth**: Problemas en la configuración de Supabase Authentication

## ✅ Pasos para Solucionar

### Paso 1: Verificar que el usuario existe en Supabase Auth

1. Ve a tu proyecto: https://supabase.com/dashboard/project/lfxglcvphlwntathpucx
2. Navega a **Authentication → Users**
3. Busca el usuario con el email que estás usando (ej: `admin.norte@tec.mx`)
4. Si **NO existe**, créalo:
   - Click en **"Add user"** o **"Invite user"**
   - Ingresa el email y contraseña
   - **IMPORTANTE**: Copia el **UUID** del usuario creado
   - Luego inserta ese UUID en `system_users` o `client_portal_users`

### Paso 2: Verificar triggers y funciones

Ejecuta el script `DIAGNOSTICO_ERROR_500.sql` en el SQL Editor de Supabase para verificar si hay triggers o funciones problemáticas.

### Paso 3: Deshabilitar triggers personalizados (si existen)

⚠️ **IMPORTANTE**: Los triggers del sistema (que empiezan con `RI_`) NO se pueden deshabilitar. Solo deshabilita triggers personalizados.

Primero, ejecuta el script de diagnóstico para ver qué triggers tienes:

```sql
-- Ver solo triggers personalizados (excluyendo triggers del sistema)
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('system_users', 'client_portal_users')
AND trigger_name NOT LIKE 'RI_%'  -- Excluir triggers del sistema
ORDER BY event_object_table, trigger_name;
```

Si encuentras triggers personalizados, deshabilítalos por nombre:

```sql
-- Ejemplo: Deshabilitar un trigger personalizado específico
-- (Reemplaza 'nombre_del_trigger' con el nombre real)
ALTER TABLE system_users DISABLE TRIGGER nombre_del_trigger;
ALTER TABLE client_portal_users DISABLE TRIGGER nombre_del_trigger;
```

**Nota**: Si no encuentras triggers personalizados, el problema NO son los triggers. Continúa con el Paso 4.

### Paso 4: Verificar configuración de Supabase Auth

1. Ve a **Authentication → Settings**
2. Verifica que:
   - ✅ **Email Auth** está habilitado
   - ✅ No hay restricciones de dominio de email
   - ✅ Las políticas de contraseña no son demasiado estrictas

### Paso 5: Crear usuario manualmente (si no existe)

Si el usuario no existe en `auth.users`, créalo desde el dashboard y luego ejecuta:

```sql
-- Reemplaza 'UUID-DEL-USUARIO' con el UUID que copiaste del dashboard
-- Reemplaza los demás valores según tu caso

-- Para system_users:
INSERT INTO system_users (id, email, full_name, role, unit_id)
VALUES (
  'UUID-DEL-USUARIO',  -- ⚠️ DEBE ser el UUID de auth.users
  'admin.norte@tec.mx',
  'Admin Norte',
  'Admin',
  1  -- Ajusta el unit_id según corresponda
);

-- O para client_portal_users:
INSERT INTO client_portal_users (id, email, full_name, role, client_id, is_active)
VALUES (
  'UUID-DEL-USUARIO',  -- ⚠️ DEBE ser el UUID de auth.users
  'cliente@ejemplo.com',
  'Cliente Test',
  'Admin',
  1,  -- Ajusta el client_id según corresponda
  true
);
```

## 🧪 Prueba Rápida

Después de seguir los pasos, intenta hacer login de nuevo. Si el error persiste:

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Network**
3. Intenta hacer login
4. Busca la petición a `/auth/v1/token`
5. Click en ella y revisa la respuesta completa del servidor
6. Comparte el mensaje de error completo

## 📝 Checklist

- [ ] Usuario existe en `auth.users` (verificado en el dashboard)
- [ ] Usuario tiene registro en `system_users` o `client_portal_users`
- [ ] El UUID en la tabla de perfiles coincide con el UUID en `auth.users`
- [ ] No hay triggers problemáticos (verificado con el script SQL)
- [ ] Email Auth está habilitado en Supabase
- [ ] RLS está deshabilitado en las tablas (ya lo verificaste)

## 🔍 Información Adicional

El error 500 generalmente viene del servidor de Supabase, no del código del frontend. Por eso es importante verificar:

1. **Estado del proyecto**: Ve a Supabase Dashboard → Settings → General y verifica que el proyecto esté activo
2. **Límites de API**: Verifica que no hayas excedido los límites de requests
3. **Logs de Supabase**: Ve a **Logs → Postgres Logs** para ver errores más detallados

