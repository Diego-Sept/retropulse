-- Idempotent seed for subscription plans
INSERT INTO planes_subscription (nombre, descripcion, equipos_max, clusters_ia_mes, salas_max, precio)
SELECT 'Gratuito', 'Plan gratuito para equipos pequeños. 1 equipo, 2 salas y 5 clusters IA por mes.', 1, 5, 2, 0.00
WHERE NOT EXISTS (SELECT 1 FROM planes_subscription WHERE nombre = 'Gratuito');

INSERT INTO planes_subscription (nombre, descripcion, equipos_max, clusters_ia_mes, salas_max, precio)
SELECT 'Small Team', 'Para equipos que necesitan más retrospectivas. 1 equipo, salas ilimitadas y 30 clusters IA por mes.', 1, 30, 0, 20000.00
WHERE NOT EXISTS (SELECT 1 FROM planes_subscription WHERE nombre = 'Small Team');

INSERT INTO planes_subscription (nombre, descripcion, equipos_max, clusters_ia_mes, salas_max, precio)
SELECT 'Enterprise', 'Para organizaciones con múltiples equipos. 10 equipos, salas ilimitadas y 500 clusters IA por mes.', 10, 500, 0, 100000.00
WHERE NOT EXISTS (SELECT 1 FROM planes_subscription WHERE nombre = 'Enterprise');