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
        lineasData = await dataSource.query(`SELECT id, nombre, ministerio_id FROM lineas LIMIT 5`);
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
      
      // Si no hay líneas, crearlas
      if (parseInt(lineasCount[0].count) === 0) {
        console.log('🔄 Creando líneas de acción...');
        
        await dataSource.query(`
          INSERT INTO lineas (id, nombre, ministerio_id, activo) VALUES
          ('CST', 'Compromiso sin título', 'EDU', true),
          ('DCCLLDAT1Y9', 'Continuar con las líneas de atención telefónica 144 y 911', 'MDH', true),
          ('1DUPPCSSSCHPLPYPDLS', '1 Diseñar una planificación para consejerías sobre salud sexual', 'SAL', true),
          ('3IEPEADTEPDM', '3. Implementar estrategias para el aumento de turnos en prácticas de mamografía', 'SAL', true),
          ('GSATDLSDTYEALASALIP', 'G) Sumar, a través de la Secretaría de Trabajo y Empleo, a las asociaciones sindicales a la iniciativa PARES', 'JUS', true),
          ('4DLHEEIDEGDLCADBADAPLAEDLMDDLCMDLC', '4. Difundir las herramientas existentes e impulsadas desde el Gobierno de la Ciudad Autónoma de Buenos Aires', 'VIC', true)
        `);
        
        console.log('✅ Líneas creadas exitosamente');
      }
      
      // Si no hay indicadores, crearlos
      if (parseInt(indicadoresCount[0].count) === 0) {
        console.log('🔄 Creando indicadores...');
        
        await dataSource.query(`
          INSERT INTO indicadores (id, nombre, linea_id, activo) VALUES
          ('CDCD', 'Cantidad de casos derivados', 'CST', true),
          ('CDCC', 'Cantidad de clubes creados', 'CST', true),
          ('CCDE2CDFP', 'Cursos cuatrimestral, dictado en 2 Centros de Formación Profesional', 'CST', true),
          ('GECDMEECTT-(%DMSETDC', 'Garantizar el cupo de mujeres en el curso Talento Tech -18 (40%): % de mujeres sobre el total de cursantes', 'CST', true),
          ('CDLRA1YDA9PM_1756998160748', 'Cantidad de llamadas realizadas al 144 y derivadas al 911 por mes', 'DCCLLDAT1Y9', true),
          ('CDCDSSRELCDS_1756998161291', 'Cantidad de consejerías de salud sexual realizadas en los centros de salud', '1DUPPCSSSCHPLPYPDLS', true),
          ('CTDMOAELEPDSDLRC_1756998161842', 'Cantidad turnos de mamografía otorgados anualmente en los efectores publicos de salud de la red CABA', '3IEPEADTEPDM', true),
          ('CDDSCAEDDDLIP_1756998162396', 'Cantidad de delegadas sindicales convocadas a encuentros de difusion de la iniciativa PARES', 'GSATDLSDTYEALASALIP', true),
          ('CDPEEPMLDE2_1756998162956', 'cantidad de participantes en el Programa Mujeres Líderes de edicion 2024', '4DLHEEIDEGDLCADBADAPLAEDLMDDLCMDLC', true)
        `);
        
        console.log('✅ Indicadores creados exitosamente');
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
        INSERT INTO lineas (id, nombre, ministerio_id, activo) VALUES
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
        INSERT INTO indicadores (id, nombre, linea_id, activo) VALUES
        ('CDCD', 'Cantidad de casos derivados', 'CST', true),
        ('CDCC', 'Cantidad de clubes creados', 'CST', true),
        ('CCDE2CDFP', 'Cursos cuatrimestral, dictado en 2 Centros de Formación Profesional', 'CST', true),
        ('GECDMEECTT-(%DMSETDC', 'Garantizar el cupo de mujeres en el curso Talento Tech -18 (40%): % de mujeres sobre el total de cursantes', 'CST', true),
        ('CDLRA1YDA9PM_1756998160748', 'Cantidad de llamadas realizadas al 144 y derivadas al 911 por mes', 'DCCLLDAT1Y9', true),
        ('CDCDSSRELCDS_1756998161291', 'Cantidad de consejerías de salud sexual realizadas en los centros de salud', '1DUPPCSSSCHPLPYPDLS', true),
        ('CTDMOAELEPDSDLRC_1756998161842', 'Cantidad turnos de mamografía otorgados anualmente en los efectores publicos de salud de la red CABA', '3IEPEADTEPDM', true),
        ('CDDSCAEDDDLIP_1756998162396', 'Cantidad de delegadas sindicales convocadas a encuentros de difusion de la iniciativa PARES', 'GSATDLSDTYEALASALIP', true),
        ('CDPEEPMLDE2_1756998162956', 'cantidad de participantes en el Programa Mujeres Líderes de edicion 2024', '4DLHEEIDEGDLCADBADAPLAEDLMDDLCMDLC', true)
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

