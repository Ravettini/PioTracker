const XLSX = require('xlsx');
const fs = require('fs');

/**
 * Script para generar Excel basado en las estructuras específicas de cada hoja
 * Respeta la estructura única de cada ministerio/hoja
 */

function generarExcelBasadoEnEstructurasReales() {
  try {
    console.log('📊 Generando Excel basado en estructuras reales de cada hoja...');
    
    // Crear workbook
    const workbook = XLSX.utils.book_new();
    
    // Definir las estructuras específicas de cada hoja basadas en las imágenes
    const estructurasHojas = {
      'Justicia': {
        headers: ['Ministerio', 'Compromisos', 'Indicadores', 'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEPT', 'OCT', 'NOV', 'DIC'],
        compromisos: [
          {
            nombre: 'Promover el asesoramiento y patrocinio jurídico penal gratuito para víctimas de violencia de género, violencia sexual y trata de personas',
            indicadores: [
              'Cantidad y tipo de acciones realizadas para',
              'Cantidad de mujeres/usuarios atendidos',
              'Cantidad de casos atendidos anualmente',
              'Cantidad de reuniones y/o encuentros'
            ],
            datosMeses: {
              'ENE': [0, 0, 0],
              'FEB': [2, '1 género; 2', 1],
              'MAR': [5, '1 género; 1', 1],
              'ABR': [1, '2 género, 3', 0],
              'MAY': [1, '1 sexual', 0],
              'JUN': [5, '5 género', 2],
              'JUL': [8, '3 género; 5 sexual', 2],
              'AGO': [10, '4 género, 6 sexual', 1],
              'SEPT': [6, '1 género; 5 sexual', 3],
              'OCT': [3, '1 género; 2 sexual', 2],
              'NOV': [1, '1 género', 2],
              'DIC': [1]
            }
          },
          {
            nombre: 'Impulsar conversaciones para alcanzar la transferencia de competencias y la creación de un fuero que permita abordar la problemática de la violencia por razones de género',
            indicadores: [
              'Porcentaje de avance de realización de un Análisis Diagnóstico de la situación actual'
            ],
            datosMeses: {
              'AGO': ['10%'],
              'SEPT': ['10%'],
              'OCT': ['15%'],
              'NOV': ['15%'],
              'DIC': ['50% (Estimado)']
            }
          }
        ]
      },
      
      'Jefatura de Gabinete': {
        headers: ['Ministerio', 'Compromisos', 'Indicadores', 'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEPT', 'OCT', 'NOV', 'DIC', 'TOTAL'],
        compromisos: [
          {
            nombre: 'Garantizar el cumplimiento de la capacitación obligatoria en Ley Micaela',
            indicadores: [
              'Cantidad de trabajadores inscriptos en la capacitacion',
              'Cantidad de trabajadores que completaron la capacitación',
              'Cantidad de capacitaciones brindadas'
            ],
            datosMeses: {
              'ENE': [4557, 2440, 'Autogestionado 2 - Presencial 22 - Virtual con Tutoría 10'],
              'FEB': [null, null, null],
              'MAR': [null, null, null],
              'ABR': [null, null, null],
              'MAY': [null, null, null],
              'JUN': [null, null, null],
              'JUL': [null, null, null],
              'AGO': [null, null, null],
              'SEPT': [null, null, null],
              'OCT': [null, null, null],
              'NOV': [null, null, null],
              'DIC': [null, null, null],
              'TOTAL': [5916, 3247, 301]
            }
          },
          {
            nombre: 'Articular instancias de capacitación y formación en la implementación de Programa Mujeres Líderes en GCBA',
            indicadores: [
              'Cantidad de trabajadores inscriptos en la capacitacion',
              'Cantidad de trabajadores que completaron la capacitación',
              'Cantidad de capacitaciones brindadas'
            ],
            datosMeses: {
              'ENE': [70, 18, 7],
              'TOTAL': [97, 28, 1]
            }
          }
        ]
      },
      
      'Educacion': {
        headers: ['Ministerio', 'Compromisos', 'Indicadores', 'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEPT', 'OCT', 'NOV', 'DIC', 'TOTAL'],
        compromisos: [
          {
            nombre: 'Garantizar el cupo de mujeres en los cursos de los Programas Talento Tech +18 (50%) y Talento Tech -18 (40%)',
            indicadores: [
              'Garantizar el cupo de mujeres en el curso Talento Tech +18 (50%): % de mujeres sobre el total de cursantes',
              'Garantizar el cupo de mujeres en el curso Talento Tech -18 (40%): % de mujeres sobre el total de cursantes'
            ],
            datosMeses: {
              'JUN': ['39%', '42%'],
              'TOTAL': ['Status al 4/11. Total inscriptos 29.950. El 56% de los inscriptos', 'Status al 4/11: Total inscriptos 5.062. 60% de los inscriptos confirmaron vacante 3.055. 42% de los']
            }
          },
          {
            nombre: 'Acompañar a las egresadas de los cursos mencionados en el apartado A), en la inserción laboral desde la iniciativa Oportunidades Laborales',
            indicadores: [
              'No aplica. Aún no hay egresos.'
            ],
            datosMeses: {
              'MAY': ['No aplica. Aún no hay egresos.'],
              'JUN': ['No aplica. Aún no hay egresos.'],
              'JUL': ['No aplica. Aún no hay egresos.'],
              'AGO': ['No aplica. Aún no hay egresos.'],
              'SEPT': ['No aplica. Aún no hay egresos.'],
              'OCT': ['No aplica. Aún no hay egresos.'],
              'NOV': ['No aplica. Aún no hay egresos.'],
              'DIC': ['No aplica. Aún no hay egresos.'],
              'TOTAL': ['Aún no hay egresos']
            }
          }
        ]
      },
      
      'Seguridad': {
        headers: ['Ministerio', 'Compromisos', 'Indicadores', 'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEPT', 'OCT', 'NOV', 'DIC', 'TOTAL'],
        compromisos: [
          {
            nombre: 'Crear en conjunto con la Subsecretaría de la Mujer una "Mesa Interministerial de Femicidios" de la Ciudad de Buenos Aires',
            indicadores: [
              'Cantidad de reuniones entre el Ministerio de Seguridad y la Subsecretaría de la Mujer para la elaboración de la Resolución conjunta',
              'Aprobación de la Resolución conjunta'
            ],
            datosMeses: {
              'JUL': [1, null],
              'TOTAL': [1, null]
            }
          },
          {
            nombre: 'Garantizar la continuidad del convenio de las líneas 144 de Atención a la Víctima y 911 de atención ante emergencias',
            indicadores: [
              'Cantidad de llamadas recibidas a la línea 911 y redirigidas al 144 (por mes del año 2024)'
            ],
            datosMeses: {
              'ENE': [37],
              'FEB': [18],
              'MAR': [22],
              'ABR': [20],
              'MAY': [25],
              'JUN': [19],
              'JUL': [15],
              'AGO': [7],
              'SEPT': [10],
              'OCT': [14],
              'NOV': [16],
              'TOTAL': [203]
            }
          }
        ]
      },
      
      'Salud': {
        headers: ['Ministerio', 'Compromisos', 'Indicadores', 'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEPT', 'OCT', 'NOV', 'DIC', 'TOTAL', 'Línea de Base'],
        compromisos: [
          {
            nombre: 'Diseñar una planificación para consejerías sobre salud sexual como herramienta para la promoción y prevención de la salud',
            indicadores: [
              'Cantidad de consejerías de salud sexual realizadas en los centros de salud',
              'Cantidad de turnos de colocacion o consulta sobre MAC realizados anualmente en atención primaria'
            ],
            datosMeses: {
              'TOTAL': [84452, 20508],
              'Línea de Base': ['77497 (2023)', '16698 (2023)']
            }
          },
          {
            nombre: 'Promover el desarrollo de operativos territoriales interministeriales para la prevención del cáncer de cuello uterino',
            indicadores: [
              'Cantidad de mujeres (entre 25 y 64 años) que se realizaron un estudio de PAP en el ultimo año'
            ],
            datosMeses: {
              'TOTAL': ['en construcción'],
              'Línea de Base': ['en construcción']
            }
          }
        ]
      },
      
      'Ente regulador de servicios púb': {
        headers: ['Ministerio', 'Compromisos', 'Indicadores', 'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEPT', 'OCT', 'NOV', 'DIC'],
        compromisos: [
          {
            nombre: 'Actualizar los lineamientos para la intervención ante situaciones de violencia por razones de género, identidad de género y discriminación',
            indicadores: [
              'cantidad de reuniones para la actualizacion de los lineamientos',
              'publicacion de nuevos lineamientos para la intervencion ante situaciones de violencia por razones de genero'
            ],
            datosMeses: {
              'AGO': [1, null],
              'SEPT': [1, 'Revision del protocolo en vigencia'],
              'OCT': [1, 'Revision del protocolo en vigencia'],
              'NOV': [1, 'Revision del protocolo en vigencia']
            }
          },
          {
            nombre: 'Promover la incorporación de las empresas proveedoras de servicios públicos de la Ciudad de Buenos Aires al Programa PARES',
            indicadores: [
              'Cantidad de acciones realizadas para promover la incorporación de las empresas proveedoras de servicios públicos',
              'Cantidad de empresas proveedoras de servicios públicos de la Ciudad de Buenos Aires incorporadas al Programa PARES'
            ],
            datosMeses: {
              'ENE': ['Ver anexo', 'Ver anexo'],
              'FEB': ['Ver anexo', 'Ver anexo'],
              'MAR': ['Ver anexo', 'Ver anexo'],
              'ABR': ['Ver anexo', 'Ver anexo'],
              'MAY': ['Ver anexo', 'Ver anexo'],
              'JUN': ['Ver anexo', 'Ver anexo'],
              'JUL': ['Ver anexo', 'Ver anexo'],
              'AGO': ['Ver anexo', 'Ver anexo'],
              'SEPT': ['Ver anexo', 'Ver anexo'],
              'OCT': ['Ver anexo', 'Ver anexo'],
              'NOV': ['Ver anexo', 'Ver anexo'],
              'DIC': ['Ver anexo', 'Ver anexo']
            }
          }
        ]
      },
      
      'Vicejefatura': {
        headers: ['Area', 'Compromisos', 'Indicadores', 'Indicadores2', 'Indicadores3', 'Indicadores4'],
        compromisos: [
          {
            nombre: 'A través de la Secretaría de Bienestar Integral: Promover el acompañamiento a mujeres mayores',
            indicadores: [
              'Cantidad de mujeres mayores que han participado de los diferentes programas/políticas de la secretaria',
              'cantidad de mujeres mayores victimas de violencias por motivos de genero que han sido beneficiarias de las politicas de la Secretaria'
            ],
            datosMeses: {}
          },
          {
            nombre: 'A través de la Subsecretaría de la Mujer: Centralizar y coordinar las políticas de género de la Ciudad de Buenos Aires',
            indicadores: [
              'cantidad de reuniones interinstitucionales de coordinación sobre políticas de género',
              'cantidad de políticas impulsadas desde la SSMUJ',
              'cantidad de políticas de género existentes en el GCBA'
            ],
            datosMeses: {}
          },
          {
            nombre: 'A través de la Subsecretaría de Cultura Ciudadana y Derechos Humanos: Promover la igualdad de oportunidades en el ámbito laboral',
            indicadores: [
              'cantidad de nuevos Cv recibidos en el Programa de Empleabilidad trans',
              'cantidad de persoas incluídas laboralmente a traves del programa de empleabilidad trans en el ambito publico',
              'cantidad de personas incluídas laboralmente a traves del programa de empleabilidad trans en el ambito privado',
              'Cantidad de espacios de promocion de derechos / capacitacion realizados'
            ],
            datosMeses: {}
          }
        ]
      },
      
      'Espacio Publico': {
        headers: ['Ministerio', 'Compromisos', 'Indicadores', 'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEPT', 'OCT', 'NOV', 'DIC', 'TOTAL'],
        compromisos: [
          {
            nombre: 'Promover la incorporación de las empresas con licitaciones vigentes para conservación del espacio público y la higiene urbana en la Ciudad de Buenos Aires al Programa PARES',
            indicadores: [
              'Cantidad de acciones realizadas para promover la incorporación de las empresas con licitaciones vigentes',
              'Cantidad de empresas de estas'
            ],
            datosMeses: {
              'TOTAL': ['Tras la firma de Acta Acuerdo Plan de Igualdad de Oportunidades', 'Ninguna']
            }
          },
          {
            nombre: 'Continuar con la implementación del programa de 12 cooperativas vinculadas al Ministerio de Espacio Público e Higiene Urbana',
            indicadores: [
              'Cantidad y tipo de acciones que',
              'cantidad de charlas y capacitaciones',
              'Porcentaje de cooperativas'
            ],
            datosMeses: {
              'TOTAL': ['Promotoras Ambientales: las acciones realizadas entre enero y diciembre de 2024', 'Con el apoyo de la fundación Delterra, 116 Promotoras Ambientales pudieron', '100%: las promotoras de las 12 cooperativas fueron alcanzadas']
            }
          }
        ]
      },
      
      'Hacienda y finanzas': {
        headers: ['Ministerio', 'Compromisos', 'Indicadores', 'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEPT', 'OCT', 'NOV', 'DIC', 'TOTAL'],
        compromisos: [
          {
            nombre: 'Coordinar el seguimiento de la ejecución financiera anual de todos los programas con perspectiva de género y diversidad incluidos en el presupuesto',
            indicadores: [
              'cantidad de programas con perspectiva de genero y diversidad incluidos en el presupuesto',
              'porcentaje del presupuesto del GCBA asignado a programas con perspectiva de genero y diversidad'
            ],
            datosMeses: {}
          },
          {
            nombre: 'En el marco de la Ley 6083, promover a actualización de la normativa que reglamenta el alcance y procedimiento del Protocolo de actuación en los casos de violencia por motivos de género',
            indicadores: [
              'cantidad de reuniones para realizar la actualizacion de la normartiva que reglamenta el alcance y procedimiento de Protocolo',
              'publicacion del Protocolo actualizado'
            ],
            datosMeses: {}
          },
          {
            nombre: 'del sello empresa mujer a las empresas proveedoras de GCBA que cumplan con los requisitos dispuestos',
            indicadores: [
              'cantidad de empresas que han solicitado',
              'cantidad de actividades de promocion del',
              'seguimiento y control de los requisitos de'
            ],
            datosMeses: {}
          }
        ]
      },
      
      'MDHyH': {
        headers: ['Ministerio', 'Compromisos', 'Indicadores', 'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEPT', 'OCT', 'NOV', 'DIC', 'TOTAL'],
        compromisos: [
          {
            nombre: 'Continuar con las líneas de atención telefónica especializada en violencia de género',
            indicadores: [
              'Cantidad de llamadas a la línea: 43.765',
              'Cantidad de casos de violencia de género: 4091',
              'Cantidad de derivaciones de casos de VDG a línea 911: 731'
            ],
            datosMeses: {
              'ENE': [43, 4091, 731],
              'TOTAL': [43765, 4091, 731]
            }
          }
        ]
      }
    };
    
    // Generar cada hoja
    Object.entries(estructurasHojas).forEach(([nombreHoja, estructura]) => {
      console.log(`\n📄 Generando hoja: ${nombreHoja}`);
      
      const hojaData = [];
      
      // Headers
      hojaData.push(estructura.headers);
      
      // Agregar datos de cada compromiso
      estructura.compromisos.forEach(compromiso => {
        // Fila del compromiso
        const filaCompromiso = [nombreHoja, compromiso.nombre];
        
        // Agregar indicadores
        compromiso.indicadores.forEach((indicador, index) => {
          const fila = [...filaCompromiso, indicador];
          
          // Agregar datos de meses
          estructura.headers.slice(3).forEach(mes => {
            if (compromiso.datosMeses[mes]) {
              fila.push(compromiso.datosMeses[mes][index] || '');
            } else {
              fila.push('');
            }
          });
          
          hojaData.push(fila);
        });
      });
      
      console.log(`✅ ${nombreHoja}: ${hojaData.length - 1} filas generadas`);
      
      // Limitar nombre de hoja a 31 caracteres
      const nombreHojaLimitado = nombreHoja.length > 31 ? nombreHoja.substring(0, 31) : nombreHoja;
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(hojaData), nombreHojaLimitado);
    });
    
    // Crear hoja consolidada con estructura unificada
    console.log('\n📊 Creando hoja consolidada...');
    const consolidadaData = [
      ['Ministerio', 'Compromiso', 'Indicador', 'Mes', 'Valor', 'Tipo_Dato', 'Observaciones']
    ];
    
    Object.entries(estructurasHojas).forEach(([ministerio, estructura]) => {
      estructura.compromisos.forEach(compromiso => {
        compromiso.indicadores.forEach((indicador, index) => {
          // Extraer datos de meses
          Object.entries(compromiso.datosMeses).forEach(([mes, valores]) => {
            if (valores && valores[index] !== null && valores[index] !== undefined) {
              consolidadaData.push([
                ministerio,
                compromiso.nombre,
                indicador,
                mes,
                valores[index],
                typeof valores[index] === 'number' ? 'Numérico' : 'Texto',
                mes === 'TOTAL' ? 'Total acumulado' : mes === 'Línea de Base' ? 'Línea de base' : `Dato de ${mes}`
              ]);
            }
          });
        });
      });
    });
    
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(consolidadaData), 'CONSOLIDADA');
    
    // Guardar archivo
    const nombreArchivo = 'scripts/excel-estructuras-reales.xlsx';
    XLSX.writeFile(workbook, nombreArchivo);
    
    console.log(`\n✅ Archivo generado: ${nombreArchivo}`);
    console.log(`📊 Total de filas en consolidada: ${consolidadaData.length - 1}`);
    
    // Generar también un CSV para fácil copia
    generarCSVConsolidado(consolidadaData);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

function generarCSVConsolidado(datos) {
  try {
    console.log('\n📄 Generando CSV consolidado...');
    
    const csvContent = datos.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    fs.writeFileSync('scripts/excel-estructuras-reales.csv', csvContent);
    console.log('✅ CSV generado: scripts/excel-estructuras-reales.csv');
    
  } catch (error) {
    console.error('❌ Error generando CSV:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generarExcelBasadoEnEstructurasReales();
}

module.exports = { generarExcelBasadoEnEstructurasReales };
