import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CargasController } from './cargas.controller';
import { CargasService } from './cargas.service';
import { Carga } from '../db/entities/carga.entity';
import { Usuario } from '../db/entities/usuario.entity';
import { Indicador } from '../db/entities/indicador.entity';
import { Linea } from '../db/entities/linea.entity';
import { Ministerio } from '../db/entities/ministerio.entity';
import { MetaMensual } from '../db/entities/meta-mensual.entity';
import { SyncService } from '../sync/sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Carga, Usuario, Indicador, Linea, Ministerio, MetaMensual]),
  ],
  controllers: [CargasController],
  providers: [CargasService, SyncService],
  exports: [CargasService],
})
export class CargasModule {}








