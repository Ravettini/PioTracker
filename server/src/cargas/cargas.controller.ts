import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CargasService } from './cargas.service';
import { CreateCargaDto } from './dto/create-carga.dto';
import { UpdateCargaDto } from './dto/update-carga.dto';
import { RevisionDto } from './dto/revision.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Usuario, RolUsuario } from '../db/entities/usuario.entity';

@Controller('cargas')
export class CargasController {
  constructor(private readonly cargasService: CargasService) {}

  @Post()
  async create(
    @Body() createCargaDto: CreateCargaDto,
    @CurrentUser() user: Usuario,
  ) {
    const carga = await this.cargasService.create(createCargaDto, user.id);
    
    return {
      message: 'Carga creada exitosamente',
      carga: {
        id: carga.id,
        estado: carga.estado,
        creadoEn: carga.creadoEn,
      },
    };
  }

  @Get()
  async findAll(
    @Query() query: any,
    @CurrentUser() user: Usuario,
  ) {
    const result = await this.cargasService.findAll(
      query,
      user.id,
      user.rol,
      user.ministerioId,
    );
    
    return {
      cargas: result.cargas,
      total: result.total,
    };
  }

  @Get('stats')
  async getDashboardStats(@CurrentUser() user: Usuario) {
    return await this.cargasService.getDashboardStats(
      user.id,
      user.rol,
      user.ministerioId,
    );
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: Usuario,
  ) {
    return await this.cargasService.findOne(
      id,
      user.id,
      user.rol,
      user.ministerioId,
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCargaDto: UpdateCargaDto,
    @CurrentUser() user: Usuario,
  ) {
    const carga = await this.cargasService.update(
      id,
      updateCargaDto,
      user.id,
      user.rol,
      user.ministerioId,
    );
    
    return {
      message: 'Carga actualizada exitosamente',
      carga: {
        id: carga.id,
        estado: carga.estado,
        actualizadoEn: carga.actualizadoEn,
      },
    };
  }

  @Post(':id/enviar')
  async enviar(
    @Param('id') id: string,
    @CurrentUser() user: Usuario,
  ) {
    const carga = await this.cargasService.enviar(
      id,
      user.id,
      user.rol,
      user.ministerioId,
    );
    
    return {
      message: 'Carga enviada a revisión exitosamente',
      carga: {
        id: carga.id,
        estado: carga.estado,
        actualizadoEn: carga.actualizadoEn,
      },
    };
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: Usuario,
  ) {
    await this.cargasService.delete(
      id,
      user.id,
      user.rol,
      user.ministerioId,
    );
    
    return {
      message: 'Carga eliminada exitosamente',
    };
  }

  @Post(':id/revision')
  @Roles(RolUsuario.ADMIN)
  async revisar(
    @Param('id') id: string,
    @Body() revisionDto: RevisionDto,
    @CurrentUser() user: Usuario,
  ) {
    console.log('🔍 Revisión recibida:', { id, revisionDto, userId: user.id });
    
    const carga = await this.cargasService.revisar(
      id,
      revisionDto,
      user.id,
      user.rol,
    );
    
    console.log('✅ Revisión completada:', carga.id);
    
    return {
      message: `Carga ${revisionDto.estado} exitosamente`,
      carga: {
        id: carga.id,
        estado: carga.estado,
        observaciones: carga.observaciones,
        actualizadoEn: carga.actualizadoEn,
      },
    };
  }
}








