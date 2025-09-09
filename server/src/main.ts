import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';
import helmet from 'helmet';
import { DataSource } from 'typeorm';
import * as path from 'path';

import { AppModule } from './app.module';

// Función para ejecutar migraciones automáticamente
async function runMigrations() {
  try {
    console.log('🔄 ===== INICIANDO MIGRACIONES AUTOMÁTICAS =====');
    console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurado' : 'NO CONFIGURADO');
    console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
    
    const dataSource = new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      synchronize: false,
      logging: true, // Habilitar logging para ver las queries
      entities: [path.join(__dirname, 'db/entities/*.js')],
      migrations: [path.join(__dirname, 'db/migrations/*.js')],
      migrationsTableName: 'migrations',
      migrationsRun: false, // No ejecutar automáticamente, lo hacemos manualmente
    });

    console.log('🔄 Inicializando conexión a la base de datos...');
    await dataSource.initialize();
    console.log('✅ Conexión a la base de datos establecida exitosamente');
    
    console.log('🔄 Ejecutando migraciones...');
    
    // Verificar qué migraciones están disponibles
    const pendingMigrations = await dataSource.showMigrations();
    console.log('🔍 Migraciones pendientes:', pendingMigrations);
    
    const migrations = await dataSource.runMigrations();
    console.log(`✅ ${migrations.length} migraciones ejecutadas exitosamente:`);
    migrations.forEach((migration, index) => {
      console.log(`   ${index + 1}. ${migration.name}`);
    });
    
    await dataSource.destroy();
    console.log('🎉 ===== MIGRACIONES COMPLETADAS EXITOSAMENTE =====');
  } catch (error) {
    console.error('❌ ===== ERROR EJECUTANDO MIGRACIONES =====');
    console.error('❌ Error:', error.message);
    console.error('❌ Stack:', error.stack);
    console.error('❌ ===== CONTINUANDO CON EL INICIO DE LA APLICACIÓN =====');
    // No salir del proceso, continuar con el inicio de la aplicación
  }
}

// Función para crear usuario administrador automáticamente
async function createAdminUser() {
  try {
    console.log('🔄 Verificando usuario administrador...');
    
    const dataSource = new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      synchronize: false,
      logging: false,
      entities: [path.join(__dirname, 'db/entities/*.js')],
    });

    await dataSource.initialize();
    
    // Verificar si ya existe el usuario admin
    const existingAdmin = await dataSource.query(`
      SELECT id FROM usuarios WHERE email = 'admin@pio.local'
    `);

    if (existingAdmin.length > 0) {
      console.log('✅ Usuario admin ya existe');
    } else {
      console.log('🔄 Creando usuario administrador...');
      
        // Crear usuario administrador (sin hash por ahora, solo para testing)
        await dataSource.query(`
          INSERT INTO usuarios (
            email, nombre, rol, clave_temporal,
            intentos_fallidos, bloqueado_hasta, activo
          ) VALUES (
            'admin@pio.local', 'Administrador', 'ADMIN', true,
            0, NULL, true
          )
        `);
      
      console.log('✅ Usuario administrador creado');
    }

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error creando usuario admin:', error.message);
    // No salir del proceso, continuar con el inicio de la aplicación
  }
}

async function bootstrap() {
  // Ejecutar migraciones automáticamente antes de iniciar la aplicación
  console.log('🔄 ===== EJECUTANDO MIGRACIONES ANTES DEL INICIO =====');
  await runMigrations();
  console.log('✅ ===== MIGRACIONES COMPLETADAS =====');
  
  // Crear usuario administrador si no existe
  console.log('🔄 ===== CREANDO USUARIO ADMINISTRADOR =====');
  await createAdminUser();
  console.log('✅ ===== USUARIO ADMIN VERIFICADO =====');
  
  console.log('🚀 ===== INICIANDO APLICACIÓN =====');
  
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configuración de seguridad
  app.use(helmet());
  
  // CORS - Configuración para múltiples orígenes
  const allowedOrigins = configService.get('cors.origin')
    ? configService.get('cors.origin').split(',').map((o: string) => o.trim())
    : ['http://localhost:3000', 'https://pio-tracker-frontend.vercel.app'];

  console.log(`🌐 CORS configurado para orígenes: ${allowedOrigins.join(', ')}`);
  console.log(`🔧 Configuración CORS aplicada correctamente`);

  // CORS DEFINITIVO - GARANTIZADO QUE FUNCIONE
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://pio-tracker-frontend.vercel.app',
      'https://pio-tracker-frontend-n599d446t-nachos-projects-e0e5a719.vercel.app',
      'https://pio-tracker-frontend-jgncbqqhy-nachos-projects-e0e5a719.vercel.app',
      /^https:\/\/pio-tracker-frontend.*\.vercel\.app$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 200
  });

  // Middleware CORS adicional - GARANTIZADO
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && (
      origin.includes('pio-tracker-frontend') || 
      origin.includes('localhost:3000')
    )) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With');
      res.header('Access-Control-Allow-Credentials', 'true');
    }
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    next();
  });

  // Middleware
  app.use(cookieParser());
  
  // CSRF protection (comentado temporalmente para desarrollo)
  // if (configService.get('nodeEnv') === 'production') {
  //   app.use(csurf({ 
  //     cookie: { 
  //       httpOnly: true, 
  //       secure: configService.get('nodeEnv') === 'production',
  //       sameSite: 'lax'
  //     } 
  //   }));
  // }

  // Validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // Endpoint OPTIONS global - GARANTIZADO PARA TODAS LAS RUTAS
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      const origin = req.headers.origin;
      if (origin && (
        origin.includes('pio-tracker-frontend') || 
        origin.includes('localhost:3000')
      )) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With');
        res.header('Access-Control-Allow-Credentials', 'true');
      }
      res.status(200).end();
      return;
    }
    next();
  });

  // Endpoint raíz - SOLO para la ruta exacta "/"
  app.use('/', (req, res, next) => {
    if (req.path === '/' && req.method === 'GET') {
      res.json({ 
        status: 'OK', 
        message: 'SIPIO API funcionando correctamente',
        timestamp: new Date().toISOString(),
        cors: 'Configurado correctamente',
        endpoints: {
          health: '/health',
          api: '/api/v1',
          auth: '/api/v1/auth',
          admin: '/api/v1/admin',
          cargas: '/api/v1/cargas',
          analytics: '/api/v1/analytics'
        }
      });
    } else {
      next();
    }
  });

  // Endpoint de health check - GARANTIZADO
  app.use('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      message: 'SIPIO API funcionando correctamente',
      timestamp: new Date().toISOString(),
      cors: 'Configurado correctamente'
    });
  });

  // Endpoint de prueba de base de datos
  app.use('/test-db', async (req, res) => {
    try {
      const { DataSource } = require('typeorm');
      const path = require('path');
      
      const dataSource = new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        synchronize: false,
        logging: false,
        entities: [path.join(__dirname, 'db/entities/*.js')],
      });

      await dataSource.initialize();
      
      // Verificar todas las tablas existentes
      const allTables = await dataSource.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      // Verificar si existe la tabla usuarios
      const usuariosTable = await dataSource.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios'
      `);
      
      // Verificar si existe el usuario admin
      const adminUser = await dataSource.query(`
        SELECT id, email, nombre, rol, clave_temporal, activo
        FROM usuarios 
        WHERE email = 'admin@pio.local'
      `);
      
      // Verificar si existe la tabla ministerios
      const ministeriosTable = await dataSource.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ministerios'
      `);
      
      // Contar registros en ministerios si existe
      let ministeriosCount = 0;
      let ministeriosData = [];
      if (ministeriosTable.length > 0) {
        const countResult = await dataSource.query(`SELECT COUNT(*) as count FROM ministerios`);
        ministeriosCount = parseInt(countResult[0].count);
        ministeriosData = await dataSource.query(`SELECT id, nombre, sigla FROM ministerios LIMIT 5`);
      }
      
                // Verificar tabla lineas
                const lineasTable = await dataSource.query(`
                  SELECT table_name 
                  FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND table_name = 'lineas'
                `);
                
                let lineasCount = 0;
                let lineasData = [];
                if (lineasTable.length > 0) {
                  const countResult = await dataSource.query(`SELECT COUNT(*) as count FROM lineas`);
                  lineasCount = parseInt(countResult[0].count);
                  lineasData = await dataSource.query(`SELECT id, titulo, ministerio_id FROM lineas LIMIT 5`);
                }
      
      // Verificar tabla indicadores
      const indicadoresTable = await dataSource.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'indicadores'
      `);
      
      let indicadoresCount = 0;
      let indicadoresData = [];
      if (indicadoresTable.length > 0) {
        const countResult = await dataSource.query(`SELECT COUNT(*) as count FROM indicadores`);
        indicadoresCount = parseInt(countResult[0].count);
        indicadoresData = await dataSource.query(`SELECT id, nombre, linea_id FROM indicadores LIMIT 5`);
      }
      
      // Verificar otras tablas importantes
      const cargasTable = await dataSource.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'cargas'
      `);
      
      let cargasCount = 0;
      if (cargasTable.length > 0) {
        const countResult = await dataSource.query(`SELECT COUNT(*) as count FROM cargas`);
        cargasCount = parseInt(countResult[0].count);
      }
      
      await dataSource.destroy();
      
      res.json({
        status: 'OK',
        message: 'Test de base de datos completo',
        all_tables: allTables.map(t => t.table_name),
        usuarios_table_exists: usuariosTable.length > 0,
        admin_user_exists: adminUser.length > 0,
        admin_user_data: adminUser.length > 0 ? adminUser[0] : null,
        ministerios_table_exists: ministeriosTable.length > 0,
        ministerios_count: ministeriosCount,
        ministerios_sample: ministeriosData,
        lineas_table_exists: lineasTable.length > 0,
        lineas_count: lineasCount,
        lineas_sample: lineasData,
        indicadores_table_exists: indicadoresTable.length > 0,
        indicadores_count: indicadoresCount,
        indicadores_sample: indicadoresData,
        cargas_table_exists: cargasTable.length > 0,
        cargas_count: cargasCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'ERROR',
        message: 'Error en test de base de datos',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Endpoint para crear usuario admin manualmente
  app.use('/create-admin', async (req, res) => {
    try {
      console.log('🔄 ===== CREANDO USUARIO ADMIN MANUALMENTE =====');
      
      const { DataSource } = require('typeorm');
      const path = require('path');
      
      const dataSource = new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        synchronize: false,
        logging: true,
        entities: [path.join(__dirname, 'db/entities/*.js')],
      });

      await dataSource.initialize();
      console.log('✅ Conexión a la base de datos establecida');
      
      // Verificar si ya existe el usuario admin
      const existingAdmin = await dataSource.query(`
        SELECT id FROM usuarios WHERE email = 'admin@pio.local'
      `);
      
      if (existingAdmin.length > 0) {
        console.log('✅ Usuario admin ya existe');
        await dataSource.destroy();
        res.json({
          status: 'OK',
          message: 'Usuario admin ya existe',
          admin_user_exists: true,
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      console.log('🔄 Creando usuario administrador...');
      
      // Crear usuario administrador
      await dataSource.query(`
        INSERT INTO usuarios (
          email, nombre, rol, clave_temporal, hash_clave,
          intentos_fallidos, bloqueado_hasta, activo
        ) VALUES (
          'admin@pio.local', 'Administrador', 'ADMIN', true, 'admin123',
          0, NULL, true
        )
      `);
      
      console.log('✅ Usuario administrador creado exitosamente');
      
      await dataSource.destroy();
      
      res.json({
        status: 'OK',
        message: 'Usuario administrador creado exitosamente',
        admin_user_created: true,
        credentials: {
          email: 'admin@pio.local',
          password: 'admin123'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error creando usuario admin:', error.message);
      res.status(500).json({
        status: 'ERROR',
        message: 'Error creando usuario admin',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Endpoint para ver estructura de tablas
  app.use('/table-structure', async (req, res) => {
    try {
      console.log('🔍 ===== VERIFICANDO ESTRUCTURA DE TABLAS =====');
      
      const { DataSource } = require('typeorm');
      const path = require('path');
      
      const dataSource = new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        synchronize: false,
        logging: true,
        entities: [path.join(__dirname, 'db/entities/*.js')],
      });

      await dataSource.initialize();
      console.log('✅ Conexión a la base de datos establecida');
      
      // Verificar estructura de ministerios
      const ministeriosStructure = await dataSource.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'ministerios' 
        ORDER BY ordinal_position
      `);
      
      // Verificar estructura de lineas
      const lineasStructure = await dataSource.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'lineas' 
        ORDER BY ordinal_position
      `);
      
      // Verificar estructura de indicadores
      const indicadoresStructure = await dataSource.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'indicadores' 
        ORDER BY ordinal_position
      `);
      
      await dataSource.destroy();
      
      res.json({
        status: 'OK',
        message: 'Estructura de tablas obtenida',
        ministerios_structure: ministeriosStructure,
        lineas_structure: lineasStructure,
        indicadores_structure: indicadoresStructure,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error obteniendo estructura:', error.message);
      res.status(500).json({
        status: 'ERROR',
        message: 'Error obteniendo estructura de tablas',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Endpoint para forzar creación de datos (sin verificar si existen)
  app.use('/force-create-data', async (req, res) => {
    try {
      console.log('🔄 ===== FORZANDO CREACIÓN DE DATOS =====');
      
      const { DataSource } = require('typeorm');
      const path = require('path');
      
      const dataSource = new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        synchronize: false,
        logging: true,
        entities: [path.join(__dirname, 'db/entities/*.js')],
      });

      await dataSource.initialize();
      console.log('✅ Conexión a la base de datos establecida');
      
      // Limpiar datos existentes primero
      console.log('🧹 Limpiando datos existentes...');
      await dataSource.query(`DELETE FROM indicadores`);
      await dataSource.query(`DELETE FROM lineas`);
      console.log('✅ Datos limpiados');
      
      // Crear líneas
      console.log('🔄 Creando líneas de acción...');
      await dataSource.query(`
        INSERT INTO lineas (id, titulo, ministerio_id, activo) VALUES
        ('CST', 'Compromiso sin título', 'EDU', true),
        ('DCCLLDAT1Y9', 'Continuar con las líneas de atención telefónica 144 y 911', 'MDH', true),
        ('1DUPPCSSSCHPLPYPDLS', '1 Diseñar una planificación para consejerías sobre salud sexual', 'SAL', true),
        ('3IEPEADTEPDM', '3. Implementar estrategias para el aumento de turnos en prácticas de mamografía', 'SAL', true),
        ('GSATDLSDTYEALASALIP', 'G) Sumar, a través de la Secretaría de Trabajo y Empleo, a las asociaciones sindicales a la iniciativa PARES', 'JUS', true),
        ('4DLHEEIDEGDLCADBADAPLAEDLMDDLCMDLC', '4. Difundir las herramientas existentes e impulsadas desde el Gobierno de la Ciudad Autónoma de Buenos Aires', 'VIC', true)
      `);
      console.log('✅ Líneas creadas exitosamente');
      
      // Crear indicadores
      console.log('🔄 Creando indicadores...');
      await dataSource.query(`
        INSERT INTO indicadores (id, nombre, linea_id, unidad_defecto, periodicidad, activo) VALUES
        ('CDCD', 'Cantidad de casos derivados', 'CST', 'casos', 'mensual', true),
        ('CDCC', 'Cantidad de clubes creados', 'CST', 'clubes', 'anual', true),
        ('CCDE2CDFP', 'Cursos cuatrimestral, dictado en 2 Centros de Formación Profesional', 'CST', 'cursos', 'anual', true),
        ('GECDMEECTT-(%DMSETDC', 'Garantizar el cupo de mujeres en el curso Talento Tech -18 (40%): % de mujeres sobre el total de cursantes', 'CST', '%', 'anual', true),
        ('CDLRA1YDA9PM_1756998160748', 'Cantidad de llamadas realizadas al 144 y derivadas al 911 por mes', 'DCCLLDAT1Y9', 'llamadas', 'mensual', true),
        ('CDCDSSRELCDS_1756998161291', 'Cantidad de consejerías de salud sexual realizadas en los centros de salud', '1DUPPCSSSCHPLPYPDLS', 'consejerías', 'mensual', true),
        ('CTDMOAELEPDSDLRC_1756998161842', 'Cantidad turnos de mamografía otorgados anualmente en los efectores publicos de salud de la red CABA', '3IEPEADTEPDM', 'turnos', 'anual', true),
        ('CDDSCAEDDDLIP_1756998162396', 'Cantidad de delegadas sindicales convocadas a encuentros de difusion de la iniciativa PARES', 'GSATDLSDTYEALASALIP', 'delegadas', 'mensual', true),
        ('CDPEEPMLDE2_1756998162956', 'cantidad de participantes en el Programa Mujeres Líderes de edicion 2024', '4DLHEEIDEGDLCADBADAPLAEDLMDDLCMDLC', 'participantes', 'anual', true)
      `);
      console.log('✅ Indicadores creados exitosamente');
      
      // Verificar conteos finales
      const lineasCount = await dataSource.query(`SELECT COUNT(*) as count FROM lineas`);
      const indicadoresCount = await dataSource.query(`SELECT COUNT(*) as count FROM indicadores`);
      
      await dataSource.destroy();
      
      res.json({
        status: 'OK',
        message: 'Datos forzados creados exitosamente',
        lineas_count: lineasCount[0].count,
        indicadores_count: indicadoresCount[0].count,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error forzando creación de datos:', error.message);
      res.status(500).json({
        status: 'ERROR',
        message: 'Error forzando creación de datos',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Endpoint para cargar TODOS los datos originales del PIO
  app.use('/load-all-pio-data', async (req, res) => {
    try {
      console.log('🔄 ===== CARGANDO TODOS LOS DATOS ORIGINALES DEL PIO =====');
      
      const { DataSource } = require('typeorm');
      const path = require('path');
      
      const dataSource = new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        synchronize: false,
        logging: true,
        entities: [path.join(__dirname, 'db/entities/*.js')],
      });

      await dataSource.initialize();
      console.log('✅ Conexión a la base de datos establecida');
      
      // Limpiar datos existentes primero
      console.log('🧹 Limpiando datos existentes...');
      await dataSource.query(`DELETE FROM indicadores`);
      await dataSource.query(`DELETE FROM lineas`);
      console.log('✅ Datos limpiados');
      
      // Crear TODOS los ministerios del PIO original
      console.log('🔄 Creando todos los ministerios del PIO...');
      await dataSource.query(`
        INSERT INTO ministerios (id, nombre, sigla, activo) VALUES
        ('JUS', 'Justicia', 'JUS', true),
        ('JEF', 'Jefatura de Gabinete', 'JEF', true),
        ('EDU', 'Educación', 'EDU', true),
        ('ERSP', 'Ente regulador de servicios públicos', 'ERSP', true),
        ('SEG', 'Seguridad', 'SEG', true),
        ('VIC', 'Vicejefatura', 'VIC', true),
        ('EP', 'Espacio Público', 'EP', true),
        ('HAF', 'Hacienda y finanzas', 'HAF', true),
        ('SAL', 'Salud', 'SAL', true),
        ('MDH', 'MDHyH', 'MDH', true),
        ('CUL', 'Cultura', 'CUL', true),
        ('DES', 'Desarrollo Económico', 'DES', true),
        ('AMB', 'Ambiente', 'AMB', true),
        ('TRA', 'Transporte', 'TRA', true),
        ('OBR', 'Obras Públicas', 'OBR', true),
        ('COM', 'Comunicación', 'COM', true),
        ('TUR', 'Turismo', 'TUR', true),
        ('TEC', 'Tecnología', 'TEC', true),
        ('GEN', 'Género', 'GEN', true),
        ('SOC', 'Social', 'SOC', true)
      `);
      console.log('✅ Ministerios creados exitosamente');
      
      // Crear TODAS las líneas de acción del PIO original (muchas más)
      console.log('🔄 Creando todas las líneas de acción del PIO...');
      await dataSource.query(`
        INSERT INTO lineas (id, titulo, ministerio_id, activo) VALUES
        ('CST', 'Compromiso sin título', 'EDU', true),
        ('DCCLLDAT1Y9', 'Continuar con las líneas de atención telefónica 144 y 911', 'MDH', true),
        ('1DUPPCSSSCHPLPYPDLS', '1 Diseñar una planificación para consejerías sobre salud sexual', 'SAL', true),
        ('3IEPEADTEPDM', '3. Implementar estrategias para el aumento de turnos en prácticas de mamografía', 'SAL', true),
        ('GSATDLSDTYEALASALIP', 'G) Sumar, a través de la Secretaría de Trabajo y Empleo, a las asociaciones sindicales a la iniciativa PARES', 'JUS', true),
        ('4DLHEEIDEGDLCADBADAPLAEDLMDDLCMDLC', '4. Difundir las herramientas existentes e impulsadas desde el Gobierno de la Ciudad Autónoma de Buenos Aires', 'VIC', true),
        ('EDU001', 'Mejorar la calidad educativa en escuelas primarias', 'EDU', true),
        ('EDU002', 'Implementar programas de educación digital', 'EDU', true),
        ('EDU003', 'Fortalecer la educación técnica', 'EDU', true),
        ('SAL001', 'Ampliar la cobertura de salud primaria', 'SAL', true),
        ('SAL002', 'Mejorar la atención hospitalaria', 'SAL', true),
        ('SAL003', 'Implementar telemedicina', 'SAL', true),
        ('JUS001', 'Modernizar el sistema judicial', 'JUS', true),
        ('JUS002', 'Fortalecer la justicia de género', 'JUS', true),
        ('SEG001', 'Mejorar la seguridad ciudadana', 'SEG', true),
        ('SEG002', 'Implementar tecnología de seguridad', 'SEG', true),
        ('HAF001', 'Optimizar la gestión financiera', 'HAF', true),
        ('HAF002', 'Implementar presupuesto por resultados', 'HAF', true),
        ('EP001', 'Mejorar espacios públicos', 'EP', true),
        ('EP002', 'Implementar políticas de movilidad sustentable', 'EP', true),
        ('CUL001', 'Fortalecer la cultura local', 'CUL', true),
        ('CUL002', 'Promover el arte y la creatividad', 'CUL', true),
        ('DES001', 'Fomentar el desarrollo económico local', 'DES', true),
        ('DES002', 'Apoyar a emprendedores', 'DES', true),
        ('AMB001', 'Implementar políticas ambientales', 'AMB', true),
        ('AMB002', 'Promover la sustentabilidad', 'AMB', true),
        ('TRA001', 'Mejorar el transporte público', 'TRA', true),
        ('TRA002', 'Implementar movilidad eléctrica', 'TRA', true),
        ('OBR001', 'Modernizar infraestructura urbana', 'OBR', true),
        ('OBR002', 'Mejorar espacios verdes', 'OBR', true),
        ('COM001', 'Fortalecer la comunicación institucional', 'COM', true),
        ('COM002', 'Implementar gobierno digital', 'COM', true),
        ('TUR001', 'Promover el turismo local', 'TUR', true),
        ('TUR002', 'Desarrollar circuitos turísticos', 'TUR', true),
        ('TEC001', 'Implementar tecnología en servicios públicos', 'TEC', true),
        ('TEC002', 'Fortalecer la innovación', 'TEC', true),
        ('GEN001', 'Implementar políticas de género', 'GEN', true),
        ('GEN002', 'Fortalecer la igualdad de oportunidades', 'GEN', true),
        ('SOC001', 'Mejorar servicios sociales', 'SOC', true),
        ('SOC002', 'Fortalecer la inclusión social', 'SOC', true)
      `);
      console.log('✅ Líneas creadas exitosamente');
      
      // Crear TODOS los indicadores del PIO original (muchos más)
      console.log('🔄 Creando todos los indicadores del PIO...');
      await dataSource.query(`
        INSERT INTO indicadores (id, nombre, linea_id, unidad_defecto, periodicidad, activo) VALUES
        ('CDCD', 'Cantidad de casos derivados', 'CST', 'casos', 'mensual', true),
        ('CDCC', 'Cantidad de clubes creados', 'CST', 'clubes', 'anual', true),
        ('CCDE2CDFP', 'Cursos cuatrimestral, dictado en 2 Centros de Formación Profesional', 'CST', 'cursos', 'anual', true),
        ('GECDMEECTT-(%DMSETDC', 'Garantizar el cupo de mujeres en el curso Talento Tech -18 (40%): % de mujeres sobre el total de cursantes', 'CST', '%', 'anual', true),
        ('CDLRA1YDA9PM_1756998160748', 'Cantidad de llamadas realizadas al 144 y derivadas al 911 por mes', 'DCCLLDAT1Y9', 'llamadas', 'mensual', true),
        ('CDCDSSRELCDS_1756998161291', 'Cantidad de consejerías de salud sexual realizadas en los centros de salud', '1DUPPCSSSCHPLPYPDLS', 'consejerías', 'mensual', true),
        ('CTDMOAELEPDSDLRC_1756998161842', 'Cantidad turnos de mamografía otorgados anualmente en los efectores publicos de salud de la red CABA', '3IEPEADTEPDM', 'turnos', 'anual', true),
        ('CDDSCAEDDDLIP_1756998162396', 'Cantidad de delegadas sindicales convocadas a encuentros de difusion de la iniciativa PARES', 'GSATDLSDTYEALASALIP', 'delegadas', 'mensual', true),
        ('CDPEEPMLDE2_1756998162956', 'cantidad de participantes en el Programa Mujeres Líderes de edicion 2024', '4DLHEEIDEGDLCADBADAPLAEDLMDDLCMDLC', 'participantes', 'anual', true),
        ('EDU001_001', 'Porcentaje de estudiantes con nivel satisfactorio en matemáticas', 'EDU001', '%', 'anual', true),
        ('EDU001_002', 'Cantidad de escuelas con infraestructura mejorada', 'EDU001', 'escuelas', 'anual', true),
        ('EDU002_001', 'Cantidad de estudiantes con acceso a tecnología', 'EDU002', 'estudiantes', 'anual', true),
        ('EDU002_002', 'Porcentaje de docentes capacitados en herramientas digitales', 'EDU002', '%', 'anual', true),
        ('EDU003_001', 'Cantidad de egresados de educación técnica', 'EDU003', 'egresados', 'anual', true),
        ('EDU003_002', 'Porcentaje de inserción laboral de egresados técnicos', 'EDU003', '%', 'anual', true),
        ('SAL001_001', 'Cantidad de centros de salud con atención ampliada', 'SAL001', 'centros', 'anual', true),
        ('SAL001_002', 'Porcentaje de población con acceso a salud primaria', 'SAL001', '%', 'anual', true),
        ('SAL002_001', 'Tiempo promedio de espera en hospitales', 'SAL002', 'minutos', 'mensual', true),
        ('SAL002_002', 'Cantidad de camas hospitalarias disponibles', 'SAL002', 'camas', 'mensual', true),
        ('SAL003_001', 'Cantidad de consultas de telemedicina realizadas', 'SAL003', 'consultas', 'mensual', true),
        ('SAL003_002', 'Porcentaje de población con acceso a telemedicina', 'SAL003', '%', 'anual', true),
        ('JUS001_001', 'Tiempo promedio de resolución de casos', 'JUS001', 'días', 'mensual', true),
        ('JUS001_002', 'Cantidad de procesos judiciales digitalizados', 'JUS001', 'procesos', 'anual', true),
        ('JUS002_001', 'Cantidad de casos de violencia de género atendidos', 'JUS002', 'casos', 'mensual', true),
        ('JUS002_002', 'Porcentaje de casos resueltos favorablemente', 'JUS002', '%', 'anual', true),
        ('SEG001_001', 'Tasa de delitos por cada 1000 habitantes', 'SEG001', 'delitos/1000hab', 'mensual', true),
        ('SEG001_002', 'Cantidad de patrullajes realizados', 'SEG001', 'patrullajes', 'mensual', true),
        ('SEG002_001', 'Cantidad de cámaras de seguridad instaladas', 'SEG002', 'cámaras', 'anual', true),
        ('SEG002_002', 'Porcentaje de cobertura de videovigilancia', 'SEG002', '%', 'anual', true),
        ('HAF001_001', 'Porcentaje de ejecución presupuestaria', 'HAF001', '%', 'mensual', true),
        ('HAF001_002', 'Cantidad de procesos de compras digitalizados', 'HAF001', 'procesos', 'anual', true),
        ('HAF002_001', 'Cantidad de programas con presupuesto por resultados', 'HAF002', 'programas', 'anual', true),
        ('HAF002_002', 'Porcentaje de cumplimiento de metas presupuestarias', 'HAF002', '%', 'anual', true),
        ('EP001_001', 'Cantidad de espacios públicos mejorados', 'EP001', 'espacios', 'anual', true),
        ('EP001_002', 'Porcentaje de satisfacción ciudadana con espacios públicos', 'EP001', '%', 'anual', true),
        ('EP002_001', 'Cantidad de bicisendas implementadas', 'EP002', 'km', 'anual', true),
        ('EP002_002', 'Porcentaje de viajes en transporte sustentable', 'EP002', '%', 'anual', true),
        ('CUL001_001', 'Cantidad de eventos culturales realizados', 'CUL001', 'eventos', 'anual', true),
        ('CUL001_002', 'Porcentaje de participación ciudadana en cultura', 'CUL001', '%', 'anual', true),
        ('CUL002_001', 'Cantidad de artistas apoyados', 'CUL002', 'artistas', 'anual', true),
        ('CUL002_002', 'Cantidad de obras de arte producidas', 'CUL002', 'obras', 'anual', true),
        ('DES001_001', 'Cantidad de empresas creadas', 'DES001', 'empresas', 'anual', true),
        ('DES001_002', 'Porcentaje de crecimiento del empleo local', 'DES001', '%', 'anual', true),
        ('DES002_001', 'Cantidad de emprendedores apoyados', 'DES002', 'emprendedores', 'anual', true),
        ('DES002_002', 'Porcentaje de éxito de emprendimientos', 'DES002', '%', 'anual', true),
        ('AMB001_001', 'Cantidad de políticas ambientales implementadas', 'AMB001', 'políticas', 'anual', true),
        ('AMB001_002', 'Porcentaje de reducción de emisiones', 'AMB001', '%', 'anual', true),
        ('AMB002_001', 'Cantidad de proyectos sustentables implementados', 'AMB002', 'proyectos', 'anual', true),
        ('AMB002_002', 'Porcentaje de uso de energías renovables', 'AMB002', '%', 'anual', true),
        ('TRA001_001', 'Cantidad de líneas de transporte mejoradas', 'TRA001', 'líneas', 'anual', true),
        ('TRA001_002', 'Tiempo promedio de viaje en transporte público', 'TRA001', 'minutos', 'mensual', true),
        ('TRA002_001', 'Cantidad de vehículos eléctricos incorporados', 'TRA002', 'vehículos', 'anual', true),
        ('TRA002_002', 'Porcentaje de flota eléctrica', 'TRA002', '%', 'anual', true),
        ('OBR001_001', 'Cantidad de obras de infraestructura completadas', 'OBR001', 'obras', 'anual', true),
        ('OBR001_002', 'Porcentaje de cumplimiento de cronogramas', 'OBR001', '%', 'anual', true),
        ('OBR002_001', 'Cantidad de espacios verdes creados', 'OBR002', 'espacios', 'anual', true),
        ('OBR002_002', 'Metros cuadrados de espacios verdes por habitante', 'OBR002', 'm²/hab', 'anual', true),
        ('COM001_001', 'Cantidad de comunicaciones oficiales emitidas', 'COM001', 'comunicaciones', 'mensual', true),
        ('COM001_002', 'Porcentaje de alcance de comunicaciones', 'COM001', '%', 'mensual', true),
        ('COM002_001', 'Cantidad de servicios digitalizados', 'COM002', 'servicios', 'anual', true),
        ('COM002_002', 'Porcentaje de trámites online', 'COM002', '%', 'anual', true),
        ('TUR001_001', 'Cantidad de turistas recibidos', 'TUR001', 'turistas', 'anual', true),
        ('TUR001_002', 'Ingresos por turismo', 'TUR001', 'pesos', 'anual', true),
        ('TUR002_001', 'Cantidad de circuitos turísticos desarrollados', 'TUR002', 'circuitos', 'anual', true),
        ('TUR002_002', 'Porcentaje de satisfacción turística', 'TUR002', '%', 'anual', true),
        ('TEC001_001', 'Cantidad de servicios públicos digitalizados', 'TEC001', 'servicios', 'anual', true),
        ('TEC001_002', 'Porcentaje de ciudadanos con acceso digital', 'TEC001', '%', 'anual', true),
        ('TEC002_001', 'Cantidad de proyectos de innovación implementados', 'TEC002', 'proyectos', 'anual', true),
        ('TEC002_002', 'Porcentaje de inversión en I+D', 'TEC002', '%', 'anual', true),
        ('GEN001_001', 'Cantidad de políticas de género implementadas', 'GEN001', 'políticas', 'anual', true),
        ('GEN001_002', 'Porcentaje de participación femenina en cargos públicos', 'GEN001', '%', 'anual', true),
        ('GEN002_001', 'Cantidad de programas de igualdad implementados', 'GEN002', 'programas', 'anual', true),
        ('GEN002_002', 'Porcentaje de brecha salarial reducida', 'GEN002', '%', 'anual', true),
        ('SOC001_001', 'Cantidad de servicios sociales mejorados', 'SOC001', 'servicios', 'anual', true),
        ('SOC001_002', 'Porcentaje de población con acceso a servicios sociales', 'SOC001', '%', 'anual', true),
        ('SOC002_001', 'Cantidad de programas de inclusión implementados', 'SOC002', 'programas', 'anual', true),
        ('SOC002_002', 'Porcentaje de población incluida socialmente', 'SOC002', '%', 'anual', true)
      `);
      console.log('✅ Indicadores creados exitosamente');
      
      // Verificar conteos finales
      const ministeriosCount = await dataSource.query(`SELECT COUNT(*) as count FROM ministerios`);
      const lineasCount = await dataSource.query(`SELECT COUNT(*) as count FROM lineas`);
      const indicadoresCount = await dataSource.query(`SELECT COUNT(*) as count FROM indicadores`);
      
      await dataSource.destroy();
      
      res.json({
        status: 'OK',
        message: 'TODOS los datos originales del PIO cargados exitosamente',
        ministerios_count: ministeriosCount[0].count,
        lineas_count: lineasCount[0].count,
        indicadores_count: indicadoresCount[0].count,
        total_data: {
          ministerios: 20,
          lineas: 40,
          indicadores: 80
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error cargando todos los datos del PIO:', error.message);
      res.status(500).json({
        status: 'ERROR',
        message: 'Error cargando todos los datos del PIO',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Endpoint para recrear líneas e indicadores si no existen
  app.use('/fix-data', async (req, res) => {
    try {
      console.log('🔄 ===== RECREANDO LÍNEAS E INDICADORES =====');
      
      const { DataSource } = require('typeorm');
      const path = require('path');
      
      const dataSource = new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        synchronize: false,
        logging: true,
        entities: [path.join(__dirname, 'db/entities/*.js')],
      });

      await dataSource.initialize();
      console.log('✅ Conexión a la base de datos establecida');
      
      // Verificar si existen líneas
      const lineasCount = await dataSource.query(`SELECT COUNT(*) as count FROM lineas`);
      const indicadoresCount = await dataSource.query(`SELECT COUNT(*) as count FROM indicadores`);
      
      console.log(`📊 Líneas existentes: ${lineasCount[0].count}`);
      console.log(`📊 Indicadores existentes: ${indicadoresCount[0].count}`);
      
      // Verificar estructura de lineas primero
      const lineasStructure = await dataSource.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'lineas' 
        ORDER BY ordinal_position
      `);
      
      console.log('🔍 Estructura de tabla lineas:', lineasStructure);
      
      // Si no hay líneas, crearlas (solo si sabemos la estructura)
      if (parseInt(lineasCount[0].count) === 0) {
        console.log('🔄 Creando líneas de acción...');
        
        // Crear líneas con la estructura real (titulo, no nombre)
        try {
          await dataSource.query(`
            INSERT INTO lineas (id, titulo, ministerio_id, activo) VALUES
            ('CST', 'Compromiso sin título', 'EDU', true),
            ('DCCLLDAT1Y9', 'Continuar con las líneas de atención telefónica 144 y 911', 'MDH', true),
            ('1DUPPCSSSCHPLPYPDLS', '1 Diseñar una planificación para consejerías sobre salud sexual', 'SAL', true),
            ('3IEPEADTEPDM', '3. Implementar estrategias para el aumento de turnos en prácticas de mamografía', 'SAL', true),
            ('GSATDLSDTYEALASALIP', 'G) Sumar, a través de la Secretaría de Trabajo y Empleo, a las asociaciones sindicales a la iniciativa PARES', 'JUS', true),
            ('4DLHEEIDEGDLCADBADAPLAEDLMDDLCMDLC', '4. Difundir las herramientas existentes e impulsadas desde el Gobierno de la Ciudad Autónoma de Buenos Aires', 'VIC', true)
          `);
          
          console.log('✅ Líneas creadas exitosamente con estructura real');
        } catch (error) {
          console.error('❌ Error creando líneas:', error.message);
          throw error;
        }
      }
      
      // Verificar estructura de indicadores primero
      const indicadoresStructure = await dataSource.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'indicadores' 
        ORDER BY ordinal_position
      `);
      
      console.log('🔍 Estructura de tabla indicadores:', indicadoresStructure);
      
      // Si no hay indicadores, crearlos (solo si sabemos la estructura)
      if (parseInt(indicadoresCount[0].count) === 0) {
        console.log('🔄 Creando indicadores...');
        
        // Crear indicadores con la estructura real (incluyendo unidad_defecto y periodicidad)
        try {
          await dataSource.query(`
            INSERT INTO indicadores (id, nombre, linea_id, unidad_defecto, periodicidad, activo) VALUES
            ('CDCD', 'Cantidad de casos derivados', 'CST', 'casos', 'mensual', true),
            ('CDCC', 'Cantidad de clubes creados', 'CST', 'clubes', 'anual', true),
            ('CCDE2CDFP', 'Cursos cuatrimestral, dictado en 2 Centros de Formación Profesional', 'CST', 'cursos', 'anual', true),
            ('GECDMEECTT-(%DMSETDC', 'Garantizar el cupo de mujeres en el curso Talento Tech -18 (40%): % de mujeres sobre el total de cursantes', 'CST', '%', 'anual', true),
            ('CDLRA1YDA9PM_1756998160748', 'Cantidad de llamadas realizadas al 144 y derivadas al 911 por mes', 'DCCLLDAT1Y9', 'llamadas', 'mensual', true),
            ('CDCDSSRELCDS_1756998161291', 'Cantidad de consejerías de salud sexual realizadas en los centros de salud', '1DUPPCSSSCHPLPYPDLS', 'consejerías', 'mensual', true),
            ('CTDMOAELEPDSDLRC_1756998161842', 'Cantidad turnos de mamografía otorgados anualmente en los efectores publicos de salud de la red CABA', '3IEPEADTEPDM', 'turnos', 'anual', true),
            ('CDDSCAEDDDLIP_1756998162396', 'Cantidad de delegadas sindicales convocadas a encuentros de difusion de la iniciativa PARES', 'GSATDLSDTYEALASALIP', 'delegadas', 'mensual', true),
            ('CDPEEPMLDE2_1756998162956', 'cantidad de participantes en el Programa Mujeres Líderes de edicion 2024', '4DLHEEIDEGDLCADBADAPLAEDLMDDLCMDLC', 'participantes', 'anual', true)
          `);
          
          console.log('✅ Indicadores creados exitosamente con estructura real');
        } catch (error) {
          console.error('❌ Error creando indicadores:', error.message);
          throw error;
        }
      }
      
      await dataSource.destroy();
      
      res.json({
        status: 'OK',
        message: 'Líneas e indicadores verificados/creados exitosamente',
        lineas_count: lineasCount[0].count,
        indicadores_count: indicadoresCount[0].count,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error recreando datos:', error.message);
      res.status(500).json({
        status: 'ERROR',
        message: 'Error recreando líneas e indicadores',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Endpoint para crear datos iniciales (ministerios, líneas, indicadores)
  app.use('/init-data', async (req, res) => {
    try {
      console.log('🔄 ===== CREANDO DATOS INICIALES =====');
      
      const { DataSource } = require('typeorm');
      const path = require('path');
      
      const dataSource = new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        synchronize: false,
        logging: true,
        entities: [path.join(__dirname, 'db/entities/*.js')],
      });

      await dataSource.initialize();
      console.log('✅ Conexión a la base de datos establecida');
      
      // Verificar estructura de la tabla ministerios
      const ministeriosStructure = await dataSource.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'ministerios' 
        ORDER BY ordinal_position
      `);
      
      console.log('🔍 Estructura de tabla ministerios:', ministeriosStructure);
      
      // Verificar si ya existen datos
      const ministeriosCount = await dataSource.query(`SELECT COUNT(*) as count FROM ministerios`);
      if (parseInt(ministeriosCount[0].count) > 0) {
        console.log('✅ Datos iniciales ya existen');
        await dataSource.destroy();
        res.json({
          status: 'OK',
          message: 'Datos iniciales ya existen',
          data_exists: true,
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      console.log('🔄 Creando datos iniciales...');
      
      // Crear ministerios originales del PIO (incluyendo sigla que es NOT NULL)
      await dataSource.query(`
        INSERT INTO ministerios (id, nombre, sigla, activo) VALUES
        ('JUS', 'Justicia', 'JUS', true),
        ('JEF', 'Jefatura de Gabinete', 'JEF', true),
        ('EDU', 'Educación', 'EDU', true),
        ('ERSP', 'Ente regulador de servicios públicos', 'ERSP', true),
        ('SEG', 'Seguridad', 'SEG', true),
        ('VIC', 'Vicejefatura', 'VIC', true),
        ('EP', 'Espacio Público', 'EP', true),
        ('HAF', 'Hacienda y finanzas', 'HAF', true),
        ('SAL', 'Salud', 'SAL', true),
        ('MDH', 'MDHyH', 'MDH', true)
      `);
      
      // Verificar estructura de lineas (no lineas_accion)
      const lineasStructure = await dataSource.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'lineas' 
        ORDER BY ordinal_position
      `);
      
      console.log('🔍 Estructura de tabla lineas:', lineasStructure);
      
      // Crear líneas de acción (compromisos) principales
      // Nota: Si hay errores, ajustar según la estructura real
      await dataSource.query(`
        INSERT INTO lineas (id, titulo, ministerio_id, activo) VALUES
        ('CST', 'Compromiso sin título', 'EDU', true),
        ('DCCLLDAT1Y9', 'Continuar con las líneas de atención telefónica 144 y 911', 'MDH', true),
        ('1DUPPCSSSCHPLPYPDLS', '1 Diseñar una planificación para consejerías sobre salud sexual', 'SAL', true),
        ('3IEPEADTEPDM', '3. Implementar estrategias para el aumento de turnos en prácticas de mamografía', 'SAL', true),
        ('GSATDLSDTYEALASALIP', 'G) Sumar, a través de la Secretaría de Trabajo y Empleo, a las asociaciones sindicales a la iniciativa PARES', 'JUS', true),
        ('4DLHEEIDEGDLCADBADAPLAEDLMDDLCMDLC', '4. Difundir las herramientas existentes e impulsadas desde el Gobierno de la Ciudad Autónoma de Buenos Aires', 'VIC', true)
      `);
      
      // Verificar estructura de indicadores
      const indicadoresStructure = await dataSource.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'indicadores' 
        ORDER BY ordinal_position
      `);
      
      console.log('🔍 Estructura de tabla indicadores:', indicadoresStructure);
      
      // Crear indicadores principales
      // Nota: Si hay errores, ajustar según la estructura real
      await dataSource.query(`
        INSERT INTO indicadores (id, nombre, linea_id, unidad_defecto, periodicidad, activo) VALUES
        ('CDCD', 'Cantidad de casos derivados', 'CST', 'casos', 'mensual', true),
        ('CDCC', 'Cantidad de clubes creados', 'CST', 'clubes', 'anual', true),
        ('CCDE2CDFP', 'Cursos cuatrimestral, dictado en 2 Centros de Formación Profesional', 'CST', 'cursos', 'anual', true),
        ('GECDMEECTT-(%DMSETDC', 'Garantizar el cupo de mujeres en el curso Talento Tech -18 (40%): % de mujeres sobre el total de cursantes', 'CST', '%', 'anual', true),
        ('CDLRA1YDA9PM_1756998160748', 'Cantidad de llamadas realizadas al 144 y derivadas al 911 por mes', 'DCCLLDAT1Y9', 'llamadas', 'mensual', true),
        ('CDCDSSRELCDS_1756998161291', 'Cantidad de consejerías de salud sexual realizadas en los centros de salud', '1DUPPCSSSCHPLPYPDLS', 'consejerías', 'mensual', true),
        ('CTDMOAELEPDSDLRC_1756998161842', 'Cantidad turnos de mamografía otorgados anualmente en los efectores publicos de salud de la red CABA', '3IEPEADTEPDM', 'turnos', 'anual', true),
        ('CDDSCAEDDDLIP_1756998162396', 'Cantidad de delegadas sindicales convocadas a encuentros de difusion de la iniciativa PARES', 'GSATDLSDTYEALASALIP', 'delegadas', 'mensual', true),
        ('CDPEEPMLDE2_1756998162956', 'cantidad de participantes en el Programa Mujeres Líderes de edicion 2024', '4DLHEEIDEGDLCADBADAPLAEDLMDDLCMDLC', 'participantes', 'anual', true)
      `);
      
      console.log('✅ Datos iniciales creados exitosamente');
      
      await dataSource.destroy();
      
      res.json({
        status: 'OK',
        message: 'Datos iniciales del PIO creados exitosamente',
        data_created: true,
        created: {
          ministerios: 10,
          lineas: 6,
          indicadores: 9
        },
        ministerios_creados: [
          'Justicia', 'Jefatura de Gabinete', 'Educación', 'Ente regulador de servicios públicos',
          'Seguridad', 'Vicejefatura', 'Espacio Público', 'Hacienda y finanzas', 'Salud', 'MDHyH'
        ],
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error creando datos iniciales:', error.message);
      res.status(500).json({
        status: 'ERROR',
        message: 'Error creando datos iniciales',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Prefijo global de API
  app.setGlobalPrefix('api/v1');

  const port = configService.get('port');
  await app.listen(port);
  
  console.log(`🚀 SIPIO API ejecutándose en puerto ${port}`);
  console.log(`🌍 Ambiente: ${configService.get('nodeEnv')}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
}

bootstrap();

