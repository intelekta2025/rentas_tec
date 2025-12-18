# 🔄 Mapeo de Campos - Tablas de Perfiles

## Estructura de las Tablas

En lugar de una sola tabla `profiles`, hay dos tablas separadas:

### Tabla: `staff` (Administradores)

| Campo BD (snake_case) | Tipo | Descripción |
|----------------------|------|-------------|
| `id` | uuid | ID único (referencia a auth.users) |
| `unit_id` | integer | ID de la unidad de negocio (nullable) |
| `full_name` | varchar | Nombre completo |
| `email` | varchar | Email |
| `role` | varchar | Rol (Admin, SuperAdmin, etc.) |
| `created_at` | timestamp | Fecha de creación |

### Tabla: `client_portal_users` (Clientes)

| Campo BD (snake_case) | Tipo | Descripción |
|----------------------|------|-------------|
| `id` | uuid | ID único (referencia a auth.users) |
| `client_id` | integer | ID del cliente (requerido) |
| `full_name` | varchar | Nombre completo |
| `email` | varchar | Email |
| `role` | varchar | Rol (default: 'Admin') |
| `is_active` | boolean | Usuario activo (default: true) |
| `last_login` | timestamp | Último inicio de sesión (nullable) |
| `created_at` | timestamp | Fecha de creación |

## Mapeo Frontend ↔ Base de Datos

El servicio `authService.js` mapea automáticamente entre los formatos:

### De BD a Frontend (mapStaffProfile / mapClientUserProfile)

#### Staff (Administradores)
```javascript
{
  id → id
  full_name → name
  email → email
  role → role
  unit_id → unitId
  // Campos adicionales:
  clientId → null
  clientName → null
}
```

#### Client Users (Clientes)
```javascript
{
  id → id
  full_name → name
  email → email
  role → role (o 'Client' si no está definido)
  client_id → clientId
  is_active → isActive
  last_login → lastLogin
  // Campos adicionales:
  unitId → null
  clientName → (obtenido de la tabla clients)
}
```

## Lógica de Búsqueda

El servicio busca automáticamente en ambas tablas:

1. **Primero busca en `staff`**
   - Si encuentra el usuario, retorna el perfil de administrador
   - Incluye `unitId` y `role`

2. **Si no encuentra en `system_users`, busca en `client_portal_users`**
   - Si encuentra el usuario, retorna el perfil de cliente
   - Obtiene el `clientName` desde la tabla `clients`
   - Incluye `clientId`, `isActive`, `lastLogin`

3. **Si no encuentra en ninguna tabla**
   - Retorna `null` (usuario sin perfil)

## Ejemplo de Datos Retornados

### Usuario Administrador
```javascript
{
  id: "uuid-del-usuario",
  name: "Admin Norte",
  email: "admin.norte@tec.mx",
  role: "Admin",
  unitId: 1,
  clientId: null,
  clientName: null,
  // Campos originales de BD
  full_name: "Admin Norte",
  unit_id: 1,
  created_at: "2023-01-01T00:00:00Z"
}
```

### Usuario Cliente
```javascript
{
  id: "uuid-del-usuario",
  name: "Juan Pérez",
  email: "juan@empresa.com",
  role: "Client",
  unitId: null,
  clientId: 1,
  clientName: "Innovación Digital S.A.",
  isActive: true,
  lastLogin: "2023-11-15T10:30:00Z",
  // Campos originales de BD
  full_name: "Juan Pérez",
  client_id: 1,
  is_active: true,
  last_login: "2023-11-15T10:30:00Z",
  created_at: "2023-01-01T00:00:00Z"
}
```

## Actualización Automática

### Último Login
- Cuando un usuario cliente inicia sesión, se actualiza automáticamente `last_login` en `client_portal_users`
- Esto no afecta a usuarios administradores (no tienen este campo)

## Uso en el Código

### En useAuth Hook
```javascript
const { user, login, logout } = useAuth()

// Después del login, user contiene:
console.log(user.name) // "Admin Norte" o "Juan Pérez"
console.log(user.role) // "Admin" o "Client"
console.log(user.unitId) // 1 (solo para admins)
console.log(user.clientId) // 1 (solo para clientes)
console.log(user.clientName) // "Innovación Digital S.A." (solo para clientes)
```

### En App.jsx
```javascript
// Verificar rol
if (user?.role === 'Client') {
  // Portal de cliente
  console.log(user.clientName) // Nombre del cliente
} else {
  // Portal de administrador
  console.log(user.unitId) // ID de la unidad
}
```

## Notas Importantes

1. **El servicio busca automáticamente** en ambas tablas, no necesitas especificar cuál usar
2. **El campo `name`** se mapea desde `full_name` en ambas tablas
3. **El campo `role`** puede ser diferente:
   - En `staff`: "Admin", "SuperAdmin", etc.
   - En `client_portal_users`: Por defecto "Admin", pero se puede usar "Client"
4. **`clientName`** se obtiene automáticamente desde la tabla `clients` usando `client_id`
5. **`lastLogin`** solo se actualiza para usuarios cliente
6. **`isActive`** solo existe para usuarios cliente

## Compatibilidad

El servicio mantiene compatibilidad con:
- ✅ Código que espera `user.name` (mapeado desde `full_name`)
- ✅ Código que espera `user.unitId` (solo para admins)
- ✅ Código que espera `user.clientId` (solo para clientes)
- ✅ Código que espera `user.role` (disponible en ambas tablas)
- ✅ Todos los campos originales de BD están disponibles

## Nombres de Tablas

Si tus tablas tienen nombres diferentes, actualiza estas constantes en `authService.js`:

```javascript
// Cambiar estos nombres según tu esquema:
const STAFF_TABLE = 'staff' // o 'admin_profiles', 'admins', etc.
const CLIENT_USERS_TABLE = 'client_portal_users' // o 'client_profiles', etc.
```

