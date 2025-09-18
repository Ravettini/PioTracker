# 🚀 PIO Tracker - Guía de Despliegue

## 📋 Opciones de Despliegue

### 1. **Vercel + Railway (Recomendado)**
- **Frontend:** Vercel (gratis)
- **Backend:** Railway (gratis)
- **Base de datos:** PostgreSQL en Railway

### 2. **Docker + VPS**
- **Servidor:** DigitalOcean, AWS, Azure
- **Docker Compose** para desplegar todo junto

## 🎯 Despliegue en Vercel + Railway

### Paso 1: Desplegar Backend en Railway

1. **Crear cuenta en Railway:**
   - Ve a [railway.app](https://railway.app)
   - Conecta tu cuenta de GitHub

2. **Crear nuevo proyecto:**
   - Click en "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Selecciona este repositorio

3. **Configurar variables de entorno:**
   ```bash
   NODE_ENV=production
   PORT=3001
   WEB_ORIGIN=https://pio-tracker.vercel.app
   JWT_SECRET=tu-secreto-jwt-super-seguro
   DB_HOST=tu-host-railway
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=tu-password-railway
   DB_DATABASE=pio
   ```

4. **Agregar base de datos PostgreSQL:**
   - En Railway, click en "New"
   - Selecciona "Database" → "PostgreSQL"
   - Copia las credenciales de conexión

5. **Desplegar:**
   - Railway detectará automáticamente que es un proyecto Node.js
   - Se construirá y desplegará automáticamente

### Paso 2: Desplegar Frontend en Vercel

1. **Crear cuenta en Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Conecta tu cuenta de GitHub

2. **Importar proyecto:**
   - Click en "New Project"
   - Selecciona este repositorio
   - Configura el directorio raíz como `frontend`

3. **Configurar variables de entorno:**
   ```bash
   NEXT_PUBLIC_API_URL=https://tu-backend-railway.railway.app/api/v1
   ```

4. **Desplegar:**
   - Vercel detectará automáticamente que es un proyecto Next.js
   - Se construirá y desplegará automáticamente

### Paso 3: Configurar Dominio Personalizado (Opcional)

1. **En Vercel:**
   - Ve a tu proyecto
   - Settings → Domains
   - Agrega tu dominio personalizado

2. **En Railway:**
   - Actualiza `WEB_ORIGIN` con tu dominio de Vercel

## 🔧 Configuración de Google Sheets

1. **Crear proyecto en Google Cloud Console**
2. **Habilitar Google Sheets API**
3. **Crear credenciales OAuth2**
4. **Configurar variables en Railway:**
   ```bash
   GOOGLE_OAUTH_CLIENT_ID=tu-client-id
   GOOGLE_OAUTH_CLIENT_SECRET=tu-client-secret
   GOOGLE_REFRESH_TOKEN=tu-refresh-token
   GOOGLE_SHEET_ID=tu-sheet-id
   GOOGLE_SHEET_TAB=tu-tab-name
   ```

## 🐳 Despliegue con Docker (Alternativa)

### En VPS (DigitalOcean, AWS, etc.):

1. **Conectar al servidor:**
   ```bash
   ssh usuario@tu-servidor.com
   ```

2. **Instalar Docker:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

3. **Clonar repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/pio-tracker.git
   cd pio-tracker
   ```

4. **Configurar variables de entorno:**
   ```bash
   cp env.example .env
   # Editar .env con las credenciales de producción
   ```

5. **Desplegar:**
   ```bash
   cd infra
   docker-compose up -d
   ```

6. **Configurar Nginx (opcional):**
   ```bash
   # Configurar proxy reverso para dominio personalizado
   ```

## 🔒 Seguridad en Producción

### Cambios obligatorios:

1. **JWT Secret:**
   ```bash
   JWT_SECRET=secreto-super-seguro-y-aleatorio-de-32-caracteres
   ```

2. **CSRF Secret:**
   ```bash
   CSRF_SECRET=otro-secreto-super-seguro-y-aleatorio
   ```

3. **Rate Limiting:**
   ```bash
   RATE_LIMIT_MAX_REQUESTS=50
   RATE_LIMIT_WINDOW_MS=900000
   ```

4. **CORS:**
   ```bash
   WEB_ORIGIN=https://tu-dominio.com
   ```

## 📊 Monitoreo y Logs

### Railway:
- Logs automáticos en el dashboard
- Métricas de rendimiento

### Vercel:
- Analytics automáticos
- Logs en tiempo real

### Base de datos:
- Monitoreo de conexiones
- Backup automático

## 🚨 Troubleshooting

### Error 500 en backend:
- Verificar variables de entorno
- Revisar logs en Railway
- Verificar conexión a base de datos

### Error de CORS:
- Verificar `WEB_ORIGIN` en backend
- Verificar `NEXT_PUBLIC_API_URL` en frontend

### Error de autenticación:
- Verificar `JWT_SECRET`
- Verificar configuración de Google OAuth

## 📞 Soporte

Para problemas específicos:
1. Revisar logs en Railway/Vercel
2. Verificar configuración de variables de entorno
3. Probar endpoints individualmente
4. Verificar conectividad de red

---

**¡Tu sistema PIO Tracker estará funcionando en la web! 🌐**
