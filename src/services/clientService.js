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
      .select('*, receivables(amount, balance, status, due_date, contract_id), contracts(id, status)')
      .order('business_name', { ascending: true }) // Usar business_name en lugar de name

    // Filtrar por unitId si se proporciona
    if (unitId !== null) {
      query = query.eq('unit_id', unitId)
    }

    const { data, error } = await query

    if (error) throw error



    // Mapear los datos al formato del frontend y calcular totales
    const mappedData = (data || []).map(client => {
      // Obtener IDs de contratos activos
      const activeContractIds = (client.contracts || [])
        .filter(contract => contract.status === 'Activo')
        .map(contract => contract.id)

      // Filtrar receivables solo de contratos activos
      const receivables = (client.receivables || [])
        .filter(r => r.contract_id && activeContractIds.includes(r.contract_id))

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
    console.error('Error fetching clients:', error)
    return { data: [], error }
  }
}

/**
 * Obtiene estadísticas de cobranza: clientes con deuda vencida
 * @param {number|null} unitId 
 */
export const getCollectionStats = async (unitId = null) => {
  try {
    // 1. Obtener clientes activos con sus contratos y receivables
    let query = supabase
      .from('clients')
      .select(`
        id, 
        business_name, 
        contact_name,
        contact_email, 
        contact_phone, 
        User_market_tec,
        status,
        contracts(id, status),
        receivables(id, contract_id, concept, due_date, amount, balance, status, type)
      `)
      .eq('status', 'Activo')
      .order('business_name');

    if (unitId) {
      query = query.eq('unit_id', unitId);
    }

    const { data: clients, error } = await query;
    if (error) throw error;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const clientsWithOverdue = clients.map(client => {
      // Filtrar contratos activos
      const activeContractIds = (client.contracts || [])
        .filter(c => c.status === 'Activo')
        .map(c => c.id);

      if (activeContractIds.length === 0) return null;

      // Filtrar receivables vencidos de contratos activos
      // Regla: status != 'Paid' AND due_date < today
      const overdueInvoices = (client.receivables || []).filter(inv => {
        // Solo considerar invoices de contratos activos (o sin contrato si fuera el caso, pero el req dice contratos activos)
        // Asumimos que si tiene contract_id debe ser uno activo. Si no tiene contract_id, ¿qué hacemos? 
        // El prompt dice "considera solo clientes activos y contratos activos".
        if (!inv.contract_id || !activeContractIds.includes(inv.contract_id)) {
          return false;
        }

        // Checar estatus pagado
        if (inv.status === 'Paid' || inv.status === 'Pagado') return false;

        // Checar fecha vencimiento
        if (!inv.due_date) return false;
        const dueDate = new Date(inv.due_date);
        // Ajuste zona horaria simple para evitar falsos positivos por horas
        const dueDateSimple = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

        return dueDateSimple < today;
      }).map(inv => {
        // Calcular días vencidos
        const dueDate = new Date(inv.due_date);
        const diffTime = Math.abs(today - dueDate);
        const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const balance = typeof inv.balance === 'string' ? parseFloat(inv.balance.replace(/[^0-9.-]+/g, '')) : (inv.balance || 0);

        return {
          id: `inv_${inv.id}`, // Prefijo para evitar colisiones en frontend key
          originalId: inv.id,
          concept: inv.concept,
          date: inv.due_date, // Usamos due_date como referencia principal o deberíamos usar issue_date? El mock usa 'date' visualmente.
          dueDate: inv.due_date, // Campo adicional para el webhook
          daysOverdue: daysOverdue,
          amount: balance, // El monto es el balance pendiente
          status: daysOverdue > 30 ? 'Vencido Critico' : 'Vencido',
          type: inv.type || null
        };
      });

      if (overdueInvoices.length === 0) return null;

      return {
        id: `c_${client.id}`,
        originalId: client.id,
        clientName: client.business_name,
        contact: client.contact_name,
        email: client.contact_email,
        contactEmail: client.contact_email,
        contactPhone: client.contact_phone,
        marketTecReceiver: client.User_market_tec,
        lastContact: 'N/A', // No tenemos este dato en BD aún
        invoices: overdueInvoices
      };
    }).filter(c => c !== null);

    return { data: clientsWithOverdue, error: null };

  } catch (error) {
    console.error('Error in getCollectionStats:', error);
    return { data: [], error };
  }
};

/**
 * Obtiene estadísticas de receivables pendientes (Por Cobrar)
 * Similar a getCollectionStats pero incluye TODOS los receivables no pagados
 * @param {number|null} unitId 
 */
export const getPendingReceivablesStats = async (unitId = null) => {
  try {
    let query = supabase
      .from('clients')
      .select(`
        id, 
        business_name, 
        contact_name,
        contact_email, 
        contact_phone, 
        User_market_tec,
        status,
        contracts(id, status),
        receivables(id, contract_id, concept, due_date, amount, balance, status, type)
      `)
      .eq('status', 'Activo')
      .order('business_name');

    if (unitId) {
      query = query.eq('unit_id', unitId);
    }

    const { data: clients, error } = await query;
    if (error) throw error;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const clientsWithPending = clients.map(client => {
      const activeContractIds = (client.contracts || [])
        .filter(c => c.status === 'Activo')
        .map(c => c.id);

      if (activeContractIds.length === 0) return null;

      const pendingInvoices = (client.receivables || []).filter(inv => {
        if (!inv.contract_id || !activeContractIds.includes(inv.contract_id)) {
          return false;
        }
        const statusLower = (inv.status || '').toLowerCase();
        if (statusLower === 'paid' || statusLower === 'pagado' || statusLower === 'cancelled' || statusLower === 'cancelado') return false;
        const balance = typeof inv.balance === 'string' ? parseFloat(inv.balance.replace(/[^0-9.-]+/g, '')) : (inv.balance || 0);
        return balance > 0;
      }).map(inv => {
        const dueDate = inv.due_date ? new Date(inv.due_date) : null;
        let daysOverdue = 0;
        let isOverdue = false;

        if (dueDate) {
          const dueDateSimple = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
          const diffTime = today - dueDateSimple;
          daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          isOverdue = daysOverdue > 0;
        }

        const balance = typeof inv.balance === 'string' ? parseFloat(inv.balance.replace(/[^0-9.-]+/g, '')) : (inv.balance || 0);

        return {
          id: `inv_${inv.id}`,
          originalId: inv.id,
          concept: inv.concept,
          date: inv.due_date,
          dueDate: inv.due_date,
          daysOverdue: isOverdue ? daysOverdue : 0,
          isOverdue: isOverdue,
          amount: balance,
          status: isOverdue ? (daysOverdue > 60 ? 'Crítico' : daysOverdue > 30 ? 'Vencido 31-60' : 'Vencido 1-30') : 'Al día',
          type: inv.type || null
        };
      });

      if (pendingInvoices.length === 0) return null;

      return {
        id: `c_${client.id}`,
        originalId: client.id,
        clientName: client.business_name,
        contact: client.contact_name,
        email: client.contact_email,
        contactEmail: client.contact_email,
        contactPhone: client.contact_phone,
        marketTecReceiver: client.User_market_tec,
        invoices: pendingInvoices
      };
    }).filter(c => c !== null);

    return { data: clientsWithPending, error: null };

  } catch (error) {
    console.error('Error in getPendingReceivablesStats:', error);
    return { data: [], error };
  }
};

/**
 * Obtiene receivables del próximo mes (Proyección de Ingresos)
 * @param {number|null} unitId 
 */
export const getNextMonthReceivables = async (unitId = null) => {
  try {
    let query = supabase
      .from('clients')
      .select(`
        id, 
        business_name, 
        contact_name,
        contact_email, 
        contact_phone, 
        User_market_tec,
        status,
        contracts(id, status),
        receivables(id, contract_id, concept, due_date, amount, balance, status, type, period_month, period_year)
      `)
      .eq('status', 'Activo')
      .order('business_name');

    if (unitId) {
      query = query.eq('unit_id', unitId);
    }

    const { data: clients, error } = await query;
    if (error) throw error;

    const now = new Date();
    let nextMonth = now.getMonth() + 2; // +1 for 0-indexed, +1 for next month
    let nextYear = now.getFullYear();
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }

    const clientsWithNextMonth = clients.map(client => {
      const activeContractIds = (client.contracts || [])
        .filter(c => c.status === 'Activo')
        .map(c => c.id);

      if (activeContractIds.length === 0) return null;

      // Filter receivables for next month
      const nextMonthInvoices = (client.receivables || []).filter(inv => {
        if (!inv.contract_id || !activeContractIds.includes(inv.contract_id)) {
          return false;
        }

        // Check if cancelled or paid
        const statusLower = (inv.status || '').toLowerCase();
        if (statusLower === 'paid' || statusLower === 'pagado' || statusLower === 'cancelled' || statusLower === 'cancelado') return false;

        // Check due date for next month
        if (inv.due_date) {
          const dueDate = new Date(inv.due_date);
          const dueMonth = dueDate.getMonth() + 1;
          const dueYear = dueDate.getFullYear();
          if (dueMonth === nextMonth && dueYear === nextYear) return true;
        }

        // Check period for next month
        if (inv.period_month && inv.period_year) {
          if (inv.period_month === nextMonth && inv.period_year === nextYear) return true;
        }

        return false;
      }).map(inv => {
        const balance = typeof inv.balance === 'string' ? parseFloat(inv.balance.replace(/[^0-9.-]+/g, '')) : (inv.balance || 0);
        const amount = typeof inv.amount === 'string' ? parseFloat(inv.amount.replace(/[^0-9.-]+/g, '')) : (inv.amount || 0);

        return {
          id: `inv_${inv.id}`,
          originalId: inv.id,
          concept: inv.concept,
          dueDate: inv.due_date,
          amount: amount,
          balance: balance,
          status: inv.status,
          type: inv.type || null
        };
      });

      if (nextMonthInvoices.length === 0) return null;

      return {
        id: `c_${client.id}`,
        originalId: client.id,
        clientName: client.business_name,
        contact: client.contact_name,
        email: client.contact_email,
        contactEmail: client.contact_email,
        contactPhone: client.contact_phone,
        marketTecReceiver: client.User_market_tec,
        invoices: nextMonthInvoices
      };
    }).filter(c => c !== null);

    return { data: clientsWithNextMonth, error: null, nextMonth, nextYear };

  } catch (error) {
    console.error('Error in getNextMonthReceivables:', error);
    return { data: [], error };
  }
};
export const createClient = async (clientData) => {
  try {
    // Mapear datos al formato de BD
    const dbData = mapClientToDB(clientData)

    const { data, error } = await supabase
      .from('clients')
      .insert([dbData])
      .select()

    if (error) throw error

    return { data: mapClientFromDB(data[0]), error: null }
  } catch (error) {
    console.error('Error creating client:', error)
    return { data: null, error }
  }
}

export const updateClient = async (id, clientData) => {
  try {
    const dbData = mapClientToDB(clientData)

    const { data, error } = await supabase
      .from('clients')
      .update(dbData)
      .eq('id', id)
      .select()

    if (error) throw error

    return { data: mapClientFromDB(data[0]), error: null }
  } catch (error) {
    console.error('Error updating client:', error)
    return { data: null, error }
  }
}

export const deleteClient = async (id) => {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error deleting client:', error)
    return { error }
  }
}
