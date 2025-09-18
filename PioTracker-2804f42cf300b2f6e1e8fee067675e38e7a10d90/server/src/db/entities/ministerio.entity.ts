import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  Index
} from 'typeorm';
import { Linea } from './linea.entity';
import { Usuario } from './usuario.entity';

@Entity('ministerios')
export class Ministerio {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'text' })
  sigla: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  // Relaciones
  @OneToMany(() => Linea, linea => linea.ministerio)
  lineas: Linea[];

  @OneToMany(() => Usuario, usuario => usuario.ministerio)
  usuarios: Usuario[];
}

