import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Usuario } from './entities/usuario.entity';
import { Ministerio } from './entities/ministerio.entity';
import { Linea } from './entities/linea.entity';
import { Indicador } from './entities/indicador.entity';
import { Carga } from './entities/carga.entity';
import { Auditoria } from './entities/auditoria.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          host: configService.get('DB_HOST') || 'localhost',
          port: configService.get('DB_PORT') || 5432,
          username: configService.get('DB_USERNAME') || 'postgres',
          password: configService.get('DB_PASSWORD') || 'postgres',
          database: configService.get('DB_DATABASE') || 'pio',
          entities: [Usuario, Ministerio, Linea, Indicador, Carga, Auditoria],
          synchronize: false,
          logging: configService.get('NODE_ENV') === 'development',
          ssl: false,
          extra: {
            ssl: false,
            rejectUnauthorized: false,
          },
        };
      },
      inject: [ConfigService],
    }),
    
    TypeOrmModule.forFeature([
      Usuario,
      Ministerio,
      Linea,
      Indicador,
      Carga,
      Auditoria,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

