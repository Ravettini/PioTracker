import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CargasController } from './cargas.controller';
import { CargasService } from './cargas.service';
import { Carga } from '../db/entities/carga.entity';
import { Usuario } from '../db/entities/usuario.entity';
import { Indicador } from '../db/entities/indicador.entity';
import { Linea } from '../db/entities/linea.entity';
import { Ministerio } from '../db/entities/ministerio.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Carga, Usuario, Indicador, Linea, Ministerio]),
  ],
  controllers: [CargasController],
  providers: [CargasService],
  exports: [CargasService],
})
export class CargasModule {}








