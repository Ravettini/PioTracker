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
      logging: true,
      entities: [path.join(__dirname, 'db/entities/*.js')],
      migrations: [path.join(__dirname, 'db/migrations/*.js')],
      migrationsTableName: 'migrations',
      migrationsRun: false,
    });

    console.log('🔄 Inicializando conexión a la base de datos...');
    await dataSource.initialize();
    console.log('✅ Conexión a la base de datos establecida exitosamente');
    
    console.log('🔄 Ejecutando migraciones...');
    
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
    
    const existingAdmin = await dataSource.query(`
      SELECT id FROM usuarios WHERE email = 'admin@pio.local'
    `);

    if (existingAdmin.length > 0) {
      console.log('✅ Usuario admin ya existe');
    } else {
      console.log('🔄 Creando usuario administrador...');
      
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
  
  // CORS - Configuración simplificada y robusta
  console.log('🌐 Configurando CORS...');
  
  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (ej: Postman, mobile apps)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:3000',
        'https://pio-tracker-frontend.vercel.app',
        'https://pio-tracker-frontend-n599d446t-nachos-projects-e0e5a719.vercel.app',
        'https://pio-tracker-frontend-jgncbqqhy-nachos-projects-e0e5a719.vercel.app'
      ];
      
      // Permitir cualquier subdominio de vercel.app que contenga pio-tracker-frontend
      if (origin.includes('pio-tracker-frontend') && origin.includes('vercel.app')) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      console.log(`❌ CORS bloqueado para origen: ${origin}`);
      return callback(new Error('No permitido por CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-CSRF-Token', 
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 200
  });

  console.log('✅ CORS configurado exitosamente');

  // Middleware
  app.use(cookieParser());
  
  // Validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // Endpoint OPTIONS global
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

  // Endpoint raíz
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

  // Endpoint de health check
  app.use('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      message: 'SIPIO API funcionando correctamente',
      timestamp: new Date().toISOString(),
      cors: 'Configurado correctamente'
    });
  });

  // Endpoint de prueba simple
  app.use('/test', (req, res) => {
    res.json({ 
      status: 'OK', 
      message: 'Test endpoint funcionando',
      timestamp: new Date().toISOString()
    });
  });

  // Endpoint para cargar TODOS los datos reales del PIO
  app.use('/load-complete-pio-data', async (req, res) => {
    try {
      console.log('🔄 ===== CARGANDO DATOS COMPLETOS DEL PIO =====');
      
      const { DataSource } = require('typeorm');
      const path = require('path');
      const fs = require('fs');
      
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
      
      // Limpiar datos existentes
      console.log('🧹 Limpiando datos existentes...');
      await dataSource.query('DELETE FROM cargas');
      await dataSource.query('DELETE FROM indicadores');
      await dataSource.query('DELETE FROM lineas');
      console.log('✅ Datos limpiados');
      
      // Cargar ministerios (ya existen, solo verificar)
      const ministeriosExistentes = await dataSource.query('SELECT COUNT(*) FROM ministerios');
      console.log(`📊 Ministerios existentes: ${ministeriosExistentes[0].count}`);
      
      // Crear mapeo de nombres de ministerios a IDs
      console.log('🔄 Creando mapeo de ministerios...');
      const ministerios = await dataSource.query('SELECT id, nombre FROM ministerios');
      const ministerioMap = new Map();
      
      for (const ministerio of ministerios) {
        ministerioMap.set(ministerio.nombre.toLowerCase(), ministerio.id);
        ministerioMap.set(ministerio.id.toLowerCase(), ministerio.id);
        
        if (ministerio.nombre.includes('Justicia')) {
          ministerioMap.set('justicia', ministerio.id);
        }
        if (ministerio.nombre.includes('Jefatura')) {
          ministerioMap.set('jefatura de gabinete', ministerio.id);
        }
        if (ministerio.nombre.includes('Educación') || ministerio.nombre.includes('Educacion')) {
          ministerioMap.set('educacion', ministerio.id);
          ministerioMap.set('educación', ministerio.id);
        }
        if (ministerio.nombre.includes('Ente regulador')) {
          ministerioMap.set('ente regulador de servicios púb', ministerio.id);
        }
        if (ministerio.nombre.includes('Seguridad')) {
          ministerioMap.set('seguridad', ministerio.id);
        }
        if (ministerio.nombre.includes('Vicejefatura')) {
          ministerioMap.set('vicejefatura', ministerio.id);
        }
        if (ministerio.nombre.includes('Espacio Público') || ministerio.nombre.includes('Espacio Publico')) {
          ministerioMap.set('espacio publico', ministerio.id);
        }
        if (ministerio.nombre.includes('Hacienda')) {
          ministerioMap.set('hacienda y finanzas', ministerio.id);
        }
        if (ministerio.nombre.includes('Salud')) {
          ministerioMap.set('salud', ministerio.id);
        }
        if (ministerio.nombre.includes('MDHyH') || ministerio.nombre.includes('MDH') || ministerio.nombre.includes('Desarrollo Humano')) {
          ministerioMap.set('mdhyh', ministerio.id);
        }
      }
      
      console.log(`📊 Mapeo creado con ${ministerioMap.size} entradas`);
      
      // Cargar datos desde analisis-indicadores.json
      console.log('🔄 Cargando compromisos desde analisis-indicadores.json...');
      const analisisPath = path.join(__dirname, '../analisis-indicadores.json');
      
      if (!fs.existsSync(analisisPath)) {
        throw new Error('Archivo analisis-indicadores.json no encontrado');
      }
      
      const analisisData = JSON.parse(fs.readFileSync(analisisPath, 'utf8'));
      console.log(`📊 Estructura del archivo:`, Object.keys(analisisData));
      
      // Procesar compromisos únicos
      const compromisosUnicos = new Map();
      const indicadoresData = analisisData.indicadores || [];
      
      console.log(`📊 Procesando ${indicadoresData.length} indicadores...`);
      
      // Agrupar indicadores por compromiso para crear líneas únicas
      for (const indicador of indicadoresData) {
        const claveCompromiso = `${indicador.ministerio}|${indicador.compromiso}`;
        if (!compromisosUnicos.has(claveCompromiso)) {
          compromisosUnicos.set(claveCompromiso, {
            ministerio: indicador.ministerio,
            compromiso: indicador.compromiso,
            indicadores: []
          });
        }
        compromisosUnicos.get(claveCompromiso).indicadores.push(indicador);
      }
      
      const compromisos = Array.from(compromisosUnicos.values());
      console.log(`📊 Procesando ${compromisos.length} compromisos únicos...`);
      
      let lineasCreadas = 0;
      let indicadoresCreados = 0;
      
      // PRIMERA PASADA: Crear todas las líneas primero
      console.log('🔄 Primera pasada: Creando todas las líneas...');
      for (let i = 0; i < compromisos.length; i++) {
        const compromisoData = compromisos[i];
        try {
          const nombreMinisterio = compromisoData.ministerio ? compromisoData.ministerio.toLowerCase().trim() : '';
          const ministerioId = ministerioMap.get(nombreMinisterio);
          
          if (!ministerioId) {
            console.log(`⚠️ No se encontró ministerio para: "${compromisoData.ministerio}" - saltando línea`);
            continue;
          }
          
          const titulo = compromisoData.compromiso;
          const lineaId = `LINEA_${i + 1}`;
          
          console.log(`📝 Creando línea ${lineaId} para ministerio ${ministerioId}: ${titulo.substring(0, 50)}...`);
          
          await dataSource.query(`
            INSERT INTO lineas (id, titulo, ministerio_id, activo)
            VALUES ($1, $2, $3, true)
            ON CONFLICT (id) DO UPDATE SET
              titulo = EXCLUDED.titulo,
              ministerio_id = EXCLUDED.ministerio_id
          `, [lineaId, titulo, ministerioId]);
          
          lineasCreadas++;
          console.log(`✅ Línea ${lineaId} creada exitosamente`);
          
        } catch (error) {
          console.error(`❌ Error creando línea ${compromisoData.compromiso || `LINEA_${i + 1}`}:`, error.message);
        }
      }
      
      console.log(`✅ ${lineasCreadas} líneas creadas`);
      
      // Verificar que las líneas se crearon correctamente
      const lineasVerificacion = await dataSource.query('SELECT COUNT(*) as count FROM lineas');
      console.log(`🔍 Verificación: ${lineasVerificacion[0].count} líneas en la base de datos`);
      
      // SEGUNDA PASADA: Crear todos los indicadores
      console.log('🔄 Segunda pasada: Creando todos los indicadores...');
      for (let i = 0; i < compromisos.length; i++) {
        const compromisoData = compromisos[i];
        try {
          const nombreMinisterio = compromisoData.ministerio ? compromisoData.ministerio.toLowerCase().trim() : '';
          const ministerioId = ministerioMap.get(nombreMinisterio);
          
          if (!ministerioId) {
            console.log(`⚠️ No se encontró ministerio para: "${compromisoData.ministerio}" - saltando indicadores`);
            continue;
          }
          
          const lineaId = `LINEA_${i + 1}`;
          
          console.log(`📊 Creando indicadores para línea ${lineaId}...`);
          
          if (compromisoData.indicadores && compromisoData.indicadores.length > 0) {
            for (const indicadorData of compromisoData.indicadores) {
              const indicadorId = `IND_${lineaId}_${indicadoresCreados + 1}`;
              const nombre = indicadorData.nombre; // Usar el campo 'nombre' del indicador
              const unidad = indicadorData.tipo === 'porcentaje' ? 'porcentaje' : 'unidades';
              const periodicidad = 'mensual';
              
              console.log(`📝 Creando indicador: "${nombre}"`);
              
              await dataSource.query(`
                INSERT INTO indicadores (id, nombre, linea_id, unidad_defecto, periodicidad, activo)
                VALUES ($1, $2, $3, $4, $5, true)
                ON CONFLICT (id) DO UPDATE SET
                  nombre = EXCLUDED.nombre,
                  linea_id = EXCLUDED.linea_id,
                  unidad_defecto = EXCLUDED.unidad_defecto,
                  periodicidad = EXCLUDED.periodicidad
              `, [indicadorId, nombre, lineaId, unidad, periodicidad]);
              
              indicadoresCreados++;
              console.log(`✅ Indicador ${indicadorId} creado exitosamente`);
            }
          } else {
            const indicadorId = `IND_${lineaId}_1`;
            const nombre = `Indicador de seguimiento - ${compromisoData.compromiso}`;
            
            console.log(`📝 Creando indicador genérico ${indicadorId} para línea ${lineaId}`);
            
            await dataSource.query(`
              INSERT INTO indicadores (id, nombre, linea_id, unidad_defecto, periodicidad, activo)
              VALUES ($1, $2, $3, 'unidades', 'mensual', true)
              ON CONFLICT (id) DO UPDATE SET
                nombre = EXCLUDED.nombre,
                linea_id = EXCLUDED.linea_id
            `, [indicadorId, nombre, lineaId]);
            
            indicadoresCreados++;
            console.log(`✅ Indicador ${indicadorId} creado exitosamente`);
          }
          
        } catch (error) {
          console.error(`❌ Error creando indicadores para ${compromisoData.compromiso || `LINEA_${i + 1}`}:`, error.message);
        }
      }
      
      // Cargar datos desde reporte-indicadores-creados.json si existe
      console.log('🔄 Cargando indicadores adicionales desde reporte-indicadores-creados.json...');
      const reportePath = path.join(__dirname, '../reporte-indicadores-creados.json');
      
      if (fs.existsSync(reportePath)) {
        const reporteData = JSON.parse(fs.readFileSync(reportePath, 'utf8'));
        console.log(`📊 Procesando ${reporteData.resultados.length} indicadores adicionales...`);
        
        for (const resultado of reporteData.resultados) {
          if (resultado.resultado.success && resultado.resultado.data.success) {
            const indicador = resultado.resultado.data.data;
            const indicadorOriginal = resultado.indicador;
            
            const lineaExiste = await dataSource.query(`
              SELECT id FROM lineas WHERE id = $1
            `, [indicador.lineaId]);
            
            let lineaIdFinal = indicador.lineaId;
            
            if (lineaExiste.length === 0) {
              console.log(`⚠️ Línea ${indicador.lineaId} no existe, buscando línea alternativa...`);
              
              const ministerioId = indicadorOriginal.ministerioId;
              const lineasDelMinisterio = await dataSource.query(`
                SELECT id FROM lineas WHERE ministerio_id = $1 LIMIT 1
              `, [ministerioId]);
              
              if (lineasDelMinisterio.length > 0) {
                lineaIdFinal = lineasDelMinisterio[0].id;
                console.log(`✅ Usando línea alternativa ${lineaIdFinal} del ministerio ${ministerioId}`);
              } else {
                console.log(`❌ No se encontró línea para ministerio ${ministerioId}, saltando indicador ${indicador.id}`);
                continue;
              }
            }
            
            await dataSource.query(`
              INSERT INTO indicadores (id, nombre, linea_id, unidad_defecto, periodicidad, activo)
              VALUES ($1, $2, $3, $4, $5, true)
              ON CONFLICT (id) DO UPDATE SET
                nombre = EXCLUDED.nombre,
                linea_id = EXCLUDED.linea_id,
                unidad_defecto = EXCLUDED.unidad_defecto,
                periodicidad = EXCLUDED.periodicidad
            `, [indicador.id, indicador.nombre, lineaIdFinal, indicador.unidadDefecto, indicador.periodicidad]);
            
            console.log(`✅ Indicador adicional ${indicador.id} creado/actualizado`);
          }
        }
      }
      
      // Crear cargas de prueba para algunos indicadores
      console.log('🔄 Creando cargas de prueba para gráficos...');
      const indicadores = await dataSource.query(`
        SELECT i.id, i.nombre, i.linea_id, l.ministerio_id 
        FROM indicadores i 
        JOIN lineas l ON i.linea_id = l.id 
        LIMIT 10
      `);
      const periodos = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05'];
      
      // Función para generar UUID v4
      function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
      
      for (const indicador of indicadores) {
        for (let i = 0; i < periodos.length; i++) {
          const periodo = periodos[i];
          const valor = Math.floor(Math.random() * 100) + 10;
          const meta = valor + Math.floor(Math.random() * 20) - 10;
          
          const cargaId = generateUUID();
          
          await dataSource.query(`
            INSERT INTO cargas (
              id, indicador_id, ministerio_id, linea_id, periodicidad, periodo, valor, meta, unidad, fuente,
              responsable_nombre, responsable_email, observaciones,
              estado, publicado, creado_por, creado_en, actualizado_en
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            ON CONFLICT (id) DO UPDATE SET
              valor = EXCLUDED.valor,
              meta = EXCLUDED.meta,
              actualizado_en = EXCLUDED.actualizado_en
          `, [
            cargaId,
            indicador.id,
            indicador.ministerio_id,
            indicador.linea_id,
            'mensual',
            periodo,
            valor,
            meta,
            'unidades',
            'Datos de prueba',
            'Sistema Automático',
            'sistema@pio.gob.ar',
            `Carga de prueba para ${indicador.nombre}`,
            'validado',
            true,
            'ba3ebf2f-3243-4542-a45c-6f8daad00c4f',
            new Date(),
            new Date()
          ]);
        }
      }
      
      // Verificar conteos finales
      const [ministeriosCount, lineasCount, indicadoresCount, cargasCount] = await Promise.all([
        dataSource.query('SELECT COUNT(*) FROM ministerios'),
        dataSource.query('SELECT COUNT(*) FROM lineas'),
        dataSource.query('SELECT COUNT(*) FROM indicadores'),
        dataSource.query('SELECT COUNT(*) FROM cargas WHERE estado = $1', ['validado'])
      ]);
      
      await dataSource.destroy();
      
      console.log('✅ Datos completos del PIO cargados exitosamente');
      
      res.json({
        status: 'OK',
        message: 'Datos completos del PIO cargados exitosamente',
        ministerios_count: ministeriosCount[0].count,
        lineas_count: lineasCount[0].count,
        indicadores_count: indicadoresCount[0].count,
        cargas_count: cargasCount[0].count,
        compromisos_procesados: compromisos.length,
        lineas_creadas: lineasCreadas,
        indicadores_creados: indicadoresCreados,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error cargando datos completos del PIO:', error.message);
      res.status(500).json({
        status: 'ERROR',
        message: 'Error cargando datos completos del PIO',
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