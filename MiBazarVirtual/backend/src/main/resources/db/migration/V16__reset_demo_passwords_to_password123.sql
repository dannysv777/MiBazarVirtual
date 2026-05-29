UPDATE users
SET password = '$2a$10$xh9VeA04N2dXENKdtzRKFekvXHZYyZuol.Fvqu0EwvJ7DHZJJdlM6',
    is_active = true,
    updated_at = NOW()
WHERE email IN (
    'admin@mibazarvirtual.com',
    'pedro.gonzalez@gmail.com',
    'rosa.martinez@gmail.com',
    'rancho.verde@gmail.com',
    'sanjose.pan@gmail.com',
    'altiplano.lacteos@gmail.com',
    'carlos.lopez@gmail.com',
    'maria.perez@gmail.com',
    'jose.ramos@gmail.com',
    'delivery@mibazarvirtual.com'
);
