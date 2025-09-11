
// Script para verificar que las actualizaciones se aplicaron correctamente
// Ejecutar después de hacer las actualizaciones manuales

const verificaciones = [
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Cantidad de trabajadores inscriptos en la capacitacion",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Cantidad de trabajadores inscriptos en la capacitacion' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Cantidad de trabajadores que completaron la capacitación",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Cantidad de trabajadores que completaron la capacitación' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Cantidad de capacitaciones brindadas (si sirve se puede dividir en modalidad online y presencial)",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Cantidad de capacitaciones brindadas (si sirve se puede dividir en modalidad online y presencial)' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Cantidad de trabajadores inscriptos en la capacitacion",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Cantidad de trabajadores inscriptos en la capacitacion' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Cantidad de trabajadores que completaron la capacitación",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Cantidad de trabajadores que completaron la capacitación' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Cantidad de capacitaciones brindadas",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Cantidad de capacitaciones brindadas' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Cantidad de ediciones de la especializaciones en perspectiva de género realizadas en 2024",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Cantidad de ediciones de la especializaciones en perspectiva de género realizadas en 2024' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Cantidad de personas inscriptas en especializacion/es de perspectiva de género",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Cantidad de personas inscriptas en especializacion/es de perspectiva de género' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Tasa de paridad en la asignación de becas",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Tasa de paridad en la asignación de becas' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Cantidad de mujeres con becas que finalizaron las formaciones",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Cantidad de mujeres con becas que finalizaron las formaciones' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Cantidad de reuniones para realizar los ajustes al manual de diseño en espacios publicos",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Cantidad de reuniones para realizar los ajustes al manual de diseño en espacios publicos' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Cantidad de encuentros realizados para la elaboracion de diagnostico, planificacion y cronograma de actividades",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Cantidad de encuentros realizados para la elaboracion de diagnostico, planificacion y cronograma de actividades' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Número de materiales promocionales producidos",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Número de materiales promocionales producidos' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Cantidad de nuevas personas inscriptas a futbol mixto",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Cantidad de nuevas personas inscriptas a futbol mixto' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Porcentaje de participación de mujeres en las actividades de fútbol mixto:",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Porcentaje de participación de mujeres en las actividades de fútbol mixto:' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Cantidad de actividades de relevamiento realizadas ",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Cantidad de actividades de relevamiento realizadas ' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Porcentaje de clubes con comisiones de género establecidas:",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Porcentaje de clubes con comisiones de género establecidas:' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Actividades de planificacion",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Actividades de planificacion' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Elaboracion de cronograma de relevamiento",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Elaboracion de cronograma de relevamiento' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Número de entidades deportivas relevadas",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Número de entidades deportivas relevadas' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Porcentaje de entidades con protocolos de actuación existentes:",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Porcentaje de entidades con protocolos de actuación existentes:' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Fecha de publicacion del Informe",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Fecha de publicacion del Informe' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Fecha de Publicacion del protocolo",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Fecha de Publicacion del protocolo' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Cantidad de actividades de Difusión del protocolo",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Cantidad de actividades de Difusión del protocolo' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Cantidad de clubes deportivos que reciben materiales informativos para colocar en su infraestructura",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Cantidad de clubes deportivos que reciben materiales informativos para colocar en su infraestructura' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Cantidad de clubes deportivos que colocan carteleria de la linea 144 en su infgraestructura visible",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Cantidad de clubes deportivos que colocan carteleria de la linea 144 en su infgraestructura visible' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Acciones de concientizacion sobre el deporte inclusivo",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Acciones de concientizacion sobre el deporte inclusivo' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "tiempo promedio de respuestaa incidentes de seguridad",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'tiempo promedio de respuestaa incidentes de seguridad' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "aplicaciones de GCBA analizadas",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'aplicaciones de GCBA analizadas' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "Cantidad de consultas atendidas por genero que necesiten derivacion a traves de boti",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'Cantidad de consultas atendidas por genero que necesiten derivacion a traves de boti' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Jefatura de Gabinete",
    indicador: "contenidos de campaña de genero incorporados en boti",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Jefatura de Gabinete' el indicador 'contenidos de campaña de genero incorporados en boti' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Educación 22/8",
    indicador: "Garantizar el cupo de mujeres en el curso Talento Tech +18 (50%): % de mujeres sobre el total de cursantes",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Educación 22/8' el indicador 'Garantizar el cupo de mujeres en el curso Talento Tech +18 (50%): % de mujeres sobre el total de cursantes' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Educacion",
    indicador: "Garantizar el cupo de mujeres en el curso Talento Tech -18 (40%): % de mujeres sobre el total de cursantes",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Educacion' el indicador 'Garantizar el cupo de mujeres en el curso Talento Tech -18 (40%): % de mujeres sobre el total de cursantes' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Educacion",
    indicador: "Cantidad de casos derivados",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Educacion' el indicador 'Cantidad de casos derivados' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Educacion",
    indicador: "Creación de las comisiones de Bienestar Digital y de Género y STEAM ",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Educacion' el indicador 'Creación de las comisiones de Bienestar Digital y de Género y STEAM ' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Educacion",
    indicador: "% de mujeres sobre la matrícula del  curso "Cuidador/a de niños y niñas en el ámbito de la vida familiar"",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Educacion' el indicador '% de mujeres sobre la matrícula del  curso "Cuidador/a de niños y niñas en el ámbito de la vida familiar"' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Educacion",
    indicador: "Cursos cuatrimestral, dictado en 2 Centros de Formación Profesional.",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Educacion' el indicador 'Cursos cuatrimestral, dictado en 2 Centros de Formación Profesional.' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Educacion",
    indicador: "Cantidad de participantes de la comisión de Género y STEAM. Dicha comisión tiene por objeto dar herramientas de formación sobre mujeres ganers, la modificación de roles y funciones de Facilitadores y Asistentes Pedagógicos Digitales y la inserción de las niñas en la cultura digital.",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Educacion' el indicador 'Cantidad de participantes de la comisión de Género y STEAM. Dicha comisión tiene por objeto dar herramientas de formación sobre mujeres ganers, la modificación de roles y funciones de Facilitadores y Asistentes Pedagógicos Digitales y la inserción de las niñas en la cultura digital.' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Educacion",
    indicador: "Cantidad de inscriptas en el programa",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Educacion' el indicador 'Cantidad de inscriptas en el programa' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Educacion",
    indicador: "Cantidad de clubes creados",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Educacion' el indicador 'Cantidad de clubes creados' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Educacion",
    indicador: "% de mujeres matriculadas en las 32 divisiones de escuelas técnicas inscriptas",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Educacion' el indicador '% de mujeres matriculadas en las 32 divisiones de escuelas técnicas inscriptas' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Educacion",
    indicador: "Cantidad de mujeres mentoreadas anualmente ",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Educacion' el indicador 'Cantidad de mujeres mentoreadas anualmente ' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Seguridad 16-5",
    indicador: "a) Cantidad de reuniones entre el Ministerio de Seguridad y la Subsecretaría de la Mujer para la elaboración de la Resolución conjunta que apruebe la Mesa
",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Seguridad 16-5' el indicador 'a) Cantidad de reuniones entre el Ministerio de Seguridad y la Subsecretaría de la Mujer para la elaboración de la Resolución conjunta que apruebe la Mesa
' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "Seguridad",
    indicador: "a) Cantidad de llamadas recibidas a la línea 911 y redirigidas al 144 (por mes del año 2024)",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'Seguridad' el indicador 'a) Cantidad de llamadas recibidas a la línea 911 y redirigidas al 144 (por mes del año 2024)' y verificar que columna D tenga 'enero'"
  },
  {
    ministerio: "MDHyH",
    indicador: "Cantidad de llamadas realizadas al 144 y derivadas al 911 por mes",
    mesEsperado: "enero",
    verificacion: "Buscar en hoja 'MDHyH' el indicador 'Cantidad de llamadas realizadas al 144 y derivadas al 911 por mes' y verificar que columna D tenga 'enero'"
  }
];

console.log('🔍 VERIFICACIONES REQUERIDAS:');
verificaciones.forEach((v, i) => {
  console.log(`${i + 1}. ${v.verificacion}`);
});

console.log('\n📊 TOTAL DE VERIFICACIONES: ${verificaciones.length}');
