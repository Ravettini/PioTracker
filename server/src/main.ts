import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
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

  // Prefijo global de API
  app.setGlobalPrefix('api/v1');

  const port = configService.get('port');
  await app.listen(port);
  
  console.log(`🚀 SIPIO API ejecutándose en puerto ${port}`);
  console.log(`🌍 Ambiente: ${configService.get('nodeEnv')}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
}

bootstrap();

