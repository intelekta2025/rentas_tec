import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

export const AddReceivableModal = ({ onClose, onSave, client, user }) => {
    const [formData, setFormData] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        concept: '',
        amount: '',
        dueDate: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const months = [
        { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
        { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
        { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
        { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
    ];

    useEffect(() => {
        if (formData.month && formData.year) {
            const d = new Date(formData.year, formData.month - 1, 10);
            const localDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
            setFormData(prev => ({
                ...prev,
                dueDate: localDate.toISOString().split('T')[0]
            }));
        }
    }, [formData.month, formData.year]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!formData.amount || parseFloat(formData.amount) <= 0) throw new Error('El monto debe ser mayor a 0');
            if (!formData.concept) throw new Error('El concepto es obligatorio');
            if (!formData.dueDate) throw new Error('La fecha de vencimiento es obligatoria');

            const receivableData = {
                month: months.find(m => m.value == formData.month)?.label || '',
                year: parseInt(formData.year),
                concept: formData.concept.toUpperCase(),
                amount: parseFloat(formData.amount),
                dueDate: formData.dueDate,
                clientId: client.id,
                unitId: user?.unitId,
                status: 'Pending',
                type: 'Manual'
            };

            await onSave(receivableData);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full m-auto flex-col flex animate-fade-in">
                <div className="flex justify-between items-center p-5 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800">Crear Movimiento Manual</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
                            <select
                                name="month"
                                value={formData.month}
                                onChange={handleChange}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                {months.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                            <input
                                type="number"
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                        <input
                            type="text"
                            name="concept"
                            value={formData.concept}
                            onChange={handleChange}
                            placeholder="Ej. RENTA EXTRA, MANTENIMIENTO, ETC."
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 uppercase"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                                placeholder="0.00"
                                step="0.01"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento</label>
                        <input
                            type="date"
                            name="dueDate"
                            value={formData.dueDate}
                            onChange={handleChange}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Guardando...' : 'Crear Movimiento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
