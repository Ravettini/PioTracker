import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeUserColumnsNullable1735467600000 implements MigrationInterface {
  name = 'MakeUserColumnsNullable1735467600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Hacer las columnas creado_por y actualizado_por opcionales (nullable)
    await queryRunner.query(`ALTER TABLE "cargas" ALTER COLUMN "creado_por" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "cargas" ALTER COLUMN "actualizado_por" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir los cambios (hacer las columnas NOT NULL nuevamente)
    await queryRunner.query(`ALTER TABLE "cargas" ALTER COLUMN "creado_por" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "cargas" ALTER COLUMN "actualizado_por" SET NOT NULL`);
  }
}


