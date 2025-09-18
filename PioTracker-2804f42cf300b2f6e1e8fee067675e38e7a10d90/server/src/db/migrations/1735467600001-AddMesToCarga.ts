import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMesToCarga1735467600001 implements MigrationInterface {
    name = 'AddMesToCarga1735467600001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cargas" ADD "mes" character varying NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cargas" DROP COLUMN "mes"`);
    }
}
