import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { Ministerio } from './ministerio.entity';
import { Linea } from './linea.entity';
import { Indicador } from './indicador.entity';
import { Usuario } from './usuario.entity';
import { Periodicidad } from './indicador.entity';

export enum EstadoCarga {
  BORRADOR = 'borrador',
  PENDIENTE = 'pendiente',
  VALIDADO = 'validado',
  OBSERVADO = 'observado',
  RECHAZADO = 'rechazado'
}

@Entity('cargas')
@Index(['indicadorId', 'periodo', 'ministerioId'], { 
  unique: true,
  where: "estado IN ('pendiente', 'validado')"
})
export class Carga {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', name: 'ministerio_id' })
  ministerioId: string;

  @Column({ type: 'text', name: 'linea_id' })
  lineaId: string;

  @Column({ type: 'text', name: 'indicador_id' })
  indicadorId: string;

  @Column({
    type: 'enum',
    enum: Periodicidad,
    enumName: 'periodicidad_enum'
  })
  periodicidad: Periodicidad;

  @Column({ type: 'text' })
  periodo: string;

  @Column({ type: 'text' })
  mes: string;

  @Column({ type: 'numeric' })
  valor: number;

  @Column({ type: 'text' })
  unidad: string;

  @Column({ type: 'numeric', nullable: true })
  meta: number | null;

  @Column({ type: 'text' })
  fuente: string;

  @Column({ type: 'text', name: 'responsable_nombre' })
  responsableNombre: string;

  @Column({ type: 'text', name: 'responsable_email' })
  responsableEmail: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @Column({
    type: 'enum',
    enum: EstadoCarga,
    enumName: 'estado_carga_enum',
    default: EstadoCarga.BORRADOR
  })
  estado: EstadoCarga;

  @Column({ type: 'boolean', default: false })
  publicado: boolean;

  @Column({ type: 'uuid', name: 'creado_por', nullable: true })
  creadoPor: string | null;

  @Column({ type: 'uuid', name: 'actualizado_por', nullable: true })
  actualizadoPor: string | null;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn: Date;

  // Relaciones
  @ManyToOne(() => Ministerio)
  @JoinColumn({ name: 'ministerio_id' })
  ministerio: Ministerio;

  @ManyToOne(() => Linea)
  @JoinColumn({ name: 'linea_id' })
  linea: Linea;

  @ManyToOne(() => Indicador)
  @JoinColumn({ name: 'indicador_id' })
  indicador: Indicador;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'creado_por' })
  creadoPorUsuario: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'actualizado_por' })
  actualizadoPorUsuario: Usuario;
}

