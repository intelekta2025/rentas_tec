# 🎯 Guía: Roles y Pantallas en la Aplicación

## 📋 ¿Qué Determina las Pantallas?

La aplicación determina qué pantallas mostrar basándose en el campo **`user.role`** del objeto usuario.

## 🔍 Lógica Actual en `App.jsx`

### 1. Verificación Principal (Línea 237)

```javascript
{user.role === 'Admin' || user.role === 'SuperAdmin' ? (
  // Pantallas de Administrador
) : (
  // Pantallas de Cliente
)}
```

### 2. Verificación Secundaria (Línea 294)

```javascript
{user.role === 'Client' ? (
  // Vistas del Portal de Cliente
) : (
  // Vistas de Administración
)}
```

## 🎭 Roles y Pantallas

### 👨‍💼 Usuarios de `system_users` (Administradores)

**Roles esperados:**
- `'Admin'` - Administrador de unidad
- `'SuperAdmin'` - Super administrador

**Pantallas mostradas:**
- ✅ **Dashboard** (Inicio)
- ✅ **Clientes** (Gestión de clientes)
- ✅ **Market Tec** (Gestión de Market Tec)
- ✅ **Cuentas Vencidas** (Facturas vencidas)
- ✅ **Recordatorios** (Recordatorios de pago)
- ✅ **Configuración** (Ajustes del sistema)

**Datos filtrados por:**
- `user.unitId` - Solo muestra datos de la unidad del administrador

### 👤 Usuarios de `client_portal_users` (Clientes)

**Rol esperado:**
- `'Client'` - Cliente del portal

**Pantallas mostradas:**
- ✅ **Estado de Cuenta** (`clientPortal_account`)
- ✅ **Mis Pagos** (`clientPortal_payments`)

**Datos filtrados por:**
- `user.clientId` - Solo muestra datos del cliente

## ⚠️ Problema Actual

Según el código en `authService.js`, cuando un usuario viene de `client_portal_users`, el rol se mapea así:

```javascript
role: clientProfile.role || 'Client'
```

**Esto significa:**
- Si `client_portal_users.role` es `'Admin'` (valor por defecto en la BD), el usuario se verá como **Admin** y verá las pantallas de administrador
- Si `client_portal_users.role` es `'Client'` o `NULL`, se asignará `'Client'` y verá las pantallas del cliente

## ✅ Solución: Asegurar el Rol Correcto

### Opción 1: Actualizar el Rol en la Base de Datos

Para usuarios de `client_portal_users`, asegúrate de que el campo `role` sea `'Client'`:

```sql
-- Actualizar todos los usuarios de client_portal_users a 'Client'
UPDATE client_portal_users
SET role = 'Client'
WHERE role IS NULL OR role != 'Client';
```

### Opción 2: Modificar el Mapeo en `authService.js`

Si quieres que **siempre** los usuarios de `client_portal_users` tengan rol `'Client'`, modifica el mapeo:

```javascript
// En getUserProfile, cuando es client_portal_users:
role: 'Client',  // Siempre 'Client', ignorar el valor de la BD
```

### Opción 3: Modificar la Lógica en `App.jsx`

Puedes verificar si el usuario tiene `clientId` en lugar de verificar el rol:

```javascript
// En lugar de:
{user.role === 'Client' ? (

// Usar:
{user.clientId ? (
```

## 📊 Resumen de la Lógica

| Tabla | Campo `role` en BD | Rol Mapeado | Pantallas Mostradas |
|-------|-------------------|-------------|---------------------|
| `system_users` | `'Admin'` | `'Admin'` | ✅ Administrador |
| `system_users` | `'SuperAdmin'` | `'SuperAdmin'` | ✅ Administrador |
| `client_portal_users` | `'Client'` | `'Client'` | ✅ Portal Cliente |
| `client_portal_users` | `'Admin'` o `NULL` | `'Client'` (por defecto) | ✅ Portal Cliente |

## 🔧 Verificar el Rol de un Usuario

### Desde SQL

```sql
-- Verificar rol de un usuario
SELECT 
  'system_users' as tabla,
  id,
  email,
  role
FROM system_users
WHERE email = 'admin@ejemplo.com'
UNION ALL
SELECT 
  'client_portal_users' as tabla,
  id,
  email,
  role
FROM client_portal_users
WHERE email = 'cliente@ejemplo.com';
```

### Desde la Consola del Navegador

```javascript
// Ver el objeto usuario completo
console.log('Usuario:', window.supabase?.auth?.user)

// O desde el código de la app
// El objeto user está disponible en App.jsx
```

## 🎯 Recomendación

**Para asegurar que funcione correctamente:**

1. **Usuarios de `system_users`**: Deben tener `role = 'Admin'` o `'SuperAdmin'`
2. **Usuarios de `client_portal_users`**: Deben tener `role = 'Client'`

**Ejecuta este SQL para corregir los roles:**

```sql
-- Asegurar que todos los clientes tengan rol 'Client'
UPDATE client_portal_users
SET role = 'Client'
WHERE role IS NULL OR role != 'Client';

-- Verificar
SELECT 
  id,
  email,
  role,
  CASE 
    WHEN role = 'Client' THEN '✅ Correcto'
    ELSE '⚠️ Debe ser Client'
  END as estado
FROM client_portal_users;
```

## 📝 Código Clave en `App.jsx`

### Línea 109-113: Redirección después del login
```javascript
if (user?.role === 'Client') {
  setActiveTab('clientPortal_account');
} else {
  setActiveTab('dashboard');
}
```

### Línea 237: Menú del sidebar
```javascript
{user.role === 'Admin' || user.role === 'SuperAdmin' ? (
  // Menú de administrador
) : (
  // Menú de cliente
)}
```

### Línea 294: Contenido principal
```javascript
{user.role === 'Client' ? (
  // Vistas del portal de cliente
) : (
  // Vistas de administración
)}
```

## 🔍 Debugging

Si un usuario ve las pantallas incorrectas:

1. **Verifica el rol en la BD:**
   ```sql
   SELECT role FROM system_users WHERE email = 'usuario@ejemplo.com';
   SELECT role FROM client_portal_users WHERE email = 'usuario@ejemplo.com';
   ```

2. **Verifica el objeto user en el frontend:**
   ```javascript
   // En la consola del navegador
   console.log('User role:', user?.role)
   console.log('User clientId:', user?.clientId)
   console.log('User unitId:', user?.unitId)
   ```

3. **Verifica el mapeo en `authService.js`:**
   - Línea 104: Mapeo para `system_users`
   - Línea 147: Mapeo para `client_portal_users`

