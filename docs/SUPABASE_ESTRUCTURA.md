# Estructura de Carpetas para Integración de Supabase

## 📁 Estructura Recomendada

```
src/
├── lib/
│   └── supabase.js          # Configuración del cliente de Supabase
│
├── hooks/
│   ├── useAuth.js          # Hook para autenticación
│   ├── useClients.js       # Hook para gestión de clientes
│   ├── useInvoices.js      # Hook para facturas/CXC
│   └── usePayments.js      # Hook para pagos
│
├── services/
│   ├── authService.js      # Funciones de autenticación
│   ├── clientService.js    # CRUD de clientes
│   ├── invoiceService.js   # CRUD de facturas
│   └── paymentService.js   # CRUD de pagos
│
├── data/
│   └── constants.js        # Constantes estáticas (UNITS, etc.)
│
├── components/             # (estructura existente)
│   ├── admin/
│   ├── auth/
│   ├── client/
│   └── ui/
│
└── App.jsx                 # Componente principal
```

## 📝 Descripción de Carpetas

### 1. `src/lib/supabase.js`
**Propósito**: Configuración centralizada del cliente de Supabase.

**Contenido**:
- Inicialización del cliente de Supabase
- Exportación del cliente para uso en toda la aplicación
- Configuración de variables de entorno

**Ejemplo**:
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

### 2. `src/hooks/`
**Propósito**: Hooks personalizados de React que encapsulan la lógica de Supabase.

**Ventajas**:
- Reutilización de lógica
- Manejo de estados (loading, error, data)
- Actualización automática cuando cambian los datos

**Hooks recomendados**:

#### `useAuth.js`
- Manejo de sesión de usuario
- Login/logout
- Estado de autenticación

#### `useClients.js`
- Obtener lista de clientes
- Filtrar por unitId
- CRUD de clientes

#### `useInvoices.js`
- Obtener facturas/CXC
- Filtrar por estado (Pending, Overdue, Paid)
- Actualizar estado de facturas

#### `usePayments.js`
- Historial de pagos
- Registrar nuevos pagos

---

### 3. `src/services/`
**Propósito**: Funciones de servicio que encapsulan operaciones de base de datos.

**Ventajas**:
- Separación de lógica de negocio
- Fácil de testear
- Reutilizable en diferentes componentes

**Servicios recomendados**:

#### `authService.js`
```javascript
- signIn(email, password)
- signOut()
- getCurrentUser()
- updateUserProfile()
```

#### `clientService.js`
```javascript
- getClients(unitId)
- getClientById(id)
- createClient(clientData)
- updateClient(id, clientData)
- deleteClient(id)
```

#### `invoiceService.js`
```javascript
- getInvoices(unitId, filters)
- getInvoiceById(id)
- createInvoice(invoiceData)
- updateInvoiceStatus(id, status)
- getOverdueInvoices(unitId)
```

#### `paymentService.js`
```javascript
- getPayments(clientId)
- createPayment(paymentData)
- getPaymentHistory(clientId)
```

---

### 4. `src/data/constants.js`
**Propósito**: Mantener constantes estáticas que no vienen de la base de datos.

**Contenido**:
- `UNITS` - Mapeo de IDs a nombres de unidades
- `LOGO_URL` - URL del logo
- Constantes de configuración
- Enums y tipos de estado

---

## 🔄 Flujo de Datos

```
Supabase Database
    ↓
src/lib/supabase.js (cliente)
    ↓
src/services/*.js (lógica de negocio)
    ↓
src/hooks/*.js (estado de React)
    ↓
src/components/*.jsx (UI)
```

## 📋 Pasos de Implementación

1. **Instalar Supabase**:
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Crear archivo de configuración**:
   - Crear `src/lib/supabase.js`
   - Configurar variables de entorno (`.env`)

3. **Crear servicios**:
   - Implementar funciones en `src/services/`
   - Una función por operación de base de datos

4. **Crear hooks**:
   - Implementar hooks en `src/hooks/`
   - Usar `useState` y `useEffect` para manejar estado

5. **Migrar componentes**:
   - Reemplazar datos mock con llamadas a hooks
   - Actualizar `App.jsx` para usar hooks de autenticación

## 🔐 Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:
```
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

## 💡 Buenas Prácticas

1. **Separación de responsabilidades**: 
   - `lib/` = configuración
   - `services/` = lógica de negocio
   - `hooks/` = estado de React
   - `components/` = UI

2. **Manejo de errores**: 
   - Siempre manejar errores en servicios
   - Mostrar mensajes de error en UI

3. **Loading states**: 
   - Usar estados de carga en hooks
   - Mostrar spinners mientras cargan datos

4. **Optimistic updates**: 
   - Actualizar UI inmediatamente
   - Revertir si falla la operación

5. **Caché y refetch**: 
   - Considerar usar React Query o SWR para caché
   - O implementar refetch manual en hooks

