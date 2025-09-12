import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMetaMensualDto {
  @IsString({ message: 'El ID del indicador es requerido' })
  @IsNotEmpty()
  indicadorId: string;

  @IsString({ message: 'El ID del ministerio es requerido' })
  @IsNotEmpty()
  ministerioId: string;

  @IsString({ message: 'El mes es requerido' })
  @IsNotEmpty()
  mes: string; // Formato: YYYY-MM

  @IsNumber({}, { message: 'La meta debe ser numérica' })
  meta: number;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
