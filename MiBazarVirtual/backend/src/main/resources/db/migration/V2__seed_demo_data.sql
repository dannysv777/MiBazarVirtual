INSERT INTO categories (id, parent_id, name, slug, sort_order) VALUES
(1, NULL, 'Frutas y Verduras', 'frutas-verduras', 1),
(2, NULL, 'Carnes y Embutidos', 'carnes-embutidos', 2),
(3, NULL, 'Lacteos y Huevos', 'lacteos-huevos', 3),
(4, NULL, 'Panaderia', 'panaderia', 4),
(5, NULL, 'Bebidas', 'bebidas', 5),
(6, NULL, 'Abarrotes', 'abarrotes', 6),
(7, NULL, 'Congelados', 'congelados', 7),
(8, NULL, 'Organicos', 'organicos', 8);

INSERT INTO categories (parent_id, name, slug, sort_order) VALUES
(1, 'Frutas tropicales', 'frutas-tropicales', 1),
(1, 'Verduras de hoja', 'verduras-hoja', 2),
(1, 'Tuberculos', 'tuberculos', 3),
(2, 'Res', 'carne-res', 1),
(2, 'Pollo', 'carne-pollo', 2),
(2, 'Cerdo', 'carne-cerdo', 3),
(2, 'Mariscos', 'mariscos', 4),
(3, 'Quesos', 'quesos', 1),
(3, 'Yogur', 'yogur', 2),
(3, 'Cremas', 'cremas', 3);

INSERT INTO users (username, email, password, full_name, role) VALUES
('admin', 'admin@mibazarvirtual.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhumG', 'Administrador MiBazarVirtual', 'ADMIN');

INSERT INTO users (username, email, password, full_name, phone, role) VALUES
('finca_el_eden', 'eden@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhumG', 'Carlos Aju', '5555-0001', 'SELLER'),
('lacteos_dona_maria', 'maria@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhumG', 'Maria Perez', '5555-0002', 'SELLER'),
('panaderia_sol', 'sol@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhumG', 'Pedro Revolorio', '5555-0003', 'SELLER'),
('carnes_don_julio', 'julio@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhumG', 'Julio Garcia', '5555-0004', 'SELLER'),
('organicos_verde', 'verde@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhumG', 'Ana Lima', '5555-0005', 'SELLER');

INSERT INTO stores (user_id, name, description, address, latitude, longitude, delivery_radius, opening_time, closing_time, status) VALUES
(2, 'Finca El Eden', 'Frutas y verduras frescas directo del campo al mercado.', 'Zona 5, Ciudad de Guatemala', 14.6349000, -90.5069000, 10.00, '06:00:00', '18:00:00', 'ACTIVE'),
(3, 'Lacteos Dona Maria', 'Quesos artesanales, cremas y yogures elaborados con leche fresca.', 'Zona 1, Ciudad de Guatemala', 14.6407000, -90.5133000, 8.00, '07:00:00', '17:00:00', 'ACTIVE'),
(4, 'Panaderia El Sol', 'Pan fresco horneado cada manana.', 'Zona 10, Ciudad de Guatemala', 14.6042000, -90.5133000, 5.00, '05:00:00', '14:00:00', 'ACTIVE'),
(5, 'Carnes Don Julio', 'Carniceria con res, pollo y cerdo de primera calidad.', 'Zona 12, Ciudad de Guatemala', 14.5792000, -90.5192000, 12.00, '06:00:00', '17:00:00', 'ACTIVE'),
(6, 'Organicos Verde', 'Productos organicos certificados y verduras de temporada.', 'Zona 15, Ciudad de Guatemala', 14.5958000, -90.4933000, 15.00, '07:00:00', '19:00:00', 'ACTIVE');

INSERT INTO products (store_id, category_id, name, description, price, unit, stock, status) VALUES
(1, 9, 'Mangos Criollos', 'Mangos maduros de la finca, dulces y jugosos.', 15.00, 'KG', 50, 'ACTIVE'),
(1, 10, 'Espinaca fresca', 'Espinaca recien cortada, ideal para ensaladas.', 8.00, 'PAQUETE', 30, 'ACTIVE'),
(1, 11, 'Papas Blancas', 'Papas criollas ideales para cocer o freir.', 12.00, 'KG', 100, 'ACTIVE'),
(1, 9, 'Bananos de seda', 'Bananos pequenos y dulces.', 6.00, 'DOCENA', 40, 'ACTIVE'),
(2, 15, 'Queso Fresco Artesanal', 'Elaborado con leche entera de vaca.', 35.00, 'KG', 20, 'ACTIVE'),
(2, 16, 'Yogur Natural 500ml', 'Yogur natural sin azucar anadida.', 22.00, 'UNIDAD', 25, 'ACTIVE'),
(2, 17, 'Crema para cocinar', 'Crema espesa ideal para recetas y postres.', 18.00, 'UNIDAD', 30, 'ACTIVE'),
(3, 4, 'Pan Frances docena', 'Recien horneado cada manana.', 12.00, 'DOCENA', 60, 'ACTIVE'),
(3, 4, 'Pan Dulce Surtido', 'Surtido de pan dulce de 12 piezas.', 18.00, 'DOCENA', 40, 'ACTIVE'),
(3, 4, 'Baguette Integral', 'Pan integral con semillas.', 14.00, 'UNIDAD', 20, 'ACTIVE'),
(4, 12, 'Filete de Res', 'Corte de primera calidad.', 85.00, 'KG', 15, 'ACTIVE'),
(4, 13, 'Pollo Entero', 'Pollo fresco de peso aproximado 2.5 kg.', 42.00, 'UNIDAD', 20, 'ACTIVE'),
(4, 14, 'Chuletas de Cerdo', 'Chuletas gruesas listas para asar.', 65.00, 'KG', 10, 'ACTIVE'),
(5, 8, 'Mix Ensalada Organica', 'Mezcla de lechugas organicas.', 25.00, 'PAQUETE', 20, 'ACTIVE'),
(5, 8, 'Aguacate Hass Organico', 'Aguacates maduros sin pesticidas.', 20.00, 'UNIDAD', 35, 'ACTIVE'),
(5, 8, 'Granola Artesanal 400g', 'Granola con avena, miel local y almendras.', 45.00, 'UNIDAD', 25, 'ACTIVE');

INSERT INTO users (username, email, password, full_name, phone, role) VALUES
('luis_comprador', 'luis@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhumG', 'Luis Morales', '5555-1001', 'BUYER'),
('sofia_compradora', 'sofia@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhumG', 'Sofia Torres', '5555-1002', 'BUYER'),
('demo_presentacion', 'demo@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhumG', 'Demo Usuario', '5555-1003', 'BUYER');
