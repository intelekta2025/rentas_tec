# 🚀 Guía Completa de Integración de Supabase

## ✅ Archivos Creados

### 📁 Estructura de Carpetas

```
src/
├── lib/
│   └── supabase.js                    ✅ Cliente de Supabase
│
├── services/
│   ├── authService.js                 ✅ Autenticación
│   ├── clientService.js              ✅ CRUD de clientes
│   ├── invoiceService.js             ✅ CRUD de facturas/CXC
│   └── paymentService.js             ✅ CRUD de pagos
│
├── hooks/
│   ├── useAuth.js                    ✅ Hook de autenticación
│   ├── useClients.js                 ✅ Hook de clientes
│   ├── useInvoices.js                ✅ Hook de facturas
│   └── usePayments.js                ✅ Hook de pagos
│
└── components/
    └── auth/
        └── LoginView.jsx.example     ✅ LoginView actualizado
```

### 📄 Archivos de Documentación

- `SUPABASE_ESTRUCTURA.md` - Explicación de la estructura de carpetas
- `INTEGRACION_APP_JSX.md` - Guía de cambios en App.jsx
- `src/App.jsx.example` - Ejemplo completo de App.jsx integrado
- `GUIA_INTEGRACION_COMPLETA.md` - Este archivo

## 🔧 Pasos de Instalación

### 1. Instalar Supabase

```bash
npm install @supabase/supabase-js
```

### 2. Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

**Obtener credenciales:**
1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Settings → API
3. Copia `Project URL` y `anon public` key

### 3. Crear Tablas en Supabase

Ejecuta estos SQL en el SQL Editor de Supabase:

```sql
-- Tabla de clientes
CREATE TABLE clients (
  id BIGSERIAL PRIMARY KEY,
  unit_id INTEGER,
  name TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  status TEXT DEFAULT 'Active',
  rfc TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de facturas/CXC
CREATE TABLE invoices (
  id BIGSERIAL PRIMARY KEY,
  unit_id INTEGER,
  client_id INTEGER REFERENCES clients(id),
  amount TEXT NOT NULL,
  concept TEXT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'Pending', -- Pending, Paid, Overdue, Scheduled
  days_overdue INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pagos
CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  invoice_id INTEGER REFERENCES invoices(id),
  date DATE NOT NULL,
  concept TEXT NOT NULL,
  amount TEXT NOT NULL,
  method TEXT, -- Transferencia SPEI, Cheque, etc.
  reference TEXT,
  invoice_status TEXT, -- Facturado, Pendiente XML
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de perfiles de usuario (extiende auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  email TEXT,
  role TEXT, -- Admin, SuperAdmin, Client
  unit_id INTEGER,
  client_id INTEGER REFERENCES clients(id),
  client_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajusta según tus necesidades)
-- Los administradores ven solo su unidad
CREATE POLICY "Admins see their unit clients" ON clients
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE unit_id = clients.unit_id
    )
  );

-- Los clientes ven solo sus datos
CREATE POLICY "Clients see their own data" ON clients
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE client_id = clients.id
    )
  );
```

### 4. Integrar en App.jsx

**Opción A: Usar el ejemplo completo**
```bash
# Hacer backup del archivo actual
cp src/App.jsx src/App.jsx.backup

# Copiar el ejemplo
cp src/App.jsx.example src/App.jsx
```

**Opción B: Integrar manualmente**
Sigue la guía en `INTEGRACION_APP_JSX.md` para hacer los cambios paso a paso.

### 5. Actualizar LoginView

```bash
# Hacer backup
cp src/components/auth/LoginView.jsx src/components/auth/LoginView.jsx.backup

# Usar la versión actualizada
cp src/components/auth/LoginView.jsx.example src/components/auth/LoginView.jsx
```

## 📊 Estructura de Datos Esperada

### Tabla: `clients`
```javascript
{
  id: 1,
  unit_id: 1,
  name: "Innovación Digital S.A.",
  contact: "Juan Pérez",
  email: "cliente@innovacion.com",
  status: "Active", // Active, Pending, Overdue
  rfc: "IDI190202H52",
  address: "Av. Tecnológico 123, Local 204"
}
```

### Tabla: `invoices`
```javascript
{
  id: 101,
  unit_id: 1,
  client_id: 1,
  amount: "$15,000.00",
  concept: "Renta Oficina 204 (Nov)",
  due_date: "2023-11-05",
  status: "Overdue", // Pending, Paid, Overdue, Scheduled
  days_overdue: 12
}
```

### Tabla: `payments`
```javascript
{
  id: 301,
  client_id: 1,
  invoice_id: 101,
  date: "2023-10-05",
  concept: "Renta Oficina 204 (Oct)",
  amount: "$15,000.00",
  method: "Transferencia SPEI",
  reference: "REF-998877",
  invoice_status: "Facturado"
}
```

### Tabla: `profiles`
```javascript
{
  id: "uuid-del-usuario",
  name: "Admin Norte",
  email: "admin.norte@tec.mx",
  role: "Admin", // Admin, SuperAdmin, Client
  unit_id: 1,
  client_id: null, // Solo si role === 'Client'
  client_name: null // Solo si role === 'Client'
}
```

## 🔄 Migración de Datos Mock

Para migrar tus datos mock a Supabase:

1. **Exportar datos de `constants.js`**
2. **Crear script de migración** o usar la interfaz de Supabase
3. **Insertar datos manualmente** o usar el SQL Editor

Ejemplo de inserción:
```sql
INSERT INTO clients (unit_id, name, contact, email, status, rfc, address)
VALUES 
  (1, 'Innovación Digital S.A.', 'Juan Pérez', 'cliente@innovacion.com', 'Active', 'IDI190202H52', 'Av. Tecnológico 123, Local 204'),
  (2, 'EcoSolutions', 'Maria Gomez', 'maria@eco.com', 'Pending', 'ECO200101J88', 'Calle Sur 45, Oficina 12');
```

## 🎯 Uso de los Hooks

### useAuth
```javascript
const { user, login, logout, loading, error } = useAuth();

// Login
await login(email, password);

// Logout
await logout();
```

### useClients
```javascript
const { clients, loading, addClient, editClient, removeClient } = useClients(unitId);

// Agregar cliente
await addClient({ name: "Nuevo Cliente", unit_id: 1, ... });

// Editar cliente
await editClient(clientId, { name: "Cliente Actualizado" });

// Eliminar cliente
await removeClient(clientId);
```

### useInvoices
```javascript
const { invoices, loading, addInvoice, changeStatus } = useInvoices({ unitId: 1 });

// Agregar factura
await addInvoice({ 
  unit_id: 1, 
  client_id: 1, 
  amount: "$15,000.00", 
  concept: "Renta",
  due_date: "2024-01-05",
  status: "Pending"
});

// Cambiar estado
await changeStatus(invoiceId, "Paid");
```

### usePayments
```javascript
const { payments, loading, addPayment } = usePayments(clientId);

// Agregar pago
await addPayment({
  client_id: 1,
  invoice_id: 101,
  date: "2024-01-05",
  amount: "$15,000.00",
  method: "Transferencia SPEI",
  reference: "REF-123456"
});
```

## ⚠️ Notas Importantes

1. **Mapeo de Campos**: Los servicios esperan `snake_case` (unit_id, client_id) pero el código puede usar `camelCase`. Ajusta según tu esquema.

2. **Autenticación**: Supabase Auth maneja usuarios. Necesitas crear usuarios en Supabase Auth y luego crear su perfil en la tabla `profiles`.

3. **Row Level Security**: Configura las políticas RLS según tus necesidades de seguridad.

4. **Formato de Montos**: Los montos se guardan como strings con formato "$15,000.00". Ajusta si prefieres números.

5. **Fechas**: Usa formato ISO (YYYY-MM-DD) para fechas.

## 🐛 Troubleshooting

### Error: "Missing Supabase environment variables"
- Verifica que `.env` existe y tiene las variables correctas
- Reinicia el servidor de desarrollo después de crear `.env`

### Error: "relation does not exist"
- Verifica que las tablas existen en Supabase
- Revisa los nombres de las tablas en los servicios

### Error: "permission denied"
- Revisa las políticas RLS en Supabase
- Verifica que el usuario tiene permisos

### Datos no se cargan
- Revisa la consola del navegador para errores
- Verifica que los filtros en los hooks son correctos
- Revisa la red en DevTools para ver las peticiones

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🎉 Siguiente Paso

Una vez que todo esté configurado:
1. Prueba el login con un usuario real de Supabase
2. Verifica que los datos se cargan correctamente
3. Prueba crear/editar/eliminar registros
4. Ajusta las políticas RLS según tus necesidades

¡Listo para usar Supabase en tu proyecto! 🚀

