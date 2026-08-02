-- Add created_by column to tarjetas to track who wrote each card
ALTER TABLE tarjetas ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES usuarios(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tarjetas_created_by ON tarjetas(created_by);
