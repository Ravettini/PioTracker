import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMesToCarga1735467600001 implements MigrationInterface {
    name = 'AddMesToCarga1735467600001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "carga" ADD "mes" character varying NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "carga" DROP COLUMN "mes"`);
    }
}
