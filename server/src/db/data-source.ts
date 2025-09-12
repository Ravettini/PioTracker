import { DataSource } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { Ministerio } from './entities/ministerio.entity';
import { Linea } from './entities/linea.entity';
import { Indicador } from './entities/indicador.entity';
import { Carga } from './entities/carga.entity';
import { Auditoria } from './entities/auditoria.entity';

// Configuración para migraciones usando variables de entorno
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'pio',
  synchronize: false,
  logging: false,
  entities: [Usuario, Ministerio, Linea, Indicador, Carga, Auditoria],
  migrations: ['src/db/migrations/*.ts'],
  subscribers: [],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

