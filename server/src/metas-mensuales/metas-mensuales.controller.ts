import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MetasMensualesService } from './metas-mensuales.service';
import { CreateMetaMensualDto } from './dto/create-meta-mensual.dto';
import { UpdateMetaMensualDto } from './dto/update-meta-mensual.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Usuario, RolUsuario } from '../db/entities/usuario.entity';

@Controller('metas-mensuales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MetasMensualesController {
  constructor(private readonly metasMensualesService: MetasMensualesService) {}

  @Post()
  @Roles(RolUsuario.ADMIN)
  async create(
    @Body() createMetaMensualDto: CreateMetaMensualDto,
    @CurrentUser() user: Usuario,
  ) {
    const meta = await this.metasMensualesService.create(createMetaMensualDto, user);
    
    return {
      message: 'Meta mensual creada exitosamente',
      data: meta,
    };
  }

  @Get()
  async findAll(@Query() query: any) {
    const result = await this.metasMensualesService.findAll(query);
    return {
      message: 'Metas mensuales obtenidas exitosamente',
      data: result.metas,
      total: result.total,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const meta = await this.metasMensualesService.findOne(id);
    return {
      message: 'Meta mensual obtenida exitosamente',
      data: meta,
    };
  }

  @Patch(':id')
  @Roles(RolUsuario.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateMetaMensualDto: UpdateMetaMensualDto,
    @CurrentUser() user: Usuario,
  ) {
    const meta = await this.metasMensualesService.update(id, updateMetaMensualDto, user.id);
    
    return {
      message: 'Meta mensual actualizada exitosamente',
      data: meta,
    };
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMIN)
  async remove(@Param('id') id: string) {
    await this.metasMensualesService.remove(id);
    
    return {
      message: 'Meta mensual eliminada exitosamente',
    };
  }

  @Get('indicador/:indicadorId')
  async getMetasByIndicador(
    @Param('indicadorId') indicadorId: string,
    @Query('ministerioId') ministerioId?: string,
    @Query('mes') mes?: string,
  ) {
    const metas = await this.metasMensualesService.getMetasByIndicador(indicadorId, ministerioId, mes);
    
    return {
      message: 'Metas del indicador obtenidas exitosamente',
      metas: metas,
    };
  }
}
