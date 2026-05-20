-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Planes de suscripción (catálogo)
CREATE TABLE planes_subscription (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  equipos_max INT NOT NULL DEFAULT 1,       -- 0 = ilimitado
  clusters_ia_mes INT NOT NULL DEFAULT 5,   -- 0 = ilimitado
  precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Empresas (tenants)
CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Suscripciones (snapshot por empresa)
CREATE TABLE suscripciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES planes_subscription(id),
  equipos_max INT NOT NULL,                  -- Snapshot, 0 = ilimitado
  clusters_ia_mes INT NOT NULL,              -- Snapshot, 0 = ilimitado
  precio DECIMAL(10,2) NOT NULL,
  estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'suspendida', 'cancelada')),
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  precio_proximo DECIMAL(10,2),
  fecha_efectiva_proximo_cambio DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id)
);

-- 4. Usuarios
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rol_global TEXT NOT NULL DEFAULT 'member' CHECK (rol_global IN ('super_admin', 'empresa_admin', 'member')),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Equipos
CREATE TABLE equipos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Usuarios por equipo
CREATE TABLE usuarios_equipo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  rol TEXT NOT NULL DEFAULT 'member' CHECK (rol IN ('team_admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(equipo_id, usuario_id)
);

-- 7. Invitaciones
CREATE TABLE invitaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  rol TEXT NOT NULL DEFAULT 'member' CHECK (rol IN ('team_admin', 'member')),
  aceptada BOOLEAN NOT NULL DEFAULT FALSE,
  expira_en TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Salas de retrospectiva
CREATE TABLE salas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'archivada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Tarjetas
CREATE TABLE tarjetas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sala_id UUID NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  columna_id INT NOT NULL CHECK (columna_id BETWEEN 1 AND 4),
  contenido TEXT NOT NULL,
  grupo_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Grupos IA
CREATE TABLE grupos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sala_id UUID NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  columna_id INT NOT NULL CHECK (columna_id BETWEEN 1 AND 4),
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FK for tarjetas.grupo_id
ALTER TABLE tarjetas ADD CONSTRAINT fk_tarjetas_grupo
  FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE SET NULL;

-- 11. Uso de IA
CREATE TABLE uso_ia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  mes TEXT NOT NULL,                          -- "YYYY-MM"
  clusters_usados INT NOT NULL DEFAULT 0,
  UNIQUE(empresa_id, mes)
);

-- 12. Price changes log
CREATE TABLE price_changes_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES planes_subscription(id),
  suscripcion_id UUID REFERENCES suscripciones(id),
  precio_anterior DECIMAL(10,2) NOT NULL,
  precio_nuevo DECIMAL(10,2) NOT NULL,
  fecha_efectiva DATE NOT NULL,
  tipo_cambio TEXT NOT NULL CHECK (tipo_cambio IN ('global_template', 'directo_suscripcion')),
  motivo TEXT NOT NULL DEFAULT '',
  created_by UUID NOT NULL REFERENCES usuarios(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Reset tokens
CREATE TABLE reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Notificaciones email
CREATE TABLE notificaciones_email (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('cambio_precio', 'reset_password')),
  suscripcion_id UUID REFERENCES suscripciones(id),
  precio_anterior DECIMAL(10,2),
  precio_nuevo DECIMAL(10,2),
  fecha_efectiva DATE,
  destinatario_email TEXT NOT NULL,
  enviado BOOLEAN NOT NULL DEFAULT FALSE,
  enviado_en TIMESTAMPTZ,
  error_msg TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_usuarios_empresa_id ON usuarios(empresa_id);
CREATE INDEX idx_equipos_empresa_id ON equipos(empresa_id);
CREATE INDEX idx_usuarios_equipo_equipo_id ON usuarios_equipo(equipo_id);
CREATE INDEX idx_usuarios_equipo_usuario_id ON usuarios_equipo(usuario_id);
CREATE INDEX idx_salas_equipo_id ON salas(equipo_id);
CREATE INDEX idx_tarjetas_sala_id ON tarjetas(sala_id);
CREATE INDEX idx_tarjetas_columna_id ON tarjetas(sala_id, columna_id);
CREATE INDEX idx_grupos_sala_id ON grupos(sala_id);
CREATE INDEX idx_uso_ia_empresa_mes ON uso_ia(empresa_id, mes);
CREATE INDEX idx_price_changes_plan ON price_changes_log(plan_id);
CREATE INDEX idx_notificaciones_empresa ON notificaciones_email(empresa_id);
CREATE INDEX idx_reset_tokens_usuario ON reset_tokens(usuario_id);
CREATE INDEX idx_reset_tokens_token ON reset_tokens(token);
CREATE INDEX idx_invitaciones_email ON invitaciones(email);
CREATE INDEX idx_suscripciones_empresa ON suscripciones(empresa_id);
