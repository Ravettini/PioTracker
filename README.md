# SIPIO

Sistema web para seguimiento de indicadores PIO con sincronización automática a Google Sheets para consumo por Power BI.

## Características

- 🔐 Autenticación propia con roles ADMIN/USUARIO
- 📊 Gestión de indicadores por ministerio y línea
- 📝 Carga y revisión de datos con estados controlados
- ✏️ Edición completa de cargas existentes
- 🔄 Sincronización automática a Google Sheets
- 🎨 Interfaz con tema GCBA (tipografía Archivo, paleta institucional)
- 📈 Auditoría completa de cambios
- 🐳 Docker para desarrollo local

## Estructura del Proyecto

```
PIO/
├── frontend/          # Next.js 14+ con App Router
├── server/            # NestJS + TypeORM + PostgreSQL
├── jobs/              # Scripts de sincronización
├── infra/             # Docker y configuración
├── docs/              # Documentación técnica
└── .env.example       # Variables de entorno
```

## Prerrequisitos

- Node.js 18+ LTS
- PostgreSQL 14+
- Docker y Docker Compose (opcional)

## Instalación Rápida

1. **Clonar y instalar dependencias:**
   ```bash
   git clone <repo-url>
   cd PIO
   npm run install:all
   ```

2. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   # Editar .env con tus credenciales
   ```

3. **Levantar base de datos:**
   ```bash
   docker-compose up -d postgres
   # O conectar a tu PostgreSQL existente
   ```

4. **Ejecutar migraciones y seed:**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Iniciar desarrollo:**
   ```bash
   npm run dev
   ```

## Acceso Inicial

- **URL Frontend:** http://localhost:3000
- **URL Backend:** http://localhost:8080
- **Usuario Admin:** admin@pio.local / Cambiar.123

## Páginas Implementadas

- **Login** (`/login`) - Autenticación de usuarios
- **Dashboard** (`/dashboard`) - Panel principal con estadísticas
- **Nueva Carga** (`/carga`) - Crear nueva carga de indicador
- **Mis Envíos** (`/mis-envios`) - Lista de cargas del usuario
- **Editar Carga** (`/carga/edit/:id`) - Modificar cargas existentes
- **Revisión** (`/revision`) - Panel de revisión para administradores
- **Admin Usuarios** (`/admin/usuarios`) - Gestión de usuarios
- **Sincronización** (`/admin/sync`) - Estado y control de sincronización

## Scripts Disponibles

### Desarrollo
- `npm run dev` - Inicia frontend y backend en modo desarrollo
- `npm run dev:frontend` - Solo frontend
- `npm run dev:server` - Solo backend

### Base de Datos
- `npm run db:migrate` - Ejecuta migraciones
- `npm run db:revert` - Revierte última migración
- `npm run db:seed` - Ejecuta datos de prueba

### Build y Producción
- `npm run build` - Construye frontend y backend
- `npm run start` - Inicia en modo producción

## Variables de Entorno Críticas

```bash
# Base de datos
DATABASE_URL=postgres://user:pass@host:5432/pio

# JWT
JWT_SECRET=tu-secreto-super-seguro

# Google OAuth (para sincronización)
GOOGLE_OAUTH_CLIENT_ID=tu-client-id
GOOGLE_OAUTH_CLIENT_SECRET=tu-client-secret
GOOGLE_REFRESH_TOKEN=tu-refresh-token
GOOGLE_SHEET_ID=id-de-tu-hoja
```

## Documentación

- [Contrato de API](docs/api-contract.md)
- [Modelo de Datos](docs/data-model.md)
- [Guía de UX GCBA](docs/ux-gcba.md)
- [Manual de Operaciones](docs/RUNBOOK.md)

## Desarrollo

### Backend (NestJS)
- Estructura modular: auth, admin, catalogos, cargas, sync, audit
- TypeORM con migraciones automáticas
- Validación con class-validator
- Auditoría automática de cambios

### Frontend (Next.js)
- App Router con TypeScript
- Tema GCBA con tokens CSS
- Componentes reutilizables
- Formularios con react-hook-form + zod

### Seguridad
- JWT en cookies httpOnly
- CSRF protection
- Rate limiting
- Validación de entrada
- Filtrado por ministerio (RBAC)

## Contribución

1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## Licencia

Proyecto interno del Gobierno de la Ciudad de Buenos Aires.
