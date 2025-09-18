const XLSX = require('xlsx');
const fs = require('fs');

console.log('📊 Generando filas con estructura de base de datos + columna Mes...');

// Leer el Excel original
const workbook = XLSX.readFile('Copia de Indicadores de cumplimiento PIOs 2024_25 (1).xlsx');
const sheetNames = workbook.SheetNames;

console.log(`📄 Hojas encontradas: ${sheetNames.join(', ')}`);

// Estructura de datos que necesitamos generar
const filasGeneradas = [];

// Mapeo de ministerios
const mapeoMinisterios = {
  'Justicia': { id: 'JUS', nombre: 'Justicia' },
  'Jefatura de Gabinete': { id: 'JEF', nombre: 'Jefatura de Gabinete' },
  'Educacion': { id: 'EDU', nombre: 'Educación' },
  'Ente regulador de servicios púb': { id: 'ENT', nombre: 'Ente regulador de servicios públicos' },
  'Seguridad': { id: 'SEG', nombre: 'Seguridad' },
  'Vicejefatura': { id: 'VIC', nombre: 'Vicejefatura' },
  'Espacio Publico': { id: 'ESP', nombre: 'Espacio Público' },
  'Hacienda y finanzas': { id: 'HAC', nombre: 'Hacienda y finanzas' },
  'Salud': { id: 'SAL', nombre: 'Salud' },
  'MDHyH': { id: 'MDH', nombre: 'MDHyH' }
};

// Función para generar ID único
function generarId(texto) {
  return texto
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .substring(0, 20)
    .toUpperCase();
}

// Función para extraer datos de cada hoja
function procesarHoja(nombreHoja, worksheet) {
  console.log(`\n📄 Procesando hoja: ${nombreHoja}`);
  
  const ministerio = mapeoMinisterios[nombreHoja];
  if (!ministerio) {
    console.log(`⚠️ Ministerio no encontrado: ${nombreHoja}`);
    return;
  }

  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (data.length < 2) {
    console.log(`⚠️ Hoja vacía: ${nombreHoja}`);
    return;
  }

  const headers = data[0];
  console.log(`📋 Headers: ${headers.join(' | ')}`);

  // Buscar columnas de meses en la fila 2 (donde están los meses)
  const columnasMeses = [];
  if (data.length > 1) {
    const filaMeses = data[1];
    console.log(`📅 Fila de meses: ${filaMeses.join(' | ')}`);
    
    filaMeses.forEach((mes, index) => {
      if (mes && typeof mes === 'string') {
        const mesStr = mes.toString().toUpperCase();
        
        // Buscar meses individuales (ENE, FEB, etc.)
        if (['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEPT', 'OCT', 'NOV', 'DIC'].includes(mesStr)) {
          columnasMeses.push({ mes: mesStr, indice: index });
        }
        // También buscar nombres completos de meses
        else if (['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'].includes(mesStr)) {
          const mesCorto = mesStr.substring(0, 3);
          columnasMeses.push({ mes: mesCorto, indice: index });
        }
      }
    });
  }

  console.log(`📅 Columnas de meses encontradas: ${columnasMeses.map(c => c.mes).join(', ')}`);

  // Procesar cada fila de datos
  for (let i = 1; i < data.length; i++) {
    const fila = data[i];
    
    // Buscar compromiso e indicador en la fila
    let compromiso = '';
    let indicador = '';
    
    // Buscar en las primeras columnas
    for (let j = 0; j < Math.min(3, fila.length); j++) {
      if (fila[j] && typeof fila[j] === 'string' && fila[j].trim()) {
        if (!compromiso) {
          compromiso = fila[j].trim();
        } else if (!indicador) {
          indicador = fila[j].trim();
          break;
        }
      }
    }

    if (!indicador) continue;

    // Generar IDs
    const indicadorId = generarId(indicador);
    const lineaId = generarId(compromiso);

    // Procesar cada mes
    columnasMeses.forEach(({ mes, indice }) => {
      const valor = fila[indice];
      
      if (valor !== undefined && valor !== null && valor !== '') {
        // Determinar tipo de dato
        let valorNumerico = 0;
        let tipoDato = 'Texto';
        
        if (typeof valor === 'number') {
          valorNumerico = valor;
          tipoDato = 'Numérico';
        } else if (typeof valor === 'string') {
          // Intentar convertir a número
          const numero = parseFloat(valor.replace(/[^\d.-]/g, ''));
          if (!isNaN(numero)) {
            valorNumerico = numero;
            tipoDato = 'Numérico';
          }
        }

        // Crear fila con estructura de BD
        const filaGenerada = {
          'Indicador ID': indicadorId,
          'Indicador Nombre': indicador,
          'Período': '2024',
          'Mes': mes,
          'Ministerio ID': ministerio.id,
          'Ministerio Nombre': ministerio.nombre,
          'Línea ID': lineaId,
          'Línea Título': compromiso,
          'Valor': valorNumerico,
          'Unidad': '',
          'Meta': null,
          'Fuente': 'Excel Original',
          'Responsable Nombre': 'Sistema Automático',
          'Responsable Email': 'sistema@pio.gob.ar',
          'Observaciones': tipoDato === 'Texto' ? valor : '',
          'Estado': 'validado',
          'Publicado': 'No',
          'Creado En': new Date().toISOString(),
          'Actualizado En': new Date().toISOString()
        };

        filasGeneradas.push(filaGenerada);
      }
    });
  }

  console.log(`✅ ${nombreHoja}: ${filasGeneradas.length} filas generadas`);
}

// Procesar cada hoja
sheetNames.forEach(nombreHoja => {
  const worksheet = workbook.Sheets[nombreHoja];
  procesarHoja(nombreHoja, worksheet);
});

console.log(`\n📊 Total de filas generadas: ${filasGeneradas.length}`);

// Generar CSV
const csvHeaders = [
  'Indicador ID', 'Indicador Nombre', 'Período', 'Mes', 'Ministerio ID', 
  'Ministerio Nombre', 'Línea ID', 'Línea Título', 'Valor', 'Unidad', 
  'Meta', 'Fuente', 'Responsable Nombre', 'Responsable Email', 
  'Observaciones', 'Estado', 'Publicado', 'Creado En', 'Actualizado En'
];

let csvContent = csvHeaders.join(',') + '\n';

filasGeneradas.forEach(fila => {
  const row = csvHeaders.map(header => {
    const valor = fila[header];
    if (valor === null || valor === undefined) return '';
    if (typeof valor === 'string' && valor.includes(',')) {
      return `"${valor}"`;
    }
    return valor;
  }).join(',');
  csvContent += row + '\n';
});

// Guardar CSV
fs.writeFileSync('scripts/filas-con-mes.csv', csvContent, 'utf8');
console.log('✅ CSV generado: scripts/filas-con-mes.csv');

// Generar Excel con una hoja por ministerio
const wb = XLSX.utils.book_new();

// Agrupar filas por ministerio
const filasPorMinisterio = {};
filasGeneradas.forEach(fila => {
  const ministerio = fila['Ministerio Nombre'];
  if (!filasPorMinisterio[ministerio]) {
    filasPorMinisterio[ministerio] = [];
  }
  filasPorMinisterio[ministerio].push(fila);
});

// Crear una hoja por cada ministerio
Object.entries(filasPorMinisterio).forEach(([ministerio, filas]) => {
  const ws = XLSX.utils.json_to_sheet(filas);
  
  // Acortar nombres de hojas para Excel (máximo 31 caracteres)
  let nombreHoja = ministerio;
  if (nombreHoja.length > 31) {
    nombreHoja = nombreHoja.substring(0, 31);
  }
  
  XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
  console.log(`📄 Hoja creada: ${nombreHoja} (${filas.length} filas)`);
});

XLSX.writeFile(wb, 'scripts/filas-con-mes.xlsx');
console.log('✅ Excel generado: scripts/filas-con-mes.xlsx');

console.log('\n🎉 ¡Proceso completado!');
