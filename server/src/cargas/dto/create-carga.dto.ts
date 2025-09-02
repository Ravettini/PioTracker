import { IsString, IsNumber, IsOptional, IsUUID, Validate } from 'class-validator';
import { IsValidPeriodo } from '../validators/periodo.validator';

export class CreateCargaDto {
  @IsString({ message: 'El ID del ministerio es requerido' })
  ministerioId: string;

  @IsString({ message: 'El ID de la línea es requerido' })
  lineaId: string;

  @IsString({ message: 'El ID del indicador es requerido' })
  indicadorId: string;

  @IsString({ message: 'El período es requerido' })
  @Validate(IsValidPeriodo)
  periodo: string;

  @IsNumber({}, { message: 'El valor debe ser numérico' })
  valor: number;

  @IsString({ message: 'La unidad es requerida' })
  unidad: string;

  @IsOptional()
  @IsNumber({}, { message: 'La meta debe ser numérica' })
  meta?: number;

  @IsString({ message: 'La fuente es requerida' })
  fuente: string;

  @IsString({ message: 'El nombre del responsable es requerido' })
  responsableNombre: string;

  @IsString({ message: 'El email del responsable es requerido' })
  responsableEmail: string;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;
}








