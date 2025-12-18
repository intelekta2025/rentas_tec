// src/lib/supabase.js
// Configuración centralizada del cliente de Supabase

import { createClient } from '@supabase/supabase-js'

// Obtener variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validar que las variables estén definidas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno de Supabase. ' +
    'Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env'
  )
}

// Validar formato de URL
if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  throw new Error(
    'VITE_SUPABASE_URL debe ser una URL válida (debe empezar con http:// o https://). ' +
    `Valor actual: ${supabaseUrl}`
  )
}

// Validar formato de la clave (debe empezar con eyJ)
if (!supabaseAnonKey.startsWith('eyJ')) {
  console.warn(
    '⚠️ VITE_SUPABASE_ANON_KEY no tiene el formato esperado. ' +
    'Asegúrate de estar usando la clave "anon public" de Supabase.'
  )
}

// Patrón singleton para evitar múltiples instancias
let supabaseInstance = null

// Crear y exportar el cliente de Supabase con configuración optimizada
// Usar singleton para evitar múltiples instancias en desarrollo (HMR)
if (!supabaseInstance) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Persistir sesión en localStorage con clave única
      persistSession: true,
      storageKey: 'sb-lfxglcvphlwntathpucx-auth-token', // Clave única para este proyecto
      // Auto refrescar token
      autoRefreshToken: true,
      // Detectar sesión en el navegador
      detectSessionInUrl: true,
      // Configuración de flujo de autenticación
      // Temporalmente deshabilitado PKCE para diagnosticar problemas de timeout
      // flowType: 'pkce', // Usar PKCE para mayor seguridad
    },
    // Configuración global
    global: {
      headers: {
        'x-client-info': 'rentas-tec@1.0.0',
      },
    },
    // Configuración de realtime (si lo usas)
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })
}

export const supabase = supabaseInstance

// Función de utilidad para verificar conexión
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('system_users').select('count').limit(1)
    if (error && error.code !== 'PGRST116') {
      console.error('Error de conexión a Supabase:', error)
      return { success: false, error }
    }
    return { success: true, error: null }
  } catch (err) {
    console.error('Error al verificar conexión:', err)
    return { success: false, error: err }
  }
}

// Log de configuración (solo en desarrollo)
if (import.meta.env.DEV) {
  console.log('🔧 Supabase configurado:', {
    url: supabaseUrl,
    keyPrefix: supabaseAnonKey.substring(0, 20) + '...',
  })
  
  // Exponer funciones y cliente en window para desarrollo
  if (typeof window !== 'undefined') {
    // Exponer el cliente de Supabase
    window.supabase = supabase
    
    // Exponer función de verificación
    window.verificarSupabase = () => {
      console.log('📋 Verificación de Configuración de Supabase:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('✅ URL:', supabaseUrl || '❌ NO CONFIGURADA')
      console.log('✅ Key:', supabaseAnonKey 
        ? supabaseAnonKey.substring(0, 20) + '...' 
        : '❌ NO CONFIGURADA')
      console.log('✅ Cliente:', supabase ? '✅ CREADO' : '❌ NO CREADO')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      // Verificar formato
      if (supabaseUrl && !supabaseUrl.startsWith('http')) {
        console.warn('⚠️ URL no tiene formato válido (debe empezar con http:// o https://)')
      }
      if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ')) {
        console.warn('⚠️ Key no tiene formato esperado (debe empezar con eyJ)')
      }
      
      return {
        url: supabaseUrl,
        keyConfigured: !!supabaseAnonKey,
        clientCreated: !!supabase,
        isValid: !!(supabaseUrl && supabaseAnonKey && supabase)
      }
    }
    
    // Exponer función de prueba de conexión
    window.probarConexionSupabase = async () => {
      console.log('🔌 Probando conexión a Supabase...')
      const result = await testConnection()
      if (result.success) {
        console.log('✅ Conexión exitosa!')
      } else {
        console.error('❌ Error de conexión:', result.error)
      }
      return result
    }
    
    // Exponer función para probar login
    window.probarLogin = async (email, password) => {
      console.log('🔐 Probando login...')
      try {
        // Timeout de 20 segundos para la prueba
        const loginPromise = supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Timeout después de 20 segundos'))
          }, 20000)
        })
        
        const result = await Promise.race([loginPromise, timeoutPromise])
        const { data, error } = result
        
        if (error) {
          console.error('❌ Error de login:', error)
          return { success: false, error }
        }
        
        console.log('✅ Login exitoso!', {
          userId: data.user?.id,
          email: data.user?.email,
        })
        return { success: true, data }
      } catch (err) {
        console.error('❌ Error inesperado:', err)
        return { success: false, error: err }
      }
    }
    
    // Función para probar conexión HTTP básica
    window.probarConexionHTTP = async () => {
      console.log('🌐 Probando conexión HTTP básica a Supabase...')
      try {
        const url = `${supabaseUrl}/rest/v1/`
        console.log('URL:', url)
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`
          },
          signal: AbortSignal.timeout(10000) // 10 segundos
        })
        
        console.log('✅ Respuesta HTTP:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        })
        
        return { 
          success: response.ok, 
          status: response.status,
          statusText: response.statusText
        }
      } catch (err) {
        console.error('❌ Error de conexión HTTP:', err)
        return { 
          success: false, 
          error: err.message || 'Error de conexión'
        }
      }
    }
    
    // Mensajes de ayuda
    console.log('💡 Funciones disponibles en la consola:')
    console.log('   - verificarSupabase() - Verificar configuración')
    console.log('   - probarConexionSupabase() - Probar conexión a la BD')
    console.log('   - probarLogin(email, password) - Probar login')
    console.log('   - window.supabase - Cliente de Supabase')
  }
}

