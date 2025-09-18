-- Script de inicialización de la base de datos PIO
-- Este script se ejecuta automáticamente al crear el contenedor PostgreSQL

-- Crear la base de datos si no existe
SELECT 'CREATE DATABASE pio'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pio')\gexec

-- Conectar a la base de datos pio
\c pio;

-- Habilitar extensión uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear enums
DO $$ BEGIN
    CREATE TYPE rol_usuario_enum AS ENUM('ADMIN', 'USUARIO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE periodicidad_enum AS ENUM('mensual', 'trimestral', 'semestral', 'anual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE estado_carga_enum AS ENUM('borrador', 'pendiente', 'validado', 'observado', 'rechazado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE accion_auditoria_enum AS ENUM('crear', 'editar', 'enviar', 'aprobar', 'observar', 'rechazar', 'publicar', 'login', 'logout', 'cambiar_clave', 'bloquear', 'activar');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE objeto_auditoria_enum AS ENUM('cargas', 'usuarios', 'indicadores', 'sync', 'ministerios', 'lineas');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear tablas
CREATE TABLE IF NOT EXISTS ministerios (
    id text NOT NULL,
    nombre text NOT NULL,
    sigla text NOT NULL,
    activo boolean NOT NULL DEFAULT true,
    CONSTRAINT PK_ministerios PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS lineas (
    id text NOT NULL,
    titulo text NOT NULL,
    ministerio_id text NOT NULL,
    activo boolean NOT NULL DEFAULT true,
    CONSTRAINT PK_lineas PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS indicadores (
    id text NOT NULL,
    nombre text NOT NULL,
    linea_id text NOT NULL,
    unidad_defecto text NOT NULL,
    periodicidad periodicidad_enum NOT NULL,
    activo boolean NOT NULL DEFAULT true,
    valor_min numeric,
    valor_max numeric,
    CONSTRAINT PK_indicadores PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS usuarios (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    email text NOT NULL,
    nombre text NOT NULL,
    hash_clave text NOT NULL,
    rol rol_usuario_enum NOT NULL DEFAULT 'USUARIO',
    ministerio_id text,
    activo boolean NOT NULL DEFAULT true,
    clave_temporal boolean NOT NULL DEFAULT false,
    ultimo_login TIMESTAMP,
    intentos_fallidos integer NOT NULL DEFAULT 0,
    bloqueado_hasta TIMESTAMP,
    creado_en TIMESTAMP NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT UQ_usuarios_email UNIQUE (email),
    CONSTRAINT PK_usuarios PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS cargas (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    ministerio_id text NOT NULL,
    linea_id text NOT NULL,
    indicador_id text NOT NULL,
    periodicidad periodicidad_enum NOT NULL,
    periodo text NOT NULL,
    valor numeric NOT NULL,
    unidad text NOT NULL,
    meta numeric,
    fuente text NOT NULL,
    responsable_nombre text NOT NULL,
    responsable_email text NOT NULL,
    observaciones text,
    estado estado_carga_enum NOT NULL DEFAULT 'borrador',
    publicado boolean NOT NULL DEFAULT false,
    creado_por uuid NOT NULL,
    actualizado_por uuid NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT PK_cargas PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS auditoria (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    actor_id uuid NOT NULL,
    accion accion_auditoria_enum NOT NULL,
    objeto objeto_auditoria_enum NOT NULL,
    objeto_id text NOT NULL,
    antes jsonb,
    despues jsonb,
    ip inet,
    user_agent text,
    cuando TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT PK_auditoria PRIMARY KEY (id)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS IDX_cargas_indicador_periodo_ministerio ON cargas (indicador_id, periodo, ministerio_id) 
WHERE estado IN ('pendiente', 'validado');

CREATE INDEX IF NOT EXISTS IDX_auditoria_actor_cuando ON auditoria (actor_id, cuando);
CREATE INDEX IF NOT EXISTS IDX_auditoria_objeto_objeto_id ON auditoria (objeto, objeto_id);
CREATE INDEX IF NOT EXISTS IDX_auditoria_cuando ON auditoria (cuando);

-- Crear foreign keys
ALTER TABLE lineas DROP CONSTRAINT IF EXISTS FK_lineas_ministerio;
ALTER TABLE lineas ADD CONSTRAINT FK_lineas_ministerio 
FOREIGN KEY (ministerio_id) REFERENCES ministerios(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE indicadores DROP CONSTRAINT IF EXISTS FK_indicadores_linea;
ALTER TABLE indicadores ADD CONSTRAINT FK_indicadores_linea 
FOREIGN KEY (linea_id) REFERENCES lineas(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS FK_usuarios_ministerio;
ALTER TABLE usuarios ADD CONSTRAINT FK_usuarios_ministerio 
FOREIGN KEY (ministerio_id) REFERENCES ministerios(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE cargas DROP CONSTRAINT IF EXISTS FK_cargas_ministerio;
ALTER TABLE cargas ADD CONSTRAINT FK_cargas_ministerio 
FOREIGN KEY (ministerio_id) REFERENCES ministerios(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE cargas DROP CONSTRAINT IF EXISTS FK_cargas_linea;
ALTER TABLE cargas ADD CONSTRAINT FK_cargas_linea 
FOREIGN KEY (linea_id) REFERENCES lineas(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE cargas DROP CONSTRAINT IF EXISTS FK_cargas_indicador;
ALTER TABLE cargas ADD CONSTRAINT FK_cargas_indicador 
FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE cargas DROP CONSTRAINT IF EXISTS FK_cargas_creado_por;
ALTER TABLE cargas ADD CONSTRAINT FK_cargas_creado_por 
FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE cargas DROP CONSTRAINT IF EXISTS FK_cargas_actualizado_por;
ALTER TABLE cargas ADD CONSTRAINT FK_cargas_actualizado_por 
FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE auditoria DROP CONSTRAINT IF EXISTS FK_auditoria_actor;
ALTER TABLE auditoria ADD CONSTRAINT FK_auditoria_actor 
FOREIGN KEY (actor_id) REFERENCES usuarios(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Insertar datos iniciales
INSERT INTO ministerios (id, nombre, sigla) VALUES
('DES', 'Desarrollo Económico y Social', 'DES'),
('EDU', 'Educación', 'EDU'),
('SAL', 'Salud', 'SAL'),
('SEG', 'Seguridad y Justicia', 'SEG'),
('TRA', 'Transporte y Obras Públicas', 'TRA'),
('CUL', 'Cultura', 'CUL'),
('MED', 'Medio Ambiente', 'MED'),
('TUR', 'Turismo', 'TUR')
ON CONFLICT (id) DO NOTHING;

-- Crear usuario administrador inicial (clave: Cambiar.123)
INSERT INTO usuarios (id, email, nombre, hash_clave, rol, activo, clave_temporal) VALUES
('9057fe28-345a-40c1-b11b-a3b08485a256', 'admin@pio.local', 'Administrador del Sistema', '$argon2id$v=19$m=65536,t=3,p=4$YOUR_HASH_HERE', 'ADMIN', true, true)
ON CONFLICT (email) DO NOTHING;

-- Log de inicialización
INSERT INTO auditoria (actor_id, accion, objeto, objeto_id, antes, despues) VALUES
('9057fe28-345a-40c1-b11b-a3b08485a256', 'crear', 'ministerios', 'INIT', null, '{"message": "Base de datos inicializada"}')
ON CONFLICT DO NOTHING;





