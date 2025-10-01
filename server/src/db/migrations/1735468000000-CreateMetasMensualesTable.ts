import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMetasMensualesTable1735468000000 implements MigrationInterface {
  name = 'CreateMetasMensualesTable1735468000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla metas_mensuales
    await queryRunner.query(`
      CREATE TABLE "metas_mensuales" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "indicador_id" text NOT NULL,
        "ministerio_id" text NOT NULL,
        "linea_id" text NOT NULL,
        "mes" text NOT NULL,
        "meta" numeric NOT NULL,
        "descripcion" text,
        "creado_por" uuid,
        "actualizado_por" uuid,
        "creado_en" TIMESTAMP NOT NULL DEFAULT now(),
        "actualizado_en" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_metas_mensuales" PRIMARY KEY ("id")
      )
    `);

    // Crear índice único para evitar duplicados
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_metas_mensuales_unique" ON "metas_mensuales" ("indicador_id", "mes", "ministerio_id")
    `);

    // Crear índices para mejorar performance
    await queryRunner.query(`
      CREATE INDEX "IDX_metas_mensuales_indicador" ON "metas_mensuales" ("indicador_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_metas_mensuales_ministerio" ON "metas_mensuales" ("ministerio_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_metas_mensuales_mes" ON "metas_mensuales" ("mes")
    `);

    // Crear foreign keys
    await queryRunner.query(`
      ALTER TABLE "metas_mensuales" 
      ADD CONSTRAINT "FK_metas_mensuales_indicador" 
      FOREIGN KEY ("indicador_id") REFERENCES "indicadores"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "metas_mensuales" 
      ADD CONSTRAINT "FK_metas_mensuales_ministerio" 
      FOREIGN KEY ("ministerio_id") REFERENCES "ministerios"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "metas_mensuales" 
      ADD CONSTRAINT "FK_metas_mensuales_linea" 
      FOREIGN KEY ("linea_id") REFERENCES "lineas"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "metas_mensuales" 
      ADD CONSTRAINT "FK_metas_mensuales_creado_por" 
      FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "metas_mensuales" 
      ADD CONSTRAINT "FK_metas_mensuales_actualizado_por" 
      FOREIGN KEY ("actualizado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys
    await queryRunner.query(`
      ALTER TABLE "metas_mensuales" DROP CONSTRAINT "FK_metas_mensuales_actualizado_por"
    `);

    await queryRunner.query(`
      ALTER TABLE "metas_mensuales" DROP CONSTRAINT "FK_metas_mensuales_creado_por"
    `);

    await queryRunner.query(`
      ALTER TABLE "metas_mensuales" DROP CONSTRAINT "FK_metas_mensuales_linea"
    `);

    await queryRunner.query(`
      ALTER TABLE "metas_mensuales" DROP CONSTRAINT "FK_metas_mensuales_ministerio"
    `);

    await queryRunner.query(`
      ALTER TABLE "metas_mensuales" DROP CONSTRAINT "FK_metas_mensuales_indicador"
    `);

    // Eliminar índices
    await queryRunner.query(`
      DROP INDEX "IDX_metas_mensuales_mes"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_metas_mensuales_ministerio"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_metas_mensuales_indicador"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_metas_mensuales_unique"
    `);

    // Eliminar tabla
    await queryRunner.query(`
      DROP TABLE "metas_mensuales"
    `);
  }
}
