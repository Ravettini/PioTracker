import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index
} from 'typeorm';
import { Usuario } from './usuario.entity';

export enum AccionAuditoria {
  CREAR = 'crear',
  EDITAR = 'editar',
  ENVIAR = 'enviar',
  APROBAR = 'aprobar',
  OBSERVAR = 'observar',
  RECHAZAR = 'rechazar',
  PUBLICAR = 'publicar',
  LOGIN = 'login',
  LOGOUT = 'logout',
  CAMBIAR_CLAVE = 'cambiar_clave',
  BLOQUEAR = 'bloquear',
  ACTIVAR = 'activar'
}

export enum ObjetoAuditoria {
  CARGAS = 'cargas',
  USUARIOS = 'usuarios',
  INDICADORES = 'indicadores',
  SYNC = 'sync',
  MINISTERIOS = 'ministerios',
  LINEAS = 'lineas'
}

@Entity('auditoria')
@Index(['actorId', 'cuando'])
@Index(['objeto', 'objetoId'])
@Index(['cuando'])
export class Auditoria {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'actor_id' })
  actorId: string;

  @Column({
    type: 'enum',
    enum: AccionAuditoria,
    enumName: 'accion_auditoria_enum'
  })
  accion: AccionAuditoria;

  @Column({
    type: 'enum',
    enum: ObjetoAuditoria,
    enumName: 'objeto_auditoria_enum'
  })
  objeto: ObjetoAuditoria;

  @Column({ type: 'text', name: 'objeto_id' })
  objetoId: string;

  @Column({ type: 'jsonb', nullable: true })
  antes: any | null;

  @Column({ type: 'jsonb', nullable: true })
  despues: any | null;

  @Column({ type: 'inet', nullable: true })
  ip: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'cuando' })
  cuando: Date;

  // Relaciones
  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'actor_id' })
  actor: Usuario;
}

