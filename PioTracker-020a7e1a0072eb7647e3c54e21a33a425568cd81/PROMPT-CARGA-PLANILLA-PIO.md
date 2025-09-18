# PROMPT PARA CHATGPT - CARGA DE DATOS A PLANILLA PIO

## CONTEXTO
Necesito que me ayudes a generar todas las filas de compromisos e indicadores del Excel "Copia de Indicadores de cumplimiento PIOs 2024_25 (1).xlsx" para cargarlas en la planilla PIO usando el formato específico de columnas que tiene la planilla.

## FORMATO DE COLUMNAS DE LA PLANILLA PIO
La planilla PIO tiene las siguientes columnas (en este orden exacto):

| Columna | Letra | Campo | Descripción |
|---------|-------|-------|-------------|
| A | Indicador ID | ID único del indicador |
| B | Indicador Nombre | Nombre completo del indicador |
| C | Período | Período (formato: 2025-2027) |
| D | Ministerio ID | ID del ministerio |
| E | Ministerio Nombre | Nombre del ministerio |
| F | Línea ID | ID del compromiso/línea |
| G | Línea Título | Título del compromiso |
| H | Valor | Valor del indicador (vacío inicialmente) |
| I | Unidad | Unidad de medida |
| J | Meta | Meta objetivo |
| K | Fuente | Fuente de datos |
| L | Responsable Nombre | Nombre del responsable |
| M | Responsable Email | Email del responsable |
| N | Observaciones | Observaciones adicionales |
| O | Estado | Estado (PENDIENTE por defecto) |
| P | Publicado | Publicado (No por defecto) |
| Q | Creado En | Fecha de creación |
| R | Actualizado En | Fecha de actualización |

## ESTRUCTURA DEL EXCEL ORIGINAL
El Excel tiene múltiples hojas, una por cada ministerio/área:
- Justicia
- Jefatura de Gabinete
- Educación
- Ente regulador de servicios públicos
- Seguridad
- Vicejefatura
- Espacio Público
- Hacienda y finanzas
- Salud
- MDHyH

Cada hoja contiene:
- Compromisos (líneas de acción)
- Indicadores asociados a cada compromiso
- Metas y unidades de medida

## TAREA ESPECÍFICA
Necesito que generes todas las filas en el formato exacto de la planilla PIO basándote en el Excel original. Para cada indicador del Excel, debes crear una fila con:

### DATOS OBLIGATORIOS:
1. **Indicador ID**: Generar un ID único (ej: IND-001, IND-002, etc.)
2. **Indicador Nombre**: Nombre exacto del indicador del Excel
3. **Período**: "2025-2027" (fijo para todos)
4. **Ministerio ID**: Generar un ID único por ministerio (ej: MIN-001, MIN-002, etc.)
5. **Ministerio Nombre**: Nombre exacto del ministerio
6. **Línea ID**: Generar un ID único por compromiso (ej: LIN-001, LIN-002, etc.)
7. **Línea Título**: Título exacto del compromiso del Excel
8. **Valor**: Vacío (se llenará cuando se carguen datos)
9. **Unidad**: Unidad de medida del indicador
10. **Meta**: Meta objetivo del indicador
11. **Fuente**: "Excel Original" (fijo)
12. **Responsable Nombre**: Vacío (se llenará después)
13. **Responsable Email**: Vacío (se llenará después)
14. **Observaciones**: Vacío
15. **Estado**: "PENDIENTE" (fijo)
16. **Publicado**: "No" (fijo)
17. **Creado En**: Fecha actual en formato YYYY-MM-DD
18. **Actualizado En**: Fecha actual en formato YYYY-MM-DD

### FORMATO DE SALIDA
Genera un archivo Excel (.xlsx) con las siguientes características:

**Hoja principal**: "Indicadores_PIO"
**Encabezados**: Las 18 columnas en el orden exacto
**Datos**: Todas las filas de indicadores del Excel original

**Estructura del Excel:**
- **Fila 1**: Encabezados de columnas
- **Fila 2 en adelante**: Datos de indicadores
- **Formato**: Excel (.xlsx) listo para importar

**Ejemplo de estructura:**
| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Indicador ID | Indicador Nombre | Período | Ministerio ID | Ministerio Nombre | Línea ID | Línea Título | Valor | Unidad | Meta | Fuente | Responsable Nombre | Responsable Email | Observaciones | Estado | Publicado | Creado En | Actualizado En |
| IND-001 | Porcentaje de víctimas que reciben asesoramiento jurídico | 2025-2027 | MIN-001 | Justicia | LIN-001 | A) Promover el asesoramiento y patrocinio jurídico penal gratuito |  | Porcentaje | 80% | Excel Original |  |  |  | PENDIENTE | No | 2025-01-15 | 2025-01-15 |

## INSTRUCCIONES ESPECÍFICAS PARA CHATGPT:

1. **Analiza el Excel**: Lee y analiza cada hoja del Excel "Copia de Indicadores de cumplimiento PIOs 2024_25 (1).xlsx"

2. **Genera IDs únicos**: 
   - Ministerios: MIN-001, MIN-002, MIN-003, etc.
   - Compromisos: LIN-001, LIN-002, LIN-003, etc.
   - Indicadores: IND-001, IND-002, IND-003, etc.

3. **Mantén la jerarquía**: Cada indicador debe estar asociado a su compromiso y ministerio correspondiente

4. **Preserva datos originales**: Mantén los nombres, metas y unidades exactamente como aparecen en el Excel

5. **Genera todas las filas**: Una fila por cada indicador encontrado en el Excel

6. **Formato Excel**: Entrega el resultado como archivo Excel (.xlsx) con encabezados y datos organizados

## RESULTADO ESPERADO
Un archivo Excel (.xlsx) con todas las filas de indicadores del Excel original, formateadas según las columnas de la planilla PIO, con encabezados claros y datos organizados, listo para ser importado y cargado en la planilla.

## NOTAS IMPORTANTES:
- Usa la fecha actual para "Creado En" y "Actualizado En"
- Mantén la consistencia en los IDs generados
- Preserva la relación entre ministerios, compromisos e indicadores
- Asegúrate de que no falte ningún indicador del Excel original
- El formato debe ser exactamente compatible con la planilla PIO
- El archivo Excel debe incluir encabezados en la primera fila
- Los datos deben estar organizados en columnas claras y legibles

---

**¿Puedes ayudarme a generar todas estas filas basándote en el Excel original?**
