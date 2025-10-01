import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogosController } from './catalogos.controller';
import { CatalogosService } from './catalogos.service';
import { Ministerio } from '../db/entities/ministerio.entity';
import { Linea } from '../db/entities/linea.entity';
import { Indicador } from '../db/entities/indicador.entity';
import { MetasMensualesModule } from '../metas-mensuales/metas-mensuales.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ministerio, Linea, Indicador]),
    MetasMensualesModule
  ],
  controllers: [CatalogosController],
  providers: [CatalogosService],
  exports: [CatalogosService]
})
export class CatalogosModule {}





