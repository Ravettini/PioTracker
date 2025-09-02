import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

import { AuditService } from '../audit.service';
import { AccionAuditoria, ObjetoAuditoria } from '../../db/entities/auditoria.entity';

interface AuthenticatedUser {
  id: string;
  email: string;
  rol: string;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'];
    const user = request.user as AuthenticatedUser;

    // Solo auditar si hay usuario autenticado
    if (!user) {
      return next.handle();
    }

    const actorId = user.id;

    // Determinar la acción y objeto basado en el método y URL
    const { accion, objeto, objetoId } = this.determineAuditInfo(method, url, request);

    if (!accion || !objeto) {
      return next.handle();
    }

    // Capturar datos antes del cambio (para updates)
    let datosAntes: any = null;
    if (method === 'PUT' || method === 'PATCH') {
      datosAntes = request.body;
    }

    return next.handle().pipe(
      tap((response) => {
        // Registrar auditoría después de la operación
        this.auditService.log(
          actorId,
          accion,
          objeto,
          objetoId,
          datosAntes,
          response,
          ip,
          userAgent,
        );
      }),
    );
  }

  private determineAuditInfo(method: string, url: string, request: Request): {
    accion: AccionAuditoria | null;
    objeto: ObjetoAuditoria | null;
    objetoId: string;
  } {
    let accion: AccionAuditoria | null = null;
    let objeto: ObjetoAuditoria | null = null;
    let objetoId = '';

    // Extraer ID del objeto de la URL o del body
    if (request.params.id) {
      objetoId = request.params.id;
    } else if (request.body && request.body.id) {
      objetoId = request.body.id;
    }

    // Mapear endpoints a acciones de auditoría
    if (url.includes('/auth/login')) {
      accion = AccionAuditoria.LOGIN;
      objeto = ObjetoAuditoria.USUARIOS;
      objetoId = request.body?.email || 'unknown';
    } else if (url.includes('/auth/logout')) {
      accion = AccionAuditoria.LOGOUT;
      objeto = ObjetoAuditoria.USUARIOS;
      objetoId = (request.user as AuthenticatedUser)?.id || 'unknown';
    } else if (url.includes('/admin/usuarios') && method === 'POST') {
      accion = AccionAuditoria.CREAR;
      objeto = ObjetoAuditoria.USUARIOS;
      objetoId = request.body?.email || 'unknown';
    } else if (url.includes('/admin/usuarios') && method === 'PUT') {
      accion = AccionAuditoria.EDITAR;
      objeto = ObjetoAuditoria.USUARIOS;
    } else if (url.includes('/cargas') && method === 'POST') {
      accion = AccionAuditoria.CREAR;
      objeto = ObjetoAuditoria.CARGAS;
      objetoId = request.body?.indicadorId || 'unknown';
    } else if (url.includes('/cargas') && method === 'PUT') {
      accion = AccionAuditoria.EDITAR;
      objeto = ObjetoAuditoria.CARGAS;
    } else if (url.includes('/cargas') && url.includes('/enviar')) {
      accion = AccionAuditoria.ENVIAR;
      objeto = ObjetoAuditoria.CARGAS;
    } else if (url.includes('/cargas') && url.includes('/revision')) {
      accion = request.body?.estado === 'validado' ? AccionAuditoria.APROBAR : 
               request.body?.estado === 'observado' ? AccionAuditoria.OBSERVAR : 
               AccionAuditoria.RECHAZAR;
      objeto = ObjetoAuditoria.CARGAS;
    } else if (url.includes('/sync/push')) {
      accion = AccionAuditoria.PUBLICAR;
      objeto = ObjetoAuditoria.SYNC;
    }

    return { accion, objeto, objetoId };
  }
}
