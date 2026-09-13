-- Add salas_max + exportacion to plans and subscriptions (0 = unlimited)
ALTER TABLE planes_subscription ADD COLUMN IF NOT EXISTS salas_max INT NOT NULL DEFAULT 0;
ALTER TABLE suscripciones ADD COLUMN IF NOT EXISTS salas_max INT NOT NULL DEFAULT 0;
ALTER TABLE planes_subscription ADD COLUMN IF NOT EXISTS exportacion BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE suscripciones ADD COLUMN IF NOT EXISTS exportacion BOOLEAN NOT NULL DEFAULT false;

-- Update existing plans: Free = 2 salas + 3 clusters IA + no export, paid = export
UPDATE planes_subscription SET salas_max = 2, clusters_ia_mes = 3, exportacion = false WHERE nombre = 'Gratuito';
UPDATE planes_subscription SET salas_max = 10, clusters_ia_mes = 20, exportacion = true WHERE nombre = 'Small Team';
UPDATE planes_subscription SET salas_max = 0, exportacion = true WHERE nombre = 'Enterprise';

-- Sync existing suscripciones snapshots from their plan
UPDATE suscripciones s
SET salas_max = p.salas_max,
    clusters_ia_mes = p.clusters_ia_mes,
    exportacion = p.exportacion
FROM planes_subscription p
WHERE s.plan_id = p.id;