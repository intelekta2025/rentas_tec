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
  today.setHours(0, 0, 0, 0) // Normalizar a medianoche para comparación limpia

  const dueDateStr = dbReceivable.due_date || dbReceivable.dueDate;
  let dueDate = null;
  let dMonth = null;
  let dYear = null;

  if (dueDateStr) {
    // Si es YYYY-MM-DD, parsear manualmente para evitar desfases de zona horaria
    const parts = String(dueDateStr).split('-');
    if (parts.length >= 3) {
      dYear = parseInt(parts[0], 10);
      dMonth = parseInt(parts[1], 10);
      const dDay = parseInt(parts[2], 10);
      dueDate = new Date(dYear, dMonth - 1, dDay);
    } else {
      dueDate = new Date(dueDateStr);
      dMonth = dueDate.getMonth() + 1;
      dYear = dueDate.getFullYear();
    }
  }
  if (dueDate) dueDate.setHours(0, 0, 0, 0);

  // Determinar el estado efectivo considerando la lógica de negocio de la BD
  const dbStatus = (dbReceivable.status || '').toLowerCase();

  // Es vencido si:
  // 1. La BD ya lo marcó como 'Y' en la columna computada
  // 2. O si el status es pendiente/parcial y la fecha de vencimiento ya pasó (antes de hoy)
  const isOverdueFlag = (dbReceivable.overdue === 'Y') ||
    (['pending', 'pendiente', 'partial', 'parcial'].includes(dbStatus) && dueDate && dueDate < today);

  const effectiveStatus = isOverdueFlag ? 'Overdue' : (dbReceivable.status || 'Pending');

  // Calcular días vencidos si está vencida
  let daysOverdue = 0
  if (effectiveStatus === 'Overdue' && dueDate) {
    daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)))
  }

  // Calcular días hasta vencimiento si está pendiente o programada
  let daysUntil = null
  if ((effectiveStatus === 'Pending' || effectiveStatus === 'Scheduled' || effectiveStatus === 'pending') && dueDate) {
    daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
  }

  return {
    ...dbReceivable,
    id: dbReceivable.id,
    amount: formatCurrency(dbReceivable.amount), // Convertir numeric a string formateado
    concept: dbReceivable.concept,
    concepts: [dbReceivable.concept],
    dueDate: dbReceivable.due_date,
    status: effectiveStatus,
    type: dbReceivable.type,
    daysOverdue,
    daysUntil,
    // Campos de periodo explícitos - Fallback a dueDate si son nulos
    periodMonth: dbReceivable.period_month || dMonth,
    periodYear: dbReceivable.period_year || dYear,
    // Nombre del cliente (desde join o campo directo si existe)
    client: dbReceivable.clients?.business_name || dbReceivable.client_name || dbReceivable.client,
    email: dbReceivable.clients?.contact_email || '',
    contactName: dbReceivable.clients?.contact_name || '',
    contactPhone: dbReceivable.clients?.contact_phone || '',
    // Campos formateados adicionales
    paidAmount: formatCurrency(dbReceivable.amount_paid),
    balanceDue: formatCurrency(dbReceivable.balance),
    // Asegurar compatibilidad con alias si es necesario
    unitId: dbReceivable.unit_id,
    clientId: dbReceivable.client_id,
    contractId: dbReceivable.contract_id,
    // Valores numéricos crudos para cálculos
    amountRaw: parseFloat(dbReceivable.amount || 0),
    paidAmountRaw: parseFloat(dbReceivable.amount_paid || 0),
    balanceDueRaw: parseFloat(dbReceivable.balance || 0),
    // Extraer referencias de pago, fechas de pago e IDs de carga
    paymentReferences: dbReceivable.payment_applications
      ?.map(app => app.payments?.Market_tec_Referencia)
      .filter(ref => ref)
      .join(', ') || '',
    // Usar payment_date de payment_applications (sincronizado automáticamente desde payments)
    paymentDates: dbReceivable.payment_applications
      ?.map(app => app.payment_date)
      .filter(date => date)
      .join(', ') || '',
    // Usar upload_id de payments
    marketTecUploadIds: dbReceivable.payment_applications
      ?.map(app => app.payments?.upload_id)
      .filter(id => id)
      .join(', ') || ''
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
    mapped.amount_paid = parseCurrency(receivableData.paidAmount)
  }
  if (receivableData.balanceDue !== undefined) {
    mapped.balance = parseCurrency(receivableData.balanceDue)
  }

  // Si ya vienen en formato de BD, mantenerlos (tienen prioridad)
  if (receivableData.unit_id !== undefined) mapped.unit_id = receivableData.unit_id
  if (receivableData.client_id !== undefined) mapped.client_id = receivableData.client_id
  if (receivableData.contract_id !== undefined) mapped.contract_id = receivableData.contract_id
  if (receivableData.period_month !== undefined) mapped.period_month = receivableData.period_month
  if (receivableData.period_year !== undefined) mapped.period_year = receivableData.period_year
  if (receivableData.due_date !== undefined) mapped.due_date = receivableData.due_date
  if (receivableData.amount_paid !== undefined) mapped.amount_paid = receivableData.amount_paid
  if (receivableData.paid_amount !== undefined) mapped.amount_paid = receivableData.paid_amount
  if (receivableData.balance_due !== undefined) mapped.balance = receivableData.balance_due
  if (receivableData.balance !== undefined) mapped.balance = receivableData.balance

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
      .select(`
        *, 
        clients(business_name),
        payment_applications(
          payment_id,
          payment_date,
          payments(
            Market_tec_Referencia,
            payment_date,
            upload_id
          )
        )
      `)
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
      .select('*, clients(business_name)')
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
      .select('*, clients(business_name, contact_email, contact_name, contact_phone)')
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
/**
 * Crea múltiples receivables de una sola vez
 * @param {array} invoices - Array de objetos de receivable
 * @returns {Promise<{data: array, error: object}>}
 */
export const generateBulkInvoices = async (invoices) => {
  try {
    if (!invoices || !Array.isArray(invoices) || invoices.length === 0) {
      return { data: [], error: null }
    }

    // Mapear cada registro al formato de la BD
    const mappedInvoices = invoices.map(mapReceivableToDB)

    const { data, error } = await supabase
      .from('receivables')
      .insert(mappedInvoices)
      .select()

    if (error) throw error

    // Mapear la respuesta al formato del frontend
    const mappedResponse = (data || []).map(mapReceivableFromDB)

    return { data: mappedResponse, error: null }
  } catch (error) {
    console.error('Error al generar CXC en bloque:', error)
    return { data: null, error }
  }
}

/**
 * Registra un pago y actualiza el estado del movimiento
 */
export const registerPayment = async (paymentData) => {
  // 1. Extraer datos con fallback para diferentes nombres de campos
  const targetReceivableId = paymentData.receivableId || paymentData.receivable_id || paymentData.invoice_id;
  const clientId = paymentData.clientId || paymentData.client_id;
  const unitId = paymentData.unitId || paymentData.unit_id;
  const amountToPay = parseFloat(paymentData.amount || 0);
  const dateOfPayment = paymentData.paymentDate || paymentData.payment_date;
  const ref = paymentData.Market_tec_Referencia || paymentData.market_tec_referencia || '';

  if (!targetReceivableId) {
    return { success: false, error: new Error('Falta el ID del movimiento (targetReceivableId)') };
  }

  try {
    // 2. Obtener el movimiento actual
    const { data: receivable, error: fetchError } = await supabase
      .from('receivables')
      .select('id, amount, amount_paid, status')
      .eq('id', targetReceivableId)
      .single();

    if (fetchError) throw fetchError;

    // 3. Calcular nuevos valores
    const currentPaid = parseFloat(receivable.amount_paid || 0);
    const totalAmount = parseFloat(receivable.amount || 0);
    const newPaidAmount = currentPaid + amountToPay;
    const newBalanceDue = Math.max(0, totalAmount - newPaidAmount);

    let newStatus = receivable.status;
    if (newBalanceDue <= 0) {
      newStatus = 'Paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'Partial';
    }

    // 4. Insertar en la tabla 'payments' (Audit log de pagos)
    // EXPLICITAMENTE NO incluir 'receivable_id' aquí
    const paymentRecord = {
      client_id: clientId,
      unit_id: unitId,
      amount: amountToPay,
      payment_date: dateOfPayment,
      Market_tec_Referencia: ref
    };

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([paymentRecord])
      .select('id')
      .single();

    if (paymentError) throw paymentError;

    // 5. Vincular el pago con el movimiento en 'payment_applications'
    const { error: appError } = await supabase
      .from('payment_applications')
      .insert([{
        payment_id: payment.id,
        receivable_id: targetReceivableId,
        amount_applied: amountToPay
      }]);

    if (appError) throw appError;

    // 6. La actualización del saldo y estado del movimiento es manejada por un trigger de la BD
    // NO actualizar manualmente aquí para evitar duplicidad

    return { success: true, data: payment, error: null };
  } catch (error) {
    console.error('Error al registrar pago:', error);
    return { success: false, data: null, error };
  }
};

/**
 * Cancela múltiples receivables (actualiza su estado a 'Cancelled')
 * @param {array} ids - Array de IDs de receivables a cancelar
 * @returns {Promise<{success: boolean, error: object}>}
 */
export const cancelReceivables = async (ids) => {
  try {
    if (!ids || ids.length === 0) return { success: true, error: null };

    const { error } = await supabase
      .from('receivables')
      .update({ status: 'Cancelado' })
      .in('id', ids);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error al cancelar receivables:', error);
    return { success: false, error };
  }
};

/**
 * Revierte el pago de un receivable:
 * 1. Identifica los IDs de pago en payment_applications.
 * 2. Elimina los registros en la tabla 'payments' (CASCADE eliminará payment_applications automáticamente).
 * 3. El trigger de la BD actualizará automáticamente receivables.amount_paid y status.
 * @param {number} receivableId - ID del receivable
 * @returns {Promise<{success: boolean, error: object}>}
 */
export const revertPayment = async (receivableId) => {
  try {
    // 1. Obtener IDs de pago asociados
    const { data: applications, error: fetchError } = await supabase
      .from('payment_applications')
      .select('payment_id')
      .eq('receivable_id', receivableId);

    if (fetchError) throw fetchError;

    if (applications && applications.length > 0) {
      const paymentIds = applications.map(app => app.payment_id);

      // 2. Eliminar desde la tabla payments
      // El CASCADE eliminará payment_applications
      // El trigger de la BD actualizará receivables automáticamente
      const { error: deleteError } = await supabase
        .from('payments')
        .delete()
        .in('id', paymentIds);

      if (deleteError) throw deleteError;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error al revertir pago:', error);
    return { success: false, error };
  }
};

/**
 * Reactiva receivables cancelados de un contrato - cambia status de 'Cancelado' a 'Pending' o 'Overdue'
 * dependiendo de la fecha de vencimiento
 * @param {number} contractId - ID del contrato
 * @returns {Promise<{success: boolean, error: object}>}
 */
export const reactivateContractReceivables = async (contractId) => {
  try {
    // 1. Obtener todos los receivables cancelados del contrato
    const { data: cancelledReceivables, error: fetchError } = await supabase
      .from('receivables')
      .select('id, due_date')
      .eq('contract_id', contractId)
      .eq('status', 'Cancelado');

    if (fetchError) throw fetchError;

    if (!cancelledReceivables || cancelledReceivables.length === 0) {
      return { success: true, error: null };
    }

    // 2. Determinar el nuevo status para cada receivable basándose en due_date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updates = cancelledReceivables.map(r => {
      let newStatus = 'Pending';

      if (r.due_date) {
        const [year, month, day] = r.due_date.split('-').map(Number);
        const dueDate = new Date(year, month - 1, day);
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate < today) {
          newStatus = 'Pending'; // El mapeo lo convertirá a Overdue automáticamente
        }
      }

      return { id: r.id, status: newStatus };
    });

    // 3. Actualizar cada receivable
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('receivables')
        .update({ status: update.status })
        .eq('id', update.id);

      if (updateError) throw updateError;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error al reactivar receivables del contrato:', error);
    return { success: false, error };
  }
};
