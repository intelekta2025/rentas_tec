import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase' // Importar supabase
import { getClientPortalUsers } from '../services/clientPortalUsersService'

export const useClientPortalUsers = (clientId) => {
  const [portalUsers, setPortalUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Envolvemos en useCallback
  const loadPortalUsers = useCallback(async () => {
    if (!clientId) {
      setPortalUsers([]);
      return;
    }
    // setLoading(true); // Silencioso
    setError(null)
    try {
      const { data, error } = await getClientPortalUsers(clientId)
      if (error) throw error
      setPortalUsers(data || [])
    } catch (err) {
      console.error('Error al cargar usuarios del portal:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [clientId]);

  useEffect(() => {
    loadPortalUsers();

    if (clientId) {
      // LOGICA REALTIME AÑADIDA
      const channel = supabase
        .channel(`realtime_portal_users_${clientId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'client_portal_users',
            filter: `client_id=eq.${clientId}`
          },
          () => loadPortalUsers()
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    }
  }, [loadPortalUsers, clientId])

  return {
    portalUsers,
    loading,
    error,
    refreshPortalUsers: loadPortalUsers // Exponemos refresh por si acaso
  }
}
