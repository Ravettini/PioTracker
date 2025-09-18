import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index
} from 'typeorm';
import { Ministerio } from './ministerio.entity';
import { Indicador } from './indicador.entity';

@Entity('lineas')
export class Linea {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  titulo: string;

  @Column({ type: 'text', name: 'ministerio_id' })
  ministerioId: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  // Relaciones
  @ManyToOne(() => Ministerio, ministerio => ministerio.lineas)
  @JoinColumn({ name: 'ministerio_id' })
  ministerio: Ministerio;

  @OneToMany(() => Indicador, indicador => indicador.linea)
  indicadores: Indicador[];
}

