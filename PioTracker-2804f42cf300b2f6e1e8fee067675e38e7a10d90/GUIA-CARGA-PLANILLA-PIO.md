# 📋 GUÍA PARA CARGA DE DATOS A PLANILLA PIO

## 🎯 OBJETIVO
Cargar todos los compromisos e indicadores del Excel original "Copia de Indicadores de cumplimiento PIOs 2024_25 (1).xlsx" a la planilla PIO usando el formato específico de columnas.

## 📁 ARCHIVOS DISPONIBLES

### 1. `PROMPT-CARGA-PLANILLA-PIO.md`
**Descripción**: Prompt detallado para ChatGPT
**Uso**: Copiar y pegar en ChatGPT para generar las filas CSV
**Ventajas**: 
- ✅ Análisis inteligente del Excel
- ✅ Generación automática de IDs únicos
- ✅ Preservación de relaciones jerárquicas
- ✅ Formato exacto para planilla PIO

### 2. `generar-csv-planilla-pio.js`
**Descripción**: Script automatizado en Node.js
**Uso**: Ejecutar con `node generar-csv-planilla-pio.js`
**Requisitos**: 
- Node.js instalado
- Librería XLSX: `npm install xlsx`
- Excel original en el directorio

## 🚀 OPCIONES DE EJECUCIÓN

### Opción A: Usando ChatGPT (Recomendada)
1. Abrir ChatGPT
2. Copiar contenido de `PROMPT-CARGA-PLANILLA-PIO.md`
3. Pegar en ChatGPT
4. Adjuntar el Excel original
5. Solicitar generación del archivo Excel
6. Descargar resultado

### Opción B: Usando Script Automatizado
```bash
# Instalar dependencias
npm install xlsx

# Ejecutar script
node generar-csv-planilla-pio.js
```

## 📊 FORMATO DE SALIDA

El archivo Excel generado tendrá 18 columnas en este orden:

| Col | Campo | Ejemplo |
|-----|-------|---------|
| A | Indicador ID | IND-001 |
| B | Indicador Nombre | Porcentaje de víctimas que reciben asesoramiento |
| C | Período | 2025-2027 |
| D | Ministerio ID | MIN-001 |
| E | Ministerio Nombre | Justicia |
| F | Línea ID | LIN-001 |
| G | Línea Título | A) Promover el asesoramiento jurídico... |
| H | Valor | (vacío) |
| I | Unidad | Porcentaje |
| J | Meta | 80% |
| K | Fuente | Excel Original |
| L | Responsable Nombre | (vacío) |
| M | Responsable Email | (vacío) |
| N | Observaciones | (vacío) |
| O | Estado | PENDIENTE |
| P | Publicado | No |
| Q | Creado En | 2025-01-15 |
| R | Actualizado En | 2025-01-15 |

## 🔄 PROCESO DE CARGA

### Paso 1: Generar Excel
- Usar ChatGPT o script automatizado
- Verificar que el archivo Excel se genere correctamente
- Revisar que no falten indicadores
- Confirmar que los encabezados estén en la primera fila

### Paso 2: Importar a Planilla PIO
1. Abrir la planilla PIO en Google Sheets
2. Seleccionar la hoja correspondiente
3. Importar el archivo Excel generado
4. Verificar que las columnas coincidan
5. Confirmar que los encabezados se mapeen correctamente

### Paso 3: Validación
- ✅ Todos los ministerios incluidos
- ✅ Todos los compromisos incluidos  
- ✅ Todos los indicadores incluidos
- ✅ IDs únicos y consistentes
- ✅ Formato de columnas correcto

## 📈 ESTADÍSTICAS ESPERADAS

Según el análisis del Excel original:
- **10 Ministerios/Áreas**
- **~80+ Compromisos**
- **~200+ Indicadores**
- **Período**: 2025-2027
- **Estado inicial**: PENDIENTE

## ⚠️ NOTAS IMPORTANTES

### IDs Generados
- **Ministerios**: MIN-001, MIN-002, MIN-003...
- **Compromisos**: LIN-001, LIN-002, LIN-003...
- **Indicadores**: IND-001, IND-002, IND-003...

### Datos Vacíos (se llenarán después)
- **Valor**: Se llenará cuando se carguen datos reales
- **Responsable Nombre**: Se asignará posteriormente
- **Responsable Email**: Se asignará posteriormente
- **Observaciones**: Se agregarán según necesidad

### Validaciones
- ✅ Preservar nombres exactos del Excel
- ✅ Mantener metas y unidades originales
- ✅ Conservar jerarquía ministerio → compromiso → indicador
- ✅ Generar IDs únicos y consistentes

## 🎯 RESULTADO FINAL

Un archivo Excel con todas las filas de indicadores del Excel original, formateadas según las columnas de la planilla PIO, con encabezados claros y datos organizados, listo para ser importado y que permita:

1. **Carga masiva** de todos los indicadores originales
2. **Trazabilidad** completa con IDs únicos
3. **Compatibilidad** total con el sistema PIO
4. **Preparación** para futuras cargas de datos reales

---

**📅 Tarea para mañana**: Ejecutar este proceso y cargar todos los datos a la planilla PIO
