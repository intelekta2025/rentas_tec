// src/services/invoiceService.js
// Servicio para operaciones CRUD de receivables (cuentas por cobrar) con Supabase

import { supabase } from '../lib/supabase'

/**
 * Formatea un número a string con formato de moneda mexicana
 * @param {number|string} value - Valor numérico
 * @returns {string} Valor formateado como "$15,000.00"
 */
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '$0.00'
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(num)
}

/**
 * Parsea un string de moneda a número
 * @param {string} value - Valor como "$15,000.00"
 * @returns {number} Valor numérico
 */
const parseCurrency = (value) => {
  if (!value) return 0
  if (typeof value === 'number') return value
  return parseFloat(value.replace(/[^0-9.-]+/g, '')) || 0
}

/**
 * Mapea los datos de la BD (snake_case, numeric) al formato usado en el frontend
 * @param {object} dbReceivable - Receivable desde la BD
 * @returns {object} Receivable mapeado
 */
const mapReceivableFromDB = (dbReceivable) => {
  if (!dbReceivable) return null
  
  const today = new Date()
  const dueDate = dbReceivable.due_date ? new Date(dbReceivable.due_date) : null
  
  // Calcular días vencidos si está vencida
  let daysOverdue = 0
  if (dbReceivable.status === 'Overdue' && dueDate) {
    daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)))
  }
  
  // Calcular días hasta vencimiento si está pendiente o programada
  let daysUntil = null
  if ((dbReceivable.status === 'Pending' || dbReceivable.status === 'Scheduled') && dueDate) {
    daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
  }
  
  return {
    id: dbReceivable.id,
    unitId: dbReceivable.unit_id,
    clientId: dbReceivable.client_id,
    contractId: dbReceivable.contract_id,
    amount: formatCurrency(dbReceivable.amount), // Convertir numeric a string formateado
    concept: dbReceivable.concept,
    dueDate: dbReceivable.due_date,
    status: dbReceivable.status,
    type: dbReceivable.type,
    daysOverdue,
    daysUntil,
    // Campos nuevos
    periodMonth: dbReceivable.period_month,
    periodYear: dbReceivable.period_year,
    paidAmount: formatCurrency(dbReceivable.paid_amount),
    balanceDue: formatCurrency(dbReceivable.balance_due),
    created_at: dbReceivable.created_at,
    // Mantener también los campos originales para compatibilidad
    ...dbReceivable,
    // Alias para compatibilidad con código existente
    unit_id: dbReceivable.unit_id,
    client_id: dbReceivable.client_id,
  }
}

/**
 * Mapea los datos del frontend al formato de la BD (snake_case, numeric)
 * @param {object} receivableData - Datos del receivable desde el frontend
 * @returns {object} Datos mapeados para la BD
 */
const mapReceivableToDB = (receivableData) => {
  const mapped = {}
  
  // Mapear campos del frontend a la BD
  if (receivableData.unitId !== undefined) mapped.unit_id = receivableData.unitId
  if (receivableData.clientId !== undefined) mapped.client_id = receivableData.clientId
  if (receivableData.contractId !== undefined) mapped.contract_id = receivableData.contractId
  
  // Convertir amount de string a numeric
  if (receivableData.amount !== undefined) {
    mapped.amount = parseCurrency(receivableData.amount)
  }
  
  // Campos de texto
  if (receivableData.concept !== undefined) mapped.concept = receivableData.concept
  if (receivableData.dueDate !== undefined) mapped.due_date = receivableData.dueDate
  if (receivableData.status !== undefined) mapped.status = receivableData.status
  if (receivableData.type !== undefined) mapped.type = receivableData.type
  
  // Campos nuevos
  if (receivableData.periodMonth !== undefined) mapped.period_month = receivableData.periodMonth
  if (receivableData.periodYear !== undefined) mapped.period_year = receivableData.periodYear
  if (receivableData.paidAmount !== undefined) {
    mapped.paid_amount = parseCurrency(receivableData.paidAmount)
  }
  if (receivableData.balanceDue !== undefined) {
    mapped.balance_due = parseCurrency(receivableData.balanceDue)
  }
  
  // Si ya vienen en formato de BD, mantenerlos (tienen prioridad)
  if (receivableData.unit_id !== undefined) mapped.unit_id = receivableData.unit_id
  if (receivableData.client_id !== undefined) mapped.client_id = receivableData.client_id
  if (receivableData.contract_id !== undefined) mapped.contract_id = receivableData.contract_id
  if (receivableData.period_month !== undefined) mapped.period_month = receivableData.period_month
  if (receivableData.period_year !== undefined) mapped.period_year = receivableData.period_year
  if (receivableData.due_date !== undefined) mapped.due_date = receivableData.due_date
  if (receivableData.paid_amount !== undefined) mapped.paid_amount = receivableData.paid_amount
  if (receivableData.balance_due !== undefined) mapped.balance_due = receivableData.balance_due
  
  // Si amount viene como número, mantenerlo
  if (receivableData.amount !== undefined && typeof receivableData.amount === 'number') {
    mapped.amount = receivableData.amount
  }
  
  return mapped
}

/**
 * Obtiene todos los receivables, opcionalmente filtrados por unitId, clientId o estado
 * @param {object} filters - Filtros opcionales { unitId, clientId, status }
 * @returns {Promise<{data: array, error: object}>}
 */
export const getInvoices = async (filters = {}) => {
  try {
    let query = supabase
      .from('receivables') // Tabla real: receivables
      .select('*')
      .order('due_date', { ascending: false })

    // Aplicar filtros
    if (filters.unitId !== undefined && filters.unitId !== null) {
      query = query.eq('unit_id', filters.unitId)
    }

    if (filters.clientId !== undefined && filters.clientId !== null) {
      query = query.eq('client_id', filters.clientId)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query

    if (error) throw error

    // Mapear los datos al formato del frontend
    const mappedData = (data || []).map(mapReceivableFromDB)

    return { data: mappedData, error: null }
  } catch (error) {
    console.error('Error al obtener receivables:', error)
    return { data: null, error }
  }
}

/**
 * Obtiene receivables vencidos (Overdue)
 * @param {number|null} unitId - ID de la unidad para filtrar
 * @returns {Promise<{data: array, error: object}>}
 */
export const getOverdueInvoices = async (unitId = null) => {
  return getInvoices({ unitId, status: 'Overdue' })
}

/**
 * Obtiene receivables pendientes (Pending)
 * @param {number|null} unitId - ID de la unidad para filtrar
 * @returns {Promise<{data: array, error: object}>}
 */
export const getPendingInvoices = async (unitId = null) => {
  return getInvoices({ unitId, status: 'Pending' })
}

/**
 * Obtiene receivables programados (Scheduled)
 * @param {number|null} unitId - ID de la unidad para filtrar
 * @returns {Promise<{data: array, error: object}>}
 */
export const getScheduledInvoices = async (unitId = null) => {
  return getInvoices({ unitId, status: 'Scheduled' })
}

/**
 * Obtiene un receivable por su ID
 * @param {number} id - ID del receivable
 * @returns {Promise<{data: object, error: object}>}
 */
export const getInvoiceById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('receivables') // Tabla real: receivables
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    // Mapear los datos al formato del frontend
    const mappedData = mapReceivableFromDB(data)

    return { data: mappedData, error: null }
  } catch (error) {
    console.error('Error al obtener receivable:', error)
    return { data: null, error }
  }
}

/**
 * Crea un nuevo receivable
 * @param {object} invoiceData - Datos del receivable (puede venir en formato frontend o BD)
 * @returns {Promise<{data: object, error: object}>}
 */
export const createInvoice = async (invoiceData) => {
  try {
    // Mapear los datos al formato de la BD
    const mappedData = mapReceivableToDB(invoiceData)
    
    const { data, error } = await supabase
      .from('receivables') // Tabla real: receivables
      .insert([mappedData])
      .select()
      .single()

    if (error) throw error

    // Mapear la respuesta al formato del frontend
    const mappedResponse = mapReceivableFromDB(data)

    return { data: mappedResponse, error: null }
  } catch (error) {
    console.error('Error al crear receivable:', error)
    return { data: null, error }
  }
}

/**
 * Actualiza un receivable existente
 * @param {number} id - ID del receivable
 * @param {object} invoiceData - Datos a actualizar (puede venir en formato frontend o BD)
 * @returns {Promise<{data: object, error: object}>}
 */
export const updateInvoice = async (id, invoiceData) => {
  try {
    // Mapear los datos al formato de la BD
    const mappedData = mapReceivableToDB(invoiceData)
    
    const { data, error } = await supabase
      .from('receivables') // Tabla real: receivables
      .update(mappedData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Mapear la respuesta al formato del frontend
    const mappedResponse = mapReceivableFromDB(data)

    return { data: mappedResponse, error: null }
  } catch (error) {
    console.error('Error al actualizar receivable:', error)
    return { data: null, error }
  }
}

/**
 * Actualiza el estado de un receivable
 * @param {number} id - ID del receivable
 * @param {string} status - Nuevo estado (Pending, Paid, Overdue, Scheduled)
 * @returns {Promise<{data: object, error: object}>}
 */
export const updateInvoiceStatus = async (id, status) => {
  return updateInvoice(id, { status })
}

/**
 * Elimina un receivable
 * @param {number} id - ID del receivable
 * @returns {Promise<{error: object}>}
 */
export const deleteInvoice = async (id) => {
  try {
    const { error } = await supabase
      .from('receivables') // Tabla real: receivables
      .delete()
      .eq('id', id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error al eliminar receivable:', error)
    return { error }
  }
}

/**
 * Obtiene recordatorios próximos (receivables con fecha de vencimiento cercana)
 * @param {number|null} unitId - ID de la unidad para filtrar
 * @param {number} daysAhead - Días hacia adelante para buscar (default: 30)
 * @returns {Promise<{data: array, error: object}>}
 */
export const getUpcomingReminders = async (unitId = null, daysAhead = 30) => {
  try {
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + daysAhead)

    let query = supabase
      .from('receivables') // Tabla real: receivables
      .select('*')
      .in('status', ['Pending', 'Scheduled'])
      .gte('due_date', today.toISOString().split('T')[0])
      .lte('due_date', futureDate.toISOString().split('T')[0])
      .order('due_date', { ascending: true })

    if (unitId !== null) {
      query = query.eq('unit_id', unitId)
    }

    const { data, error } = await query

    if (error) throw error

    // Mapear los datos al formato del frontend
    const mappedData = (data || []).map(mapReceivableFromDB)

    return { data: mappedData, error: null }
  } catch (error) {
    console.error('Error al obtener recordatorios:', error)
    return { data: null, error }
  }
}
