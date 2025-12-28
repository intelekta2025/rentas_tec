import React, { useState, useEffect } from 'react';
import { Mail, Save, Eye, ArrowLeft, Send, CheckCircle, AlertCircle, Variable, FileText, Code } from 'lucide-react';
import { getTemplates, createTemplate, updateTemplate } from '../../services/templateService';
import { useAuth } from '../../hooks/useAuth';

const EmailTemplateConfig = ({ onBack }) => {
    const { user } = useAuth();
    const [activeStep, setActiveStep] = useState('list'); // list, edit, preview
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [editForm, setEditForm] = useState(null);
    const [activeField, setActiveField] = useState('body'); // 'subject' or 'body'

    // Variables disponibles para usar en plantillas
    const dbVariables = [
        { category: 'Cliente', vars: ['{{client.contact_name}}', '{{client.business_name}}', '{{client.contact_email}}'] },
        { category: 'Cuenta por Cobrar', vars: ['{{receivables.concept}}', '{{receivables.due_date}}', '{{receivables.balance}}', '{{receivables.type}}'] },
        { category: 'Unidad de Negocio', vars: ['{{business_units.name}}'] }
    ];

    // Cargar plantillas
    useEffect(() => {
        if (user?.unitId) {
            loadTemplates();
        }
    }, [user?.unitId]);

    const loadTemplates = async () => {
        setLoading(true);
        const { data, error } = await getTemplates(user.unitId);
        if (data) {
            // Mapear campos de DB a estructura local si es necesario, o usar los de DB
            // DB: name, code, subject_template, body_template
            // Local: name, type(code), subject, body
            const formatted = data.map(t => ({
                id: t.id,
                name: t.name,
                type: t.code,
                subject: t.subject_template,
                body: t.body_template,
                lastUpdated: new Date(t.updated_at).toLocaleDateString(),
                ...t
            }));
            setTemplates(formatted);
        }
        setLoading(false);
    };

    const handleCreate = () => {
        setEditForm({
            id: null,
            name: '',
            type: '', // code
            subject: '',
            body: '',
        });
        setActiveStep('edit');
    };

    const handleEdit = (template) => {
        setEditForm({ ...template });
        setActiveStep('edit');
    };

    const handleSave = async () => {
        if (!editForm.name || !editForm.subject) {
            alert('Por favor completa los campos requeridos (Nombre, Asunto)');
            return;
        }

        const generatedCode = editForm.type || editForm.name.toLowerCase().replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        setLoading(true);
        const payload = {
            unit_id: user.unitId,
            name: editForm.name,
            code: generatedCode,
            subject_template: editForm.subject,
            body_template: editForm.body,
            updated_at: new Date().toISOString()
        };

        let result;
        if (editForm.id) {
            result = await updateTemplate(editForm.id, payload);
        } else {
            result = await createTemplate(payload);
        }

        if (result.error) {
            alert('Error al guardar: ' + result.error.message);
        } else {
            await loadTemplates();
            setActiveStep('list');
        }
        setLoading(false);
    };

    const insertVariable = (variable) => {
        if (activeField === 'body') {
            const textarea = document.getElementById('body-editor');
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = editForm.body;
                const newText = text.substring(0, start) + variable + text.substring(end);
                setEditForm({ ...editForm, body: newText });

                // Restore focus and cursor in next cycle (simplified)
                setTimeout(() => {
                    textarea.focus();
                    textarea.setSelectionRange(start + variable.length, start + variable.length);
                }, 0);
            }
        } else if (activeField === 'subject') {
            const input = document.getElementById('subject-editor');
            if (input) {
                const start = input.selectionStart;
                const end = input.selectionEnd;
                const text = editForm.subject;
                const newText = text.substring(0, start) + variable + text.substring(end);
                setEditForm({ ...editForm, subject: newText });

                setTimeout(() => {
                    input.focus();
                    input.setSelectionRange(start + variable.length, start + variable.length);
                }, 0);
            }
        }
    };

    // Pantalla 1: Lista de Plantillas
    const TemplateList = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">

                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Plantillas de Notificación</h2>
                        <p className="text-slate-500">Administra los correos automáticos que envía el sistema.</p>
                    </div>
                </div>
                <button onClick={handleCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm">
                    <FileText size={18} /> Nueva Plantilla
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(template => (
                    <div key={template.id} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition cursor-pointer group" onClick={() => handleEdit(template)}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-100 transition">
                                <Mail size={24} />
                            </div>
                            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{template.type}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-1">{template.name}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-4">{template.subject}</p>
                        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                            <span className="text-xs text-slate-400">Actualizado: {template.lastUpdated}</span>
                            <span className="text-sm text-indigo-600 font-medium hover:underline">Editar Configuración &rarr;</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // Pantalla 2: Editor de Plantilla
    const TemplateEditor = () => (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <button onClick={() => setActiveStep('list')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {editForm.id ? 'Editar Plantilla' : 'Nueva Plantilla'}
                        </h2>
                        <p className="text-sm text-slate-500">{editForm.name}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setActiveStep('preview')} className="text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-100 border border-slate-300 transition flex items-center gap-2">
                        <Eye size={18} /> Previsualizar
                    </button>
                    <button onClick={handleSave} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm">
                        <Save size={18} /> Guardar Cambios
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full">

                {/* Main Editor */}
                <div className="flex-1 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Plantilla</label>
                        <input
                            type="text"
                            placeholder="Ej. Recordatorio de Pago"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Asunto del Correo</label>
                        <input
                            id="subject-editor"
                            type="text"
                            value={editForm.subject}
                            onFocus={() => setActiveField('subject')}
                            onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                            className={`w-full border rounded-lg p-3 transition ${activeField === 'subject' ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-300'}`}
                        />
                    </div>

                    <div className="flex-1 flex flex-col">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cuerpo del Mensaje (HTML/Texto)</label>
                        <div className={`relative flex-1 rounded-lg border transition ${activeField === 'body' ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                            <textarea
                                id="body-editor"
                                value={editForm.body}
                                onFocus={() => setActiveField('body')}
                                onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                                className="w-full h-96 rounded-lg p-4 font-mono text-sm leading-relaxed focus:outline-none bg-transparent resize-none"
                            />
                            <div className="absolute bottom-4 right-4 text-xs text-slate-400 bg-white/80 px-2 py-1 rounded">
                                Soporta Markdown básico
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Variables */}
                <div className="w-full lg:w-80 bg-slate-50 rounded-xl p-5 border border-slate-200 h-fit">
                    <div className="flex items-center gap-2 mb-4 text-slate-800">
                        <Variable size={18} className="text-indigo-600" />
                        <h3 className="font-semibold">Variables Disponibles</h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">Haz clic para insertar datos dinámicos de la base de datos.</p>

                    <div className="space-y-4">
                        {dbVariables.map((group, idx) => (
                            <div key={idx}>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{group.category}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {group.vars.map(variable => (
                                        <button
                                            key={variable}
                                            onClick={() => insertVariable(variable)}
                                            className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-1.5 rounded hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm transition font-mono"
                                        >
                                            {variable}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200">
                        <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3">
                            <AlertCircle size={16} className="text-blue-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-700">
                                Estas variables se llenarán automáticamente con la información de la tabla <strong>payment_applications</strong> y sus relaciones.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Pantalla 3: Previsualización
    const TemplatePreview = () => {
        // Simulamos el renderizado reemplazando variables
        const renderText = (text) => {
            return text
                .replace('{{client.contact_name}}', 'Juan Pérez')
                .replace('{{client.business_name}}', 'Empresa Ejemplo S.A. de C.V.')
                .replace('{{payment.reference}}', 'REF-9988')
                .replace('{{application.amount_applied}}', '1,500.00')
                .replace('{{payment.date}}', '27/10/2023')
                .replace('{{receivable.concept}}', 'Factura F-2023-001')
                .replace('{{receivable.balance}}', '0.00')
                .replace('{{unit.name}}', 'Unidad Central de Finanzas');
        };

        return (
            <div className="h-full flex flex-col animate-fade-in max-w-3xl mx-auto w-full">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => setActiveStep('edit')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition font-medium">
                        <ArrowLeft size={18} /> Volver al Editor
                    </button>
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                        <CheckCircle size={14} /> Vista Previa con Datos Dummy
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
                    {/* Fake Email Header */}
                    <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-2">
                        <div className="flex gap-2 text-sm">
                            <span className="text-slate-400 w-16 text-right">De:</span>
                            <span className="text-slate-800 font-medium">notificaciones@tuempresa.com</span>
                        </div>
                        <div className="flex gap-2 text-sm">
                            <span className="text-slate-400 w-16 text-right">Para:</span>
                            <span className="text-slate-800">contacto@cliente-ejemplo.com</span>
                        </div>
                        <div className="flex gap-2 text-sm">
                            <span className="text-slate-400 w-16 text-right">Asunto:</span>
                            <span className="text-slate-900 font-semibold">{renderText(editForm.subject)}</span>
                        </div>
                    </div>

                    {/* Email Body */}
                    <div className="p-8 min-h-[400px] whitespace-pre-wrap text-slate-700 leading-relaxed font-sans">
                        {renderText(editForm.body)}
                    </div>

                    {/* Email Footer Simulation */}
                    <div className="bg-slate-50 p-4 text-center text-xs text-slate-400 border-t border-slate-100">
                        Este correo fue generado automáticamente por el Sistema de Cobranza.
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
            <div className="max-w-6xl mx-auto h-[85vh]">
                {activeStep === 'list' && <TemplateList />}
                {activeStep === 'edit' && <TemplateEditor />}
                {activeStep === 'preview' && <TemplatePreview />}
            </div>
        </div>
    );
};

export default EmailTemplateConfig;
