import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditService } from './audit.service';
import { RolUsuario } from '../db/entities/usuario.entity';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.ADMIN)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  async getLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('usuarioId') usuarioId?: string,
    @Query('accion') accion?: string,
    @Query('objeto') objeto?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    return this.auditService.getLogs({
      page: pageNum,
      limit: limitNum,
      usuarioId,
      accion,
      objeto,
      desde: desde ? new Date(desde) : undefined,
      hasta: hasta ? new Date(hasta) : undefined,
    });
  }

  @Get('usuarios/:usuarioId/actividad')
  async getActividadUsuario(
    @Query('usuarioId') usuarioId: string,
    @Query('limite') limite: string = '100',
  ) {
    return this.auditService.getActividadUsuario(usuarioId, parseInt(limite, 10));
  }

  @Get('usuarios/:usuarioId/estadisticas')
  async getEstadisticasUsuario(@Query('usuarioId') usuarioId: string) {
    return this.auditService.getEstadisticasUsuario(usuarioId);
  }

  @Get('resumen')
  async getResumenGeneral(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.auditService.getResumenGeneral(
      desde ? new Date(desde) : undefined,
      hasta ? new Date(hasta) : undefined,
    );
  }

  @Get('usuarios/sesiones')
  async getSesionesUsuarios(
    @Query('activos') activos?: string,
  ) {
    return this.auditService.getSesionesUsuarios(activos === 'true');
  }
}

