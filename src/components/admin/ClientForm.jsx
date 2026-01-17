import React, { useState, useEffect } from 'react';
import { Save, X, Loader } from 'lucide-react';

const ClientForm = ({ clientToEdit, onSave, onClose, unitId }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        business_name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        rfc: '',
        User_market_tec: '',
        status: 'Activo',
        unit_id: unitId
    });

    useEffect(() => {
        if (clientToEdit) {
            setFormData({
                business_name: clientToEdit.name || clientToEdit.business_name || '',
                contact_name: clientToEdit.contact || clientToEdit.contact_name || '',
                contact_email: clientToEdit.email || clientToEdit.contact_email || '',
                contact_phone: clientToEdit.contactPhone || clientToEdit.contact_phone || '',
                rfc: clientToEdit.rfc || '',
                User_market_tec: clientToEdit.user_market_tec || clientToEdit.User_market_tec || '',
                status: clientToEdit.status || 'Activo',
                unit_id: clientToEdit.unit_id || unitId
            });
        }
    }, [clientToEdit, unitId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error saving client:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial</label>
                    <input
                        type="text"
                        name="business_name"
                        value={formData.business_name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej. Empresa SA de CV"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contacto Principal</label>
                    <input
                        type="text"
                        name="contact_name"
                        value={formData.contact_name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nombre de la persona"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <textarea
                        name="contact_email"
                        value={formData.contact_email}
                        onChange={handleChange}
                        required
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="correo@ejemplo.com, otro@ejemplo.com"
                    />
                    <p className="mt-1 text-xs text-gray-500">Separar múltiples correos con comas</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                        type="text"
                        name="contact_phone"
                        value={formData.contact_phone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="444 000 0000"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RFC</label>
                    <input
                        type="text"
                        name="rfc"
                        value={formData.rfc}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ABC000000XYZ"
                    />
                </div>

                <div className="md:col-span-2 grid grid-cols-4 gap-4">
                    <div className="col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Usuario Market Tec</label>
                        <input
                            type="text"
                            name="User_market_tec"
                            value={formData.User_market_tec}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Nombre de usuario"
                        />
                    </div>

                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="pt-4 flex justify-end space-x-3 border-t">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
                >
                    <X size={16} className="mr-2" /> Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-700 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <Loader size={16} className="animate-spin mr-2" />
                    ) : (
                        <Save size={16} className="mr-2" />
                    )}
                    {clientToEdit ? 'Guardar Cambios' : 'Crear Cliente'}
                </button>
            </div>
        </form>
    );
};

export default ClientForm;
