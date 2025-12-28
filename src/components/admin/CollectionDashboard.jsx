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
import { getTemplates } from '../../services/templateService';
import { useAuth } from '../../hooks/useAuth';


export default function CollectionDashboard({ onClientClick }) {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [selectedClients, setSelectedClients] = useState(new Set());
    const [showModal, setShowModal] = useState(false);

    // Template State
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('default'); // 'default' or template id
    const [loadingTemplates, setLoadingTemplates] = useState(false);

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

    // Fetch Templates
    React.useEffect(() => {
        const fetchTemplates = async () => {
            if (!user?.unitId) return;
            setLoadingTemplates(true);
            const { data } = await getTemplates(user.unitId);
            if (data) {
                setTemplates(data);
                // Set default if exists
                if (data.length > 0) setSelectedTemplate(data[0].id);
            }
            setLoadingTemplates(false);
        };
        fetchTemplates();
    }, [user?.unitId]);

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

                            {/* Template Selector */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
                                <label className="text-sm text-slate-500 font-medium mb-2 flex items-center gap-2">
                                    <Mail size={16} /> Plantilla de Email
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedTemplate}
                                        onChange={(e) => setSelectedTemplate(e.target.value)}
                                        className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 pr-8"
                                        disabled={loadingTemplates}
                                    >
                                        <option value="default" disabled>Seleccionar plantilla...</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">
                                    Se usará esta plantilla al enviar correos masivos.
                                </p>
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
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowModal(true)}
                                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm flex items-center gap-2 transition-all"
                                        >
                                            <Mail className="w-3 h-3" />
                                            Enviar Email
                                        </button>
                                        <button
                                            onClick={() => setShowModal(true)}
                                            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md shadow-sm flex items-center gap-2 transition-all"
                                        >
                                            <MessageCircle className="w-3 h-3" />
                                            Enviar WhatsApp
                                        </button>
                                    </div>
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
                                            onClick={async () => {
                                                try {
                                                    // Get the selected template details
                                                    const templateData = templates.find(t => t.id === selectedTemplate);
                                                    if (!templateData) {
                                                        alert("Por favor selecciona una plantilla válida.");
                                                        return;
                                                    }

                                                    // Helper function to replace variables in template
                                                    const processTemplate = (template, clientData, isBody = false) => {
                                                        if (!template) return '';
                                                        let processed = template;

                                                        // Client variables
                                                        processed = processed.replace(/\{\{client\.contact_name\}\}/g, clientData.contact || '');
                                                        processed = processed.replace(/\{\{client\.business_name\}\}/g, clientData.clientName || '');
                                                        processed = processed.replace(/\{\{client\.contact_email\}\}/g, clientData.email || '');

                                                        // Receivables summary (aggregate)
                                                        const totalBalance = clientData.invoices.reduce((sum, inv) => sum + inv.amount, 0);
                                                        const concepts = clientData.invoices.map(inv => inv.concept).join(', ');
                                                        const dueDates = clientData.invoices.map(inv => inv.dueDate).join(', ');
                                                        const types = [...new Set(clientData.invoices.map(inv => inv.type || 'N/A'))].join(', ');

                                                        processed = processed.replace(/\{\{receivables\.concept\}\}/g, concepts);
                                                        processed = processed.replace(/\{\{receivables\.due_date\}\}/g, dueDates);
                                                        processed = processed.replace(/\{\{receivables\.balance\}\}/g, `$${totalBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
                                                        processed = processed.replace(/\{\{receivables\.type\}\}/g, types);

                                                        // Business unit
                                                        processed = processed.replace(/\{\{business_units\.name\}\}/g, user?.unitName || '');

                                                        // Convert to HTML if it's the body
                                                        if (isBody) {
                                                            // Convert newlines to <br> tags
                                                            processed = processed.replace(/\n/g, '<br>');
                                                            // Wrap in basic HTML structure
                                                            processed = `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">${processed}</div>`;
                                                        }

                                                        return processed;
                                                    };

                                                    // Prepare data for webhook with processed templates
                                                    const selectedClientData = clients
                                                        .filter(c => selectedClients.has(c.id))
                                                        .map(c => {
                                                            const processedSubject = processTemplate(templateData.subject_template, c, false);
                                                            const processedBody = processTemplate(templateData.body_template, c, true);

                                                            return {
                                                                clientId: c.id,
                                                                clientName: c.clientName,
                                                                email: c.email,
                                                                contact: c.contact,
                                                                subject: processedSubject,
                                                                body: processedBody,
                                                                receivables: c.invoices.map(inv => ({
                                                                    concept: inv.concept,
                                                                    dueDate: inv.dueDate,
                                                                    amount: inv.amount,
                                                                    daysOverdue: inv.daysOverdue,
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
                                                        totalClients: selectedClients.size,
                                                        timestamp: new Date().toISOString()
                                                    };

                                                    // Call n8n webhook
                                                    const response = await fetch('https://n8n-t.intelekta.ai/webhook-test/c5be4efd-e1b3-40ca-b75e-ca681d345850', {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json'
                                                        },
                                                        body: JSON.stringify(webhookPayload)
                                                    });

                                                    if (response.ok) {
                                                        alert("Correos enviados exitosamente");
                                                    } else {
                                                        alert("Error al enviar correos. Intente de nuevo.");
                                                    }
                                                } catch (error) {
                                                    console.error('Error calling webhook:', error);
                                                    alert("Error al enviar correos. Intente de nuevo.");
                                                }

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
        </div >
    );
}
