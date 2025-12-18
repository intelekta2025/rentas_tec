// src/hooks/usePayments.js
// Hook personalizado para manejar pagos con Supabase

import { useState, useEffect } from 'react'
import { getPayments, getPaymentHistory, createPayment, updatePayment, deletePayment } from '../services/paymentService'

export const usePayments = (clientId = null, unitId = null) => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar pagos al montar o cuando cambien los filtros
  useEffect(() => {
    const loadPayments = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await getPayments(clientId, unitId)
        if (error) throw error
        setPayments(data || [])
      } catch (err) {
        setError(err.message)
        setPayments([])
      } finally {
        setLoading(false)
      }
    }

    loadPayments()
  }, [clientId, unitId])

  // Función para agregar un nuevo pago
  const addPayment = async (paymentData) => {
    try {
      const { data, error } = await createPayment(paymentData)
      if (error) throw error
      
      // Actualizar la lista local
      setPayments(prev => [data, ...prev])
      return { success: true, data, error: null }
    } catch (err) {
      setError(err.message)
      return { success: false, data: null, error: err }
    }
  }

  // Función para actualizar un pago
  const editPayment = async (id, paymentData) => {
    try {
      const { data, error } = await updatePayment(id, paymentData)
      if (error) throw error
      
      // Actualizar la lista local
      setPayments(prev => prev.map(payment => 
        payment.id === id ? data : payment
      ))
      return { success: true, data, error: null }
    } catch (err) {
      setError(err.message)
      return { success: false, data: null, error: err }
    }
  }

  // Función para eliminar un pago
  const removePayment = async (id) => {
    try {
      const { error } = await deletePayment(id)
      if (error) throw error
      
      // Actualizar la lista local
      setPayments(prev => prev.filter(payment => payment.id !== id))
      return { success: true, error: null }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err }
    }
  }

  // Función para recargar pagos
  const refreshPayments = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await getPayments(clientId, unitId)
      if (error) throw error
      setPayments(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    payments,
    loading,
    error,
    addPayment,
    editPayment,
    removePayment,
    refreshPayments,
  }
}

/**
 * Hook especializado para historial de pagos de un cliente
 */
export const usePaymentHistory = (clientId, limit = null) => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!clientId) {
      setPayments([])
      setLoading(false)
      return
    }

    const loadHistory = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await getPaymentHistory(clientId, limit)
        if (error) throw error
        setPayments(data || [])
      } catch (err) {
        setError(err.message)
        setPayments([])
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [clientId, limit])

  return { payments, loading, error }
}

