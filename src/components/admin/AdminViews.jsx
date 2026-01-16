import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';
import ClientForm from './ClientForm';
export { ClientForm };
import {
  Users, CreditCard, AlertTriangle, Mail, Menu, Home,
  FileSpreadsheet, Settings, LogOut, CheckCircle, UserPlus,
  Building, DollarSign, FileText, Calendar, Download, School,
  Plus, Send, ChevronRight, FileCheck, Ban, Edit, Zap, Trash2,
  Key, UploadCloud, Loader, Play, Filter, Shield, Eye, User, Phone, Lightbulb,
  ChevronUp, ChevronDown, Upload, AlertCircle, X, Loader2, Bot, ArrowRight,
  LayoutGrid, List, RefreshCw, ChevronLeft, Edit2, Save, UserCheck, UserX, RotateCcw, MessageCircle
} from 'lucide-react';
import { useSystemUsers } from '../../hooks/useSystemUsers';
import { StatusBadge, OverdueBadge, KPICard, RevenueChart, Modal } from '../ui/Shared';
import { UNITS, mockStaff } from '../../data/constants';
import * as invoiceService from '../../services/invoiceService';
import { marketTecService } from '../../services/marketTecService';
import { getTemplates } from '../../services/templateService';
import { downloadEstadoCuentaPDF } from '../../services/pdfService';

export const DashboardView = ({ adminStats, user, unitName, setActiveTab, onClientClick }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Extraer años disponibles de los datos mensuales
  const availableYears = React.useMemo(() => {
    const years = new Set();
    // Always add default years context (Current + Next)
    years.add(currentYear);
    years.add(currentYear + 1);

    (adminStats.monthlyStats || []).forEach(stat => {
      if (stat.year) years.add(stat.year);
    });

    return Array.from(years).sort((a, b) => b - a); // Orden descendente
  }, [adminStats.monthlyStats, currentYear]);

  // Filtrar datos por año seleccionado
  const filteredMonthlyStats = React.useMemo(() => {
    const stats = adminStats.monthlyStats || [];
    // Si los datos tienen propiedad year, filtrar
    const filtered = stats.filter(s => !s.year || s.year === selectedYear);
    return filtered.length > 0 ? filtered : stats;
  }, [adminStats.monthlyStats, selectedYear]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800">Panel General - {unitName || (user?.unitId ? `Unidad ${user.unitId}` : 'Sin unidad')}</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Clientes" value={adminStats.totalClients} icon={Users} color="#003DA5" subtext="En esta unidad" />
        <KPICard title="Por Cobrar" value={`$${adminStats.totalCXC.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} `} icon={CreditCard} color="#F59E0B" onClick={() => setActiveTab('pendingReceivables')} />
        <KPICard
          title="Monto Vencido"
          value={`$${(adminStats.overdueAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} `}
          icon={AlertTriangle}
          color="#EF4444"

          onClick={() => setActiveTab('collection')}
        />
        <KPICard
          title="Por Cobrar siguiente mes"
          value={`$${(adminStats.nextMonthIncome || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} `}
          icon={Calendar}
          color="#10B981"
          onClick={() => setActiveTab('nextMonthReceivables')}
        />
      </div>

      {/* Revenue Chart */}
      <div className="overflow-x-auto">
        <RevenueChart
          data={filteredMonthlyStats}
          year={selectedYear}
          availableYears={availableYears}
          onYearChange={setSelectedYear}
          onClientClick={onClientClick}
        />
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
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Total Rentas</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Total Servicios</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className={`text-sm font-bold ${client.totalRentCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                        {client.totalRentCount || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className={`text-sm font-bold ${client.totalServiceCount > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {client.totalServiceCount || 0}
                      </div>
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

export const ClientDetailView = ({ client, setActiveTab, onBackToClients, setContractModalOpen, portalUsers = [], portalUsersLoading = false, contracts = [], contractsLoading = false, onFinalizeContract, onEditContract, onEditClient, onGenerateCXC, onUpdateReceivable, onDeleteReceivable, onAddPayment, onAddManualReceivable, onRevertPayment, onReactivateContract, receivables = [], receivablesLoading = false, unitName }) => {
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
  const [isDeleteReceivableModalOpen, setDeleteReceivableModalOpen] = useState(false);
  const [receivableToDelete, setReceivableToDelete] = useState(null);
  const [movementStatusFilter, setMovementStatusFilter] = useState('Todos');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('Todos');
  const [isFinalizeConfirmationModalOpen, setFinalizeConfirmationModalOpen] = useState(false);
  const [isAddManualReceivableModalOpen, setAddManualReceivableModalOpen] = useState(false);
  const [contractToTerminate, setContractToTerminate] = useState(null);
  const [receivablesToCancel, setReceivablesToCancel] = useState([]);
  const [isRevertPaymentModalOpen, setRevertPaymentModalOpen] = useState(false);
  const [receivableToRevert, setReceivableToRevert] = useState(null);
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

      // Filter by Status
      let matchesStatus = true;
      if (movementStatusFilter === 'Vencido') matchesStatus = item.status === 'Overdue';
      else if (movementStatusFilter === 'Pendiente') matchesStatus = item.status.toLowerCase() === 'pending' || item.status.toLowerCase() === 'pendiente';
      else if (movementStatusFilter === 'Pagado') matchesStatus = item.status.toLowerCase() === 'paid' || item.status.toLowerCase() === 'pagado';

      if (!matchesStatus) return false;

      // Filter by Service Type
      if (serviceTypeFilter === 'Todos') return true;
      if (serviceTypeFilter === 'Rent') return item.type === 'Rent' || item.type === 'Renta';
      if (serviceTypeFilter === 'Service') {
        // Cualquier tipo que NO sea Rent/Renta se considera Service
        return item.type !== 'Rent' && item.type !== 'Renta';
      }

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
        'Vencimiento': item.dueDate || '-',
        'Concepto': item.concept || '-',
        'Ref Market Tec': item.paymentReferences || '-',
        'Fecha Pago': item.paymentDates || '-',
        'ID Carga': item.marketTecUploadIds || '-',
        'Monto': parseFloat(String(item.amount || 0).replace(/[^0-9.-]+/g, "")),
        'Pagado': parseFloat(String(item.amount_paid || 0).replace(/[^0-9.-]+/g, "")),
        'Saldo': item.balanceDueRaw || 0,
        'Estado': (() => {
          const status = (item.status || '').toLowerCase();
          if (status === 'pending') return 'Pendiente';
          if (status === 'paid') return 'Pagado';
          if (status === 'overdue') return 'Vencido';
          if (status === 'partial') return 'Parcial';
          if (status === 'cancelled') return 'Cancelado';
          return item.status;
        })()
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

  const contractTotal = filteredReceivables
    .filter(curr => !['cancelled', 'cancelado'].includes((curr.status || '').toLowerCase()))
    .reduce((acc, curr) => {
      return acc + (curr.amountRaw || 0);
    }, 0);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
        <button onClick={onBackToClients || (() => setActiveTab('clients'))} className="hover:text-blue-600 hover:underline">Clientes</button>
        <ChevronRight size={16} />
        <span className="font-semibold text-gray-800">{client.name}</span>
      </div>

      {/* Top Profile Card */}
      <div className="bg-white shadow rounded-lg overflow-hidden flex flex-col md:flex-row">
        {/* Left Side: Client Info */}
        <div className="p-4 flex-1 flex flex-col md:flex-row justify-between items-start md:items-center border-b md:border-b-0 md:border-r border-gray-100">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg mr-4">
              {client.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">{client.name}</h2>
                <StatusBadge status={client.status} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 mt-2">
                <span className="flex items-center" title="Correo de contacto">
                  <Mail size={12} className="mr-1 text-blue-600" /> {client.email}
                </span>
                <span className="flex items-center" title="Contacto principal">
                  <User size={12} className="mr-1 text-blue-600" /> {client.contact}
                </span>
                <span className="flex items-center" title="Teléfono">
                  <Phone size={12} className="mr-1 text-blue-600" /> {client.contactPhone || client.contact_phone || '-'}
                </span>
                <span className="flex items-center" title="Usuario Market Tec">
                  <Users size={12} className="mr-1 text-blue-600" /> {client.user_market_tec || client.User_market_tec || '-'}
                </span>
                <span className="flex items-center">
                  <FileText size={12} className="mr-1 text-gray-400" /> <span className="text-gray-400">ID: {client.id}</span>
                </span>
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
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded-lg shadow border-l-4 border-gray-400 transition-all hover:shadow-md">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total del contrato</div>
            <div className="text-xl font-bold text-gray-900 mt-1">${contractTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow border-l-4 border-green-500 transition-all hover:shadow-md">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total de pagos del contrato</div>
            <div className="text-xl font-bold text-green-600 mt-1">${totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow border-l-4 border-blue-500 transition-all hover:shadow-md">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Saldo del contrato</div>
            <div className="text-xl font-bold text-gray-900 mt-1">${balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow border-l-4 border-red-500 transition-all hover:shadow-md">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Deuda Vencida</div>
            <div className="text-xl font-bold text-red-600 mt-1 flex items-center">
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
                    <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                    <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meses</th>
                    <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Renta de Servicios</th>
                    <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Renta Mensual</th>
                    <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CXC Renta</th>
                    <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CXC Servicios</th>
                    <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Terminación</th>
                    <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
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
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {startDateFormatted} - {endDateFormatted}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center md:text-left font-bold text-blue-700">
                          {contract.num_months || '-'}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {serviceRentFormatted}
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
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
                        <td className="px-6 py-3 whitespace-nowrap">
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
                        <td className="px-6 py-3 whitespace-nowrap">
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
                            {isActive && (
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
                            )}
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
                            {isTerminated && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onReactivateContract && onReactivateContract(contract);
                                }}
                                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                title="Reactivar contrato"
                              >
                                <RefreshCw size={16} />
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

            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 ml-4">
              {[
                { id: 'Todos', label: 'Todos', icon: null },
                { id: 'Rent', label: 'Renta', icon: <Home size={14} className="mr-1.5" /> },
                { id: 'Service', label: 'Servicios', icon: <Lightbulb size={14} className="mr-1.5" /> }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setServiceTypeFilter(f.id)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center ${serviceTypeFilter === f.id
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  {f.icon}
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setAddManualReceivableModalOpen(true)}
              disabled={selectedContract?.status === 'Terminado'}
              className={`ml-4 px-4 py-1.5 rounded-lg text-sm font-medium flex items-center shadow-sm transition-all active:scale-95 ${selectedContract?.status === 'Terminado'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-700 hover:bg-blue-800 text-white'
                }`}
              title={selectedContract?.status === 'Terminado' ? 'No se puede agregar CXC a un contrato terminado' : ''}
            >
              <Plus size={16} className="mr-2" /> Agregar CXC
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white sticky top-0 shadow-sm z-10">
                <tr>
                  <th
                    className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors w-20"
                    onClick={() => requestSort('type')}
                  >
                    <div className="flex items-center">Tipo {getSortIcon('type')}</div>
                  </th>
                  <th
                    className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => requestSort('concept')}
                  >
                    <div className="flex items-center">Concepto {getSortIcon('concept')}</div>
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                    Ref MT
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha Pago
                  </th>
                  <th
                    className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => requestSort('daysOverdue')}
                  >
                    <div className="flex items-center">Atraso {getSortIcon('daysOverdue')}</div>
                  </th>
                  <th
                    className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => requestSort('amount')}
                  >
                    <div className="flex items-center justify-end">Monto {getSortIcon('amount')}</div>
                  </th>
                  <th
                    className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => requestSort('paidAmount')}
                  >
                    <div className="flex items-center justify-end text-green-700">Pagado {getSortIcon('paidAmount')}</div>
                  </th>
                  <th
                    className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => requestSort('balanceDue')}
                  >
                    <div className="flex items-center justify-end text-blue-700">Saldo {getSortIcon('balanceDue')}</div>
                  </th>
                  <th
                    className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => requestSort('status')}
                  >
                    <div className="flex items-center">Estado {getSortIcon('status')}</div>
                  </th>
                  <th className="px-3 py-2.5 relative"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receivablesLoading ? (
                  <tr><td colSpan="10" className="px-6 py-8 text-center"><Loader size={24} className="animate-spin mx-auto text-blue-600" /></td></tr>
                ) : filteredReceivables.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 group">
                    <td className="px-3 py-2.5 whitespace-nowrap">
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
                    <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-900 italic font-medium">
                      {item.concept || '-'}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-600">
                      {item.paymentReferences || '-'}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-500">
                      {item.paymentDates ? item.paymentDates.split(', ').map(d => {
                        try {
                          const [y, m, d_] = d.split('-');
                          const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                          return `${d_} ${months[parseInt(m) - 1]}`;
                        } catch (_) { return d; }
                      }).join(', ') : '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      {item.status === 'Overdue' && item.daysOverdue > 0 ? (
                        <span className="text-red-600 font-bold flex items-center">
                          <AlertTriangle size={14} className="mr-1" />
                          {item.daysOverdue} {item.daysOverdue === 1 ? 'día' : 'días'}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                      {item.amount}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-right">
                      {`$${parseFloat(item.amount_paid || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-blue-700 text-right">
                      {`$${(item.balanceDueRaw || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.status} />
                        {item.marketTecUploadIds && (
                          <span className="text-[10px] text-gray-400 font-mono">
                            {item.marketTecUploadIds.split(', ').map(id => `#${id}`).join(', ')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1 bg-white shadow-sm rounded px-1">
                        <button
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Registrar Pago"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReceivableToPay(item);
                            setRegisterPaymentModalOpen(true);
                          }}
                        >
                          <DollarSign size={14} />
                        </button>
                        {(item.amount_paid > 0 || item.status === 'Paid' || item.status === 'Pagado') && (
                          <button
                            className="text-orange-600 hover:text-orange-900 p-1"
                            title="Revertir Pago"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReceivableToRevert(item);
                              setRevertPaymentModalOpen(true);
                            }}
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                        <button
                          className="text-gray-400 hover:text-gray-600 p-1"
                          title="Editar Monto"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReceivableToEdit(item);
                            setEditReceivableModalOpen(true);
                          }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="text-red-400 hover:text-red-600 p-1"
                          title="Eliminar CXC"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReceivableToDelete(item);
                            setDeleteReceivableModalOpen(true);
                          }}
                        >
                          <Trash2 size={14} />
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
            <button
              onClick={() => {
                // Agregar unitName al objeto cliente para que salga en el PDF
                const clientForPdf = { ...client, unit_name: unitName };

                // Calcular conteos de Renta y Servicios para el contrato seleccionado
                // Usamos sortedReceivables que ya contiene los movimientos filtrados y ordenados
                // pero necesitamos filtrar por el contrato actual si sortedReceivables pudiera tener de otros (aunque aqui ya esta filtrado por contrato)
                // y contar por tipo.
                const rentCount = (sortedReceivables || []).filter(r => r.type === 'Rent' || r.type === 'Renta').length;
                const serviceCount = (sortedReceivables || []).filter(r => r.type === 'Service' || r.type === 'Services' || r.type === 'Luz' || (r.type !== 'Rent' && r.type !== 'Renta')).length;

                // Calcular totales para las tarjetas resumen (mismo calculo que en la vista)
                const pdfContractTotal = (sortedReceivables || []).reduce((acc, curr) => acc + (curr.amountRaw || 0), 0);
                const pdfTotalPaid = (sortedReceivables || []).reduce((acc, curr) => acc + (curr.paidAmountRaw || 0), 0);

                const calculatePdfBalance = (items) => items.reduce((acc, curr) => acc + (curr.balanceDueRaw || 0), 0);
                const pdfBalance = calculatePdfBalance((sortedReceivables || []).filter(i =>
                  ['pending', 'pendiente', 'partial', 'parcial', 'overdue'].includes(i.status.toLowerCase())
                ));

                const pdfOverdueTotal = calculatePdfBalance((sortedReceivables || []).filter(i =>
                  i.status.toLowerCase() === 'overdue'
                ));

                const contractWithCounts = {
                  ...selectedContract,
                  cxc_renta: rentCount,
                  cxc_servicios: serviceCount,
                  // Totales para tarjetas
                  total_contract: pdfContractTotal,
                  total_paid: pdfTotalPaid,
                  contract_balance: pdfBalance,
                  overdue_debt: pdfOverdueTotal
                };

                downloadEstadoCuentaPDF(clientForPdf, sortedReceivables, contractWithCounts);
              }}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors"
            >
              <FileText size={16} className="mr-2" /> Generar Estado de Cuenta (PDF)
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

        {/* Modal de Confirmación de Eliminación de Receivable */}
        {isDeleteReceivableModalOpen && (
          <Modal
            isOpen={isDeleteReceivableModalOpen}
            onClose={() => setDeleteReceivableModalOpen(false)}
            title="Confirmar Eliminación"
          >
            <div className="space-y-4">
              <div className="flex items-center text-red-600 mb-2">
                <AlertTriangle size={24} className="mr-2" />
                <h3 className="text-lg font-bold">¿Estás seguro?</h3>
              </div>
              <p className="text-gray-600">
                Vas a eliminar la CXC: <strong>{receivableToDelete?.concept}</strong> del mes <strong>{receivableToDelete?.periodMonth}/{receivableToDelete?.periodYear}</strong>.
              </p>
              <p className="text-sm text-red-500 font-medium">
                Esta acción no se puede deshacer y puede afectar los balances del contrato.
              </p>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setDeleteReceivableModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  disabled={isGenerating}
                  onClick={async () => {
                    setIsGenerating(true);
                    try {
                      const result = await onDeleteReceivable(receivableToDelete.id);
                      if (result.success) {
                        setDeleteReceivableModalOpen(false);
                        setReceivableToDelete(null);
                      } else {
                        alert('Error al eliminar: ' + result.error?.message);
                      }
                    } catch (err) {
                      alert('Error inesperado: ' + err.message);
                    } finally {
                      setIsGenerating(false);
                    }
                  }}
                >
                  {isGenerating ? <Loader size={18} className="animate-spin" /> : 'Eliminar Permanentemente'}
                </button>
              </div>
            </div>
          </Modal>
        )}

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
                market_tec_referencia: formData.get('market_tec_referencia'),
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Market_tec_Referencia</label>
              <input
                type="text"
                name="market_tec_referencia"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Ej: MT-12345"
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
          title="Agregar Cuenta x Cobrar"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
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

        {/* Modal para revertir pago */}
        <Modal
          isOpen={isRevertPaymentModalOpen}
          onClose={() => !isGenerating && setRevertPaymentModalOpen(false)}
          title="Revertir Pago"
        >
          <div className="space-y-4">
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-orange-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-orange-700 font-medium">
                    ¿Estás seguro de que deseas revertir el pago de este movimiento?
                  </p>
                </div>
              </div>
            </div>

            {receivableToRevert && (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500 font-bold uppercase">Concepto</span>
                    <p className="text-sm font-medium text-gray-900">{receivableToRevert.concept}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-bold uppercase">Fecha de Pago</span>
                    <p className="text-sm font-medium text-gray-900">{receivableToRevert.paymentDates || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-bold uppercase">Monto Pagado</span>
                    <p className="text-sm font-bold text-green-600">${parseFloat(receivableToRevert.amount_paid || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-bold uppercase">Referencia</span>
                    <p className="text-sm font-medium text-gray-900">{receivableToRevert.paymentReferences || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-600">
              Esta acción restablecerá el estado a <span className="font-bold text-blue-600">Pendiente</span> y el monto pagado a <span className="font-bold text-red-600">$0.00</span>.
            </p>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRevertPaymentModalOpen(false)}
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
                    const result = await onRevertPayment(receivableToRevert.id);
                    if (result.success) {
                      setRevertPaymentModalOpen(false);
                      setReceivableToRevert(null);
                    } else {
                      alert('Error al revertir pago: ' + (result.error?.message || 'Error desconocido'));
                    }
                  } catch (err) {
                    console.error('Error reverting payment:', err);
                    alert('Error inesperado: ' + err.message);
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-bold hover:bg-orange-700 disabled:opacity-50 shadow-sm flex items-center"
              >
                {isGenerating ? (
                  <>
                    <Loader size={16} className="animate-spin mr-2" />
                    Procesando...
                  </>
                ) : 'Confirmar Reversión'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

const MarketTecUploadModal = ({ isOpen, onClose, onFileProcess, isLoading }) => {
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Cargar Archivo</h3>
          <button onClick={() => !isLoading && onClose()} disabled={isLoading}>
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <div className="p-8">
          <div className={`relative border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl p-10 text-center hover:bg-blue-50 transition-colors ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              accept=".csv, .xlsx, .xls"
              onChange={(e) => {
                if (e.target.files?.[0]) onFileProcess(e.target.files[0]);
              }}
            />
            <div className="z-0 pointer-events-none">
              {isLoading ? (
                <Loader2 size={32} className="mx-auto text-blue-500 mb-4 animate-spin" />
              ) : (
                <Upload size={32} className="mx-auto text-blue-500 mb-4" />
              )}
              <p className="text-slate-700 font-medium">
                {isLoading ? 'Procesando archivo...' : 'Arrastra tu CSV aquí o haz clic'}
              </p>
              <p className="text-xs text-slate-400 mt-2">Soporta .csv y .xlsx</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 font-medium text-sm"
            disabled={isLoading}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export const MarketTecView = ({ user, unitName }) => {
  // 'list' = Dashboard principal
  // 'review' = NUEVA: Revisión de datos crudos antes de n8n
  // 'detail' = Ver el detalle de resultados post-n8n
  const [currentView, setCurrentView] = useState('list');
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedUploadId, setSelectedUploadId] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [stagingData, setStagingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadToDelete, setUploadToDelete] = useState(null);

  // Cargar historial al inicio
  useEffect(() => {
    loadUploads();
  }, [user.unitId, user.unit_id]);

  const loadUploads = async () => {
    const currentUnitId = user.unitId || user.unit_id;
    if (!currentUnitId) return;

    try {
      setLoading(true);
      const data = await marketTecService.getUploads(currentUnitId);
      setUploads(data || []);
    } catch (error) {
      console.error('Error loading uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileProcess = async (file) => {
    const currentUnitId = user.unitId || user.unit_id;

    if (!currentUnitId) {
      alert("Error: No se ha detectado una Unidad de Negocio asociada a tu cuenta. Por favor, cierra sesión e intenta de nuevo.");
      return;
    }

    try {
      setUploadLoading(true);
      // 1. Parsear CSV
      const allRows = await marketTecService.parseFile(file);

      if (!allRows || allRows.length === 0) {
        alert('El archivo parece estar vacío o no es válido.');
        return;
      }

      // Filtrar registros: Solo "Ready for handling" o "Listo para preparación" (case insensitive)
      const rows = allRows.filter(row => {
        const status = (row['Status raw value (temporary)'] || '').toLowerCase().trim();
        return status === 'ready for handling' || status === 'listo para preparación';
      });

      if (rows.length === 0) {
        alert('El archivo no contiene registros con estado "Ready for handling" o "Listo para preparación".');
        return;
      }

      // 2. Calcular totales localmente para el registro maestro
      const totalRecords = rows.length;
      const totalAmount = rows.reduce((acc, row) => {
        const val = parseFloat(row['Total Value'] || row['Monto'] || row['raw_total_value'] || 0);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);

      // 3. Crear registro maestro
      const uploadRecord = await marketTecService.createUploadRecord({
        unitId: currentUnitId,
        filename: file.name,
        uploadedBy: user.user_id, // ID numérico de system_users
        totalRecords,
        totalAmount
      });

      // 4. Insertar detalle en staging
      const { skippedCount } = await marketTecService.insertStagingData(uploadRecord.id, currentUnitId, rows);

      if (skippedCount > 0) {
        alert(`Se procesaron correctamente los registros, pero se omitieron ${skippedCount} registros que ya existían en la tabla de Pagos (duplicados).`);
      }

      // 5. Actualizar estado y redireccionar
      await loadUploads(); // Recargar lista
      setSelectedUploadId(uploadRecord.id);

      // Cargar datos de staging para la vista de revisión
      await loadStagingForReview(uploadRecord.id);

      setUploadModalOpen(false);
      setCurrentView('review');

    } catch (error) {
      console.error('Error processing file:', error);
      alert('Ocurrió un error al procesar el archivo: ' + (error.message || error));
    } finally {
      setUploadLoading(false);
    }
  };

  const loadStagingForReview = async (uploadId, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await marketTecService.getStagingData(uploadId);
      setStagingData(data || []);
    } catch (error) {
      console.error('Error loading staging data:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleViewDetail = async (id, view) => {
    setSelectedUploadId(id);
    if (view === 'review') {
      await loadStagingForReview(id);
    }
    setCurrentView(view);
  };

  // Helper: Return to list view with data refresh
  const handleBackToList = async () => {
    await loadUploads();
    setCurrentView('list');
  };

  const handleDeleteUpload = async () => {
    if (!uploadToDelete) return;

    try {
      setLoading(true);
      await marketTecService.deleteUpload(uploadToDelete.id);

      // Recargar lista y cerrar modal
      await loadUploads();
      setUploadToDelete(null);

    } catch (error) {
      console.error('Error deleting upload:', error);
      alert('Error al eliminar la carga: ' + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  // --- COMPONENTES AUXILIARES ---

  const StatusBadge = ({ status }) => {
    const styles = {
      'COMPLETED': 'bg-green-100 text-green-700 border-green-200',
      'Procesando': 'bg-purple-100 text-purple-700 border-purple-200 animate-pulse',
      'PENDING': 'bg-gray-100 text-gray-700 border-gray-200',
      'PARTIAL_ERROR': 'bg-orange-100 text-orange-700 border-orange-200',
      'ERROR': 'bg-red-100 text-red-700 border-red-200',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles['PENDING']}`}>
        {status}
      </span>
    );
  };

  // --- VISTAS ---

  // 1. DASHBOARD
  const DashboardView = () => (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-medium text-slate-800">Historial de Importaciones</h2>

        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex justify-center items-center h-full py-20">
            <Loader2 size={30} className="animate-spin text-blue-500" />
          </div>
        ) : uploads.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full py-20 text-slate-400">
            <FileSpreadsheet size={48} className="mb-4 opacity-50" />
            <p>No hay cargas registradas aún.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">Archivo</th>
                <th className="px-6 py-4 font-semibold text-center">Registros</th>
                <th className="px-6 py-4 font-semibold text-right">Total</th>
                <th className="px-6 py-4 font-semibold text-center">Fecha</th>
                <th className="px-6 py-4 font-semibold text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {uploads.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-400 font-mono">#{row.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{row.filename}</td>
                  <td className="px-6 py-4 text-center">{row.total_records}</td>
                  <td className="px-6 py-4 text-right font-mono">${(row.total_amount || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-center text-slate-500">
                    {new Date(row.upload_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-center"><StatusBadge status={row.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <div className="relative group/tooltip">
                        <button
                          onClick={() => handleViewDetail(row.id, 'review')}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-md transition-colors"
                          title="Ver Detalle"
                        >
                          <Eye size={18} />
                        </button>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap z-10">Ver Detalle</span>
                      </div>

                      <div className="relative group/tooltip">
                        <button
                          onClick={() => setUploadToDelete(row)}
                          className="p-1.5 hover:bg-red-50 text-red-500 rounded-md transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap z-10">Eliminar</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  // 2. NUEVA VISTA: REVISIÓN PRE-N8N (Staging Data Real)
  const ReviewStagingView = () => {
    const [isReconciling, setIsReconciling] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(null);
    const [lastResult, setLastResult] = useState(null);
    const VERSION = "1.0.4"; // Para verificar recarga de cache

    const handleTriggerReconciliation = async () => {
      console.log(`[MarketTec] Triggering reconciliation v${VERSION}...`);
      setIsReconciling(true);
      setLastResult(null); // Limpiar resultado previo
      try {
        // No enviamos IDs específicos para que el servicio filtre automáticamente los PENDIENTES
        const { success, error, data, recordCount } = await marketTecService.triggerReconciliation(selectedUploadId);

        if (!success) {
          if (error && error.includes('No hay registros pendientes')) {
            // No mostrar error modal para este caso informativo
            setLastResult({
              success: true,
              message: error
            });
          } else {
            setShowErrorModal(true);
          }
          setIsReconciling(false);
          return;
        }

        console.log('n8n response:', data);
        console.log(`Procesamiento iniciado para ${recordCount} registros. Verificando estado...`);

        // Comprobar estado inmediatamente por si ya terminó
        const initialStatus = await marketTecService.checkProcessingStatus(selectedUploadId);
        if (initialStatus.isComplete) {
          setIsReconciling(false);
          setProcessingProgress(null);
          await loadStagingForReview(selectedUploadId, true);

          const processed = initialStatus.processedCount || 0;
          const noCxc = initialStatus.noCxcCount || 0;
          const noClient = initialStatus.noClientCount || 0;
          const errors = initialStatus.errorCount || 0;
          const handled = processed + noCxc + noClient + errors;

          setLastResult({
            success: true,
            message: `Conciliación completa. Se procesaron ${handled} registros.`,
            details: errors > 0 ? `${errors} con error.` : "Todos los registros fueron atendidos."
          });

          await loadUploads();
          return;
        }

        // Implementar polling para verificar el estado de procesamiento si no ha terminado
        const pollInterval = 3000; // 3 segundos
        const startTime = Date.now();

        const checkStatus = async () => {
          try {
            const status = await marketTecService.checkProcessingStatus(selectedUploadId);

            console.log('Estado de procesamiento:', status);

            // Refrescar los datos de la tabla durante el polling (Silenciosamente para evitar parpadeo)
            await loadStagingForReview(selectedUploadId, true);

            if (status.isComplete) {
              // Procesamiento completado
              setIsReconciling(false);
              setProcessingProgress(null);

              // Mostrar mensaje de éxito en UI (Banner persistente)
              const processed = status.processedCount || 0;
              const noCxc = status.noCxcCount || 0;
              const noClient = status.noClientCount || 0;
              const errors = status.errorCount || 0;
              const handled = processed + noCxc + noClient + errors;

              console.log('[MarketTec] Processing complete:', { processed, noCxc, noClient, errors, handled });

              setLastResult({
                success: true,
                message: `Conciliación completa. Se procesaron ${handled} registros.`,
                details: errors > 0 ? `${errors} con error.` : "Todos los registros fueron atendidos."
              });

              // Refresh list and staging data
              await loadUploads();
              await loadStagingForReview(selectedUploadId);

              return; // Detener polling
            }

            // Actualizar progreso
            setProcessingProgress({
              done: status.totalCount - status.pendingCount - status.processingCount,
              total: status.totalCount
            });

            // Continuar polling
            setTimeout(checkStatus, pollInterval);
          } catch (err) {
            console.error('Error checking status:', err);
            setIsReconciling(false);
          }
        };

        // Iniciar polling
        setTimeout(checkStatus, pollInterval);

      } catch (err) {
        console.error('Error in reconciliation trigger:', err);
        setShowErrorModal(true);
        setIsReconciling(false);
      }
    };

    // Subscripción Realtime para cambios en staging
    useEffect(() => {
      if (!selectedUploadId) return;

      const channel = supabase
        .channel(`staging_changes_${selectedUploadId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payment_staging',
            filter: `upload_id=eq.${selectedUploadId}`
          },
          () => {
            // Refrescar datos silenciosamente al detectar cambios en la DB
            loadStagingForReview(selectedUploadId, true);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [selectedUploadId]);
    // Calcular KPIs básicos del staging
    const totalRecords = stagingData.length;
    const totalAmount = stagingData.reduce((acc, r) => acc + (r.raw_total_value || 0), 0);

    // Identificar problemas: Sin User_market_tec
    const unmatchedCount = stagingData.filter(r => !r.client_user_market_tec).length;

    return (
      <div className="animate-in slide-in-from-right-4 duration-300">
        {/* Header de Revisión */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">Staging</span>
              <span className="text-slate-400 text-sm">Upload ID: #{selectedUploadId}</span>
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800">Revisión de Carga</h2>
              {isReconciling && (
                <div className="flex flex-col gap-1">
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-2 border border-purple-200">
                    <Loader2 size={12} className="animate-spin" />
                    {processingProgress
                      ? `Procesando: ${processingProgress.done} de ${processingProgress.total}...`
                      : 'Iniciando asistente IA...'}
                  </span>
                  {processingProgress && (
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-500 h-full transition-all duration-500"
                        style={{ width: `${(processingProgress.done / processingProgress.total) * 100}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleBackToList}
              disabled={isReconciling}
              className={`px-4 py-2 text-slate-600 rounded-lg font-medium border border-slate-200 ${isReconciling ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:bg-slate-100'}`}
            >
              <ChevronLeft size={18} className="inline mr-1" /> Volver
            </button>
            <button
              onClick={handleTriggerReconciliation}
              disabled={isReconciling}
              className={`bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-lg shadow-lg shadow-slate-200 flex items-center gap-2 font-medium transition-all transform hover:scale-105 ${isReconciling ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isReconciling ? <Loader2 size={18} className="animate-spin" /> : <Bot size={18} className="text-purple-300" />}
              {isReconciling ? 'Ejecutando...' : 'Ejecutar Conciliación IA'}
            </button>
          </div>
        </div>

        {/* Banner de Resultado */}
        {lastResult && (
          <div className={`mb-6 p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-300 flex items-center justify-between ${lastResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            <div className="flex items-center gap-3">
              {lastResult.success ? <CheckCircle size={24} className="text-emerald-500" /> : <AlertTriangle size={24} className="text-red-500" />}
              <div>
                <p className="font-bold">{lastResult.message}</p>
                {lastResult.details && <p className="text-sm opacity-80">{lastResult.details}</p>}
              </div>
            </div>
            <button onClick={() => setLastResult(null)} className="p-1 hover:bg-black/5 rounded-full">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Tarjetas de Validación */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs font-medium uppercase">Total en Archivo</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">${totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs font-medium uppercase">Registros Leídos</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{totalRecords}</p>
          </div>
          <div className={`${unmatchedCount > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'} p-4 rounded-xl border shadow-sm`}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`${unmatchedCount > 0 ? 'text-orange-800' : 'text-green-800'} text-xs font-medium uppercase`}>
                  {unmatchedCount > 0 ? 'Clientes no encontrados' : 'Validación Completa'}
                </p>
                <p className={`${unmatchedCount > 0 ? 'text-orange-900' : 'text-green-900'} text-2xl font-bold mt-1`}>{unmatchedCount}</p>
              </div>
              {unmatchedCount > 0 ? <AlertTriangle size={20} className="text-orange-500" /> : <CheckCircle size={20} className="text-green-500" />}
            </div>
            <p className="text-xs text-slate-500 mt-1">Registros sin Market Tec Receiver asociado</p>
          </div>
        </div>

        {/* Tabla Staging */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-semibold text-slate-700">Datos Crudos (Payment Staging)</h3>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 size={30} className="animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">Orden / Ref</th>
                    <th className="px-4 py-3 font-semibold text-center">Market Tec Receiver</th>
                    <th className="px-4 py-3 font-semibold">Fecha Autorización</th>
                    <th className="px-4 py-3 font-semibold text-right">Monto</th>
                    <th className="px-4 py-3 font-semibold text-center">CxC Pendientes</th>
                    <th className="px-4 py-3 font-semibold text-center">Status Procesamiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stagingData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600">
                        {row.client_business_name || <span className="text-slate-400 italic">{row.raw_receiver_name}</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {row.raw_order || <span className="text-red-300 italic">Vacío</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.client_user_market_tec ? (
                          <div className="flex justify-center group relative cursor-help">
                            <UserCheck size={20} className="text-emerald-500" />
                            <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 shadow-md">
                              Encontrado: {row.client_user_market_tec}
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-center group relative cursor-help">
                            <UserX size={20} className="text-slate-300" />
                            <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 shadow-md">
                              No encontrado en tabla Clientes
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs capitalize">
                        {row.raw_authorized_date ? new Date(row.raw_authorized_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: '2-digit' }).replace('.', '') : '-'}
                      </td>
                      <td className={`px-4 py-3 text-right ${row.raw_total_value === 0 ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                        ${(row.raw_total_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {row.pending_receivables_count || 0}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(() => {
                          const s = row.processing_status;
                          if (s === 'SIN CXC' || s === 'SIN CLIENTE') {
                            return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-medium border border-yellow-200">{s}</span>;
                          }
                          if (s === 'PROCESADO') {
                            return <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded border border-emerald-200 font-medium">{s}</span>;
                          }
                          if (s === 'PENDIENTE') {
                            return <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded border border-gray-200 font-medium">{s}</span>;
                          }
                          if (s === 'PROCESANDO') {
                            return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded border border-purple-200 font-medium animate-pulse">{s}</span>;
                          }
                          if (s === 'ERROR') {
                            return <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded border border-red-200 font-medium">{s}</span>;
                          }
                          return <span className="text-xs bg-gray-50 text-gray-400 px-2 py-1 rounded border border-gray-100">{s}</span>;
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <Modal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          title="Algo salió mal con el asistente"
        >
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <p className="text-red-700 text-sm">
                No pudimos conectar con el agente. Por favor, inténtalo de nuevo o contacta a soporte si el problema persiste.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="font-medium text-slate-700">Contacto de soporte:</h4>

              <a
                href="mailto:contact@intelekta.ai?subject=Soporte%20Market%20Tec%20-%20Error%20Asistente%20IA&body=Hola%2C%20necesito%20ayuda%20con%20un%20error%20al%20ejecutar%20el%20asistente%20de%20IA."
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Mail className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Correo Electrónico</p>
                  <p className="text-sm text-slate-500">contact@intelekta.ai</p>
                </div>
                <ArrowRight className="ml-auto text-slate-400 group-hover:text-slate-600" size={16} />
              </a>

              <a
                href="https://wa.me/524442908017"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <MessageCircle className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">WhatsApp</p>
                  <p className="text-sm text-slate-500">+52 444 290 8017</p>
                </div>
                <ArrowRight className="ml-auto text-slate-400 group-hover:text-slate-600" size={16} />
              </a>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowErrorModal(false)}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
              >
                Entendido
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  };

  // 3. VISTA DETALLE FINAL (Placeholder por ahora)
  const DetailResultView = () => (
    <div className="animate-in fade-in duration-300">
      <button onClick={() => setCurrentView('list')}>Volver</button>
      <p>Detalle de resultados (Pendiente de implementar visualización de conciliacion).</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          Market Tec - {unitName || `Unidad ${user.unitId || user.unit_id || '???'}`}
        </h2>
        {currentView === 'list' && (
          <button
            onClick={() => setUploadModalOpen(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-all active:scale-95"
          >
            <Upload size={18} className="mr-2" /> Nueva Carga
          </button>
        )}
      </div>

      <main>
        {currentView === 'list' && <DashboardView />}
        {currentView === 'review' && <ReviewStagingView />}
        {currentView === 'detail' && <DetailResultView />}
      </main>

      <MarketTecUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onFileProcess={handleFileProcess}
        isLoading={uploadLoading}
      />

      {/* Modal de Confirmación de Eliminación */}
      <Modal
        isOpen={!!uploadToDelete}
        onClose={() => !loading && setUploadToDelete(null)}
        title="Eliminar Registro de Importación"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div className="space-y-1">
              <p className="font-medium text-red-800">¿Estás seguro de que deseas eliminar este registro?</p>
              <p className="text-red-700 text-sm">
                Esta acción eliminará permanentemente la carga <strong>{uploadToDelete?.filename}</strong> y todos los registros de pago asociados a ella. Esta acción no se puede deshacer.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setUploadToDelete(null)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteUpload}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {loading ? 'Eliminando...' : 'Eliminar Definitivamente'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export const OverdueView = ({ filteredCXC, selectedOverdue, toggleOverdueSelection, user, unitName }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const overdueItems = filteredCXC.filter(i => i.status === 'Overdue');
  const totalOverdue = overdueItems.reduce((acc, curr) => acc + (curr.balanceDueRaw || 0), 0);
  const uniqueClientsCount = new Set(overdueItems.map(i => i.clientId)).size;

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedOverdueItems = React.useMemo(() => {
    let sortableItems = [...overdueItems];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Manejo especial para dueDate
        if (sortConfig.key === 'dueDate') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [overdueItems, sortConfig]);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronUp size={14} className="opacity-30" />;
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp size={14} className="text-blue-600" />
      : <ChevronDown size={14} className="text-blue-600" />;
  };

  const handleExportExcel = () => {
    // Preparar datos para Excel
    const excelData = overdueItems.map(item => ({
      'Cliente': item.client || 'N/A',
      'Concepto': item.concept || 'N/A',
      'Fecha Límite': item.dueDate || 'N/A',
      'Días Retraso': item.daysOverdue || 0,
      'Saldo': item.balanceDueRaw || 0
    }));

    // Crear workbook y worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cuentas Vencidas');

    // Descargar archivo
    const fileName = `cuentas_vencidas_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

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
          <button
            onClick={handleExportExcel}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center shadow-sm text-sm font-medium">
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('client')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Cliente</span>
                    {getSortIcon('client')}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('concept')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Concepto</span>
                    {getSortIcon('concept')}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('dueDate')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Fecha Límite</span>
                    {getSortIcon('dueDate')}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días Retraso</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedOverdueItems.length > 0 ? (
                sortedOverdueItems.map((item) => (
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

export const RemindersView = ({ filteredUpcoming, selectedReminders, toggleReminderSelection, setSelectedReminders, user, unitName, templates: propTemplates }) => {
  const [filterType, setFilterType] = useState('currentMonth'); // 'currentMonth' | 'nextMonth'
  const [showModal, setShowModal] = useState(false);

  // Template State
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Fetch Templates
  // Fetch Templates or use Props
  useEffect(() => {
    if (propTemplates !== undefined) {
      setTemplates(propTemplates);
      if (propTemplates.length > 0 && selectedTemplate === 'default') {
        setSelectedTemplate(propTemplates[0].id);
      }
      return;
    }

    const fetchTemplates = async () => {
      if (!user?.unitId || propTemplates) return; // Don't fetch if props exist (even empty, implies parent handles it) OR if we want to fallback?
      // Actually strictly speaking, if propTemplates passed we rely on it.
      // But initially it might be empty array.

      setLoadingTemplates(true);
      const { data } = await getTemplates(user.unitId, 'Recordatorio');
      if (data) {
        setTemplates(data);
        if (data.length > 0) setSelectedTemplate(data[0].id);
      }
      setLoadingTemplates(false);
    };

    // Only fetch if propTemplates is undefined (legacy mode)
    if (propTemplates === undefined) {
      fetchTemplates();
    }
  }, [user?.unitId, propTemplates]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Helper para determinar si una fecha cae en el mes actual o siguiente
  const getMonthCategory = (dateString) => {
    if (!dateString) return 'unknown';
    // Ajustar zona horaria si es necesario o usar split para evitar conversiones UTC
    // Asumimos formato YYYY-MM-DD
    const [yearStr, monthStr] = String(dateString).split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1; // 0-indexed

    if (year === currentYear && month === currentMonth) return 'currentMonth';

    // Calcular mes siguiente
    let nextMonth = currentMonth + 1;
    let nextYear = currentYear;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }

    if (year === nextYear && month === nextMonth) return 'nextMonth';

    return 'other';
  };

  // Filtrar data
  const currentMonthReminders = filteredUpcoming.filter(i => getMonthCategory(i.dueDate) === 'currentMonth');
  const nextMonthReminders = filteredUpcoming.filter(i => getMonthCategory(i.dueDate) === 'nextMonth');

  // Selección actual para la tabla
  const displayedReminders = filterType === 'currentMonth' ? currentMonthReminders : nextMonthReminders;
  const displayedPending = displayedReminders.filter(i => !i.sent);

  // KPI stats
  const currentMonthCount = currentMonthReminders.length;
  const nextMonthCount = nextMonthReminders.length;
  const pendingCount = displayedPending.length;

  return (
    <div className="space-y-6 animate-fade-in">


      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            Recordatorios de Pago - {unitName || `Unidad ${user.unitId} ` || 'Sin unidad'}
          </h2>
        </div>

      </div>

      {/* Filter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card: Vencen Mes Actual */}
        <div
          onClick={() => setFilterType('currentMonth')}
          className={`p-4 rounded-lg border shadow-sm flex items-center cursor-pointer transition-all ${filterType === 'currentMonth' ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
        >
          <div className={`p-3 rounded-full mr-3 ${filterType === 'currentMonth' ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
            <Calendar size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase">Vencen Este Mes</div>
            <div className={`text-lg font-bold ${filterType === 'currentMonth' ? 'text-blue-800' : 'text-gray-700'}`}>
              {currentMonthCount} Pagos
            </div>
          </div>
        </div>

        {/* Card: Vencen Mes Siguiente */}
        <div
          onClick={() => setFilterType('nextMonth')}
          className={`p-4 rounded-lg border shadow-sm flex items-center cursor-pointer transition-all ${filterType === 'nextMonth' ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
        >
          <div className={`p-3 rounded-full mr-3 ${filterType === 'nextMonth' ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
            <Calendar size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase">Vencen Mes Siguiente</div>
            <div className={`text-lg font-bold ${filterType === 'nextMonth' ? 'text-blue-800' : 'text-gray-700'}`}>
              {nextMonthCount} Pagos
            </div>
          </div>
        </div>

        {/* Card: Pendientes de Envío (del filtro actual) */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center">
          <div className="bg-yellow-100 p-3 rounded-full text-yellow-600 mr-3">
            <Mail size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase">Pendientes de Envío</div>
            <div className="text-lg font-bold text-gray-800">{displayedPending.length}</div>
          </div>
        </div>

        {/* Card: Template Selector */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-center">
          <label className="text-xs text-gray-500 font-medium uppercase mb-1 flex items-center gap-2">
            <Mail size={12} /> Plantilla de Email
          </label>
          <div className="relative">
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 pr-8"
              disabled={loadingTemplates}
            >
              <option value="default" disabled>Seleccionar plantilla...</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <ChevronDown size={14} />
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            Se usará al enviar avisos.
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Pagos Programados</h3>
            {selectedReminders.length > 0 && (
              <span className="text-sm font-medium text-indigo-900 animate-in fade-in">
                {selectedReminders.length} seleccionados
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
              {filterType === 'currentMonth' ? 'Mes Actual' : 'Mes Siguiente'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(true)}
                disabled={selectedReminders.length === 0}
                className={`px-3 py-1.5 rounded-lg flex items-center shadow-sm text-sm font-medium transition-colors ${selectedReminders.length > 0 ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              >
                <Mail size={14} className="mr-1.5" />
                Enviar Email
              </button>
            </div>
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
                        setSelectedReminders(displayedPending.map(i => i.id));
                      } else {
                        setSelectedReminders([]);
                      }
                    }}
                    checked={selectedReminders.length === displayedPending.length && displayedPending.length > 0}
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
              {displayedReminders.length > 0 ? (
                displayedReminders.map((item) => {
                  const daysDiff = Math.ceil((new Date(item.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                  const isSelected = selectedReminders.includes(item.id);
                  const isSent = item.sent;

                  return (
                    <tr key={item.id} className={isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={isSelected}
                          disabled={isSent}
                          onChange={() => toggleReminderSelection(item.id)}
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{item.client}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.concept}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {typeof item.amount === 'number'
                          ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.amount)
                          : item.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-bold rounded-full ${daysDiff < 3 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {daysDiff} días
                        </span>
                        <div className="text-xs text-gray-400 mt-1">{item.dueDate}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isSent ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Enviado
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Pendiente
                          </span>
                        )}
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500 italic">
                    No hay recordatorios encontrados para este periodo
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Bulk Action Modal */}
      {
        showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Confirmar Envío Masivo</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Estás a punto de enviar recordatorios a <strong>{selectedReminders.length} pagos</strong>.
                </p>
              </div>
              <div className="p-6 bg-slate-50 space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 flex gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>El sistema agrupará los pagos por cliente en un solo correo.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Resumen</label>
                  <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-40 overflow-y-auto">
                    {(() => {
                      const selectedItems = displayedPending.filter(i => selectedReminders.includes(i.id));
                      const clients = [...new Set(selectedItems.map(i => i.client))];
                      return clients.map(clientName => {
                        const count = selectedItems.filter(i => i.client === clientName).length;
                        return (
                          <div key={clientName} className="p-3 flex justify-between items-center text-sm">
                            <span className="truncate max-w-[200px] font-medium text-slate-700">{clientName}</span>
                            <span className="text-slate-500">{count} pagos</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    try {
                      const templateData = templates.find(t => t.id === selectedTemplate);
                      if (!templateData) {
                        alert("Por favor selecciona una plantilla válida.");
                        return;
                      }

                      const selectedItems = displayedPending.filter(i => selectedReminders.includes(i.id));

                      // Group by client
                      const groupedItems = selectedItems.reduce((acc, item) => {
                        const key = item.client;
                        if (!acc[key]) {
                          acc[key] = {
                            clientId: item.clientId,
                            clientName: item.client,
                            email: item.email,
                            contact: item.contactName,
                            invoices: []
                          };
                        }
                        acc[key].invoices.push(item);
                        return acc;
                      }, {});

                      const clientList = Object.values(groupedItems);

                      // Helper function to replace variables in template
                      const processTemplate = (template, clientData, isBody = false) => {
                        if (!template) return '';
                        let processed = template;

                        // Client variables
                        processed = processed.replace(/\{\{client\.contact_name\}\}/g, clientData.contact || '');
                        processed = processed.replace(/\{\{client\.business_name\}\}/g, clientData.clientName || '');
                        processed = processed.replace(/\{\{client\.contact_email\}\}/g, clientData.email || '');

                        // Receivables summary (aggregate)
                        const totalBalance = clientData.invoices.reduce((sum, inv) => sum + (parseFloat(String(inv.amount).replace(/[^0-9.-]+/g, '')) || 0), 0);
                        const concepts = clientData.invoices.map(inv => inv.concept).join(', ');
                        const dueDates = clientData.invoices.map(inv => {
                          if (!inv.dueDate) return '';
                          const [year, month, day] = inv.dueDate.split('-');
                          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                          return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
                        }).join(', ');
                        const types = [...new Set(clientData.invoices.map(inv => inv.type || 'N/A'))].join(', ');

                        processed = processed.replace(/\{\{receivables\.concept\}\}/g, concepts);
                        processed = processed.replace(/\{\{receivables\.due_date\}\}/g, dueDates);
                        processed = processed.replace(/\{\{receivables\.balance\}\}/g, `$${totalBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
                        processed = processed.replace(/\{\{receivables\.type\}\}/g, types);

                        // Business unit
                        processed = processed.replace(/\{\{business_units\.name\}\}/g, user?.unitName || '');

                        // Convert to HTML if it's the body
                        if (isBody) {
                          processed = processed.replace(/\n/g, '<br>');
                          processed = `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">${processed}</div>`;
                        }

                        return processed;
                      };

                      const selectedClientData = clientList.map(c => {
                        const processedSubject = processTemplate(templateData.subject_template, c, false);
                        const processedBody = processTemplate(templateData.body_template, c, true);

                        return {
                          clientId: c.clientId,
                          clientName: c.clientName,
                          email: c.email,
                          contact: c.contact,
                          subject: processedSubject,
                          body: processedBody,
                          receivables: c.invoices.map(inv => ({
                            concept: inv.concept,
                            dueDate: inv.dueDate,
                            amount: parseFloat(String(inv.amount).replace(/[^0-9.-]+/g, '')) || 0,
                            daysOverdue: parseInt(inv.daysOverdue) || 0,
                            type: inv.type
                          }))
                        };
                      });

                      const webhookPayload = {
                        templateId: selectedTemplate,
                        templateName: templateData.name,
                        unitId: user?.unitId,
                        unitName: user?.unitName,
                        clients: selectedClientData,
                        totalClients: selectedClientData.length,
                        timestamp: new Date().toISOString()
                      };

                      // Call n8n webhook
                      const response = await fetch('https://n8n-t.intelekta.ai/webhook/c5be4efd-e1b3-40ca-b75e-ca681d345850', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(webhookPayload)
                      });

                      if (response.ok) {
                        alert("Correos enviados exitosamente");
                        setShowModal(false);
                        setSelectedReminders([]);
                      } else {
                        alert("Error al enviar correos. Intente de nuevo.");
                      }

                    } catch (error) {
                      console.error('Error sending:', error);
                      alert(`Error al enviar correos: ${error.message}`);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
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

export const SettingsView = ({ setAddUserModalOpen, onEditUser }) => {
  const { users, loading, error, refreshUsers } = useSystemUsers();
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'Active', 'Inactive'

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`¿Estás seguro de que deseas desactivar al usuario "${userName}"?`)) {
      return;
    }

    try {
      const { deleteSystemUser } = await import('../../services/userService');
      const { error } = await deleteSystemUser(userId);
      if (error) throw error;

      // No es estrictamente necesario llamar a refreshUsers() porque Realtime lo hará,
      // pero lo dejamos por seguridad o para respuesta inmediata
      await refreshUsers();
    } catch (err) {
      alert('Error al desactivar usuario: ' + err.message);
    }
  };

  // Filtrar usuarios
  const filteredUsers = filterStatus === 'all'
    ? users
    : users.filter(u => u.status === filterStatus);

  const activeCount = users.filter(u => u.status === 'Active').length;

  // Mapeo de roles a iconos
  const getRoleIcon = (role) => {
    switch (role) {
      case 'Gerente de Unidad':
        return <Shield size={14} className="mr-1 text-blue-500" />;
      case 'Auditor':
        return <Shield size={14} className="mr-1 text-purple-500" />;
      case 'Asistente':
        return <Shield size={14} className="mr-1 text-gray-500" />;
      default:
        return <Shield size={14} className="mr-1 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Usuarios</h2>
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
          <h3 className="text-lg font-medium text-gray-900">Usuarios del Sistema</h3>
          <div className="flex space-x-2 items-center">
            {/* Filtro de estado */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">Todos</option>
              <option value="Active">Activos</option>
              <option value="Inactive">Inactivos</option>
            </select>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {activeCount} Usuarios Activos
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <Loader2 size={24} className="animate-spin mx-auto mb-2" />
            Cargando usuarios...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            Error: {error}
          </div>
        ) : (
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
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No hay usuarios para mostrar
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs mr-3">
                            {staff.name ? staff.name.substring(0, 2).toUpperCase() : '??'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                            <div className="text-xs text-gray-500">{staff.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          {getRoleIcon(staff.role)}
                          {staff.role}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {staff.unitId ? (staff.unitName || `Unidad ${staff.unitId}`) : <span className="text-gray-400 italic">Acceso Global</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${staff.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {staff.status === 'Active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => onEditUser && onEditUser(staff)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};


