// src/services/authService.js
// Servicio para operaciones de autenticación con Supabase

import { supabase } from '../lib/supabase'

/**
 * Helper para manejar timeouts en promesas
 * @param {Promise} promise - La promesa a ejecutar
 * @param {number} ms - Tiempo de espera en milisegundos
 * @param {string} errorMessage - Mensaje de error para el timeout
 * @returns {Promise}
 */
const withTimeout = (promise, ms, errorMessage) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(errorMessage || 'Timeout exceeded')
      error.isTimeout = true
      reject(error)
    }, ms)
  })
  return Promise.race([promise, timeoutPromise])
}

/**
 * Obtiene el perfil de un usuario desde la tabla de system_users (administradores)
 * @param {string} userId - UUID del usuario
 * @returns {Promise<{data: object|null, error: object}>}
 */
const getStaffProfile = async (userId) => {
  try {
    // console.log(`👤 getStaffProfile: Consultando system_users (SIMPLE) para userId: ${userId}`)
    const startTime = Date.now()

    // Usar query simple directamente - el join es demasiado lento
    const { data, error } = await withTimeout(
      supabase.from('system_users').select('*').eq('id', userId).single(),
      15000, // Timeout aumentado para manejar BD lenta
      'Timeout: Consulta a system_users tardó más de 15 segundos'
    )

    const elapsedTime = Date.now() - startTime
    // console.log(`👤 getStaffProfile: Consulta completada en ${elapsedTime}ms`)

    if (error) {
      if (error.code === 'PGRST116') {
        // Usuario no encontrado - comportamiento normal, no logueamos
        return { data: null, error: null }
      }
      throw error
    }

    if (data) {
      // Intentar obtener nombre de unidad (best effort, sin bloquear)
      let unitName = null
      if (data.unit_id) {
        try {
          const { data: bu } = await supabase.from('business_units').select('name').eq('id', data.unit_id).single()
          if (bu) unitName = bu.name
        } catch (e) {
          console.warn('No se pudo obtener nombre unidad (non-blocking)', e)
        }
      }

      const profile = { ...data, unitName, unitId: data.unit_id };
      return {
        data: profile,
        error: null
      }
    }

    return { data: null, error: null }

  } catch (error) {
    console.error(`❌ getStaffProfile: Error:`, error.message)

    if (error.isTimeout || error.message?.includes('Timeout')) {
      return { data: null, error: { message: 'Timeout en consulta a system_users', isTimeout: true } }
    }

    if (error.status === 406 || error.code === 406 || error.message?.includes('406')) {
      return { data: null, error: { message: 'Error de formato en la petición (406)', is406: true } }
    }

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
 * Fallback: Obtiene el perfil simple sin join si falla la relación
 */
const getStaffProfileSimple = async (userId) => {
  try {
    console.log('👤 getStaffProfileSimple: Consultando system_users SIN JOIN para userId:', userId);
    const { data, error } = await withTimeout(
      supabase.from('system_users').select('*').eq('id', userId).single(),
      6000,
      'Timeout: Consulta simple a system_users tardó más de 6 segundos'
    )

    if (error) {
      if (error.code === 'PGRST116') return { data: null, error: null }
      throw error
    }

    // Si tenemos data, intentamos buscar el nombre de la unidad aparte (best effort)
    let unitName = null
    if (data && data.unit_id) {
      try {
        const { data: bu } = await supabase.from('business_units').select('name').eq('id', data.unit_id).single()
        if (bu) unitName = bu.name
      } catch (e) { console.warn('No se pudo obtener nombre unidad', e) }
    }

    return {
      data: data ? { ...data, unitName, unitId: data.unit_id } : null,
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message, originalError: error } }
  }
}


/**
 * Obtiene el perfil de un usuario desde la tabla de client_portal_users (clientes)
 * @param {string} userId - UUID del usuario
 * @returns {Promise<{data: object|null, error: object}>}
 */
const getClientUserProfile = async (userId) => {
  try {
    // No loguear aquí para evitar spam en consola cuando el usuario es admin
    // console.log('👤 getClientUserProfile: Consultando client_portal_users para userId:', userId)

    // Intentar obtener perfil Y nombre del cliente en una sola consulta
    const query = supabase
      .from('client_portal_users')
      .select('*, clients(business_name)')
      .eq('id', userId)
      .single()

    const { data, error } = await withTimeout(
      query,
      25000,
      'Timeout: Consulta a client_portal_users tardó más de 25 segundos'
    )

    if (error) {
      if (error.code !== 'PGRST116' && (error.message?.includes('clients') || error.code === 'PGRST200')) {
        console.warn('⚠️ getClientUserProfile: Error en join con clients, intentando consulta simple...')
        return getClientUserProfileSimple(userId)
      }

      if (error.code !== 'PGRST116') throw error
      return { data: null, error: null }
    }

    if (data) {
      const clientName = data.clients?.business_name || null
      const { clients, ...profileData } = data

      return {
        data: {
          ...profileData,
          clientName,
          role: 'Client' // Asegurar rol
        },
        error: null
      }
    }
    return { data: null, error: null }

  } catch (error) {
    if (error.isTimeout || error.message?.includes('Timeout')) {
      return { data: null, error: { message: 'Timeout en consulta a client_portal_users', isTimeout: true } }
    }
    if (error.status === 406 || error.code === 406 || error.message?.includes('406')) {
      // Silenciar el warning de 406 - es normal cuando el usuario no tiene acceso a client_portal_users
      // (por ejemplo, si es admin y las políticas RLS no permiten la consulta)
      // console.warn('⚠️ getClientUserProfile: Error 406 detectado, puede ser un problema temporal de conexión')
      return { data: null, error: { message: 'Error de formato en la petición (406)', is406: true } }
    }

    console.error('❌ getClientUserProfile: Error:', error.message)
    return { data: null, error: { message: error.message, originalError: error } }
  }
}

/**
 * Fallback: Obtiene el perfil de cliente simple sin join
 */
const getClientUserProfileSimple = async (userId) => {
  try {
    const { data, error } = await withTimeout(
      supabase.from('client_portal_users').select('*').eq('id', userId).single(),
      20000,
      'Timeout'
    )
    if (error) {
      if (error.code === 'PGRST116') return { data: null, error: null }
      throw error
    }

    let clientName = null
    if (data && data.client_id) {
      try {
        const { data: cl } = await supabase.from('clients').select('business_name').eq('id', data.client_id).single()
        if (cl) clientName = cl.business_name
      } catch (e) { console.warn('No se pudo obtener nombre cliente', e) }
    }

    return {
      data: data ? { ...data, clientName, role: 'Client' } : null,
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message, originalError: error } }
  }
}

/**
 * Obtiene el perfil completo del usuario (busca en ambas tablas en PARALELO)
 * @param {string} userId - UUID del usuario
 * @returns {Promise<{data: object|null, error: object}>}
 */
const getUserProfile = async (userId) => {
  // 1. Verificar Caché de Rol
  const cachedRole = localStorage.getItem(`user_role_${userId}`);
  console.log('👤 getUserProfile: Buscando perfil para:', userId, cachedRole ? `(Rol cached: ${cachedRole})` : '(Sin cache)');

  if (cachedRole) {
    if (cachedRole === 'Client') {
      const result = await getClientUserProfile(userId);
      // Si hay cache de cliente, confiamos en él. Si falla, invalidamos cache y retornamos error/null.
      // NO hacemos fallback a race para evitar llamadas innecesarias.
      if (!result.data) {
        if (!result.error) {
          console.warn('⚠️ Perfil de cliente definido en cache pero no encontrado en DB. Limpiando cache.');
          localStorage.removeItem(`user_role_${userId}`);
        } else {
          console.warn('⚠️ Error al buscar cliente (Timeout/Red), manteniendo cache por supervivencia:', result.error);

          // Intentar reconstruir perfil completo desde cache
          const cachedProfileStr = localStorage.getItem(`user_profile_${userId}`);
          if (cachedProfileStr) {
            try {
              const cachedProfile = JSON.parse(cachedProfileStr);
              return { data: { ...cachedProfile, from_cache: true }, error: null };
            } catch (e) {
              console.warn('Error parseando perfil cache:', e);
            }
          }

          return { data: { id: userId, role: cachedRole, from_cache: true }, error: null };
        }
      }
      return result;
    } else {
      const result = await getStaffProfile(userId);
      // Si hay cache de admin, confiamos en él. 
      // NO intentamos buscar en cliente para evitar error 406.
      if (!result.data) {
        // SOLO limpiar cache si fue una búsqueda exitosa pero sin resultados (usuario eliminado?)
        // Si hubo error (timeout, red), MANTENER el cache como salvavidas
        if (!result.error) {
          console.warn('⚠️ Perfil de admin definido en cache pero no encontrado en DB. Limpiando cache.');
          localStorage.removeItem(`user_role_${userId}`);
        } else {
          console.warn('⚠️ Error al buscar admin (Timeout/Red), manteniendo cache por supervivencia:', result.error);

          // Intentar reconstruir perfil completo desde cache
          const cachedProfileStr = localStorage.getItem(`user_profile_${userId}`);
          if (cachedProfileStr) {
            try {
              const cachedProfile = JSON.parse(cachedProfileStr);
              console.log('🛡️ Recuperando perfil COMPLETO desde caché:', cachedProfile);
              return { data: { ...cachedProfile, from_cache: true }, error: null };
            } catch (e) {
              console.warn('Error parseando perfil cache:', e);
            }
          }

          return { data: { id: userId, role: cachedRole, from_cache: true }, error: null };
        }
      }
      return result;
    }
  }

  // 3. Estrategia Secuencial (Admin Primero)
  // Consultamos primero system_users. Si existe, es Admin y NO tocamos client_portal_users.
  // Esto evita el error 406 en el primer login/sin cache.
  try {
    // A. Intentar system_users
    const staffResult = await getStaffProfile(userId);

    if (staffResult.data) {
      // console.log('✅ getUserProfile: Encontrado en system_users (Admin).');
      localStorage.setItem(`user_role_${userId}`, staffResult.data.role || 'Admin');
      return staffResult;
    }

    // Si falló system_users (pero no explotó), intentamos client_portal_users
    // console.log('ℹ️ getUserProfile: No encontrado en system_users, intentando client_portal_users...');
    const clientResult = await getClientUserProfile(userId);
    if (clientResult.data) {
      // console.log('✅ getUserProfile: Encontrado en client_portal_users (Client).');

      // Asegurar rol
      if (!clientResult.data.role) clientResult.data.role = 'Client';

      localStorage.setItem(`user_role_${userId}`, 'Client');
      return clientResult;
    }

    // Si llegamos aquí, no está en ninguno
    // No logueamos como warning porque es comportamiento normal al cargar la app sin sesión
    return { data: null, error: null };

  } catch (error) {
    console.error('Error en getUserProfile:', error);

    // FALLBACK FINAL: Si la BD falla (timeout, conexión), intentar recuperar del caché
    // Esto evita sacar al usuario si la BD tiene un hipo
    const cachedRole = localStorage.getItem(`user_role_${userId}`);
    if (cachedRole) {
      console.log(`🛡️ getUserProfile: Recuperando rol desde caché tras error de BD: ${cachedRole}`);
      return {
        data: {
          id: userId,
          role: cachedRole,
          from_cache: true
        },
        error: null
      };
    }

    return {
      data: null,
      error: { message: error.message || 'Error al obtener perfil', originalError: error }
    }
  }
}

/**
 * Actualiza el último login de un usuario cliente
 */
const updateLastLogin = async (userId) => {
  try {
    const { error } = await supabase
      .from('client_portal_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId)
    if (error) console.warn('No se pudo actualizar last_login:', error)
    return { error: null }
  } catch (error) {
    return { error }
  }
}

/**
 * Inicia sesión con email y contraseña
 */
export const signIn = async (email, password) => {
  console.log('🔐 signIn: Iniciando login optimizado para', email)
  try {
    // 1. Autenticación con Supabase Auth
    const loginPromise = supabase.auth.signInWithPassword({ email, password })

    const { data: authData, error: authError } = await withTimeout(
      loginPromise,
      30000, // 30s timeout
      'Timeout: La autenticación con Supabase tardó demasiado. Verifica tu conexión.'
    )

    if (authError) {
      console.error('❌ Error de autenticación:', authError)
      if (authError.message?.includes('schema')) {
        return {
          data: null,
          error: {
            message: 'Error de configuración en Supabase (schema).',
            originalError: authError
          }
        }
      }
      throw authError
    }

    if (!authData?.user) {
      return { data: null, error: { message: 'No se recibió información del usuario' } }
    }

    // 2. Obtener perfil (usando la versión paralela optimizada)
    console.log('✅ signIn: Auth exitoso, obteniendo perfil...')

    // Timeout ajustado: cada query individual es 8s, con retry = 16s max
    // Damos 20s para cubrir ambas queries + overhead
    let profileData = null
    let profileError = null

    try {
      const result = await withTimeout(
        getUserProfile(authData.user.id),
        20000,
        'Timeout al obtener perfil de usuario'
      )
      profileData = result.data
      profileError = result.error
    } catch (err) {
      profileError = err
    }

    if (profileError) {
      console.error('❌ Error al obtener perfil:', profileError)

      // Si es timeout, retornamos error temporal pero NO cerramos sesión en Supabase
      // para permitir reintentos transparentes si se implementan en UI
      if (profileError.isTimeout || profileError.is406 || profileError.message?.includes('Timeout')) {
        return {
          data: null,
          error: {
            message: 'El servidor tardó demasiado en responder con tu perfil. Por favor intenta de nuevo.',
            originalError: profileError,
            isTemporary: true
          }
        }
      }

      // Error real, cerramos sesión
      await supabase.auth.signOut()
      return {
        data: null,
        error: { message: 'No se pudo obtener el perfil del usuario. Verifica permisos.' }
      }
    }

    if (!profileData) {
      console.error('❌ Perfil no encontrado')
      await supabase.auth.signOut()
      return { data: null, error: { message: 'Usuario no autorizado. No tienes perfil asignado.' } }
    }

    if (!profileData.role) {
      await supabase.auth.signOut()
      return { data: null, error: { message: 'Usuario sin rol asignado.' } }
    }

    // 3. Actualizar last_login (fire and forget)
    if (profileData.clientId) {
      updateLastLogin(authData.user.id)
    }

    // Cache explícito también aquí por seguridad
    if (profileData.role) {
      localStorage.setItem(`user_role_${authData.user.id}`, profileData.role);
    }

    const userData = { ...authData.user, ...profileData }
    console.log('✅ signIn: Login completado para:', userData.email)

    return { data: { ...authData, user: userData }, error: null }

  } catch (error) {
    if (error.isTimeout) {
      return { data: null, error: { message: error.message, isTemporary: true } }
    }
    return { data: null, error }
  }
}

/**
 * Cierra la sesión
 */
export const signOut = async () => {
  try {
    // Intentar obtener usuario actual para limpiar su caché específico antes de salir
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      localStorage.removeItem(`user_role_${user.id}`)
    }

    // Limpieza general de claves de rol y perfil por seguridad
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('user_role_') || key.startsWith('user_profile_')) {
        localStorage.removeItem(key)
      }
    })

    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

/**
 * Obtiene el usuario actual
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      if (error && !error.message?.includes('session')) throw error
      return { data: null, error: null }
    }

    // Obtener perfil (optimizado)
    try {
      const { data: profile, error: pError } = await withTimeout(
        getUserProfile(user.id),
        20000,
        'Timeout perfil'
      )

      if (pError || !profile) {
        // Solo loguear si es un problema inesperado (no simplemente "no hay sesión")
        if (pError && !pError.message?.includes('usuario no encontrado')) {
          console.warn('⚠️ getCurrentUser: Problema con perfil (puede ser temporal durante refresh de token)', pError)
        }
        // NO cerrar sesión aquí - puede ser un problema temporal durante token refresh
        // Solo retornar null para permitir que la UI maneje el estado
        return { data: null, error: { message: 'Perfil temporalmente no disponible', isTemporary: true } }
      }

      return { data: { ...user, ...profile }, error: null }
    } catch (err) {
      console.error('Error getCurrentUser perfil', err)
      return { data: null, error: err }
    }
  } catch (error) {
    console.error('Error getCurrentUser', error)
    return { data: null, error: null }
  }
}

/**
 * Listener de cambios de auth
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      // Solo obtener perfil completo en SIGNED_IN inicial, no en cada refresh de token
      if (event === 'SIGNED_IN' || !session.user.role) {
        // Login inicial o sesión sin perfil - obtener perfil completo
        try {
          const { data: profile } = await getUserProfile(session.user.id)
          if (profile) {
            callback(event, { ...session, user: { ...session.user, ...profile } })
          } else {
            // Fallback a cache completo si falla
            const cachedProfileStr = localStorage.getItem(`user_profile_${session.user.id}`);
            if (cachedProfileStr) {
              try {
                const cachedProfile = JSON.parse(cachedProfileStr);
                callback(event, { ...session, user: { ...session.user, ...cachedProfile, from_cache: true } })
              } catch (e) {
                // Fallback a solo rol si falla el JSON
                const cachedRole = localStorage.getItem(`user_role_${session.user.id}`)
                callback(event, { ...session, user: { ...session.user, role: cachedRole } })
              }
            } else {
              const cachedRole = localStorage.getItem(`user_role_${session.user.id}`)
              callback(event, { ...session, user: { ...session.user, role: cachedRole } })
            }
          }
        } catch (e) {
          console.warn('Error obteniendo perfil en SIGNED_IN:', e)
          const cachedProfileStr = localStorage.getItem(`user_profile_${session.user.id}`);
          if (cachedProfileStr) {
            try {
              const cachedProfile = JSON.parse(cachedProfileStr);
              callback(event, { ...session, user: { ...session.user, ...cachedProfile, from_cache: true } })
            } catch (e2) {
              const cachedRole = localStorage.getItem(`user_role_${session.user.id}`)
              callback(event, { ...session, user: { ...session.user, role: cachedRole } })
            }
          } else {
            const cachedRole = localStorage.getItem(`user_role_${session.user.id}`)
            callback(event, { ...session, user: { ...session.user, role: cachedRole } })
          }
        }
      } else {
        // TOKEN_REFRESHED u otros eventos - usar cache de perfil completo, NO consultar BD
        const cachedProfileStr = localStorage.getItem(`user_profile_${session.user.id}`);
        if (cachedProfileStr) {
          try {
            const cachedProfile = JSON.parse(cachedProfileStr);
            callback(event, { ...session, user: { ...session.user, ...cachedProfile, from_cache: true } })
          } catch (e) {
            const cachedRole = localStorage.getItem(`user_role_${session.user.id}`)
            callback(event, { ...session, user: { ...session.user, role: cachedRole } })
          }
        } else {
          const cachedRole = localStorage.getItem(`user_role_${session.user.id}`)
          callback(event, { ...session, user: { ...session.user, role: cachedRole || session.user.role } })
        }
      }
    } else {
      callback(event, session)
    }
  })
}

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession()
  return { data: data?.session, error }
}
