// src/components/admin/AdminViews.jsx
import React, { useState } from 'react';
import { 
  Users, CreditCard, AlertTriangle, Mail, Menu, Home,
  FileSpreadsheet, Settings, LogOut, CheckCircle, UserPlus,
  Building, DollarSign, FileText, Calendar, Download, School,
  Plus, Send, ChevronRight, FileCheck, Ban, Edit, Zap, Trash2,
  Key, UploadCloud, Loader, Play, Filter, Shield, Eye
} from 'lucide-react';
import { StatusBadge, OverdueBadge, KPICard, RevenueChart } from '../ui/Shared';
import { UNITS, mockCXC, mockStaff } from '../../data/constants';

export const DashboardView = ({ adminStats, mockMonthlyStats, user }) => (
     <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800">Panel General - {UNITS[user.unitId]}</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard title="Total Clientes" value={adminStats.totalClients} icon={Users} color="#003DA5" subtext="En esta unidad" />
        <KPICard title="Por Cobrar" value={`$${adminStats.totalCXC.toLocaleString()}`} icon={CreditCard} color="#F59E0B" subtext="Facturación pendiente" />
        <KPICard title="Cuentas Vencidas" value={adminStats.overdueCount} icon={AlertTriangle} color="#EF4444" subtext="Requiere atención" />
      </div>
      
      {/* Revenue Chart */}
      <div className="overflow-x-auto">
        <RevenueChart data={mockMonthlyStats} />
      </div>
    </div>
);

export const ClientsView = ({ filteredClients, setAddClientModalOpen, handleClientClick, user }) => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Clientes - {UNITS[user.unitId]}</h2>
        <button onClick={() => setAddClientModalOpen(true)} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center shadow-sm">
          <Plus size={18} className="mr-2" /> Nuevo Cliente
        </button>
      </div>
      <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200"><input type="text" className="border rounded p-1 w-full" placeholder="Buscar..." /></div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleClientClick(client)}>
                  <td className="px-6 py-4">{client.name}</td>
                  <td className="px-6 py-4"><StatusBadge status={client.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
);

export const ClientDetailView = ({ client, setActiveTab, setContractModalOpen, generateContractPreview, setTerminationModalOpen }) => {
    // Filter Mock CXC for this specific client
    const clientCXC = mockCXC.filter(item => item.clientId === client.id);
    const balance = clientCXC.filter(i => i.status === 'Pending' || i.status === 'Overdue')
                            .reduce((acc, curr) => acc + parseFloat(curr.amount.replace(/[^0-9.-]+/g,"")), 0);
    const overdueTotal = clientCXC.filter(i => i.status === 'Overdue')
                                .reduce((acc, curr) => acc + parseFloat(curr.amount.replace(/[^0-9.-]+/g,"")), 0);

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <button onClick={() => setActiveTab('clients')} className="hover:text-blue-600 hover:underline">Clientes</button>
          <ChevronRight size={16} />
          <span className="font-semibold text-gray-800">{client.name}</span>
        </div>

        {/* Top Profile Card */}
        <div className="bg-white shadow rounded-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl mr-5">
              {client.name.substring(0,2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
              <div className="flex flex-col sm:flex-row sm:space-x-4 text-sm text-gray-500 mt-1">
                <span className="flex items-center"><Mail size={14} className="mr-1"/> {client.email}</span>
                <span className="flex items-center"><FileText size={14} className="mr-1"/> {client.rfc}</span>
              </div>
              <div className="mt-2 flex space-x-2">
                 <StatusBadge status={client.status} />
                 <span className="text-xs text-gray-400 border border-gray-200 px-2 py-1 rounded">Contrato: 2023-2024</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3 w-full md:w-auto">
            <button 
              onClick={() => { setContractModalOpen(true); generateContractPreview(); }}
              className="flex-1 md:flex-none px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium flex items-center justify-center shadow-sm"
            >
              <FileCheck size={16} className="mr-2" />
              Renovar Contrato
            </button>
            <button 
              onClick={() => setTerminationModalOpen(true)}
              className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg text-sm font-medium flex items-center justify-center shadow-sm"
            >
              <Ban size={16} className="mr-2" />
              Finalizar Contrato
            </button>
             <button className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-50">
              <Edit size={18} />
            </button>
          </div>
        </div>

        {/* Dashboard Tabs Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content Area (Left) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                 <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Saldo Total Pendiente</div>
                 <div className="text-2xl font-bold text-gray-900 mt-1">${balance.toLocaleString()}</div>
              </div>
               <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
                 <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Deuda Vencida</div>
                 <div className="text-2xl font-bold text-red-600 mt-1 flex items-center">
                    ${overdueTotal.toLocaleString()}
                    {overdueTotal > 0 && <AlertTriangle size={16} className="ml-2" />}
                 </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Estado de Cuenta (Movimientos)</h3>
                <div className="flex space-x-2">
                  <select className="text-sm border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <option>2023</option>
                    <option>2022</option>
                  </select>
                  <button className="text-gray-400 hover:text-blue-600">
                    <Download size={18} />
                  </button>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white sticky top-0 shadow-sm z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clientCXC.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.concept}</div>
                          {item.concept.includes("Luz") && <span className="text-xs text-yellow-600 flex items-center"><Zap size={10} className="mr-1"/>Variable</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.dueDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{item.amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={item.status} /></td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                           <div className="hidden group-hover:flex justify-end space-x-2">
                             <button className="text-blue-600 hover:text-blue-900" title="Registrar Pago"><DollarSign size={16}/></button>
                             <button className="text-gray-400 hover:text-gray-600" title="Editar Monto"><Edit size={16}/></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                     {clientCXC.length === 0 && (
                      <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">No hay movimientos registrados este año.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar Area (Right) */}
          <div className="space-y-6">
             {/* General Info Card */}
             <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Datos Generales</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-gray-500">Dirección Fiscal</dt>
                  <dd className="text-sm text-gray-900 mt-1">{client.address || "No registrada"}</dd>
                </div>
                 <div>
                  <dt className="text-xs text-gray-500">Contacto Principal</dt>
                  <dd className="text-sm text-gray-900 mt-1">{client.contact}</dd>
                </div>
                 <div>
                  <dt className="text-xs text-gray-500">Teléfono</dt>
                  <dd className="text-sm text-gray-900 mt-1">55-1234-5678</dd>
                </div>
              </dl>
             </div>

             {/* NEW: Portal Access Card */}
             <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Usuarios del Portal</h3>
                  <button className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center">
                    <UserPlus size={14} className="mr-1"/> Agregar
                  </button>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="bg-blue-100 rounded-full p-1 mr-2">
                        <Users size={12} className="text-blue-600"/>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Admin Principal</p>
                        <p className="text-xs text-gray-500">{client.email}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Activo
                    </span>
                  </li>
                  <li className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="bg-gray-100 rounded-full p-1 mr-2">
                        <Users size={12} className="text-gray-600"/>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Contabilidad</p>
                        <p className="text-xs text-gray-500">facturas@{client.email.split('@')[1]}</p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </li>
                </ul>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <button className="w-full text-center text-xs text-blue-600 hover:underline flex justify-center items-center">
                    <Key size={12} className="mr-1"/> Restablecer contraseñas
                  </button>
                </div>
             </div>

             {/* Actions Card */}
             <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  <Mail size={16} className="mr-2 text-gray-400" /> Enviar Estado de Cuenta
                </button>
                 <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
                  <AlertTriangle size={16} className="mr-2" /> Reportar Incidencia
                </button>
              </div>
             </div>
          </div>

        </div>
      </div>
    );
};

export const MarketTecView = ({ user }) => {
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
          <p className="text-sm text-gray-500">Unidad: {UNITS[user.unitId]}</p>
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
                            <CheckCircle size={14} className="mr-1"/> Procesado
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

export const OverdueView = ({ filteredCXC, selectedOverdue, toggleOverdueSelection, user }) => {
    const overdueItems = filteredCXC.filter(i => i.status === 'Overdue');
    const totalOverdue = overdueItems.reduce((acc, curr) => acc + parseFloat(curr.amount.replace(/[^0-9.-]+/g,"")), 0);

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Cuentas Vencidas</h2>
            <p className="text-sm text-gray-500">Unidad: {UNITS[user.unitId]}</p>
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
              <p className="text-2xl font-bold text-gray-800">{overdueItems.length}</p>
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
                        if(e.target.checked) {
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
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
                          <Calendar size={14} className="mr-1 text-gray-400"/>
                          {item.dueDate}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <OverdueBadge days={item.daysOverdue} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{item.amount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 text-xs font-semibold">Enviar Email</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                      <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2"/>
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

export const RemindersView = ({ filteredUpcoming, selectedReminders, toggleReminderSelection, user }) => {
    const pendingReminders = filteredUpcoming.filter(i => !i.sent);

    return (
      <div className="space-y-6 animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Recordatorios de Pago</h2>
            <p className="text-sm text-gray-500">Unidad: {UNITS[user.unitId]}</p>
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
                        if(e.target.checked) {
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
                          {item.concepts.map((c, idx) => (
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
                      <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2"/>
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
}

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
                        {staff.name.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                        <div className="text-xs text-gray-500">{staff.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Shield size={14} className="mr-1 text-blue-500"/>
                      {staff.role}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {staff.unitId ? UNITS[staff.unitId] : <span className="text-gray-400 italic">Acceso Global</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${staff.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {staff.status === 'Active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-4">Editar</button>
                    <button className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
);