# 🔄 Mapeo de Campos - Tabla Payments

## Estructura Real de la Base de Datos

La tabla `payments` en Supabase tiene la siguiente estructura:

| Campo BD (snake_case) | Tipo | Descripción |
|----------------------|------|-------------|
| `id` | integer | ID único (auto-increment) |
| `client_id` | integer | ID del cliente |
| `unit_id` | integer | ID de la unidad de negocio |
| `receivable_id` | integer | ID del receivable relacionado (nullable) |
| `market_tec_upload_id` | integer | ID de carga de Market Tec (nullable) |
| `amount` | numeric | Monto del pago |
| `payment_date` | date | Fecha del pago |
| `reference_number` | varchar | Número de referencia |
| `payment_method` | varchar | Método de pago |
| `invoice_status` | varchar | Estado de factura (default: 'Pending') |
| `invoice_uuid` | varchar | UUID de la factura (nullable) |
| `invoice_pdf_url` | text | URL del PDF de factura (nullable) |
| `invoice_xml_url` | text | URL del XML de factura (nullable) |
| `created_at` | timestamp | Fecha de creación |

## Mapeo Frontend ↔ Base de Datos

El servicio `paymentService.js` mapea automáticamente entre los formatos:

### De BD a Frontend (mapPaymentFromDB)

```javascript
// Base de Datos → Frontend
{
  client_id → clientId
  unit_id → unitId
  receivable_id → receivableId (también disponible como invoice_id para compatibilidad)
  market_tec_upload_id → marketTecUploadId
  amount (numeric) → amount (string formateado "$15,000.00")
  payment_date → paymentDate (también disponible como date para compatibilidad)
  reference_number → referenceNumber (también disponible como reference)
  payment_method → paymentMethod (también disponible como method)
  invoice_status → invoiceStatus
  invoice_uuid → invoiceUuid
  invoice_pdf_url → invoicePdfUrl
  invoice_xml_url → invoiceXmlUrl
}
```

### De Frontend a BD (mapPaymentToDB)

```javascript
// Frontend → Base de Datos
{
  clientId → client_id
  unitId → unit_id
  receivableId → receivable_id
  invoiceId → receivable_id (compatibilidad)
  marketTecUploadId → market_tec_upload_id
  amount (string "$15,000.00") → amount (numeric)
  date → payment_date (compatibilidad)
  paymentDate → payment_date
  reference → reference_number (compatibilidad)
  referenceNumber → reference_number
  method → payment_method (compatibilidad)
  paymentMethod → payment_method
  invoiceStatus → invoice_status
  invoiceUuid → invoice_uuid
  invoicePdfUrl → invoice_pdf_url
  invoiceXmlUrl → invoice_xml_url
}
```

## Formato de Montos

### En la Base de Datos
- Los montos se almacenan como `numeric` (números decimales)
- Ejemplo: `15000.00`, `4500.50`

### En el Frontend
- Los montos se formatean como strings con formato de moneda mexicana
- Ejemplo: `"$15,000.00"`, `"$4,500.50"`

### Conversión Automática

El servicio convierte automáticamente:

```javascript
// Al leer de la BD: numeric → string formateado
amount: 15000.00 → "$15,000.00"

// Al escribir a la BD: string → numeric
amount: "$15,000.00" → 15000.00
```

## Campos de Compatibilidad

Para mantener compatibilidad con código existente, el servicio acepta y retorna alias:

### Alias Aceptados (Input)
- `invoice_id` → se mapea a `receivable_id`
- `date` → se mapea a `payment_date`
- `reference` → se mapea a `reference_number`
- `method` → se mapea a `payment_method`

### Alias Retornados (Output)
- `invoice_id` → alias de `receivable_id`
- `date` → alias de `payment_date`
- `reference` → alias de `reference_number`
- `method` → alias de `payment_method`

## Ejemplo de Uso

### Crear Pago (desde Frontend)

```javascript
// Puedes usar el formato del frontend con alias
await addPayment({
  clientId: 1,
  unitId: 1,
  receivableId: 101, // o invoiceId: 101 (compatibilidad)
  amount: "$15,000.00", // String formateado
  date: "2023-10-05", // o paymentDate: "2023-10-05"
  reference: "REF-998877", // o referenceNumber: "REF-998877"
  method: "Transferencia SPEI", // o paymentMethod: "Transferencia SPEI"
  invoiceStatus: "Facturado"
})

// O el formato de la BD directamente
await addPayment({
  client_id: 1,
  unit_id: 1,
  receivable_id: 101,
  amount: 15000.00, // Numeric
  payment_date: "2023-10-05",
  reference_number: "REF-998877",
  payment_method: "Transferencia SPEI",
  invoice_status: "Facturado"
})
```

### Datos Retornados

Los datos siempre se retornan en formato frontend con alias:

```javascript
{
  id: 301,
  clientId: 1,
  unitId: 1,
  receivableId: 101,
  invoiceId: 101, // Alias para compatibilidad
  marketTecUploadId: null,
  amount: "$15,000.00", // String formateado
  date: "2023-10-05", // Alias de paymentDate
  paymentDate: "2023-10-05",
  reference: "REF-998877", // Alias de referenceNumber
  referenceNumber: "REF-998877",
  method: "Transferencia SPEI", // Alias de paymentMethod
  paymentMethod: "Transferencia SPEI",
  invoiceStatus: "Facturado",
  invoiceUuid: null,
  invoicePdfUrl: null,
  invoiceXmlUrl: null,
  // También incluye los campos originales de la BD
  client_id: 1,
  unit_id: 1,
  receivable_id: 101,
  amount: 15000.00, // Valor numérico original
  // ...
}
```

## Campos Nuevos

### `unitId` / `unit_id`
- ID de la unidad de negocio
- Tipo: integer
- **Nuevo campo** - no existía en la estructura anterior

### `receivableId` / `receivable_id`
- ID del receivable (cuenta por cobrar) relacionado
- Tipo: integer (nullable)
- **Cambio de nombre**: antes era `invoice_id`, ahora es `receivable_id`
- Se mantiene compatibilidad con `invoice_id`

### `marketTecUploadId` / `market_tec_upload_id`
- ID de carga de Market Tec relacionada
- Tipo: integer (nullable)
- **Nuevo campo**

### `paymentDate` / `payment_date`
- Fecha del pago
- Tipo: date
- **Cambio de nombre**: antes era `date`, ahora es `payment_date`
- Se mantiene compatibilidad con `date`

### `referenceNumber` / `reference_number`
- Número de referencia del pago
- Tipo: varchar (nullable)
- **Cambio de nombre**: antes era `reference`, ahora es `reference_number`
- Se mantiene compatibilidad con `reference`

### `paymentMethod` / `payment_method`
- Método de pago (ej: "Transferencia SPEI", "Cheque")
- Tipo: varchar (nullable)
- **Cambio de nombre**: antes era `method`, ahora es `payment_method`
- Se mantiene compatibilidad con `method`

### `invoiceUuid` / `invoice_uuid`
- UUID de la factura relacionada
- Tipo: varchar (nullable)
- **Nuevo campo**

### `invoicePdfUrl` / `invoice_pdf_url`
- URL del PDF de la factura
- Tipo: text (nullable)
- **Nuevo campo**

### `invoiceXmlUrl` / `invoice_xml_url`
- URL del XML de la factura
- Tipo: text (nullable)
- **Nuevo campo**

## Campo Eliminado

### `concept`
- **Ya no existe** en la tabla `payments`
- El concepto puede obtenerse del `receivable` relacionado usando `receivable_id`

## Actualización Automática de Receivables

Cuando se crea o elimina un pago relacionado con un receivable:

### Al Crear un Pago
- Se actualiza `paid_amount` del receivable
- Se calcula `balance_due` del receivable
- Se actualiza el `status` del receivable:
  - Si `balance_due <= 0` → `status = 'Paid'`
  - Si `balance_due > 0` → `status = 'Pending'`

### Al Eliminar un Pago
- Se revierte el `paid_amount` del receivable
- Se recalcula `balance_due` del receivable
- Se actualiza el `status` del receivable según corresponda

## Compatibilidad

El servicio mantiene compatibilidad con ambos formatos:
- ✅ Puedes usar el formato del frontend (`clientId`, `date`, `reference`, `method`)
- ✅ Puedes usar el formato de la BD (`client_id`, `payment_date`, `reference_number`, `payment_method`)
- ✅ Los datos siempre se retornan en formato frontend con alias para compatibilidad
- ✅ Los montos siempre se formatean como strings en el frontend
- ✅ `invoice_id` se mapea automáticamente a `receivable_id`

## Notas Importantes

1. **El campo `amount`** se convierte automáticamente entre numeric (BD) y string formateado (frontend)
2. **Los alias** (`date`, `reference`, `method`, `invoice_id`) se mantienen para compatibilidad con código existente
3. **El concepto del pago** ya no existe en la tabla, se debe obtener del receivable relacionado
4. **Los receivables se actualizan automáticamente** cuando se crean o eliminan pagos relacionados

