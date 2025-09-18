# PIO SIGEPI - Sistema de Seguimiento de Indicadores

Sistema web para el seguimiento de indicadores del Plan de Inversión y Obras (PIO) del Gobierno de la Ciudad de Buenos Aires.

## 🚀 Deployment en Render

### Configuración automática

Este proyecto está configurado para deployment automático en Render usando los archivos `render.yaml`.

### Servicios necesarios

1. **PostgreSQL Database** - Base de datos principal
2. **Web Service (Backend)** - API NestJS
3. **Static Site (Frontend)** - Aplicación Next.js

### Variables de entorno

#### Backend
- `NODE_ENV`: production
- `PORT`: 3001
- `DATABASE_URL`: (se configura automáticamente desde la base de datos)
- `JWT_SECRET`: (se genera automáticamente)
- `JWT_EXPIRES_IN`: 24h
- `CORS_ORIGIN`: https://pio-sigepi-frontend.onrender.com

#### Frontend
- `NEXT_PUBLIC_API_URL`: https://pio-sigepi-backend.onrender.com

### Pasos para deployment

1. **Crear cuenta en Render**
2. **Conectar repositorio GitHub**
3. **Crear PostgreSQL Database**
4. **Crear Web Service para Backend**
5. **Crear Static Site para Frontend**
6. **Configurar variables de entorno**
7. **Deploy automático**

### URLs de producción

- **Frontend**: https://pio-sigepi-frontend.onrender.com
- **Backend**: https://pio-sigepi-backend.onrender.com
- **API**: https://pio-sigepi-backend.onrender.com/api/v1

### Funcionalidades

- ✅ Autenticación de usuarios
- ✅ Dashboard con estadísticas
- ✅ Carga de indicadores
- ✅ Gestión de usuarios (admin)
- ✅ Importación desde Excel
- ✅ Analytics y reportes
- ✅ Perfil de usuario

### Tecnologías

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: NestJS, TypeORM, PostgreSQL
- **Autenticación**: JWT
- **Deployment**: Render