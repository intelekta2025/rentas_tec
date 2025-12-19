// src/services/clientPortalUsersService.js
// Servicio para operaciones con client_portal_users

import { supabase } from '../lib/supabase'

/**
 * Obtiene todos los usuarios del portal para un cliente específico
 * @param {number} clientId - ID del cliente
 * @returns {Promise<{data: array, error: object}>}
 */
export const getClientPortalUsers = async (clientId) => {
  try {
    if (!clientId) {
      return { data: [], error: null }
    }

    const { data, error } = await supabase
      .from('client_portal_users')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error al obtener client_portal_users:', error)
      return { data: [], error }
    }

    // Mapear los datos al formato del frontend
    const mappedData = (data || []).map(user => ({
      id: user.id,
      clientId: user.client_id,
      name: user.full_name,
      email: user.email,
      role: user.role || 'Client',
      isActive: user.is_active,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      // Mantener campos originales para compatibilidad
      ...user
    }))

    return { data: mappedData, error: null }
  } catch (error) {
    console.error('Error al obtener client_portal_users:', error)
    return { data: [], error }
  }
}

/**
 * Crea un nuevo usuario del portal
 * @param {object} userData - Datos del usuario
 * @returns {Promise<{data: object, error: object}>}
 */
export const createClientPortalUser = async (userData) => {
  try {
    const mappedData = {
      client_id: userData.clientId,
      full_name: userData.name || userData.full_name,
      email: userData.email,
      role: userData.role || 'Client',
      is_active: userData.isActive !== undefined ? userData.isActive : true,
    }

    const { data, error } = await supabase
      .from('client_portal_users')
      .insert([mappedData])
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error al crear client_portal_user:', error)
    return { data: null, error }
  }
}

/**
 * Elimina un usuario del portal
 * @param {string} userId - UUID del usuario
 * @returns {Promise<{error: object}>}
 */
export const deleteClientPortalUser = async (userId) => {
  try {
    const { error } = await supabase
      .from('client_portal_users')
      .delete()
      .eq('id', userId)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error al eliminar client_portal_user:', error)
    return { error }
  }
}

