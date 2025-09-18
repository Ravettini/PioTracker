import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateLineaDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  ministerioId: string;
}



