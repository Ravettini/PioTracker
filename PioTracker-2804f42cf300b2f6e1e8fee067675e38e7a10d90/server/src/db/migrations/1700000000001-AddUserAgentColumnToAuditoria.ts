import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAgentColumnToAuditoria1700000000001 implements MigrationInterface {
  name = 'AddUserAgentColumnToAuditoria1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "auditoria" 
      ADD COLUMN "userAgent" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "auditoria" 
      DROP COLUMN "userAgent"
    `);
  }
}

