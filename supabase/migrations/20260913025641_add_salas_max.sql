-- Add salas_max to plans and subscriptions (0 = unlimited)
ALTER TABLE planes_subscription ADD COLUMN IF NOT EXISTS salas_max INT NOT NULL DEFAULT 0;
ALTER TABLE suscripciones ADD COLUMN IF NOT EXISTS salas_max INT NOT NULL DEFAULT 0;

-- Update existing plans: Free = 2 salas, paid = unlimited
UPDATE planes_subscription SET salas_max = 2 WHERE nombre = 'Gratuito';
UPDATE planes_subscription SET salas_max = 0 WHERE nombre = 'Small Team';
UPDATE planes_subscription SET salas_max = 0 WHERE nombre = 'Enterprise';

-- Sync existing suscripciones snapshots from their plan
UPDATE suscripciones s
SET salas_max = p.salas_max
FROM planes_subscription p
WHERE s.plan_id = p.id;