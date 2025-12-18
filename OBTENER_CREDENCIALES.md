# 🔑 Cómo Obtener tus Credenciales de Supabase

## Pasos para obtener las credenciales:

1. **Ve a tu proyecto de Supabase:**
   - URL: https://supabase.com/dashboard/project/lfxglcvphlwntathpucx

2. **Navega a Settings → API:**
   - En el menú lateral izquierdo, haz clic en "Settings" (⚙️)
   - Luego haz clic en "API"

3. **Copia las siguientes credenciales:**

   ### Project URL
   - Busca la sección "Project URL"
   - Copia la URL completa (algo como: `https://lfxglcvphlwntathpucx.supabase.co`)
   - Pégala en `.env` como `VITE_SUPABASE_URL`

   ### Anon/Public Key
   - Busca la sección "Project API keys"
   - Copia la clave que dice **"anon" "public"** (no la service_role)
   - Es una cadena larga que empieza con `eyJ...`
   - Pégala en `.env` como `VITE_SUPABASE_ANON_KEY`

4. **Actualiza tu archivo `.env`:**
   - Abre el archivo `.env` en la raíz de tu proyecto
   - Reemplaza `tu_anon_key_aqui` con la clave real que copiaste

## ⚠️ Importante:

- **NUNCA** compartas tu `anon key` públicamente
- **NUNCA** subas el archivo `.env` a Git (ya está en .gitignore)
- La clave `anon public` es segura para usar en el frontend
- **NO uses** la clave `service_role` en el frontend (es solo para backend)

## ✅ Verificación:

Después de configurar `.env`, reinicia tu servidor de desarrollo:

```bash
# Detén el servidor (Ctrl+C) y vuelve a iniciarlo
npm run dev
```

Si todo está bien, no deberías ver errores sobre variables de entorno faltantes.

