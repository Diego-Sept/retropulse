-- Limpieza total de datos para empezar de cero
-- Borra en orden correcto por foreign keys

DELETE FROM notificaciones_email;
DELETE FROM price_changes_log;
DELETE FROM reset_tokens;
DELETE FROM invitaciones;
DELETE FROM uso_ia;
DELETE FROM usuarios_equipo;
DELETE FROM tarjetas;
DELETE FROM grupos;
DELETE FROM salas;
DELETE FROM usuarios;
DELETE FROM suscripciones;
DELETE FROM equipos;
DELETE FROM empresas;

-- Re-seed idempotent
INSERT INTO planes_subscription (nombre, descripcion, equipos_max, clusters_ia_mes, precio)
SELECT 'Gratuito', 'Plan gratuito para equipos pequeños.', 1, 5, 0.00
WHERE NOT EXISTS (SELECT 1 FROM planes_subscription WHERE nombre = 'Gratuito');

INSERT INTO planes_subscription (nombre, descripcion, equipos_max, clusters_ia_mes, precio)
SELECT 'Small Team', 'Para equipos que necesitan más retrospectivas.', 1, 30, 9.00
WHERE NOT EXISTS (SELECT 1 FROM planes_subscription WHERE nombre = 'Small Team');

INSERT INTO planes_subscription (nombre, descripcion, equipos_max, clusters_ia_mes, precio)
SELECT 'Enterprise', 'Para organizaciones con múltiples equipos.', 10, 500, 29.00
WHERE NOT EXISTS (SELECT 1 FROM planes_subscription WHERE nombre = 'Enterprise');
