import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Usuario } from '../../db/entities/usuario.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: payload.sub },
      relations: ['ministerio'],
    });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Usuario no válido o inactivo');
    }

    return usuario;
  }
}








