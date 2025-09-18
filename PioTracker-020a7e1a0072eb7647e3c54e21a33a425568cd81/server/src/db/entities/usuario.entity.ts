import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index
} from 'typeorm';
import { Ministerio } from './ministerio.entity';
import { Carga } from './carga.entity';
import { Auditoria } from './auditoria.entity';

export enum RolUsuario {
  ADMIN = 'ADMIN',
  USUARIO = 'USUARIO'
}

@Entity('usuarios')
@Index(['email'], { unique: true })
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'text', name: 'hash_clave' })
  hashClave: string;

  @Column({
    type: 'enum',
    enum: RolUsuario,
    enumName: 'rol_usuario_enum',
    default: RolUsuario.USUARIO
  })
  rol: RolUsuario;

  @Column({ type: 'text', name: 'ministerio_id', nullable: true })
  ministerioId: string | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'boolean', default: false, name: 'clave_temporal' })
  claveTemporal: boolean;

  @Column({ type: 'timestamp', name: 'ultimo_login', nullable: true })
  ultimoLogin: Date | null;

  @Column({ type: 'int', default: 0, name: 'intentos_fallidos' })
  intentosFallidos: number;

  @Column({ type: 'timestamp', name: 'bloqueado_hasta', nullable: true })
  bloqueadoHasta: Date | null;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn: Date;

  // Relaciones
  @ManyToOne(() => Ministerio, { nullable: true })
  @JoinColumn({ name: 'ministerio_id' })
  ministerio: Ministerio;

  @OneToMany(() => Carga, carga => carga.creadoPor)
  cargasCreadas: Carga[];

  @OneToMany(() => Carga, carga => carga.actualizadoPor)
  cargasActualizadas: Carga[];

  @OneToMany(() => Auditoria, auditoria => auditoria.actor)
  auditorias: Auditoria[];
}

