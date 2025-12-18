# 🔄 Mapeo de Campos - Tabla Receivables

## Estructura Real de la Base de Datos

La tabla `receivables` en Supabase tiene la siguiente estructura:

| Campo BD (snake_case) | Tipo | Descripción |
|----------------------|------|-------------|
| `id` | integer | ID único (auto-increment) |
| `client_id` | integer | ID del cliente |
| `contract_id` | integer | ID del contrato (nullable) |
| `unit_id` | integer | ID de la unidad de negocio |
| `period_month` | integer | Mes del período |
| `period_year` | integer | Año del período |
| `paid_amount` | numeric | Monto pagado (default: 0.00) |
| `balance_due` | numeric | Saldo pendiente (nullable) |
| `amount` | numeric | Monto total (default: 0.00) |
| `due_date` | date | Fecha de vencimiento |
| `concept` | varchar | Concepto |
| `type` | varchar | Tipo de receivable |
| `status` | varchar | Estado (default: 'Scheduled') |
| `created_at` | timestamp | Fecha de creación |

## Mapeo Frontend ↔ Base de Datos

El servicio `invoiceService.js` mapea automáticamente entre los formatos:

### De BD a Frontend (mapReceivableFromDB)

```javascript
// Base de Datos → Frontend
{
  unit_id → unitId
  client_id → clientId
  contract_id → contractId
  amount (numeric) → amount (string formateado "$15,000.00")
  due_date → dueDate
  period_month → periodMonth
  period_year → periodYear
  paid_amount (numeric) → paidAmount (string formateado)
  balance_due (numeric) → balanceDue (string formateado)
  // Calculados:
  daysOverdue (calculado si status === 'Overdue')
  daysUntil (calculado si status === 'Pending' o 'Scheduled')
}
```

### De Frontend a BD (mapReceivableToDB)

```javascript
// Frontend → Base de Datos
{
  unitId → unit_id
  clientId → client_id
  contractId → contract_id
  amount (string "$15,000.00") → amount (numeric)
  dueDate → due_date
  periodMonth → period_month
  periodYear → period_year
  paidAmount (string) → paid_amount (numeric)
  balanceDue (string) → balance_due (numeric)
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

## Campos Calculados

### `daysOverdue`
- Se calcula automáticamente si `status === 'Overdue'`
- Diferencia en días entre `due_date` y la fecha actual
- Solo se calcula para receivables vencidos

### `daysUntil`
- Se calcula automáticamente si `status === 'Pending'` o `'Scheduled'`
- Días restantes hasta `due_date`
- Solo se calcula para receivables pendientes o programados

## Ejemplo de Uso

### Crear Receivable (desde Frontend)

```javascript
// Puedes usar el formato del frontend
await addInvoice({
  unitId: 1,
  clientId: 1,
  contractId: 5,
  amount: "$15,000.00", // String formateado
  concept: "Renta Oficina 204 (Nov)",
  dueDate: "2023-11-05",
  status: "Pending",
  type: "Renta",
  periodMonth: 11,
  periodYear: 2023
})

// O el formato de la BD directamente
await addInvoice({
  unit_id: 1,
  client_id: 1,
  contract_id: 5,
  amount: 15000.00, // Numeric
  concept: "Renta Oficina 204 (Nov)",
  due_date: "2023-11-05",
  status: "Pending",
  type: "Renta",
  period_month: 11,
  period_year: 2023
})
```

### Datos Retornados

Los datos siempre se retornan en formato frontend:

```javascript
{
  id: 101,
  unitId: 1,
  clientId: 1,
  contractId: 5,
  amount: "$15,000.00", // String formateado
  concept: "Renta Oficina 204 (Nov)",
  dueDate: "2023-11-05",
  status: "Pending",
  type: "Renta",
  daysOverdue: 0,
  daysUntil: 5,
  periodMonth: 11,
  periodYear: 2023,
  paidAmount: "$0.00",
  balanceDue: "$15,000.00",
  // También incluye los campos originales de la BD
  unit_id: 1,
  client_id: 1,
  amount: 15000.00, // Valor numérico original
  // ...
}
```

## Campos Nuevos

### `periodMonth` / `period_month`
- Mes del período al que corresponde el receivable
- Tipo: integer (1-12)

### `periodYear` / `period_year`
- Año del período al que corresponde el receivable
- Tipo: integer (ej: 2023, 2024)

### `paidAmount` / `paid_amount`
- Monto que ya ha sido pagado
- Se actualiza cuando se registran pagos
- Formato: numeric en BD, string formateado en frontend

### `balanceDue` / `balance_due`
- Saldo pendiente por pagar
- Calculado como: `amount - paid_amount`
- Formato: numeric en BD, string formateado en frontend

### `type` / `type`
- Tipo de receivable (ej: "Renta", "Servicio", "Membresía")
- Campo de texto libre

### `contractId` / `contract_id`
- ID del contrato relacionado (opcional)
- Puede ser null si no está asociado a un contrato

## Estados (Status)

Los estados posibles son:
- `'Scheduled'` - Programado (default)
- `'Pending'` - Pendiente de pago
- `'Overdue'` - Vencido
- `'Paid'` - Pagado

## Compatibilidad

El servicio mantiene compatibilidad con ambos formatos:
- ✅ Puedes usar el formato del frontend (`unitId`, `clientId`, `amount` como string)
- ✅ Puedes usar el formato de la BD (`unit_id`, `client_id`, `amount` como numeric)
- ✅ Los datos siempre se retornan en formato frontend para mantener compatibilidad con componentes existentes
- ✅ Los montos siempre se formatean como strings en el frontend

## Notas Importantes

1. **El campo `amount`** se convierte automáticamente entre numeric (BD) y string formateado (frontend)
2. **Los campos `paidAmount` y `balanceDue`** también se formatean automáticamente
3. **`daysOverdue` y `daysUntil`** se calculan automáticamente según el estado y la fecha
4. **El nombre de la tabla es `receivables`**, no `invoices` (aunque las funciones mantienen el nombre `invoice` para compatibilidad)

