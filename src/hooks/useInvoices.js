// src/hooks/useInvoices.js
// Hook personalizado para manejar facturas/CXC con Supabase

import { useState, useEffect, useMemo } from 'react'
import { 
  getInvoices, 
  getOverdueInvoices, 
  getPendingInvoices,
  getScheduledInvoices,
  getUpcomingReminders,
  createInvoice, 
  updateInvoice, 
  updateInvoiceStatus,
  deleteInvoice 
} from '../services/invoiceService'

export const useInvoices = (filters = {}) => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar facturas al montar o cuando cambien los filtros
  useEffect(() => {
    // Si no hay filtros válidos, no cargar
    if (!filters || (!filters.unitId && !filters.clientId)) {
      setLoading(false)
      setInvoices([])
      return
    }

    const loadInvoices = async () => {
      setLoading(true)
      setError(null)
      try {
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
    }

    loadInvoices()
  }, [JSON.stringify(filters)])

  // Función para agregar una nueva factura
  const addInvoice = async (invoiceData) => {
    try {
      const { data, error } = await createInvoice(invoiceData)
      if (error) throw error
      
      // Actualizar la lista local
      setInvoices(prev => [...prev, data])
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
      
      // Actualizar la lista local
      setInvoices(prev => prev.map(invoice => 
        invoice.id === id ? data : invoice
      ))
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
      
      // Actualizar la lista local
      setInvoices(prev => prev.map(invoice => 
        invoice.id === id ? data : invoice
      ))
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
      
      // Actualizar la lista local
      setInvoices(prev => prev.filter(invoice => invoice.id !== id))
      return { success: true, error: null }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err }
    }
  }

  // Función para recargar facturas
  const refreshInvoices = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await getInvoices(filters)
      if (error) throw error
      setInvoices(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
      // amount ya viene como string formateado desde el servicio
      const amount = parseFloat(inv.amount?.replace(/[^0-9.-]+/g, '') || 0)
      return acc + amount
    }, 0), 
    [invoices]
  )

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

