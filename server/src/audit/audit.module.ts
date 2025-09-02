import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditService } from './audit.service';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { Auditoria } from '../db/entities/auditoria.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auditoria]),
  ],
  providers: [AuditService, AuditInterceptor],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}








