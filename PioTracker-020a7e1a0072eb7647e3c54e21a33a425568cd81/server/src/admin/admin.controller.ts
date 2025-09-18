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
import { AdminService } from './admin.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolUsuario, Usuario } from '../db/entities/usuario.entity';

@Controller('admin')
@Roles(RolUsuario.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('usuarios')
  async createUsuario(
    @Body() createUsuarioDto: CreateUsuarioDto,
    @CurrentUser() admin: Usuario,
  ) {
    const usuario = await this.adminService.createUsuario(createUsuarioDto, admin.id);
    
    return {
      success: true,
      message: 'Usuario creado exitosamente',
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        ministerioId: usuario.ministerioId,
        activo: usuario.activo,
        claveTemporal: usuario.claveTemporal,
        passwordTemporal: (usuario as any).passwordTemporal,
      },
    };
  }

  @Get('usuarios')
  async findAll(@Query() query: any) {
    return await this.adminService.findAll(query);
  }

  @Get('usuarios/:id')
  async findOne(@Param('id') id: string) {
    const usuario = await this.adminService.findOne(id);
    
    // No retornar hash de contraseña
    const { hashClave, ...usuarioSinClave } = usuario;
    return usuarioSinClave;
  }

  @Put('usuarios/:id')
  async updateUsuario(
    @Param('id') id: string,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
    @CurrentUser() admin: Usuario,
  ) {
    const usuario = await this.adminService.updateUsuario(id, updateUsuarioDto, admin.id);
    
    // No retornar hash de contraseña
    const { hashClave, ...usuarioSinClave } = usuario;
    return {
      success: true,
      message: 'Usuario actualizado exitosamente',
      usuario: usuarioSinClave,
    };
  }

  @Put('usuarios/:id/toggle-status')
  async toggleUsuarioStatus(
    @Param('id') id: string,
    @CurrentUser() admin: Usuario,
  ) {
    const usuario = await this.adminService.toggleUsuarioStatus(id, admin.id);
    
    return {
      success: true,
      message: `Usuario ${usuario.activo ? 'activado' : 'desactivado'} exitosamente`,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        activo: usuario.activo,
      },
    };
  }

  @Put('usuarios/:id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @CurrentUser() admin: Usuario,
  ) {
    const result = await this.adminService.resetPassword(id, admin.id);
    
    return {
      success: true,
      message: 'Contraseña reseteada exitosamente',
      passwordTemporal: result.passwordTemporal,
    };
  }

  @Delete('usuarios/:id')
  async deleteUsuario(
    @Param('id') id: string,
    @CurrentUser() admin: Usuario,
  ) {
    await this.adminService.deleteUsuario(id, admin.id);
    
    return {
      success: true,
      message: 'Usuario eliminado exitosamente',
    };
  }

  @Get('ministerios')
  async getMinisterios() {
    return await this.adminService.getMinisterios();
  }
}








