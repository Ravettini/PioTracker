import { IsEmail, IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { RolUsuario } from '../../db/entities/usuario.entity';

export class CreateUsuarioDto {
  @IsEmail({}, { message: 'El email debe ser válido' })
  email: string;

  @IsString({ message: 'El nombre es requerido' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  nombre: string;

  @IsEnum(RolUsuario, { message: 'El rol debe ser ADMIN o USUARIO' })
  rol: RolUsuario;

  @IsOptional()
  @IsString({ message: 'El ID del ministerio debe ser válido' })
  ministerioId?: string;
}








