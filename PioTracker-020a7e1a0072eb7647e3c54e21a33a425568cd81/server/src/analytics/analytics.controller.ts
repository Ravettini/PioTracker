import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Usuario, RolUsuario } from '../db/entities/usuario.entity';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('ministerios')
  @Roles(RolUsuario.ADMIN, RolUsuario.USUARIO)
  async getMinisterios(@CurrentUser() user: Usuario) {
    return this.analyticsService.getMinisterios(user);
  }

  @Get('compromisos')
  @Roles(RolUsuario.ADMIN, RolUsuario.USUARIO)
  async getCompromisos(
    @Query('ministerioId') ministerioId: string,
    @CurrentUser() user: Usuario,
  ) {
    return this.analyticsService.getCompromisos(ministerioId, user);
  }

  @Get('indicadores')
  @Roles(RolUsuario.ADMIN, RolUsuario.USUARIO)
  async getIndicadores(
    @Query('compromisoId') compromisoId: string,
    @CurrentUser() user: Usuario,
  ) {
    return this.analyticsService.getIndicadores(compromisoId, user);
  }

  @Get('datos')
  @Roles(RolUsuario.ADMIN, RolUsuario.USUARIO)
  async getDatos(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: Usuario,
  ) {
    return this.analyticsService.getDatos(query, user);
  }

  @Get('resumen')
  @Roles(RolUsuario.ADMIN, RolUsuario.USUARIO)
  async getResumen(@CurrentUser() user: Usuario) {
    return this.analyticsService.getResumen(user);
  }
}
