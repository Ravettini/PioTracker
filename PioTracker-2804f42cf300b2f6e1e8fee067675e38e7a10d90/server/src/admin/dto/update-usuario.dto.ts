import { IsEmail, IsString, IsEnum, IsOptional, MinLength, IsBoolean } from 'class-validator';
import { RolUsuario } from '../../db/entities/usuario.entity';

export class UpdateUsuarioDto {
  @IsOptional()
  @IsEmail({}, { message: 'El email debe ser válido' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser válido' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  nombre?: string;

  @IsOptional()
  @IsEnum(RolUsuario, { message: 'El rol debe ser ADMIN o USUARIO' })
  rol?: RolUsuario;

  @IsOptional()
  @IsString({ message: 'El ID del ministerio debe ser válido' })
  ministerioId?: string;

  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser un booleano' })
  activo?: boolean;
}








