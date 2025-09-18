import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index
} from 'typeorm';
import { Linea } from './linea.entity';
import { Carga } from './carga.entity';

export enum Periodicidad {
  MENSUAL = 'mensual',
  TRIMESTRAL = 'trimestral',
  SEMESTRAL = 'semestral',
  ANUAL = 'anual'
}

@Entity('indicadores')
export class Indicador {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'text', name: 'linea_id' })
  lineaId: string;

  @Column({ type: 'text', name: 'unidad_defecto' })
  unidadDefecto: string;

  @Column({
    type: 'enum',
    enum: Periodicidad,
    enumName: 'periodicidad_enum'
  })
  periodicidad: Periodicidad;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'numeric', name: 'valor_min', nullable: true })
  valorMin: number | null;

  @Column({ type: 'numeric', name: 'valor_max', nullable: true })
  valorMax: number | null;

  // Relaciones
  @ManyToOne(() => Linea, linea => linea.indicadores)
  @JoinColumn({ name: 'linea_id' })
  linea: Linea;

  @OneToMany(() => Carga, carga => carga.indicador)
  cargas: Carga[];
}

