import { DataSource } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { Ministerio } from './entities/ministerio.entity';
import { Linea } from './entities/linea.entity';
import { Indicador } from './entities/indicador.entity';
import { Carga } from './entities/carga.entity';
import { Auditoria } from './entities/auditoria.entity';
import { MetaMensual } from './entities/meta-mensual.entity';

// Configuración para migraciones usando variables de entorno
// Render usa DATABASE_URL o variables específicas
const getDatabaseConfig = () => {
  // Si existe DATABASE_URL (formato de Render), parsearla
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      username: url.username,
      password: url.password,
      database: url.pathname.substring(1), // Remover el '/' inicial
    };
  }
  
  // Fallback a variables individuales
  return {
    host: process.env.DATABASE_HOST || process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || process.env.POSTGRES_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || process.env.POSTGRES_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || process.env.POSTGRES_DB || 'pio',
  };
};

const dbConfig = getDatabaseConfig();

console.log('🔍 Configuración de BD para migraciones:', {
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  database: dbConfig.database,
  password: dbConfig.password ? '***SET***' : 'NOT SET'
});

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...dbConfig,
  synchronize: false,
  logging: false,
        entities: [Usuario, Ministerio, Linea, Indicador, Carga, Auditoria, MetaMensual],
  migrations: ['src/db/migrations/*.ts'],
  subscribers: [],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

