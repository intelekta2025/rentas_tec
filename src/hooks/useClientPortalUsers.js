// src/hooks/useClientPortalUsers.js
// Hook personalizado para obtener usuarios del portal de un cliente

import { useState, useEffect } from 'react'
import { getClientPortalUsers } from '../services/clientPortalUsersService'

export const useClientPortalUsers = (clientId) => {
  const [portalUsers, setPortalUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!clientId) {
      setPortalUsers([])
      setLoading(false)
      return
    }

    const loadPortalUsers = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await getClientPortalUsers(clientId)
        if (error) throw error
        setPortalUsers(data || [])
      } catch (err) {
        console.error('Error al cargar usuarios del portal:', err)
        setError(err.message)
        setPortalUsers([])
      } finally {
        setLoading(false)
      }
    }

    loadPortalUsers()
  }, [clientId])

  return {
    portalUsers,
    loading,
    error,
  }
}

