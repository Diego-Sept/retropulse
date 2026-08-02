-- Invitations at the empresa level (not team level)
-- Used to invite users to join an empresa with a specific role
CREATE TABLE IF NOT EXISTS invitaciones_empresa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  rol TEXT NOT NULL CHECK (rol IN ('member', 'empresa_admin')),
  aceptada BOOLEAN NOT NULL DEFAULT FALSE,
  expira_en TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES usuarios(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitaciones_empresa_token ON invitaciones_empresa(token);
CREATE INDEX IF NOT EXISTS idx_invitaciones_empresa_email ON invitaciones_empresa(email);
