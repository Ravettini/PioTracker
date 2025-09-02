import { DataSource } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { Ministerio } from './entities/ministerio.entity';
import { Linea } from './entities/linea.entity';
import { Indicador } from './entities/indicador.entity';
import { Carga } from './entities/carga.entity';
import { Auditoria } from './entities/auditoria.entity';

// Esta configuración ya no se usa, se maneja en database.module.ts
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'pio',
  synchronize: false,
  logging: false,
  entities: [Usuario, Ministerio, Linea, Indicador, Carga, Auditoria],
  migrations: ['src/db/migrations/*.ts'],
  subscribers: [],
  ssl: false,
});

