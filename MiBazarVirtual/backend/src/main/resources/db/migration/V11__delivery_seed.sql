INSERT IGNORE INTO users
  (username, email, password, full_name, role, phone, is_active, created_at, updated_at)
VALUES
  (
    'delivery_demo',
    'delivery@mibazarvirtual.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyc1gzCQ2',
    'Repartidor Demo',
    'DELIVERY',
    '50211111111',
    true,
    NOW(),
    NOW()
  );
