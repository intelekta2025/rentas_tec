// src/App.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users, CreditCard, AlertTriangle, Mail, Menu, Home,
  FileSpreadsheet, Settings, LogOut, CheckCircle, UserPlus,
  Building, DollarSign, FileText, Calendar, Download, School
} from 'lucide-react';
import { UNITS } from './data/constants'; // Solo constantes estáticas
import {
  SidebarItem, AppLogo, Modal
} from './components/ui/Shared';
import { LoginView } from './components/auth/LoginView';
import { ClientPortalDashboard, ClientPortalPayments } from './components/client/ClientViews';
import {
  DashboardView, ClientsView, ClientDetailView,
  MarketTecView, OverdueView, RemindersView, SettingsView,
  ContractForm, ClientForm
} from './components/admin/AdminViews';

// Importar hooks de Supabase
import { useAuth } from './hooks/useAuth';
import { useClients } from './hooks/useClients';
import { useInvoices, useOverdueInvoices, useUpcomingReminders } from './hooks/useInvoices';
import { useBusinessUnit } from './hooks/useBusinessUnit';
import { useClientPortalUsers } from './hooks/useClientPortalUsers';
import { generateBulkInvoices, cancelReceivables } from './services/invoiceService';
import { useContracts } from './hooks/useContracts';

// Componente wrapper para el formulario de contrato que usa el mismo hook que ClientDetailView
// Este componente debe compartir el mismo hook que ClientDetailViewWithPortalUsers
// Para que cuando se cree un contrato, se actualice automáticamente la lista
const ContractFormWrapper = ({ client, user, onClose, onContractCreated, contractToEdit }) => {
  const { addContract, editContract } = useContracts(client?.id);

  const handleSuccess = async () => {
    // Cerrar modal primero para mejor UX
    onClose();

    // Notificar al componente padre que se creó un contrato para forzar recarga
    // Agregamos un pequeño delay para asegurar que Supabase haya propagado el cambio
    if (onContractCreated) {
      setTimeout(() => {
        onContractCreated();
      }, 500);
    }
  };

  return (
    <ContractForm
      client={client}
      user={user}
      onClose={onClose}
      onSuccess={handleSuccess}
      onAddContract={addContract}
      onUpdateContract={editContract}
      contractToEdit={contractToEdit}
    // No pasamos onRefreshContracts interna porque queremos que la recarga la maneje el padre
    // a través de onContractCreated -> refreshKey
    />
  );
};

// Componente wrapper para ClientDetailView que carga los usuarios del portal y contratos
const ClientDetailViewWithPortalUsers = ({ client, setActiveTab, setContractModalOpen, generateContractPreview, setTerminationModalOpen, contractsRefreshKey, onPrepareEdit, onEditClient, onGenerateCXC }) => {
  const { portalUsers, loading: portalUsersLoading } = useClientPortalUsers(client?.id);
  const { contracts, loading: contractsLoading, addContract, finalizeContract, refreshContracts } = useContracts(client?.id);

  // Cargar receivables (Estado de Cuenta) reales
  const { invoices: receivables, loading: receivablesLoading, refreshInvoices, editInvoice, addPayment } = useInvoices({ clientId: client?.id });

  // Recargar contratos cuando cambie contractsRefreshKey
  useEffect(() => {
    if (contractsRefreshKey > 0) {
      refreshContracts();
      refreshInvoices();
    }
  }, [contractsRefreshKey, refreshContracts, refreshInvoices]);

  const handleFinalizeContract = async (contractId, receivableIdsToCancel = []) => {
    // Si hay receivables para cancelar, lo hacemos primero
    if (receivableIdsToCancel.length > 0) {
      await cancelReceivables(receivableIdsToCancel);
    }

    const result = await finalizeContract(contractId);
    if (result.success) {
      await refreshContracts();
      // También refrescar facturas ya que cambiamos estados
      await refreshInvoices();
    }
    return result;
  };

  const handleEditContract = (contract) => {
    if (onPrepareEdit) {
      onPrepareEdit(contract);
    }
    setContractModalOpen(true);
  };

  const handleAddContract = async (contractData) => {
    const result = await addContract(contractData);
    if (result.success) {
      // Recargar contratos después de crear uno nuevo
      await refreshContracts();
    }
    return result;
  };

  return (
    <ClientDetailView
      client={client}
      setActiveTab={setActiveTab}
      setContractModalOpen={setContractModalOpen}
      generateContractPreview={generateContractPreview}
      setTerminationModalOpen={setTerminationModalOpen}
      portalUsers={portalUsers}
      portalUsersLoading={portalUsersLoading}
      contracts={contracts}
      contractsLoading={contractsLoading}
      onFinalizeContract={handleFinalizeContract}
      onEditContract={handleEditContract}
      onAddContract={handleAddContract}
      onRefreshContracts={refreshContracts}
      onEditClient={onEditClient}
      onGenerateCXC={async (invoices) => {
        const result = await onGenerateCXC(invoices);
        if (result.success) {
          await refreshInvoices();
        }
        return result;
      }}
      onUpdateReceivable={async (id, data) => {
        const result = await editInvoice(id, data);
        if (result.success) {
          await refreshInvoices();
        }
        return result;
      }}
      onAddPayment={addPayment}
      receivables={receivables}
      receivablesLoading={receivablesLoading}
    />
  );
};

export default function App() {
  // Hook de autenticación (reemplaza useState de user)
  const { user, login, logout, loading: authLoading, error: authError } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Modals
  const [isAddClientModalOpen, setAddClientModalOpen] = useState(false);
  const [isContractModalOpen, setContractModalOpen] = useState(false);
  const [isTerminationModalOpen, setTerminationModalOpen] = useState(false);
  const [isAddUserModalOpen, setAddUserModalOpen] = useState(false);

  // Selection & State
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedOverdue, setSelectedOverdue] = useState([]);
  const [selectedReminders, setSelectedReminders] = useState([]);
  const [contractsRefreshKey, setContractsRefreshKey] = useState(0); // Para forzar recarga de contratos
  const [contractToEdit, setContractToEdit] = useState(null);
  const [clientToEdit, setClientToEdit] = useState(null);

  // Hooks de datos de Supabase
  // Solo ejecutar hooks si el usuario tiene los datos necesarios
  const shouldLoadAdminData = user && user.role !== 'Client' && user.unitId != null
  const shouldLoadClientData = user && user.role === 'Client' && user.clientId != null

  // Obtener información de la unidad de negocio
  const { unitName: businessUnitName } = useBusinessUnit(
    user?.role !== 'Client' ? user?.unitId : null
  )

  // Clientes - filtrados por unitId si es admin, null si es cliente
  const {
    clients: filteredClients,
    loading: clientsLoading,
    error: clientsError,
    addClient,
    editClient,
    removeClient
  } = useClients(shouldLoadAdminData ? user.unitId : null);

  // Facturas/CXC - filtradas según el rol
  const {
    invoices: filteredCXC,
    loading: invoicesLoading
  } = useInvoices(
    shouldLoadAdminData
      ? { unitId: user.unitId }
      : shouldLoadClientData
        ? { clientId: user.clientId }
        : {}
  );

  // Facturas vencidas (para vista de Overdue)
  const {
    invoices: overdueInvoicesList,
    loading: overdueLoading
  } = useOverdueInvoices(shouldLoadAdminData ? user.unitId : null);

  // Recordatorios próximos
  const {
    reminders: filteredUpcoming,
    loading: remindersLoading
  } = useUpcomingReminders(
    shouldLoadAdminData ? user.unitId : null,
    30 // días hacia adelante
  );

  // Pagos del cliente (solo si es cliente)
  // TODO: Restaurar cuando se implemente usePayments
  const clientPayments = [];
  const paymentsLoading = false;

  // Responsive: Close sidebar by default on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Handlers ---
  const handleLogin = async (email, password) => {
    const result = await login(email, password);
    if (result.success) {
      // El hook useAuth ya maneja el estado del usuario
      // El usuario se actualizará automáticamente a través del hook
      // No necesitamos hacer nada aquí, el componente se re-renderizará
    } else {
      // El error ya está en el hook, puedes mostrarlo en LoginView
      console.error('Error de login:', result.error);
    }
  };

  // Efecto para cambiar de tab SOLAMENTE cuando el usuario se loguea por primera vez
  // Evitar redirecciones si el usuario solo se actualiza (ej. refresh de token o fallback de cache)
  const prevUserRef = useRef(null);
  useEffect(() => {
    // Si pasamos de NO tener usuario a TENER usuario (Login inicial)
    if (user && !prevUserRef.current) {
      if (user.role === 'Client') {
        setActiveTab('clientPortal_account');
      } else {
        // Solo ir a dashboard si es login fresco, respetar navegación actual si ya estaba
        setActiveTab('dashboard');
      }
    }
    prevUserRef.current = user;
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setActiveTab('dashboard');
  };

  const handleClientClick = (client) => {
    setSelectedClient(client);
    setActiveTab('clientDetail');
  };

  // Mock functions needed for views (puedes reemplazarlos con funciones reales)
  const toggleOverdueSelection = (id) => {
    setSelectedOverdue(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };
  const toggleReminderSelection = (id) => {
    setSelectedReminders(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  // --- Data Calculations ---
  const adminStats = useMemo(() => {
    if (!user || user.role === 'Client') return { totalClients: 0, totalCXC: 0, overdueCount: 0, overdueAmount: 0, nextMonthIncome: 0 };

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Calcular mes siguiente
    let nextMonth = currentMonth + 1;
    let nextYear = currentYear;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }

    const stats = filteredCXC.reduce((acc, curr) => {
      // Ignorar cancelados para balances
      const isCancelled = ['cancelled', 'cancelado'].includes((curr.status || '').toLowerCase());

      const balance = curr.balanceDueRaw || 0;
      const fullAmount = curr.amountRaw || 0;
      const paid = curr.paidAmountRaw || 0;

      if (!isCancelled) {
        acc.totalCXC += balance;

        if (curr.status === 'Overdue' || (curr.status || '').toLowerCase() === 'vencido') {
          acc.overdueAmount += balance;
          acc.overdueCount++;
        }
      }

      // 1. Proyección: cualquier CXC (no cancelado) que venza el mes siguiente
      // O que su periodo explícito sea el mes siguiente
      const dateParts = curr.dueDate ? String(curr.dueDate).split('-') : null;
      let dYear = dateParts && dateParts.length >= 1 ? Number(dateParts[0]) : 0;
      const dMonth = dateParts && dateParts.length >= 2 ? Number(dateParts[1]) : 0;
      if (dYear > 0 && dYear < 100) dYear += 2000;

      let pYear = Number(curr.periodYear || 0);
      const pMonth = Number(curr.periodMonth || 0);
      if (pYear > 0 && pYear < 100) pYear += 2000;

      const matchesDate = dMonth === nextMonth && dYear === nextYear;
      const matchesPeriod = pMonth === nextMonth && pYear === nextYear;

      if (!isCancelled && (matchesDate || matchesPeriod)) {
        acc.nextMonthIncome += fullAmount;
      }

      // 2. Comportamiento Mensual (Gráfica): Solo para el año actual
      if (!isCancelled) {
        // Usar principalmente el periodo, si no el dueDate
        const mYear = pYear || dYear;
        const mMonth = pMonth || dMonth;

        if (mYear === currentYear && mMonth >= 1 && mMonth <= 12) {
          acc.monthlyStats[mMonth - 1].collected += paid;
          acc.monthlyStats[mMonth - 1].pending += balance;
        }
      }

      return acc;
    }, {
      totalCXC: 0,
      overdueAmount: 0,
      overdueCount: 0,
      nextMonthIncome: 0,
      monthlyStats: [
        { month: 'Ene', collected: 0, pending: 0 },
        { month: 'Feb', collected: 0, pending: 0 },
        { month: 'Mar', collected: 0, pending: 0 },
        { month: 'Abr', collected: 0, pending: 0 },
        { month: 'May', collected: 0, pending: 0 },
        { month: 'Jun', collected: 0, pending: 0 },
        { month: 'Jul', collected: 0, pending: 0 },
        { month: 'Ago', collected: 0, pending: 0 },
        { month: 'Sep', collected: 0, pending: 0 },
        { month: 'Oct', collected: 0, pending: 0 },
        { month: 'Nov', collected: 0, pending: 0 },
        { month: 'Dic', collected: 0, pending: 0 },
      ]
    });

    return {
      totalClients: filteredClients.filter(c => (c.status || '').toLowerCase() === 'activo').length,
      ...stats
    };
  }, [user, filteredClients, filteredCXC]);

  // Facturas del cliente (para portal de cliente)
  const myCXC = useMemo(() =>
    user?.role === 'Client' ? filteredCXC : [],
    [user, filteredCXC]
  );

  const clientStats = useMemo(() => {
    if (!user || user.role !== 'Client') return { balance: 0, pendingInvoices: 0 };

    const balance = myCXC
      .filter(i => ['pending', 'pendiente', 'partial', 'parcial', 'overdue', 'vencido'].includes((i.status || '').toLowerCase()))
      .reduce((acc, curr) => acc + parseFloat(String(curr.balanceDue || curr.balance_due || curr.amount || 0).replace(/[^0-9.-]+/g, "") || 0), 0);

    // Obtener próxima fecha de pago
    const nextPayment = myCXC
      .filter(i => i.status === 'Scheduled' || i.status === 'Pending')
      .sort((a, b) => new Date(a.due_date || a.dueDate) - new Date(b.due_date || b.dueDate))[0]?.due_date || null;

    return {
      balance,
      pendingInvoices: myCXC.filter(i => i.status === 'Pending').length,
      nextPayment: nextPayment ? new Date(nextPayment).toLocaleDateString('es-MX') : null
    };
  }, [user, myCXC]);

  const handleEditClientProfile = (client) => {
    setClientToEdit(client);
    setAddClientModalOpen(true);
  };

  const handleSaveClient = async (clientData) => {
    try {
      if (clientToEdit) {
        const result = await editClient(clientToEdit.id, clientData);
        // Actualizar el cliente seleccionado si es el mismo que estamos editando
        if (result.success && selectedClient && selectedClient.id === clientToEdit.id) {
          setSelectedClient(result.data);
        }
      } else {
        // Asegurar que el nuevo cliente tenga el unitId del usuario actual
        const newClientData = { ...clientData, unitId: user?.unitId };
        await addClient(newClientData);
      }
      setAddClientModalOpen(false);
      setClientToEdit(null);
    } catch (err) {
      console.error('Error al guardar cliente:', err);
    }
  };

  // Mostrar loading solo durante la carga inicial (cuando authLoading es true y no hay usuario aún)
  if (authLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostrar login
  if (!user) {
    return <LoginView onLogin={handleLogin} loginError={authError} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans">

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <div className={`bg-blue-950 text-white w-64 flex-shrink-0 flex flex-col transition-transform duration-300 shadow-xl fixed md:relative z-30 h-full ${isSidebarOpen ? 'translate-x-0' : '-translate-x-64'} md:translate-x-0`}>
        <div className="h-16 flex items-center px-6 bg-blue-900 shadow-md">
          <div className="flex items-center space-x-2">
            <AppLogo className="w-8 h-8" whiteBg />
            <span className="font-bold text-lg tracking-wide">Rentas</span>
          </div>
        </div>

        <div className="flex-1 py-6 overflow-y-auto">
          <div className="px-6 mb-6">
            <div className="text-xs text-blue-400 uppercase font-semibold mb-1">
              {user.role === 'Client' ? 'Portal de Cliente' : 'Unidad de Negocio'}
            </div>
            <div className="flex items-center text-white font-medium">
              <Building size={16} className="mr-2 text-blue-300" />
              {user.role === 'Client'
                ? user.clientName
                : (businessUnitName || user.unitName || `Unidad ${user.unitId}` || 'Sin unidad')}
            </div>
          </div>

          <nav className="space-y-1">
            {user.role === 'Admin' || user.role === 'SuperAdmin' ? (
              <>
                <SidebarItem icon={Home} label="Inicio" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <div className="pt-4 pb-2 px-6 text-xs uppercase text-blue-400 font-semibold tracking-wider">Operaciones</div>
                <SidebarItem icon={Users} label="Clientes" active={activeTab === 'clients' || activeTab === 'clientDetail'} onClick={() => setActiveTab('clients')} />
                <SidebarItem icon={FileSpreadsheet} label="Market Tec" active={activeTab === 'marketTec'} onClick={() => setActiveTab('marketTec')} />
                <SidebarItem icon={AlertTriangle} label="Cuentas Vencidas" active={activeTab === 'overdue'} onClick={() => setActiveTab('overdue')} />
                <SidebarItem icon={Mail} label="Recordatorios" active={activeTab === 'reminders'} onClick={() => setActiveTab('reminders')} />

                <div className="pt-4 pb-2 px-6 text-xs uppercase text-blue-400 font-semibold tracking-wider">Administración</div>
                <SidebarItem icon={Settings} label="Configuración" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
              </>
            ) : (
              <>
                <SidebarItem icon={FileText} label="Estado de Cuenta" active={activeTab === 'clientPortal_account'} onClick={() => setActiveTab('clientPortal_account')} />
                <SidebarItem icon={CreditCard} label="Mis Pagos" active={activeTab === 'clientPortal_payments'} onClick={() => setActiveTab('clientPortal_payments')} />
              </>
            )}
          </nav>
        </div>
        <div className="p-4 bg-blue-900">
          <button onClick={handleLogout} className="flex items-center space-x-3 text-blue-200 hover:text-white transition-colors w-full">
            <LogOut size={18} />
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden h-screen w-full">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 z-10 shrink-0">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-gray-500 hover:text-gray-700 focus:outline-none md:hidden mr-4">
              <Menu size={24} />
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
              {user.role === 'Client' ? 'Mi Estado de Cuenta' : 'Administración'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 hidden md:inline">
              {user.role === 'Admin' && (
                <span className="font-semibold text-blue-800">
                  {businessUnitName || user.unitName || `Unidad ${user.unitId}` || 'Sin unidad'}
                </span>
              )}
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-semibold text-sm">
              {user.name?.substring(0, 2).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100 w-full">
          {/* Mostrar indicadores de carga si es necesario - solo si el usuario tiene datos válidos */}
          {user && ((shouldLoadAdminData && (clientsLoading || invoicesLoading)) || (shouldLoadClientData && invoicesLoading)) && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
              Cargando datos...
            </div>
          )}

          {user.role === 'Client' ? (
            <>
              {activeTab === 'clientPortal_account' && (
                <ClientPortalDashboard
                  user={user}
                  clientStats={clientStats}
                  myCXC={myCXC}
                />
              )}
              {activeTab === 'clientPortal_payments' && (
                <ClientPortalPayments
                  user={user}
                  payments={clientPayments}
                  loading={paymentsLoading}
                />
              )}
            </>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  adminStats={adminStats}
                  user={user}
                  unitName={businessUnitName || user.unitName}
                  setActiveTab={setActiveTab}
                />
              )}
              {activeTab === 'clients' && (
                <ClientsView
                  filteredClients={filteredClients}
                  setAddClientModalOpen={setAddClientModalOpen}
                  handleClientClick={handleClientClick}
                  user={user}
                  loading={clientsLoading}
                  error={clientsError}
                  onAddClient={addClient}
                  unitName={businessUnitName || user.unitName}
                />
              )}
              {activeTab === 'clientDetail' && selectedClient && (
                <ClientDetailViewWithPortalUsers
                  client={selectedClient}
                  setActiveTab={setActiveTab}
                  setContractModalOpen={setContractModalOpen}
                  setTerminationModalOpen={setTerminationModalOpen}
                  contractsRefreshKey={contractsRefreshKey}
                  onPrepareEdit={setContractToEdit}
                  onEditClient={handleEditClientProfile}
                  onGenerateCXC={async (invoices) => {
                    const result = await generateBulkInvoices(invoices);
                    // Forzar recarga de movimientos del cliente si fuera necesario
                    // Por ahora, el estado de cuenta se recarga al entrar a la pestaña o refrescar
                    return { success: !result.error, error: result.error };
                  }}
                />
              )}
              {activeTab === 'overdue' && (
                <OverdueView
                  filteredCXC={overdueInvoicesList.length > 0 ? overdueInvoicesList : filteredCXC.filter(i => i.status === 'Overdue')}
                  selectedOverdue={selectedOverdue}
                  toggleOverdueSelection={toggleOverdueSelection}
                  user={user}
                  loading={overdueLoading || invoicesLoading}
                  unitName={businessUnitName || user.unitName}
                />
              )}
              {activeTab === 'marketTec' && (
                <MarketTecView
                  user={user}
                  unitName={businessUnitName || user.unitName}
                />
              )}
              {activeTab === 'reminders' && (
                <RemindersView
                  filteredUpcoming={filteredUpcoming}
                  selectedReminders={selectedReminders}
                  toggleReminderSelection={toggleReminderSelection}
                  user={user}
                  loading={remindersLoading}
                  unitName={businessUnitName || user.unitName}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsView
                  setAddUserModalOpen={setAddUserModalOpen}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals placed here for cleaner DOM structure (using the Shared Modal component) */}
      <Modal
        isOpen={isAddClientModalOpen}
        onClose={() => { setAddClientModalOpen(false); setClientToEdit(null); }}
        title={clientToEdit ? "Editar Cliente" : "Nuevo Cliente"}
      >
        <ClientForm
          clientToEdit={clientToEdit}
          onSave={handleSaveClient}
          onClose={() => { setAddClientModalOpen(false); setClientToEdit(null); }}
          unitId={user.unitId}
        />
      </Modal>
      <Modal isOpen={isContractModalOpen} onClose={() => { setContractModalOpen(false); setContractToEdit(null); }} title={contractToEdit ? "Editar Contrato" : "Crear Contrato"}>
        {selectedClient && user ? (
          <ContractFormWrapper
            client={selectedClient}
            user={user}
            onClose={() => { setContractModalOpen(false); setContractToEdit(null); }}
            contractToEdit={contractToEdit}
            onContractCreated={() => {
              // Forzar recarga de contratos en ClientDetailViewWithPortalUsers
              setContractsRefreshKey(prev => prev + 1);
            }}
          />
        ) : (
          <div className="p-4">
            <p className="text-gray-600">No se puede crear un contrato sin un cliente seleccionado.</p>
          </div>
        )}
      </Modal>
      <Modal isOpen={isTerminationModalOpen} onClose={() => setTerminationModalOpen(false)} title="Finalizar Contrato">
        <div className="p-4">Formulario de Terminación</div>
      </Modal>
      <Modal isOpen={isAddUserModalOpen} onClose={() => setAddUserModalOpen(false)} title="Nuevo Usuario">
        <div className="p-4">Formulario de Usuario</div>
      </Modal>

    </div>
  );
}
