// src/services/paymentService.js
// Servicio para operaciones CRUD de pagos con Supabase

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
 * @param {object} dbPayment - Payment desde la BD
 * @returns {object} Payment mapeado
 */
const mapPaymentFromDB = (dbPayment) => {
  if (!dbPayment) return null

  return {
    id: dbPayment.id,
    clientId: dbPayment.client_id,
    unitId: dbPayment.unit_id,
    marketTecUploadId: dbPayment.market_tec_upload_id,
    amount: formatCurrency(dbPayment.amount), // Convertir numeric a string formateado
    date: dbPayment.payment_date, // payment_date → date (alias para compatibilidad)
    paymentDate: dbPayment.payment_date,
    reference: dbPayment.reference_number, // reference_number → reference (alias)
    referenceNumber: dbPayment.reference_number,
    method: dbPayment.payment_method, // payment_method → method (alias)
    paymentMethod: dbPayment.payment_method,
    invoiceStatus: dbPayment.invoice_status,
    invoiceUuid: dbPayment.invoice_uuid,
    invoicePdfUrl: dbPayment.invoice_pdf_url,
    invoiceXmlUrl: dbPayment.invoice_xml_url,
    created_at: dbPayment.created_at,
    unappliedAmount: dbPayment.unapplied_amount,
    // Mantener también los campos originales para compatibilidad
    ...dbPayment,
    // Alias para compatibilidad con código existente
    client_id: dbPayment.client_id,
    unit_id: dbPayment.unit_id,
  }
}

/**
 * Mapea los datos del frontend al formato de la BD (snake_case, numeric)
 * @param {object} paymentData - Datos del payment desde el frontend
 * @returns {object} Datos mapeados para la BD
 */
const mapPaymentToDB = (paymentData) => {
  const mapped = {}

  // Mapear campos del frontend a la BD
  if (paymentData.clientId !== undefined) mapped.client_id = paymentData.clientId
  if (paymentData.unitId !== undefined) mapped.unit_id = paymentData.unitId
  if (paymentData.marketTecUploadId !== undefined) mapped.market_tec_upload_id = paymentData.marketTecUploadId

  // Convertir amount de string a numeric
  if (paymentData.amount !== undefined) {
    mapped.amount = parseCurrency(paymentData.amount)
  }

  // Fecha: aceptar date o paymentDate
  if (paymentData.date !== undefined) mapped.payment_date = paymentData.date
  if (paymentData.paymentDate !== undefined) mapped.payment_date = paymentData.paymentDate

  // Referencia: aceptar reference o referenceNumber
  if (paymentData.reference !== undefined) mapped.reference_number = paymentData.reference
  if (paymentData.referenceNumber !== undefined) mapped.reference_number = paymentData.referenceNumber

  // Método: aceptar method o paymentMethod
  if (paymentData.method !== undefined) mapped.payment_method = paymentData.method
  if (paymentData.paymentMethod !== undefined) mapped.payment_method = paymentData.paymentMethod

  // Campos de facturación
  if (paymentData.invoiceStatus !== undefined) mapped.invoice_status = paymentData.invoiceStatus
  if (paymentData.invoiceUuid !== undefined) mapped.invoice_uuid = paymentData.invoiceUuid
  if (paymentData.invoicePdfUrl !== undefined) mapped.invoice_pdf_url = paymentData.invoicePdfUrl
  if (paymentData.invoiceXmlUrl !== undefined) mapped.invoice_xml_url = paymentData.invoiceXmlUrl

  // No más receivable_id directo en la tabla payments

  // Si amount viene como número, mantenerlo
  if (paymentData.amount !== undefined && typeof paymentData.amount === 'number') {
    mapped.amount = paymentData.amount
  }

  return mapped
}

/**
 * Obtiene todos los pagos, opcionalmente filtrados por clientId o unitId
 * @param {number|null} clientId - ID del cliente para filtrar (null = todos)
 * @param {number|null} unitId - ID de la unidad para filtrar (null = todos)
 * @returns {Promise<{data: array, error: object}>}
 */
export const getPayments = async (clientId = null, unitId = null) => {
  try {
    let query = supabase
      .from('payments')
      .select('*')
      .order('payment_date', { ascending: false }) // Usar payment_date en lugar de date

    // Filtrar por clientId si se proporciona
    if (clientId !== null) {
      query = query.eq('client_id', clientId)
    }

    // Filtrar por unitId si se proporciona
    if (unitId !== null) {
      query = query.eq('unit_id', unitId)
    }

    const { data, error } = await query

    if (error) throw error

    // Mapear los datos al formato del frontend
    const mappedData = (data || []).map(mapPaymentFromDB)

    return { data: mappedData, error: null }
  } catch (error) {
    console.error('Error al obtener pagos:', error)
    return { data: null, error }
  }
}

/**
 * Obtiene un pago por su ID
 * @param {number} id - ID del pago
 * @returns {Promise<{data: object, error: object}>}
 */
export const getPaymentById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    // Mapear los datos al formato del frontend
    const mappedData = mapPaymentFromDB(data)

    return { data: mappedData, error: null }
  } catch (error) {
    console.error('Error al obtener pago:', error)
    return { data: null, error }
  }
}

/**
 * Crea un nuevo pago
 * @param {object} paymentData - Datos del pago (puede venir en formato frontend o BD)
 * @returns {Promise<{data: object, error: object}>}
 */
export const createPayment = async (paymentData) => {
  try {
    // Mapear los datos al formato de la BD
    const mappedData = mapPaymentToDB(paymentData)

    const { data, error } = await supabase
      .from('payments')
      .insert([mappedData])
      .select('id')
      .single()

    if (error) throw error

    // 2. Si se proporciona un receivableId, crear la aplicación del pago
    const rId = paymentData.receivableId || paymentData.receivable_id || paymentData.invoice_id;
    if (rId) {
      // Crear la aplicación en la tabla pivote
      await supabase
        .from('payment_applications')
        .insert([{
          payment_id: data.id,
          receivable_id: rId,
          amount_applied: mappedData.amount
        }]);

      // Actualizar el estado del receivable relacionado
      const { data: receivable } = await supabase
        .from('receivables')
        .select('paid_amount, amount')
        .eq('id', rId)
        .single();

      if (receivable) {
        const newPaidAmount = (parseFloat(receivable.paid_amount) || 0) + parseFloat(mappedData.amount)
        const balanceDue = Math.max(0, parseFloat(receivable.amount) - newPaidAmount)

        await supabase
          .from('receivables')
          .update({
            amount_paid: newPaidAmount,
            status: balanceDue <= 0 ? 'Paid' : 'Partial'
          })
          .eq('id', rId)
      }
    }

    // Mapear la respuesta al formato del frontend
    const mappedResponse = mapPaymentFromDB(data)

    return { data: mappedResponse, error: null }
  } catch (error) {
    console.error('Error al crear pago:', error)
    return { data: null, error }
  }
}

/**
 * Actualiza un pago existente
 * @param {number} id - ID del pago
 * @param {object} paymentData - Datos a actualizar (puede venir en formato frontend o BD)
 * @returns {Promise<{data: object, error: object}>}
 */
export const updatePayment = async (id, paymentData) => {
  try {
    // Mapear los datos al formato de la BD
    const mappedData = mapPaymentToDB(paymentData)

    const { data, error } = await supabase
      .from('payments')
      .update(mappedData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Mapear la respuesta al formato del frontend
    const mappedResponse = mapPaymentFromDB(data)

    return { data: mappedResponse, error: null }
  } catch (error) {
    console.error('Error al actualizar pago:', error)
    return { data: null, error }
  }
}

/**
 * Elimina un pago
 * @param {number} id - ID del pago
 * @returns {Promise<{error: object}>}
 */
export const deletePayment = async (id) => {
  try {
    // Obtener el pago antes de eliminarlo para actualizar el receivable
    const { data: payment } = await getPaymentById(id)

    // 1. Buscar aplicaciones de este pago para revertir los montos en los receivables
    const { data: applications } = await supabase
      .from('payment_applications')
      .select('receivable_id, amount_applied')
      .eq('payment_id', id);

    if (applications && applications.length > 0) {
      for (const app of applications) {
        // Revertir el pago en el receivable
        const { data: receivable } = await supabase
          .from('receivables')
          .select('paid_amount, amount')
          .eq('id', app.receivable_id)
          .single();

        if (receivable) {
          const appliedAmount = parseFloat(app.amount_applied || 0);
          const newPaidAmount = Math.max(0, (parseFloat(receivable.paid_amount) || 0) - appliedAmount);
          const balanceDue = parseFloat(receivable.amount) - newPaidAmount;

          await supabase
            .from('receivables')
            .update({
              amount_paid: newPaidAmount,
              status: balanceDue <= 0 ? 'Paid' : (newPaidAmount > 0 ? 'Partial' : 'Pending')
            })
            .eq('id', app.receivable_id);
        }
      }
    }

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error al eliminar pago:', error)
    return { error }
  }
}

/**
 * Obtiene el historial de pagos de un cliente
 * @param {number} clientId - ID del cliente
 * @param {number} limit - Límite de resultados (opcional)
 * @returns {Promise<{data: array, error: object}>}
 */
export const getPaymentHistory = async (clientId, limit = null) => {
  try {
    let query = supabase
      .from('payments')
      .select('*')
      .eq('client_id', clientId)
      .order('payment_date', { ascending: false }) // Usar payment_date

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error

    // Mapear los datos al formato del frontend
    const mappedData = (data || []).map(mapPaymentFromDB)

    return { data: mappedData, error: null }
  } catch (error) {
    console.error('Error al obtener historial de pagos:', error)
    return { data: null, error }
  }
}
