// src/hooks/useAuth.js
// Hook personalizado para manejar autenticación con Supabase

import { useState, useEffect } from 'react'
import { signIn, signOut, getCurrentUser, onAuthStateChange } from '../services/authService'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar usuario al montar el componente
  useEffect(() => {
    let isMounted = true
    let timeoutId = null

    const loadUser = async () => {
      try {
        // console.log('Cargando usuario actual...')
        // Timeout de seguridad: si tarda más de 5 segundos, cancelar
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Timeout al cargar usuario'))
          }, 5000)
        })

        const userPromise = getCurrentUser()
        const { data, error } = await Promise.race([userPromise, timeoutPromise])

        clearTimeout(timeoutId)

        if (!isMounted) return

        if (error) {
          console.warn('Error al obtener usuario actual:', error)

          // Si es un error temporal (ej. durante refresh de token), NO limpiar usuario
          if (error.isTemporary) {
            console.log('Error temporal de perfil, manteniendo sesión actual')
            // No hacer nada - mantener el usuario actual
            return
          }

          // Si hay error REAL, establecer el mensaje y limpiar usuario
          if (error.message && !error.message.includes('session') && !error.message.includes('Auth session missing')) {
            setError(error.message)
          } else {
            setError('La sesión se cerró. Por favor inicia sesión de nuevo.')
          }
          setUser(null)
        } else {
          console.log('Usuario cargado:', data ? data.email : 'ninguno')
          setUser(data)
        }
      } catch (err) {
        clearTimeout(timeoutId)
        if (!isMounted) return

        console.warn('Error o timeout al cargar usuario:', err.message)
        // No es crítico, solo significa que no hay usuario autenticado
        setUser(null)
        setError(null) // Limpiar error para no mostrar mensajes confusos
      } finally {
        if (isMounted) {
          setLoading(false)
          console.log('Carga inicial completada')
        }
      }
    }

    loadUser()

    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      console.log('Auth state changed:', event, session?.user?.email);
      if (session?.user) {
        // El servicio onAuthStateChange ya incluye el perfil completo si está disponible
        // Si no tiene perfil completo (sin role), no establecer el usuario
        // Esto forzará que se muestre la pantalla de login
        // Validar que el rol sea uno de los permitidos por la aplicación
        // Supabase por defecto envía user.role = 'authenticated', lo cual NO es suficiente
        const validRoles = ['Admin', 'Client', 'SuperAdmin', 'Staff'];
        if (session.user.role && validRoles.includes(session.user.role)) {
          // Si tiene role válido (app), establecer usuario
          setUser(session.user)
        } else {
          // Si no tiene role válido (ej. solo 'authenticated' o undefined), no establecer usuario
          console.warn(`⚠️ useAuth: Usuario con rol inválido (${session.user.role}), no estableciendo usuario`)
          setUser(null)
          // No seteamos error fatal para permitir que intente cargar de nuevo o mostrar login
        }
      } else {
        // No hay sesión, establecer user = null
        setUser(null)
        if (event === 'SIGNED_OUT') {
          setError(null) // Limpiar error al cerrar sesión explícitamente
        }
      }
      setLoading(false)
    })

    // Limpiar suscripción y timeout al desmontar
    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
      subscription?.unsubscribe()
    }
  }, [])

  // Función para iniciar sesión
  const login = async (email, password) => {
    console.log('Iniciando login para:', email);
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await signIn(email, password)
      console.log('Resultado de signIn:', { hasData: !!data, hasError: !!error, error });

      // Si hay error, mostrarlo
      if (error) {
        const errorMessage = error.message || 'Error al iniciar sesión'
        console.error('Error en login:', errorMessage);
        setError(errorMessage)
        setLoading(false) // Asegurar que loading se resetee
        return { success: false, error: { message: errorMessage } }
      }

      // Verificar que se obtuvo el usuario con perfil
      if (!data?.user) {
        const errorMessage = 'No se pudo obtener el perfil del usuario'
        console.error('Error: No se obtuvo usuario');
        setError(errorMessage)
        setLoading(false)
        return { success: false, error: { message: errorMessage } }
      }

      // Verificar que el usuario tiene un rol válido de aplicación
      const validRoles = ['Admin', 'Client', 'SuperAdmin', 'Staff'];
      if (!data.user.role || !validRoles.includes(data.user.role)) {
        const errorMessage = 'Usuario sin rol de aplicación asignado'
        console.error('Error: Usuario sin rol válido:', data.user.role);
        setError(errorMessage)
        setLoading(false)
        return { success: false, error: { message: errorMessage } }
      }

      console.log('Login exitoso, estableciendo usuario:', data.user.email, 'rol:', data.user.role);
      // El servicio signIn ya incluye el perfil completo del usuario
      // (buscado automáticamente en system_users o client_portal_users)
      setUser(data.user)
      setLoading(false) // Asegurar que loading se resetee antes de retornar
      return { success: true, error: null }
    } catch (err) {
      console.error('Excepción en login:', err);
      const errorMessage = err.message || 'Error inesperado al iniciar sesión'
      setError(errorMessage)
      setLoading(false)
      return { success: false, error: { message: errorMessage } }
    }
  }

  // Función para cerrar sesión
  const logout = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await signOut()
      if (error) {
        console.warn('Error al cerrar sesión:', error)
        // Continuar de todos modos para limpiar el estado local
      }
      // Limpiar estado local independientemente del resultado
      setUser(null)
      return { success: true, error: null }
    } catch (err) {
      console.warn('Error inesperado al cerrar sesión:', err)
      // Limpiar estado local incluso si hay error
      setUser(null)
      return { success: true, error: null }
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  }
}

