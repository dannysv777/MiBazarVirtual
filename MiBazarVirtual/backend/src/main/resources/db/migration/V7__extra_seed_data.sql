SET FOREIGN_KEY_CHECKS=0;

INSERT IGNORE INTO orders (
    id, buyer_id, store_id, status, order_type, delivery_address,
    subtotal, delivery_fee, total, payment_method, payment_status, created_at, updated_at
) VALUES
(1001, 8, 1, 'DELIVERED', 'DELIVERY', 'Zona 1, Ciudad de Guatemala', 36.00, 15.00, 51.00, 'CASH', 'PAID', NOW() - INTERVAL 9 DAY, NOW() - INTERVAL 8 DAY),
(1002, 9, 2, 'DELIVERED', 'PICKUP', NULL, 48.00, 0.00, 48.00, 'CASH', 'PAID', NOW() - INTERVAL 8 DAY, NOW() - INTERVAL 7 DAY),
(1003, 7, 3, 'DELIVERED', 'DELIVERY', 'Zona 10, Ciudad de Guatemala', 45.00, 15.00, 60.00, 'CASH', 'PAID', NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 6 DAY),
(1004, 8, 4, 'DELIVERED', 'PICKUP', NULL, 180.00, 0.00, 180.00, 'CASH', 'PAID', NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 5 DAY),
(1005, 9, 5, 'DELIVERED', 'DELIVERY', 'Zona 7, Ciudad de Guatemala', 45.00, 15.00, 60.00, 'CASH', 'PAID', NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 4 DAY);

INSERT IGNORE INTO order_items (
    id, order_id, product_id, product_name, unit, quantity, unit_price, subtotal
) VALUES
(1001, 1001, 2, 'Chile Pimiento Rojo', 'KG', 2, 18.00, 36.00),
(1002, 1002, 7, 'Cafe Antigua Molido', 'PAQUETE', 1, 48.00, 48.00),
(1003, 1003, 13, 'Aguacate Hass', 'UNIDAD', 5, 9.00, 45.00),
(1004, 1004, 19, 'Torta de Chocolate', 'UNIDAD', 1, 180.00, 180.00),
(1005, 1005, 22, 'Queso Seco de Huehue', 'KG', 1, 45.00, 45.00);

INSERT IGNORE INTO reviews (id, order_id, buyer_id, store_id, rating, comment, created_at) VALUES
(1, 1, 7, 1, 5, 'Excelente servicio y tomates muy frescos.', NOW() - INTERVAL 4 DAY),
(2, 1001, 8, 1, 4, 'Buen producto y entrega puntual.', NOW() - INTERVAL 8 DAY),
(3, 1002, 9, 2, 5, 'Cafe delicioso, muy recomendado.', NOW() - INTERVAL 7 DAY),
(4, 1003, 7, 3, 5, 'Los aguacates llegaron perfectos.', NOW() - INTERVAL 6 DAY),
(5, 1004, 8, 4, 4, 'La torta estuvo muy buena.', NOW() - INTERVAL 5 DAY);

UPDATE stores s
SET rating_avg = COALESCE((SELECT AVG(r.rating) FROM reviews r WHERE r.store_id = s.id), 0),
    rating_count = COALESCE((SELECT COUNT(*) FROM reviews r WHERE r.store_id = s.id), 0)
WHERE s.id IN (1, 2, 3, 4, 5);

INSERT IGNORE INTO conversations (id, buyer_id, seller_id, product_id, created_at, updated_at) VALUES
(4, 7, 3, 7, NOW() - INTERVAL 6 HOUR, NOW() - INTERVAL 5 HOUR),
(5, 8, 4, 13, NOW() - INTERVAL 4 HOUR, NOW() - INTERVAL 3 HOUR);

INSERT IGNORE INTO messages (id, conversation_id, sender_id, content, is_read, created_at) VALUES
(15, 4, 7, 'Hola, tiene cafe molido disponible para hoy?', true, NOW() - INTERVAL 6 HOUR),
(16, 4, 3, 'Si, tenemos cafe de Antigua recien tostado.', false, NOW() - INTERVAL 5 HOUR),
(17, 5, 8, 'Buenas, los aguacates estan maduros?', true, NOW() - INTERVAL 4 HOUR),
(18, 5, 4, 'Tenemos maduros y verdes. Le preparo una mezcla?', false, NOW() - INTERVAL 3 HOUR);

SET FOREIGN_KEY_CHECKS=1;
