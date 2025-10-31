-- SQL para verificar el usuario en pgAdmin

-- Ver todos los usuarios
SELECT id, name, username, password, role, email FROM admin_users;

-- Ver solo el usuario específico
SELECT id, name, username, password, role, email 
FROM admin_users 
WHERE username = 'Orlando13';

-- Si no tiene password, actualizarlo manualmente
UPDATE admin_users 
SET password = 'TuPasswordAqui' 
WHERE username = 'Orlando13';




