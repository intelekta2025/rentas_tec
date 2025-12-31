import React, { useState, useMemo } from 'react';
import {
    ChevronDown,
    ChevronRight,
    Filter,
    ArrowUpRight,
    ArrowLeft,
    Clock,
    AlertCircle,
    X
} from 'lucide-react';

import { getPendingReceivablesStats } from '../../services/clientService';
import { useAuth } from '../../hooks/useAuth';

// Filter options
const ESTADO_OPTIONS = [
    { value: 'todos', label: 'Todos' },
    { value: 'al_dia', label: 'Al día' },
    { value: 'vencido', label: 'Vencido' },
    { value: 'critico', label: 'Crítico (>60 días)' }
];

const RANGO_OPTIONS = [
    { value: 'todos', label: 'Todos' },
    { value: 'al_dia', label: 'Al día' },
    { value: 'vencido_1_30', label: 'Vencido 1-30 días' },
    { value: 'vencido_31_60', label: 'Vencido 31-60 días' },
    { value: 'mayor_60', label: 'Mayor a 60 días' }
];

export default function PendingReceivablesDashboard({ onClientClick, onBack }) {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState(new Set());

    // Filter state
    const [showFilters, setShowFilters] = useState(false);
    const [estadoFilter, setEstadoFilter] = useState('todos');
    const [rangoFilter, setRangoFilter] = useState('todos');

    React.useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);
            const { data, error } = await getPendingReceivablesStats(user.unitId);
            if (!error && data) {
                setClients(data);
                if (data.length > 0) {
                    setExpandedRows(new Set([data[0].id]));
                }
            }
            setLoading(false);
        };
        fetchData();
    }, [user]);

    // --- Filtered Data ---
    const filteredClients = useMemo(() => {
        return clients.map(client => {
            // Filter invoices based on filters
            const filteredInvoices = client.invoices.filter(inv => {
                // Estado filter
                if (estadoFilter !== 'todos') {
                    if (estadoFilter === 'al_dia' && inv.isOverdue) return false;
                    if (estadoFilter === 'vencido' && !inv.isOverdue) return false;
                    if (estadoFilter === 'critico' && inv.daysOverdue <= 60) return false;
                }

                // Rango filter
                if (rangoFilter !== 'todos') {
                    if (rangoFilter === 'al_dia' && inv.isOverdue) return false;
                    if (rangoFilter === 'vencido_1_30' && (!inv.isOverdue || inv.daysOverdue > 30)) return false;
                    if (rangoFilter === 'vencido_31_60' && (!inv.isOverdue || inv.daysOverdue <= 30 || inv.daysOverdue > 60)) return false;
                    if (rangoFilter === 'mayor_60' && (!inv.isOverdue || inv.daysOverdue <= 60)) return false;
                }

                return true;
            });

            if (filteredInvoices.length === 0) return null;

            return { ...client, invoices: filteredInvoices };
        }).filter(c => c !== null);
    }, [clients, estadoFilter, rangoFilter]);

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

    const clearFilters = () => {
        setEstadoFilter('todos');
        setRangoFilter('todos');
    };

    const hasActiveFilters = estadoFilter !== 'todos' || rangoFilter !== 'todos';

    // --- Calculations ---
    const totalPending = useMemo(() => {
        return filteredClients.reduce((acc, client) => {
            return acc + client.invoices.reduce((sum, inv) => sum + inv.amount, 0);
        }, 0);
    }, [filteredClients]);

    const clientDebt = (client) => client.invoices.reduce((sum, inv) => sum + inv.amount, 0);

    const getBadges = (client) => {
        const hasOverdue = client.invoices.some(i => i.isOverdue);
        const maxDays = Math.max(...client.invoices.filter(i => i.isOverdue).map(i => i.daysOverdue), 0);

        if (maxDays > 60) return <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full border border-red-200">Crítico ({maxDays} días)</span>;
        if (maxDays > 30) return <span className="px-2 py-1 text-xs font-semibold text-orange-700 bg-orange-100 rounded-full border border-orange-200">Vencido ({maxDays} días)</span>;
        if (hasOverdue) return <span className="px-2 py-1 text-xs font-semibold text-amber-700 bg-amber-100 rounded-full border border-amber-200">Vencido ({maxDays} días)</span>;
        return <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full border border-green-200">Al día</span>;
    };

    const getStatusBadge = (inv) => {
        if (inv.daysOverdue > 60) {
            return (
                <span className="flex items-center justify-center gap-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" /> Crítico
                </span>
            );
        }
        if (inv.daysOverdue > 30) {
            return (
                <span className="flex items-center justify-center gap-1 text-orange-600 text-xs font-medium">
                    Vencido
                </span>
            );
        }
        if (inv.isOverdue) {
            return (
                <span className="flex items-center justify-center gap-1 text-amber-600 text-xs font-medium">
                    <Clock className="w-3 h-3" /> Vencido
                </span>
            );
        }
        return (
            <span className="flex items-center justify-center gap-1 text-green-600 text-xs font-medium">
                Al día
            </span>
        );
    };

    return (
        <>
            {/* Back Button */}
            <button
                onClick={onBack}
                className="mb-4 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Volver al Dashboard</span>
            </button>

            <h2 className="text-2xl font-bold text-slate-900 mb-6">Por Cobrar</h2>

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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-sm text-slate-500 font-medium mb-1">Total Por Cobrar</p>
                            <h2 className="text-3xl font-bold text-slate-900">${totalPending.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h2>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-sm text-slate-500 font-medium mb-1">Clientes con Saldo Pendiente</p>
                            <h2 className="text-3xl font-bold text-slate-900">{filteredClients.length}</h2>
                        </div>
                    </div>

                    {/* --- Toolbar with Filters --- */}
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`px-4 py-2 border rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${showFilters || hasActiveFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                                >
                                    <Filter className="w-4 h-4" /> Filtros
                                    {hasActiveFilters && (
                                        <span className="bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                                            {(estadoFilter !== 'todos' ? 1 : 0) + (rangoFilter !== 'todos' ? 1 : 0)}
                                        </span>
                                    )}
                                </button>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                                    >
                                        <X className="w-3 h-3" /> Limpiar
                                    </button>
                                )}
                                <span className="text-sm text-slate-500 ml-2">
                                    Mostrando {filteredClients.length} clientes con saldo pendiente
                                </span>
                            </div>
                        </div>

                        {/* Filter Panel */}
                        {showFilters && (
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 animate-in slide-in-from-top-2 duration-200">
                                {/* Estado Filter */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Estado</label>
                                    <div className="relative">
                                        <select
                                            value={estadoFilter}
                                            onChange={(e) => setEstadoFilter(e.target.value)}
                                            className="appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-48 p-2.5 pr-8"
                                        >
                                            {ESTADO_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                </div>

                                {/* Rango de Vencimiento Filter */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Rango de Vencimiento</label>
                                    <div className="relative">
                                        <select
                                            value={rangoFilter}
                                            onChange={(e) => setRangoFilter(e.target.value)}
                                            className="appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-48 p-2.5 pr-8"
                                        >
                                            {RANGO_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- Main Table --- */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                                        <th className="p-4">Cliente / Razón Social</th>
                                        <th className="p-4 text-right">Saldo Pendiente</th>
                                        <th className="p-4 text-center">CXC</th>
                                        <th className="p-4">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredClients.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-slate-500">
                                                No se encontraron clientes con los filtros seleccionados
                                            </td>
                                        </tr>
                                    ) : filteredClients.map((client) => {
                                        const isExpanded = expandedRows.has(client.id);
                                        const total = clientDebt(client);

                                        return (
                                            <React.Fragment key={client.id}>
                                                {/* Parent Row */}
                                                <tr className={`hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}>
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
                                                                {client.contactPhone && (
                                                                    <div className="text-xs text-slate-400 mt-0.5">{client.contactPhone}</div>
                                                                )}
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
                                                </tr>

                                                {/* Child Row - Accordion */}
                                                {isExpanded && (
                                                    <tr className="bg-slate-50/50 shadow-inner">
                                                        <td colSpan="4" className="p-0">
                                                            <div className="py-4 pl-16 pr-8 border-l-4 border-amber-500 ml-0 animate-in slide-in-from-top-2 fade-in duration-200">
                                                                <table className="w-full text-sm">
                                                                    <thead>
                                                                        <tr className="text-slate-400 border-b border-slate-200/60">
                                                                            <th className="pb-2 font-medium text-left">Concepto</th>
                                                                            <th className="pb-2 font-medium text-left">Fecha Vencimiento</th>
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
                                                                                <td className={`py-3 text-center font-medium ${inv.daysOverdue > 60 ? 'text-red-600' : inv.daysOverdue > 30 ? 'text-orange-600' : inv.isOverdue ? 'text-amber-600' : 'text-green-600'}`}>
                                                                                    {inv.isOverdue ? `${inv.daysOverdue} días` : 'Al día'}
                                                                                </td>
                                                                                <td className="py-3 text-center">
                                                                                    {getStatusBadge(inv)}
                                                                                </td>
                                                                                <td className="py-3 text-right font-medium">${inv.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                                <div className="mt-3 flex justify-end">
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
                </>
            )}
        </>
    );
}
