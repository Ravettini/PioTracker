import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function runMigrations() {
  console.log('🔄 Iniciando migraciones...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  try {
    console.log('📊 Ejecutando migraciones pendientes...');
    await dataSource.runMigrations();
    console.log('✅ Migraciones ejecutadas correctamente');
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
  } finally {
    await app.close();
  }
}

runMigrations();