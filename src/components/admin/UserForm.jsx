// src/components/admin/UserForm.jsx
// Formulario para crear y editar usuarios del sistema

import { useState, useEffect } from 'react';
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { getBusinessUnits } from '../../services/businessUnitService';
import { signUpSystemUser, updateSystemUser } from '../../services/userService';

const ROLES = [
    { value: 'Administrador', label: 'Administrador' },
    { value: 'Gerente', label: 'Gerente' },
    { value: 'Asistente', label: 'Asistente' },
    { value: 'Auditor', label: 'Auditor' }
];

export const UserForm = ({ userToEdit, onSuccess, onClose }) => {
    const isEditMode = !!userToEdit;

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'Administrador',
        unitId: '',
        status: 'Active'
    });

    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingUnits, setLoadingUnits] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Cargar unidades de negocio al montar
    useEffect(() => {
        const fetchUnits = async () => {
            setLoadingUnits(true);
            const { data, error } = await getBusinessUnits();
            if (!error && data) {
                setUnits(data);
                // Solo seleccionar primera unidad si es modo creación y no hay unidad seleccionada
                if (!isEditMode && data.length > 0 && !formData.unitId) {
                    setFormData(prev => ({ ...prev, unitId: data[0].id }));
                }
            }
            setLoadingUnits(false);
        };
        fetchUnits();
    }, []);

    // Cargar datos del usuario a editar
    useEffect(() => {
        if (userToEdit) {
            setFormData({
                fullName: userToEdit.name || '',
                email: userToEdit.email || '',
                password: '',
                confirmPassword: '',
                role: userToEdit.role || 'Administrador',
                unitId: userToEdit.unitId || '',
                status: userToEdit.status || 'Active'
            });
        }
    }, [userToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const validate = () => {
        if (!formData.fullName.trim()) {
            setError('El nombre completo es requerido');
            return false;
        }
        if (!formData.email.trim()) {
            setError('El correo electrónico es requerido');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('El formato del correo electrónico no es válido');
            return false;
        }
        // Contraseña solo requerida en modo creación
        if (!isEditMode) {
            if (!formData.password) {
                setError('La contraseña es requerida');
                return false;
            }
            if (formData.password.length < 6) {
                setError('La contraseña debe tener al menos 6 caracteres');
                return false;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Las contraseñas no coinciden');
                return false;
            }
        }
        if (!formData.unitId) {
            setError('Debes seleccionar una unidad de negocio');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!validate()) return;

        setLoading(true);

        try {
            if (isEditMode) {
                // Modo edición - actualizar usuario existente
                const { data, error: updateError } = await updateSystemUser(userToEdit.id, {
                    name: formData.fullName,
                    role: formData.role,
                    unitId: parseInt(formData.unitId),
                    status: formData.status
                });

                if (updateError) {
                    setError(updateError.message || 'Error al actualizar el usuario');
                    setLoading(false);
                    return;
                }

                setSuccess(true);
                setTimeout(() => {
                    if (onSuccess) onSuccess(data);
                    if (onClose) onClose();
                }, 1500);
            } else {
                // Modo creación - crear nuevo usuario
                const { data, error: signUpError } = await signUpSystemUser({
                    email: formData.email,
                    password: formData.password,
                    fullName: formData.fullName,
                    role: formData.role,
                    unitId: parseInt(formData.unitId)
                });

                if (signUpError) {
                    if (signUpError.message?.includes('already registered')) {
                        setError('Este correo electrónico ya está registrado');
                    } else if (signUpError.message?.includes('password')) {
                        setError('La contraseña no cumple con los requisitos de seguridad');
                    } else {
                        setError(signUpError.message || 'Error al crear el usuario');
                    }
                    setLoading(false);
                    return;
                }

                setSuccess(true);
                setTimeout(() => {
                    if (onSuccess) onSuccess(data);
                    if (onClose) onClose();
                }, 1500);
            }
        } catch (err) {
            setError(err.message || 'Error inesperado');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {isEditMode ? '¡Usuario actualizado!' : '¡Usuario creado exitosamente!'}
                </h3>
                <p className="text-sm text-gray-500">
                    {isEditMode
                        ? `Los cambios para ${formData.fullName} se guardaron correctamente.`
                        : `El usuario ${formData.email} ya puede iniciar sesión.`
                    }
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-1">
            {/* Mensaje de error */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Nombre Completo */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo *
                </label>
                <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Ej: Juan Pérez García"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    disabled={loading}
                />
            </div>

            {/* Email - solo editable en modo creación */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico *
                </label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="usuario@empresa.com"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    disabled={loading || isEditMode}
                />
                {isEditMode && (
                    <p className="text-xs text-gray-500 mt-1">El correo no puede modificarse</p>
                )}
            </div>

            {/* Password - solo en modo creación */}
            {!isEditMode && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña *
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Mínimo 6 caracteres"
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmar Contraseña *
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Repetir contraseña"
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rol y Unidad */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rol *
                    </label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                        disabled={loading}
                    >
                        {ROLES.map(role => (
                            <option key={role.value} value={role.value}>
                                {role.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unidad de Negocio *
                    </label>
                    {loadingUnits ? (
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                            <Loader2 size={18} className="animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <select
                            name="unitId"
                            value={formData.unitId}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                            disabled={loading}
                        >
                            {units.length === 0 && (
                                <option value="">No hay unidades disponibles</option>
                            )}
                            {units.map(unit => (
                                <option key={unit.id} value={unit.id}>
                                    {unit.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Estado - solo en modo edición */}
            {isEditMode && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                    </label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                        disabled={loading}
                    >
                        <option value="Active">Activo</option>
                        <option value="Inactive">Inactivo</option>
                    </select>
                </div>
            )}

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                    disabled={loading}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || loadingUnits}
                >
                    {loading && <Loader2 size={18} className="animate-spin" />}
                    {loading
                        ? (isEditMode ? 'Guardando...' : 'Creando...')
                        : (isEditMode ? 'Guardar Cambios' : 'Crear Usuario')
                    }
                </button>
            </div>
        </form>
    );
};

export default UserForm;
