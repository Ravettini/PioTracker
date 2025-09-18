# Modelo de Datos - PIO Tracker

## Descripción General

El sistema PIO Tracker utiliza PostgreSQL como base de datos principal, con un modelo relacional diseñado para gestionar indicadores de políticas públicas, usuarios, y auditoría completa de cambios.

## Esquema de Base de Datos

### Diagrama ER

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  ministerios│    │    lineas   │    │ indicadores│
├─────────────┤    ├─────────────┤    ├─────────────┤
│ id (PK)     │◄───┤ ministerioId│    │ id (PK)     │
│ nombre      │    │ id (PK)     │◄───┤ lineaId     │
│ sigla       │    │ titulo      │    │ nombre      │
│ activo      │    │ activo      │    │ unidad_def  │
└─────────────┘    └─────────────┘    │ periodicidad│
                                      │ activo      │
┌─────────────┐    ┌─────────────┐    │ valor_min   │
│   usuarios  │    │    cargas   │    │ valor_max   │
├─────────────┤    ├─────────────┤    └─────────────┘
│ id (PK)     │    │ id (PK)     │
│ email       │    │ ministerioId│
│ nombre      │    │ lineaId     │
│ hash_clave  │    │ indicadorId │
│ rol         │    │ periodicidad│
│ ministerioId│    │ periodo     │
│ activo      │    │ valor       │
│ clave_temp  │    │ unidad      │
│ ultimo_login│    │ meta        │
│ intentos_f  │    │ fuente      │
│ bloqueado_h │    │ resp_nombre │
│ creado_en   │    │ resp_email  │
│ actualizado │    │ observacion │
└─────────────┘    │ estado      │
                   │ publicado   │
                   │ creado_por  │
                   │ actualizado │
                   │ creado_en   │
                   │ actualizado │
                   └─────────────┘
                          │
                          │
                   ┌─────────────┐
                   │  auditoria  │
                   ├─────────────┤
                   │ id (PK)     │
                   │ actor_id    │
                   │ accion      │
                   │ objeto      │
                   │ objeto_id   │
                   │ antes       │
                   │ despues     │
                   │ ip          │
                   │ user_agent  │
                   │ cuando      │
                   └─────────────┘
```

## Entidades

### 1. ministerios

Tabla principal para almacenar los ministerios del gobierno.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `text` | PK, NOT NULL | Identificador único del ministerio |
| `nombre` | `text` | NOT NULL | Nombre completo del ministerio |
| `sigla` | `text` | NOT NULL | Sigla o abreviatura del ministerio |
| `activo` | `boolean` | NOT NULL, DEFAULT true | Estado de activación del ministerio |

**Ejemplo de datos:**
```sql
INSERT INTO ministerios VALUES
('DES', 'Desarrollo Económico y Social', 'DES', true),
('EDU', 'Educación', 'EDU', true),
('SAL', 'Salud', 'SAL', true);
```

### 2. lineas

Tabla para almacenar las líneas de acción dentro de cada ministerio.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `text` | PK, NOT NULL | Identificador único de la línea |
| `titulo` | `text` | NOT NULL | Título descriptivo de la línea |
| `ministerio_id` | `text` | FK, NOT NULL | Referencia al ministerio |
| `activo` | `boolean` | NOT NULL, DEFAULT true | Estado de activación de la línea |

**Relaciones:**
- `ministerio_id` → `ministerios.id`

**Ejemplo de datos:**
```sql
INSERT INTO lineas VALUES
('DES-EMP', 'Empleo y Desarrollo Productivo', 'DES', true),
('DES-COM', 'Comercio y Servicios', 'DES', true),
('EDU-ESC', 'Educación Escolar', 'EDU', true);
```

### 3. indicadores

Tabla para almacenar los indicadores de seguimiento de políticas.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `text` | PK, NOT NULL | Identificador único del indicador |
| `nombre` | `text` | NOT NULL | Nombre descriptivo del indicador |
| `linea_id` | `text` | FK, NOT NULL | Referencia a la línea |
| `unidad_defecto` | `text` | NOT NULL | Unidad de medida por defecto |
| `periodicidad` | `enum` | NOT NULL | Frecuencia de medición |
| `activo` | `boolean` | NOT NULL, DEFAULT true | Estado de activación |
| `valor_min` | `numeric` | NULL | Valor mínimo permitido |
| `valor_max` | `numeric` | NULL | Valor máximo permitido |

**Enums:**
- `periodicidad`: `mensual`, `trimestral`, `semestral`, `anual`

**Relaciones:**
- `linea_id` → `lineas.id`

**Ejemplo de datos:**
```sql
INSERT INTO indicadores VALUES
('EMP-TASA', 'Tasa de Empleo', 'DES-EMP', '%', 'mensual', true, 0, 100),
('EDU-MATRICULA', 'Tasa de Matrícula', 'EDU-ESC', '%', 'anual', true, 0, 100);
```

### 4. usuarios

Tabla para almacenar los usuarios del sistema.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `uuid` | PK, NOT NULL | Identificador único del usuario |
| `email` | `text` | UNIQUE, NOT NULL | Email del usuario (login) |
| `nombre` | `text` | NOT NULL | Nombre completo del usuario |
| `hash_clave` | `text` | NOT NULL | Hash de la contraseña (Argon2) |
| `rol` | `enum` | NOT NULL, DEFAULT 'USUARIO' | Rol del usuario en el sistema |
| `ministerio_id` | `text` | FK, NULL | Referencia al ministerio (NULL para ADMIN) |
| `activo` | `boolean` | NOT NULL, DEFAULT true | Estado de activación del usuario |
| `clave_temporal` | `boolean` | NOT NULL, DEFAULT false | Indica si debe cambiar la clave |
| `ultimo_login` | `timestamp` | NULL | Fecha del último inicio de sesión |
| `intentos_fallidos` | `integer` | NOT NULL, DEFAULT 0 | Contador de intentos fallidos |
| `bloqueado_hasta` | `timestamp` | NULL | Fecha hasta la cual está bloqueado |
| `creado_en` | `timestamp` | NOT NULL, DEFAULT now() | Fecha de creación |
| `actualizado_en` | `timestamp` | NOT NULL, DEFAULT now() | Fecha de última actualización |

**Enums:**
- `rol`: `ADMIN`, `USUARIO`

**Relaciones:**
- `ministerio_id` → `ministerios.id`

**Ejemplo de datos:**
```sql
INSERT INTO usuarios VALUES
(
  gen_random_uuid(),
  'admin@pio.local',
  'Administrador del Sistema',
  '$argon2id$v=19$m=65536,t=3,p=4$hash...',
  'ADMIN',
  NULL,
  true,
  false,
  NULL,
  0,
  NULL,
  now(),
  now()
);
```

### 5. cargas

Tabla principal para almacenar las cargas de indicadores.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `uuid` | PK, NOT NULL | Identificador único de la carga |
| `ministerio_id` | `text` | FK, NOT NULL | Referencia al ministerio |
| `linea_id` | `text` | FK, NOT NULL | Referencia a la línea |
| `indicador_id` | `text` | FK, NOT NULL | Referencia al indicador |
| `periodicidad` | `enum` | NOT NULL | Periodicidad del indicador |
| `periodo` | `text` | NOT NULL | Período de la medición |
| `valor` | `numeric` | NOT NULL | Valor numérico del indicador |
| `unidad` | `text` | NOT NULL | Unidad de medida |
| `meta` | `numeric` | NULL | Meta objetivo (opcional) |
| `fuente` | `text` | NOT NULL | Fuente de los datos |
| `responsable_nombre` | `text` | NOT NULL | Nombre del responsable |
| `responsable_email` | `text` | NOT NULL | Email del responsable |
| `observaciones` | `text` | NULL | Observaciones adicionales |
| `estado` | `enum` | NOT NULL, DEFAULT 'borrador' | Estado de la carga |
| `publicado` | `boolean` | NOT NULL, DEFAULT false | Indica si fue sincronizada |
| `creado_por` | `uuid` | FK, NOT NULL | Usuario que creó la carga |
| `actualizado_por` | `uuid` | FK, NOT NULL | Usuario que actualizó la carga |
| `creado_en` | `timestamp` | NOT NULL, DEFAULT now() | Fecha de creación |
| `actualizado_en` | `timestamp` | NOT NULL, DEFAULT now() | Fecha de última actualización |

**Enums:**
- `estado`: `borrador`, `pendiente`, `validado`, `observado`, `rechazado`

**Relaciones:**
- `ministerio_id` → `ministerios.id`
- `linea_id` → `lineas.id`
- `indicador_id` → `indicadores.id`
- `creado_por` → `usuarios.id`
- `actualizado_por` → `usuarios.id`

**Ejemplo de datos:**
```sql
INSERT INTO cargas VALUES
(
  gen_random_uuid(),
  'DES',
  'DES-EMP',
  'EMP-TASA',
  'mensual',
  '2025-08',
  85.5,
  '%',
  90.0,
  'Encuesta de Empleo',
  'Juan Pérez',
  'juan.perez@ejemplo.com',
  'Datos preliminares del mes',
  'borrador',
  false,
  'user-uuid',
  'user-uuid',
  now(),
  now()
);
```

### 6. auditoria

Tabla para registrar todas las acciones realizadas en el sistema.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `uuid` | PK, NOT NULL | Identificador único del registro |
| `actor_id` | `uuid` | FK, NOT NULL | Usuario que realizó la acción |
| `accion` | `enum` | NOT NULL | Tipo de acción realizada |
| `objeto` | `enum` | NOT NULL | Tipo de objeto afectado |
| `objeto_id` | `text` | NOT NULL | Identificador del objeto afectado |
| `antes` | `jsonb` | NULL | Estado anterior (JSON) |
| `despues` | `jsonb` | NULL | Estado posterior (JSON) |
| `ip` | `inet` | NULL | Dirección IP del usuario |
| `user_agent` | `text` | NULL | User-Agent del navegador |
| `cuando` | `timestamp` | NOT NULL, DEFAULT now() | Fecha y hora de la acción |

**Enums:**
- `accion`: `crear`, `editar`, `enviar`, `aprobar`, `observar`, `rechazar`, `publicar`, `login`, `logout`, `cambiar_clave`, `bloquear`, `activar`
- `objeto`: `cargas`, `usuarios`, `indicadores`, `sync`, `ministerios`, `lineas`

**Relaciones:**
- `actor_id` → `usuarios.id`

**Ejemplo de datos:**
```sql
INSERT INTO auditoria VALUES
(
  gen_random_uuid(),
  'user-uuid',
  'crear',
  'cargas',
  'carga-uuid',
  NULL,
  '{"valor": 85.5, "estado": "borrador"}',
  '192.168.1.100',
  'Mozilla/5.0...',
  now()
);
```

## Índices

### Índices Primarios
- Todas las tablas tienen índices primarios en sus campos `id`

### Índices Únicos
- `usuarios.email` - Garantiza emails únicos
- `cargas(indicador_id, periodo, ministerio_id)` - Índice único filtrado para estados pendiente/validado

### Índices de Rendimiento
- `cargas.estado` - Para filtrar por estado
- `cargas.creado_en` - Para ordenamiento cronológico
- `auditoria.actor_id, auditoria.cuando` - Para consultas de auditoría por usuario
- `auditoria.objeto, auditoria.objeto_id` - Para consultas de auditoría por objeto
- `auditoria.cuando` - Para consultas de auditoría por fecha

## Reglas de Negocio

### 1. Estados de Carga

**Transiciones permitidas:**
```
borrador → pendiente → validado
                ↓
            observado → borrador
                ↓
            rechazado
```

**Reglas:**
- Solo se pueden editar cargas en estado `borrador`
- Solo se pueden enviar cargas en estado `borrador`
- Solo se pueden revisar cargas en estado `pendiente`
- Las cargas `observadas` vuelven a `borrador` para correcciones
- Las cargas `rechazadas` no se pueden modificar

### 2. Validaciones de Período

**Formatos válidos por periodicidad:**
- **Mensual**: `YYYY-MM` (ej: 2025-08)
- **Trimestral**: `YYYYQn` (ej: 2025Q2)
- **Semestral**: `YYYYSn` (ej: 2025S1)
- **Anual**: `YYYY` (ej: 2025)

### 3. Duplicados

**Restricción única:**
- No se permiten cargas duplicadas para la misma combinación de `indicador_id`, `periodo` y `ministerio_id` cuando el estado es `pendiente` o `validado`

### 4. Permisos por Ministerio

**Reglas:**
- Usuarios con rol `USUARIO` solo pueden acceder a datos de su ministerio asignado
- Usuarios con rol `ADMIN` tienen acceso completo a todos los ministerios
- Las cargas se filtran automáticamente por ministerio del usuario

### 5. Contraseñas

**Políticas:**
- Mínimo 8 caracteres
- Hash con Argon2
- Bloqueo temporal tras 5 intentos fallidos
- Cambio obligatorio en primer login si es temporal

### 6. Auditoría

**Registro automático de:**
- Login/logout de usuarios
- Creación, edición y eliminación de entidades
- Cambios de estado en cargas
- Operaciones de sincronización
- Cambios de contraseña y estado de usuario

## Consultas Comunes

### 1. Cargas por Usuario y Estado

```sql
SELECT c.*, m.nombre as ministerio_nombre, l.titulo as linea_titulo, i.nombre as indicador_nombre
FROM cargas c
JOIN ministerios m ON c.ministerio_id = m.id
JOIN lineas l ON c.linea_id = l.id
JOIN indicadores i ON c.indicador_id = i.id
WHERE c.creado_por = $1 AND c.estado = $2
ORDER BY c.creado_en DESC;
```

### 2. Estadísticas por Ministerio

```sql
SELECT 
  m.nombre,
  COUNT(c.id) as total_cargas,
  COUNT(CASE WHEN c.estado = 'validado' THEN 1 END) as validadas,
  COUNT(CASE WHEN c.estado = 'pendiente' THEN 1 END) as pendientes,
  COUNT(CASE WHEN c.publicado = true THEN 1 END) as publicadas
FROM ministerios m
LEFT JOIN cargas c ON m.id = c.ministerio_id
WHERE m.activo = true
GROUP BY m.id, m.nombre
ORDER BY m.nombre;
```

### 3. Historial de Auditoría por Usuario

```sql
SELECT a.*, u.nombre as actor_nombre
FROM auditoria a
JOIN usuarios u ON a.actor_id = u.id
WHERE a.actor_id = $1
ORDER BY a.cuando DESC
LIMIT 100;
```

### 4. Indicadores con Cargas Pendientes

```sql
SELECT i.nombre, i.periodicidad, COUNT(c.id) as cargas_pendientes
FROM indicadores i
JOIN cargas c ON i.id = c.indicador_id
WHERE c.estado = 'pendiente' AND i.activo = true
GROUP BY i.id, i.nombre, i.periodicidad
HAVING COUNT(c.id) > 0
ORDER BY cargas_pendientes DESC;
```

## Mantenimiento

### 1. Limpieza de Auditoría

```sql
-- Eliminar registros de auditoría mayores a 2 años
DELETE FROM auditoria 
WHERE cuando < NOW() - INTERVAL '2 years';
```

### 2. Optimización de Índices

```sql
-- Analizar uso de índices
ANALYZE;

-- Reindexar tablas grandes
REINDEX TABLE cargas;
REINDEX TABLE auditoria;
```

### 3. Backup y Restore

```bash
# Backup completo
pg_dump -h localhost -U postgres -d pio > pio_backup_$(date +%Y%m%d).sql

# Restore
psql -h localhost -U postgres -d pio < pio_backup_20250827.sql
```

## Consideraciones de Rendimiento

### 1. Particionamiento

Para tablas con alto volumen de datos (ej: auditoría), considerar particionamiento por fecha:

```sql
-- Particionar auditoría por mes
CREATE TABLE auditoria_2025_08 PARTITION OF auditoria
FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
```

### 2. Archivo de Datos

Para datos históricos, considerar archivo en tablas separadas:

```sql
-- Tabla de archivo para cargas antiguas
CREATE TABLE cargas_archivo (LIKE cargas INCLUDING ALL);
```

### 3. Compresión

Para datos históricos, habilitar compresión:

```sql
-- Habilitar compresión en tablas grandes
ALTER TABLE auditoria SET (compression = lz4);
```

## Seguridad

### 1. Encriptación

- Contraseñas hasheadas con Argon2
- Conexiones SSL en producción
- Tokens JWT firmados

### 2. Acceso

- Filtrado automático por ministerio
- Validación de roles en cada endpoint
- Auditoría completa de cambios

### 3. Validación

- Validación de entrada con class-validator
- Sanitización de datos
- Prevención de SQL injection








