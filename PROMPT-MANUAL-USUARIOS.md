# PROMPT PARA GENERAR MANUAL DE USUARIOS Y ROLES DEL SISTEMA SIPIO

Genera un manual completo de usuarios y roles para el sistema SIPIO (Sistema de Indicadores PIO), incluyendo descripción de cada rol, sus responsabilidades, permisos, y el flujo de trabajo completo.

## CONTEXTO DEL SISTEMA

SIPIO es un sistema web de seguimiento y gestión de indicadores de políticas públicas del Gobierno de la Ciudad de Buenos Aires. El sistema permite:

- Gestionar indicadores de cumplimiento de compromisos gubernamentales
- Crear, editar y enviar cargas de datos de indicadores
- Revisar y validar cargas enviadas por los ministerios
- Sincronizar datos validados con Google Sheets
- Realizar seguimiento y análisis de cumplimiento
- Auditar todas las acciones realizadas en el sistema

## ROLES EXISTENTES EN EL SISTEMA

El sistema cuenta con **DOS roles principales**:

### 1. ROL: ADMIN (Administrador)
### 2. ROL: USUARIO (Usuario de Ministerio)

---

## ESPECIFICACIONES DE CADA ROL

### ROL ADMIN - ADMINISTRADOR DEL SISTEMA

**Características:**
- No está asignado a ningún ministerio específico (ministerioId = null)
- Tiene acceso completo a todos los módulos del sistema
- Puede ver y gestionar información de todos los ministerios
- Es el único rol que puede crear y gestionar usuarios

**PERMISOS Y FUNCIONALIDADES:**

#### 1. GESTIÓN DE USUARIOS
- **Crear usuarios** (POST /admin/usuarios)
  - Crear nuevos usuarios con roles ADMIN o USUARIO
  - Asignar usuarios a ministerios específicos
  - El sistema genera automáticamente una contraseña temporal
  - El usuario debe cambiar la contraseña en el primer login
  
- **Listar y buscar usuarios** (GET /admin/usuarios)
  - Ver todos los usuarios del sistema
  - Filtrar por: rol, ministerio, estado (activo/inactivo)
  - Búsqueda por nombre o email
  - Paginación de resultados
  
- **Ver detalle de usuario** (GET /admin/usuarios/:id)
  - Ver toda la información de un usuario específico
  - Ver histórico de último login
  - Ver estado de cuenta (activo, bloqueado, intentos fallidos)
  
- **Actualizar usuarios** (PUT /admin/usuarios/:id)
  - Modificar nombre, rol, ministerio asignado
  - Cambiar estado activo/inactivo
  - Reasignar usuarios entre ministerios
  
- **Activar/Desactivar usuarios** (PUT /admin/usuarios/:id/toggle-status)
  - Activar cuentas desactivadas
  - Desactivar temporalmente usuarios
  
- **Resetear contraseñas** (PUT /admin/usuarios/:id/reset-password)
  - Generar nueva contraseña temporal para cualquier usuario
  - El usuario debe cambiar la contraseña en el próximo login
  
- **Eliminar usuarios** (DELETE /admin/usuarios/:id)
  - Eliminar usuarios del sistema
  - Acción con precaución, puede afectar auditoría

#### 2. GESTIÓN DE CARGAS DE INDICADORES

- **Crear cargas** (POST /cargas)
  - Crear cargas para cualquier ministerio
  - No está limitado por ministerio
  
- **Ver todas las cargas** (GET /cargas)
  - Ver cargas de todos los ministerios
  - Filtrar por: ministerio, estado, período, indicador
  - Sin restricción de ministerio
  
- **Editar cargas** (PUT /cargas/:id)
  - Editar cargas de cualquier ministerio
  - Solo cargas en estado "borrador" pueden editarse
  
- **Eliminar cargas** (DELETE /cargas/:id)
  - Eliminar cargas de cualquier ministerio
  
- **REVISAR CARGAS** (POST /cargas/:id/revision) - EXCLUSIVO ADMIN
  - **Validar cargas**: Aprobar cargas enviadas por usuarios
  - **Observar cargas**: Devolver cargas con observaciones para corrección
  - **Rechazar cargas**: Rechazar cargas que no cumplen requisitos
  - Las observaciones son obligatorias al observar o rechazar
  - Solo se pueden revisar cargas en estado "pendiente"

#### 3. SINCRONIZACIÓN CON GOOGLE SHEETS - EXCLUSIVO ADMIN

- **Sincronizar cargas validadas** (POST /cargas/sync/google-sheets)
  - Publicar cargas validadas al Google Sheets maestro
  - Se sincronizan automáticamente al validar
  
- **Test de conexión** (GET /cargas/sync/test-connection)
  - Verificar que la conexión con Google Sheets funciona correctamente
  - Diagnóstico de problemas de sincronización

#### 4. GESTIÓN DE CATÁLOGOS

- **Ver ministerios** (GET /admin/ministerios)
  - Listar todos los ministerios del sistema
  - Ver ministerios activos e inactivos

#### 5. ANALYTICS Y REPORTES

- **Acceso completo a analytics** (GET /analytics/*)
  - Ver datos de todos los ministerios
  - Comparar rendimiento entre ministerios
  - Estadísticas globales del sistema
  - Resumen general de cumplimiento

#### 6. AUDITORÍA

- **Ver auditoría completa** (GET /admin/auditoria)
  - Ver todas las acciones realizadas en el sistema
  - Filtrar por usuario, acción, fecha
  - Monitorear intentos de login fallidos
  - Detectar acciones sospechosas

**RESPONSABILIDADES DEL ADMIN:**

1. **Gestión de accesos**
   - Crear cuentas de usuario para representantes de ministerios
   - Asignar usuarios a los ministerios correctos
   - Resetear contraseñas cuando sea necesario
   - Desactivar usuarios que ya no requieren acceso

2. **Validación de datos**
   - Revisar todas las cargas enviadas por los ministerios
   - Validar la calidad y coherencia de los datos
   - Solicitar correcciones cuando los datos son incorrectos o incompletos
   - Rechazar cargas que no cumplen con los estándares

3. **Sincronización de datos**
   - Asegurar que las cargas validadas se publiquen en Google Sheets
   - Monitorear el estado de sincronización
   - Resolver problemas de conexión con Google Sheets

4. **Supervisión del sistema**
   - Monitorear el uso del sistema
   - Revisar auditoría para detectar problemas
   - Asegurar que todos los ministerios cumplan con los plazos

5. **Soporte técnico**
   - Ayudar a usuarios con problemas de acceso
   - Capacitar a nuevos usuarios
   - Resolver dudas sobre el proceso de carga

---

### ROL USUARIO - USUARIO DE MINISTERIO

**Características:**
- Está asignado a UN ministerio específico (ministerioId = "DES", "EDU", etc.)
- Solo puede ver y gestionar datos de su propio ministerio
- No puede acceder a datos de otros ministerios
- No puede crear ni gestionar otros usuarios

**PERMISOS Y FUNCIONALIDADES:**

#### 1. GESTIÓN DE CARGAS DE INDICADORES

- **Crear cargas** (POST /cargas)
  - Crear cargas SOLO para su ministerio asignado
  - No puede crear cargas para otros ministerios
  - Las cargas inician en estado "borrador"
  
- **Ver cargas propias** (GET /cargas)
  - Ver únicamente las cargas de su ministerio
  - Filtrar por: estado, período, indicador, línea
  - Ver cargas creadas por otros usuarios de su mismo ministerio
  
- **Ver detalle de carga** (GET /cargas/:id)
  - Ver detalles completos de cargas de su ministerio
  - Ver historial de cambios
  - Ver observaciones del admin (si las hay)
  
- **Editar cargas** (PUT /cargas/:id)
  - Editar SOLO cargas en estado "borrador"
  - Editar únicamente cargas de su ministerio
  - No puede editar cargas enviadas, validadas o rechazadas
  
- **Enviar cargas a revisión** (POST /cargas/:id/enviar)
  - Enviar cargas en estado "borrador" a revisión del admin
  - Una vez enviadas, pasan a estado "pendiente"
  - No se pueden editar cargas enviadas hasta que el admin las observe
  
- **Eliminar cargas** (DELETE /cargas/:id)
  - Eliminar únicamente cargas en estado "borrador"
  - Solo cargas de su ministerio

#### 2. CONSULTA DE CATÁLOGOS

- **Ver ministerios** (GET /catalogos/ministerios)
  - Ver lista de ministerios activos
  
- **Ver líneas de acción** (GET /catalogos/lineas)
  - Ver líneas de su ministerio
  - Opcional: ver líneas de otros ministerios (solo lectura)
  
- **Ver indicadores** (GET /catalogos/indicadores)
  - Ver indicadores disponibles
  - Filtrar por línea de acción

#### 3. ESTADÍSTICAS Y DASHBOARD

- **Ver estadísticas propias** (GET /cargas/stats)
  - Ver estadísticas de cargas de su ministerio
  - Ver cumplimiento de su ministerio
  - No puede ver estadísticas de otros ministerios
  
- **Dashboard personal** (GET /dashboard)
  - Ver resumen de sus cargas
  - Ver cargas pendientes de enviar
  - Ver cargas observadas que requieren corrección

#### 4. ANALYTICS LIMITADO

- **Ver analytics de su ministerio** (GET /analytics/*)
  - Ver datos SOLO de su ministerio
  - No puede ver datos de otros ministerios
  - Comparar indicadores dentro de su ministerio

#### 5. PERFIL PERSONAL

- **Ver perfil** (GET /auth/me)
  - Ver su información personal
  - Ver ministerio asignado
  
- **Cambiar contraseña** (POST /auth/cambiar-clave)
  - Cambiar su propia contraseña
  - Obligatorio cambiar contraseña temporal en primer login

**RESTRICCIONES DEL USUARIO:**

❌ **NO puede:**
- Ver o gestionar usuarios
- Crear usuarios
- Ver cargas de otros ministerios
- Editar cargas de otros ministerios
- Revisar cargas (validar/observar/rechazar)
- Sincronizar con Google Sheets
- Ver auditoría completa del sistema
- Acceder a funciones de administración
- Cambiar su ministerio asignado
- Cambiar su rol

**RESPONSABILIDADES DEL USUARIO:**

1. **Carga de datos**
   - Crear cargas de indicadores de su ministerio
   - Asegurar que los datos sean correctos y completos
   - Incluir fuentes confiables de información
   - Documentar observaciones relevantes

2. **Cumplimiento de plazos**
   - Enviar cargas en los períodos establecidos
   - Responder rápidamente a observaciones del admin
   - Corregir datos observados en tiempo y forma

3. **Calidad de datos**
   - Verificar que los valores sean correctos
   - Asegurar que las unidades de medida sean apropiadas
   - Incluir metas realistas cuando corresponda
   - Proporcionar contexto en observaciones

4. **Revisión y corrección**
   - Revisar cargas observadas por el admin
   - Corregir errores señalados
   - Volver a enviar cargas corregidas

5. **Comunicación**
   - Contactar al admin ante dudas
   - Reportar problemas técnicos
   - Solicitar ayuda cuando sea necesario

---

## FLUJO DE TRABAJO DE CARGAS

### Estados de las Cargas

Las cargas pueden tener los siguientes estados:

1. **borrador** - Estado inicial
   - Carga recién creada o devuelta con observaciones
   - Puede editarse libremente
   - Puede eliminarse
   - Puede enviarse a revisión

2. **pendiente** - En revisión
   - Carga enviada por el usuario
   - Esperando revisión del admin
   - No puede editarse
   - No puede eliminarse
   - Solo el admin puede cambiar su estado

3. **validado** - Aprobado
   - Carga aprobada por el admin
   - Se sincroniza automáticamente a Google Sheets
   - No puede editarse
   - No puede eliminarse
   - Estado final exitoso

4. **observado** - Requiere correcciones
   - Carga devuelta por el admin con observaciones
   - Vuelve automáticamente a estado "borrador"
   - El usuario debe corregir y volver a enviar
   - Incluye observaciones del admin explicando qué corregir

5. **rechazado** - No aprobado
   - Carga rechazada definitivamente por el admin
   - No puede editarse ni reenviarse
   - Estado final negativo
   - Incluye motivos del rechazo

### Transiciones de Estado

```
BORRADOR → (enviar) → PENDIENTE
    ↑                      ↓
    |                (revisar)
    |                      ↓
    └────── OBSERVADO ←────┤
                           ↓
                      VALIDADO (sincroniza a Google Sheets)
                           ↓
                      PUBLICADO
                           
                      RECHAZADO
```

### Flujo Típico - Usuario

1. **Crear carga** (estado: borrador)
   - Ingresar datos del indicador
   - Completar todos los campos requeridos
   - Agregar fuente y observaciones

2. **Revisar carga**
   - Verificar que todos los datos sean correctos
   - Validar valores y unidades

3. **Enviar a revisión** (estado: pendiente)
   - Carga bloqueada para edición
   - Notificar al admin

4. **Esperar revisión del admin**

5. **Si es VALIDADO:**
   - ✅ Carga aprobada
   - ✅ Publicada en Google Sheets
   - ✅ Proceso completado

6. **Si es OBSERVADO:**
   - ⚠️ Vuelve a borrador
   - ⚠️ Leer observaciones del admin
   - ⚠️ Corregir datos
   - ⚠️ Volver a enviar

7. **Si es RECHAZADO:**
   - ❌ Carga rechazada definitivamente
   - ❌ Crear nueva carga si es necesario

### Flujo Típico - Admin

1. **Recibir cargas pendientes**
   - Ver listado de cargas en estado "pendiente"
   - Filtrar por ministerio o período

2. **Revisar carga**
   - Verificar calidad de los datos
   - Validar fuentes
   - Revisar coherencia con metas

3. **Decidir acción:**

   **Opción A: VALIDAR**
   - Datos correctos y completos
   - Aprobar carga
   - Sistema sincroniza automáticamente a Google Sheets

   **Opción B: OBSERVAR**
   - Datos incompletos o incorrectos
   - Agregar observaciones explicando qué corregir
   - Devolver al usuario para corrección
   - Carga vuelve a estado "borrador"

   **Opción C: RECHAZAR**
   - Datos inaceptables
   - Agregar motivo de rechazo
   - Carga rechazada definitivamente

---

## PERMISOS DETALLADOS POR MÓDULO

### Módulo: AUTENTICACIÓN
| Funcionalidad | ADMIN | USUARIO |
|--------------|-------|---------|
| Login | ✅ | ✅ |
| Logout | ✅ | ✅ |
| Cambiar contraseña propia | ✅ | ✅ |
| Ver perfil propio | ✅ | ✅ |
| Refresh token | ✅ | ✅ |

### Módulo: USUARIOS (Admin)
| Funcionalidad | ADMIN | USUARIO |
|--------------|-------|---------|
| Crear usuarios | ✅ | ❌ |
| Listar usuarios | ✅ | ❌ |
| Ver detalle de usuario | ✅ | ❌ |
| Actualizar usuarios | ✅ | ❌ |
| Activar/desactivar usuarios | ✅ | ❌ |
| Resetear contraseñas | ✅ | ❌ |
| Eliminar usuarios | ✅ | ❌ |

### Módulo: CARGAS
| Funcionalidad | ADMIN | USUARIO |
|--------------|-------|---------|
| Crear carga | ✅ (todos los ministerios) | ✅ (solo su ministerio) |
| Ver cargas | ✅ (todos los ministerios) | ✅ (solo su ministerio) |
| Ver detalle de carga | ✅ (todas) | ✅ (solo su ministerio) |
| Editar carga (borrador) | ✅ (todas) | ✅ (solo su ministerio) |
| Enviar a revisión | ✅ | ✅ |
| Revisar carga (validar/observar/rechazar) | ✅ | ❌ |
| Eliminar carga | ✅ (todas) | ✅ (solo su ministerio, solo borrador) |
| Ver estadísticas | ✅ (todos) | ✅ (solo su ministerio) |

### Módulo: SINCRONIZACIÓN
| Funcionalidad | ADMIN | USUARIO |
|--------------|-------|---------|
| Sincronizar a Google Sheets | ✅ | ❌ |
| Test conexión Google Sheets | ✅ | ❌ |
| Ver estado de sincronización | ✅ | ❌ |

### Módulo: CATÁLOGOS
| Funcionalidad | ADMIN | USUARIO |
|--------------|-------|---------|
| Ver ministerios | ✅ | ✅ |
| Ver líneas de acción | ✅ | ✅ |
| Ver indicadores | ✅ | ✅ |

### Módulo: ANALYTICS
| Funcionalidad | ADMIN | USUARIO |
|--------------|-------|---------|
| Ver analytics | ✅ (todos los ministerios) | ✅ (solo su ministerio) |
| Ver compromisos | ✅ (todos) | ✅ (solo su ministerio) |
| Ver indicadores | ✅ (todos) | ✅ (solo su ministerio) |
| Ver datos | ✅ (todos) | ✅ (solo su ministerio) |
| Ver resumen | ✅ (global) | ✅ (su ministerio) |

### Módulo: AUDITORÍA
| Funcionalidad | ADMIN | USUARIO |
|--------------|-------|---------|
| Ver auditoría completa | ✅ | ❌ |
| Ver auditoría propia | ✅ | ✅ (implícito) |

---

## ACCESO A PÁGINAS DEL SISTEMA

### Páginas disponibles para ADMIN:
- `/home` - Página principal
- `/dashboard` - Dashboard con estadísticas generales
- `/carga` - Crear nueva carga
- `/carga/edit/:id` - Editar carga existente
- `/gestion` - Gestión de cargas (ver, filtrar, buscar)
- `/revision` - Revisar cargas pendientes ⭐ EXCLUSIVO
- `/mis-envios` - Ver propias cargas creadas
- `/publicadas` - Ver cargas publicadas
- `/analytics` - Analytics y reportes avanzados
- `/admin/usuarios` - Gestión de usuarios ⭐ EXCLUSIVO
- `/admin/ministerios` - Gestión de ministerios ⭐ EXCLUSIVO
- `/admin/auditoria` - Ver auditoría completa ⭐ EXCLUSIVO
- `/admin/sync` - Sincronización con Google Sheets ⭐ EXCLUSIVO
- `/perfil` - Perfil personal
- `/manual` - Manual de usuario

### Páginas disponibles para USUARIO:
- `/home` - Página principal
- `/dashboard` - Dashboard de su ministerio
- `/carga` - Crear nueva carga
- `/carga/edit/:id` - Editar carga propia (solo borrador)
- `/gestion` - Ver cargas de su ministerio
- `/creacion` - Crear indicador
- `/mis-envios` - Ver propias cargas
- `/publicadas` - Ver cargas publicadas de su ministerio
- `/analytics` - Analytics de su ministerio
- `/perfil` - Perfil personal
- `/manual` - Manual de usuario

### Páginas bloqueadas para USUARIO:
- ❌ `/revision` - Solo para ADMIN
- ❌ `/admin/*` - Todo el módulo admin
- ❌ Cargas de otros ministerios

---

## REGLAS DE NEGOCIO IMPORTANTES

### Validaciones de Datos

1. **Períodos según periodicidad:**
   - Mensual: YYYY-MM (ej: 2025-08)
   - Trimestral: YYYYQn (ej: 2025Q2)
   - Semestral: YYYYSn (ej: 2025S1)
   - Anual: YYYY (ej: 2025)

2. **Contraseñas:**
   - Mínimo 8 caracteres
   - Cambio obligatorio en primer login si es temporal
   - Bloqueo temporal tras 5 intentos fallidos

3. **Duplicados:**
   - No se permiten cargas duplicadas para el mismo:
     * Indicador
     * Período
     * Ministerio
   - Cuando el estado es "pendiente" o "validado"

4. **Valores numéricos:**
   - Deben ser numéricos válidos
   - Pueden tener rangos mínimos/máximos por indicador
   - La unidad debe ser consistente con la unidad por defecto del indicador

### Seguridad

1. **Autenticación:**
   - JWT en cookies httpOnly
   - Tokens con expiración (12h acceso, 7 días refresh)
   - Refresh automático de tokens

2. **Autorización:**
   - Verificación de rol en cada endpoint
   - Verificación de ministerio en endpoints de usuario
   - Guards automáticos de seguridad

3. **Auditoría:**
   - Se registran todas las acciones importantes:
     * Login/logout
     * Creación/edición/eliminación de cargas
     * Cambios de estado de cargas
     * Gestión de usuarios (admin)
     * Sincronización con Google Sheets
   - Se almacena: usuario, acción, fecha, IP, user-agent
   - Se guarda estado anterior y posterior (para cambios)

---

## CASOS DE USO COMUNES

### CASO 1: Usuario carga un nuevo indicador

1. Usuario inicia sesión
2. Va a "Crear Carga"
3. Selecciona ministerio (automático, es el suyo)
4. Selecciona línea de acción
5. Selecciona indicador
6. Ingresa período (según periodicidad del indicador)
7. Ingresa valor numérico
8. Ingresa meta (opcional)
9. Ingresa fuente de datos
10. Ingresa nombre y email del responsable
11. Agrega observaciones (opcional)
12. Guarda como borrador
13. Revisa los datos
14. Envía a revisión
15. Espera validación del admin

### CASO 2: Admin revisa y valida una carga

1. Admin inicia sesión
2. Va a "Revisión"
3. Ve lista de cargas pendientes
4. Selecciona una carga
5. Revisa los datos:
   - Verifica que el valor sea coherente
   - Verifica que la fuente sea confiable
   - Verifica que el período sea correcto
6. Si todo está bien:
   - Selecciona "Validar"
   - Confirma la acción
   - Sistema sincroniza automáticamente a Google Sheets
7. Si hay problemas:
   - Selecciona "Observar"
   - Escribe observaciones detalladas
   - Envía de vuelta al usuario

### CASO 3: Usuario corrige una carga observada

1. Usuario ve notificación de carga observada
2. Va a "Mis Envíos"
3. Filtra por estado "Borrador" (las observadas vuelven a borrador)
4. Abre la carga observada
5. Lee las observaciones del admin
6. Corrige los datos según indicaciones
7. Guarda cambios
8. Vuelve a enviar a revisión
9. Admin recibe nueva versión para revisar

### CASO 4: Admin crea un nuevo usuario

1. Admin va a "Administración > Usuarios"
2. Clic en "Crear Usuario"
3. Ingresa email del usuario
4. Ingresa nombre completo
5. Selecciona rol (ADMIN o USUARIO)
6. Si es USUARIO, selecciona ministerio
7. Guarda usuario
8. Sistema genera contraseña temporal
9. Admin copia y envía credenciales al nuevo usuario
10. Usuario inicia sesión y debe cambiar contraseña

### CASO 5: Usuario olvida su contraseña

1. Usuario contacta al admin
2. Admin va a "Administración > Usuarios"
3. Busca al usuario por email o nombre
4. Clic en el usuario
5. Selecciona "Resetear Contraseña"
6. Sistema genera nueva contraseña temporal
7. Admin envía nueva contraseña al usuario
8. Usuario inicia sesión y debe cambiar contraseña

---

## FORMATO DEL MANUAL

Genera el manual con las siguientes secciones:

1. **Introducción**
   - Qué es SIPIO
   - Objetivo del sistema
   - Usuarios del sistema

2. **Roles y Permisos**
   - Descripción detallada de cada rol
   - Tabla comparativa de permisos
   - Responsabilidades de cada rol

3. **Manual del Usuario de Ministerio**
   - Cómo iniciar sesión
   - Cómo crear cargas
   - Cómo enviar cargas a revisión
   - Cómo corregir cargas observadas
   - Cómo ver estadísticas de su ministerio
   - Cómo cambiar contraseña
   - Preguntas frecuentes

4. **Manual del Administrador**
   - Cómo gestionar usuarios
   - Cómo revisar cargas
   - Cómo validar, observar o rechazar cargas
   - Cómo sincronizar con Google Sheets
   - Cómo ver auditoría
   - Cómo resolver problemas comunes
   - Preguntas frecuentes

5. **Flujo de Trabajo**
   - Diagrama de flujo de cargas
   - Estados y transiciones
   - Proceso completo de principio a fin

6. **Mejores Prácticas**
   - Recomendaciones para usuarios
   - Recomendaciones para admins
   - Cómo asegurar calidad de datos
   - Cómo cumplir con plazos

7. **Resolución de Problemas**
   - Problemas comunes y soluciones
   - Contactos de soporte
   - Preguntas frecuentes generales

8. **Anexos**
   - Glosario de términos
   - Formatos de período según periodicidad
   - Ejemplo de cargas bien completadas

---

## TONO Y ESTILO

- Usa lenguaje claro y profesional
- Incluye ejemplos prácticos
- Usa tablas y listas para mejor legibilidad
- Incluye advertencias (⚠️) y tips (💡) cuando sea relevante
- Usa emojis moderadamente para destacar puntos importantes
- Incluye capturas de pantalla imaginarias descritas como "[Captura: ...]"
- Usa formato markdown
- Sé exhaustivo pero conciso

---

## INFORMACIÓN TÉCNICA ADICIONAL

### Tecnologías:
- Backend: NestJS (Node.js)
- Frontend: Next.js (React)
- Base de datos: PostgreSQL
- Autenticación: JWT
- Integración: Google Sheets API

### Seguridad:
- Contraseñas hasheadas con Argon2
- JWT en cookies httpOnly
- CORS configurado
- Rate limiting
- Auditoría completa
- Validación de entrada con class-validator

### Performance:
- Paginación en listados
- Índices en base de datos
- Cache cuando corresponde
- Sincronización asíncrona

---

Genera un manual completo, profesional y fácil de entender que sirva como guía definitiva para todos los usuarios del sistema SIPIO. El manual debe ser exhaustivo, cubrir todos los casos de uso, y servir como referencia para capacitación de nuevos usuarios.