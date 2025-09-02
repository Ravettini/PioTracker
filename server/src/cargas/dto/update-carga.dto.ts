import { IsString, IsNumber, IsOptional, Validate } from 'class-validator';
import { IsValidPeriodo } from '../validators/periodo.validator';

export class UpdateCargaDto {
  @IsOptional()
  @IsString({ message: 'El período debe ser válido' })
  @Validate(IsValidPeriodo)
  periodo?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El valor debe ser numérico' })
  valor?: number;

  @IsOptional()
  @IsString({ message: 'La unidad debe ser texto' })
  unidad?: string;

  @IsOptional()
  @IsNumber({}, { message: 'La meta debe ser numérica' })
  meta?: number;

  @IsOptional()
  @IsString({ message: 'La fuente debe ser texto' })
  fuente?: string;

  @IsOptional()
  @IsString({ message: 'El nombre del responsable debe ser texto' })
  responsableNombre?: string;

  @IsOptional()
  @IsString({ message: 'El email del responsable debe ser válido' })
  responsableEmail?: string;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;
}








