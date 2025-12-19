// src/services/businessUnitService.js
// Servicio para operaciones con business_units

import { supabase } from '../lib/supabase'

/**
 * Obtiene una unidad de negocio por ID
 * @param {number} unitId - ID de la unidad de negocio
 * @returns {Promise<{data: object|null, error: object}>}
 */
export const getBusinessUnit = async (unitId) => {
  try {
    if (!unitId) {
      return { data: null, error: null }
    }

    const { data, error } = await supabase
      .from('business_units')
      .select('*')
      .eq('id', unitId)
      .single()

    // PGRST116 = no rows returned
    if (error && error.code !== 'PGRST116') {
      // Si la tabla no existe, retornar null sin error crítico
      if (error.message?.includes('table') || error.message?.includes('schema cache')) {
        console.warn('⚠️ La tabla business_units no existe en Supabase. Verifica que la tabla esté creada.')
        return { data: null, error: null } // No es un error crítico
      }
      console.error('Error al obtener business_units:', error)
      return { data: null, error }
    }

    return { data: data || null, error: null }
  } catch (error) {
    // Si la tabla no existe, no es un error crítico
    if (error.message?.includes('table') || error.message?.includes('schema cache')) {
      console.warn('⚠️ La tabla business_units no existe en Supabase.')
      return { data: null, error: null }
    }
    console.error('Error al obtener business_units:', error)
    return { data: null, error }
  }
}

/**
 * Obtiene todas las unidades de negocio
 * @returns {Promise<{data: array, error: object}>}
 */
export const getBusinessUnits = async () => {
  try {
    const { data, error } = await supabase
      .from('business_units')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error al obtener business_units:', error)
      return { data: [], error }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error al obtener business_units:', error)
    return { data: [], error }
  }
}

