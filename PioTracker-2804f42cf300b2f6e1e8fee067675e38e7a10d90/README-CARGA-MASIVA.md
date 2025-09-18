# 🚀 Carga Masiva de Datos PIO

Este script automatiza la carga de datos desde un archivo de texto hacia el sistema PIO.

## 📋 Requisitos Previos

1. **Backend ejecutándose** en http://localhost:3001
2. **Frontend ejecutándose** en http://localhost:3000
3. **Node.js** instalado
4. **Credenciales de acceso** al sistema

## 📁 Archivos Creados

- `carga-masiva.js` - Script principal de carga
- `obtener-token.js` - Script para obtener token de autenticación
- `ejemplo-cargas.txt` - Ejemplo del formato de datos
- `cargas.txt` - Tu archivo con los datos (crear)
- `reporte-cargas.json` - Reporte de resultados (se genera automáticamente)

## 🔧 Configuración

### Paso 1: Obtener Token de Autenticación

```bash
# Instalar dependencias si es necesario
npm install node-fetch

# Obtener token automáticamente
node obtener-token.js
```

Si el script automático no funciona:

1. Ve a http://localhost:3000/login
2. Inicia sesión con tus credenciales
3. Abre las herramientas de desarrollador (F12)
4. Ve a la pestaña Network
5. Busca una petición a /auth/login
6. Copia el token del campo "access_token"

### Paso 2: Configurar el Token

Edita `carga-masiva.js` y reemplaza la línea:
```javascript
const AUTH_TOKEN = 'tu-token-aqui';
```

### Paso 3: Preparar los Datos

Crea un archivo `cargas.txt` con el siguiente formato:

```
### Ministerio: [Nombre del Ministerio]
#### Compromiso: [Título del Compromiso]
- Indicador: [Nombre del Indicador]
  - Valor: [número]
  - Unidad de medida: [unidad]
  - Meta: [meta opcional]
  - Fuente de los datos: [fuente]
  - Observaciones: [texto completo]
```

**Ejemplo:**
```
### Ministerio: Ministerio de Salud
#### Compromiso: Mejorar la cobertura de vacunación
- Indicador: Porcentaje de niños vacunados
  - Valor: 85.5
  - Unidad de medida: Porcentaje
  - Meta: 90
  - Fuente de los datos: Excel Original
  - Observaciones: Se logró una mejora significativa en la cobertura de vacunación infantil.
```

## 🚀 Ejecución

```bash
node carga-masiva.js
```

## 📊 Resultados

El script generará:

1. **Logs en consola** con el progreso
2. **Archivo `reporte-cargas.json`** con:
   - Total de cargas procesadas
   - Cargas exitosas
   - Cargas fallidas
   - Detalles de cada resultado

## ⚠️ Consideraciones

- **Coincidencia de nombres**: El script busca coincidencias parciales en nombres de ministerios, compromisos e indicadores
- **Pausa entre cargas**: Se incluye una pausa de 500ms entre cada carga para no sobrecargar la API
- **Período fijo**: Todas las cargas se crean con período "2025-2027"
- **Responsable automático**: Si no se especifica, se usa "Sistema Automático"

## 🔍 Solución de Problemas

### Error: "Ministerio no encontrado"
- Verifica que el nombre del ministerio coincida exactamente con el de la base de datos
- Revisa los ministerios disponibles en la API: `/api/v1/catalogos/ministerios`

### Error: "Compromiso no encontrado"
- Verifica que el título del compromiso coincida con el de la base de datos
- Revisa los compromisos del ministerio: `/api/v1/catalogos/compromisos?ministerioId=X`

### Error: "Indicador no encontrado"
- Verifica que el nombre del indicador coincida con el de la base de datos
- Revisa los indicadores del compromiso: `/api/v1/catalogos/indicadores?compromisoId=X`

### Error de conexión
- Verifica que el backend esté ejecutándose en http://localhost:3001
- Verifica que el token de autenticación sea válido

## 📝 Notas

- El script es tolerante a errores: si una carga falla, continúa con la siguiente
- Se genera un reporte completo con todos los resultados
- Los valores numéricos se convierten automáticamente a float
- Las metas opcionales se manejan correctamente (null si no se especifican)
