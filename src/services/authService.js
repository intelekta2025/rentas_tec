// src/services/authService.js
// Servicio para operaciones de autenticación con Supabase

import { supabase } from '../lib/supabase'

/**
 * Obtiene el perfil de un usuario desde la tabla de system_users (administradores)
 * @param {string} userId - UUID del usuario
 * @returns {Promise<{data: object|null, error: object}>}
 */
const getStaffProfile = async (userId) => {
  try {
    console.log('👤 getStaffProfile: Consultando system_users para userId:', userId)
    
    // Crear promesa con timeout de 5 segundos
    const queryPromise = supabase
      .from('system_users') // Tabla para administradores
      .select('*')
      .eq('id', userId)
      .single()
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout: Consulta a system_users tardó más de 5 segundos'))
      }, 5000)
    })
    
    const startTime = Date.now()
    const { data, error } = await Promise.race([queryPromise, timeoutPromise])
    const elapsedTime = Date.now() - startTime
    console.log(`👤 getStaffProfile: Consulta completada en ${elapsedTime}ms`)

    // PGRST116 = no rows returned (es normal si no existe)
    if (error && error.code !== 'PGRST116') {
      // Si es un error de permisos o RLS, retornar error más descriptivo
      if (error.message?.includes('permission') || error.message?.includes('policy')) {
        console.error('❌ getStaffProfile: Error de permisos')
        return { 
          data: null, 
          error: { 
            message: 'Error de permisos al acceder a system_users. Verifica las políticas RLS.',
            originalError: error 
          } 
        }
      }
      if (error.message?.includes('Timeout')) {
        console.error('⏱️ getStaffProfile: Timeout en la consulta')
        throw error
      }
      throw error
    }

    console.log('✅ getStaffProfile: Resultado:', data ? 'Perfil encontrado' : 'No encontrado')
    return { data: data || null, error: null }
  } catch (error) {
    console.error('❌ getStaffProfile: Error:', error.message)
    return { 
      data: null, 
      error: { 
        message: error.message || 'Error al consultar system_users',
        originalError: error 
      } 
    }
  }
}

/**
 * Obtiene el perfil de un usuario desde la tabla de client_portal_users (clientes)
 * @param {string} userId - UUID del usuario
 * @returns {Promise<{data: object|null, error: object}>}
 */
const getClientUserProfile = async (userId) => {
  try {
    console.log('👤 getClientUserProfile: Consultando client_portal_users para userId:', userId)
    
    // Crear promesa con timeout de 5 segundos
    const queryPromise = supabase
      .from('client_portal_users') // Tabla para clientes
      .select('*')
      .eq('id', userId)
      .single()
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout: Consulta a client_portal_users tardó más de 5 segundos'))
      }, 5000)
    })
    
    const startTime = Date.now()
    const { data, error } = await Promise.race([queryPromise, timeoutPromise])
    const elapsedTime = Date.now() - startTime
    console.log(`👤 getClientUserProfile: Consulta completada en ${elapsedTime}ms`)

    // PGRST116 = no rows returned (es normal si no existe)
    if (error && error.code !== 'PGRST116') {
      // Si es un error de permisos o RLS, retornar error más descriptivo
      if (error.message?.includes('permission') || error.message?.includes('policy')) {
        console.error('❌ getClientUserProfile: Error de permisos')
        return { 
          data: null, 
          error: { 
            message: 'Error de permisos al acceder a client_portal_users. Verifica las políticas RLS.',
            originalError: error 
          } 
        }
      }
      if (error.message?.includes('Timeout')) {
        console.error('⏱️ getClientUserProfile: Timeout en la consulta')
        throw error
      }
      throw error
    }

    console.log('✅ getClientUserProfile: Resultado:', data ? 'Perfil encontrado' : 'No encontrado')
    return { data: data || null, error: null }
  } catch (error) {
    console.error('❌ getClientUserProfile: Error:', error.message)
    return { 
      data: null, 
      error: { 
        message: error.message || 'Error al consultar client_portal_users',
        originalError: error 
      } 
    }
  }
}

/**
 * Obtiene el perfil completo del usuario (busca en ambas tablas)
 * @param {string} userId - UUID del usuario
 * @returns {Promise<{data: object|null, error: object}>}
 */
const getUserProfile = async (userId) => {
  console.log('👤 getUserProfile: Buscando perfil para usuario:', userId)
  
  try {
    // Intentar obtener de staff primero
    console.log('👤 getUserProfile: Buscando en system_users...')
    const { data: staffProfile, error: staffError } = await getStaffProfile(userId)
    
    if (staffProfile) {
      console.log('✅ getUserProfile: Perfil encontrado en system_users')
      // Mapear datos de staff al formato del frontend
      return {
        data: {
          id: staffProfile.id,
          name: staffProfile.full_name,
          email: staffProfile.email,
          role: staffProfile.role,
          unitId: staffProfile.unit_id,
          clientId: null,
          clientName: null,
          // Mantener campos originales
          ...staffProfile,
        },
        error: null
      }
    }

    // Si no está en system_users, buscar en client_portal_users
    console.log('👤 getUserProfile: No encontrado en system_users, buscando en client_portal_users...')
    const { data: clientProfile, error: clientError } = await getClientUserProfile(userId)
    
    if (clientProfile) {
      console.log('✅ getUserProfile: Perfil encontrado en client_portal_users')
      // Obtener nombre del cliente desde la tabla clients (con timeout)
      let clientName = null
      if (clientProfile.client_id) {
        try {
          console.log('👤 getUserProfile: Obteniendo nombre del cliente...')
          const clientPromise = supabase
            .from('clients')
            .select('business_name')
            .eq('id', clientProfile.client_id)
            .single()
          
          const clientTimeout = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('Timeout al obtener nombre del cliente'))
            }, 5000) // 5 segundos para obtener el nombre del cliente
          })
          
          const { data: client, error: clientError } = await Promise.race([clientPromise, clientTimeout])
          
          // Si hay error al obtener el cliente, no es crítico, solo no tendremos el nombre
          if (!clientError && client) {
            clientName = client.business_name || null
            console.log('✅ getUserProfile: Nombre del cliente obtenido:', clientName)
          } else {
            console.warn('⚠️ getUserProfile: No se pudo obtener el nombre del cliente:', clientError?.message)
          }
        } catch (err) {
          console.warn('⚠️ getUserProfile: Error o timeout al consultar clients para obtener clientName:', err.message)
          // Continuar sin el nombre del cliente, no es crítico para el login
        }
      }

      // Mapear datos de client_user al formato del frontend
      // IMPORTANTE: Usuarios de client_portal_users SIEMPRE tienen rol 'Client'
      return {
        data: {
          id: clientProfile.id,
          name: clientProfile.full_name,
          email: clientProfile.email,
          role: 'Client', // Siempre 'Client' para usuarios de client_portal_users
          unitId: null,
          clientId: clientProfile.client_id,
          clientName: clientName,
          isActive: clientProfile.is_active,
          lastLogin: clientProfile.last_login,
          // Mantener campos originales (pero sobrescribir role)
          ...clientProfile,
          role: 'Client', // Asegurar que el role sea 'Client' incluso si está en los datos originales
        },
        error: null
      }
    }

    // Si no se encuentra en ninguna tabla
    console.warn('⚠️ getUserProfile: Usuario no encontrado en ninguna tabla de perfiles')
    return { data: null, error: null }
  } catch (error) {
    console.error('❌ getUserProfile: Error inesperado:', error)
    return {
      data: null,
      error: {
        message: error.message || 'Error al obtener perfil del usuario',
        originalError: error
      }
    }
  }
}

/**
 * Actualiza el último login de un usuario cliente
 * @param {string} userId - UUID del usuario
 * @returns {Promise<{error: object}>}
 */
const updateLastLogin = async (userId) => {
  try {
    // Intentar actualizar en client_portal_users
    const { error } = await supabase
      .from('client_portal_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId)

    // No es crítico si falla, solo es para tracking
    if (error) {
      console.warn('No se pudo actualizar last_login:', error)
    }

    return { error: null }
  } catch (error) {
    console.warn('Error al actualizar last_login:', error)
    return { error }
  }
}

/**
 * Inicia sesión con email y contraseña
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<{data: object, error: object}>}
 */
export const signIn = async (email, password) => {
  console.log('🔐 signIn: Iniciando proceso de login para', email)
  try {
    // Intentar login con Supabase Auth con timeout
    console.log('🔐 signIn: Llamando a supabase.auth.signInWithPassword...')
    
    // Crear una promesa con timeout de 20 segundos
    // Agregar listener para ver qué está pasando en la red
    console.log('🔐 signIn: Iniciando signInWithPassword con timeout de 20s...')
    
    const loginPromise = supabase.auth.signInWithPassword({
      email,
      password,
    }).catch(err => {
      console.error('🔐 signIn: Error capturado en la promesa de login:', err)
      throw err
    })
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout: La autenticación tardó más de 20 segundos.\n\nPosibles causas:\n1. El servidor de Supabase Auth está lento\n2. Hay un error 500 en el servidor que no se está reportando\n3. Verifica la pestaña Network para ver la petición a /auth/v1/token\n4. Verifica el estado de Supabase: https://status.supabase.com/'))
      }, 20000)
    })
    
    let data, error
    try {
      const startTime = Date.now()
      const result = await Promise.race([loginPromise, timeoutPromise])
      const elapsedTime = Date.now() - startTime
      console.log(`🔐 signIn: Respuesta recibida después de ${elapsedTime}ms`)
      
      data = result?.data || result
      error = result?.error
      
      console.log('🔐 signIn: Respuesta de signInWithPassword:', { 
        hasData: !!data, 
        hasUser: !!data?.user,
        hasError: !!error, 
        error: error ? {
          message: error.message,
          status: error.status,
          code: error.code
        } : null
      })
    } catch (err) {
      // Si es el timeout, retornar el error de timeout
      if (err.message?.includes('Timeout')) {
        console.error('⏱️ signIn: Timeout alcanzado')
        throw err
      }
      // Si es otro error, puede ser que la promesa rechazó
      console.error('❌ signIn: Excepción capturada:', err)
      error = err
      data = null
    }

    // Si hay error, verificar si es el error de schema
    if (error) {
      // Error específico de schema - puede ser un problema de configuración en Supabase
      if (error.message?.includes('schema') || error.message?.includes('Database error querying schema')) {
        console.error('❌ Error de schema durante login:', error)
        return {
          data: null,
          error: {
            message: 'Error de configuración en Supabase. El servidor no puede consultar el esquema de la base de datos. Verifica los logs de Supabase o contacta al administrador.',
            originalError: error,
            code: 'SCHEMA_ERROR'
          }
        }
      }
      // Otros errores de autenticación
      console.error('❌ Error de autenticación:', error)
      throw error
    }

    if (!data?.user) {
      console.error('❌ No se obtuvo usuario en la respuesta')
      return {
        data: null,
        error: { message: 'No se recibió información del usuario' }
      }
    }

    console.log('✅ signIn: Login exitoso, obteniendo perfil para usuario:', data.user.id)
    
    // Obtener perfil del usuario desde las tablas de perfiles con timeout
    let profile, profileError
    try {
      const profilePromise = getUserProfile(data.user.id)
      const profileTimeout = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout: Obtener perfil tardó más de 10 segundos'))
        }, 10000)
      })
      
      const profileResult = await Promise.race([profilePromise, profileTimeout])
      profile = profileResult.data
      profileError = profileResult.error
      console.log('🔐 signIn: Resultado de getUserProfile:', { hasProfile: !!profile, hasError: !!profileError, error: profileError })
    } catch (err) {
      console.error('❌ signIn: Error o timeout al obtener perfil:', err)
      profileError = err
      profile = null
    }

    // Si hay error al obtener el perfil, rechazar el login
    if (profileError) {
      console.error('❌ Error al obtener perfil:', profileError)
      // Cerrar sesión si no se pudo obtener el perfil
      await supabase.auth.signOut()
      
      // Mensaje más descriptivo según el tipo de error
      let errorMessage = 'No se pudo obtener el perfil del usuario.'
      if (profileError.message?.includes('permisos') || profileError.message?.includes('policy')) {
        errorMessage = 'Error de permisos. Verifica las políticas RLS en Supabase.'
      } else if (profileError.message?.includes('schema')) {
        errorMessage = 'Error al consultar la base de datos. Verifica que las tablas system_users y client_portal_users existan y tengan las políticas RLS correctas.'
      } else if (profileError.message) {
        errorMessage = profileError.message
      }
      
      return { 
        data: null, 
        error: { 
          message: errorMessage,
          originalError: profileError 
        } 
      }
    }

    // Si no se encuentra el perfil en ninguna tabla, rechazar el login
    if (!profile) {
      console.error('❌ No se encontró perfil para el usuario')
      // Cerrar sesión si no hay perfil
      await supabase.auth.signOut()
      return { 
        data: null, 
        error: { 
          message: 'Usuario no autorizado. No se encontró perfil en el sistema.',
        } 
      }
    }

    // Verificar que el usuario tiene un rol válido
    if (!profile.role) {
      console.error('❌ Usuario sin rol asignado')
      await supabase.auth.signOut()
      return { 
        data: null, 
        error: { 
          message: 'Usuario sin rol asignado. Contacta al administrador.',
        } 
      }
    }

    console.log('✅ signIn: Perfil obtenido correctamente, rol:', profile.role)

    // Actualizar último login si es cliente
    if (profile.clientId) {
      console.log('🔐 signIn: Actualizando last_login para cliente')
      await updateLastLogin(data.user.id)
    }

    // Combinar datos de auth con perfil
    const userData = {
      ...data.user,
      ...profile,
    }

    console.log('✅ signIn: Login completado exitosamente para:', userData.email)
    return { data: { ...data, user: userData }, error: null }
  } catch (error) {
    console.error('Error al iniciar sesión:', error)
    return { data: null, error }
  }
}

/**
 * Cierra la sesión del usuario actual
 * @returns {Promise<{error: object}>}
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
    return { error }
  }
}

/**
 * Obtiene el usuario actual autenticado con su perfil completo
 * @returns {Promise<{data: object, error: object}>}
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    // Si no hay sesión, es normal (usuario no autenticado)
    if (error) {
      // AuthSessionMissingError es normal cuando no hay sesión
      if (error.message?.includes('session') || error.message?.includes('Auth session missing')) {
        return { data: null, error: null }
      }
      // Otros errores sí los lanzamos
      throw error
    }

    if (!user) {
      return { data: null, error: null }
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await getUserProfile(user.id)

    // Si hay error o no se encuentra el perfil, cerrar sesión
    if (profileError || !profile) {
      console.warn('Usuario sin perfil válido, cerrando sesión')
      await supabase.auth.signOut()
      return { data: null, error: { message: 'Usuario sin perfil válido' } }
    }

    // Verificar que el usuario tiene un rol válido
    if (!profile.role) {
      await supabase.auth.signOut()
      return { data: null, error: { message: 'Usuario sin rol asignado' } }
    }

    // Combinar datos de auth con perfil
    const userData = {
      ...user,
      ...profile,
    }

    return { data: userData, error: null }
  } catch (error) {
    // Solo loguear errores que no sean de sesión faltante
    if (!error.message?.includes('session') && !error.message?.includes('Auth session missing')) {
      console.error('Error al obtener usuario:', error)
    }
    return { data: null, error: null }
  }
}

/**
 * Obtiene la sesión actual
 * @returns {Promise<{data: object, error: object}>}
 */
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return { data: session, error: null }
  } catch (error) {
    console.error('Error al obtener sesión:', error)
    return { data: null, error }
  }
}

/**
 * Escucha cambios en el estado de autenticación
 * @param {function} callback - Función que se ejecuta cuando cambia el estado
 * @returns {object} Objeto con subscription para desuscribirse
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      // Obtener perfil del usuario cuando hay sesión
      const { data: profile } = await getUserProfile(session.user.id)
      const userWithProfile = profile ? {
        ...session.user,
        ...profile,
      } : session.user
      callback(event, { ...session, user: userWithProfile })
    } else {
      callback(event, session)
    }
  })
}
