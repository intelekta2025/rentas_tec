import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getClients, createClient, updateClient, deleteClient } from '../services/clientService'

export const useClients = (user) => {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchClients = useCallback(async () => {
    // Si no hay user o unitId, no cargar
    if (!user?.unitId) {
      setLoading(false)
      setClients([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { data, error } = await getClients(user.unitId)
      if (error) throw error
      setClients(data || [])
    } catch (err) {
      console.error('Error al cargar clientes:', err)
      setError(err.message)
      setClients([])
    } finally {
      setLoading(false)
    }
  }, [user?.unitId])

  // Cargar clientes al montar o cuando cambie unitId
  useEffect(() => {
    fetchClients()

    // Suscripción Realtime
    if (user?.unitId) {
      const channel = supabase
        .channel('realtime_clients')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'clients',
            filter: `unit_id=eq.${user.unitId}`
          },
          (payload) => {
            console.log('Cambio detectado en BD (Clients):', payload);
            fetchClients(); // Recargar lista
          }
        )
        .subscribe();

      // Cleanup
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchClients, user?.unitId])

  // Función para agregar un nuevo cliente
  const addClient = async (clientData) => {
    try {
      const { data, error } = await createClient(clientData)
      if (error) throw error

      // La lista se actualizará por Realtime, pero para feedback inmediato podemos actualizar local
      // O esperamos al realtime. Si usamos realtime, mejor no duplicar.
      // Pero el realtime puede tener un pequeño delay.
      // El user dijo: "si creas un cliente en el modal, la lista de atrás se actualice sola instantáneamente."
      // lo cual sugiere que el realtime lo hará.

      // Aún así, un refetch manual no duele para asegurar sync si el realtime falla o tarda.
      await fetchClients();

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

      await fetchClients();
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

      await fetchClients();
      return { success: true, error: null }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err }
    }
  }

  // Alias para mantener compatibilidad
  const refreshClients = fetchClients;

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

