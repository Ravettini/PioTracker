import { RolUsuario } from '../../db/entities/usuario.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  rol: RolUsuario;
  ministerioId: string | null;
  nombre: string;
}








