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

@Entity('metas_mensuales')
@Index(['indicadorId', 'mes', 'ministerioId'], { 
  unique: true
})
export class MetaMensual {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', name: 'indicador_id' })
  indicadorId: string;

  @Column({ type: 'text', name: 'ministerio_id' })
  ministerioId: string;

  @Column({ type: 'text', name: 'linea_id' })
  lineaId: string;

  @Column({ type: 'text' })
  mes: string; // Formato: YYYY-MM (ej: 2024-01)

  @Column({ type: 'numeric' })
  meta: number;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'uuid', name: 'creado_por', nullable: true })
  creadoPor: string | null;

  @Column({ type: 'uuid', name: 'actualizado_por', nullable: true })
  actualizadoPor: string | null;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn: Date;

  // Relaciones
  @ManyToOne(() => Indicador)
  @JoinColumn({ name: 'indicador_id' })
  indicador: Indicador;

  @ManyToOne(() => Ministerio)
  @JoinColumn({ name: 'ministerio_id' })
  ministerio: Ministerio;

  @ManyToOne(() => Linea)
  @JoinColumn({ name: 'linea_id' })
  linea: Linea;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'creado_por' })
  creadoPorUsuario: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'actualizado_por' })
  actualizadoPorUsuario: Usuario;
}
