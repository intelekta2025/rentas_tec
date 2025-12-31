import React, { useState, useMemo } from 'react';
import {
    ChevronDown,
    ChevronRight,
    Filter,
    ArrowUpRight,
    ArrowLeft,
    Calendar,
    X
} from 'lucide-react';

import { getNextMonthReceivables } from '../../services/clientService';
import { useAuth } from '../../hooks/useAuth';

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Filter options
const TIPO_OPTIONS = [
    { value: 'todos', label: 'Todos' },
    { value: 'rent', label: 'Renta' },
    { value: 'service', label: 'Servicios' }
];

export default function NextMonthReceivablesDashboard({ onClientClick, onBack }) {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [nextMonth, setNextMonth] = useState(null);
    const [nextYear, setNextYear] = useState(null);

    // Filter state
    const [showFilters, setShowFilters] = useState(false);
    const [tipoFilter, setTipoFilter] = useState('todos');

    React.useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);
            const { data, error, nextMonth: nm, nextYear: ny } = await getNextMonthReceivables(user.unitId);
            if (!error && data) {
                setClients(data);
                setNextMonth(nm);
                setNextYear(ny);
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
            const filteredInvoices = client.invoices.filter(inv => {
                if (tipoFilter === 'todos') return true;
                if (tipoFilter === 'rent') return inv.type === 'Rent' || inv.type === 'Renta';
                if (tipoFilter === 'service') return inv.type !== 'Rent' && inv.type !== 'Renta';
                return true;
            });

            if (filteredInvoices.length === 0) return null;
            return { ...client, invoices: filteredInvoices };
        }).filter(c => c !== null);
    }, [clients, tipoFilter]);

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
        setTipoFilter('todos');
    };

    const hasActiveFilters = tipoFilter !== 'todos';

    // --- Calculations ---
    const totalProjected = useMemo(() => {
        return filteredClients.reduce((acc, client) => {
            return acc + client.invoices.reduce((sum, inv) => sum + inv.amount, 0);
        }, 0);
    }, [filteredClients]);

    const clientTotal = (client) => client.invoices.reduce((sum, inv) => sum + inv.amount, 0);

    const getTypeBadge = (type) => {
        if (type === 'Rent' || type === 'Renta') {
            return <span className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full border border-blue-200">Renta</span>;
        }
        return <span className="px-2 py-1 text-xs font-semibold text-amber-700 bg-amber-100 rounded-full border border-amber-200">Servicios</span>;
    };

    const monthLabel = nextMonth ? MONTH_NAMES[nextMonth - 1] : '';

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

            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Por Cobrar Siguiente Mes - {monthLabel} {nextYear}
            </h2>

            {/* Loading State */}
            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                        <p className="text-slate-600 font-medium">Cargando datos...</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* --- KPIs --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-sm text-slate-500 font-medium mb-1">Cobros Proyectados - {monthLabel}</p>
                            <h2 className="text-3xl font-bold text-green-600">${totalProjected.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h2>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-sm text-slate-500 font-medium mb-1">Clientes con Cobros Programados</p>
                            <h2 className="text-3xl font-bold text-slate-900">{filteredClients.length}</h2>
                        </div>
                    </div>

                    {/* --- Toolbar with Filters --- */}
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`px-4 py-2 border rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${showFilters || hasActiveFilters ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                                >
                                    <Filter className="w-4 h-4" /> Filtros
                                    {hasActiveFilters && (
                                        <span className="bg-green-600 text-white text-xs px-1.5 py-0.5 rounded-full">1</span>
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
                                    Mostrando {filteredClients.length} clientes con cobros para {monthLabel}
                                </span>
                            </div>
                        </div>

                        {/* Filter Panel */}
                        {showFilters && (
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 animate-in slide-in-from-top-2 duration-200">
                                {/* Tipo Filter */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Tipo</label>
                                    <div className="relative">
                                        <select
                                            value={tipoFilter}
                                            onChange={(e) => setTipoFilter(e.target.value)}
                                            className="appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-48 p-2.5 pr-8"
                                        >
                                            {TIPO_OPTIONS.map(opt => (
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
                                        <th className="p-4 text-right">Monto Proyectado</th>
                                        <th className="p-4 text-center">CXC</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredClients.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="p-8 text-center text-slate-500">
                                                No hay cobros programados para {monthLabel} {nextYear}
                                            </td>
                                        </tr>
                                    ) : filteredClients.map((client) => {
                                        const isExpanded = expandedRows.has(client.id);
                                        const total = clientTotal(client);

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
                                                    <td className="p-4 text-right font-bold text-green-600">
                                                        ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className="bg-slate-100 text-slate-600 py-1 px-2.5 rounded-full text-xs font-bold">
                                                            {client.invoices.length}
                                                        </span>
                                                    </td>
                                                </tr>

                                                {/* Child Row - Accordion */}
                                                {isExpanded && (
                                                    <tr className="bg-slate-50/50 shadow-inner">
                                                        <td colSpan="3" className="p-0">
                                                            <div className="py-4 pl-16 pr-8 border-l-4 border-green-500 ml-0 animate-in slide-in-from-top-2 fade-in duration-200">
                                                                <table className="w-full text-sm">
                                                                    <thead>
                                                                        <tr className="text-slate-400 border-b border-slate-200/60">
                                                                            <th className="pb-2 font-medium text-left">Concepto</th>
                                                                            <th className="pb-2 font-medium text-left">Fecha Vencimiento</th>
                                                                            <th className="pb-2 font-medium text-center">Tipo</th>
                                                                            <th className="pb-2 font-medium text-right">Monto</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-200/60">
                                                                        {client.invoices.map(inv => (
                                                                            <tr key={inv.id} className="text-slate-600">
                                                                                <td className="py-3">{inv.concept}</td>
                                                                                <td className="py-3">{inv.dueDate}</td>
                                                                                <td className="py-3 text-center">
                                                                                    {getTypeBadge(inv.type)}
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
