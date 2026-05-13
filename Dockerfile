# Etapa 1: build
FROM node:20-alpine AS builder
WORKDIR /app
COPY web/package*.json ./
RUN npm install
COPY web/ .
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
RUN npm run build

# Etapa 2: servir con Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
