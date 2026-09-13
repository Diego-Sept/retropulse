-- Idempotent seed for subscription plans
INSERT INTO planes_subscription (nombre, descripcion, equipos_max, clusters_ia_mes, salas_max, exportacion, precio)
SELECT 'Gratuito', 'Plan gratuito para equipos pequeños. 1 equipo, 2 salas y 3 clusters IA por mes.', 1, 3, 2, false, 0.00
WHERE NOT EXISTS (SELECT 1 FROM planes_subscription WHERE nombre = 'Gratuito');

INSERT INTO planes_subscription (nombre, descripcion, equipos_max, clusters_ia_mes, salas_max, exportacion, precio)
SELECT 'Small Team', 'Para equipos que necesitan más retrospectivas. 1 equipo, 10 salas y 20 clusters IA por mes.', 1, 20, 10, true, 20000.00
WHERE NOT EXISTS (SELECT 1 FROM planes_subscription WHERE nombre = 'Small Team');

INSERT INTO planes_subscription (nombre, descripcion, equipos_max, clusters_ia_mes, salas_max, exportacion, precio)
SELECT 'Enterprise', 'Para organizaciones con múltiples equipos. 10 equipos, salas ilimitadas y 500 clusters IA por mes.', 10, 500, 0, true, 100000.00
WHERE NOT EXISTS (SELECT 1 FROM planes_subscription WHERE nombre = 'Enterprise');