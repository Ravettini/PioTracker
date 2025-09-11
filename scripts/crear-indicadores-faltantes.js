const fs = require('fs');

// Configuración
const API_BASE_URL = 'http://localhost:3001/api/v1';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMTA4NmJmZi01NmMyLTRiMzMtYjRkOC1mODYzZTFjYzljNGQiLCJlbWFpbCI6ImFkbWluQHBpby5sb2NhbCIsInJvbCI6IkFETUlOIiwibWluaXN0ZXJpb0lkIjpudWxsLCJub21icmUiOiJBZG1pbmlzdHJhZG9yIGRlbCBTaXN0ZW1hIiwiaWF0IjoxNzU2OTk3MDgwLCJleHAiOjE3NTcwNDAyODB9.hMWJJ89ZM-aeiIcu2XYcdVVQuyXmD3eFRT9NHeL2vO0';

// Función para hacer peticiones a la API
async function hacerPeticion(endpoint, method = 'GET', data = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${result.message || 'Error desconocido'}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error en ${endpoint}:`, error.message);
    throw error;
  }
}

// Función para obtener línea por título
async function obtenerLinea(titulo, ministerioId) {
  try {
    const lineas = await hacerPeticion(`/catalogos/lineas?ministerioId=${ministerioId}`);
    const linea = lineas.data.find(l => 
      l.titulo.toLowerCase().includes(titulo.toLowerCase()) ||
      titulo.toLowerCase().includes(l.titulo.toLowerCase())
    );
    
    if (!linea) {
      throw new Error(`Línea no encontrada: ${titulo}`);
    }
    
    return linea;
  } catch (error) {
    console.error(`❌ Error obteniendo línea "${titulo}":`, error.message);
    throw error;
  }
}

// Indicadores faltantes que necesitamos crear
const indicadoresFaltantes = [
  {
    nombre: 'Cantidad de casos derivados',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'EDU',
    unidadDefecto: 'casos',
    periodicidad: 'mensual'
  },
  {
    nombre: 'Cantidad de clubes creados',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'EDU',
    unidadDefecto: 'clubes',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cursos cuatrimestral, dictado en 2 Centros de Formación Profesional',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'EDU',
    unidadDefecto: 'cursos',
    periodicidad: 'anual'
  },
  {
    nombre: 'Garantizar el cupo de mujeres en el curso Talento Tech -18 (40%): % de mujeres sobre el total de cursantes',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'EDU',
    unidadDefecto: '%',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de llamadas realizadas al 144 y derivadas al 911 por mes',
    lineaTitulo: 'Continuar con las líneas de atención telefónica 144 y 911',
    ministerioId: 'MDH',
    unidadDefecto: 'llamadas',
    periodicidad: 'mensual'
  },
  {
    nombre: 'Cantidad de consejerías de salud sexual realizadas en los centros de salud',
    lineaTitulo: '1 Diseñar una planificación para consejerías sobre salud sexual como herramienta para la promoción y',
    ministerioId: 'SAL',
    unidadDefecto: 'consejerías',
    periodicidad: 'mensual'
  },
  {
    nombre: 'Cantidad turnos de mamografía otorgados anualmente en los efectores publicos de salud de la red CABA',
    lineaTitulo: '3. Implementar estrategias para el aumento de turnos en prácticas de mamografía',
    ministerioId: 'SAL',
    unidadDefecto: 'turnos',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de delegadas sindicales convocadas a encuentros de difusion de la iniciativa PARES',
    lineaTitulo: 'G) Sumar, a través de la Secretaría de Trabajo y Empleo, a las asociaciones sindicales a la iniciati',
    ministerioId: 'JUS',
    unidadDefecto: 'delegadas',
    periodicidad: 'mensual'
  },
  {
    nombre: 'cantidad de participantes en el Programa Mujeres Líderes de edicion 2024',
    lineaTitulo: '4. Difundir las herramientas existentes e impulsadas desde el Gobierno de la Ciudad Autónoma de Buen',
    ministerioId: 'VIC',
    unidadDefecto: 'participantes',
    periodicidad: 'anual'
  }
];

// Función para crear un indicador
async function crearIndicador(indicador) {
  try {
    // Obtener la línea primero
    const linea = await obtenerLinea(indicador.lineaTitulo, indicador.ministerioId);
    
    const indicadorData = {
      nombre: indicador.nombre,
      lineaId: linea.id,
      unidadDefecto: indicador.unidadDefecto,
      periodicidad: indicador.periodicidad
    };

    const resultado = await hacerPeticion('/catalogos/indicadores', 'POST', indicadorData);
    console.log(`✅ Indicador creado: ${indicador.nombre}`);
    return { success: true, data: resultado };
  } catch (error) {
    console.error(`❌ Error creando indicador "${indicador.nombre}":`, error.message);
    return { success: false, error: error.message };
  }
}

// Función principal
async function crearIndicadoresFaltantes() {
  console.log('🚀 Creando indicadores faltantes...\n');
  
  const resultados = [];
  let exitosos = 0;
  let fallidos = 0;
  
  for (let i = 0; i < indicadoresFaltantes.length; i++) {
    const indicador = indicadoresFaltantes[i];
    console.log(`📝 Creando indicador ${i + 1}/${indicadoresFaltantes.length}: ${indicador.nombre}`);
    
    const resultado = await crearIndicador(indicador);
    
    if (resultado.success) {
      exitosos++;
    } else {
      fallidos++;
    }
    
    resultados.push({
      indicador: indicador,
      resultado: resultado
    });
    
    // Pausa entre creaciones
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n🎉 ¡Proceso completado!`);
  console.log(`📊 Resumen:`);
  console.log(`   - Total: ${indicadoresFaltantes.length}`);
  console.log(`   - Exitosos: ${exitosos}`);
  console.log(`   - Fallidos: ${fallidos}`);
  
  // Guardar reporte
  const reporte = {
    fecha: new Date().toISOString(),
    totalIndicadores: indicadoresFaltantes.length,
    exitosos,
    fallidos,
    resultados
  };
  
  fs.writeFileSync('reporte-indicadores-creados.json', JSON.stringify(reporte, null, 2));
  console.log(`📄 Reporte guardado en: reporte-indicadores-creados.json`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  crearIndicadoresFaltantes();
}

module.exports = { crearIndicadoresFaltantes };
