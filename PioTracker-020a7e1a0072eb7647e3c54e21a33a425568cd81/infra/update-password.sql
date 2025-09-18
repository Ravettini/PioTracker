-- Actualizar la contraseña del usuario admin
UPDATE usuarios 
SET hash_clave = '$argon2id$v=19$m=65536,t=3,p=4$HVf0e5mdYI1hgG6Vqx4uGw$i+hGR6uIa5ljpy71M/7RA6nIHgeGE1XxrHcOc8D3C3g'
WHERE email = 'admin@pio.local';



