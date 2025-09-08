import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Ministerio } from '../db/entities/ministerio.entity';
import { Linea } from '../db/entities/linea.entity';
import { Indicador } from '../db/entities/indicador.entity';
import { Carga } from '../db/entities/carga.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ministerio, Linea, Indicador, Carga]),
    ConfigModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
