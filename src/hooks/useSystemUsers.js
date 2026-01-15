import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getSystemUsers } from '../services/userService'

export const useSystemUsers = (unitId = null) => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const loadUsers = useCallback(async () => {
        // setLoading(true) // Silencioso para actualizaciones realtime
        setError(null)
        try {
            const { data, error } = await getSystemUsers(unitId)
            if (error) throw error
            setUsers(data || [])
        } catch (err) {
            console.error('Error al cargar usuarios del sistema:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [unitId])

    useEffect(() => {
        loadUsers()

        // Configuración de Realtime para usuarios del sistema
        const channel = supabase
            .channel('realtime_system_users')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'system_users'
                    // No filtramos por unitId aquí para que sea global o manejado por el hook
                    // Pero si unitId está presente y quisiéramos ser específicos:
                    // filter: unitId ? `unit_id=eq.${unitId}` : undefined
                },
                () => {
                    console.log('Cambio detectado en system_users, recargando...')
                    loadUsers()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [loadUsers])

    return {
        users,
        loading,
        error,
        refreshUsers: loadUsers
    }
}
