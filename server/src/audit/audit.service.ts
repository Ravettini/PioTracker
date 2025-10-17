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

  // Métodos de consulta para administradores
  async getLogs(filtros: {
    page: number;
    limit: number;
    usuarioId?: string;
    accion?: string;
    objeto?: string;
    desde?: Date;
    hasta?: Date;
  }) {
    const { page, limit, usuarioId, accion, objeto, desde, hasta } = filtros;
    const skip = (page - 1) * limit;

    const queryBuilder = this.auditoriaRepository
      .createQueryBuilder('auditoria')
      .leftJoinAndSelect('auditoria.actor', 'usuario')
      .orderBy('auditoria.cuando', 'DESC')
      .skip(skip)
      .take(limit);

    if (usuarioId) {
      queryBuilder.andWhere('auditoria.actorId = :usuarioId', { usuarioId });
    }

    if (accion) {
      queryBuilder.andWhere('auditoria.accion = :accion', { accion });
    }

    if (objeto) {
      queryBuilder.andWhere('auditoria.objeto = :objeto', { objeto });
    }

    if (desde) {
      queryBuilder.andWhere('auditoria.cuando >= :desde', { desde });
    }

    if (hasta) {
      queryBuilder.andWhere('auditoria.cuando <= :hasta', { hasta });
    }

    const [logs, total] = await queryBuilder.getManyAndCount();

    return {
      logs: logs.map(log => ({
        id: log.id,
        usuario: {
          id: log.actor.id,
          nombre: log.actor.nombre,
          email: log.actor.email,
        },
        accion: log.accion,
        objeto: log.objeto,
        objetoId: log.objetoId,
        antes: log.antes,
        despues: log.despues,
        ip: log.ip,
        userAgent: log.userAgent,
        cuando: log.cuando,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getActividadUsuario(usuarioId: string, limite: number = 100) {
    const logs = await this.auditoriaRepository.find({
      where: { actorId: usuarioId },
      order: { cuando: 'DESC' },
      take: limite,
      relations: ['actor'],
    });

    return logs.map(log => ({
      id: log.id,
      accion: log.accion,
      objeto: log.objeto,
      objetoId: log.objetoId,
      cuando: log.cuando,
      ip: log.ip,
    }));
  }

  async getEstadisticasUsuario(usuarioId: string) {
    const logs = await this.auditoriaRepository.find({
      where: { actorId: usuarioId },
      order: { cuando: 'DESC' },
    });

    const ultimoLogin = logs.find(log => log.accion === AccionAuditoria.LOGIN);
    const ultimoLogout = logs.find(log => log.accion === AccionAuditoria.LOGOUT);

    const accionesPorTipo = logs.reduce((acc, log) => {
      acc[log.accion] = (acc[log.accion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const objetosPorTipo = logs.reduce((acc, log) => {
      acc[log.objeto] = (acc[log.objeto] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      usuarioId,
      ultimoLogin: ultimoLogin?.cuando || null,
      ultimoLogout: ultimoLogout?.cuando || null,
      totalAcciones: logs.length,
      accionesPorTipo,
      objetosPorTipo,
      ultimasAcciones: logs.slice(0, 10).map(log => ({
        accion: log.accion,
        objeto: log.objeto,
        cuando: log.cuando,
      })),
    };
  }

  async getResumenGeneral(desde?: Date, hasta?: Date) {
    const queryBuilder = this.auditoriaRepository
      .createQueryBuilder('auditoria')
      .select('auditoria.accion', 'accion')
      .addSelect('COUNT(*)', 'total')
      .groupBy('auditoria.accion');

    if (desde) {
      queryBuilder.andWhere('auditoria.cuando >= :desde', { desde });
    }

    if (hasta) {
      queryBuilder.andWhere('auditoria.cuando <= :hasta', { hasta });
    }

    const accionesPorTipo = await queryBuilder.getRawMany();

    // Obtener usuarios más activos
    const usuariosMasActivos = await this.auditoriaRepository
      .createQueryBuilder('auditoria')
      .select('auditoria.actorId', 'usuarioId')
      .addSelect('COUNT(*)', 'acciones')
      .leftJoinAndSelect('auditoria.actor', 'usuario')
      .groupBy('auditoria.actorId')
      .addGroupBy('usuario.id')
      .orderBy('acciones', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      accionesPorTipo,
      usuariosMasActivos,
    };
  }

  async getSesionesUsuarios(soloActivos: boolean = false) {
    const usuarios = await this.auditoriaRepository
      .createQueryBuilder('auditoria')
      .select('auditoria.actorId', 'usuarioId')
      .addSelect('MAX(CASE WHEN auditoria.accion = :login THEN auditoria.cuando END)', 'ultimoLogin')
      .addSelect('MAX(CASE WHEN auditoria.accion = :logout THEN auditoria.cuando END)', 'ultimoLogout')
      .setParameter('login', AccionAuditoria.LOGIN)
      .setParameter('logout', AccionAuditoria.LOGOUT)
      .leftJoin('auditoria.actor', 'usuario')
      .addSelect('usuario.nombre', 'nombre')
      .addSelect('usuario.email', 'email')
      .groupBy('auditoria.actorId')
      .addGroupBy('usuario.id')
      .getRawMany();

    return usuarios.map(u => ({
      usuarioId: u.usuarioId,
      nombre: u.nombre,
      email: u.email,
      ultimoLogin: u.ultimoLogin,
      ultimoLogout: u.ultimoLogout,
      sesionActiva: u.ultimoLogin && (!u.ultimoLogout || new Date(u.ultimoLogin) > new Date(u.ultimoLogout)),
    })).filter(u => !soloActivos || u.sesionActiva);
  }
}








