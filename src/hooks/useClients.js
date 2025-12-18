// src/hooks/useClients.js
// Hook personalizado para manejar clientes con Supabase

import { useState, useEffect } from 'react'
import { getClients, createClient, updateClient, deleteClient } from '../services/clientService'

export const useClients = (unitId = null) => {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar clientes al montar o cuando cambie unitId
  useEffect(() => {
    // Si unitId es null, no cargar (puede ser un cliente, no un admin)
    if (unitId === null) {
      setLoading(false)
      setClients([])
      return
    }

    const loadClients = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await getClients(unitId)
        if (error) throw error
        setClients(data || [])
      } catch (err) {
        console.error('Error al cargar clientes:', err)
        setError(err.message)
        setClients([])
      } finally {
        setLoading(false)
      }
    }

    loadClients()
  }, [unitId])

  // Función para agregar un nuevo cliente
  const addClient = async (clientData) => {
    try {
      const { data, error } = await createClient(clientData)
      if (error) throw error
      
      // Actualizar la lista local
      setClients(prev => [...prev, data])
      return { success: true, data, error: null }
    } catch (err) {
      setError(err.message)
      return { success: false, data: null, error: err }
    }
  }

  // Función para actualizar un cliente
  const editClient = async (id, clientData) => {
    try {
      const { data, error } = await updateClient(id, clientData)
      if (error) throw error
      
      // Actualizar la lista local
      setClients(prev => prev.map(client => 
        client.id === id ? data : client
      ))
      return { success: true, data, error: null }
    } catch (err) {
      setError(err.message)
      return { success: false, data: null, error: err }
    }
  }

  // Función para eliminar un cliente
  const removeClient = async (id) => {
    try {
      const { error } = await deleteClient(id)
      if (error) throw error
      
      // Actualizar la lista local
      setClients(prev => prev.filter(client => client.id !== id))
      return { success: true, error: null }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err }
    }
  }

  // Función para recargar clientes
  const refreshClients = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await getClients(unitId)
      if (error) throw error
      setClients(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    clients,
    loading,
    error,
    addClient,
    editClient,
    removeClient,
    refreshClients,
  }
}

