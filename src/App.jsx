// src/App.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, CreditCard, AlertTriangle, Mail, Menu, Home,
  FileSpreadsheet, Settings, LogOut, CheckCircle, UserPlus,
  Building, DollarSign, FileText, Calendar, Download, School
} from 'lucide-react';
import { UNITS, mockClients, mockCXC, mockUpcoming, mockMonthlyStats } from './data/constants';
import { 
  SidebarItem, AppLogo, Modal 
} from './components/ui/Shared';
import { LoginView } from './components/auth/LoginView';
import { ClientPortalDashboard, ClientPortalPayments } from './components/client/ClientViews';
import { 
  DashboardView, ClientsView, ClientDetailView, 
  MarketTecView, OverdueView, RemindersView, SettingsView 
} from './components/admin/AdminViews';

export default function App() {
  const [user, setUser] = useState(null); 
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  // Modals
  const [isAddClientModalOpen, setAddClientModalOpen] = useState(false);
  const [isContractModalOpen, setContractModalOpen] = useState(false);
  const [isTerminationModalOpen, setTerminationModalOpen] = useState(false); 
  const [isAddUserModalOpen, setAddUserModalOpen] = useState(false); 

  // Selection & State
  const [selectedClient, setSelectedClient] = useState(null);
  const [generatedSchedule, setGeneratedSchedule] = useState([]);
  const [selectedOverdue, setSelectedOverdue] = useState([]);
  const [selectedReminders, setSelectedReminders] = useState([]);
  const [terminationDate, setTerminationDate] = useState('');

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
  const handleLogin = (userData) => {
    setUser(userData);
    if (userData.role === 'Client') {
      setActiveTab('clientPortal_account');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('dashboard'); 
  };

  const handleClientClick = (client) => {
    setSelectedClient(client);
    setActiveTab('clientDetail');
  };

  // Mock functions needed for views
  const generateContractPreview = () => { /* ... logic ... */ };
  const toggleOverdueSelection = (id) => { /* ... logic ... */ };
  const toggleReminderSelection = (id) => { /* ... logic ... */ };

  // --- Data Calculations ---
  const filteredClients = useMemo(() => user?.role !== 'Client' ? mockClients.filter(c => c.unitId === user?.unitId) : [], [user]);
  const filteredCXC = useMemo(() => user?.role !== 'Client' ? mockCXC.filter(c => c.unitId === user?.unitId) : [], [user]);
  const filteredUpcoming = useMemo(() => user?.role !== 'Client' ? mockUpcoming.filter(c => c.unitId === user?.unitId) : [], [user]);
  
  const adminStats = useMemo(() => {
     if (!user || user.role === 'Client') return { totalClients: 0, totalCXC: 0, overdueCount: 0 };
     return {
         totalClients: filteredClients.length,
         totalCXC: filteredCXC.reduce((acc, curr) => acc + parseFloat(curr.amount.replace(/[^0-9.-]+/g,"")), 0),
         overdueCount: filteredCXC.filter(i => i.status === 'Overdue').length
     };
  }, [user, filteredClients, filteredCXC]);

  const myCXC = useMemo(() => user?.role === 'Client' ? mockCXC.filter(c => c.clientId === user.clientId) : [], [user]);
  const clientStats = useMemo(() => {
      if (!user || user.role !== 'Client') return { balance: 0, pendingInvoices: 0 };
      return {
          balance: myCXC.filter(i => i.status === 'Pending' || i.status === 'Overdue').reduce((acc, curr) => acc + parseFloat(curr.amount.replace(/[^0-9.-]+/g,"")), 0),
          pendingInvoices: myCXC.filter(i => i.status === 'Pending').length,
          nextPayment: '15/Dic/2023' // Mock
      };
  }, [user, myCXC]);


  if (!user) return <LoginView onLogin={handleLogin} />;

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
               {user.role === 'Client' ? user.clientName : UNITS[user.unitId]}
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
                 {user.role === 'Admin' && <><span className="font-semibold text-blue-800">{UNITS[user.unitId]}</span></>}
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-semibold text-sm">
                {user.name.substring(0,2).toUpperCase()}
              </div>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100 w-full">
           {user.role === 'Client' ? (
             <>
               {activeTab === 'clientPortal_account' && <ClientPortalDashboard user={user} clientStats={clientStats} myCXC={myCXC} />}
               {activeTab === 'clientPortal_payments' && <ClientPortalPayments user={user} />}
             </>
           ) : (
             <>
              {activeTab === 'dashboard' && <DashboardView adminStats={adminStats} mockMonthlyStats={mockMonthlyStats} user={user} />}
              {activeTab === 'clients' && <ClientsView filteredClients={filteredClients} setAddClientModalOpen={setAddClientModalOpen} handleClientClick={handleClientClick} user={user} />}
              {activeTab === 'clientDetail' && selectedClient && <ClientDetailView client={selectedClient} setActiveTab={setActiveTab} setContractModalOpen={setContractModalOpen} generateContractPreview={generateContractPreview} setTerminationModalOpen={setTerminationModalOpen} />}
              {activeTab === 'overdue' && <OverdueView filteredCXC={filteredCXC} selectedOverdue={selectedOverdue} toggleOverdueSelection={toggleOverdueSelection} user={user} />}
              {activeTab === 'marketTec' && <MarketTecView user={user} />}
              {activeTab === 'reminders' && <RemindersView filteredUpcoming={filteredUpcoming} selectedReminders={selectedReminders} toggleReminderSelection={toggleReminderSelection} user={user} />}
              {activeTab === 'settings' && <SettingsView setAddUserModalOpen={setAddUserModalOpen} />}
             </>
           )}
        </main>
      </div>
      
      {/* Modals placed here for cleaner DOM structure (using the Shared Modal component) */}
      <Modal isOpen={isAddClientModalOpen} onClose={() => setAddClientModalOpen(false)} title="Nuevo Cliente">
         <div className="p-4">Formulario de Nuevo Cliente</div>
      </Modal>
       <Modal isOpen={isContractModalOpen} onClose={() => setContractModalOpen(false)} title="Crear Contrato">
         <div className="p-4">Formulario de Contrato</div>
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