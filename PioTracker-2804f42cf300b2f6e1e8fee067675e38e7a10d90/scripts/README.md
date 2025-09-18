# Scripts de PIO Tracker

Esta carpeta contiene todos los scripts de utilidad para el proyecto PIO Tracker.

## 📊 Scripts de Análisis de Datos

### `analizar-excel-mejorado.js`
Analiza el archivo Excel original para identificar datos de meses y períodos.

### `leer-datos-meses-2024.js`
Extrae específicamente los datos de "Meses 2024" del Excel y los mapea a indicadores.

### `datos-meses-2024.json`
Archivo JSON con los datos extraídos del Excel, mapeados por indicador y mes.

## 🔄 Scripts de Actualización de Google Sheets

### `actualizar-sheets-automatico.js`
Script para actualizar automáticamente Google Sheets con datos de meses (requiere credenciales).

### `actualizar-sheets-servidor.js`
Script que usa las mismas credenciales del servidor para actualizar Google Sheets.

### `actualizar-sheets-web-auth.js`
Script con autenticación web para actualizar Google Sheets.

### `generar-actualizaciones-detalladas.js`
Genera archivos detallados con todas las actualizaciones necesarias para Google Sheets.

### `generar-instrucciones-especificas.js`
Genera instrucciones específicas paso a paso para actualizar Google Sheets manualmente.

## 📋 Archivos de Instrucciones

### `actualizaciones-detalladas.csv`
**ARCHIVO PRINCIPAL** - CSV con todas las actualizaciones necesarias para Google Sheets.
- Total: 129 actualizaciones
- Mes a asignar: enero
- Columna a actualizar: D

### `actualizaciones-detalladas.json`
Datos completos en formato JSON con todas las actualizaciones.

### `instrucciones-especificas.txt`
Instrucciones detalladas paso a paso para actualizar Google Sheets manualmente.

### `instrucciones-especificas.json`
Instrucciones estructuradas en formato JSON.

## 🧪 Scripts de Verificación

### `verificar-actualizaciones-detalladas.js`
Verifica las actualizaciones generadas y muestra un resumen.

### `verificar-actualizaciones-meses.js`
Verifica si las actualizaciones de meses fueron aplicadas correctamente.

### `verificar-datos-analytics.js`
Verifica los datos de analytics y gráficos.

### `verificar-datos-sheets.js`
Verifica la conexión y datos de Google Sheets.

## 🏗️ Scripts de Creación de Datos

### `crear-datos-simple.js`
Crea datos de prueba simples para testing.

### `crear-datos-prueba-mdhyh.js`
Crea datos de prueba específicos para MDHyH.

### `crear-indicadores-faltantes.js`
Crea indicadores que faltan en el sistema.

### `crear-compromisos-faltantes.js`
Crea compromisos que faltan en el sistema.

## 📊 Scripts de Carga Masiva

### `carga-masiva-pio.js`
Script para cargar datos masivamente al sistema.

### `carga-masiva.js`
Script alternativo para carga masiva.

## 🔧 Scripts de Utilidad

### `obtener-token.js`
Obtiene tokens de autenticación para Google APIs.

### `generar-csv-planilla-pio.js`
Genera archivos CSV para planillas de PIO.

### `import-excel.js`
Importa datos desde archivos Excel.

### `test-excel-simple.js`
Script de prueba para leer archivos Excel.

## 📈 Scripts de Reportes

### `reporte-cargas-pio.json`
Reporte de todas las cargas de PIO.

### `reporte-indicadores-creados.json`
Reporte de indicadores creados.

### `reporte-validacion-completa.json`
Reporte de validación completa del sistema.

## 🎯 Uso Recomendado

### Para actualizar Google Sheets con datos de meses:

1. **Usar el CSV principal:**
   ```
   scripts/actualizaciones-detalladas.csv
   ```

2. **Seguir las instrucciones:**
   ```
   scripts/instrucciones-especificas.txt
   ```

3. **Verificar actualizaciones:**
   ```bash
   node scripts/verificar-actualizaciones-detalladas.js
   ```

### Para análisis de datos:

1. **Analizar Excel:**
   ```bash
   node scripts/analizar-excel-mejorado.js
   ```

2. **Extraer datos de meses:**
   ```bash
   node scripts/leer-datos-meses-2024.js
   ```

3. **Generar actualizaciones:**
   ```bash
   node scripts/generar-actualizaciones-detalladas.js
   ```

## 📝 Notas Importantes

- Los scripts de actualización automática requieren credenciales de Google Sheets
- El archivo `actualizaciones-detalladas.csv` es el más importante para actualizaciones manuales
- Todos los scripts están organizados por funcionalidad
- Los archivos JSON contienen datos estructurados para procesamiento programático
- Los archivos TXT contienen instrucciones legibles para humanos

## 🔗 Enlaces Útiles

- **Google Sheets:** https://docs.google.com/spreadsheets/d/1oOsW1ph6eFo0WcK28XdVjOaMZ9VqvB1T48Zje7MN7IA
- **Total actualizaciones:** 129 filas
- **Mes a asignar:** enero
- **Columna a actualizar:** D
