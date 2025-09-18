# 🏢 TODO: Multi-Tenancy por Empresa/Organización

## 📋 Lista de Tareas para Mañana

### 1. 🔧 Mejoras de UI
- [ ] **Sidebar en creación de hoja:** Agregar navegación lateral cuando se crea una nueva hoja de Google Sheets

### 2. 🧪 Pruebas de Funcionalidad
- [ ] **Probar integración completa:** Desde configuración hasta sincronización
- [ ] **Verificar OAuth2:** Flujo de autorización con Google
- [ ] **Testear sincronización:** Envío y recepción de datos

### 3. 🖥️ Infraestructura y Costos
- [ ] **Analizar servidor:** Requerimientos, escalabilidad
- [ ] **Calcular costos:** Hosting, base de datos, APIs
- [ ] **Hablar con Eze:** Para definir arquitectura técnica

### 4. 🏢 Multi-Tenancy (Equipos Múltiples)
- [ ] **Sistema de equipos:** Cómo separar datos por organización
- [ ] **Acceso diferenciado:** Usuarios solo ven datos de su equipo
- [ ] **Gestión de permisos:** Admin por equipo vs super admin

## 🎯 Especificación de Multi-Tenancy

### Requerimiento Principal
**Cada empresa tiene que tener un dashboard diferente y completamente separado.**

### Ejemplo Práctico
```
🏢 EMPRESA "PEPITO S.A."
├── 👤 Usuario: admin@pepito.com
├── 📊 Dashboard: Solo datos de Pepito
├── 📈 Indicadores: Solo los de Pepito
├── 📄 Google Sheets: Solo las hojas de Pepito
└── 👥 Usuarios: Solo empleados de Pepito

🏢 EMPRESA "JUANCITO S.R.L."
├── 👤 Usuario: admin@juancito.com  
├── 📊 Dashboard: Solo datos de Juancito
├── 📈 Indicadores: Solo los de Juancito
├── 📄 Google Sheets: Solo las hojas de Juancito
└── 👥 Usuarios: Solo empleados de Juancito
```

### Aislamiento Total
- **Pepito NO puede ver** datos de Juancito
- **Juancito NO puede ver** datos de Pepito
- **Cada uno tiene** su propio espacio de trabajo
- **Cada uno configura** su propia integración con Google Sheets

## 🏗️ Arquitectura Técnica Propuesta

### 1. Base de Datos
- [ ] **Tabla `organizations`** (empresas)
  - `id`, `name`, `slug`, `created_at`, `updated_at`
- [ ] **Tabla `users`** con `organization_id`
  - Agregar campo `organization_id` a usuarios existentes
- [ ] **Tabla `indicators`** con `organization_id`
  - Agregar campo `organization_id` a indicadores
- [ ] **Tabla `google_sheets_config`** con `organization_id`
  - Agregar campo `organization_id` a configuración de Google Sheets
- [ ] **Tabla `cargas`** con `organization_id`
  - Agregar campo `organization_id` a cargas de datos

### 2. Sistema de Autenticación
- [ ] **Login por empresa:** Usuario se autentica y se asigna a su organización
- [ ] **Middleware de autorización:** Verificar que el usuario pertenece a la organización
- [ ] **Roles por empresa:** Admin, usuario, etc. dentro de cada organización
- [ ] **Super admin:** Para gestionar múltiples organizaciones

### 3. Dashboard Personalizado
- [ ] **Filtros automáticos:** Todos los datos se filtran por `organization_id`
- [ ] **Datos aislados:** Cada empresa ve solo sus datos
- [ ] **Configuración independiente:** Cada empresa tiene su propia configuración
- [ ] **Google Sheets por empresa:** Cada organización configura sus propias hojas

### 4. Frontend
- [ ] **Context de organización:** React context para manejar la organización actual
- [ ] **Rutas protegidas:** Middleware para verificar pertenencia a organización
- [ ] **UI adaptativa:** Mostrar solo datos relevantes para la organización
- [ ] **Configuración por empresa:** Cada empresa ve solo su configuración

## 📊 Estructura de Datos por Organización

### Cada Empresa Tendrá:
- ✅ **Su propio "workspace"** completamente aislado
- ✅ **Sus propios usuarios** y permisos
- ✅ **Sus propios datos** y configuraciones
- ✅ **Su propia integración** con Google Sheets
- ✅ **Sus propios indicadores** y métricas
- ✅ **Sus propios analytics** y reportes

## 🚀 Implementación por Fases

### Fase 1: Base de Datos
1. Crear tabla `organizations`
2. Agregar `organization_id` a todas las tablas relevantes
3. Migrar datos existentes a una organización por defecto

### Fase 2: Backend
1. Modificar servicios para filtrar por `organization_id`
2. Implementar middleware de autorización
3. Actualizar controladores para manejar multi-tenancy

### Fase 3: Frontend
1. Implementar context de organización
2. Modificar componentes para mostrar solo datos relevantes
3. Actualizar rutas y navegación

### Fase 4: Google Sheets
1. Modificar configuración para ser por organización
2. Actualizar sincronización para manejar múltiples organizaciones
3. Implementar aislamiento de datos en Google Sheets

## 📝 Notas Adicionales

### Archivo de Indicadores
- Revisar `Indicadores_PIO_listado.txt` para entender estructura de datos
- Definir cómo se asignarán indicadores por organización
- Considerar indicadores compartidos vs específicos por empresa

### Consideraciones de Seguridad
- Aislamiento completo de datos entre organizaciones
- Validación de permisos en cada endpoint
- Logs de auditoría por organización
- Backup y recuperación por organización

### Escalabilidad
- Considerar sharding por organización si es necesario
- Optimización de consultas con `organization_id`
- Caching por organización
- Rate limiting por organización

---

**Fecha de creación:** 8/9/2025  
**Estado:** En desarrollo  
**Prioridad:** Alta

