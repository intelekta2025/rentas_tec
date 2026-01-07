// src/services/userService.js
// Servicio para operaciones CRUD de usuarios del sistema

import { supabase } from '../lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Cliente Admin con service_role key para crear usuarios con auto-confirmación
// NOTA: La service_role key solo debe usarse en backend o con cuidado en admin panel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

let supabaseAdmin = null
if (supabaseUrl && serviceRoleKey) {
    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

/**
 * Registra un nuevo usuario del sistema en Supabase Auth con auto-confirmación
 * Usa la API de Admin para crear usuarios sin enviar correo de confirmación
 * @param {object} formData - Datos del formulario de usuario
 * @returns {Promise<{data: object, error: any}>}
 */
export const signUpSystemUser = async (formData) => {
    const { email, password, fullName, role, unitId } = formData;

    // Verificar que tenemos el cliente admin
    if (!supabaseAdmin) {
        console.error('No se puede crear usuario: falta VITE_SUPABASE_SERVICE_ROLE_KEY');
        return {
            data: null,
            error: { message: 'Configuración incompleta. Contacta al administrador.' }
        };
    }

    try {
        // Usar la API de Admin para crear usuario con auto-confirmación
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirmar, no envía correo
            user_metadata: {
                full_name: fullName,
                role: role,
                unit_id: unitId
            }
        });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error creating system user:', error);
        return { data: null, error };
    }
};

/**
 * Obtener todos los usuarios del sistema con su unidad asignada
 * @param {number|null} unitId - Opcional, filtrar por unidad
 * @returns {Promise<{data: array, error: any}>}
 */
export const getSystemUsers = async (unitId = null) => {
    try {
        let query = supabase
            .from('system_users')
            .select(`
        *,
        business_units (
          id,
          name
        )
      `)
            .order('full_name', { ascending: true })

        // Filtrar por unidad si se especifica
        if (unitId) {
            query = query.eq('unit_id', unitId)
        }

        const { data, error } = await query

        if (error) throw error

        // Mapear datos para el frontend
        const mappedData = (data || []).map(user => ({
            id: user.id,
            user_id: user.user_id,
            name: user.full_name,
            email: user.email,
            role: user.role,
            unitId: user.unit_id,
            unitName: user.business_units?.name || null,
            status: user.status || 'Active',
            created_at: user.created_at
        }))

        return { data: mappedData, error: null }
    } catch (error) {
        console.error('Error fetching system users:', error)
        return { data: [], error }
    }
}

/**
 * Crear un nuevo usuario del sistema
 * @param {object} userData - Datos del usuario
 * @returns {Promise<{data: object, error: any}>}
 */
export const createSystemUser = async (userData) => {
    try {
        const { data, error } = await supabase
            .from('system_users')
            .insert([{
                id: userData.authId, // UUID de Supabase Auth
                full_name: userData.name,
                email: userData.email,
                role: userData.role,
                unit_id: userData.unitId,
                status: userData.status || 'Active'
            }])
            .select()
            .single()

        if (error) throw error

        return { data, error: null }
    } catch (error) {
        console.error('Error creating system user:', error)
        return { data: null, error }
    }
}

/**
 * Actualizar un usuario del sistema
 * @param {string} id - UUID del usuario
 * @param {object} userData - Datos a actualizar
 * @returns {Promise<{data: object, error: any}>}
 */
export const updateSystemUser = async (id, userData) => {
    // Verificar que tenemos el cliente admin
    if (!supabaseAdmin) {
        console.error('No se puede actualizar usuario: falta VITE_SUPABASE_SERVICE_ROLE_KEY');
        return {
            data: null,
            error: { message: 'Configuración incompleta. Contacta al administrador.' }
        };
    }

    try {
        const updateData = {}

        if (userData.name !== undefined) updateData.full_name = userData.name
        if (userData.email !== undefined) updateData.email = userData.email
        if (userData.role !== undefined) updateData.role = userData.role
        if (userData.unitId !== undefined) updateData.unit_id = userData.unitId
        if (userData.status !== undefined) updateData.status = userData.status

        console.log('Updating user with id:', id, 'data:', updateData)

        // Usar supabaseAdmin para bypass RLS
        const { data, error } = await supabaseAdmin
            .from('system_users')
            .update(updateData)
            .eq('id', id)
            .select()

        if (error) throw error

        // Verificar si se actualizó algún registro
        if (!data || data.length === 0) {
            return {
                data: null,
                error: { message: 'No se encontró el usuario para actualizar' }
            }
        }

        return { data: data[0], error: null }
    } catch (error) {
        console.error('Error updating system user:', error)
        return { data: null, error }
    }
}

/**
 * Eliminar un usuario del sistema (soft delete - cambiar status)
 * @param {string} id - UUID del usuario
 * @returns {Promise<{error: any}>}
 */
export const deleteSystemUser = async (id) => {
    try {
        // En lugar de eliminar, cambiamos el status a Inactive
        const { error } = await supabase
            .from('system_users')
            .update({ status: 'Inactive' })
            .eq('id', id)

        if (error) throw error

        return { error: null }
    } catch (error) {
        console.error('Error deleting system user:', error)
        return { error }
    }
}

/**
 * Obtener un usuario por su ID
 * @param {string} id - UUID del usuario
 * @returns {Promise<{data: object, error: any}>}
 */
export const getSystemUserById = async (id) => {
    try {
        const { data, error } = await supabase
            .from('system_users')
            .select(`
        *,
        business_units (
          id,
          name
        )
      `)
            .eq('id', id)
            .single()

        if (error) throw error

        return {
            data: {
                id: data.id,
                user_id: data.user_id,
                name: data.full_name,
                email: data.email,
                role: data.role,
                unitId: data.unit_id,
                unitName: data.business_units?.name || null,
                status: data.status || 'Active'
            },
            error: null
        }
    } catch (error) {
        console.error('Error fetching user by id:', error)
        return { data: null, error }
    }
}
