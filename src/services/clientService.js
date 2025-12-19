// src/services/clientService.js
// Servicio para operaciones CRUD de clientes con Supabase

import { supabase } from '../lib/supabase'

/**
 * Mapea los datos de la BD (snake_case) al formato usado en el frontend
 * @param {object} dbClient - Cliente desde la BD
 * @returns {object} Cliente mapeado
 */
const mapClientFromDB = (dbClient) => {
  if (!dbClient) return null
  return {
    id: dbClient.id,
    unitId: dbClient.unit_id,
    name: dbClient.business_name, // business_name -> name
    contact: dbClient.contact_name, // contact_name -> contact
    email: dbClient.contact_email, // contact_email -> email
    contactPhone: dbClient.contact_phone, // nuevo campo
    address: dbClient.address_fiscal, // address_fiscal -> address
    status: dbClient.status,
    rfc: dbClient.rfc,
    user_market_tec: dbClient.User_market_tec || dbClient.user_market_tec, // Usuario Market Tec (con mayúscula inicial en BD)
    created_at: dbClient.created_at,
    // Mantener también los campos originales para compatibilidad
    ...dbClient
  }
}

/**
 * Mapea los datos del frontend al formato de la BD (snake_case)
 * @param {object} clientData - Datos del cliente desde el frontend
 * @returns {object} Datos mapeados para la BD
 */
const mapClientToDB = (clientData) => {
  const mapped = {}
  
  // Mapear campos del frontend a la BD
  if (clientData.name !== undefined) mapped.business_name = clientData.name
  if (clientData.contact !== undefined) mapped.contact_name = clientData.contact
  if (clientData.email !== undefined) mapped.contact_email = clientData.email
  if (clientData.contactPhone !== undefined) mapped.contact_phone = clientData.contactPhone
  if (clientData.address !== undefined) mapped.address_fiscal = clientData.address
  if (clientData.unitId !== undefined) mapped.unit_id = clientData.unitId
  
  // Campos que no necesitan mapeo
  if (clientData.status !== undefined) mapped.status = clientData.status
  if (clientData.rfc !== undefined) mapped.rfc = clientData.rfc
  
  // Si ya vienen en formato de BD, mantenerlos
  if (clientData.business_name !== undefined) mapped.business_name = clientData.business_name
  if (clientData.contact_name !== undefined) mapped.contact_name = clientData.contact_name
  if (clientData.contact_email !== undefined) mapped.contact_email = clientData.contact_email
  if (clientData.contact_phone !== undefined) mapped.contact_phone = clientData.contact_phone
  if (clientData.address_fiscal !== undefined) mapped.address_fiscal = clientData.address_fiscal
  if (clientData.unit_id !== undefined) mapped.unit_id = clientData.unit_id
  
  return mapped
}

/**
 * Obtiene todos los clientes, opcionalmente filtrados por unitId
 * @param {number|null} unitId - ID de la unidad para filtrar (null = todos)
 * @returns {Promise<{data: array, error: object}>}
 */
export const getClients = async (unitId = null) => {
  try {
    let query = supabase
      .from('clients')
      .select('*')
      .order('business_name', { ascending: true }) // Usar business_name en lugar de name

    // Filtrar por unitId si se proporciona
    if (unitId !== null) {
      query = query.eq('unit_id', unitId)
    }

    const { data, error } = await query

    if (error) throw error

    // Mapear los datos al formato del frontend
    const mappedData = (data || []).map(mapClientFromDB)

    return { data: mappedData, error: null }
  } catch (error) {
    console.error('Error al obtener clientes:', error)
    return { data: null, error }
  }
}

/**
 * Obtiene un cliente por su ID
 * @param {number} id - ID del cliente
 * @returns {Promise<{data: object, error: object}>}
 */
export const getClientById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    // Mapear los datos al formato del frontend
    const mappedData = mapClientFromDB(data)

    return { data: mappedData, error: null }
  } catch (error) {
    console.error('Error al obtener cliente:', error)
    return { data: null, error }
  }
}

/**
 * Crea un nuevo cliente
 * @param {object} clientData - Datos del cliente (puede venir en formato frontend o BD)
 * @returns {Promise<{data: object, error: object}>}
 */
export const createClient = async (clientData) => {
  try {
    // Mapear los datos al formato de la BD
    const mappedData = mapClientToDB(clientData)
    
    const { data, error } = await supabase
      .from('clients')
      .insert([mappedData])
      .select()
      .single()

    if (error) throw error

    // Mapear la respuesta al formato del frontend
    const mappedResponse = mapClientFromDB(data)

    return { data: mappedResponse, error: null }
  } catch (error) {
    console.error('Error al crear cliente:', error)
    return { data: null, error }
  }
}

/**
 * Actualiza un cliente existente
 * @param {number} id - ID del cliente
 * @param {object} clientData - Datos a actualizar (puede venir en formato frontend o BD)
 * @returns {Promise<{data: object, error: object}>}
 */
export const updateClient = async (id, clientData) => {
  try {
    // Mapear los datos al formato de la BD
    const mappedData = mapClientToDB(clientData)
    
    const { data, error } = await supabase
      .from('clients')
      .update(mappedData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Mapear la respuesta al formato del frontend
    const mappedResponse = mapClientFromDB(data)

    return { data: mappedResponse, error: null }
  } catch (error) {
    console.error('Error al actualizar cliente:', error)
    return { data: null, error }
  }
}

/**
 * Elimina un cliente
 * @param {number} id - ID del cliente
 * @returns {Promise<{error: object}>}
 */
export const deleteClient = async (id) => {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error al eliminar cliente:', error)
    return { error }
  }
}

