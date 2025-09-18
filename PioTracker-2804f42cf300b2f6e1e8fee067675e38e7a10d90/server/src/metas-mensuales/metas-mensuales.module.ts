import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetasMensualesService } from './metas-mensuales.service';
import { MetasMensualesController } from './metas-mensuales.controller';
import { MetaMensual } from '../db/entities/meta-mensual.entity';
import { Indicador } from '../db/entities/indicador.entity';
import { Ministerio } from '../db/entities/ministerio.entity';
import { Linea } from '../db/entities/linea.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MetaMensual, Indicador, Ministerio, Linea])
  ],
  controllers: [MetasMensualesController],
  providers: [MetasMensualesService],
  exports: [MetasMensualesService]
})
export class MetasMensualesModule {}
