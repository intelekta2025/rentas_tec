import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import ClientForm from './ClientForm';
export { ClientForm };
import {
  Users, CreditCard, AlertTriangle, Mail, Menu, Home,
  FileSpreadsheet, Settings, LogOut, CheckCircle, UserPlus,
  Building, DollarSign, FileText, Calendar, Download, School,
  Plus, Send, ChevronRight, FileCheck, Ban, Edit, Zap, Trash2,
  Key, UploadCloud, Loader, Play, Filter, Shield, Eye, User, Phone, Lightbulb,
  ChevronUp, ChevronDown
} from 'lucide-react';
import { StatusBadge, OverdueBadge, KPICard, RevenueChart, Modal } from '../ui/Shared';
import { UNITS, mockStaff } from '../../data/constants';

export const DashboardView = ({ adminStats, user, unitName, setActiveTab }) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800">Panel General - {unitName || (user?.unitId ? `Unidad ${user.unitId}` : 'Sin unidad')}</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Clientes" value={adminStats.totalClients} icon={Users} color="#003DA5" subtext="En esta unidad" />
        <KPICard title="Por Cobrar" value={`$${adminStats.totalCXC.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} `} icon={CreditCard} color="#F59E0B" subtext="Facturación pendiente" />
        <KPICard
          title="Monto Vencido"
          value={`$${(adminStats.overdueAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} `}
          icon={AlertTriangle}
          color="#EF4444"
          subtext={`${adminStats.overdueCount || 0} cuentas requieren atención`}
          onClick={() => setActiveTab('overdue')}
        />
        <KPICard
          title="Proyección Ingresos"
          value={`$${(adminStats.nextMonthIncome || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} `}
          icon={Calendar}
          color="#10B981"
          subtext="Cobros del próximo mes"
        />
      </div>

      {/* Revenue Chart */}
      <div className="overflow-x-auto">
        <RevenueChart data={adminStats.monthlyStats || []} year={currentYear} />
      </div>
    </div>
  );
};

export const ClientsView = ({ filteredClients, setAddClientModalOpen, handleClientClick, user, unitName, loading, error }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Activo') // 'Todos', 'Activo', 'Inactivo'

  // Filtrar clientes por término de búsqueda y estado
  const finalFilteredClients = filteredClients.filter(client => {
    // Filtro de búsqueda (ahora incluye user_market_tec)
    const matchesSearch =
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.user_market_tec || client.User_market_tec || '').toLowerCase().includes(searchTerm.toLowerCase())

    // Filtro de estado
    const matchesStatus = statusFilter === 'Todos' || client.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          Clientes - {unitName || `Unidad ${user.unitId}`}
          <span className="ml-3 px-2.5 py-0.5 bg-gray-100 text-gray-600 text-sm font-semibold rounded-full border border-gray-200">
            {finalFilteredClients.length}
          </span>
        </h2>
        <button onClick={() => setAddClientModalOpen(true)} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-all active:scale-95">
          <Plus size={18} className="mr-2" /> Nuevo Cliente
        </button>
      </div>

      {/* Mostrar error si existe */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">Error al cargar clientes: {error}</p>
        </div>
      )}

      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4 bg-gray-50/50 border-b border-gray-200 flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
          {/* Barra de Búsqueda */}
          <div className="relative flex-1">
            <input
              type="text"
              className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              placeholder="Buscar por nombre, contacto o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtros de Estado */}
          <div className="flex items-center space-x-1 p-1 bg-gray-100 rounded-lg">
            {['Todos', 'Activo', 'Inactivo'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${statusFilter === filter
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                  }`}
              >
                {filter === 'Todos' ? 'Todos' : filter === 'Activo' ? 'Activos' : 'Inactivos'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando clientes...</p>
          </div>
        ) : finalFilteredClients.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-gray-300" size={32} />
            </div>
            <p className="text-gray-500 font-medium">
              {searchTerm || statusFilter !== 'Todos'
                ? 'No se encontraron clientes con estos filtros.'
                : 'No hay clientes registrados.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Cliente</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Total del contrato</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Saldo pendiente</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Saldo vencido</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Usuario Market Tec</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {finalFilteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-blue-50/30 cursor-pointer transition-colors"
                    onClick={() => handleClientClick(client)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 uppercase">{client.name || 'Sin nombre'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-bold">${(client.totalContract || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">${(client.pendingBalance || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-bold flex items-center ${client.overdueBalance > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        ${(client.overdueBalance || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        {client.overdueBalance > 0 && <AlertTriangle size={14} className="ml-1" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 font-medium italic">
                        {client.user_market_tec || client.User_market_tec || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={client.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export const ClientDetailView = ({ client, setActiveTab, setContractModalOpen, portalUsers = [], portalUsersLoading = false, contracts = [], contractsLoading = false, onFinalizeContract, onEditContract, onEditClient, onGenerateCXC, onUpdateReceivable, onAddPayment, onAddManualReceivable, receivables = [], receivablesLoading = false }) => {
  const [isGenerateModalOpen, setGenerateModalOpen] = useState(false);
  const [contractToGenerate, setContractToGenerate] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [generationType, setGenerationType] = useState('Rent'); // 'Rent' or 'Service'
  const [sortConfig, setSortConfig] = useState({ key: 'dueDate', direction: 'asc' });
  const [isEditReceivableModalOpen, setEditReceivableModalOpen] = useState(false);
  const [receivableToEdit, setReceivableToEdit] = useState(null);
  const [isRegisterPaymentModalOpen, setRegisterPaymentModalOpen] = useState(false);
  const [receivableToPay, setReceivableToPay] = useState(null);
  const [movementStatusFilter, setMovementStatusFilter] = useState('Todos');
  const [isFinalizeConfirmationModalOpen, setFinalizeConfirmationModalOpen] = useState(false);
  const [isAddManualReceivableModalOpen, setAddManualReceivableModalOpen] = useState(false);
  const [contractToTerminate, setContractToTerminate] = useState(null);
  const [receivablesToCancel, setReceivablesToCancel] = useState([]);
  const [manualReceivableForm, setManualReceivableForm] = useState({
    type: 'Rent',
    periodMonth: new Date().getMonth() + 1,
    periodYear: new Date().getFullYear(),
    dueDate: new Date().toISOString().split('T')[0],
    amount: '',
    concept: ''
  });

  // Seleccionar automáticamente el primer contrato activo si no hay ninguno seleccionado
  useEffect(() => {
    if (!selectedContractId && contracts.length > 0) {
      const activeContract = contracts.find(c => c.status === 'Activo' || c.status === 'activo') || contracts[0];
      setSelectedContractId(activeContract.id);
    }
  }, [contracts, selectedContractId]);

  // Auto-calcular concepto para registro manual
  useEffect(() => {
    if (isAddManualReceivableModalOpen) {
      const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      const monthName = monthNames[manualReceivableForm.periodMonth - 1];
      const typeLabel = manualReceivableForm.type === 'Rent' ? 'Renta' :
        manualReceivableForm.type === 'Service' ? 'Luz/Servicios' : 'Cargo';

      const newConcept = `${typeLabel} ${monthName} ${manualReceivableForm.periodYear}`;

      setManualReceivableForm(prev => {
        // Solo actualizar si el concepto actual está vacío o si es un concepto generado automáticamente previo
        // Para simplificar y seguir la instrucción del usuario ("Calculame automaticamente"), lo actualizaremos siempre
        // a menos que el usuario lo haya editado manualmente (podríamos añadir un flag 'isConceptEdited', 
        // pero el usuario pidió automatización directa).
        return {
          ...prev,
          concept: newConcept
        };
      });
    }
  }, [manualReceivableForm.type, manualReceivableForm.periodMonth, manualReceivableForm.periodYear, isAddManualReceivableModalOpen]);

  const selectedContract = contracts.find(c => c.id === selectedContractId);


  // Filter and Sort CXC for this specific client and selected contract
  const filteredReceivablesList = [...receivables]
    .filter(item => {
      const matchesContract = item.contractId === selectedContractId;
      if (!matchesContract) return false;

      if (movementStatusFilter === 'Todos') return true;
      if (movementStatusFilter === 'Vencido') return item.status === 'Overdue';
      if (movementStatusFilter === 'Pendiente') return item.status.toLowerCase() === 'pending' || item.status.toLowerCase() === 'pendiente';
      if (movementStatusFilter === 'Pagado') return item.status.toLowerCase() === 'paid' || item.status.toLowerCase() === 'pagado';
      return true;
    });

  const sortedReceivables = filteredReceivablesList.sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    // Special handling for period (Year + Month)
    if (sortConfig.key === 'period') {
      aVal = (a.periodYear || 0) * 100 + (a.periodMonth || 0);
      bVal = (b.periodYear || 0) * 100 + (b.periodMonth || 0);
    }

    // Special handling for amounts
    if (['amount', 'paidAmount', 'balanceDue'].includes(sortConfig.key)) {
      aVal = typeof aVal === 'string' ? parseFloat(aVal.replace(/[^0-9.-]+/g, "")) : parseFloat(aVal || 0);
      bVal = typeof bVal === 'string' ? parseFloat(bVal.replace(/[^0-9.-]+/g, "")) : parseFloat(bVal || 0);
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredReceivables = sortedReceivables; // For compatibility with existing code

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronUp size={14} className="ml-1 text-gray-300" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="ml-1 text-blue-600" /> : <ChevronDown size={14} className="ml-1 text-blue-600" />;
  };

  const handleFinalizeClick = (contract) => {
    // Buscar CXC pendientes (saldo > 0) para este contrato
    const pending = receivables.filter(r =>
      r.contractId === contract.id &&
      !['paid', 'pagado', 'cancelled', 'cancelado'].includes(r.status.toLowerCase())
    );

    setContractToTerminate(contract);
    setReceivablesToCancel(pending);
    setFinalizeConfirmationModalOpen(true);
  };

  const handleExportExcel = () => {
    if (!filteredReceivables || filteredReceivables.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const exportData = filteredReceivables.map(item => {
      const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const periodStr = item.periodMonth ? `${monthNames[item.periodMonth - 1]} ${String(item.periodYear).substring(2)}` : '-';

      return {
        'Tipo': (item.type === 'Rent' || item.type === 'Renta') ? 'Renta' : 'Luz/Servicios',
        'Mes': periodStr,
        'Concepto': item.concept || '-',
        'Vencimiento': item.dueDate || '-',
        'Monto': parseFloat(String(item.amount || 0).replace(/[^0-9.-]+/g, "")),
        'Pagado': parseFloat(String(item.amount_paid || 0).replace(/[^0-9.-]+/g, "")),
        'Saldo': item.balanceDueRaw || 0,
        'Estado': item.status
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Estado de Cuenta");

    // Generar nombre de archivo
    const date = new Date().toISOString().split('T')[0];
    const fileName = `Estado_de_Cuenta_${client.name.replace(/\s+/g, '_')}_${date}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  const handleAddManualReceivable = async (e) => {
    e.preventDefault();
    if (!selectedContractId) {
      alert("Por favor seleccione un contrato primero");
      return;
    }

    setIsGenerating(true);
    try {
      const data = {
        ...manualReceivableForm,
        unitId: client.unitId,
        clientId: client.id,
        contractId: selectedContractId,
        status: 'Pending'
      };

      const result = await onAddManualReceivable(data);
      if (result.success) {
        setAddManualReceivableModalOpen(false);
        setManualReceivableForm({
          type: 'Rent',
          periodMonth: new Date().getMonth() + 1,
          periodYear: new Date().getFullYear(),
          dueDate: new Date().toISOString().split('T')[0],
          amount: '',
          concept: ''
        });
      } else {
        alert("Error al crear el registro: " + (result.error?.message || "Error desconocido"));
      }
    } catch (err) {
      console.error(err);
      alert("Error inesperado al crear el registro");
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateBalance = (items) => items.reduce((acc, curr) => {
    return acc + (curr.balanceDueRaw || 0);
  }, 0);

  const balance = calculateBalance(filteredReceivables.filter(i =>
    ['pending', 'pendiente', 'partial', 'parcial', 'overdue'].includes(i.status.toLowerCase())
  ));

  const overdueTotal = calculateBalance(filteredReceivables.filter(i =>
    i.status.toLowerCase() === 'overdue'
  ));

  const totalPaid = filteredReceivables.reduce((acc, curr) => {
    return acc + (curr.paidAmountRaw || 0);
  }, 0);

  const contractTotal = filteredReceivables.reduce((acc, curr) => {
    return acc + (curr.amountRaw || 0);
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
        <button onClick={() => setActiveTab('clients')} className="hover:text-blue-600 hover:underline">Clientes</button>
        <ChevronRight size={16} />
        <span className="font-semibold text-gray-800">{client.name}</span>
      </div>

      {/* Top Profile Card */}
      <div className="bg-white shadow rounded-lg overflow-hidden flex flex-col md:flex-row">
        {/* Left Side: Client Info */}
        <div className="p-6 flex-1 flex flex-col md:flex-row justify-between items-start md:items-center border-b md:border-b-0 md:border-r border-gray-100">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl mr-5">
              {client.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 mt-2">
                <span className="flex items-center" title="Correo de contacto">
                  <Mail size={14} className="mr-1.5 text-blue-600" /> {client.email}
                </span>
                <span className="flex items-center" title="Contacto principal">
                  <User size={14} className="mr-1.5 text-blue-600" /> {client.contact}
                </span>
                <span className="flex items-center" title="Teléfono">
                  <Phone size={14} className="mr-1.5 text-blue-600" /> {client.contactPhone || client.contact_phone || '-'}
                </span>
                <span className="flex items-center" title="Usuario Market Tec">
                  <Users size={14} className="mr-1.5 text-blue-600" /> {client.user_market_tec || client.User_market_tec || '-'}
                </span>
                <span className="flex items-center">
                  <FileText size={14} className="mr-1.5 text-gray-400" /> <span className="text-gray-400">ID: {client.id}</span>
                </span>
              </div>
              <div className="mt-3 flex space-x-2">
                <StatusBadge status={client.status} />
              </div>
            </div>
          </div>
          <div className="flex space-x-3 w-full md:w-auto">
            <button
              onClick={() => onEditClient && onEditClient(client)}
              className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-50"
              title="Editar perfil del cliente"
            >
              <Edit size={18} />
            </button>
          </div>
        </div>

        {/* Right Side: Portal Users Management */}
        <div className="w-full md:w-80 bg-gray-50 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Usuarios del Portal</h3>
            <button className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center">
              <UserPlus size={14} className="mr-1" /> Agregar
            </button>
          </div>
          {portalUsersLoading ? (
            <div className="py-2 text-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-900 mx-auto"></div>
            </div>
          ) : portalUsers.length === 0 ? (
            <p className="text-xs text-gray-500 py-2 text-center italic">Sin usuarios registrados</p>
          ) : (
            <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
              {portalUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-gray-200 shadow-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 truncate">{user.name || user.full_name || 'Sin nombre'}</p>
                    <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                    <button className="text-gray-400 hover:text-red-500 transition-colors" title="Eliminar">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <button className="w-full text-center text-[10px] text-blue-600 hover:underline flex justify-center items-center">
              <Key size={10} className="mr-1" /> Restablecer contraseñas
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-400 transition-all hover:shadow-md">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total del contrato</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">${contractTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500 transition-all hover:shadow-md">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total de pagos del contrato</div>
            <div className="text-2xl font-bold text-green-600 mt-1">${totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500 transition-all hover:shadow-md">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Saldo del contrato</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">${balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500 transition-all hover:shadow-md">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Deuda Vencida</div>
            <div className="text-2xl font-bold text-red-600 mt-1 flex items-center">
              ${overdueTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              {overdueTotal > 0 && <AlertTriangle size={16} className="ml-2" />}
            </div>
          </div>
        </div>

        {/* Contratos Existentes */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Contratos</h3>
            <button
              onClick={() => { setContractModalOpen(true); }}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium flex items-center shadow-sm"
            >
              <FileCheck size={16} className="mr-2" />
              Crear Contrato
            </button>
          </div>
          {contractsLoading ? (
            <div className="px-6 py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-600">Cargando contratos...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-gray-500">No hay contratos registrados para este cliente.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Renta de Servicios</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Renta Mensual</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CXC Renta</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CXC Servicios</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Terminación</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contracts.map((contract) => {
                    const isSelected = selectedContractId === contract.id;
                    const startDateRaw = contract.start_date
                    const endDateRaw = contract.end_date
                    const terminationDateRaw = contract.termination_date

                    const contractStatus = contract.status || 'Active'
                    const isActive = contractStatus === 'Active' || contractStatus === 'activo' || contractStatus === 'Activo'
                    const isTerminated = contractStatus === 'Terminado' || contractStatus === 'terminado' || contractStatus === 'Terminated'

                    let startDateFormatted = '-'
                    if (startDateRaw) {
                      try {
                        const [year, month, day] = startDateRaw.split('T')[0].split('-')
                        const date = new Date(year, month - 1, day)
                        if (!isNaN(date.getTime())) {
                          startDateFormatted = date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')
                        }
                      } catch (_) {
                        // Ignorar errores de parsing
                      }
                    }

                    let endDateFormatted = 'Activo'
                    if (endDateRaw) {
                      try {
                        const [year, month, day] = endDateRaw.split('T')[0].split('-')
                        const date = new Date(year, month - 1, day)
                        if (!isNaN(date.getTime())) {
                          endDateFormatted = date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')
                        }
                      } catch (_) {
                        // Ignorar errores de parsing
                      }
                    }

                    const monthlyRentRaw = contract.monthly_rent_amount
                    let monthlyRentFormatted = '$0.00'
                    if (monthlyRentRaw) {
                      const amount = typeof monthlyRentRaw === 'string' ? parseFloat(monthlyRentRaw.replace(/[^0-9.-]+/g, '')) : parseFloat(monthlyRentRaw)
                      if (!isNaN(amount)) monthlyRentFormatted = `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    }

                    const serviceRentRaw = contract.monthly_services_amount
                    let serviceRentFormatted = '$0.00'
                    if (serviceRentRaw) {
                      const amount = typeof serviceRentRaw === 'string' ? parseFloat(serviceRentRaw.replace(/[^0-9.-]+/g, '')) : parseFloat(serviceRentRaw)
                      if (!isNaN(amount)) serviceRentFormatted = `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    }

                    const rentCount = (receivables || []).filter(r => r.contractId === contract.id && (r.type === 'Rent' || r.type === 'Renta')).length;
                    const serviceCount = (receivables || []).filter(r => r.contractId === contract.id && (r.type === 'Service' || r.type === 'Services' || r.type === 'Luz')).length;

                    return (
                      <tr
                        key={contract.id}
                        onClick={() => setSelectedContractId(contract.id)}
                        className={`transition-colors cursor-pointer border-l-4 ${isSelected ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50 border-transparent'}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {startDateFormatted} - {endDateFormatted}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center md:text-left font-bold text-blue-700">
                          {contract.num_months || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {serviceRentFormatted}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {monthlyRentFormatted}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rentCount > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                            {rentCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${serviceCount > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-500'}`}>
                            {serviceCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {(() => {
                              let terminationDateFormatted = '-'
                              if (terminationDateRaw) {
                                try {
                                  const [year, month, day] = terminationDateRaw.split('T')[0].split('-')
                                  const date = new Date(year, month - 1, day)
                                  if (!isNaN(date.getTime())) {
                                    terminationDateFormatted = date.toLocaleDateString('es-MX', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: '2-digit'
                                    }).replace('.', '')
                                  }
                                } catch (e) {
                                  console.warn('Error al formatear terminationDate:', e)
                                }
                              }
                              return terminationDateFormatted
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}>
                            {contractStatus === 'Active' || contractStatus === 'activo' || contractStatus === 'Activo'
                              ? 'Activo'
                              : isTerminated
                                ? 'Terminado'
                                : contractStatus || 'Activo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            {isActive && (
                              <div className="flex space-x-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setGenerationType('Rent');
                                    setContractToGenerate(contract);
                                    setGenerateModalOpen(true);
                                  }}
                                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                  title="Generar CXC de Rentas"
                                >
                                  <Zap size={18} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setGenerationType('Service');
                                    setContractToGenerate(contract);
                                    setGenerateModalOpen(true);
                                  }}
                                  className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                                  title="Generar CXC de Luz/Servicios"
                                >
                                  <Lightbulb size={18} />
                                </button>
                              </div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditContract && onEditContract(contract);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Editar contrato"
                            >
                              <Edit size={16} />
                            </button>
                            {isActive && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFinalizeClick(contract);
                                }}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                title="Finalizar contrato"
                              >
                                <Ban size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Transactions Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Estado de Cuenta</h3>
              <p className="text-xs text-blue-600 font-bold uppercase mt-0.5">
                {selectedContract ? (
                  (() => {
                    const formatDateShort = (dateStr) => {
                      if (!dateStr) return '';
                      try {
                        const [y, m, d] = dateStr.split('-');
                        const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                        const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                        return `${months[date.getMonth()]} ${y.substring(2)}`;
                      } catch (_) { return dateStr; }
                    };
                    return `${formatDateShort(selectedContract.start_date)} - ${formatDateShort(selectedContract.end_date)}`;
                  })()
                ) : 'Seleccione un contrato'}
              </p>
            </div>

            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              {['Todos', 'Vencido', 'Pendiente', 'Pagado'].map((f) => (
                <button
                  key={f}
                  onClick={() => setMovementStatusFilter(f)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${movementStatusFilter === f
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              onClick={() => setAddManualReceivableModalOpen(true)}
              className="ml-4 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium flex items-center shadow-sm transition-all active:scale-95"
            >
              <Plus size={16} className="mr-2" /> Agregar Registro
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white sticky top-0 shadow-sm z-10">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors w-20"
                    onClick={() => requestSort('type')}
                  >
                    <div className="flex items-center">Tipo {getSortIcon('type')}</div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => requestSort('period')}
                  >
                    <div className="flex items-center">Mes {getSortIcon('period')}</div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => requestSort('dueDate')}
                  >
                    <div className="flex items-center">Vencimiento {getSortIcon('dueDate')}</div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => requestSort('concept')}
                  >
                    <div className="flex items-center">Concepto {getSortIcon('concept')}</div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => requestSort('daysOverdue')}
                  >
                    <div className="flex items-center">Atraso {getSortIcon('daysOverdue')}</div>
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => requestSort('amount')}
                  >
                    <div className="flex items-center justify-end">Monto {getSortIcon('amount')}</div>
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => requestSort('paidAmount')}
                  >
                    <div className="flex items-center justify-end text-green-700">Pagado {getSortIcon('paidAmount')}</div>
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => requestSort('balanceDue')}
                  >
                    <div className="flex items-center justify-end text-blue-700">Saldo {getSortIcon('balanceDue')}</div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => requestSort('status')}
                  >
                    <div className="flex items-center">Estado {getSortIcon('status')}</div>
                  </th>
                  <th className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receivablesLoading ? (
                  <tr><td colSpan="10" className="px-6 py-8 text-center"><Loader size={24} className="animate-spin mx-auto text-blue-600" /></td></tr>
                ) : filteredReceivables.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.type === 'Rent' || item.type === 'Renta' ? (
                        <div className="flex items-center text-blue-600" title="Renta">
                          <Home size={18} />
                        </div>
                      ) : (
                        <div className="flex items-center text-yellow-600" title="Luz/Servicios">
                          <Lightbulb size={18} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(() => {
                        if (!item.periodMonth) return '-';
                        const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                        return `${months[item.periodMonth - 1]} ${String(item.periodYear).substring(2)}`;
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(() => {
                        if (!item.dueDate) return '-';
                        try {
                          const [y, m, d] = item.dueDate.split('-');
                          const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                          const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                          return `${d} ${months[date.getMonth()]} ${y.substring(2)}`;
                        } catch (_) { return item.dueDate; }
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 italic font-medium">
                      {item.concept || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.status === 'Overdue' && item.daysOverdue > 0 ? (
                        <span className="text-red-600 font-bold flex items-center">
                          <AlertTriangle size={14} className="mr-1" />
                          {item.daysOverdue} {item.daysOverdue === 1 ? 'día' : 'días'}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                      {item.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-right">
                      {`$${parseFloat(item.amount_paid || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-700 text-right">
                      {`$${(item.balanceDueRaw || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={item.status} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="hidden group-hover:flex justify-end space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          title="Registrar Pago"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReceivableToPay(item);
                            setRegisterPaymentModalOpen(true);
                          }}
                        >
                          <DollarSign size={16} />
                        </button>
                        <button
                          className="text-gray-400 hover:text-gray-600"
                          title="Editar Monto"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReceivableToEdit(item);
                            setEditReceivableModalOpen(true);
                          }}
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!receivablesLoading && sortedReceivables.length === 0 && (
                  <tr>
                    <td colSpan="10" className="px-6 py-20 text-center text-sm text-gray-500">
                      <FileText size={40} className="mx-auto text-gray-200 mb-3" />
                      No hay movimientos registrados para este contrato.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors"
            >
              <Download size={16} className="mr-2" /> Exportar Excel
            </button>
            <button className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors">
              <Mail size={16} className="mr-2" /> Enviar Estado de Cuenta por Correo
            </button>
          </div>
        </div>

        {/* Modal para editar movimiento */}
        <Modal
          isOpen={isEditReceivableModalOpen}
          onClose={() => setEditReceivableModalOpen(false)}
          title="Editar Movimiento"
        >
          <form onSubmit={async (e) => {
            e.preventDefault();
            setIsGenerating(true);
            try {
              const formData = new FormData(e.target);
              const updateData = {
                concept: formData.get('concept'),
                amount: parseFloat(formData.get('amount')),
                dueDate: formData.get('dueDate'),
                periodMonth: parseInt(formData.get('periodMonth')),
                periodYear: parseInt(formData.get('periodYear')),
              };
              const result = await onUpdateReceivable(receivableToEdit.id, updateData);
              if (result.success) {
                setEditReceivableModalOpen(false);
              } else {
                alert('Error al actualizar: ' + result.error?.message);
              }
            } catch (err) {
              alert('Error inesperado: ' + err.message);
            } finally {
              setIsGenerating(false);
            }
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
                <select
                  name="periodMonth"
                  defaultValue={receivableToEdit?.periodMonth || 1}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="1">Enero</option>
                  <option value="2">Febrero</option>
                  <option value="3">Marzo</option>
                  <option value="4">Abril</option>
                  <option value="5">Mayo</option>
                  <option value="6">Junio</option>
                  <option value="7">Julio</option>
                  <option value="8">Agosto</option>
                  <option value="9">Septiembre</option>
                  <option value="10">Octubre</option>
                  <option value="11">Noviembre</option>
                  <option value="12">Diciembre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                <input
                  type="number"
                  name="periodYear"
                  defaultValue={receivableToEdit?.periodYear || new Date().getFullYear()}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
              <input
                type="text"
                name="concept"
                defaultValue={receivableToEdit?.concept}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  defaultValue={receivableToEdit ? parseFloat(String(receivableToEdit.amount).replace(/[^0-9.-]+/g, "")) : 0}
                  required
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento</label>
              <input
                type="date"
                name="dueDate"
                defaultValue={receivableToEdit?.dueDate}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setEditReceivableModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isGenerating}
                className="px-4 py-2 bg-blue-700 text-white rounded-md text-sm font-medium hover:bg-blue-800 disabled:opacity-50"
              >
                {isGenerating ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal para registrar pago */}
        <Modal
          isOpen={isRegisterPaymentModalOpen}
          onClose={() => !isGenerating && setRegisterPaymentModalOpen(false)}
          title="Registrar Pago"
        >
          <form onSubmit={async (e) => {
            e.preventDefault();

            // 1. Prevenir doble envío si ya se está procesando
            if (isGenerating) return;

            // 2. Validar que el movimiento aún requiera pago
            if (receivableToPay && (receivableToPay.status === 'Paid' || receivableToPay.status === 'Pagado')) {
              alert('Este movimiento ya ha sido liquidado.');
              setRegisterPaymentModalOpen(false);
              return;
            }

            const formData = new FormData(e.target);
            const paymentAmount = parseFloat(formData.get('amount'));
            const currentBalance = parseFloat(String(receivableToPay.balanceDue || receivableToPay.balance_due || receivableToPay.amount || 0).replace(/[^0-9.-]+/g, ""));

            // 3. Validar límites de monto
            if (paymentAmount > (currentBalance + 0.01)) { // Pequeño margen por redondeo
              alert(`El monto del pago ($${paymentAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}) no puede ser mayor al saldo pendiente ($${currentBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}).`);
              return;
            }

            if (paymentAmount <= 0) {
              alert('El monto del pago debe ser mayor a cero.');
              return;
            }

            setIsGenerating(true);
            try {
              const paymentData = {
                receivableId: receivableToPay.id,
                amount: paymentAmount,
                paymentDate: formData.get('paymentDate'),
                clientId: client.id,
                unitId: client.unitId || client.unit_id
              };

              const result = await onAddPayment(paymentData);
              if (result.success) {
                setRegisterPaymentModalOpen(false);
              } else {
                alert('Error al registrar pago: ' + result.error?.message);
              }
            } catch (err) {
              console.error('Error registering payment:', err);
              alert('Error inesperado: ' + err.message);
            } finally {
              setIsGenerating(false);
            }
          }} className="space-y-4">
            {receivableToPay && (
              <div className="bg-blue-50 p-3 rounded-md mb-4 border border-blue-100">
                <p className="text-xs text-blue-700 uppercase font-bold mb-1">Movimiento Seleccionado</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-blue-900">{receivableToPay.concept}</span>
                  <div className="text-right">
                    <span className="block font-bold text-blue-900">
                      Saldo: ${parseFloat(String(receivableToPay.balanceDue || receivableToPay.balance_due || receivableToPay.amount).replace(/[^0-9.-]+/g, "")).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    {receivableToPay.amount_paid > 0 && (
                      <span className="text-[10px] text-blue-600 block">Pagado: ${parseFloat(receivableToPay.amount_paid).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto del Pago</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  key={receivableToPay?.id}
                  type="number"
                  name="amount"
                  step="0.01"
                  defaultValue={receivableToPay ? parseFloat(String(receivableToPay.balanceDue || receivableToPay.balance_due || receivableToPay.amount).replace(/[^0-9.-]+/g, "")) : 0}
                  required
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Pago</label>
              <input
                type="date"
                name="paymentDate"
                defaultValue={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRegisterPaymentModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isGenerating}
                className="px-4 py-2 bg-green-700 text-white rounded-md text-sm font-bold hover:bg-green-800 disabled:opacity-50 shadow-sm flex items-center"
              >
                {isGenerating ? (
                  <>
                    <Loader size={16} className="animate-spin mr-2" />
                    Registrando...
                  </>
                ) : 'Registrar Pago'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal para agregar registro manual a la CXC */}
        <Modal
          isOpen={isAddManualReceivableModalOpen}
          onClose={() => !isGenerating && setAddManualReceivableModalOpen(false)}
          title="Agregar Registro Manual (Estado de Cuenta)"
        >
          <form onSubmit={handleAddManualReceivable} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cargo</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={manualReceivableForm.type}
                  onChange={(e) => setManualReceivableForm({ ...manualReceivableForm, type: e.target.value })}
                  required
                >
                  <option value="Rent">Renta</option>
                  <option value="Service">Servicio / Luz</option>
                  <option value="Other">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm font-bold"
                  placeholder="0.00"
                  value={manualReceivableForm.amount}
                  onChange={(e) => setManualReceivableForm({ ...manualReceivableForm, amount: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={manualReceivableForm.dueDate}
                onChange={(e) => setManualReceivableForm({ ...manualReceivableForm, dueDate: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mes del Periodo</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={manualReceivableForm.periodMonth}
                  onChange={(e) => setManualReceivableForm({ ...manualReceivableForm, periodMonth: parseInt(e.target.value) })}
                  required
                >
                  {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año del Periodo</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={manualReceivableForm.periodYear}
                  onChange={(e) => setManualReceivableForm({ ...manualReceivableForm, periodYear: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Concepto (Opcional)</label>
              <input
                type="text"
                placeholder="Ej: Renta Enero 2025, Cargo Extra, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={manualReceivableForm.concept}
                onChange={(e) => setManualReceivableForm({ ...manualReceivableForm, concept: e.target.value })}
              />
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setAddManualReceivableModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isGenerating}
                className="px-4 py-2 bg-blue-700 text-white rounded-md text-sm font-bold hover:bg-blue-800 disabled:opacity-50 shadow-sm flex items-center"
              >
                {isGenerating ? (
                  <>
                    <Loader size={16} className="animate-spin mr-2" />
                    Guardando...
                  </>
                ) : 'Crear Registro'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal para confirmar finalización de contrato con listado de CXC */}
        <Modal
          isOpen={isFinalizeConfirmationModalOpen}
          onClose={() => !isGenerating && setFinalizeConfirmationModalOpen(false)}
          title="Confirmar Finalización de Contrato"
        >
          <div className="space-y-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 font-medium">
                    ¿Estás seguro de que deseas finalizar este contrato?
                  </p>
                </div>
              </div>
            </div>

            {receivablesToCancel.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  Los siguientes movimientos (CXC) aún no han sido liquidados y serán marcados como <span className="font-bold text-red-600">Cancelados</span>:
                </p>
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md bg-white">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Período</th>
                        <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Concepto</th>
                        <th className="px-4 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {receivablesToCancel.map((r) => (
                        <tr key={r.id}>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            {(() => {
                              const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                              return `${months[r.periodMonth - 1]} ${r.periodYear}`;
                            })()}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-900 font-medium">{r.concept}</td>
                          <td className="px-4 py-2 text-xs text-right text-red-600 font-bold">
                            ${parseFloat(String(r.balance_due || r.amount).replace(/[^0-9.-]+/g, "")).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setFinalizeConfirmationModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isGenerating}
                onClick={async () => {
                  setIsGenerating(true);
                  try {
                    const receivableIds = receivablesToCancel.map(r => r.id);
                    const result = await onFinalizeContract(contractToTerminate.id, receivableIds);
                    if (result.success) {
                      setFinalizeConfirmationModalOpen(false);
                      setContractToTerminate(null);
                      setReceivablesToCancel([]);
                    } else {
                      alert('Error al finalizar contrato: ' + (result.error?.message || 'Error desconocido'));
                    }
                  } catch (err) {
                    console.error('Error finalizing contract:', err);
                    alert('Error inesperado: ' + err.message);
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-bold hover:bg-red-700 disabled:opacity-50 shadow-sm flex items-center"
              >
                {isGenerating ? (
                  <>
                    <Loader size={16} className="animate-spin mr-2" />
                    Procesando...
                  </>
                ) : 'Confirmar Finalización'}
              </button>
            </div>
          </div>
        </Modal>


        {/* Modal de Confirmación para Generar CXC Rentas */}
        <Modal
          isOpen={isGenerateModalOpen}
          onClose={() => !isGenerating && setGenerateModalOpen(false)}
          title={generationType === 'Rent' ? "Generar CXC de Rentas" : "Generar CXC de Luz/Servicios"}
        >
          <div className="p-2">
            {contractToGenerate && (
              <div className="space-y-4">
                <div className={generationType === 'Rent' ? "bg-blue-50 border-l-4 border-blue-500 p-4 rounded" : "bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded"}>
                  <p className={generationType === 'Rent' ? "text-sm text-blue-800" : "text-sm text-yellow-800"}>
                    Se generarán <strong>{contractToGenerate.num_months || '0'}</strong> registros de cobro correspondientes a la <strong>{generationType === 'Rent' ? 'Renta Mensual' : 'Luz/Servicios'}</strong> de este contrato.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div>
                    <span className="block text-xs text-gray-500 uppercase font-bold tracking-wider">Monto Mensual</span>
                    <span className="text-lg font-bold text-gray-900">
                      ${(generationType === 'Rent' ? (contractToGenerate.monthly_rent_amount || 0) : (contractToGenerate.monthly_services_amount || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 uppercase font-bold tracking-wider">Total a Generar</span>
                    <span className={generationType === 'Rent' ? "text-lg font-bold text-blue-700" : "text-lg font-bold text-yellow-700"}>
                      ${((generationType === 'Rent' ? (contractToGenerate.monthly_rent_amount || 0) : (contractToGenerate.monthly_services_amount || 0)) * (contractToGenerate.num_months || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-xs text-gray-500 uppercase font-bold tracking-wider">Concepto Sugerido</span>
                    <span className="text-sm text-gray-700 italic">"{generationType === 'Rent' ? 'Renta' : 'Luz'} [Mes] [Año]"</span>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-gray-500 text-center italic">
                    Esta acción creará los registros en el Estado de Cuenta de forma automática.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setGenerateModalOpen(false)}
                    disabled={isGenerating}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      setIsGenerating(true);
                      try {
                        // Preparar los datos
                        const invoices = [];
                        const startDateStr = contractToGenerate.start_date;
                        // Parsear como fecha local YYYY-MM-DD
                        const [yearStr, monthStr, dayStr] = startDateStr.split('-');
                        const startDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));

                        const monthsCount = parseInt(contractToGenerate.num_months) || 0;

                        const monthNames = [
                          "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                        ];

                        for (let i = 0; i < monthsCount; i++) {
                          const currentMonthDate = new Date(startDate);
                          currentMonthDate.setMonth(startDate.getMonth() + i);

                          const mIndex = currentMonthDate.getMonth();
                          const year = currentMonthDate.getFullYear();

                          const y = currentMonthDate.getFullYear();
                          const m = currentMonthDate.getMonth();

                          // Usar cutoff_day si existe, sino usar el día de la fecha de inicio
                          const cutoffDay = contractToGenerate.cutoff_day || startDate.getDate();

                          // Asegurar que el día sea válido para el mes actual (ej: Feb 30 -> Feb 28/29)
                          const lastDayOfMonth = new Date(y, m + 1, 0).getDate();
                          const finalDay = Math.min(cutoffDay, lastDayOfMonth);

                          const mStr = String(m + 1).padStart(2, '0');
                          const dStr = String(finalDay).padStart(2, '0');
                          const dueDateStr = `${y}-${mStr}-${dStr}`;

                          const amount = generationType === 'Rent' ? contractToGenerate.monthly_rent_amount : contractToGenerate.monthly_services_amount;
                          const conceptPrefix = generationType === 'Rent' ? 'Renta' : 'Luz';
                          const typeVal = generationType === 'Rent' ? 'Rent' : 'Service';

                          invoices.push({
                            unitId: contractToGenerate.unit_id,
                            clientId: contractToGenerate.client_id,
                            contractId: contractToGenerate.id,
                            amount: amount,
                            concept: `${conceptPrefix} ${monthNames[mIndex]} ${year}`,
                            dueDate: dueDateStr,
                            status: 'Pending',
                            type: typeVal,
                            periodMonth: mIndex + 1,
                            periodYear: year,
                          });
                        }

                        if (onGenerateCXC) {
                          const result = await onGenerateCXC(invoices);
                          if (result.success) {
                            setGenerateModalOpen(false);
                          } else {
                            alert('Error al generar CXC: ' + (result.error?.message || 'Error desconocido'));
                          }
                        }
                      } catch (err) {
                        console.error('Error in generation loop:', err);
                        alert('Ocurrió un error inesperado al generar los cobros.');
                      } finally {
                        setIsGenerating(false);
                      }
                    }}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-md shadow-sm transition-all flex items-center"
                  >
                    {isGenerating ? (
                      <>
                        <Loader size={16} className="animate-spin mr-2" />
                        Generando...
                      </>
                    ) : 'Confirmar y Guardar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export const MarketTecView = ({ user, unitName }) => {
  const [fileStatus, setFileStatus] = useState('idle'); // idle, uploading, uploaded, validating, validated, applying, applied
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = () => {
    setFileStatus('uploading');
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setFileStatus('uploaded');
        setUploadProgress(0);
      }
    }, 300);
  };

  const handleValidate = () => {
    setFileStatus('validating');
    setTimeout(() => {
      setFileStatus('validated');
    }, 2000);
  };

  const handleApply = () => {
    setFileStatus('applying');
    setTimeout(() => {
      setFileStatus('applied');
    }, 2000);
  };

  const resetProcess = () => {
    setFileStatus('idle');
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Recepción de Cobros - Market Tec</h2>
        <p className="text-sm text-gray-500">Unidad: {unitName || `Unidad ${user.unitId} ` || 'Sin unidad'}</p>
      </div>

      <div className="bg-gray-100 p-2 rounded text-xs text-gray-500 font-mono mb-4 border border-gray-200">
        ENDPOINT: https://n8n.tu-dominio.com/webhook/market-tec-process
      </div>

      {(fileStatus === 'idle' || fileStatus === 'uploading') && (
        <div
          onClick={fileStatus === 'idle' ? handleFileUpload : undefined}
          className={`bg-white shadow rounded-lg p-8 text-center border-2 border-dashed transition-colors group relative
                  ${fileStatus === 'idle' ? 'border-gray-300 hover:border-blue-500 cursor-pointer' : 'border-blue-300 cursor-wait'}`}
        >
          {fileStatus === 'idle' ? (
            <>
              <UploadCloud className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Sube tu archivo de Market Tec</h3>
              <p className="mt-1 text-sm text-gray-500">Arrastra y suelta el archivo Excel aquí, o haz clic para seleccionar.</p>
              <p className="mt-4 text-xs text-gray-400 bg-gray-50 inline-block px-2 py-1 rounded">Formatos soportados: .xlsx, .csv</p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <Loader className="h-10 w-10 text-blue-500 animate-spin mb-3" />
              <p className="text-sm font-medium text-gray-600">Subiendo archivo...</p>
              <div className="w-64 bg-gray-200 rounded-full h-2.5 mt-4">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          )}
        </div>
      )}

      {fileStatus !== 'idle' && fileStatus !== 'uploading' && (
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FileSpreadsheet className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">reporte_cobros_noviembre.xlsx</h3>
                <p className="text-xs text-gray-500">1.2 MB • Cargado correctamente</p>
              </div>
            </div>
            {fileStatus === 'applied' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle size={14} className="mr-1" /> Procesado
              </span>
            ) : (
              <button onClick={resetProcess} className="text-gray-400 hover:text-red-500" title="Cancelar operación">
                <Trash2 size={18} />
              </button>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4">
            {fileStatus === 'uploaded' && (
              <div className="flex flex-col items-center justify-center py-4">
                <p className="text-sm text-gray-600 mb-4">El archivo está listo. El siguiente paso enviará los datos a n8n para verificar RFCs y montos.</p>
                <button
                  onClick={handleValidate}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center shadow-sm"
                >
                  <Play size={18} className="mr-2" />
                  Validar Datos (n8n)
                </button>
              </div>
            )}

            {fileStatus === 'validating' && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader className="h-8 w-8 text-indigo-500 animate-spin mb-3" />
                <p className="text-sm text-gray-600">Procesando estructura en n8n...</p>
              </div>
            )}

            {fileStatus === 'validated' && (
              <div className="flex flex-col items-center justify-center py-4 animate-fade-in">
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-md mb-4 flex items-center text-sm w-full border border-green-100">
                  <CheckCircle size={18} className="mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Validación exitosa</p>
                    <p className="text-xs mt-1">Se encontraron <strong>15 registros</strong> válidos. Total a aplicar: <strong>$154,200.00</strong></p>
                  </div>
                </div>
                <button
                  onClick={handleApply}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium flex items-center shadow-sm"
                >
                  <DollarSign size={18} className="mr-2" />
                  Aplicar Cobros
                </button>
              </div>
            )}

            {fileStatus === 'applying' && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader className="h-8 w-8 text-green-600 animate-spin mb-3" />
                <p className="text-sm text-gray-600">Actualizando saldos en base de datos...</p>
              </div>
            )}

            {fileStatus === 'applied' && (
              <div className="text-center py-4 animate-fade-in">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-800">¡Cobros Aplicados Correctamente!</h4>
                <p className="text-sm text-gray-500 mt-1">Se han actualizado los saldos de los clientes en el sistema.</p>
                <button onClick={resetProcess} className="mt-6 text-blue-600 hover:text-blue-800 text-sm font-medium">Subir otro archivo</button>
              </div>
            )}
          </div>
        </div>
      )}

      {fileStatus === 'idle' && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-blue-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Recuerda: El sistema validará automáticamente que el campo <span className="font-bold">"Market Tec Receiver"</span> coincida con nuestros registros antes de procesar los cobros.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const OverdueView = ({ filteredCXC, selectedOverdue, toggleOverdueSelection, user, unitName }) => {
  const overdueItems = filteredCXC.filter(i => i.status === 'Overdue');
  const totalOverdue = overdueItems.reduce((acc, curr) => acc + (curr.balanceDueRaw || 0), 0);
  const uniqueClientsCount = new Set(overdueItems.map(i => i.clientId)).size;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            Cuentas Vencidas
            <span className="ml-3 px-2.5 py-0.5 bg-gray-100 text-gray-600 text-sm font-semibold rounded-full border border-gray-200">
              {overdueItems.length}
            </span>
          </h2>
          <p className="text-sm text-gray-500">Unidad: {unitName || `Unidad ${user.unitId} ` || 'Sin unidad'}</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center shadow-sm text-sm font-medium">
            <Download size={16} className="mr-2" />
            Descargar Excel
          </button>
          <button
            className={`px-4 py-2 rounded-lg flex items-center shadow-sm text-sm font-medium transition-colors ${selectedOverdue.length > 0 ? 'bg-blue-700 hover:bg-blue-800 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            disabled={selectedOverdue.length === 0}
          >
            <Send size={16} className="mr-2" />
            Enviar {selectedOverdue.length} Recordatorios
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <div className="p-3 bg-red-100 rounded-full text-red-600 mr-4">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-red-600 font-medium">Total Vencido</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">${totalOverdue.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600 mr-4">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Clientes con Adeudos</p>
            <p className="text-2xl font-bold text-gray-800">{uniqueClientsCount}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="p-3 bg-gray-100 rounded-full text-gray-600 mr-4">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Plantilla de Correo</p>
            <p className="text-sm font-semibold text-blue-600">Ver / Editar Plantilla</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-500">Filtrar por:</span>
            <select className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 p-1">
              <option>Todos los vencimientos</option>
              <option>+30 días</option>
              <option>+60 días</option>
            </select>
          </div>
          <span className="text-xs text-gray-400">Mostrando {overdueItems.length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onChange={(e) => {
                      if (e.target.checked) {
                        toggleOverdueSelection(overdueItems.map(i => i.id).filter(id => !selectedOverdue.includes(id))); // Select all not selected
                        // Simplified: usually select all logic
                      } else {
                        // deselect logic
                      }
                    }}
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concepto</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Límite</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días Retraso</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {overdueItems.length > 0 ? (
                overdueItems.map((item) => (
                  <tr key={item.id} className={`hover:bg-red-50 transition-colors ${selectedOverdue.includes(item.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedOverdue.includes(item.id)}
                        onChange={() => toggleOverdueSelection(item.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.client}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{item.concept}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Calendar size={14} className="mr-1 text-gray-400" />
                        {item.dueDate}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <OverdueBadge days={item.daysOverdue} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{item.balanceDue}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 text-xs font-semibold">Enviar Email</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                    <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                    No hay cuentas vencidas en esta unidad.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const RemindersView = ({ filteredUpcoming, selectedReminders, toggleReminderSelection, setSelectedReminders, user, unitName }) => {
  const pendingReminders = filteredUpcoming.filter(i => !i.sent);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            Recordatorios de Pago
            <span className="ml-3 px-2.5 py-0.5 bg-gray-100 text-gray-600 text-sm font-semibold rounded-full border border-gray-200">
              {filteredUpcoming.length}
            </span>
          </h2>
          <p className="text-sm text-gray-500">Unidad: {unitName || `Unidad ${user.unitId} ` || 'Sin unidad'}</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg flex items-center shadow-sm text-sm font-medium">
            <Settings size={16} className="mr-2" />
            Configurar Anticipación
          </button>
          <button
            className={`px-4 py-2 rounded-lg flex items-center shadow-sm text-sm font-medium transition-colors ${selectedReminders.length > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            disabled={selectedReminders.length === 0}
          >
            <Send size={16} className="mr-2" />
            Enviar {selectedReminders.length} Avisos
          </button>
        </div>
      </div>

      {/* Dashboard Cards for Reminders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600 mr-3">
            <Calendar size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase">Próximos 15 días</div>
            <div className="text-lg font-bold text-gray-800">{filteredUpcoming.length} Pagos</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center">
          <div className="bg-yellow-100 p-3 rounded-full text-yellow-600 mr-3">
            <Mail size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase">Pendientes de Envío</div>
            <div className="text-lg font-bold text-gray-800">{pendingReminders.length}</div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Pagos Programados</h3>
          <div className="flex space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Próximos 15 días
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedReminders(pendingReminders.map(i => i.id));
                      } else {
                        setSelectedReminders([]);
                      }
                    }}
                    checked={selectedReminders.length === pendingReminders.length && pendingReminders.length > 0}
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conceptos a Cobrar</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vence en</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ver</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUpcoming.length > 0 ? (
                filteredUpcoming.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${selectedReminders.includes(item.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {!item.sent && (
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedReminders.includes(item.id)}
                          onChange={() => toggleReminderSelection(item.id)}
                        />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{item.client}</div>
                      <div className="text-xs text-gray-500">Fecha límite: {item.dueDate}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(item.concepts || [item.concept]).map((c, idx) => (
                          <span key={idx} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.includes('Luz') ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                            {c.includes('Luz') && <Zap size={10} className="mr-1 fill-current" />}
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{item.amount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${item.daysUntil <= 5 ? 'text-orange-600' : 'text-green-600'}`}>
                        {item.daysUntil} días
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.sent ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Enviado
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-gray-400 hover:text-blue-600" title="Ver Previsualización">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                    <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                    No hay recordatorios pendientes en esta unidad.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Componente de formulario para crear contrato
export const ContractForm = ({ client, user, onClose, onSuccess, onAddContract, onUpdateContract, onRefreshContracts, contractToEdit }) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    monthlyRentAmount: '',
    monthlyServicesAmount: '',
    cutoffDay: '10',
    numMonths: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (contractToEdit) {
      setFormData({
        startDate: contractToEdit.start_date ? contractToEdit.start_date.split('T')[0] : '',
        endDate: contractToEdit.end_date ? contractToEdit.end_date.split('T')[0] : '',
        monthlyRentAmount: contractToEdit.monthly_rent_amount ? String(contractToEdit.monthly_rent_amount) : '',
        monthlyServicesAmount: (contractToEdit.monthly_services_amount || contractToEdit.monthly_services_account) ? String(contractToEdit.monthly_services_amount || contractToEdit.monthly_services_account) : '',
        cutoffDay: contractToEdit.cutoff_day ? String(contractToEdit.cutoff_day) : '',
        numMonths: contractToEdit.num_months ? String(contractToEdit.num_months) : '',
      });
    }
  }, [contractToEdit]);

  // Calcular numMonths automáticamente cuando cambian las fechas
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const d1 = new Date(formData.startDate + 'T00:00:00');
      const d2 = new Date(formData.endDate + 'T00:00:00');

      if (d2 >= d1) {
        const months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()) + 1;
        if (String(months) !== formData.numMonths) {
          setFormData(prev => ({ ...prev, numMonths: String(months) }));
        }
      } else if (formData.numMonths !== '') {
        setFormData(prev => ({ ...prev, numMonths: '' }));
      }
    }
  }, [formData.startDate, formData.endDate, formData.numMonths]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validar campos requeridos
      if (!formData.startDate || !formData.endDate) {
        throw new Error('Las fechas de inicio y fin son requeridas');
      }

      if (!formData.monthlyRentAmount && !formData.monthlyServicesAmount) {
        throw new Error('Debe especificar al menos el monto de renta o el monto de servicios');
      }

      // Validar que la fecha de fin sea posterior a la de inicio
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      // Preparar datos para el servicio
      const contractData = {
        clientId: client.id,
        unitId: user.unitId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        monthlyRentAmount: formData.monthlyRentAmount ? parseFloat(formData.monthlyRentAmount) : null,
        monthlyServicesAmount: formData.monthlyServicesAmount ? parseFloat(formData.monthlyServicesAmount) : null,
        cutoffDay: formData.cutoffDay ? parseInt(formData.cutoffDay) : null,
        numMonths: formData.numMonths ? parseInt(formData.numMonths) : null,
        status: contractToEdit ? contractToEdit.status : 'Activo',
      };

      let result;
      if (contractToEdit) {
        if (!onUpdateContract) throw new Error('Función onUpdateContract no proporcionada');
        result = await onUpdateContract(contractToEdit.id, contractData);
      } else {
        if (!onAddContract) throw new Error('Función onAddContract no proporcionada');
        result = await onAddContract(contractData);
      }

      if (result.success) {
        if (onRefreshContracts) {
          await onRefreshContracts();
        }
        onSuccess();
      } else {
        throw new Error(result.error?.message || 'Error al guardar el contrato');
      }
    } catch (err) {
      console.error('Error al guardar contrato:', err);
      setError(err.message || 'Error al guardar el contrato');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const isEditMode = !!contractToEdit;

  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {isEditMode ? 'Editar Contrato' : 'Crear Nuevo Contrato'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Fecha de Inicio */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Inicio <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Fecha de Fin */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Fin <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            required
            min={formData.startDate || undefined}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Duración (meses) - CALCULADO */}
        <div>
          <label htmlFor="numMonths" className="block text-sm font-medium text-gray-700 mb-1">
            Duración del Contrato (meses)
          </label>
          <input
            type="number"
            id="numMonths"
            name="numMonths"
            value={formData.numMonths}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 font-bold text-blue-700 focus:outline-none"
            placeholder="Calculado automáticamente..."
          />
          <p className="mt-1 text-xs text-gray-500">Se calcula basado en la fecha de inicio y fin.</p>
        </div>

        {/* Monto Renta Mensual */}
        <div>
          <label htmlFor="monthlyRentAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Monto Renta Mensual
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              id="monthlyRentAmount"
              name="monthlyRentAmount"
              value={formData.monthlyRentAmount}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Monto Servicios Mensual */}
        <div>
          <label htmlFor="monthlyServicesAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Monto Servicios Mensual
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              id="monthlyServicesAmount"
              name="monthlyServicesAmount"
              value={formData.monthlyServicesAmount}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Día de vencimiento */}
        <div>
          <label htmlFor="cutoffDay" className="block text-sm font-medium text-gray-700 mb-1">
            Día de vencimiento
          </label>
          <input
            type="number"
            id="cutoffDay"
            name="cutoffDay"
            value={formData.cutoffDay}
            onChange={handleChange}
            min="1"
            max="31"
            placeholder="Ej: 15"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">Día del mes limite para pago</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : (isEditMode ? 'Actualizar Contrato' : 'Crear Contrato')}
          </button>
        </div>
      </form>
    </div>
  );
};

export const SettingsView = ({ setAddUserModalOpen }) => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Configuración & Equipo</h2>
        <p className="text-sm text-gray-500">Gestión de usuarios y permisos del sistema.</p>
      </div>
      <button
        onClick={() => setAddUserModalOpen(true)}
        className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center shadow-sm"
      >
        <UserPlus size={18} className="mr-2" />
        Nuevo Usuario
      </button>
    </div>

    <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Usuarios del Sistema (Staff)</h3>
        <div className="flex space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {mockStaff.length} Usuarios Activos
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidad Asignada</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockStaff.map((staff) => (
              <tr key={staff.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs mr-3">
                      {staff.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                      <div className="text-xs text-gray-500">{staff.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Shield size={14} className="mr-1 text-blue-500" />
                    {staff.role}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {staff.unitId ? (staff.unitName || `Unidad ${staff.unitId} `) : <span className="text-gray-400 italic">Acceso Global</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${staff.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {staff.status === 'Active' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-4">Editar</button>
                  <button className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);


