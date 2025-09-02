import { DataSource } from 'typeorm';
import { AppDataSource } from './data-source';
import { Usuario, RolUsuario } from './entities/usuario.entity';
import { Ministerio } from './entities/ministerio.entity';
import { Linea } from './entities/linea.entity';
import { Indicador, Periodicidad } from './entities/indicador.entity';
import * as argon2 from 'argon2';

async function seed() {
  try {
    console.log('🔗 Conectando a la base de datos...');
    const dataSource = await AppDataSource.initialize();
    
    console.log('🗑️ Limpiando datos existentes...');
    await dataSource.query('TRUNCATE TABLE auditoria CASCADE');
    await dataSource.query('TRUNCATE TABLE cargas CASCADE');
    await dataSource.query('TRUNCATE TABLE usuarios CASCADE');
    await dataSource.query('TRUNCATE TABLE indicadores CASCADE');
    await dataSource.query('TRUNCATE TABLE lineas CASCADE');
    await dataSource.query('TRUNCATE TABLE ministerios CASCADE');

    console.log('🏛️ Creando ministerios...');
    const ministerios = [
      { id: 'DES', nombre: 'Desarrollo Económico y Social', sigla: 'DES' },
      { id: 'EDU', nombre: 'Educación', sigla: 'EDU' },
      { id: 'SAL', nombre: 'Salud', sigla: 'SAL' },
      { id: 'SEG', nombre: 'Seguridad y Justicia', sigla: 'SEG' },
      { id: 'TRA', nombre: 'Transporte y Obras Públicas', sigla: 'TRA' },
      { id: 'CUL', nombre: 'Cultura', sigla: 'CUL' },
      { id: 'MED', nombre: 'Medio Ambiente', sigla: 'MED' },
      { id: 'TUR', nombre: 'Turismo', sigla: 'TUR' }
    ];

    for (const ministerioData of ministerios) {
      const ministerio = dataSource.manager.create(Ministerio, ministerioData);
      await dataSource.manager.save(ministerio);
    }

    console.log('📊 Creando líneas...');
    const lineas = [
      // Desarrollo Económico
      { id: 'DES-EMP', titulo: 'Empleo y Desarrollo Productivo', ministerioId: 'DES' },
      { id: 'DES-COM', titulo: 'Comercio y Servicios', ministerioId: 'DES' },
      { id: 'DES-IND', titulo: 'Industria y Tecnología', ministerioId: 'DES' },
      
      // Educación
      { id: 'EDU-ESC', titulo: 'Educación Escolar', ministerioId: 'EDU' },
      { id: 'EDU-SUP', titulo: 'Educación Superior', ministerioId: 'EDU' },
      { id: 'EDU-TEC', titulo: 'Formación Técnica', ministerioId: 'EDU' },
      
      // Salud
      { id: 'SAL-ATN', titulo: 'Atención Primaria', ministerioId: 'SAL' },
      { id: 'SAL-HOS', titulo: 'Hospitales y Emergencias', ministerioId: 'SAL' },
      { id: 'SAL-PRE', titulo: 'Prevención y Promoción', ministerioId: 'SAL' },
      
      // Seguridad
      { id: 'SEG-POL', titulo: 'Policía y Prevención', ministerioId: 'SEG' },
      { id: 'SEG-JUS', titulo: 'Justicia y Reinserción', ministerioId: 'SEG' },
      
      // Transporte
      { id: 'TRA-MET', titulo: 'Metrobús y Transporte Público', ministerioId: 'TRA' },
      { id: 'TRA-INF', titulo: 'Infraestructura Vial', ministerioId: 'TRA' },
      
      // Cultura
      { id: 'CUL-ART', titulo: 'Artes y Espectáculos', ministerioId: 'CUL' },
      { id: 'CUL-PAT', titulo: 'Patrimonio Cultural', ministerioId: 'CUL' },
      
      // Medio Ambiente
      { id: 'MED-RES', titulo: 'Residuos y Reciclaje', ministerioId: 'MED' },
      { id: 'MED-ESP', titulo: 'Espacios Verdes', ministerioId: 'MED' },
      
      // Turismo
      { id: 'TUR-ATR', titulo: 'Atractivos Turísticos', ministerioId: 'TUR' },
      { id: 'TUR-EVE', titulo: 'Eventos y Promoción', ministerioId: 'TUR' }
    ];

    for (const lineaData of lineas) {
      const linea = dataSource.manager.create(Linea, lineaData);
      await dataSource.manager.save(linea);
    }

    console.log('📈 Creando indicadores...');
    const indicadores = [
      // Empleo
      { 
        id: 'EMP-TASA', 
        nombre: 'Tasa de Empleo', 
        lineaId: 'DES-EMP', 
        unidadDefecto: '%', 
        periodicidad: Periodicidad.MENSUAL,
        valorMin: 0,
        valorMax: 100
      },
      { 
        id: 'EMP-PUESTOS', 
        nombre: 'Puestos de Trabajo Creados', 
        lineaId: 'DES-EMP', 
        unidadDefecto: 'puestos', 
        periodicidad: Periodicidad.TRIMESTRAL,
        valorMin: 0
      },
      
      // Educación
      { 
        id: 'EDU-MATRICULA', 
        nombre: 'Tasa de Matrícula Escolar', 
        lineaId: 'EDU-ESC', 
        unidadDefecto: '%', 
        periodicidad: Periodicidad.ANUAL,
        valorMin: 0,
        valorMax: 100
      },
      { 
        id: 'EDU-EGRESO', 
        nombre: 'Tasa de Egreso Secundario', 
        lineaId: 'EDU-ESC', 
        unidadDefecto: '%', 
        periodicidad: Periodicidad.ANUAL,
        valorMin: 0,
        valorMax: 100
      },
      
      // Salud
      { 
        id: 'SAL-CONSULTAS', 
        nombre: 'Consultas Médicas Realizadas', 
        lineaId: 'SAL-ATN', 
        unidadDefecto: 'consultas', 
        periodicidad: Periodicidad.MENSUAL,
        valorMin: 0
      },
      { 
        id: 'SAL-VACUNAS', 
        nombre: 'Dosis de Vacunas Aplicadas', 
        lineaId: 'SAL-PRE', 
        unidadDefecto: 'dosis', 
        periodicidad: Periodicidad.MENSUAL,
        valorMin: 0
      },
      
      // Seguridad
      { 
        id: 'SEG-DELITOS', 
        nombre: 'Tasa de Delitos por 100.000 Habitantes', 
        lineaId: 'SEG-POL', 
        unidadDefecto: 'delitos/100k hab', 
        periodicidad: Periodicidad.MENSUAL,
        valorMin: 0
      },
      
      // Transporte
      { 
        id: 'TRA-PASAJEROS', 
        nombre: 'Pasajeros Transportados por Día', 
        lineaId: 'TRA-MET', 
        unidadDefecto: 'pasajeros/día', 
        periodicidad: Periodicidad.MENSUAL,
        valorMin: 0
      },
      { 
        id: 'TRA-KM', 
        nombre: 'Kilómetros de Metrobús Operativos', 
        lineaId: 'TRA-MET', 
        unidadDefecto: 'km', 
        periodicidad: Periodicidad.SEMESTRAL,
        valorMin: 0
      },
      
      // Cultura
      { 
        id: 'CUL-EVENTOS', 
        nombre: 'Eventos Culturales Realizados', 
        lineaId: 'CUL-ART', 
        unidadDefecto: 'eventos', 
        periodicidad: Periodicidad.TRIMESTRAL,
        valorMin: 0
      },
      
      // Medio Ambiente
      { 
        id: 'MED-RECICLAJE', 
        nombre: 'Porcentaje de Residuos Reciclados', 
        lineaId: 'MED-RES', 
        unidadDefecto: '%', 
        periodicidad: Periodicidad.TRIMESTRAL,
        valorMin: 0,
        valorMax: 100
      },
      { 
        id: 'MED-ESPACIOS', 
        nombre: 'Metros Cuadrados de Espacios Verdes por Habitante', 
        lineaId: 'MED-ESP', 
        unidadDefecto: 'm²/hab', 
        periodicidad: Periodicidad.ANUAL,
        valorMin: 0
      },
      
      // Turismo
      { 
        id: 'TUR-VISITANTES', 
        nombre: 'Visitantes a Atractivos Turísticos', 
        lineaId: 'TUR-ATR', 
        unidadDefecto: 'visitantes', 
        periodicidad: Periodicidad.MENSUAL,
        valorMin: 0
      }
    ];

    for (const indicadorData of indicadores) {
      const indicador = dataSource.manager.create(Indicador, indicadorData);
      await dataSource.manager.save(indicador);
    }

    console.log('👤 Creando usuario administrador...');
    const hashClave = await argon2.hash('Cambiar.123');
    const usuarioAdmin = dataSource.manager.create(Usuario, {
      email: 'admin@pio.local',
      nombre: 'Administrador del Sistema',
      hashClave,
      rol: RolUsuario.ADMIN,
      ministerioId: null,
      activo: true,
      claveTemporal: true
    });
    await dataSource.manager.save(usuarioAdmin);

    console.log('✅ Seed completado exitosamente!');
    console.log('📋 Datos creados:');
    console.log(`   - ${ministerios.length} ministerios`);
    console.log(`   - ${lineas.length} líneas`);
    console.log(`   - ${indicadores.length} indicadores`);
    console.log(`   - 1 usuario administrador (admin@pio.local / Cambiar.123)`);
    
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  }
}

seed();

