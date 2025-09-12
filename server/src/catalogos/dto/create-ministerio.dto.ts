import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMinisterioDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}
