INSERT INTO categories (id, parent_id, name, slug, sort_order) VALUES
(1, NULL, 'Frutas y Verduras', 'frutas-verduras', 1),
(2, NULL, 'Lacteos y Huevos', 'lacteos-huevos', 2),
(3, NULL, 'Panaderia', 'panaderia', 3),
(4, NULL, 'Carnes', 'carnes', 4),
(5, NULL, 'Granos y Cereales', 'granos-cereales', 5),
(6, NULL, 'Bebidas', 'bebidas', 6);

INSERT INTO users (id, username, email, password, full_name, phone, role, is_active) VALUES
(1, 'admin', 'admin@mibazarvirtual.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyc1gzCQ2', 'Administrador MiBazarVirtual', '50220000000', 'ADMIN', true),
(2, 'don_pedro', 'pedro.gonzalez@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyc1gzCQ2', 'Pedro Gonzalez', '50255112233', 'SELLER', true),
(3, 'dona_rosa', 'rosa.martinez@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyc1gzCQ2', 'Rosa Martinez', '50244556677', 'SELLER', true),
(4, 'rancho_verde', 'rancho.verde@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyc1gzCQ2', 'Rancho Verde', '50233445566', 'SELLER', true),
(5, 'panaderia_san_jose', 'sanjose.pan@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyc1gzCQ2', 'Panaderia San Jose', '50266778899', 'SELLER', true),
(6, 'lacteos_altiplano', 'altiplano.lacteos@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyc1gzCQ2', 'Lacteos del Altiplano', '50277889900', 'SELLER', true),
(7, 'carlos_buyer', 'carlos.lopez@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyc1gzCQ2', 'Carlos Lopez', '50211223344', 'BUYER', true),
(8, 'maria_buyer', 'maria.perez@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyc1gzCQ2', 'Maria Perez', '50299887766', 'BUYER', true),
(9, 'jose_buyer', 'jose.ramos@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyc1gzCQ2', 'Jose Ramos', '50288776655', 'BUYER', true);

INSERT INTO stores (
    id, user_id, name, description, address, latitude, longitude,
    delivery_radius, opening_time, closing_time, rating_avg, rating_count, status
) VALUES
(1, 2, 'Verduras Don Pedro', 'Frutas y verduras frescas traidas directamente de Almolonga.', 'Mercado La Terminal, Local 24, Guatemala City', 14.6349000, -90.5069000, 10.00, '06:00:00', '16:00:00', 4.80, 127, 'ACTIVE'),
(2, 3, 'Tienda Dona Rosa', 'Productos lacteos artesanales elaborados en finca propia.', 'Zona 1, Calle Real 8-45, Mixco', 14.6302000, -90.6068000, 8.00, '07:00:00', '18:00:00', 4.60, 89, 'ACTIVE'),
(3, 4, 'Rancho Verde Organicos', 'Productos organicos y naturales sin pesticidas.', 'Boulevard Vista Hermosa 12-34, Guatemala City', 14.6012000, -90.5154000, 12.00, '08:00:00', '17:00:00', 4.90, 214, 'ACTIVE'),
(4, 5, 'Panaderia San Jose', 'Pan artesanal horneado cada manana con recetas tradicionales.', 'Avenida Reforma 6-15, Antigua Guatemala', 14.5586000, -90.7346000, 5.00, '05:00:00', '20:00:00', 4.70, 163, 'ACTIVE'),
(5, 6, 'Lacteos del Altiplano', 'Quesos y cremas artesanales de Huehuetenango.', 'Mercado Central, Pasillo B Local 7, Huehuetenango', 15.3194000, -91.4742000, 10.00, '06:00:00', '15:00:00', 4.50, 76, 'ACTIVE');

INSERT INTO products (
    id, store_id, category_id, name, description, price, stock, unit, cover_image, status
) VALUES
(1, 1, 1, 'Tomate Manzano', 'Tomate fresco de primera calidad, traido de Almolonga. Ideal para salsas y ensaladas.', 12.00, 150, 'KG', 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400', 'ACTIVE'),
(2, 1, 1, 'Cebolla Blanca', 'Cebolla blanca dulce, cosecha fresca de la semana.', 8.00, 200, 'KG', 'https://images.unsplash.com/photo-1508747703725-719777637510?w=400', 'ACTIVE'),
(3, 1, 1, 'Chile Pimiento Rojo', 'Chile pimiento rojo brillante, carnoso y dulce.', 15.00, 80, 'KG', 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400', 'ACTIVE'),
(4, 1, 1, 'Ejote Fino', 'Ejote verde tierno y crujiente. Cosecha del dia.', 10.00, 120, 'KG', 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?w=400', 'ACTIVE'),
(5, 1, 1, 'Papa Criolla', 'Papa criolla guatemalteca, ideal para cocidos y caldos.', 6.00, 300, 'KG', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400', 'ACTIVE'),
(6, 1, 1, 'Zanahoria Fresca', 'Zanahoria naranja brillante, dulce y crujiente.', 5.00, 180, 'KG', 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400', 'ACTIVE'),
(7, 1, 1, 'Guisquil', 'Guisquil tierno guatemalteco para sopas o escabeche.', 4.00, 100, 'UNIDAD', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400', 'ACTIVE'),
(8, 2, 2, 'Queso Fresco Artesanal', 'Queso fresco elaborado con leche pura de vaca.', 35.00, 40, 'KG', 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400', 'ACTIVE'),
(9, 2, 2, 'Crema Espesa', 'Crema natural espesa de leche entera.', 18.00, 60, 'UNIDAD', 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=400', 'ACTIVE'),
(10, 2, 2, 'Huevos de Granja', 'Huevos frescos de gallina criada en granja libre.', 28.00, 90, 'DOCENA', 'https://images.unsplash.com/photo-1569288052389-dac9b01ac769?w=400', 'ACTIVE'),
(11, 2, 2, 'Leche Fresca', 'Leche fresca entera directamente de la finca.', 14.00, 50, 'LITRO', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400', 'ACTIVE'),
(12, 3, 1, 'Lechuga Hidroponica', 'Lechuga verde hidroponica organica.', 12.00, 60, 'UNIDAD', 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400', 'ACTIVE'),
(13, 3, 1, 'Aguacate Hass', 'Aguacate Hass organico, cremoso y de sabor intenso.', 8.00, 100, 'UNIDAD', 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400', 'ACTIVE'),
(14, 3, 5, 'Frijol Negro Organico', 'Frijol negro organico de coccion suave.', 22.00, 200, 'KG', 'https://images.unsplash.com/photo-1614961908937-9f9da12f5b57?w=400', 'ACTIVE'),
(15, 3, 5, 'Maiz Criollo', 'Maiz criollo guatemalteco para tortillas.', 10.00, 300, 'KG', 'https://images.unsplash.com/photo-1601593346740-925612772716?w=400', 'ACTIVE'),
(16, 3, 6, 'Jugo de Naranja Natural', 'Jugo de naranja exprimido al momento.', 20.00, 40, 'LITRO', 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400', 'ACTIVE'),
(17, 4, 3, 'Pan Frances', 'Pan frances artesanal horneado a las 5am.', 1.50, 500, 'UNIDAD', 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=400', 'ACTIVE'),
(18, 4, 3, 'Pan Dulce Surtido', 'Surtido de pan dulce guatemalteco.', 2.50, 300, 'UNIDAD', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', 'ACTIVE'),
(19, 4, 3, 'Torta de Chocolate', 'Torta humeda de chocolate para 8 a 10 personas.', 180.00, 10, 'UNIDAD', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400', 'ACTIVE'),
(20, 4, 3, 'Quesadilla Guatemalteca', 'Quesadilla tradicional guatemalteca con queso seco.', 25.00, 80, 'UNIDAD', 'https://images.unsplash.com/photo-1627308595171-d1b5d67129c4?w=400', 'ACTIVE'),
(21, 4, 3, 'Champurradas', 'Galletas tradicionales guatemaltecas con ajonjoli.', 15.00, 150, 'PAQUETE', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400', 'ACTIVE'),
(22, 5, 2, 'Queso Seco de Huehue', 'Queso seco artesanal de Huehuetenango.', 45.00, 30, 'KG', 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=400', 'ACTIVE'),
(23, 5, 2, 'Requeson Fresco', 'Requeson suave y cremoso elaborado diariamente.', 28.00, 25, 'UNIDAD', 'https://images.unsplash.com/photo-1559561853-08451507cbe7?w=400', 'ACTIVE'),
(24, 5, 2, 'Mantequilla Artesanal', 'Mantequilla natural sin sal elaborada de crema de leche.', 32.00, 35, 'UNIDAD', 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=400', 'ACTIVE');

INSERT INTO conversations (id, buyer_id, seller_id, product_id, created_at, updated_at) VALUES
(1, 7, 2, 1, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 1 HOUR),
(2, 8, 5, 19, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 30 MINUTE),
(3, 9, 4, 13, NOW() - INTERVAL 3 HOUR, NOW() - INTERVAL 10 MINUTE);

INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at) VALUES
(1, 1, 7, 'Hola, aun tiene tomates frescos disponibles?', true, NOW() - INTERVAL 2 DAY),
(2, 1, 2, 'Buenos dias. Si, acabo de recibir una carga nueva de Almolonga. Cuantas libras necesita?', true, NOW() - INTERVAL 2 DAY + INTERVAL 5 MINUTE),
(3, 1, 7, 'Necesito unas 5 libras para esta semana. Hace delivery a zona 10?', true, NOW() - INTERVAL 2 DAY + INTERVAL 10 MINUTE),
(4, 1, 2, 'Claro que si, zona 10 tiene costo de envio de Q10 adicionales. Le parece bien?', true, NOW() - INTERVAL 2 DAY + INTERVAL 15 MINUTE),
(5, 1, 7, 'Perfecto, hago el pedido ahorita mismo. Gracias!', true, NOW() - INTERVAL 2 DAY + INTERVAL 18 MINUTE),
(6, 1, 2, 'Con gusto. Su pedido queda listo manana temprano.', true, NOW() - INTERVAL 1 HOUR),
(7, 2, 8, 'Tiene disponible torta de chocolate para el sabado? Es para cumpleanos.', true, NOW() - INTERVAL 1 DAY),
(8, 2, 5, 'Si, las tortas se piden con 48 horas de anticipacion. Para cuantas personas?', true, NOW() - INTERVAL 1 DAY + INTERVAL 20 MINUTE),
(9, 2, 8, 'Para unas 12 personas. Puede ponerle Feliz Cumpleanos Ana?', true, NOW() - INTERVAL 1 DAY + INTERVAL 35 MINUTE),
(10, 2, 5, 'Por supuesto. Desea recogerla o la enviamos?', true, NOW() - INTERVAL 30 MINUTE),
(11, 2, 8, 'La recojo yo el sabado a las 9am. Acepta pago contra entrega?', false, NOW() - INTERVAL 5 MINUTE),
(12, 3, 9, 'Buenas tardes, los aguacates ya estan en punto o todavia estan duros?', false, NOW() - INTERVAL 3 HOUR),
(13, 3, 4, 'Tenemos dos tipos: unos listos para hoy y otros para en 2 dias. Cual prefiere?', false, NOW() - INTERVAL 2 HOUR),
(14, 3, 9, 'Los de hoy por favor. Puedo pedir 10 unidades?', false, NOW() - INTERVAL 10 MINUTE);

INSERT INTO orders (
    id, buyer_id, store_id, status, order_type, delivery_address,
    subtotal, delivery_fee, total, payment_method, payment_status, created_at, updated_at
) VALUES
(1, 7, 1, 'DELIVERED', 'DELIVERY', 'Zona 10, Calle Mariscal 5-67, Apto 3B', 60.00, 10.00, 70.00, 'CASH', 'PAID', NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 4 DAY),
(2, 8, 4, 'CONFIRMED', 'PICKUP', NULL, 180.00, 0.00, 180.00, 'CASH', 'PENDING', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 20 HOUR);

INSERT INTO order_items (
    id, order_id, product_id, product_name, unit, quantity, unit_price, subtotal
) VALUES
(1, 1, 1, 'Tomate Manzano', 'KG', 5, 12.00, 60.00),
(2, 2, 19, 'Torta de Chocolate', 'UNIDAD', 1, 180.00, 180.00);
