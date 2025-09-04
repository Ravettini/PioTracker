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

// Función para crear un indicador
async function crearIndicador(indicador) {
  try {
    const indicadorData = {
      nombre: indicador.nombre,
      lineaId: indicador.lineaId,
      unidadDefecto: indicador.unidadDefecto || 'unidades',
      periodicidad: indicador.periodicidad || 'mensual'
    };

    const resultado = await hacerPeticion('/catalogos/indicadores', 'POST', indicadorData);
    console.log(`✅ Indicador creado: ${indicador.nombre}`);
    return { success: true, data: resultado };
  } catch (error) {
    console.error(`❌ Error creando indicador "${indicador.nombre}":`, error.message);
    return { success: false, error: error.message };
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

// Compromisos faltantes identificados del reporte
const compromisosFaltantes = [
  {
    ministerioId: 'EDU',
    titulo: 'Establecer "Mentoreo", actividad de acompañamiento en la orientación vocacional y empleabilidad por referentes de la industria IT para el 100% de las alumnas de los Programas Talento Tech +18 y Talento Tech -18, y aquellos que los sucedan a futuro.'
  },
  {
    ministerioId: 'EDU',
    titulo: 'Garantizar el cupo de mujeres en los cursos de los Programas Talento Tech +18 (50%) y Talento Tech -18 (40%), o los que en un futuro los reemplacen.'
  },
  {
    ministerioId: 'EDU',
    titulo: 'Garantizar la continuidad en la asignación de vacantes de capacitación a mujeres para la profesionalización del cuidado en la infancia en niños de 43 días a 3 años de edad realizados a través de. la Agencia de Habilidades para el Futuro.'
  },
  {
    ministerioId: 'EDU',
    titulo: 'Impulsar "Consultec", actividad para promover vocaciones científicas y técnicas en niñas y jóvenes que impacta en las estudiantes de todas las escuelas técnicas de la ciudad.'
  },
  {
    ministerioId: 'EDU',
    titulo: 'Incorporar los contenidos vinculados a violencia digital, delitos contra la integridad sexual en el {ámbito digital y trata de personas en la currícula de ESI en todos de todos los niveles de educación secundaria superior (4to, 5to y 6to).'
  },
  {
    ministerioId: 'EDU',
    titulo: 'Iniciar acciones para la implementación de la estrategia transversal "Niñas Primero" en los diferentes niveles de educación'
  },
  {
    ministerioId: 'EDU',
    titulo: 'Potenciar el "Club de Robótica para chicas".'
  },
  {
    ministerioId: 'EP',
    titulo: 'C) Promover charlas y capacitaciones sobre género a las 12 cooperativas vinculadas al Ministerio de Espacio Público e Higiene Urbana para la recolección exclusiva de materiales reciclables secos.'
  },
  {
    ministerioId: 'JDG',
    titulo: 'Ajuste (ya está publicado) de manual de diseño de espacios públicos con perspectiva de género'
  },
  {
    ministerioId: 'JDG',
    titulo: 'Articular instancias de capacitación y formación en la implementación de Programa Mujeres Líderes en GCBA.'
  },
  {
    ministerioId: 'JDG',
    titulo: 'Confección de un Informe de relevamiento sobre la existencia de Protocolos de actuación ante situaciones de violencia de género y protección a las infancias y adolescencias en las entidades deportivas.'
  },
  {
    ministerioId: 'JDG',
    titulo: 'Continuar garantizando la asignación de becas paritarias para las formaciones'
  },
  {
    ministerioId: 'JDG',
    titulo: 'Continuar teniendo el apoyo de BOTI como canal de acceso para la atención, derivación y contención  de mujeres en el GCBA.'
  },
  {
    ministerioId: 'JDG',
    titulo: 'Creación de un protocolo unificado para el abordaje de situaciones de violencia de género y protección a las infancias y adolescencias.'
  },
  {
    ministerioId: 'JDG',
    titulo: 'Difundir la línea 144 en todos los partidos e infraestructura de clubes deportivos.'
  },
  {
    ministerioId: 'JDG',
    titulo: 'Fomentar la creación de espacios de deporte inclusivos para mujeres con discapacidad.'
  },
  {
    ministerioId: 'JDG',
    titulo: 'Garantizar el cumplimiento de la capacitación obligatoria en Ley Micaela.'
  },
  {
    ministerioId: 'JDG',
    titulo: 'Garantizar la especializaciòn en perspectiva de genero en el marco del programa "Especializaciones"'
  },
  {
    ministerioId: 'JDG',
    titulo: 'Ley Micaela en los clubes. Participación en la redacción de la ley y garantizar el cumplimiento de la Ley Micaela específica para entidades deportivas en el ámbito de la CABA.'
  },
  {
    ministerioId: 'JDG',
    titulo: 'Promoción de espacios de fútbol mixto.'
  },
  {
    ministerioId: 'JDG',
    titulo: 'Promover mecanismos de difusión de esta herramienta como vía de acceso a recursos del GCBA'
  },
  {
    ministerioId: 'JDG',
    titulo: 'Realización de la "Maratón violeta: hombres y mujeres contra la violencia" para la conmemoración del día internacional para la eliminación de la violencia contra la mujer.'
  },
  {
    ministerioId: 'JDG',
    titulo: 'Realización de un relevamiento de comisiones de género en todos los clubes deportivos.'
  },
  {
    ministerioId: 'JDG',
    titulo: 'Trabajar junto a la ASI proyectos, programas y acciones de seguridad informática preventiva y concientización.'
  },
  {
    ministerioId: 'MDH',
    titulo: 'H) Trabajar en conjunto con el Ministerio de Salud para la formalización del protocolo de ingresos a unidades convivenciales.'
  },
  {
    ministerioId: 'MDH',
    titulo: 'I) Articular con el Ministerio de Salud la inclusión del Plan de Abordaje Territorial de las Violencias por Motivos de Género en los Centros de Salud y Acción Comunitaria (CeSAC) de la región sur de la Ciudad.'
  },
  {
    ministerioId: 'MDH',
    titulo: 'K) Articular con el Ministerio de Educación el fomento de trayectos formativos y de terminalidad educativa en la población asistida por violencia por razones de género'
  },
  {
    ministerioId: 'MDH',
    titulo: 'e) Ampliar el Convenio con el Ministerio Público Fiscal para mejorar la cobertura en los Centros Integrales de la Mujer.'
  },
  {
    ministerioId: 'SEG',
    titulo: 'Crear en conjunto con la Subsecretaría de la Mujer una "Mesa Interministerial de Femicidios" de la Ciudad de Buenos Aires, para el análisis y elaboración de informes estadísticos entorno a los femicidios ocurridos en el ámbito de la Ciudad.'
  },
  {
    ministerioId: 'SEG',
    titulo: 'Garantizar la continuidad del Mapa de Violencia de Género y efectuar la respectiva publicación durante el año 2024.'
  },
  {
    ministerioId: 'SEG',
    titulo: 'Garantizar la continuidad del convenio de las líneas 144 de Atención a la Víctima y 911 de atención ante emergencias.'
  },
  {
    ministerioId: 'SEG',
    titulo: 'Realizar las derivaciones a los Centros Integrales de la Mujer (CIMs) a las víctimas que se les hace entrega de dispositivos electrónicos por motivos de violencia de género, que requieran asistencia.'
  },
  {
    ministerioId: 'VIC',
    titulo: 'Promover mediante el Programa Mujeres Líderes la formación, intercambio y desarrollo de mujeres de mandos medios del Gobierno de la Ciudad de Buenos Aires, en articulación con mujeres del sector privado y de OSC, para fortalecer sus habilidades personales y profesionales para un desempeño efectivo en roles de liderazgo, potenciar vínculos y visibilizar perfiles internos.'
  }
];

// Indicadores faltantes identificados del reporte
const indicadoresFaltantes = [
  {
    nombre: 'Cantidad de trabajadores que completaron la capacitación',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'personas',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de capacitaciones brindadas (si sirve se puede dividir en modalidad online y presencial)',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'capacitaciones',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de capacitaciones brindadas',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'capacitaciones',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de personas inscriptas en especializacion/es de perspectiva de género',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'personas',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de personas que aprobaron la especializacion/es en perspectiva de género',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'personas',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de mujeres con becas que finalizaron las formaciones',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'mujeres',
    periodicidad: 'anual'
  },
  {
    nombre: 'Porcentaje de entidades deportivas capacitadas',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: '%',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de personas provenientes de clubes deportivos de la ciudad capacitadas en Ley Micaela',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'personas',
    periodicidad: 'anual'
  },
  {
    nombre: 'Fecha de publicacion del manual',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'fecha',
    periodicidad: 'anual'
  },
  {
    nombre: 'Número de materiales promocionales producidos',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'materiales',
    periodicidad: 'anual'
  },
  {
    nombre: 'cantidad de nuevos espacios de futbol mixto',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'espacios',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de nuevas personas inscriptas a futbol mixto',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'personas',
    periodicidad: 'anual'
  },
  {
    nombre: 'Porcentaje de participación de mujeres en las actividades de fútbol mixto:',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: '%',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de actividades de relevamiento realizadas',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'actividades',
    periodicidad: 'anual'
  },
  {
    nombre: 'Porcentaje de clubes con comisiones de género establecidas:',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: '%',
    periodicidad: 'anual'
  },
  {
    nombre: 'Elaboracion de cronograma de relevamiento',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'cronogramas',
    periodicidad: 'anual'
  },
  {
    nombre: 'Número de entidades deportivas relevadas',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'entidades',
    periodicidad: 'anual'
  },
  {
    nombre: 'Porcentaje de entidades con protocolos de actuación existentes:',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: '%',
    periodicidad: 'anual'
  },
  {
    nombre: 'Fecha de publicacion del Informe',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'fecha',
    periodicidad: 'anual'
  },
  {
    nombre: 'Fecha de Publicacion del protocolo',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'fecha',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de actividades de Difusión del protocolo',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'actividades',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de clubes deportivos que reciben materiales informativos para colocar en su infraestructura',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'clubes',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de clubes deportivos que colocan carteleria de la linea 144 en su infgraestructura visible',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'clubes',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de partidos de futbol en los que se difunde la linea 144',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'partidos',
    periodicidad: 'anual'
  },
  {
    nombre: 'Acciones de concientizacion sobre el deporte inclusivo',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'acciones',
    periodicidad: 'anual'
  },
  {
    nombre: 'cantidad de alianzas con organizaciones para promover el deporte inclusivo',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'alianzas',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de nuevos espacios de deporte inclusivo',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'espacios',
    periodicidad: 'anual'
  },
  {
    nombre: 'fecha de lanzamiento de la inscripcion para participar en la maraton',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'fecha',
    periodicidad: 'anual'
  },
  {
    nombre: 'fecha de realizacion de la maraton',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'fecha',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de participantes inscriptos por género',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'participantes',
    periodicidad: 'anual'
  },
  {
    nombre: 'cantidad de materiales de sensibilización distribuidos durante el evento',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'materiales',
    periodicidad: 'anual'
  },
  {
    nombre: 'tiempo promedio de respuestaa incidentes de seguridad',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'horas',
    periodicidad: 'mensual'
  },
  {
    nombre: 'aplicaciones de GCBA analizadas',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'aplicaciones',
    periodicidad: 'anual'
  },
  {
    nombre: 'Actividades de planificacion',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'JDG',
    unidadDefecto: 'actividades',
    periodicidad: 'anual'
  },
  {
    nombre: 'Cantidad de entrevistas de admisión. Cantidad de prestaciones realizadas. (Indicador propuesto)',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'MDH',
    unidadDefecto: 'entrevistas',
    periodicidad: 'mensual'
  },
  {
    nombre: 'Cantidad de mujeres asistidas en situación de consumo en dispositivos donde se garanticen espacio de cuidados. (Indicador propuesto)',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'MDH',
    unidadDefecto: 'mujeres',
    periodicidad: 'mensual'
  },
  {
    nombre: 'b) Aprobación de la Resolución conjunta',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'SEG',
    unidadDefecto: 'resoluciones',
    periodicidad: 'anual'
  },
  {
    nombre: 'a) Brindar la informacion necesaria para garantizar la continuidad del Mapa de Violencia de Género y efectuar la respectiva publicación durante el año 2024.',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'SEG',
    unidadDefecto: 'mapas',
    periodicidad: 'anual'
  },
  {
    nombre: 'a) Cantidad de llamadas recibidas a la línea 911 y redirigidas al 144 (por mes del año 2024)',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'SEG',
    unidadDefecto: 'llamadas',
    periodicidad: 'mensual'
  },
  {
    nombre: 'a) Cantidad de derivaciones realizadas a los CIMs de mujeres con dispositivos electrónicos por estar en situación de violencia de género que requieran asistencia sobre asignaciones de dispositivos por mes',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'SEG',
    unidadDefecto: 'derivaciones',
    periodicidad: 'mensual'
  },
  {
    nombre: 'Desarrollo Economico',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'COM',
    unidadDefecto: 'proyectos',
    periodicidad: 'anual'
  },
  {
    nombre: 'Infraestructura',
    lineaTitulo: 'Compromiso sin título',
    ministerioId: 'COM',
    unidadDefecto: 'obras',
    periodicidad: 'anual'
  }
];

// Función principal
async function crearCompromisosEIndicadoresFaltantes() {
  console.log('🚀 Creando compromisos e indicadores faltantes...\n');
  
  try {
    // Crear compromisos faltantes
    console.log('📝 Creando compromisos faltantes...');
    let compromisosCreados = 0;
    let compromisosFallidos = 0;
    
    for (let i = 0; i < compromisosFaltantes.length; i++) {
      const compromiso = compromisosFaltantes[i];
      console.log(`📝 Creando compromiso ${i + 1}/${compromisosFaltantes.length}: ${compromiso.titulo.substring(0, 50)}...`);
      
      const resultado = await crearCompromiso(compromiso);
      
      if (resultado.success) {
        compromisosCreados++;
      } else {
        compromisosFallidos++;
      }
      
      // Pausa entre creaciones
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n✅ Compromisos creados: ${compromisosCreados}`);
    console.log(`❌ Compromisos fallidos: ${compromisosFallidos}`);
    
    // Crear indicadores faltantes
    console.log('\n📝 Creando indicadores faltantes...');
    let indicadoresCreados = 0;
    let indicadoresFallidos = 0;
    
    for (let i = 0; i < indicadoresFaltantes.length; i++) {
      const indicador = indicadoresFaltantes[i];
      console.log(`📝 Creando indicador ${i + 1}/${indicadoresFaltantes.length}: ${indicador.nombre.substring(0, 50)}...`);
      
      try {
        // Obtener la línea primero
        const linea = await obtenerLinea(indicador.lineaTitulo, indicador.ministerioId);
        
        const resultado = await crearIndicador({
          ...indicador,
          lineaId: linea.id
        });
        
        if (resultado.success) {
          indicadoresCreados++;
        } else {
          indicadoresFallidos++;
        }
      } catch (error) {
        console.log(`❌ Error con indicador "${indicador.nombre}":`, error.message);
        indicadoresFallidos++;
      }
      
      // Pausa entre creaciones
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n✅ Indicadores creados: ${indicadoresCreados}`);
    console.log(`❌ Indicadores fallidos: ${indicadoresFallidos}`);
    
    console.log(`\n🎉 ¡Proceso completado!`);
    console.log(`📊 Resumen:`);
    console.log(`   - Compromisos creados: ${compromisosCreados}`);
    console.log(`   - Indicadores creados: ${indicadoresCreados}`);
    console.log(`   - Total elementos nuevos: ${compromisosCreados + indicadoresCreados}`);
    
  } catch (error) {
    console.error(`\n❌ Error fatal: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  crearCompromisosEIndicadoresFaltantes();
}

module.exports = { crearCompromisosEIndicadoresFaltantes };
