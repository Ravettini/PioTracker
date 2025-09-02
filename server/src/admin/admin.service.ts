import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import * as argon2 from 'argon2';

import { Usuario, RolUsuario } from '../db/entities/usuario.entity';
import { Ministerio } from '../db/entities/ministerio.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Ministerio)
    private ministerioRepository: Repository<Ministerio>,
  ) {}

  async createUsuario(createUsuarioDto: CreateUsuarioDto, adminId: string): Promise<Usuario> {
    // Verificar que el email no exista
    const existingUsuario = await this.usuarioRepository.findOne({
      where: { email: createUsuarioDto.email.toLowerCase() },
    });

    if (existingUsuario) {
      throw new BadRequestException('El email ya está registrado');
    }

    // Verificar que el ministerio existe si se especifica
    if (createUsuarioDto.ministerioId) {
      const ministerio = await this.ministerioRepository.findOne({
        where: { id: createUsuarioDto.ministerioId },
      });

      if (!ministerio) {
        throw new BadRequestException('Ministerio no encontrado');
      }
    }

    // Generar contraseña temporal
    const passwordTemporal = this.generateTemporaryPassword();
    const hashClave = await argon2.hash(passwordTemporal);

    const usuario = this.usuarioRepository.create({
      ...createUsuarioDto,
      email: createUsuarioDto.email.toLowerCase(),
      hashClave,
      claveTemporal: true,
    });

    const savedUsuario = await this.usuarioRepository.save(usuario);

    // Retornar usuario sin hash de contraseña pero con la contraseña temporal
    return {
      ...savedUsuario,
      passwordTemporal,
    } as any;
  }

  async findAll(query: any): Promise<{ usuarios: Usuario[]; total: number }> {
    const { q, rol, ministerioId, activo, limit = 20, offset = 0 } = query;

    const whereConditions: FindOptionsWhere<Usuario> = {};

    if (q) {
      whereConditions.nombre = Like(`%${q}%`);
    }

    if (rol) {
      whereConditions.rol = rol;
    }

    if (ministerioId) {
      whereConditions.ministerioId = ministerioId;
    }

    if (activo !== undefined) {
      whereConditions.activo = activo === 'true';
    }

    const [usuarios, total] = await this.usuarioRepository.findAndCount({
      where: whereConditions,
      relations: ['ministerio'],
      skip: offset,
      take: limit,
      order: { creadoEn: 'DESC' },
    });

    return { usuarios, total };
  }

  async findOne(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id },
      relations: ['ministerio'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  async updateUsuario(id: string, updateUsuarioDto: UpdateUsuarioDto, adminId: string): Promise<Usuario> {
    const usuario = await this.findOne(id);

    // Verificar que el ministerio existe si se especifica
    if (updateUsuarioDto.ministerioId) {
      const ministerio = await this.ministerioRepository.findOne({
        where: { id: updateUsuarioDto.ministerioId },
      });

      if (!ministerio) {
        throw new BadRequestException('Ministerio no encontrado');
      }
    }

    // Actualizar campos
    Object.assign(usuario, updateUsuarioDto);
    usuario.actualizadoEn = new Date();

    return await this.usuarioRepository.save(usuario);
  }

  async toggleUsuarioStatus(id: string, adminId: string): Promise<Usuario> {
    const usuario = await this.findOne(id);
    
    usuario.activo = !usuario.activo;
    usuario.actualizadoEn = new Date();

    return await this.usuarioRepository.save(usuario);
  }

  async resetPassword(id: string, adminId: string): Promise<{ passwordTemporal: string }> {
    const usuario = await this.findOne(id);
    
    const passwordTemporal = this.generateTemporaryPassword();
    const hashClave = await argon2.hash(passwordTemporal);
    
    usuario.hashClave = hashClave;
    usuario.claveTemporal = true;
    usuario.actualizadoEn = new Date();
    
    await this.usuarioRepository.save(usuario);

    return { passwordTemporal };
  }

  async getMinisterios(): Promise<Ministerio[]> {
    return await this.ministerioRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    
    // Asegurar que tenga al menos una mayúscula, una minúscula y un número
    password += chars.charAt(Math.floor(Math.random() * 26)); // Mayúscula
    password += chars.charAt(26 + Math.floor(Math.random() * 26)); // Minúscula
    password += chars.charAt(52 + Math.floor(Math.random() * 10)); // Número
    
    // Completar hasta 8 caracteres
    for (let i = 3; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Mezclar caracteres
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}
