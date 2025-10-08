# SIPIO - Sistema de Indicadores de Plan de Inversión y Obras

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Configuración y Deployment](#configuración-y-deployment)
6. [Funcionalidades Principales](#funcionalidades-principales)
7. [Vistas y Páginas](#vistas-y-páginas)
8. [Sistema de Autenticación](#sistema-de-autenticación)
9. [Integración con Google Sheets](#integración-con-google-sheets)
10. [Base de Datos](#base-de-datos)
11. [API y Endpoints](#api-y-endpoints)
12. [Flujo de Datos](#flujo-de-datos)
13. [Gestión de Errores](#gestión-de-errores)
14. [Roles y Permisos](#roles-y-permisos)

---

## 📖 Descripción General

SIPIO es un sistema web para la gestión y seguimiento de indicadores del Plan de Inversión y Obras del Gobierno de la Ciudad de Buenos Aires (GCBA). Permite a diferentes ministerios cargar, revisar, validar y analizar indicadores relacionados con compromisos gubernamentales.

### Características Principales:
- Carga de indicadores mensuales por ministerio
- Sistema de revisión y validación para administradores
- Integración bidireccional con Google Sheets
- Visualización de datos mediante gráficos (Analytics)
- Dashboard con estadísticas en tiempo real
- Gestión de usuarios y permisos
- Sincronización automática de datos

---

## 🏗️ Arquitectura del Sistema

### Arquitectura General
```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│              Next.js 14 + React + TypeScript                 │
│                   (Deployed on Vercel)                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓ (HTTP/REST API)
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│              NestJS + TypeORM + PostgreSQL                   │
│                   (Deployed on Render)                       │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    ↓               ↓
        ┌─────────────────┐   ┌──────────────────┐
        │   PostgreSQL    │   │  Google Sheets   │
        │    Database     │   │    API (v4)      │
        │  (Render Hosted)│   │ (OAuth2 + JWT)   │
        └─────────────────┘   └──────────────────┘
```

### Flujo de Autenticación
```
Usuario → Login → Backend (JWT Token) → Frontend (Zustand Store)
                      ↓
                  PostgreSQL (Validación de credenciales)
```

### Flujo de Sincronización con Google Sheets
```
Carga de Indicador (Frontend)
    ↓
Backend API (/api/v1/cargas)
    ↓
PostgreSQL (Guardar en BD)
    ↓
Endpoint de Sincronización (/api/v1/sync/sync-to-sheets)
    ↓
Google Sheets API (Escritura)
```

---

## 💻 Stack Tecnológico

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **UI Framework**: React 18
- **Gestión de Estado**: Zustand
- **Estilos**: Tailwind CSS
- **Gráficos**: Recharts
- **Notificaciones**: react-hot-toast
- **Exportación**: html2canvas, file-saver
- **HTTP Client**: fetch API (custom apiClient)

### Backend
- **Framework**: NestJS 10
- **Lenguaje**: TypeScript
- **ORM**: TypeORM
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT (jsonwebtoken)
- **Validación**: class-validator, class-transformer
- **Google Sheets**: googleapis (v4 API)
- **Seguridad**: bcryptjs (hashing de contraseñas)

### DevOps y Deployment
- **Frontend**: Vercel (Deploy automático desde GitHub)
- **Backend**: Render.com (Web Service)
- **Base de Datos**: Render PostgreSQL
- **Control de Versiones**: Git + GitHub
- **Variables de Entorno**: .env (local), Vercel/Render Environment Variables

---

## 📁 Estructura del Proyecto

```
PIO/
├── frontend/                      # Aplicación Next.js
│   ├── public/                    # Archivos estáticos
│   ├── src/
│   │   ├── app/                   # App Router de Next.js
│   │   │   ├── (auth)/           # Grupo de rutas de autenticación
│   │   │   │   └── login/        # Página de login
│   │   │   ├── admin/            # Rutas de administración
│   │   │   │   ├── usuarios/     # Gestión de usuarios
│   │   │   │   └── sync/         # Sincronización
│   │   │   ├── analytics/        # Visualización de gráficos
│   │   │   ├── carga/            # Formulario de carga de indicadores
│   │   │   ├── creacion/         # Creación de entidades
│   │   │   ├── dashboard/        # Panel principal (estadísticas)
│   │   │   ├── gestion/          # Gestión de ministerios/indicadores
│   │   │   ├── home/             # Menú principal
│   │   │   ├── manual/           # Manual de usuario
│   │   │   ├── mis-envios/       # Cargas del usuario
│   │   │   ├── perfil/           # Perfil de usuario
│   │   │   ├── publicadas/       # Cargas publicadas
│   │   │   ├── revision/         # Revisión de cargas (admin)
│   │   │   └── page.tsx          # Página raíz (redirect)
│   │   ├── components/           # Componentes React reutilizables
│   │   │   ├── layout/           # Layout, Sidebar, Header
│   │   │   └── ui/               # Componentes UI (Card, Button, etc.)
│   │   ├── lib/                  # Utilidades y configuración
│   │   │   └── api.ts            # Cliente API
│   │   └── store/                # Zustand stores
│   │       └── auth-store.ts     # Estado de autenticación
│   ├── .env.local                # Variables de entorno (local)
│   ├── next.config.js            # Configuración de Next.js
│   ├── package.json
│   └── tailwind.config.ts        # Configuración de Tailwind
│
├── server/                        # Aplicación NestJS
│   ├── src/
│   │   ├── admin/                # Módulo de administración
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.service.ts
│   │   │   └── dto/              # Data Transfer Objects
│   │   ├── analytics/            # Módulo de analytics
│   │   │   ├── analytics.controller.ts
│   │   │   ├── analytics.service.ts
│   │   │   └── dto/
│   │   ├── auth/                 # Módulo de autenticación
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── dto/
│   │   ├── cargas/               # Módulo de cargas
│   │   │   ├── cargas.controller.ts
│   │   │   ├── cargas.service.ts
│   │   │   └── dto/
│   │   ├── catalogos/            # Módulo de catálogos
│   │   │   ├── catalogos.controller.ts
│   │   │   ├── catalogos.service.ts
│   │   │   └── dto/
│   │   ├── entities/             # Entidades de TypeORM
│   │   │   ├── usuario.entity.ts
│   │   │   ├── ministerio.entity.ts
│   │   │   ├── compromiso.entity.ts
│   │   │   ├── linea-accion.entity.ts
│   │   │   ├── indicador.entity.ts
│   │   │   ├── meta-mensual.entity.ts
│   │   │   └── carga-indicador.entity.ts
│   │   ├── perfil/               # Módulo de perfil de usuario
│   │   │   ├── perfil.controller.ts
│   │   │   └── perfil.service.ts
│   │   ├── sync/                 # Módulo de sincronización
│   │   │   ├── sync.controller.ts
│   │   │   ├── sync.service.ts
│   │   │   └── google-sheets.service.ts
│   │   ├── app.module.ts         # Módulo principal
│   │   └── main.ts               # Punto de entrada
│   ├── .env                      # Variables de entorno
│   ├── package.json
│   └── tsconfig.json
│
├── generar-token-simple.js       # Script para generar tokens OAuth2
├── token-info.json               # Tokens de Google OAuth2 (NO COMMITEAR)
└── README.md                     # Este archivo
```

---

## ⚙️ Configuración y Deployment

### Variables de Entorno

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://tu-backend.onrender.com
```

#### Backend (.env)
```env
# Base de datos
DATABASE_HOST=postgres-host.render.com
DATABASE_PORT=5432
DATABASE_USERNAME=usuario
DATABASE_PASSWORD=contraseña
DATABASE_NAME=sipio_db

# JWT
JWT_SECRET=tu_secret_key_super_segura

# Google Sheets
GOOGLE_SPREADSHEET_ID=1234567890abcdef
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback

# Puerto
PORT=8080
```

### Deployment

#### Frontend (Vercel)
1. Conectar repositorio de GitHub
2. Configurar variables de entorno en Vercel Dashboard
3. Deploy automático en cada push a master

#### Backend (Render)
1. Crear Web Service en Render
2. Configurar:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`
   - Port: `8080` (o el que use Render)
3. Agregar variables de entorno
4. Deploy automático desde GitHub

### Google Sheets Setup
1. Crear proyecto en Google Cloud Console
2. Habilitar Google Sheets API
3. Crear credenciales OAuth2
4. Ejecutar `node generar-token-simple.js` para obtener tokens
5. Los tokens se guardan en `token-info.json`

---

## 🎯 Funcionalidades Principales

### 1. Gestión de Usuarios
- Crear usuarios con rol ADMIN o USER
- Asignar ministerio a cada usuario
- Contraseñas temporales en primer acceso
- Cambio de contraseña obligatorio
- Soft delete (desactivar en lugar de eliminar)
- Reactivación de usuarios desactivados

### 2. Carga de Indicadores
- Formulario jerárquico: Ministerio → Compromiso → Línea → Indicador
- Campos: Período (YYYY-MM), Mes, Valor, Unidad, Descripción
- Validación de metas mensuales
- Estados: Pendiente, Validado, Observado, Rechazado, Publicado
- Sincronización automática a Google Sheets

### 3. Revisión y Validación (Admin)
- Ver cargas pendientes
- Validar, observar o rechazar cargas
- Agregar comentarios
- Publicar cargas validadas
- Filtros por estado, ministerio y período

### 4. Analytics y Visualización
- Filtros: Año, Ministerio, Compromiso, Indicador
- Tipos de gráficos: Líneas, Barras, Áreas, Pie, Radar
- Vista mensual vs. total acumulado
- Comparación con metas
- Exportación de gráficos como PNG

### 5. Dashboard/Panel
- Estadísticas en tiempo real desde Google Sheets
- Total de cargas, pendientes, validadas, publicadas
- Estado del sistema
- Información de sesión del usuario

### 6. Sincronización con Google Sheets
- Sincronización bidireccional
- Una pestaña por ministerio en Google Sheets
- Formato estandarizado: Período, Mes, Valor, Unidad, Meta, etc.
- Upsert: actualiza si existe, crea si no existe
- Búsqueda por indicadorId + periodo + mes

---

## 📄 Vistas y Páginas

### `/login` - Página de Login
**Archivo**: `frontend/src/app/(auth)/login/page.tsx`

**Funcionalidad**:
- Formulario con email y contraseña
- Autenticación mediante JWT
- Redirección a `/home` después de login exitoso
- Manejo de errores con toast

**API Endpoint**: `POST /api/v1/auth/login`

**Request Body**:
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Response**:
```json
{
  "access_token": "jwt_token_aqui",
  "user": {
    "id": "uuid",
    "nombre": "Nombre Usuario",
    "email": "usuario@ejemplo.com",
    "rol": "ADMIN" | "USER",
    "ministerioId": "uuid",
    "claveTemporal": true | false
  }
}
```

---

### `/home` - Menú Principal
**Archivo**: `frontend/src/app/home/page.tsx`

**Funcionalidad**:
- Menú principal con 3 cards temáticas:
  1. **Gestión Operativa**: Carga, Mis Envíos, Publicadas, Revisión (admin)
  2. **Análisis y Reportes**: Panel (Dashboard), Analytics
  3. **Configuración del Sistema**: Usuarios, Gestión, Sincronización, Manual (admin)
- Estadísticas rápidas
- Sección de ayuda

**Permisos**:
- Usuarios regulares: Solo ven opciones operativas y análisis
- Administradores: Ven todas las opciones incluyendo configuración

---

### `/dashboard` - Panel de Estadísticas
**Archivo**: `frontend/src/app/dashboard/page.tsx`

**Funcionalidad**:
- Muestra 4 cards con estadísticas:
  - Total de cargas
  - Cargas pendientes
  - Cargas validadas
  - Cargas publicadas
- Estado del sistema (BD, API, Sincronización)
- Información de sesión del usuario

**API Endpoint**: `GET /api/v1/cargas/stats-from-sheets`

**Importante**:
- Los datos se obtienen SOLO de Google Sheets
- Si falla la conexión, muestra alerta pidiendo reiniciar
- NO hay fallback a base de datos local

---

### `/carga` - Carga de Indicadores
**Archivo**: `frontend/src/app/carga/page.tsx`

**Funcionalidad**:
- Formulario jerárquico con selects encadenados:
  1. Seleccionar Ministerio
  2. Seleccionar Compromiso (filtrado por ministerio)
  3. Seleccionar Línea de Acción (filtrado por compromiso)
  4. Seleccionar Indicador (filtrado por línea)
- Campos de carga:
  - Período (YYYY-MM)
  - Mes (select con nombres de meses)
  - Valor (número)
  - Unidad de Medida
  - Descripción (opcional)
- Validación contra metas mensuales
- Botón para crear nueva meta mensual

**API Endpoints**:
- `GET /api/v1/catalogos/ministerios` - Obtener ministerios
- `GET /api/v1/catalogos/compromisos/:ministerioId` - Obtener compromisos
- `GET /api/v1/catalogos/lineas/:compromisoId` - Obtener líneas
- `GET /api/v1/catalogos/indicadores/:lineaId` - Obtener indicadores
- `GET /api/v1/catalogos/metas/:indicadorId` - Obtener metas
- `POST /api/v1/cargas` - Crear carga

**Request Body** (POST /api/v1/cargas):
```json
{
  "ministerioId": "uuid",
  "compromisoId": "uuid",
  "lineaId": "uuid",
  "indicadorId": "uuid",
  "periodo": "2025-01",
  "mes": "01",
  "valor": 150,
  "unidadMedida": "unidades",
  "descripcion": "Descripción opcional"
}
```

**Importante**:
- El mes se envía como string numérico ("01", "02", etc.)
- El backend convierte el mes a nombre para Google Sheets
- Solo ministerios activos (activo: true) se muestran

---

### `/mis-envios` - Mis Cargas
**Archivo**: `frontend/src/app/mis-envios/page.tsx`

**Funcionalidad**:
- Lista de cargas realizadas por el usuario actual
- Filtros por estado y período
- Tabla con: Indicador, Período, Mes, Valor, Estado, Fecha
- Ver detalles de cada carga
- Editar cargas pendientes u observadas

**API Endpoint**: `GET /api/v1/cargas/mis-cargas`

---

### `/publicadas` - Cargas Publicadas
**Archivo**: `frontend/src/app/publicadas/page.tsx`

**Funcionalidad**:
- Lista de todas las cargas con estado PUBLICADO
- Filtros por ministerio, período
- Tabla con información completa
- Solo lectura (no editable)

**API Endpoint**: `GET /api/v1/cargas?estado=PUBLICADO`

---

### `/revision` - Revisión de Cargas (Admin)
**Archivo**: `frontend/src/app/revision/page.tsx`

**Funcionalidad**:
- **Solo para administradores**
- Ver cargas pendientes de validación
- Acciones:
  - ✅ Validar: Marca como VALIDADO
  - 👁️ Observar: Marca como OBSERVADO (requiere comentario)
  - ❌ Rechazar: Marca como RECHAZADO (requiere comentario)
  - 📢 Publicar: Marca como PUBLICADO (solo si está validado)
- Filtros por ministerio, compromiso, período
- Muestra información completa del indicador

**API Endpoints**:
- `GET /api/v1/cargas/pendientes` - Obtener cargas pendientes
- `PUT /api/v1/cargas/:id/validar` - Validar carga
- `PUT /api/v1/cargas/:id/observar` - Observar carga
- `PUT /api/v1/cargas/:id/rechazar` - Rechazar carga
- `PUT /api/v1/cargas/:id/publicar` - Publicar carga

---

### `/analytics` - Analytics y Gráficos
**Archivo**: `frontend/src/app/analytics/page.tsx`

**Funcionalidad**:
- Visualización de datos mediante gráficos
- Filtros:
  - Año (2024, 2025, 2026, 2027)
  - Ministerio (incluye "Todos")
  - Compromiso (incluye "Todos")
  - Indicador (incluye "Todos")
- Tipos de vista:
  - Mensual: Datos desglosados por mes
  - Total: Datos acumulados por período
- Tipos de gráficos:
  - Líneas (line)
  - Barras (bar)
  - Áreas (area)
  - Pie (pie)
  - Radar (radar)
  - Auto (el sistema elige el mejor)
- Comparación con metas (línea punteada)
- Exportar gráfico como PNG
- Resumen con estadísticas globales

**API Endpoints**:
- `GET /api/v1/analytics/ministerios` - Lista de ministerios
- `GET /api/v1/analytics/compromisos/:ministerioId` - Compromisos por ministerio
- `GET /api/v1/analytics/indicadores/:compromisoId` - Indicadores por compromiso
- `GET /api/v1/analytics/datos?indicadorId=xxx&vista=mensual&año=2025` - Datos para gráfico
- `GET /api/v1/analytics/resumen` - Resumen global

**Response de /datos**:
```json
{
  "ministerio": "Nombre del Ministerio",
  "compromiso": "Nombre del Compromiso",
  "indicador": "Nombre del Indicador",
  "tipo": "porcentaje" | "cantidad",
  "vista": "mensual" | "total",
  "datos": {
    "periodos": ["enero", "febrero", "marzo"],
    "valores": [100, 150, 200],
    "metas": [120, 140, 180]
  },
  "configuracion": {
    "tipoGrafico": "line",
    "colores": ["#0088FE"],
    "opciones": {}
  }
}
```

**Importante**:
- Los datos se obtienen SOLO de Google Sheets
- Si no hay datos para un año específico, el gráfico queda vacío
- NO hay fallback a base de datos local

---

### `/admin/usuarios` - Gestión de Usuarios (Admin)
**Archivo**: `frontend/src/app/admin/usuarios/page.tsx`

**Funcionalidad**:
- **Solo para administradores**
- Tabla con todos los usuarios del sistema
- Crear nuevo usuario:
  - Nombre, Email, Rol, Ministerio
  - Contraseña temporal generada automáticamente
- Editar usuario existente
- Desactivar usuario (soft delete)
- Resetear contraseña (genera nueva temporal)
- Ver estado activo/inactivo

**API Endpoints**:
- `GET /api/v1/admin/usuarios` - Lista de usuarios
- `POST /api/v1/admin/usuarios` - Crear usuario
- `PUT /api/v1/admin/usuarios/:id` - Actualizar usuario
- `DELETE /api/v1/admin/usuarios/:id` - Desactivar usuario
- `PUT /api/v1/admin/usuarios/:id/reset-password` - Resetear contraseña

**Request Body** (POST /api/v1/admin/usuarios):
```json
{
  "nombre": "Nombre Usuario",
  "email": "usuario@ejemplo.com",
  "rol": "ADMIN" | "USER",
  "ministerioId": "uuid"
}
```

**Response**:
```json
{
  "user": {
    "id": "uuid",
    "nombre": "Nombre Usuario",
    "email": "usuario@ejemplo.com",
    "rol": "ADMIN",
    "ministerioId": "uuid"
  },
  "temporaryPassword": "TempPass123"
}
```

**Lógica especial**:
- Si se intenta crear un usuario con email de un usuario desactivado, se REACTIVA el usuario existente
- Las contraseñas se hashean con bcryptjs

---

### `/gestion` - Gestión de Catálogos (Admin)
**Archivo**: `frontend/src/app/gestion/page.tsx`

**Funcionalidad**:
- **Solo para administradores**
- Gestión de:
  - Ministerios
  - Compromisos
  - Líneas de Acción
  - Indicadores
- Operaciones CRUD (Create, Read, Update, Delete)
- Soft delete en todas las entidades
- Ver relaciones jerárquicas

**API Endpoints**:
- Ministerios: `/api/v1/admin/ministerios`
- Compromisos: `/api/v1/admin/compromisos`
- Líneas: `/api/v1/admin/lineas`
- Indicadores: `/api/v1/admin/indicadores`

---

### `/creacion` - Creación Rápida (Admin)
**Archivo**: `frontend/src/app/creacion/page.tsx`

**Funcionalidad**:
- **Solo para administradores**
- Creación rápida de:
  - Nuevos ministerios
  - Nuevos compromisos
  - Nuevas líneas de acción
  - Nuevos indicadores
- Formularios simplificados
- Redirección automática después de crear

---

### `/admin/sync` - Sincronización (Admin)
**Archivo**: `frontend/src/app/admin/sync/page.tsx`

**Funcionalidad**:
- **Solo para administradores**
- Ver estado de sincronización con Google Sheets
- Botón para forzar sincronización manual
- Ver última sincronización
- Logs de errores de sincronización

**API Endpoint**: `POST /api/v1/sync/sync-to-sheets`

---

### `/perfil` - Perfil de Usuario
**Archivo**: `frontend/src/app/perfil/page.tsx`

**Funcionalidad**:
- Ver información del usuario actual
- Cambiar contraseña
- Ver ministerio asignado
- Ver rol

**API Endpoint**: `PUT /api/v1/perfil/cambiar-password`

**Request Body**:
```json
{
  "currentPassword": "contraseña_actual",
  "newPassword": "nueva_contraseña"
}
```

---

### `/manual` - Manual de Usuario
**Archivo**: `frontend/src/app/manual/page.tsx`

**Funcionalidad**:
- Documentación de uso del sistema
- Explicación de cada sección
- Guías paso a paso
- Preguntas frecuentes

---

## 🔐 Sistema de Autenticación

### Flujo de Autenticación

1. **Login**:
   ```typescript
   POST /api/v1/auth/login
   Body: { email, password }
   Response: { access_token, user }
   ```

2. **Almacenamiento del Token**:
   - Frontend guarda el token en Zustand store
   - El token se incluye en el header de cada request:
     ```typescript
     headers: {
       'Authorization': `Bearer ${token}`
     }
     ```

3. **Validación en Backend**:
   - NestJS usa `JwtStrategy` de Passport
   - Verifica el token en cada endpoint protegido
   - Extrae el usuario del token

4. **Protección de Rutas**:
   - Frontend: Hook `useIsAuthenticated()` en cada página
   - Backend: Decorador `@UseGuards(JwtAuthGuard)`

### Cambio de Contraseña Temporal

```typescript
// Si user.claveTemporal === true
PUT /api/v1/perfil/cambiar-password
Body: { currentPassword, newPassword }

// El backend marca claveTemporal = false
```

---

## 📊 Integración con Google Sheets

### Configuración

**Archivo de Servicio**: `server/src/sync/google-sheets.service.ts`

### Autenticación OAuth2

1. **Archivo de Credenciales**: `JSON KEY PIO/core-song-467015-v9-77c083fe89a0.json`
   - Contiene client_id, client_secret, redirect_uris
   - **NO SE COMMITEA** (está en .gitignore)

2. **Archivo de Tokens**: `server/token-info.json`
   ```json
   {
     "access_token": "...",
     "refresh_token": "...",
     "scope": "https://www.googleapis.com/auth/spreadsheets",
     "token_type": "Bearer",
     "expiry_date": 1234567890000
   }
   ```
   - **NO SE COMMITEA** (está en .gitignore)

3. **Refresh Token**:
   - El sistema automáticamente renueva el access_token usando el refresh_token
   - Si expira, se regenera automáticamente

### Estructura de Google Sheets

**Spreadsheet ID**: Se configura en variable de entorno `GOOGLE_SPREADSHEET_ID`

**Estructura**:
- Una pestaña por ministerio
- Nombre de pestaña: `Ministerio_{nombre_ministerio_sin_espacios}_`
  - Ejemplo: `Ministerio_ministerio_de_justicia_`

**Columnas** (en orden):
1. Período (YYYY-MM)
2. Mes (nombre del mes: "enero", "febrero", etc.)
3. Valor (número)
4. Unidad (texto)
5. Meta (número)
6. Indicador ID (UUID)
7. Indicador Nombre (texto)
8. Línea de Acción (texto)
9. Compromiso (texto)

### Operaciones

#### Escritura (Upsert)
**Archivo**: `server/src/sync/sync.service.ts` → `upsertFactRow()`

**Lógica**:
1. Busca fila existente por: indicadorId + periodo + mes
2. Si existe: actualiza la fila
3. Si no existe: agrega nueva fila al final

**Conversión de Mes**:
- Frontend envía: "01", "02", "03", etc.
- Backend convierte a: "enero", "febrero", "marzo", etc.
- Google Sheets almacena nombres de meses

#### Lectura
**Archivo**: `server/src/analytics/analytics.service.ts` → `getDataFromGoogleSheets()`

**Lógica**:
1. Lee rango completo de la pestaña: `{nombre_pestaña}!A:S`
2. Parsea filas como objetos
3. Filtra por indicadorId y año (si se especifican)
4. Retorna datos formateados para gráficos

### Manejo de Errores

**Errores comunes**:
- `Unable to parse range: {nombre_pestaña}!A:S`
  - La pestaña no existe
  - El nombre de la pestaña es incorrecto
  
**Solución**:
- Verificar que existe la pestaña con el nombre exacto
- El mapeo de nombres está en `generateMinisterioTabName()`

---

## 🗄️ Base de Datos

### Entidades

#### 1. Usuario (`usuario`)
```typescript
{
  id: UUID (PK)
  nombre: string
  email: string (unique)
  password: string (hashed)
  rol: 'ADMIN' | 'USER'
  ministerioId: UUID (FK → ministerio)
  claveTemporal: boolean
  activo: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 2. Ministerio (`ministerio`)
```typescript
{
  id: UUID (PK)
  nombre: string
  sigla: string
  activo: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 3. Compromiso (`compromiso`)
```typescript
{
  id: UUID (PK)
  titulo: string
  descripcion: string
  ministerioId: UUID (FK → ministerio)
  activo: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 4. LineaAccion (`linea_accion`)
```typescript
{
  id: UUID (PK)
  nombre: string
  descripcion: string
  compromisoId: UUID (FK → compromiso)
  activo: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 5. Indicador (`indicador`)
```typescript
{
  id: UUID (PK)
  nombre: string
  descripcion: string
  unidadMedida: string
  tipo: 'porcentaje' | 'cantidad'
  lineaId: UUID (FK → linea_accion)
  activo: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 6. MetaMensual (`meta_mensual`)
```typescript
{
  id: UUID (PK)
  indicadorId: UUID (FK → indicador)
  mes: number (1-12)
  año: number (YYYY)
  valor: number
  periodo: string (YYYY-MM)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 7. CargaIndicador (`carga_indicador`)
```typescript
{
  id: UUID (PK)
  ministerioId: UUID (FK → ministerio)
  compromisoId: UUID (FK → compromiso)
  lineaId: UUID (FK → linea_accion)
  indicadorId: UUID (FK → indicador)
  usuarioId: UUID (FK → usuario)
  periodo: string (YYYY-MM)
  mes: string (número como string: "01", "02", etc.)
  valor: number
  unidadMedida: string
  descripcion: string (nullable)
  estado: 'PENDIENTE' | 'VALIDADO' | 'OBSERVADO' | 'RECHAZADO' | 'PUBLICADO'
  comentarios: string (nullable)
  validadoPor: UUID (FK → usuario, nullable)
  fechaValidacion: timestamp (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Relaciones

```
Usuario ───┬─> Ministerio
           └─> CargaIndicador (creador)
           └─> CargaIndicador (validador)

Ministerio ───> Compromiso ───> LineaAccion ───> Indicador ───┬─> MetaMensual
                                                                └─> CargaIndicador
```

### Soft Delete

Todas las entidades principales tienen campo `activo: boolean`:
- `true`: Entidad activa
- `false`: Entidad desactivada (soft deleted)

**Queries**:
```typescript
// Obtener solo activos
await repository.find({ where: { activo: true } });

// Soft delete
await repository.update(id, { activo: false });

// Reactivar
await repository.update(id, { activo: true });
```

---

## 🔌 API y Endpoints

### Base URL
- **Desarrollo**: `http://localhost:8080/api/v1`
- **Producción**: `https://tu-backend.onrender.com/api/v1`

### Autenticación

#### POST /auth/login
Login de usuario.

**Request**:
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Response**:
```json
{
  "access_token": "jwt_token",
  "user": {
    "id": "uuid",
    "nombre": "Nombre",
    "email": "email",
    "rol": "ADMIN",
    "ministerioId": "uuid",
    "claveTemporal": false
  }
}
```

#### POST /auth/logout
Cierra sesión (solo invalida token en frontend).

---

### Cargas

#### GET /cargas/stats-from-sheets
Obtiene estadísticas desde Google Sheets.

**Response**:
```json
{
  "totalCargas": 150,
  "cargasPendientes": 10,
  "cargasValidadas": 100,
  "cargasObservadas": 5,
  "cargasRechazadas": 5,
  "cargasPublicadas": 100,
  "source": "google-sheets"
}
```

#### GET /cargas/mis-cargas
Obtiene cargas del usuario actual.

**Query Params**:
- `estado`: PENDIENTE | VALIDADO | OBSERVADO | RECHAZADO | PUBLICADO

#### POST /cargas
Crea nueva carga de indicador.

**Request**:
```json
{
  "ministerioId": "uuid",
  "compromisoId": "uuid",
  "lineaId": "uuid",
  "indicadorId": "uuid",
  "periodo": "2025-01",
  "mes": "01",
  "valor": 150,
  "unidadMedida": "unidades",
  "descripcion": "Opcional"
}
```

#### PUT /cargas/:id/validar
Valida una carga (Admin).

#### PUT /cargas/:id/observar
Marca carga como observada (Admin).

**Request**:
```json
{
  "comentarios": "Comentario obligatorio"
}
```

#### PUT /cargas/:id/rechazar
Rechaza una carga (Admin).

**Request**:
```json
{
  "comentarios": "Razón del rechazo"
}
```

#### PUT /cargas/:id/publicar
Publica una carga (Admin).

---

### Catálogos

#### GET /catalogos/ministerios
Lista de ministerios activos.

#### GET /catalogos/compromisos/:ministerioId
Compromisos de un ministerio.

#### GET /catalogos/lineas/:compromisoId
Líneas de acción de un compromiso.

#### GET /catalogos/indicadores/:lineaId
Indicadores de una línea de acción.

#### GET /catalogos/metas/:indicadorId
Metas mensuales de un indicador.

**Query Params**:
- `año`: Año (YYYY)
- `mes`: Mes (1-12)

---

### Analytics

#### GET /analytics/ministerios
Lista de ministerios para analytics.

#### GET /analytics/compromisos/:ministerioId
Compromisos de un ministerio.

#### GET /analytics/indicadores/:compromisoId
Indicadores de un compromiso.

#### GET /analytics/datos
Datos para gráficos.

**Query Params**:
- `indicadorId`: UUID del indicador (o "all" para vista global)
- `vista`: "mensual" | "total"
- `año`: Año (YYYY)

**Response**:
```json
{
  "ministerio": "Nombre",
  "compromiso": "Nombre",
  "indicador": "Nombre",
  "tipo": "porcentaje",
  "vista": "mensual",
  "datos": {
    "periodos": ["enero", "febrero"],
    "valores": [100, 150],
    "metas": [120, 140]
  },
  "configuracion": {
    "tipoGrafico": "line",
    "colores": ["#0088FE"]
  }
}
```

#### GET /analytics/resumen
Resumen global del sistema.

**Response**:
```json
{
  "totalMinisterios": 10,
  "totalCompromisos": 50,
  "totalIndicadores": 200,
  "cargasValidadas": 500,
  "cargasPendientes": 20,
  "porcentajeCumplimiento": 85.5
}
```

---

### Administración

#### GET /admin/usuarios
Lista de usuarios (Admin).

#### POST /admin/usuarios
Crea usuario (Admin).

**Request**:
```json
{
  "nombre": "Nombre",
  "email": "email@ejemplo.com",
  "rol": "USER",
  "ministerioId": "uuid"
}
```

**Response**:
```json
{
  "user": { ... },
  "temporaryPassword": "TempPass123"
}
```

#### PUT /admin/usuarios/:id
Actualiza usuario (Admin).

#### DELETE /admin/usuarios/:id
Desactiva usuario (Admin).

#### PUT /admin/usuarios/:id/reset-password
Resetea contraseña (Admin).

**Response**:
```json
{
  "newPassword": "NewTempPass456"
}
```

---

### Sincronización

#### POST /sync/sync-to-sheets
Sincroniza datos a Google Sheets (Admin).

**Query Params**:
- `cargaId`: UUID de carga específica (opcional)
- Si no se provee, sincroniza todas las cargas publicadas

---

### Perfil

#### GET /perfil
Obtiene perfil del usuario actual.

#### PUT /perfil/cambiar-password
Cambia contraseña del usuario actual.

**Request**:
```json
{
  "currentPassword": "actual",
  "newPassword": "nueva"
}
```

---

## 🔄 Flujo de Datos

### Flujo de Carga de Indicador

```
1. Usuario selecciona Ministerio
   └─> GET /catalogos/ministerios
   
2. Usuario selecciona Compromiso
   └─> GET /catalogos/compromisos/:ministerioId
   
3. Usuario selecciona Línea de Acción
   └─> GET /catalogos/lineas/:compromisoId
   
4. Usuario selecciona Indicador
   └─> GET /catalogos/indicadores/:lineaId
   
5. Sistema carga Metas
   └─> GET /catalogos/metas/:indicadorId?año=2025
   
6. Usuario completa formulario y envía
   └─> POST /cargas
       ├─> Guarda en PostgreSQL (estado: PENDIENTE)
       └─> Trigger: POST /sync/sync-to-sheets
           └─> Escribe en Google Sheets
```

### Flujo de Validación (Admin)

```
1. Admin accede a /revision
   └─> GET /cargas/pendientes
   
2. Admin revisa carga y decide acción
   ├─> PUT /cargas/:id/validar (estado: VALIDADO)
   ├─> PUT /cargas/:id/observar (estado: OBSERVADO)
   └─> PUT /cargas/:id/rechazar (estado: RECHAZADO)
   
3. Admin publica carga validada
   └─> PUT /cargas/:id/publicar (estado: PUBLICADO)
       └─> Trigger: Actualiza Google Sheets
```

### Flujo de Analytics

```
1. Usuario accede a /analytics
   └─> GET /analytics/ministerios
   
2. Usuario selecciona filtros
   ├─> GET /analytics/compromisos/:ministerioId
   ├─> GET /analytics/indicadores/:compromisoId
   └─> Usuario selecciona año
   
3. Sistema carga datos
   └─> GET /analytics/datos?indicadorId=xxx&vista=mensual&año=2025
       └─> Backend lee Google Sheets
           ├─> Filtra por año
           ├─> Agrupa por mes
           └─> Formatea para Recharts
           
4. Frontend renderiza gráfico
   └─> Recharts visualiza datos
```

---

## ⚠️ Gestión de Errores

### Errores de Conexión con Google Sheets

**Comportamiento actual**:
- **NO hay fallback** a base de datos local
- Si falla la conexión, se muestra toast con:
  ```
  Error de conexión. Por favor, reinicie la página.
  Si el error persiste, contacte a un administrador.
  ```
- Duración del toast: 8 segundos

**Archivos afectados**:
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/analytics/page.tsx`

**Funciones con manejo de errores**:
- Dashboard: `loadDashboardData()`
- Analytics: `loadAnalyticsData()`, `loadVistaGlobal()`, `loadMinisterios()`, `loadCompromisos()`, `loadIndicadores()`

### Errores de Autenticación

- Token expirado: Redirige a `/login`
- Credenciales inválidas: Toast de error
- Usuario desactivado: "Usuario no encontrado o inactivo"

### Errores de Validación

- Campos faltantes: Toast de error específico
- Formato incorrecto: Validación en frontend y backend
- Meta no encontrada: Permite crear nueva meta

---

## 👥 Roles y Permisos

### Usuario Regular (USER)

**Puede**:
- Ver `/home`, `/dashboard`, `/carga`, `/mis-envios`, `/publicadas`, `/analytics`, `/manual`, `/perfil`
- Cargar indicadores
- Ver sus propias cargas
- Ver cargas publicadas
- Ver analytics
- Cambiar su contraseña

**No puede**:
- Acceder a `/revision`, `/admin/*`, `/gestion`, `/creacion`
- Validar/observar/rechazar cargas
- Gestionar usuarios
- Crear ministerios/compromisos/indicadores
- Forzar sincronización

### Administrador (ADMIN)

**Puede todo lo que puede USER, más**:
- Acceder a todas las rutas
- Validar/observar/rechazar/publicar cargas
- Gestionar usuarios (crear, editar, desactivar, resetear contraseña)
- Gestionar catálogos (ministerios, compromisos, líneas, indicadores)
- Forzar sincronización con Google Sheets
- Ver logs y estado del sistema

### Protección de Rutas

**Frontend**:
```typescript
// Hook para verificar autenticación
const isAuthenticated = useIsAuthenticated();

// Hook para verificar rol admin
const isAdmin = useIsAdmin();

// Ejemplo de uso
useEffect(() => {
  if (!isAuthenticated) {
    router.push('/login');
  }
  if (!isAdmin) {
    router.push('/home');
  }
}, [isAuthenticated, isAdmin, router]);
```

**Backend**:
```typescript
// Guard JWT para rutas protegidas
@UseGuards(JwtAuthGuard)
@Controller('cargas')
export class CargasController { ... }

// Guard de rol admin
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController { ... }
```

---

## 🔧 Mantenimiento y Debugging

### Logs Importantes

#### Backend (NestJS)
```typescript
// Logs de sincronización
console.log('🔄 Iniciando sincronización...');
console.log('✅ Sincronización exitosa');
console.log('❌ Error en sincronización:', error);

// Logs de Google Sheets
console.log('📊 Leyendo datos de Google Sheets...');
console.log('📝 Escribiendo en Google Sheets...');

// Logs de autenticación
console.log('🔐 Usuario autenticado:', userId);
```

#### Frontend (Next.js)
```typescript
// Logs de carga de datos
console.log('🔄 Cargando ministerios...');
console.log('📊 Datos recibidos:', data);
console.log('❌ Error:', error);
```

### Comandos Útiles

```bash
# Desarrollo Frontend
cd frontend
npm run dev

# Desarrollo Backend
cd server
npm run start:dev

# Build Frontend
cd frontend
npm run build

# Build Backend
cd server
npm run build

# Generar tokens de Google
node generar-token-simple.js
```

### Variables a Verificar

1. **Google Sheets**:
   - `GOOGLE_SPREADSHEET_ID`: ID correcto del spreadsheet
   - Tokens válidos en `token-info.json`
   - Credenciales correctas en archivo JSON

2. **Base de Datos**:
   - Conexión PostgreSQL activa
   - Migraciones ejecutadas
   - Entidades sincronizadas

3. **JWT**:
   - `JWT_SECRET` configurado
   - Token no expirado

---

## 📚 Referencias y Recursos

### Documentación Oficial

- **Next.js**: https://nextjs.org/docs
- **NestJS**: https://docs.nestjs.com
- **TypeORM**: https://typeorm.io
- **Google Sheets API**: https://developers.google.com/sheets/api
- **Recharts**: https://recharts.org
- **Tailwind CSS**: https://tailwindcss.com

### Dependencias Principales

#### Frontend
```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "typescript": "^5.0.0",
  "zustand": "^4.0.0",
  "recharts": "^2.0.0",
  "tailwindcss": "^3.0.0",
  "react-hot-toast": "^2.0.0"
}
```

#### Backend
```json
{
  "@nestjs/core": "^10.0.0",
  "@nestjs/typeorm": "^10.0.0",
  "typeorm": "^0.3.0",
  "pg": "^8.0.0",
  "googleapis": "^128.0.0",
  "jsonwebtoken": "^9.0.0",
  "bcryptjs": "^2.4.0"
}
```

---

## 🎯 Mejores Prácticas para Desarrollo

### 1. Antes de Modificar Código

- Lee este README completo
- Entiende el flujo de datos
- Verifica las entidades y relaciones
- Revisa los endpoints relacionados

### 2. Al Agregar Nuevas Funcionalidades

- Sigue la estructura existente
- Usa TypeScript con tipos explícitos
- Agrega validación en frontend y backend
- Actualiza este README

### 3. Al Modificar Google Sheets

- Asegúrate de que el nombre de la pestaña siga el formato
- Respeta el orden de las columnas
- Prueba la sincronización después de cambios
- Verifica los logs de sincronización

### 4. Al Trabajar con Autenticación

- Nunca commitees credenciales
- Usa variables de entorno
- Valida tokens en cada request
- Implementa manejo de errores para tokens expirados

### 5. Al Hacer Deploy

- Verifica todas las variables de entorno
- Prueba la conexión con Google Sheets
- Verifica la conexión con PostgreSQL
- Revisa los logs de deploy

---

## 📞 Contacto y Soporte

Para cualquier duda o problema con el sistema, contactar a los administradores del sistema SIPIO.

---

**Última actualización**: Octubre 2025
**Versión**: 1.0.0
