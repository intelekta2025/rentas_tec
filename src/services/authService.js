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
    
    // Crear promesa con timeout de 15 segundos (aumentado para conexiones lentas)
    const queryPromise = supabase
      .from('system_users') // Tabla para administradores
      .select('*')
      .eq('id', userId)
      .single()
    
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Timeout: Consulta a system_users tardó más de 25 segundos'))
          }, 25000) // Aumentado a 25 segundos
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
        // No lanzar error, retornar null para que se intente en client_portal_users
        return { data: null, error: { message: 'Timeout en consulta a system_users', isTimeout: true } }
      }
      // Manejar error 406 (Not Acceptable) - puede ser un problema de headers
      if (error.status === 406 || error.message?.includes('406')) {
        console.error('❌ getStaffProfile: Error 406 (Not Acceptable) - posible problema de headers')
        return { data: null, error: { message: 'Error de formato en la petición (406)', is406: true } }
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
    
    // Crear promesa con timeout de 15 segundos (aumentado para conexiones lentas)
    const queryPromise = supabase
      .from('client_portal_users') // Tabla para clientes
      .select('*')
      .eq('id', userId)
      .single()
    
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Timeout: Consulta a client_portal_users tardó más de 25 segundos'))
          }, 25000) // Aumentado a 25 segundos
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
        // Retornar error pero no lanzar, para que getUserProfile pueda manejarlo
        return { data: null, error: { message: 'Timeout en consulta a client_portal_users', isTimeout: true } }
      }
      // Manejar error 406 (Not Acceptable) - puede ser un problema de headers
      if (error.status === 406 || error.message?.includes('406')) {
        console.error('❌ getClientUserProfile: Error 406 (Not Acceptable) - posible problema de headers')
        return { data: null, error: { message: 'Error de formato en la petición (406)', is406: true } }
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
    
    // Si hay error de timeout o 406, continuar buscando en client_portal_users
    if (staffError && (staffError.isTimeout || staffError.is406)) {
      console.warn('⚠️ getUserProfile: Error en system_users (timeout o 406), continuando con client_portal_users...')
    }
    
    if (staffProfile) {
      console.log('✅ getUserProfile: Perfil encontrado en system_users')
      
      // Obtener nombre de la unidad de negocio desde business_units
      // NOTA: Si la tabla no existe, se usará un fallback
      let unitName = null
      if (staffProfile.unit_id) {
        try {
          console.log('👤 getUserProfile: Obteniendo nombre de business_units...')
          const { data: businessUnit, error: unitError } = await supabase
            .from('business_units')
            .select('name')
            .eq('id', staffProfile.unit_id)
            .single()
          
          if (!unitError && businessUnit) {
            unitName = businessUnit.name || null
            console.log('✅ getUserProfile: Nombre de unidad obtenido:', unitName)
          } else {
            // Si la tabla no existe o hay error, usar fallback
            if (unitError?.message?.includes('table') || unitError?.message?.includes('schema cache')) {
              console.warn('⚠️ getUserProfile: La tabla business_units no existe. Usando fallback.')
            } else {
              console.warn('⚠️ getUserProfile: No se pudo obtener el nombre de business_units:', unitError?.message)
            }
            // unitName permanece null, se usará el fallback en el frontend
          }
        } catch (err) {
          console.warn('⚠️ getUserProfile: Error al consultar business_units:', err.message)
          // Continuar sin el nombre de la unidad, no es crítico para el login
        }
      }
      
      // Mapear datos de staff al formato del frontend
      return {
        data: {
          id: staffProfile.id,
          name: staffProfile.full_name,
          email: staffProfile.email,
          role: staffProfile.role,
          unitId: staffProfile.unit_id,
          unitName: unitName, // Nombre de la unidad desde business_unit
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
    
    // Si hay error de timeout o 406, retornar error para que se maneje en el nivel superior
    if (clientError && (clientError.isTimeout || clientError.is406)) {
      console.error('❌ getUserProfile: Error crítico al obtener perfil de client_portal_users')
      return {
        data: null,
        error: {
          message: clientError.isTimeout 
            ? 'Timeout al obtener perfil. La conexión es lenta o el servidor no responde.'
            : 'Error de formato en la petición (406). Verifica la configuración de Supabase.',
          originalError: clientError
        }
      }
    }
    
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
            }, 10000) // 10 segundos para obtener el nombre del cliente
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
    
    // Si hubo errores de timeout o 406 en ambas consultas, retornar error
    const hadTimeoutOr406 = (staffError && (staffError.isTimeout || staffError.is406)) || 
                            (clientError && (clientError.isTimeout || clientError.is406))
    
    if (hadTimeoutOr406) {
      const error = staffError?.isTimeout || staffError?.is406 ? staffError : clientError
      return {
        data: null,
        error: {
          message: error.isTimeout 
            ? 'Timeout al obtener perfil. La conexión es lenta o el servidor no responde.'
            : 'Error de formato en la petición (406). Verifica la configuración de Supabase.',
          originalError: error,
          isTimeout: error.isTimeout,
          is406: error.is406
        }
      }
    }
    
    // Si no hay errores pero tampoco se encontró perfil, retornar null sin error
    // Esto significa que el usuario simplemente no existe en las tablas
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
    
    // Crear una promesa con timeout de 30 segundos
    // Agregar listener para ver qué está pasando en la red
    console.log('🔐 signIn: Iniciando signInWithPassword con timeout de 30s...')
    
    const loginPromise = supabase.auth.signInWithPassword({
      email,
      password,
    }).catch(err => {
      console.error('🔐 signIn: Error capturado en la promesa de login:', err)
      throw err
    })
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout: La autenticación tardó más de 30 segundos.\n\nPosibles causas:\n1. El servidor de Supabase Auth está lento\n2. Hay un error 500 en el servidor que no se está reportando\n3. Problemas de conexión a internet\n4. Verifica la pestaña Network para ver la petición a /auth/v1/token\n5. Verifica el estado de Supabase: https://status.supabase.com/'))
      }, 30000) // Aumentado a 30 segundos
    })
    
    let data, error
    try {
      const startTime = Date.now()
      console.log('🔐 signIn: Esperando respuesta de Supabase Auth...')
      
      const result = await Promise.race([loginPromise, timeoutPromise])
      const elapsedTime = Date.now() - startTime
      console.log(`🔐 signIn: Respuesta recibida después de ${elapsedTime}ms`)
      
      // Verificar si el resultado es un error directamente
      if (result instanceof Error) {
        throw result
      }
      
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
        console.error('⏱️ signIn: Timeout alcanzado después de 30 segundos')
        console.error('⏱️ signIn: Esto puede indicar problemas de conexión o que el servidor no responde')
        throw err
      }
      // Si es otro error, puede ser que la promesa rechazó
      console.error('❌ signIn: Excepción capturada:', err)
      console.error('❌ signIn: Tipo de error:', err.constructor.name)
      if (err.stack) {
        console.error('❌ signIn: Stack:', err.stack)
      }
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

    // Si hay error al obtener el perfil, verificar si es un error temporal
    if (profileError) {
      console.error('❌ Error al obtener perfil:', profileError)
      
      // Si es un error temporal (timeout o 406), no cerrar sesión pero rechazar el login
      if (profileError.message?.includes('Timeout') || profileError.isTimeout || profileError.is406) {
        console.warn('⚠️ signIn: Error temporal al obtener perfil (timeout o 406), rechazando login pero NO cerrando sesión de Supabase')
        // NO cerrar sesión aquí - el usuario puede intentar de nuevo sin tener que volver a autenticarse
        let errorMessage = 'Timeout al obtener el perfil. El servidor de Supabase tardó demasiado en responder. Por favor intenta de nuevo.'
        if (profileError.is406) {
          errorMessage = 'Error de formato en la petición (406). Verifica la configuración de Supabase.'
        }
        return {
          data: null,
          error: {
            message: errorMessage,
            originalError: profileError,
            isTemporary: true // Marcar como error temporal
          }
        }
      }
      
      // Para otros errores (permisos, schema, etc.), cerrar sesión
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
      console.error('❌ signIn: Perfil no encontrado en system_users ni client_portal_users.')
      // Cerrar sesión si no hay perfil (esto es un error real, no temporal)
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

    // Obtener perfil del usuario (con timeout para evitar que se cuelgue)
    let profile, profileError
    try {
      const profilePromise = getUserProfile(user.id)
      const profileTimeout = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout al obtener perfil en getCurrentUser'))
        }, 20000) // 20 segundos
      })
      
      const profileResult = await Promise.race([profilePromise, profileTimeout])
      profile = profileResult.data
      profileError = profileResult.error
    } catch (err) {
      console.error('❌ getCurrentUser: Error o timeout al obtener perfil:', err)
      profileError = err
      profile = null
    }

    // Si hay error o no se encuentra el perfil, cerrar sesión
    // Esto asegura que no se mantengan sesiones sin perfil válido
    if (profileError || !profile) {
      console.warn('⚠️ getCurrentUser: No se pudo obtener perfil válido, cerrando sesión')
      await supabase.auth.signOut()
      
      // Mensaje más descriptivo según el tipo de error
      let errorMessage = 'La sesión se cerró porque no se pudo obtener tu perfil. Por favor inicia sesión de nuevo.'
      if (profileError?.message?.includes('Timeout')) {
        errorMessage = 'La sesión se cerró debido a un timeout al obtener tu perfil. Por favor inicia sesión de nuevo.'
      } else if (profileError?.message?.includes('406')) {
        errorMessage = 'La sesión se cerró debido a un error de comunicación con el servidor. Por favor inicia sesión de nuevo.'
      } else if (profileError?.message) {
        errorMessage = `La sesión se cerró: ${profileError.message}. Por favor inicia sesión de nuevo.`
      }
      
      return { 
        data: null, 
        error: { 
          message: errorMessage
        } 
      }
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
  console.log('👂 onAuthStateChange: Suscribiéndose a cambios de estado de autenticación.')
  return supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('👂 onAuthStateChange: Evento de autenticación:', event, 'Usuario:', session?.user?.email)
    if (session?.user) {
      try {
        // Obtener perfil del usuario cuando hay sesión (con timeout)
        let profile, profileError
        try {
          const profilePromise = getUserProfile(session.user.id)
          const profileTimeout = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('Timeout al obtener perfil en onAuthStateChange'))
            }, 30000) // 30 segundos para obtener el perfil
          })
          
          const profileResult = await Promise.race([profilePromise, profileTimeout])
          profile = profileResult.data
          profileError = profileResult.error
        } catch (err) {
          // Si el timeout se activa, capturarlo como error
          console.error('❌ onAuthStateChange: Error o timeout al obtener perfil:', err.message)
          profile = null
          profileError = { message: err.message, isTimeout: err.message?.includes('Timeout') }
        }
        
        if (profileError) {
          console.error('❌ onAuthStateChange: Error al obtener perfil:', profileError.message)
          
          // Si es un timeout, no cerrar sesión - puede ser un problema temporal de conexión
          if (profileError.isTimeout || profileError.message?.includes('Timeout')) {
            console.warn('⚠️ onAuthStateChange: Timeout al obtener perfil, manteniendo sesión sin perfil completo')
            // Mantener la sesión pero sin perfil completo - el usuario puede seguir usando la app
            callback(event, { ...session, user: session.user })
            return
          }
          
          // Para otros errores, cerrar sesión
          console.warn('⚠️ onAuthStateChange: Error crítico al obtener perfil, cerrando sesión')
          await supabase.auth.signOut()
          callback(event, null) // Pasar null para indicar que no hay sesión
        } else if (!profile) {
          // Si no se encuentra el perfil, cerrar sesión solo si no es un timeout
          console.warn('⚠️ onAuthStateChange: Perfil no encontrado, cerrando sesión')
          await supabase.auth.signOut()
          callback(event, null)
        } else {
          const userWithProfile = {
            ...session.user,
            ...profile,
          }
          callback(event, { ...session, user: userWithProfile })
        }
      } catch (err) {
        console.error('❌ onAuthStateChange: Error inesperado al obtener perfil:', err)
        // Si hay error inesperado, también cerrar sesión para evitar sesiones sin perfil
        console.warn('⚠️ onAuthStateChange: Error inesperado, cerrando sesión')
        await supabase.auth.signOut()
        callback(event, null) // Pasar null para indicar que no hay sesión
      }
    } else {
      callback(event, session)
    }
  })
}
