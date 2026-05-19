INSERT INTO users
  (username, email, password, full_name, role, phone, is_active, created_at, updated_at)
VALUES
  (
    'delivery_demo',
    'delivery@mibazarvirtual.com',
    '$2a$10$QQGaBbfOCUdGdBWJbhU0bOvV71aNVcqeNIvC3UH.eajnKkBRVrzXC',
    'Repartidor Demo',
    'DELIVERY',
    '50211111111',
    true,
    NOW(),
    NOW()
  )
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  full_name = VALUES(full_name),
  role = 'DELIVERY',
  phone = VALUES(phone),
  is_active = true,
  updated_at = NOW();
