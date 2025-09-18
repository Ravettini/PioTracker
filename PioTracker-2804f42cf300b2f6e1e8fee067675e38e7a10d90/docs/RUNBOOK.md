# RUNBOOK - PIO Tracker

## Información General

**Sistema:** PIO Tracker - Sistema de seguimiento de indicadores PIO con sincronización a Google Sheets  
**Versión:** 1.0.0  
**Responsable:** Equipo de Desarrollo  
**Última Actualización:** Agosto 2025  

## Contactos de Emergencia

| Rol | Nombre | Teléfono | Email |
|-----|--------|----------|-------|
| DevOps Lead | [Nombre] | [Teléfono] | [Email] |
| Backend Lead | [Nombre] | [Teléfono] | [Email] |
| Frontend Lead | [Nombre] | [Teléfono] | [Email] |
| DBA | [Nombre] | [Teléfono] | [Email] |

## Arquitectura del Sistema

### Componentes Principales

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Base de       │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   Datos        │
│   Puerto 3000   │    │   Puerto 8080   │    │   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Google Sheets  │
                       │   (Sync API)    │
                       └─────────────────┘
```

### Servicios y Puertos

| Servicio | Puerto | Protocolo | Descripción |
|----------|--------|-----------|-------------|
| Frontend | 3000 | HTTP/HTTPS | Interfaz de usuario |
| Backend | 8080 | HTTP/HTTPS | API REST |
| PostgreSQL | 5432 | TCP | Base de datos |
| Redis (opcional) | 6379 | TCP | Cache/rate limiting |

## Instalación y Configuración

### Prerrequisitos

- Node.js 18+ LTS
- PostgreSQL 14+
- Docker y Docker Compose (opcional)
- Git

### Instalación Local

```bash
# 1. Clonar repositorio
git clone [URL_REPOSITORIO]
cd PIO

# 2. Instalar dependencias
npm run install:all

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con valores apropiados

# 4. Iniciar base de datos
docker-compose up -d postgres

# 5. Ejecutar migraciones
npm run db:migrate

# 6. Poblar datos iniciales
npm run db:seed

# 7. Iniciar servicios
npm run dev
```

### Variables de Entorno Críticas

```bash
# Base de datos
DATABASE_URL=postgres://postgres:postgres@localhost:5432/pio

# JWT
JWT_SECRET=change-me-to-secure-secret
JWT_EXPIRES_IN=12h

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=152204850788-6pkbsgcvkbu9fro0f179jkmkul7do8tv.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=[SECRET_FROM_OAUTH_JSON]
GOOGLE_REFRESH_TOKEN=[GENERATED_REFRESH_TOKEN]
GOOGLE_SHEET_ID=[MASTER_SHEET_ID]

# Seguridad
CSRF_SECRET=change-me-csrf-secret
```

## Operaciones Diarias

### Monitoreo de Salud

#### 1. Health Checks

```bash
# Verificar estado del backend
curl http://localhost:8080/health

# Verificar estado de la base de datos
curl http://localhost:8080/api/v1/health

# Respuesta esperada:
{
  "status": "ok",
  "timestamp": "2025-08-27T10:00:00.000Z",
  "database": "connected"
}
```

#### 2. Logs del Sistema

```bash
# Backend logs
tail -f server/logs/app.log

# Base de datos logs
docker-compose logs -f postgres

# Logs de auditoría
docker exec -it pio-postgres-1 psql -U postgres -d pio -c "
SELECT actor_id, accion, objeto, cuando 
FROM auditoria 
WHERE cuando > NOW() - INTERVAL '1 hour' 
ORDER BY cuando DESC;"
```

#### 3. Métricas de Rendimiento

```bash
# Verificar conexiones activas a la BD
docker exec -it pio-postgres-1 psql -U postgres -d pio -c "
SELECT count(*) as conexiones_activas 
FROM pg_stat_activity 
WHERE state = 'active';"

# Verificar tamaño de tablas
docker exec -it pio-postgres-1 psql -U postgres -d pio -c "
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as tamaño
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

### Tareas Programadas

#### 1. Backup de Base de Datos

```bash
#!/bin/bash
# backup-daily.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/pio"
DB_NAME="pio"

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Backup completo
docker exec pio-postgres-1 pg_dump -U postgres -d $DB_NAME > $BACKUP_DIR/pio_backup_$DATE.sql

# Comprimir backup
gzip $BACKUP_DIR/pio_backup_$DATE.sql

# Eliminar backups antiguos (mantener últimos 30 días)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completado: pio_backup_$DATE.sql.gz"
```

#### 2. Limpieza de Logs

```bash
#!/bin/bash
# cleanup-logs.sh

# Limpiar logs de auditoría mayores a 2 años
docker exec pio-postgres-1 psql -U postgres -d pio -c "
DELETE FROM auditoria 
WHERE cuando < NOW() - INTERVAL '2 years';"

# Limpiar logs del sistema
find server/logs -name "*.log" -mtime +7 -delete

echo "Limpieza de logs completada"
```

#### 3. Sincronización con Google Sheets

```bash
#!/bin/bash
# sync-sheets.sh

# Sincronizar cargas pendientes
curl -X POST http://localhost:8080/api/v1/sync/push-pendientes \
  -H "Authorization: Bearer [ADMIN_TOKEN]" \
  -H "Content-Type: application/json"

echo "Sincronización con Google Sheets completada"
```

## Resolución de Problemas

### Problemas Comunes

#### 1. Backend No Inicia

**Síntomas:**
- Error "Cannot connect to database"
- Puerto 8080 no responde

**Diagnóstico:**
```bash
# Verificar estado de PostgreSQL
docker-compose ps postgres

# Verificar logs del backend
tail -f server/logs/app.log

# Verificar conectividad a la BD
docker exec -it pio-postgres-1 psql -U postgres -d pio -c "SELECT 1;"
```

**Solución:**
```bash
# Reiniciar PostgreSQL
docker-compose restart postgres

# Verificar variables de entorno
cat .env | grep DATABASE_URL

# Reiniciar backend
npm run dev:server
```

#### 2. Error de Autenticación

**Síntomas:**
- Error 401 en endpoints protegidos
- Usuarios no pueden iniciar sesión

**Diagnóstico:**
```bash
# Verificar JWT_SECRET
echo $JWT_SECRET

# Verificar logs de autenticación
grep "auth" server/logs/app.log | tail -10

# Verificar usuarios en BD
docker exec -it pio-postgres-1 psql -U postgres -d pio -c "
SELECT email, activo, bloqueado_hasta FROM usuarios WHERE email = 'admin@pio.local';"
```

**Solución:**
```bash
# Regenerar JWT_SECRET
openssl rand -base64 32

# Actualizar .env
sed -i 's/JWT_SECRET=.*/JWT_SECRET=nuevo_secret/' .env

# Reiniciar backend
npm run dev:server
```

#### 3. Error de Sincronización Google Sheets

**Síntomas:**
- Error "Google Sheets API error"
- Cargas no se sincronizan

**Diagnóstico:**
```bash
# Verificar credenciales OAuth
cat .env | grep GOOGLE

# Verificar conectividad a Google
curl -I https://sheets.googleapis.com

# Verificar logs de sincronización
grep "sync" server/logs/app.log | tail -10
```

**Solución:**
```bash
# Regenerar refresh token
# 1. Ir a Google Cloud Console
# 2. Crear nueva credencial OAuth2
# 3. Generar nuevo refresh token
# 4. Actualizar .env

# Reiniciar backend
npm run dev:server
```

#### 4. Problemas de Rendimiento

**Síntomas:**
- Respuestas lentas de la API
- Timeouts en consultas

**Diagnóstico:**
```bash
# Verificar conexiones activas
docker exec -it pio-postgres-1 psql -U postgres -d pio -c "
SELECT count(*) as conexiones, 
       max(now() - query_start) as query_max_time
FROM pg_stat_activity 
WHERE state = 'active';"

# Verificar queries lentas
docker exec -it pio-postgres-1 psql -U postgres -d pio -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;"
```

**Solución:**
```bash
# Optimizar índices
docker exec -it pio-postgres-1 psql -U postgres -d pio -c "ANALYZE;"

# Reiniciar PostgreSQL para limpiar conexiones
docker-compose restart postgres

# Verificar configuración de conexiones
docker exec -it pio-postgres-1 psql -U postgres -d pio -c "
SHOW max_connections;"
```

### Escalado de Emergencias

#### Nivel 1: Problemas Menores
- **Responsable:** DevOps Engineer
- **Tiempo de Respuesta:** 2 horas
- **Acciones:** Reinicio de servicios, verificación de logs

#### Nivel 2: Problemas Moderados
- **Responsable:** DevOps Lead + Backend Lead
- **Tiempo de Respuesta:** 1 hora
- **Acciones:** Análisis profundo, hotfix, rollback si es necesario

#### Nivel 3: Problemas Críticos
- **Responsable:** Todo el equipo + Management
- **Tiempo de Respuesta:** 30 minutos
- **Acciones:** Incidente mayor, comunicación a stakeholders, plan de recuperación

## Mantenimiento Preventivo

### Semanal

- [ ] Verificar espacio en disco
- [ ] Revisar logs de error
- [ ] Verificar backups
- [ ] Actualizar dependencias de seguridad

### Mensual

- [ ] Análisis de rendimiento de BD
- [ ] Revisión de permisos de usuario
- [ ] Verificación de certificados SSL
- [ ] Limpieza de datos temporales

### Trimestral

- [ ] Auditoría de seguridad
- [ ] Revisión de políticas de backup
- [ ] Actualización de documentación
- [ ] Capacitación del equipo

## Backup y Recuperación

### Estrategia de Backup

**Backup Completo:** Diario a las 02:00 AM  
**Backup Incremental:** Cada 4 horas  
**Retención:** 30 días para backups diarios, 1 año para backups semanales  

### Procedimiento de Recuperación

#### Recuperación Completa

```bash
# 1. Detener servicios
docker-compose down

# 2. Restaurar base de datos
docker-compose up -d postgres
sleep 10

# 3. Restaurar desde backup
gunzip -c /backups/pio/pio_backup_20250827_020000.sql.gz | \
docker exec -i pio-postgres-1 psql -U postgres -d pio

# 4. Verificar integridad
docker exec -it pio-postgres-1 psql -U postgres -d pio -c "
SELECT count(*) as total_usuarios FROM usuarios;
SELECT count(*) as total_cargas FROM cargas;"

# 5. Reiniciar servicios
docker-compose up -d
```

#### Recuperación Parcial (Tabla Específica)

```bash
# Restaurar solo tabla de usuarios
gunzip -c /backups/pio/pio_backup_20250827_020000.sql.gz | \
grep -A 1000 "COPY public.usuarios" | \
docker exec -i pio-postgres-1 psql -U postgres -d pio
```

### Verificación Post-Recuperación

```bash
# Verificar endpoints críticos
curl http://localhost:8080/health
curl http://localhost:8080/api/v1/health

# Verificar autenticación
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pio.local","password":"Cambiar.123"}'

# Verificar sincronización
curl http://localhost:8080/api/v1/sync/estado-general \
  -H "Authorization: Bearer [TOKEN]"
```

## Seguridad

### Monitoreo de Seguridad

#### Logs de Auditoría

```bash
# Verificar intentos de login fallidos
docker exec -it pio-postgres-1 psql -U postgres -d pio -c "
SELECT u.email, u.intentos_fallidos, u.bloqueado_hasta, a.cuando
FROM usuarios u
JOIN auditoria a ON u.id = a.actor_id
WHERE a.accion = 'login' AND a.objeto = 'usuarios'
ORDER BY a.cuando DESC
LIMIT 20;"

# Verificar cambios de estado de usuarios
docker exec -it pio-postgres-1 psql -U postgres -d pio -c "
SELECT u.email, a.accion, a.antes, a.despues, a.cuando
FROM auditoria a
JOIN usuarios u ON a.objeto_id = u.id::text
WHERE a.objeto = 'usuarios' AND a.accion IN ('bloquear', 'activar')
ORDER BY a.cuando DESC;"
```

#### Monitoreo de Acceso

```bash
# Verificar IPs sospechosas
docker exec -it pio-postgres-1 psql -U postgres -d pio -c "
SELECT ip, count(*) as intentos
FROM auditoria
WHERE accion = 'login' AND cuando > NOW() - INTERVAL '1 hour'
GROUP BY ip
HAVING count(*) > 10
ORDER BY intentos DESC;"
```

### Actualizaciones de Seguridad

```bash
# Verificar dependencias vulnerables
npm audit

# Actualizar dependencias críticas
npm update

# Verificar versiones de seguridad
npm outdated
```

## Monitoreo y Alertas

### Métricas Clave

| Métrica | Umbral | Acción |
|---------|--------|--------|
| Tiempo de respuesta API | > 2s | Investigar |
| Errores 5xx | > 1% | Alerta inmediata |
| Uso de CPU | > 80% | Escalar |
| Uso de memoria | > 85% | Investigar |
| Conexiones BD | > 80% | Optimizar |

### Configuración de Alertas

```yaml
# prometheus.yml
alerts:
  - name: "API Response Time High"
    condition: "api_response_time > 2"
    severity: "warning"
    
  - name: "Database Connections High"
    condition: "db_connections > 80"
    severity: "critical"
    
  - name: "Error Rate High"
    condition: "error_rate > 1"
    severity: "critical"
```

## Despliegue

### Ambiente de Desarrollo

```bash
# Desplegar en desarrollo
npm run dev

# Variables de entorno
NODE_ENV=development
PORT=8080
WEB_ORIGIN=http://localhost:3000
```

### Ambiente de Staging

```bash
# Desplegar en staging
npm run build
npm run start

# Variables de entorno
NODE_ENV=staging
PORT=8080
WEB_ORIGIN=https://staging.pio.gcba.gob.ar
```

### Ambiente de Producción

```bash
# Desplegar en producción
docker-compose -f docker-compose.prod.yml up -d

# Variables de entorno
NODE_ENV=production
PORT=8080
WEB_ORIGIN=https://pio.gcba.gob.ar
```

### Rollback

```bash
# Rollback a versión anterior
git checkout HEAD~1
npm run build
docker-compose restart backend

# Verificar funcionamiento
curl http://localhost:8080/health
```

## Documentación y Referencias

### Enlaces Útiles

- **Repositorio:** [URL_REPOSITORIO]
- **Documentación API:** [URL_SWAGGER]
- **Dashboard de Monitoreo:** [URL_GRAFANA]
- **Google Cloud Console:** [URL_GOOGLE_CLOUD]
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

### Comandos de Referencia

```bash
# Verificar estado de servicios
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Acceder a PostgreSQL
docker exec -it pio-postgres-1 psql -U postgres -d pio

# Reiniciar servicios
docker-compose restart

# Verificar uso de recursos
docker stats
```

### Checklist de Emergencia

- [ ] Documentar incidente
- [ ] Notificar stakeholders
- [ ] Implementar solución temporal
- [ ] Investigar causa raíz
- [ ] Implementar solución permanente
- [ ] Actualizar documentación
- [ ] Revisar procedimientos

---

**Nota:** Este RUNBOOK debe ser revisado y actualizado regularmente para reflejar cambios en la infraestructura y procedimientos del sistema.








