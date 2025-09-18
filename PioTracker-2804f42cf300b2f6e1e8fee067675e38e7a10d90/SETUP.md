# Configuración del Proyecto PIO Tracker

## Requisitos Previos

- **Node.js**: Versión 18.0.0 o superior
- **npm**: Versión 8.0.0 o superior
- **PostgreSQL**: Versión 13 o superior
- **Docker** (opcional, para desarrollo local)

## Instalación Rápida

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd pio-tracker
```

### 2. Instalar dependencias
```bash
npm run install:all
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### 4. Configurar base de datos
```bash
# Opción A: Usando Docker (recomendado para desarrollo)
npm run docker:up

# Opción B: Base de datos local
# Crear base de datos PostgreSQL y configurar DATABASE_URL en .env
```

### 5. Ejecutar migraciones y seed
```bash
npm run db:setup
npm run db:migrate
npm run db:seed
```

### 6. Iniciar el proyecto
```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm run build
npm run start
```

## Configuración Detallada

### Variables de Entorno (.env)

#### Configuración de la Aplicación
```env
NODE_ENV=development
PORT=8080
WEB_ORIGIN=http://localhost:3000
JWT_SECRET=tu-secreto-jwt-super-seguro
JWT_EXPIRES_IN=24h
```

#### Base de Datos
```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/pio_tracker
# O individualmente:
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=usuario
DB_PASSWORD=password
DB_DATABASE=pio_tracker
```

#### Google Sheets API
```env
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8080/api/v1/auth/google/callback
GOOGLE_REFRESH_TOKEN=tu-refresh-token
GOOGLE_SHEET_ID=tu-sheet-id
GOOGLE_SHEET_TAB=tu-tab-name
```

#### Configuración de Seguridad
```env
CSRF_SECRET=tu-secreto-csrf
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Base de Datos

#### Crear base de datos PostgreSQL
```sql
CREATE DATABASE pio_tracker;
CREATE USER pio_user WITH PASSWORD 'pio_password';
GRANT ALL PRIVILEGES ON DATABASE pio_tracker TO pio_user;
```

#### Usando Docker
```bash
cd infra
docker-compose up -d postgres
```

### Google Sheets API

#### 1. Crear proyecto en Google Cloud Console
- Ir a [Google Cloud Console](https://console.cloud.google.com/)
- Crear nuevo proyecto o seleccionar existente
- Habilitar Google Sheets API

#### 2. Crear credenciales OAuth2
- Ir a "APIs & Services" > "Credentials"
- Crear "OAuth 2.0 Client IDs"
- Configurar URIs de redirección autorizados

#### 3. Obtener refresh token
```bash
# Usar el script de autorización de Google
cd server
npm run google:auth
```

## Estructura del Proyecto

```
pio-tracker/
├── frontend/          # Aplicación Next.js
├── server/            # API NestJS
├── jobs/              # Scripts de automatización
├── infra/             # Configuración Docker
├── docs/              # Documentación
├── .env.example       # Variables de entorno de ejemplo
└── package.json       # Scripts del monorepo
```

## Scripts Disponibles

### Instalación
- `npm run install:all` - Instalar todas las dependencias
- `npm run install:frontend` - Instalar solo frontend
- `npm run install:server` - Instalar solo backend
- `npm run install:jobs` - Instalar solo jobs

### Desarrollo
- `npm run dev` - Iniciar frontend y backend en modo desarrollo
- `npm run dev:frontend` - Solo frontend en desarrollo
- `npm run dev:server` - Solo backend en desarrollo

### Base de Datos
- `npm run db:setup` - Configurar base de datos
- `npm run db:migrate` - Ejecutar migraciones
- `npm run db:seed` - Poblar con datos iniciales
- `npm run db:reset` - Resetear base de datos

### Docker
- `npm run docker:up` - Levantar servicios Docker
- `npm run docker:down` - Detener servicios Docker
- `npm run docker:logs` - Ver logs de Docker
- `npm run docker:build` - Construir imágenes Docker

### Utilidades
- `npm run lint` - Ejecutar linting en todo el proyecto
- `npm run format` - Formatear código
- `npm run test` - Ejecutar tests
- `npm run clean` - Limpiar builds

## Acceso Inicial

### Usuario Administrador
- **Email**: admin@pio.gcba.gob.ar
- **Password**: admin123

### URLs de Acceso
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api/v1
- **Health Check**: http://localhost:8080/api/v1/health

## Solución de Problemas

### Error de conexión a base de datos
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar variables de entorno
echo $DATABASE_URL

# Probar conexión
psql $DATABASE_URL
```

### Error de puertos ocupados
```bash
# Verificar puertos en uso
netstat -tulpn | grep :3000
netstat -tulpn | grep :8080

# Matar procesos si es necesario
kill -9 <PID>
```

### Error de dependencias
```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm run install:all
```

### Error de migraciones
```bash
# Resetear base de datos
npm run db:reset
npm run db:migrate
npm run db:seed
```

## Desarrollo

### Estructura de Branches
- `main` - Código de producción
- `develop` - Código de desarrollo
- `feature/*` - Nuevas funcionalidades
- `hotfix/*` - Correcciones urgentes

### Commit Convention
```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
style: formato de código
refactor: refactorización
test: tests
chore: tareas de mantenimiento
```

### Testing
```bash
# Tests unitarios
npm run test:server
npm run test:frontend

# Tests e2e
npm run test:e2e
```

## Despliegue

### Entorno de Desarrollo
```bash
npm run dev
```

### Entorno de Staging
```bash
npm run build
npm run start
```

### Entorno de Producción
```bash
# Usar Docker
npm run docker:build
npm run docker:up

# O despliegue directo
npm run build
NODE_ENV=production npm run start
```

## Monitoreo y Logs

### Logs del Backend
```bash
# Ver logs en tiempo real
npm run docker:logs backend

# O directamente
cd server
npm run start:dev
```

### Logs del Frontend
```bash
# Ver logs en tiempo real
npm run docker:logs frontend

# O directamente
cd frontend
npm run dev
```

### Health Checks
```bash
# Verificar estado del sistema
curl http://localhost:8080/api/v1/health

# Verificar base de datos
curl http://localhost:8080/api/v1/health/db
```

## Soporte

Para soporte técnico o reportar bugs:
- Crear issue en el repositorio
- Contactar al equipo de desarrollo
- Revisar la documentación en `/docs`

## Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.








