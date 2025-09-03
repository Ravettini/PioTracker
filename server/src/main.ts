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
    : ['http://localhost:3000'];

  console.log(`🌐 CORS configurado para orígenes: ${allowedOrigins.join(', ')}`);
  console.log(`🔧 Configuración CORS aplicada correctamente`);

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origen (como Postman) o provenientes de orígenes permitidos
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.log(`🚫 CORS bloqueado: ${origin} no está permitido`);
      console.log(`✅ Orígenes permitidos: ${allowedOrigins.join(', ')}`);
      return callback(new Error(`CORS: ${origin} no está permitido`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
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

  // Prefijo global de API
  app.setGlobalPrefix('api/v1');

  const port = configService.get('port');
  await app.listen(port);
  
  console.log(`🚀 PIO Tracker API ejecutándose en puerto ${port}`);
  console.log(`🌍 Ambiente: ${configService.get('nodeEnv')}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
}

bootstrap();

