# --- Etapa 1: Build ---
FROM node:18-alpine as build

WORKDIR /app

# Copiamos package.json primero para aprovechar caché de Docker
COPY package*.json ./
RUN npm ci

# Copiamos el resto del código
COPY . .

# IMPORTANTE: Vite necesita las variables en tiempo de BUILD.
# Las definiremos como ARG para pasarlas desde GitHub Actions.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SUPABASE_SERVICE_ROLE_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_SERVICE_ROLE_KEY=$VITE_SUPABASE_SERVICE_ROLE_KEY

RUN npm run build

# --- Etapa 2: Servidor Nginx ---
FROM nginx:alpine

# Copiamos la configuración de Nginx que creamos
COPY default.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos generados en la etapa de build a la carpeta de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]