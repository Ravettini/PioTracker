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

// Compromisos faltantes que necesitamos crear
const compromisosFaltantes = [
  {
    ministerioId: 'EDU',
    titulo: 'Compromiso sin título',
    descripcion: 'Compromiso sin título específico'
  },
  {
    ministerioId: 'EDU',
    titulo: 'Articular con la Dirección General de Abordaje de las Violencias por Motivos de Género',
    descripcion: 'Articular con la Dirección General de Abordaje de las Violencias por Motivos de Género dependiente de la Subsecretaría de Fortalecimiento Personal, Familiar y Comunitario, del Ministerio de Desarrollo Humano y Hábitat, la derivación de los casos que se presenten en los Centros Integrales de la Mujer que requieran terminalidad educativa.'
  },
  {
    ministerioId: 'EDU',
    titulo: 'Articular instancias de capacitación y formación',
    descripcion: 'Articular instancias de capacitación y formación en la implementación de Programa Mujeres Líderes en GCBA.'
  },
  {
    ministerioId: 'EDU',
    titulo: 'Continuar garantizando la asignación de becas paritarias',
    descripcion: 'Continuar garantizando la asignación de becas paritarias para las formaciones'
  },
  {
    ministerioId: 'EDU',
    titulo: 'Continuar teniendo el apoyo de BOTI',
    descripcion: 'Continuar teniendo el apoyo de BOTI como canal de acceso para la atención, derivación y contención de mujeres en el GCBA.'
  },
  {
    ministerioId: 'EDU',
    titulo: 'Creación de un protocolo unificado',
    descripcion: 'Creación de un protocolo unificado para el abordaje de situaciones de violencia de género y protección a las infancias y adolescencias.'
  },
  {
    ministerioId: 'EDU',
    titulo: 'Confección de un Informe de relevamiento',
    descripcion: 'Confección de un Informe de relevamiento sobre la existencia de Protocolos de actuación ante situaciones de violencia de género y protección a las infancias y adolescencias en las entidades deportivas.'
  },
  {
    ministerioId: 'MDH',
    titulo: 'Promover charlas y capacitaciones sobre género',
    descripcion: 'C) Promover charlas y capacitaciones sobre género a las 12 cooperativas vinculadas al Ministerio de Espacio Público e Higiene Urbana para la recolección exclusiva de materiales reciclables secos.'
  },
  {
    ministerioId: 'VIC',
    titulo: 'Ajuste de manual de diseño de espacios públicos',
    descripcion: 'Ajuste (ya está publicado) de manual de diseño de espacios públicos con perspectiva de género'
  },
  {
    ministerioId: 'VIC',
    titulo: 'Promover acciones de sensibilización y educación',
    descripcion: '5. Promover acciones de sensibilización y educación sobre la violencia de género dirigidas a comunidades migrantes, en conjunto con la Dirección General de Abordaje de las Violencias por Razones de Género dependiente del Ministerio de Desarrollo Humano y Hábitat.'
  }
];

// Función para crear un compromiso
async function crearCompromiso(compromiso) {
  try {
    const compromisoData = {
      titulo: compromiso.titulo,
      ministerioId: compromiso.ministerioId
    };

    const resultado = await hacerPeticion('/catalogos/lineas', 'POST', compromisoData);
    console.log(`✅ Compromiso creado: ${compromiso.titulo}`);
    return { success: true, data: resultado };
  } catch (error) {
    console.error(`❌ Error creando compromiso "${compromiso.titulo}":`, error.message);
    return { success: false, error: error.message };
  }
}

// Función principal
async function crearCompromisosFaltantes() {
  console.log('🚀 Creando compromisos faltantes...\n');
  
  const resultados = [];
  let exitosos = 0;
  let fallidos = 0;
  
  for (let i = 0; i < compromisosFaltantes.length; i++) {
    const compromiso = compromisosFaltantes[i];
    console.log(`📝 Creando compromiso ${i + 1}/${compromisosFaltantes.length}: ${compromiso.titulo}`);
    
    const resultado = await crearCompromiso(compromiso);
    
    if (resultado.success) {
      exitosos++;
    } else {
      fallidos++;
    }
    
    resultados.push({
      compromiso: compromiso,
      resultado: resultado
    });
    
    // Pausa entre creaciones
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n🎉 ¡Proceso completado!`);
  console.log(`📊 Resumen:`);
  console.log(`   - Total: ${compromisosFaltantes.length}`);
  console.log(`   - Exitosos: ${exitosos}`);
  console.log(`   - Fallidos: ${fallidos}`);
  
  // Guardar reporte
  const reporte = {
    fecha: new Date().toISOString(),
    totalCompromisos: compromisosFaltantes.length,
    exitosos,
    fallidos,
    resultados
  };
  
  fs.writeFileSync('reporte-compromisos-creados.json', JSON.stringify(reporte, null, 2));
  console.log(`📄 Reporte guardado en: reporte-compromisos-creados.json`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  crearCompromisosFaltantes();
}

module.exports = { crearCompromisosFaltantes };
