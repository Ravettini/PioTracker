import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Usuario } from '../db/entities/usuario.entity';
import { Ministerio } from '../db/entities/ministerio.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Ministerio]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}








