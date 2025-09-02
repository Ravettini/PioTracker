import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Auditoria, AccionAuditoria, ObjetoAuditoria } from '../db/entities/auditoria.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(Auditoria)
    private auditoriaRepository: Repository<Auditoria>,
  ) {}

  async log(
    actorId: string,
    accion: AccionAuditoria,
    objeto: ObjetoAuditoria,
    objetoId: string,
    antes?: any,
    despues?: any,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      const auditoria = this.auditoriaRepository.create({
        actorId,
        accion,
        objeto,
        objetoId,
        antes: antes ? JSON.stringify(antes) : null,
        despues: despues ? JSON.stringify(despues) : null,
        ip,
        userAgent,
      });

      await this.auditoriaRepository.save(auditoria);
      
      this.logger.debug(`Auditoría registrada: ${accion} en ${objeto} ${objetoId}`);
    } catch (error) {
      this.logger.error('Error al registrar auditoría:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  async logLogin(actorId: string, ip?: string, userAgent?: string): Promise<void> {
    await this.log(actorId, AccionAuditoria.LOGIN, ObjetoAuditoria.USUARIOS, actorId, null, null, ip, userAgent);
  }

  async logLogout(actorId: string, ip?: string, userAgent?: string): Promise<void> {
    await this.log(actorId, AccionAuditoria.LOGOUT, ObjetoAuditoria.USUARIOS, actorId, null, null, ip, userAgent);
  }

  async logCreate(actorId: string, objeto: ObjetoAuditoria, objetoId: string, datos: any, ip?: string, userAgent?: string): Promise<void> {
    await this.log(actorId, AccionAuditoria.CREAR, objeto, objetoId, null, datos, ip, userAgent);
  }

  async logUpdate(actorId: string, objeto: ObjetoAuditoria, objetoId: string, antes: any, despues: any, ip?: string, userAgent?: string): Promise<void> {
    await this.log(actorId, AccionAuditoria.EDITAR, objeto, objetoId, antes, despues, ip, userAgent);
  }

  async logDelete(actorId: string, objeto: ObjetoAuditoria, objetoId: string, datos: any, ip?: string, userAgent?: string): Promise<void> {
    await this.log(actorId, AccionAuditoria.EDITAR, objeto, objetoId, datos, null, ip, userAgent);
  }

  async logSync(actorId: string, objetoId: string, resultado: any, ip?: string, userAgent?: string): Promise<void> {
    await this.log(actorId, AccionAuditoria.PUBLICAR, ObjetoAuditoria.SYNC, objetoId, null, resultado, ip, userAgent);
  }
}








