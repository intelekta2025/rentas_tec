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

    // Campos calculados de financieros
    totalContract: dbClient.totalContract || 0,
    pendingBalance: dbClient.pendingBalance || 0,
    overdueBalance: dbClient.overdueBalance || 0,
  }
}

/**
 * Mapea los datos del frontend al formato de la BD (snake_case)
 * @param {object} clientData - Datos del cliente desde el frontend
 * @returns {object} Datos mapeados para la BD
 */
const mapClientToDB = (clientData) => {
  const mapped = {}

  // Mapear solo los campos que vienen con valor o están definidos
  // business_name
  const bName = clientData.business_name || clientData.name
  if (bName !== undefined) mapped.business_name = bName

  // contact_name
  const cName = clientData.contact_name || clientData.contact
  if (cName !== undefined) mapped.contact_name = cName

  // contact_email
  const cEmail = clientData.contact_email || clientData.email
  if (cEmail !== undefined) mapped.contact_email = cEmail

  // contact_phone
  const cPhone = clientData.contact_phone || clientData.contactPhone
  if (cPhone !== undefined) mapped.contact_phone = cPhone

  // rfc
  if (clientData.rfc !== undefined) mapped.rfc = clientData.rfc

  // status
  if (clientData.status !== undefined) mapped.status = clientData.status

  // unit_id
  const uId = clientData.unit_id || clientData.unitId
  if (uId !== undefined) mapped.unit_id = uId

  // User_market_tec (Casing exacto de BD)
  const umt = clientData.User_market_tec || clientData.user_market_tec
  if (umt !== undefined) mapped.User_market_tec = umt

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
      .select('*, receivables(amount, balance, status, due_date)')
      .order('business_name', { ascending: true }) // Usar business_name en lugar de name

    // Filtrar por unitId si se proporciona
    if (unitId !== null) {
      query = query.eq('unit_id', unitId)
    }

    const { data, error } = await query

    if (error) throw error



    // Mapear los datos al formato del frontend y calcular totales
    const mappedData = (data || []).map(client => {
      // Calcular totales desde receivables
      const receivables = client.receivables || []

      const totalContract = receivables.reduce((sum, r) => {
        const amount = typeof r.amount === 'string' ? parseFloat(r.amount.replace(/[^0-9.-]+/g, '')) : r.amount
        return sum + (amount || 0)
      }, 0)

      const pendingBalance = receivables.reduce((sum, r) => {
        const balance = typeof r.balance === 'string' ? parseFloat(r.balance.replace(/[^0-9.-]+/g, '')) : r.balance
        return sum + (balance || 0)
      }, 0)

      const overdueBalance = receivables.reduce((sum, r) => {
        const isPaid = r.status === 'Paid'
        // Chequeo de fechas si no está pagado
        let isOverdue = false
        if (!isPaid && r.due_date) {
          const dueDate = new Date(r.due_date)
          const today = new Date()
          // Resetear horas para comparación solo de fecha
          today.setHours(0, 0, 0, 0)
          // Ajuste de zona horaria simple si es necesario, pero por ahora comparación directa
          // Si la fecha de vencimiento es anterior a hoy
          isOverdue = dueDate < today
        }

        if (isOverdue || r.status === 'Overdue') {
          const balance = typeof r.balance === 'string' ? parseFloat(r.balance.replace(/[^0-9.-]+/g, '')) : r.balance
          return sum + (balance || 0)
        }
        return sum
      }, 0)

      return mapClientFromDB({
        ...client,
        totalContract,
        pendingBalance,
        overdueBalance
      })
    })

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

    // IMPORTANTE: Eliminamos id si existe para que la BD use su secuencia automática
    delete mappedData.id

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

    // IMPORTANTE: Para la actualización, no enviamos id ni unit_id
    delete mappedData.id
    delete mappedData.unit_id

    // 2. Ejecutar UPDATE
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

