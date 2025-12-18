# AI Coding Guidelines for Rentas Tec

## Project Overview
This is a React-based rental management system for Tec de Monterrey campuses, handling office spaces, coworking, auditoriums, and related services. The app supports two user roles: administrators (unit managers) and clients (tenants).

## Architecture
- **Single-page app** with tab-based navigation (no routing library)
- **Role-based rendering**: Admins see unit-filtered dashboards; clients access personal portals
- **Data flow**: Mock data in `src/data/constants.js` → filtered in `App.jsx` → passed as props to view components
- **Component organization**: 
  - `src/components/admin/` - Admin views (dashboard, clients, overdue, etc.)
  - `src/components/client/` - Client portal (account, payments)
  - `src/components/auth/` - Login
  - `src/components/ui/` - Shared reusable components

## Key Patterns
- **State management**: Centralized in `App.jsx` with `useState`, props drilling to components
- **Data filtering**: Admins see only their unit's data (filtered by `unitId`)
- **UI components**: Consistent styling with Tailwind CSS + Lucide icons
- **Status system**: Use `StatusBadge` for statuses like Active/Pending/Overdue/Scheduled
- **Currency handling**: Amounts stored as strings with $ (e.g., "$15,000.00"), parsed with regex for calculations

## Conventions
- **Language**: Spanish UI labels and concepts (e.g., "Clientes", "Cuentas por Cobrar")
- **Units**: Campus locations (Campus Norte, Sur, etc.) with IDs 1-4
- **RFC**: Mexican tax ID format for clients
- **Statuses**: 
  - Clients: Active/Pending/Overdue
  - Invoices: Paid/Pending/Overdue/Scheduled
- **Icons**: Lucide React icons imported individually (e.g., `import { Users, CreditCard } from 'lucide-react'`)

## Developer Workflows
- **Development**: `npm run dev` (Vite dev server)
- **Build**: `npm run build` (Vite production build)
- **Lint**: `npm run lint` (ESLint with React rules)
- **Preview**: `npm run preview` (Serve built app)

## Key Files
- `src/App.jsx` - Main app logic, state, and conditional rendering
- `src/data/constants.js` - Mock data structures (clients, invoices, units)
- `src/components/ui/Shared.jsx` - Reusable UI components (KPICard, StatusBadge, etc.)
- `src/components/admin/AdminViews.jsx` - Admin dashboard and management views
- `src/components/client/ClientViews.jsx` - Client portal views

## Adding Features
- New views: Add to `App.jsx` activeTab logic and import/render in the appropriate role section
- New data: Add to `constants.js` with proper unitId/clientId relationships
- UI consistency: Use existing Shared components and Tailwind classes
- Filtering: Always filter data by `user.unitId` for admins, `user.clientId` for clients</content>
<parameter name="filePath">c:\Users\rosaa\rentas_tec\.github\copilot-instructions.md