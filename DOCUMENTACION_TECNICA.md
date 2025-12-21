# Documentación Técnica del Proyecto Rentas Tec

## 1. Visión General
Este proyecto es una aplicación web para la administración de rentas y un portal para clientes, construida con tecnologías modernas de React y respaldada por Supabase para la base de datos y autenticación.

## 2. Pila Tecnológica
- **Frontend**: React 19, Vite, Tailwind CSS.
- **Backend/Database**: Supabase (PostgreSQL, Auth, Storage).
- **Linter**: ESLint.
- **Iconos**: Lucide React.

## 3. Arquitectura del Proyecto

La estructura del proyecto sigue un patrón modular y escalable, separando claramente las responsabilidades:

- **`src/lib/`**: Configuración de infraestructura (ej. `supabase.js` para el cliente de Supabase).
- **`src/services/`**: Capa de acceso a datos. Contiene la lógica pura de interacción con Supabase (CRUD, Queries). No contiene estado de React.
- **`src/hooks/`**: Custom Hooks que consumen los servicios. Manejan el estado de la UI (loading, error, data) y exponen funciones fáciles de usar para los componentes.
- **`src/components/`**: Componentes de UI. Se dividen en `admin` (vistas de administrador), `client` (portal de cliente), `auth` (login) y `ui` (componentes reutilizables).
- **`src/data/`**: Constantes y datos estáticos.

Para más detalles sobre la estructura de archivos, consultar `SUPABASE_ESTRUCTURA.md`.

## 4. Sistema de Autenticación (`authService.js`)

El sistema de autenticación es robusto y maneja dos tipos de usuarios que se almacenan en tablas diferentes, pero comparten la autenticación de Supabase Auth.

### Flujo de Login (`signIn`)
1.  **Autenticación**: Se llama a `supabase.auth.signInWithPassword`.
2.  **Recuperación de Perfil**: Una vez autenticado, el sistema busca detalles adicionales del usuario.
    -   Primero busca en la tabla `system_users` (Administradores/Staff).
    -   Si no lo encuentra, busca en `client_portal_users` (Clientes).
3.  **Manejo de Errores y Timeouts**:
    -   El servicio implementa estrategias de "race condition" con timeouts para evitar que la aplicación se quede colgada si la red es lenta.
    -   Maneja errores específicos como 406 (Not Acceptable) o problemas de schema/RLS (Row Level Security).
4.  **Consolidación**: Retorna un objeto unificado con los datos de autenticación y el perfil del usuario (rol, nombre, IDs asociados).

### Hooks de Autenticación (`useAuth`)
El hook `useAuth` envuelve la lógica del servicio y expone:
-   `user`: Objeto del usuario actual (o null).
-   `login(email, password)`: Función para iniciar sesión.
-   `logout()`: Función para cerrar sesión.
-   `loading`: Estado de carga.

## 5. Gestión de Datos y Estado

La aplicación utiliza un patrón de **Service -> Hook -> Component**:

1.  **Service** (`invoiceService.js`, `clientService.js`):
    -   Ejecuta la consulta a Supabase.
    -   Ejemplo: `supabase.from('invoices').select('*')...`

2.  **Hook** (`useInvoices.js`, `useClients.js`):
    -   Usa `useState` para guardar los datos.
    -   Usa `useEffect` para cargar datos al montar o cuando cambian dependencias (como `user.id`).
    -   Expone funciones como `refreshInvoices` para recargar manualmente.

3.  **Component** (`DashboardView.jsx`):
    -   Consume el hook: `const { invoices, loading } = useInvoices(...)`.
    -   Renderiza la UI basada en el estado.

## 6. Vistas Principales

### Panel de Administración (`App.jsx` - Admin Role)
-   **Dashboard**: Resumen de clientes, cuentas por cobrar y vencidas.
-   **Clientes**: Listado y gestión (CRUD) de clientes. Incluye modales para creación.
-   **Market Tec**: Vista específica (propósito por definir en detalle).
-   **Cuentas Vencidas**: Filtro de facturas con estado 'Overdue'.
-   **Recordatorios**: Alertas próximas.

### Portal de Cliente (`App.jsx` - Client Role)
-   **Estado de Cuenta**: Resumen de su saldo y facturas pendientes.
-   **Mis Pagos**: Historial de pagos (placeholder actualmente).

## 7. Solución de Problemas Comunes

### Error de Schema / RLS
Si aparece errores como "Database error querying schema", generalmente es por políticas de seguridad (RLS) mal configuradas en Supabase.
-   **Solución**: Verificar `SOLUCION_ERROR_SCHEMA.md` para comandos SQL que corrigen los permisos de `system_users` y `client_portal_users`.

### Timeouts
El servicio de autenticación tiene timeouts configurados (10s - 30s) para evitar bloqueos. Si ocurren frecuentemente, revisar la conexión a internet o el estado de los servicios de Supabase.
