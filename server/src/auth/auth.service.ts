import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';

import { Usuario, RolUsuario } from '../db/entities/usuario.entity';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: ['ministerio'],
    });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar si el usuario está bloqueado
    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      throw new UnauthorizedException('Cuenta temporalmente bloqueada');
    }

    // Verificar contraseña con argon2 o bcrypt (compatibilidad)
    try {
      // Intentar primero con argon2
      const argon2 = require('argon2');
      const isPasswordValidArgon2 = await argon2.verify(usuario.hashClave, password);
      if (isPasswordValidArgon2) {
        // Resetear intentos fallidos y actualizar último login
        usuario.intentosFallidos = 0;
        usuario.bloqueadoHasta = null;
        usuario.ultimoLogin = new Date();
        await this.usuarioRepository.save(usuario);
        return usuario;
      }
    } catch (argon2Error) {
      // Si argon2 falla, intentar con bcrypt
      try {
        const bcrypt = require('bcrypt');
        const isPasswordValidBcrypt = await bcrypt.compare(password, usuario.hashClave);
        if (isPasswordValidBcrypt) {
          // Resetear intentos fallidos y actualizar último login
          usuario.intentosFallidos = 0;
          usuario.bloqueadoHasta = null;
          usuario.ultimoLogin = new Date();
          await this.usuarioRepository.save(usuario);
          return usuario;
        }
      } catch (bcryptError) {
        this.logger.error('Error en validación de contraseña:', bcryptError);
      }
    }

    // Si ninguna validación funcionó, incrementar intentos fallidos
    usuario.intentosFallidos += 1;
    
    // Bloquear si excede el límite
    if (usuario.intentosFallidos >= 5) {
      usuario.bloqueadoHasta = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
    }
    
    await this.usuarioRepository.save(usuario);
    throw new UnauthorizedException('Credenciales inválidas');
  }

  async login(loginDto: LoginDto, ip: string, userAgent: string) {
    const usuario = await this.validateUser(loginDto.email, loginDto.password);
    
    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      ministerioId: usuario.ministerioId,
      nombre: usuario.nombre,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Registrar auditoría de login
    // TODO: Implementar auditoría

    return {
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        ministerioId: usuario.ministerioId,
        ministerio: usuario.ministerio,
        claveTemporal: usuario.claveTemporal,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const usuario = await this.usuarioRepository.findOne({
        where: { id: payload.sub },
        relations: ['ministerio'],
      });

      if (!usuario || !usuario.activo) {
        throw new UnauthorizedException('Usuario no válido');
      }

      const newPayload: JwtPayload = {
        sub: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        ministerioId: usuario.ministerioId,
        nombre: usuario.nombre,
      };

      const accessToken = this.jwtService.sign(newPayload);
      const refreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });

      return { accessToken, refreshToken };
    } catch (error) {
      throw new UnauthorizedException('Token de refresh inválido');
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: userId },
    });

    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await argon2.verify(
      usuario.hashClave,
      changePasswordDto.currentPassword,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Contraseña actual incorrecta');
    }

    // Validar nueva contraseña
    if (changePasswordDto.newPassword.length < 8) {
      throw new BadRequestException('La nueva contraseña debe tener al menos 8 caracteres');
    }

    // Hash de nueva contraseña
    const newHashClave = await argon2.hash(changePasswordDto.newPassword);
    
    usuario.hashClave = newHashClave;
    usuario.claveTemporal = false;
    usuario.actualizadoEn = new Date();
    
    await this.usuarioRepository.save(usuario);

    return { message: 'Contraseña cambiada exitosamente' };
  }

  async logout(userId: string) {
    // TODO: Implementar blacklist de tokens si es necesario
    return { message: 'Logout exitoso' };
  }

  async getProfile(userId: string) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: userId },
      relations: ['ministerio'],
    });

    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }

    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      ministerioId: usuario.ministerioId,
      ministerio: usuario.ministerio,
      claveTemporal: usuario.claveTemporal,
      ultimoLogin: usuario.ultimoLogin,
    };
  }
}

