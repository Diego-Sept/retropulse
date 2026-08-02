-- Update plan prices to meet MercadoPago minimum ($15 USD)
UPDATE planes_subscription SET precio = 15.00 WHERE nombre = 'Small Team';
UPDATE planes_subscription SET precio = 49.00 WHERE nombre = 'Enterprise';
