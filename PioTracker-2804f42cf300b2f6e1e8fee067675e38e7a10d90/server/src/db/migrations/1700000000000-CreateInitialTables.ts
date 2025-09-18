import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialTables1700000000000 implements MigrationInterface {
  name = 'CreateInitialTables1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear enum para roles de usuario
    await queryRunner.query(`
      CREATE TYPE "public"."rol_usuario_enum" AS ENUM('ADMIN', 'USUARIO')
    `);

    // Crear enum para periodicidad de indicadores
    await queryRunner.query(`
      CREATE TYPE "public"."periodicidad_enum" AS ENUM('mensual', 'trimestral', 'semestral', 'anual')
    `);

    // Crear enum para estados de carga
    await queryRunner.query(`
      CREATE TYPE "public"."estado_carga_enum" AS ENUM('borrador', 'pendiente', 'validado', 'observado', 'rechazado')
    `);

    // Crear enum para acciones de auditoría
    await queryRunner.query(`
      CREATE TYPE "public"."accion_auditoria_enum" AS ENUM('crear', 'editar', 'enviar', 'aprobar', 'observar', 'rechazar', 'publicar', 'login', 'logout', 'cambiar_clave', 'bloquear', 'activar')
    `);

    // Crear enum para objetos de auditoría
    await queryRunner.query(`
      CREATE TYPE "public"."objeto_auditoria_enum" AS ENUM('cargas', 'usuarios', 'indicadores', 'sync', 'ministerios', 'lineas')
    `);

    // Crear tabla ministerios
    await queryRunner.query(`
      CREATE TABLE "ministerios" (
        "id" text NOT NULL,
        "nombre" text NOT NULL,
        "sigla" text NOT NULL,
        "activo" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_ministerios" PRIMARY KEY ("id")
      )
    `);

    // Crear tabla lineas
    await queryRunner.query(`
      CREATE TABLE "lineas" (
        "id" text NOT NULL,
        "titulo" text NOT NULL,
        "ministerio_id" text NOT NULL,
        "activo" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_lineas" PRIMARY KEY ("id")
      )
    `);

    // Crear tabla indicadores
    await queryRunner.query(`
      CREATE TABLE "indicadores" (
        "id" text NOT NULL,
        "nombre" text NOT NULL,
        "linea_id" text NOT NULL,
        "unidad_defecto" text NOT NULL,
        "periodicidad" "public"."periodicidad_enum" NOT NULL,
        "activo" boolean NOT NULL DEFAULT true,
        "valor_min" numeric,
        "valor_max" numeric,
        CONSTRAINT "PK_indicadores" PRIMARY KEY ("id")
      )
    `);

    // Crear tabla usuarios
    await queryRunner.query(`
      CREATE TABLE "usuarios" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" text NOT NULL,
        "nombre" text NOT NULL,
        "hash_clave" text NOT NULL,
        "rol" "public"."rol_usuario_enum" NOT NULL DEFAULT 'USUARIO',
        "ministerio_id" text,
        "activo" boolean NOT NULL DEFAULT true,
        "clave_temporal" boolean NOT NULL DEFAULT false,
        "ultimo_login" TIMESTAMP,
        "intentos_fallidos" integer NOT NULL DEFAULT '0',
        "bloqueado_hasta" TIMESTAMP,
        "creado_en" TIMESTAMP NOT NULL DEFAULT now(),
        "actualizado_en" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_usuarios_email" UNIQUE ("email"),
        CONSTRAINT "PK_usuarios" PRIMARY KEY ("id")
      )
    `);

    // Crear tabla cargas
    await queryRunner.query(`
      CREATE TABLE "cargas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ministerio_id" text NOT NULL,
        "linea_id" text NOT NULL,
        "indicador_id" text NOT NULL,
        "periodicidad" "public"."periodicidad_enum" NOT NULL,
        "periodo" text NOT NULL,
        "valor" numeric NOT NULL,
        "unidad" text NOT NULL,
        "meta" numeric,
        "fuente" text NOT NULL,
        "responsable_nombre" text NOT NULL,
        "responsable_email" text NOT NULL,
        "observaciones" text,
        "estado" "public"."estado_carga_enum" NOT NULL DEFAULT 'borrador',
        "publicado" boolean NOT NULL DEFAULT false,
        "creado_por" uuid NOT NULL,
        "actualizado_por" uuid NOT NULL,
        "creado_en" TIMESTAMP NOT NULL DEFAULT now(),
        "actualizado_en" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cargas" PRIMARY KEY ("id")
      )
    `);

    // Crear tabla auditoria
    await queryRunner.query(`
      CREATE TABLE "auditoria" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "actor_id" uuid NOT NULL,
        "accion" "public"."accion_auditoria_enum" NOT NULL,
        "objeto" "public"."objeto_auditoria_enum" NOT NULL,
        "objeto_id" text NOT NULL,
        "antes" jsonb,
        "despues" jsonb,
        "ip" inet,
        "user_agent" text,
        "cuando" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_auditoria" PRIMARY KEY ("id")
      )
    `);

    // Crear índices
    await queryRunner.query(`
      CREATE INDEX "IDX_cargas_indicador_periodo_ministerio" ON "cargas" ("indicador_id", "periodo", "ministerio_id") 
      WHERE "estado" IN ('pendiente', 'validado')
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_auditoria_actor_cuando" ON "auditoria" ("actor_id", "cuando")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_auditoria_objeto_objeto_id" ON "auditoria" ("objeto", "objeto_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_auditoria_cuando" ON "auditoria" ("cuando")
    `);

    // Crear foreign keys
    await queryRunner.query(`
      ALTER TABLE "lineas" ADD CONSTRAINT "FK_lineas_ministerio" 
      FOREIGN KEY ("ministerio_id") REFERENCES "ministerios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "indicadores" ADD CONSTRAINT "FK_indicadores_linea" 
      FOREIGN KEY ("linea_id") REFERENCES "lineas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "usuarios" ADD CONSTRAINT "FK_usuarios_ministerio" 
      FOREIGN KEY ("ministerio_id") REFERENCES "ministerios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "cargas" ADD CONSTRAINT "FK_cargas_ministerio" 
      FOREIGN KEY ("ministerio_id") REFERENCES "ministerios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "cargas" ADD CONSTRAINT "FK_cargas_linea" 
      FOREIGN KEY ("linea_id") REFERENCES "lineas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "cargas" ADD CONSTRAINT "FK_cargas_indicador" 
      FOREIGN KEY ("indicador_id") REFERENCES "indicadores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "cargas" ADD CONSTRAINT "FK_cargas_creado_por" 
      FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "cargas" ADD CONSTRAINT "FK_cargas_actualizado_por" 
      FOREIGN KEY ("actualizado_por") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "auditoria" ADD CONSTRAINT "FK_auditoria_actor" 
      FOREIGN KEY ("actor_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // Habilitar extensión uuid-ossp si no existe
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys
    await queryRunner.query(`ALTER TABLE "auditoria" DROP CONSTRAINT "FK_auditoria_actor"`);
    await queryRunner.query(`ALTER TABLE "cargas" DROP CONSTRAINT "FK_cargas_actualizado_por"`);
    await queryRunner.query(`ALTER TABLE "cargas" DROP CONSTRAINT "FK_cargas_creado_por"`);
    await queryRunner.query(`ALTER TABLE "cargas" DROP CONSTRAINT "FK_cargas_indicador"`);
    await queryRunner.query(`ALTER TABLE "cargas" DROP CONSTRAINT "FK_cargas_linea"`);
    await queryRunner.query(`ALTER TABLE "cargas" DROP CONSTRAINT "FK_cargas_ministerio"`);
    await queryRunner.query(`ALTER TABLE "usuarios" DROP CONSTRAINT "FK_usuarios_ministerio"`);
    await queryRunner.query(`ALTER TABLE "indicadores" DROP CONSTRAINT "FK_indicadores_linea"`);
    await queryRunner.query(`ALTER TABLE "lineas" DROP CONSTRAINT "FK_lineas_ministerio"`);

    // Eliminar tablas
    await queryRunner.query(`DROP TABLE "auditoria"`);
    await queryRunner.query(`DROP TABLE "cargas"`);
    await queryRunner.query(`DROP TABLE "usuarios"`);
    await queryRunner.query(`DROP TABLE "indicadores"`);
    await queryRunner.query(`DROP TABLE "lineas"`);
    await queryRunner.query(`DROP TABLE "ministerios"`);

    // Eliminar enums
    await queryRunner.query(`DROP TYPE "public"."objeto_auditoria_enum"`);
    await queryRunner.query(`DROP TYPE "public"."accion_auditoria_enum"`);
    await queryRunner.query(`DROP TYPE "public"."estado_carga_enum"`);
    await queryRunner.query(`DROP TYPE "public"."periodicidad_enum"`);
    await queryRunner.query(`DROP TYPE "public"."rol_usuario_enum"`);
  }
}

