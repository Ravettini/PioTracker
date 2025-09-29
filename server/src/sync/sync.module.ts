import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { GoogleAuthService } from './google-auth.service';
import { GoogleServiceAccountService } from './google-service-account.service';
import { Ministerio } from '../db/entities/ministerio.entity';
import { Linea } from '../db/entities/linea.entity';
import { Indicador } from '../db/entities/indicador.entity';
import { Carga } from '../db/entities/carga.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ministerio, Linea, Indicador, Carga]),
    ConfigModule,
  ],
  controllers: [SyncController],
  providers: [SyncService, GoogleAuthService, GoogleServiceAccountService],
  exports: [SyncService, GoogleAuthService, GoogleServiceAccountService],
})
export class SyncModule {}





