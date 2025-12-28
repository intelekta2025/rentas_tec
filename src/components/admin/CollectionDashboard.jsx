import React, { useState, useMemo } from 'react';
import {
    ChevronDown,
    ChevronRight,
    Mail,
    Search,
    Filter,
    MoreVertical,
    CheckSquare,
    Square,
    AlertCircle,
    ArrowUpRight,
    Send,
    MessageCircle
} from 'lucide-react';

import { getCollectionStats } from '../../services/clientService';
import { useAuth } from '../../hooks/useAuth';

export default function CollectionDashboard({ onClientClick }) {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [selectedClients, setSelectedClients] = useState(new Set());
    const [showModal, setShowModal] = useState(false);

    React.useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);
            const { data, error } = await getCollectionStats(user.unitId);
            if (!error && data) {
                setClients(data);
                // Expand first row if data exists
                if (data.length > 0) {
                    setExpandedRows(new Set([data[0].id]));
                }
            }
            setLoading(false);
        };

        fetchData();
    }, [user]);

    // --- Helpers ---
    const toggleRow = (id) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const toggleSelection = (id) => {
        const newSelected = new Set(selectedClients);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedClients(newSelected);
    };

    const toggleAll = () => {
        if (selectedClients.size === clients.length) {
            setSelectedClients(new Set());
        } else {
            setSelectedClients(new Set(clients.map(c => c.id)));
        }
    };

    // --- Calculations ---
    const totalDebt = useMemo(() => {
        return clients.reduce((acc, client) => {
            return acc + client.invoices.reduce((sum, inv) => sum + inv.amount, 0);
        }, 0);
    }, [clients]);

    const clientDebt = (client) => client.invoices.reduce((sum, inv) => sum + inv.amount, 0);

    const getBadges = (client) => {
        const maxDays = Math.max(...client.invoices.map(i => i.daysOverdue));
        if (maxDays > 45) return <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full border border-red-200">Crítico ({maxDays} días)</span>;
        if (maxDays > 15) return <span className="px-2 py-1 text-xs font-semibold text-orange-700 bg-orange-100 rounded-full border border-orange-200">Vencido ({maxDays} días)</span>;
        return <span className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full border border-blue-200">Reciente</span>;
    };


    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">

            <main className="p-6 max-w-7xl mx-auto">
                {/* Loading State */}
                {loading ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <p className="text-slate-600 font-medium">Cargando datos...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* --- KPIs --- */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <p className="text-sm text-slate-500 font-medium mb-1">Total Vencido</p>
                                <h2 className="text-3xl font-bold text-slate-900">${totalDebt.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h2>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <p className="text-sm text-slate-500 font-medium mb-1">Clientes con Adeudos</p>
                                <h2 className="text-3xl font-bold text-slate-900">{clients.length}</h2>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center items-start">
                                <button className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
                                    <Mail className="w-4 h-4" />
                                    Configurar Plantillas
                                </button>
                            </div>
                        </div>

                        {/* --- Toolbar --- */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                    <Filter className="w-4 h-4" /> Filtros
                                </button>
                                <span className="text-sm text-slate-500 ml-2">Mostrando {clients.length} clientes con deuda</span>
                            </div>

                            {/* Bulk Action Indicator */}
                            {selectedClients.size > 0 && (
                                <div className="flex items-center gap-4 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                                    <span className="text-sm font-medium text-indigo-900">{selectedClients.size} clientes seleccionados</span>
                                    <button
                                        onClick={() => setShowModal(true)}
                                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm flex items-center gap-2 transition-all"
                                    >
                                        <Send className="w-3 h-3" />
                                        Enviar Recordatorios
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* --- Main Table (Client Centric) --- */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                                            <th className="p-4 w-12 text-center">
                                                <button onClick={toggleAll} className="focus:outline-none">
                                                    {selectedClients.size === clients.length && clients.length > 0 ? (
                                                        <CheckSquare className="w-5 h-5 text-indigo-600" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                                                    )}
                                                </button>
                                            </th>
                                            <th className="p-4">Cliente / Razón Social</th>
                                            <th className="p-4 text-right">Deuda Total</th>
                                            <th className="p-4 text-center">CXC</th>
                                            <th className="p-4">Antigüedad</th>
                                            <th className="p-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {clients.map((client) => {
                                            const isExpanded = expandedRows.has(client.id);
                                            const isSelected = selectedClients.has(client.id);
                                            const total = clientDebt(client);

                                            return (
                                                <React.Fragment key={client.id}>
                                                    {/* Parent Row (Client) */}
                                                    <tr className={`hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50' : ''} ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                                                        <td className="p-4 text-center">
                                                            <button onClick={() => toggleSelection(client.id)} className="focus:outline-none">
                                                                {isSelected ? (
                                                                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                                                                ) : (
                                                                    <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                                                                )}
                                                            </button>
                                                        </td>
                                                        <td className="p-4">
                                                            <div
                                                                className="flex items-center gap-3 cursor-pointer select-none"
                                                                onClick={() => toggleRow(client.id)}
                                                            >
                                                                <div className={`p-1 rounded-md transition-transform duration-200 ${isExpanded ? 'rotate-90 bg-slate-200' : 'text-slate-400'}`}>
                                                                    <ChevronRight className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-slate-900">{client.clientName}</div>
                                                                    <div className="text-xs text-slate-500">{client.contactEmail}</div>
                                                                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                                        {client.contactPhone}
                                                                    </div>
                                                                    {client.marketTecReceiver && (
                                                                        <div className="text-xs text-slate-400 mt-0.5">
                                                                            Market Tec: {client.marketTecReceiver}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right font-bold text-slate-800">
                                                            ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <span className="bg-slate-100 text-slate-600 py-1 px-2.5 rounded-full text-xs font-bold">
                                                                {client.invoices.length}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            {getBadges(client)}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Enviar Correo">
                                                                    <Mail className="w-4 h-4" />
                                                                </button>
                                                                <button className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Contactar por WhatsApp">
                                                                    <MessageCircle className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {/* Child Row (Invoices Detail) - Accordion Body */}
                                                    {isExpanded && (
                                                        <tr className="bg-slate-50/50 shadow-inner">
                                                            <td colSpan="6" className="p-0">
                                                                <div className="py-4 pl-16 pr-8 border-l-4 border-indigo-500 ml-0 animate-in slide-in-from-top-2 fade-in duration-200">
                                                                    <table className="w-full text-sm">
                                                                        <thead>
                                                                            <tr className="text-slate-400 border-b border-slate-200/60">
                                                                                <th className="pb-2 font-medium text-left">Concepto</th>
                                                                                <th className="pb-2 font-medium text-left">Fecha Emisión</th>
                                                                                <th className="pb-2 font-medium text-center">Días Vencido</th>
                                                                                <th className="pb-2 font-medium text-center">Estado</th>
                                                                                <th className="pb-2 font-medium text-right">Monto</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-200/60">
                                                                            {client.invoices.map(inv => (
                                                                                <tr key={inv.id} className="text-slate-600">
                                                                                    <td className="py-3">{inv.concept}</td>
                                                                                    <td className="py-3">{inv.date}</td>
                                                                                    <td className="py-3 text-center text-red-600 font-medium">{inv.daysOverdue} días</td>
                                                                                    <td className="py-3 text-center">
                                                                                        {inv.daysOverdue > 30 ? (
                                                                                            <span className="flex items-center justify-center gap-1 text-red-600 text-xs">
                                                                                                <AlertCircle className="w-3 h-3" /> Crítico
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="flex items-center justify-center gap-1 text-orange-600 text-xs font-medium">
                                                                                                Vencido
                                                                                            </span>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="py-3 text-right font-medium">${inv.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                    <div className="mt-3 flex justify-end gap-3">
                                                                        <button
                                                                            onClick={() => onClientClick && onClientClick(client.originalId)}
                                                                            className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                                                                        >
                                                                            Ir al estado de cuenta <ArrowUpRight className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* --- Bulk Action Modal Mockup --- */}
                        {showModal && (
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
                                    <div className="p-6 border-b border-slate-100">
                                        <h3 className="text-lg font-bold text-slate-900">Confirmar Envío Masivo</h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Estás a punto de enviar recordatorios a <strong>{selectedClients.size} clientes</strong>.
                                        </p>
                                    </div>
                                    <div className="p-6 bg-slate-50 space-y-4">
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 flex gap-2">
                                            <AlertCircle className="w-5 h-5 shrink-0" />
                                            <p>El sistema agrupará todas las facturas vencidas de cada cliente en un solo correo electrónico para evitar saturación.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-500 uppercase">Resumen del envío</label>
                                            <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-40 overflow-y-auto">
                                                {clients.filter(c => selectedClients.has(c.id)).map(c => (
                                                    <div key={c.id} className="p-3 flex justify-between items-center text-sm">
                                                        <span className="truncate max-w-[200px] font-medium text-slate-700">{c.clientName}</span>
                                                        <span className="text-slate-500">{c.invoices.length} facturas</span>
                                                    </div>
                                                ))}
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
                                            onClick={() => {
                                                alert("Correos enviados al backend");
                                                setShowModal(false);
                                                setSelectedClients(new Set());
                                            }}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                                        >
                                            <Send className="w-4 h-4" />
                                            Enviar {selectedClients.size} Correos
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
