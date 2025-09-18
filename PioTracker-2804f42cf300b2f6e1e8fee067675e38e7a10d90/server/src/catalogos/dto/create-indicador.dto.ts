import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum Periodicidad {
  MENSUAL = 'mensual',
  TRIMESTRAL = 'trimestral',
  SEMESTRAL = 'semestral',
  ANUAL = 'anual'
}

export class CreateIndicadorDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  lineaId: string;

  @IsString()
  @IsOptional()
  unidadDefecto?: string;

  @IsEnum(Periodicidad)
  @IsOptional()
  periodicidad?: Periodicidad;

  @IsString()
  @IsOptional()
  meta?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}
