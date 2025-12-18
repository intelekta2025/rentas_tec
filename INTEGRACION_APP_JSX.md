# Guía de Integración de Hooks de Supabase en App.jsx

## 📋 Cambios Necesarios

### 1. Importar los Hooks

```javascript
// Reemplazar imports de datos mock
// ANTES:
import { UNITS, mockClients, mockCXC, mockUpcoming, mockMonthlyStats } from './data/constants';

// DESPUÉS:
import { UNITS, mockMonthlyStats } from './data/constants'; // Mantener solo constantes estáticas
import { useAuth } from './hooks/useAuth';
import { useClients } from './hooks/useClients';
import { useInvoices, useOverdueInvoices, useUpcomingReminders } from './hooks/useInvoices';
import { usePayments, usePaymentHistory } from './hooks/usePayments';
```

### 2. Reemplazar useState de Usuario con useAuth

```javascript
// ANTES:
const [user, setUser] = useState(null);

// DESPUÉS:
const { user, login, logout, loading: authLoading } = useAuth();
```

### 3. Reemplazar Datos Mock con Hooks

```javascript
// ANTES:
const filteredClients = useMemo(() => 
  user?.role !== 'Client' ? mockClients.filter(c => c.unitId === user?.unitId) : [], 
  [user]
);

// DESPUÉS:
const { 
  clients: filteredClients, 
  loading: clientsLoading 
} = useClients(user?.role !== 'Client' ? user?.unitId : null);
```

### 4. Reemplazar Facturas/CXC

```javascript
// ANTES:
const filteredCXC = useMemo(() => 
  user?.role !== 'Client' ? mockCXC.filter(c => c.unitId === user?.unitId) : [], 
  [user]
);

// DESPUÉS:
const { 
  invoices: filteredCXC, 
  loading: invoicesLoading 
} = useInvoices(
  user?.role !== 'Client' 
    ? { unitId: user?.unitId } 
    : { clientId: user?.clientId }
);
```

### 5. Reemplazar Recordatorios

```javascript
// ANTES:
const filteredUpcoming = useMemo(() => 
  user?.role !== 'Client' ? mockUpcoming.filter(c => c.unitId === user?.unitId) : [], 
  [user]
);

// DESPUÉS:
const { 
  reminders: filteredUpcoming, 
  loading: remindersLoading 
} = useUpcomingReminders(
  user?.role !== 'Client' ? user?.unitId : null, 
  30 // días hacia adelante
);
```

### 6. Actualizar handleLogin

```javascript
// ANTES:
const handleLogin = (userData) => {
  setUser(userData);
  // ...
};

// DESPUÉS:
const handleLogin = async (email, password) => {
  const result = await login(email, password);
  if (result.success) {
    // El hook useAuth ya maneja el estado del usuario
    if (user?.role === 'Client') {
      setActiveTab('clientPortal_account');
    } else {
      setActiveTab('dashboard');
    }
  } else {
    // Mostrar error de login
    console.error('Error de login:', result.error);
  }
};
```

### 7. Actualizar handleLogout

```javascript
// ANTES:
const handleLogout = () => {
  setUser(null);
  setActiveTab('dashboard'); 
};

// DESPUÉS:
const handleLogout = async () => {
  await logout();
  setActiveTab('dashboard');
};
```

### 8. Actualizar Cálculos de Estadísticas

```javascript
// ANTES:
const adminStats = useMemo(() => {
  if (!user || user.role === 'Client') return { totalClients: 0, totalCXC: 0, overdueCount: 0 };
  return {
    totalClients: filteredClients.length,
    totalCXC: filteredCXC.reduce((acc, curr) => 
      acc + parseFloat(curr.amount.replace(/[^0-9.-]+/g,"")), 0),
    overdueCount: filteredCXC.filter(i => i.status === 'Overdue').length
  };
}, [user, filteredClients, filteredCXC]);

// DESPUÉS:
const adminStats = useMemo(() => {
  if (!user || user.role === 'Client') return { totalClients: 0, totalCXC: 0, overdueCount: 0 };
  
  const totalCXC = filteredCXC.reduce((acc, curr) => {
    const amount = parseFloat(curr.amount?.replace(/[^0-9.-]+/g, '') || 0);
    return acc + amount;
  }, 0);
  
  return {
    totalClients: filteredClients.length,
    totalCXC,
    overdueCount: filteredCXC.filter(i => i.status === 'Overdue').length
  };
}, [user, filteredClients, filteredCXC]);
```

### 9. Actualizar Estadísticas del Cliente

```javascript
// ANTES:
const myCXC = useMemo(() => 
  user?.role === 'Client' ? mockCXC.filter(c => c.clientId === user.clientId) : [], 
  [user]
);

// DESPUÉS:
// Ya se obtiene con useInvoices filtrado por clientId
const myCXC = user?.role === 'Client' ? filteredCXC : [];

const clientStats = useMemo(() => {
  if (!user || user.role !== 'Client') return { balance: 0, pendingInvoices: 0 };
  
  const balance = myCXC
    .filter(i => i.status === 'Pending' || i.status === 'Overdue')
    .reduce((acc, curr) => {
      const amount = parseFloat(curr.amount?.replace(/[^0-9.-]+/g, '') || 0);
      return acc + amount;
    }, 0);
  
  return {
    balance,
    pendingInvoices: myCXC.filter(i => i.status === 'Pending').length,
    nextPayment: myCXC
      .filter(i => i.status === 'Scheduled' || i.status === 'Pending')
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0]?.due_date || null
  };
}, [user, myCXC]);
```

### 10. Manejar Estados de Carga

```javascript
// Agregar indicadores de carga mientras se obtienen los datos
if (authLoading) {
  return <div className="flex items-center justify-center h-screen">Cargando...</div>;
}

// O mostrar spinners en secciones específicas
{clientsLoading && <div>Cargando clientes...</div>}
{invoicesLoading && <div>Cargando facturas...</div>}
```

## 🔄 Ejemplo Completo de App.jsx Actualizado

Ver el archivo `App.jsx` actualizado con todos estos cambios integrados.

## ⚠️ Notas Importantes

1. **Estructura de Datos**: Asegúrate de que las tablas en Supabase tengan los mismos nombres de columnas que se esperan en el código:
   - `clients`: `id`, `unit_id`, `name`, `contact`, `email`, `status`, `rfc`, `address`
   - `invoices`: `id`, `unit_id`, `client_id`, `amount`, `concept`, `due_date`, `status`
   - `payments`: `id`, `client_id`, `date`, `concept`, `amount`, `method`, `reference`, `invoice_status`

2. **Mapeo de Campos**: Si tus columnas en Supabase usan snake_case (`unit_id`) pero el código espera camelCase (`unitId`), necesitarás mapear los datos en los servicios.

3. **Autenticación**: El hook `useAuth` maneja la sesión automáticamente. Asegúrate de que `LoginView` use la función `login` del hook.

4. **Manejo de Errores**: Agrega manejo de errores en la UI para mostrar mensajes cuando falle la carga de datos.

5. **Optimistic Updates**: Los hooks actualizan el estado local inmediatamente, pero deberías manejar errores y revertir cambios si falla la operación en Supabase.

