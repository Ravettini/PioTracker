# Contrato de API - PIO Tracker

## Información General

- **Base URL**: `http://localhost:8080/api/v1`
- **Formato**: JSON
- **Autenticación**: JWT en cookies httpOnly
- **Versión**: 1.0.0

## Autenticación

### POST /auth/login
Inicia sesión de usuario.

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Response (200):**
```json
{
  "usuario": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "nombre": "Nombre Usuario",
    "rol": "USUARIO",
    "ministerioId": "DES",
    "ministerio": {
      "id": "DES",
      "nombre": "Desarrollo Económico y Social",
      "sigla": "DES"
    },
    "claveTemporal": false
  },
  "message": "Login exitoso"
}
```

**Cookies establecidas:**
- `access_token`: JWT de acceso (12h)
- `refresh_token`: JWT de refresh (7 días)

### POST /auth/logout
Cierra sesión del usuario.

**Response (200):**
```json
{
  "message": "Logout exitoso"
}
```

### POST /auth/refresh
Renueva el token de acceso usando el refresh token.

**Response (200):**
```json
{
  "message": "Token refrescado exitosamente"
}
```

### POST /auth/cambiar-clave
Cambia la contraseña del usuario.

**Request Body:**
```json
{
  "currentPassword": "contraseñaActual",
  "newPassword": "nuevaContraseña123"
}
```

**Response (200):**
```json
{
  "message": "Contraseña cambiada exitosamente"
}
```

### GET /auth/me
Obtiene el perfil del usuario autenticado.

**Response (200):**
```json
{
  "id": "uuid",
  "email": "usuario@ejemplo.com",
  "nombre": "Nombre Usuario",
  "rol": "USUARIO",
  "ministerioId": "DES",
  "ministerio": {
    "id": "DES",
    "nombre": "Desarrollo Económico y Social",
    "sigla": "DES"
  },
  "claveTemporal": false,
  "ultimoLogin": "2025-08-27T10:00:00Z"
}
```

## Administración (Solo ADMIN)

### POST /admin/usuarios
Crea un nuevo usuario.

**Request Body:**
```json
{
  "email": "nuevo@ejemplo.com",
  "nombre": "Nuevo Usuario",
  "rol": "USUARIO",
  "ministerioId": "DES"
}
```

**Response (201):**
```json
{
  "message": "Usuario creado exitosamente",
  "usuario": {
    "id": "uuid",
    "email": "nuevo@ejemplo.com",
    "nombre": "Nuevo Usuario",
    "rol": "USUARIO",
    "ministerioId": "DES",
    "activo": true,
    "claveTemporal": true,
    "passwordTemporal": "AbC123Xy"
  }
}
```

### GET /admin/usuarios
Lista usuarios con filtros.

**Query Parameters:**
- `q`: Búsqueda por nombre
- `rol`: Filtro por rol (ADMIN/USUARIO)
- `ministerioId`: Filtro por ministerio
- `activo`: Filtro por estado (true/false)
- `limit`: Límite de resultados (default: 20)
- `offset`: Offset para paginación (default: 0)

**Response (200):**
```json
{
  "usuarios": [
    {
      "id": "uuid",
      "email": "usuario@ejemplo.com",
      "nombre": "Nombre Usuario",
      "rol": "USUARIO",
      "ministerioId": "DES",
      "activo": true,
      "claveTemporal": false,
      "ultimoLogin": "2025-08-27T10:00:00Z",
      "creadoEn": "2025-08-27T09:00:00Z"
    }
  ],
  "total": 1
}
```

### GET /admin/usuarios/:id
Obtiene un usuario específico.

**Response (200):**
```json
{
  "id": "uuid",
  "email": "usuario@ejemplo.com",
  "nombre": "Nombre Usuario",
  "rol": "USUARIO",
  "ministerioId": "DES",
  "activo": true,
  "claveTemporal": false,
  "ultimoLogin": "2025-08-27T10:00:00Z",
  "creadoEn": "2025-08-27T09:00:00Z",
  "actualizadoEn": "2025-08-27T09:00:00Z"
}
```

### PUT /admin/usuarios/:id
Actualiza un usuario.

**Request Body:**
```json
{
  "nombre": "Nuevo Nombre",
  "rol": "ADMIN",
  "ministerioId": null,
  "activo": true
}
```

**Response (200):**
```json
{
  "message": "Usuario actualizado exitosamente",
  "usuario": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "nombre": "Nuevo Nombre",
    "rol": "ADMIN",
    "ministerioId": null,
    "activo": true
  }
}
```

### PUT /admin/usuarios/:id/toggle-status
Activa/desactiva un usuario.

**Response (200):**
```json
{
  "message": "Usuario activado exitosamente",
  "usuario": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "nombre": "Nombre Usuario",
    "activo": true
  }
}
```

### PUT /admin/usuarios/:id/reset-password
Resetea la contraseña de un usuario.

**Response (200):**
```json
{
  "message": "Contraseña reseteada exitosamente",
  "passwordTemporal": "XyZ789Ab"
}
```

### GET /admin/ministerios
Lista ministerios disponibles.

**Response (200):**
```json
[
  {
    "id": "DES",
    "nombre": "Desarrollo Económico y Social",
    "sigla": "DES",
    "activo": true
  }
]
```

## Catálogos

### GET /catalogos/ministerios
Lista todos los ministerios activos.

**Response (200):**
```json
[
  {
    "id": "DES",
    "nombre": "Desarrollo Económico y Social",
    "sigla": "DES",
    "activo": true
  }
]
```

### GET /catalogos/lineas
Lista líneas con filtro opcional por ministerio.

**Query Parameters:**
- `ministerio_id`: ID del ministerio (opcional)

**Response (200):**
```json
[
  {
    "id": "DES-EMP",
    "titulo": "Empleo y Desarrollo Productivo",
    "ministerioId": "DES",
    "activo": true,
    "ministerio": {
      "id": "DES",
      "nombre": "Desarrollo Económico y Social",
      "sigla": "DES"
    }
  }
]
```

### GET /catalogos/indicadores
Lista indicadores con filtro opcional por línea.

**Query Parameters:**
- `linea_id`: ID de la línea (opcional)

**Response (200):**
```json
[
  {
    "id": "EMP-TASA",
    "nombre": "Tasa de Empleo",
    "lineaId": "DES-EMP",
    "unidadDefecto": "%",
    "periodicidad": "mensual",
    "activo": true,
    "valorMin": 0,
    "valorMax": 100,
    "linea": {
      "id": "DES-EMP",
      "titulo": "Empleo y Desarrollo Productivo",
      "ministerioId": "DES"
    }
  }
]
```

## Cargas

### POST /cargas
Crea una nueva carga de indicador.

**Request Body:**
```json
{
  "ministerioId": "DES",
  "lineaId": "DES-EMP",
  "indicadorId": "EMP-TASA",
  "periodo": "2025-08",
  "valor": 85.5,
  "unidad": "%",
  "meta": 90.0,
  "fuente": "Encuesta de Empleo",
  "responsableNombre": "Juan Pérez",
  "responsableEmail": "juan.perez@ejemplo.com",
  "observaciones": "Datos preliminares del mes"
}
```

**Response (201):**
```json
{
  "message": "Carga creada exitosamente",
  "carga": {
    "id": "uuid",
    "estado": "borrador",
    "creadoEn": "2025-08-27T10:00:00Z"
  }
}
```

### GET /cargas
Lista cargas con filtros.

**Query Parameters:**
- `ministerioId`: Filtro por ministerio
- `indicadorId`: Filtro por indicador
- `periodo`: Filtro por período
- `estado`: Filtro por estado
- `limit`: Límite de resultados (default: 20)
- `offset`: Offset para paginación (default: 0)

**Response (200):**
```json
{
  "cargas": [
    {
      "id": "uuid",
      "ministerioId": "DES",
      "lineaId": "DES-EMP",
      "indicadorId": "EMP-TASA",
      "periodicidad": "mensual",
      "periodo": "2025-08",
      "valor": 85.5,
      "unidad": "%",
      "meta": 90.0,
      "fuente": "Encuesta de Empleo",
      "responsableNombre": "Juan Pérez",
      "responsableEmail": "juan.perez@ejemplo.com",
      "observaciones": "Datos preliminares del mes",
      "estado": "borrador",
      "publicado": false,
      "creadoEn": "2025-08-27T10:00:00Z",
      "actualizadoEn": "2025-08-27T10:00:00Z",
      "ministerio": {
        "id": "DES",
        "nombre": "Desarrollo Económico y Social",
        "sigla": "DES"
      },
      "linea": {
        "id": "DES-EMP",
        "titulo": "Empleo y Desarrollo Productivo"
      },
      "indicador": {
        "id": "EMP-TASA",
        "nombre": "Tasa de Empleo",
        "unidadDefecto": "%"
      },
      "creadoPorUsuario": {
        "id": "uuid",
        "nombre": "Juan Pérez",
        "email": "juan.perez@ejemplo.com"
      }
    }
  ],
  "total": 1
}
```

### GET /cargas/:id
Obtiene una carga específica.

**Response (200):**
```json
{
  "id": "uuid",
  "ministerioId": "DES",
  "lineaId": "DES-EMP",
  "indicadorId": "EMP-TASA",
  "periodicidad": "mensual",
  "periodo": "2025-08",
  "valor": 85.5,
  "unidad": "%",
  "meta": 90.0,
  "fuente": "Encuesta de Empleo",
  "responsableNombre": "Juan Pérez",
  "responsableEmail": "juan.perez@ejemplo.com",
  "observaciones": "Datos preliminares del mes",
  "estado": "borrador",
  "publicado": false,
  "creadoEn": "2025-08-27T10:00:00Z",
  "actualizadoEn": "2025-08-27T10:00:00Z",
  "ministerio": {
    "id": "DES",
    "nombre": "Desarrollo Económico y Social",
    "sigla": "DES"
  },
  "linea": {
    "id": "DES-EMP",
    "titulo": "Empleo y Desarrollo Productivo"
  },
  "indicador": {
    "id": "EMP-TASA",
    "nombre": "Tasa de Empleo",
    "unidadDefecto": "%"
  },
  "creadoPorUsuario": {
    "id": "uuid",
    "nombre": "Juan Pérez",
    "email": "juan.perez@ejemplo.com"
  },
  "actualizadoPorUsuario": {
    "id": "uuid",
    "nombre": "Juan Pérez",
    "email": "juan.perez@ejemplo.com"
  }
}
```

### PUT /cargas/:id
Actualiza una carga (solo borradores).

**Request Body:**
```json
{
  "valor": 86.0,
  "meta": 92.0,
  "observaciones": "Datos actualizados del mes"
}
```

**Response (200):**
```json
{
  "message": "Carga actualizada exitosamente",
  "carga": {
    "id": "uuid",
    "estado": "borrador",
    "actualizadoEn": "2025-08-27T11:00:00Z"
  }
}
```

### POST /cargas/:id/enviar
Envía una carga a revisión.

**Response (200):**
```json
{
  "message": "Carga enviada a revisión exitosamente",
  "carga": {
    "id": "uuid",
    "estado": "pendiente",
    "actualizadoEn": "2025-08-27T11:00:00Z"
  }
}
```

### POST /cargas/:id/revision
Revisa una carga (solo ADMIN).

**Request Body:**
```json
{
  "estado": "validado"
}
```

**Response (200):**
```json
{
  "message": "Carga validada exitosamente",
  "carga": {
    "id": "uuid",
    "estado": "validado",
    "observaciones": null,
    "actualizadoEn": "2025-08-27T12:00:00Z"
  }
}
```

## Sincronización (Solo ADMIN)

### POST /sync/push/:id
Publica una carga específica en Google Sheets.

**Response (200):**
```json
{
  "success": true,
  "message": "Carga sincronizada exitosamente"
}
```

### POST /sync/push-pendientes
Publica todas las cargas validadas pendientes.

**Response (200):**
```json
{
  "success": true,
  "message": "Sincronización completada. Procesadas: 5, Errores: 0",
  "processed": 5,
  "errors": 0
}
```

### GET /sync/estado/:id
Obtiene el estado de sincronización de una carga.

**Response (200):**
```json
{
  "id": "uuid",
  "estado": "validado",
  "publicado": true,
  "ultimaSincronizacion": "2025-08-27T12:00:00Z"
}
```

### GET /sync/estado-general
Obtiene el estado general de sincronización.

**Response (200):**
```json
{
  "totalCargas": 25,
  "cargasValidadas": 20,
  "cargasPublicadas": 18,
  "cargasPendientes": 2,
  "googleSheetsStatus": {
    "connected": true,
    "message": "Conectado exitosamente a Google Sheets"
  }
}
```

## Códigos de Error

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "El período 2025-13 no es válido para la periodicidad mensual",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Credenciales inválidas",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "No tienes permisos para crear cargas en este ministerio",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Carga no encontrada",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Ya existe una carga pendiente para este indicador, período y ministerio",
  "error": "Conflict"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Error interno del servidor",
  "error": "Internal Server Error"
}
```

## Estados de Carga

- **borrador**: Carga en edición
- **pendiente**: Enviada a revisión
- **validado**: Aprobada por admin
- **observado**: Requiere correcciones
- **rechazado**: No aprobada

## Transiciones de Estado

1. **borrador** → **pendiente** (POST /cargas/:id/enviar)
2. **pendiente** → **validado** (POST /cargas/:id/revision)
3. **pendiente** → **observado** (POST /cargas/:id/revision)
4. **pendiente** → **rechazado** (POST /cargas/:id/revision)
5. **observado** → **borrador** (PUT /cargas/:id - editar)

## Validaciones

### Períodos
- **Mensual**: YYYY-MM (ej: 2025-08)
- **Trimestral**: YYYYQn (ej: 2025Q2)
- **Semestral**: YYYYSn (ej: 2025S1)
- **Anual**: YYYY (ej: 2025)

### Contraseñas
- Mínimo 8 caracteres
- Se requiere cambio en primer login si es temporal

### Valores
- Deben ser numéricos
- Pueden tener rangos mínimos/máximos por indicador
- No se permiten duplicados para el mismo indicador, período y ministerio

## Rate Limiting

- **Límite**: 100 requests por 15 minutos
- **Headers de respuesta**:
  - `X-RateLimit-Limit`: Límite de requests
  - `X-RateLimit-Remaining`: Requests restantes
  - `X-RateLimit-Reset`: Tiempo de reset

## Seguridad

- **JWT**: Tokens en cookies httpOnly
- **CSRF**: Protección en mutaciones (producción)
- **CORS**: Solo origen configurado
- **Helmet**: Headers de seguridad
- **Validación**: Class-validator en todos los DTOs








