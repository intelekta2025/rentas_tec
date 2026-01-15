// src/hooks/useInvoices.js
// Hook personalizado para manejar facturas/CXC con Supabase

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase';
import {
  getInvoices,
  getOverdueInvoices,
  getUpcomingReminders,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  registerPayment
} from '../services/invoiceService'

export const useInvoices = (user, filters = {}) => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Envolvemos fetchInvoices en useCallback para poder llamarlo desde el listener
  const fetchInvoices = useCallback(async () => {
    // Si no hay user o filtros válidos, no cargar
    // Permitir carga si hay filtros explícitos (ej. clientId) aunque no haya unitId en user
    // Pero para realtime necesitamos user.unitId comúnmente, o validamos en el listener.
    if (!filters || (!user?.unitId && !filters.clientId && !filters.unitId)) {
      setLoading(false)
      return;
    }

    setLoading(true)
    setError(null)
    try {
      // Combinar filtros con user.unitId si es necesario, 
      // aunque `getInvoices` ya espera filters con unitId/clientId.
      // Asumimos que `filters` ya viene preparado por el consumidor (App.jsx)
      const { data, error } = await getInvoices(filters)
      if (error) throw error
      setInvoices(data || [])
    } catch (err) {
      console.error('Error al cargar facturas:', err)
      setError(err.message)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters), user?.unitId]) // Dependencias del fetch

  useEffect(() => {
    // 1. Carga inicial
    fetchInvoices();

    // 2. Suscripción a Realtime (Solo si tenemos unitId para filtrar)
    // Escochamos cambios en la unidad del usuario (Dashboard Admin)
    if (user?.unitId) {
      const channel = supabase
        .channel('realtime_receivables')
        .on(
          'postgres_changes',
          {
            event: '*', // Escuchar INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'receivables',
            filter: `unit_id=eq.${user.unitId}` // IMPORTANTE: Filtrar por unidad
          },
          (payload) => {
            console.log('Cambio detectado en BD (Receivables):', payload);
            fetchInvoices();
          }
        )
        .subscribe();

      // 3. Cleanup al desmontar
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchInvoices, user?.unitId]);

  // Función para agregar una nueva factura
  const addInvoice = async (invoiceData) => {
    try {
      const { data, error } = await createInvoice(invoiceData)
      if (error) throw error

      // Actualizar la lista local
      await fetchInvoices(); // Mejor recargar para asegurar consistencia
      return { success: true, data, error: null }
    } catch (err) {
      setError(err.message)
      return { success: false, data: null, error: err }
    }
  }

  // Función para actualizar una factura
  const editInvoice = async (id, invoiceData) => {
    try {
      const { data, error } = await updateInvoice(id, invoiceData)
      if (error) throw error

      await fetchInvoices();
      return { success: true, data, error: null }
    } catch (err) {
      setError(err.message)
      return { success: false, data: null, error: err }
    }
  }

  // Función para actualizar el estado de una factura
  const changeStatus = async (id, status) => {
    try {
      const { data, error } = await updateInvoiceStatus(id, status)
      if (error) throw error

      await fetchInvoices();
      return { success: true, data, error: null }
    } catch (err) {
      setError(err.message)
      return { success: false, data: null, error: err }
    }
  }

  // Función para eliminar una factura
  const removeInvoice = async (id) => {
    try {
      const { error } = await deleteInvoice(id)
      if (error) throw error

      await fetchInvoices();
      return { success: true, error: null }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err }
    }
  }

  // Función para registrar un pago
  const addPayment = async (paymentData) => {
    try {
      const { data, error } = await registerPayment(paymentData);
      if (error) throw error;

      await fetchInvoices();
      return { success: true, data, error: null };
    } catch (err) {
      setError(err.message);
      return { success: false, data: null, error: err };
    }
  };

  // Alias para mantener compatibilidad si se usa refreshInvoices
  const refreshInvoices = fetchInvoices;

  // Valores calculados
  const overdueInvoices = useMemo(() =>
    invoices.filter(inv => inv.status === 'Overdue'),
    [invoices]
  )

  const pendingInvoices = useMemo(() =>
    invoices.filter(inv => inv.status === 'Pending'),
    [invoices]
  )

  const totalAmount = useMemo(() =>
    invoices.reduce((acc, inv) => {
      if (['cancelled', 'cancelado'].includes((inv.status || '').toLowerCase())) return acc;
      const balance = inv.balanceDueRaw || 0;
      return acc + balance;
    }, 0),
    [invoices]
  );

  return {
    invoices,
    overdueInvoices,
    pendingInvoices,
    totalAmount,
    loading,
    error,
    addInvoice,
    editInvoice,
    changeStatus,
    removeInvoice,
    refreshInvoices,
    addPayment,
  }
}

/**
 * Hook especializado para facturas vencidas
 */
export const useOverdueInvoices = (unitId = null) => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadOverdue = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await getOverdueInvoices(unitId)
        if (error) throw error
        setInvoices(data || [])
      } catch (err) {
        setError(err.message)
        setInvoices([])
      } finally {
        setLoading(false)
      }
    }

    loadOverdue()
  }, [unitId])

  return { invoices, loading, error }
}

/**
 * Hook especializado para recordatorios próximos
 */
export const useUpcomingReminders = (unitId = null, daysAhead = 30) => {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadReminders = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await getUpcomingReminders(unitId, daysAhead)
        if (error) throw error
        setReminders(data || [])
      } catch (err) {
        setError(err.message)
        setReminders([])
      } finally {
        setLoading(false)
      }
    }

    loadReminders()
  }, [unitId, daysAhead])

  return { reminders, loading, error }
}

