import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMinisterioDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  sigla: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}
