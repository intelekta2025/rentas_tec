# 🔄 Mapeo de Campos - Tabla Clients

## Estructura Real de la Base de Datos

La tabla `clients` en Supabase tiene la siguiente estructura:

| Campo BD (snake_case) | Tipo | Descripción |
|----------------------|------|-------------|
| `id` | integer | ID único (auto-increment) |
| `unit_id` | integer | ID de la unidad de negocio |
| `business_name` | varchar | Nombre de la empresa |
| `contact_name` | varchar | Nombre del contacto |
| `contact_email` | varchar | Email del contacto |
| `contact_phone` | varchar | Teléfono del contacto |
| `address_fiscal` | text | Dirección fiscal |
| `rfc` | varchar | RFC del cliente |
| `status` | varchar | Estado (Active, Pending, Overdue) |
| `created_at` | timestamp | Fecha de creación |

## Mapeo Frontend ↔ Base de Datos

El servicio `clientService.js mapea automáticamente entre los formatos:

### De BD a Frontend (mapClientFromDB)

```javascript
// Base de Datos → Frontend
{
  business_name → name
  contact_name → contact
  contact_email → email
  address_fiscal → address
  unit_id → unitId
  contact_phone → contactPhone (nuevo campo)
}
```

### De Frontend a BD (mapClientToDB)

```javascript
// Frontend → Base de Datos
{
  name → business_name
  contact → contact_name
  email → contact_email
  address → address_fiscal
  unitId → unit_id
  contactPhone → contact_phone
}
```

## Ejemplo de Uso

### Crear Cliente (desde Frontend)

```javascript
// Puedes usar el formato del frontend
await addClient({
  name: "Innovación Digital S.A.",
  contact: "Juan Pérez",
  email: "cliente@innovacion.com",
  address: "Av. Tecnológico 123",
  unitId: 1,
  rfc: "IDI190202H52",
  status: "Active"
})

// O el formato de la BD directamente
await addClient({
  business_name: "Innovación Digital S.A.",
  contact_name: "Juan Pérez",
  contact_email: "cliente@innovacion.com",
  address_fiscal: "Av. Tecnológico 123",
  unit_id: 1,
  rfc: "IDI190202H52",
  status: "Active"
})
```

### Datos Retornados

Los datos siempre se retornan en formato frontend:

```javascript
{
  id: 1,
  unitId: 1,
  name: "Innovación Digital S.A.",
  contact: "Juan Pérez",
  email: "cliente@innovacion.com",
  address: "Av. Tecnológico 123",
  contactPhone: null, // nuevo campo
  rfc: "IDI190202H52",
  status: "Active",
  // También incluye los campos originales de la BD
  business_name: "Innovación Digital S.A.",
  unit_id: 1,
  // ...
}
```

## Campos Nuevos

### `contact_phone` / `contactPhone`

Este es un campo nuevo que no existía en los datos mock. Si tus componentes lo necesitan, puedes agregarlo:

```javascript
// En un formulario
<input 
  type="tel"
  value={clientData.contactPhone || ''}
  onChange={(e) => setClientData({...clientData, contactPhone: e.target.value})}
/>
```

## Compatibilidad

El servicio mantiene compatibilidad con ambos formatos:
- ✅ Puedes usar el formato del frontend (`name`, `contact`, `email`, `address`)
- ✅ Puedes usar el formato de la BD (`business_name`, `contact_name`, etc.)
- ✅ Los datos siempre se retornan en formato frontend para mantener compatibilidad con componentes existentes

## Notas Importantes

1. **El campo `name` en el frontend** se mapea a `business_name` en la BD
2. **El campo `contact` en el frontend** se mapea a `contact_name` en la BD
3. **El campo `email` en el frontend** se mapea a `contact_email` en la BD
4. **El campo `address` en el frontend** se mapea a `address_fiscal` en la BD
5. **El campo `unitId` en el frontend** se mapea a `unit_id` en la BD (camelCase → snake_case)

