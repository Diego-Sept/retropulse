-- Idempotent seed for subscription plans
INSERT INTO planes_subscription (nombre, descripcion, equipos_max, clusters_ia_mes, precio)
SELECT 'Gratuito', 'Plan gratuito para equipos pequeños. Limite de 1 equipo y 5 clusters IA por mes.', 1, 5, 0.00
WHERE NOT EXISTS (SELECT 1 FROM planes_subscription WHERE nombre = 'Gratuito');

INSERT INTO planes_subscription (nombre, descripcion, equipos_max, clusters_ia_mes, precio)
SELECT 'Small Team', 'Para equipos que necesitan más retrospectivas. 1 equipo, 30 clusters IA por mes.', 1, 30, 20000.00
WHERE NOT EXISTS (SELECT 1 FROM planes_subscription WHERE nombre = 'Small Team');

INSERT INTO planes_subscription (nombre, descripcion, equipos_max, clusters_ia_mes, precio)
SELECT 'Enterprise', 'Para organizaciones con múltiples equipos. 10 equipos, 500 clusters IA por mes.', 10, 500, 100000.00
WHERE NOT EXISTS (SELECT 1 FROM planes_subscription WHERE nombre = 'Enterprise');
