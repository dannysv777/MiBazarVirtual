-- ============================================================
--  MiBazarVirtual — Esquema completo de base de datos
--  Marketplace de productos alimenticios
--  Motor: MySQL 8.x
--  Charset: utf8mb4 (soporta emojis y caracteres especiales)
-- ============================================================

CREATE DATABASE IF NOT EXISTS mibazarvirtual_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE mibazarvirtual_db;

-- ============================================================
--  1. USUARIOS
-- ============================================================
CREATE TABLE users (
    id            BIGINT          NOT NULL AUTO_INCREMENT,
    username      VARCHAR(50)     NOT NULL,
    email         VARCHAR(100)    NOT NULL,
    password      VARCHAR(255)    NOT NULL,         -- bcrypt hash
    full_name     VARCHAR(120)    NOT NULL,
    phone         VARCHAR(20)         NULL,
    profile_image VARCHAR(500)        NULL,         -- URL Cloudinary
    role          ENUM('BUYER','SELLER','ADMIN') NOT NULL DEFAULT 'BUYER',
    is_active     BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email    (email),
    UNIQUE KEY uq_users_username (username),
    INDEX idx_users_role         (role),
    INDEX idx_users_is_active    (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
--  2. REFRESH TOKENS  (para JWT — Marcelo los necesita)
-- ============================================================
CREATE TABLE refresh_tokens (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    user_id     BIGINT       NOT NULL,
    token       VARCHAR(512) NOT NULL,
    expires_at  TIMESTAMP    NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_refresh_token (token),
    INDEX idx_refresh_user      (user_id),
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
--  3. TIENDAS  (cada vendedor tiene exactamente una tienda)
-- ============================================================
CREATE TABLE stores (
    id               BIGINT          NOT NULL AUTO_INCREMENT,
    user_id          BIGINT          NOT NULL,
    name             VARCHAR(120)    NOT NULL,
    description      TEXT                NULL,
    logo_url         VARCHAR(500)        NULL,
    banner_url       VARCHAR(500)        NULL,
    address          VARCHAR(255)        NULL,
    latitude         DECIMAL(10,7)       NULL,
    longitude        DECIMAL(10,7)       NULL,
    delivery_radius  DECIMAL(5,2)        NULL,       -- km
    opening_time     TIME                NULL,
    closing_time     TIME                NULL,
    rating_avg       DECIMAL(3,2)    NOT NULL DEFAULT 0.00,
    rating_count     INT             NOT NULL DEFAULT 0,
    status           ENUM('PENDING','ACTIVE','SUSPENDED') NOT NULL DEFAULT 'PENDING',
    created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_store_user   (user_id),          -- 1 tienda por vendedor
    INDEX idx_store_status     (status),
    INDEX idx_store_location   (latitude, longitude),
    CONSTRAINT fk_store_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
--  4. CATEGORÍAS  (árbol de dos niveles: padre / hijo)
-- ============================================================
CREATE TABLE categories (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    parent_id   BIGINT           NULL,              -- NULL = categoría raíz
    name        VARCHAR(80)  NOT NULL,
    slug        VARCHAR(80)  NOT NULL,              -- URL amigable
    icon_url    VARCHAR(500)     NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order  INT          NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    UNIQUE KEY uq_category_slug (slug),
    INDEX idx_category_parent   (parent_id),
    CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
--  5. PRODUCTOS
-- ============================================================
CREATE TABLE products (
    id               BIGINT          NOT NULL AUTO_INCREMENT,
    store_id         BIGINT          NOT NULL,
    category_id      BIGINT          NOT NULL,
    name             VARCHAR(150)    NOT NULL,
    description      TEXT                NULL,
    price            DECIMAL(10,2)   NOT NULL,
    discount_price   DECIMAL(10,2)       NULL,      -- NULL = sin descuento
    unit             ENUM('UNIDAD','KG','GRAMO','LITRO','ML','DOCENA','PAQUETE')
                                     NOT NULL DEFAULT 'UNIDAD',
    stock            INT             NOT NULL DEFAULT 0,
    cover_image      VARCHAR(500)        NULL,      -- imagen principal
    expiration_date  DATE                NULL,      -- importante en alimentos
    status           ENUM('ACTIVE','OUT_OF_STOCK','PAUSED','DELETED')
                                     NOT NULL DEFAULT 'ACTIVE',
    created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_product_store       (store_id),
    INDEX idx_product_category    (category_id),
    INDEX idx_product_status      (status),
    INDEX idx_product_price       (price),
    INDEX idx_product_expiration  (expiration_date),
    FULLTEXT INDEX ft_product_search (name, description),   -- búsqueda por texto
    CONSTRAINT fk_product_store    FOREIGN KEY (store_id)    REFERENCES stores(id)     ON DELETE CASCADE,
    CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
--  6. IMÁGENES ADICIONALES DE PRODUCTOS
-- ============================================================
CREATE TABLE product_images (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    product_id  BIGINT       NOT NULL,
    url         VARCHAR(500) NOT NULL,
    sort_order  INT          NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    INDEX idx_pimg_product (product_id),
    CONSTRAINT fk_pimg_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
--  7. PEDIDOS
-- ============================================================
CREATE TABLE orders (
    id               BIGINT          NOT NULL AUTO_INCREMENT,
    buyer_id         BIGINT          NOT NULL,
    store_id         BIGINT          NOT NULL,
    status           ENUM('PENDING','CONFIRMED','IN_PROGRESS','DELIVERED','CANCELLED')
                                     NOT NULL DEFAULT 'PENDING',
    order_type       ENUM('DELIVERY','PICKUP') NOT NULL DEFAULT 'DELIVERY',
    subtotal         DECIMAL(10,2)   NOT NULL,
    delivery_fee     DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    total            DECIMAL(10,2)   NOT NULL,

    -- Dirección de entrega (solo para DELIVERY)
    delivery_address VARCHAR(255)        NULL,
    delivery_lat     DECIMAL(10,7)       NULL,
    delivery_lng     DECIMAL(10,7)       NULL,

    -- Pago (visual por ahora, se conectará a Stripe después)
    payment_method   ENUM('CASH','CARD','TRANSFER') NOT NULL DEFAULT 'CASH',
    payment_status   ENUM('PENDING','PAID','REFUNDED') NOT NULL DEFAULT 'PENDING',

    notes            TEXT                NULL,      -- instrucciones del comprador
    created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_order_buyer   (buyer_id),
    INDEX idx_order_store   (store_id),
    INDEX idx_order_status  (status),
    INDEX idx_order_created (created_at),
    CONSTRAINT fk_order_buyer FOREIGN KEY (buyer_id) REFERENCES users(id)   ON DELETE RESTRICT,
    CONSTRAINT fk_order_store FOREIGN KEY (store_id) REFERENCES stores(id)  ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
--  8. DETALLE DE PEDIDO  (productos dentro de cada pedido)
-- ============================================================
CREATE TABLE order_items (
    id           BIGINT        NOT NULL AUTO_INCREMENT,
    order_id     BIGINT        NOT NULL,
    product_id   BIGINT        NOT NULL,
    quantity     INT           NOT NULL DEFAULT 1,
    unit_price   DECIMAL(10,2) NOT NULL,   -- precio al momento de comprar
    subtotal     DECIMAL(10,2) NOT NULL,   -- quantity * unit_price

    PRIMARY KEY (id),
    INDEX idx_item_order   (order_id),
    INDEX idx_item_product (product_id),
    CONSTRAINT fk_item_order   FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
    CONSTRAINT fk_item_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
--  9. CALIFICACIONES  (comprador califica la tienda post-entrega)
-- ============================================================
CREATE TABLE ratings (
    id         BIGINT    NOT NULL AUTO_INCREMENT,
    order_id   BIGINT    NOT NULL,
    buyer_id   BIGINT    NOT NULL,
    store_id   BIGINT    NOT NULL,
    score      TINYINT   NOT NULL CHECK (score BETWEEN 1 AND 5),
    comment    TEXT          NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_rating_order (order_id),   -- 1 calificación por pedido
    INDEX idx_rating_store     (store_id),
    INDEX idx_rating_buyer     (buyer_id),
    CONSTRAINT fk_rating_order FOREIGN KEY (order_id) REFERENCES orders(id)  ON DELETE CASCADE,
    CONSTRAINT fk_rating_buyer FOREIGN KEY (buyer_id) REFERENCES users(id)   ON DELETE CASCADE,
    CONSTRAINT fk_rating_store FOREIGN KEY (store_id) REFERENCES stores(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
--  10. CONVERSACIONES DE CHAT  (Codex ya generó esto,
--      se incluye por consistencia en el esquema general)
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
    id         BIGINT    NOT NULL AUTO_INCREMENT,
    buyer_id   BIGINT    NOT NULL,
    seller_id  BIGINT    NOT NULL,
    product_id BIGINT    NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_conversation (buyer_id, seller_id, product_id),
    INDEX idx_conv_buyer  (buyer_id),
    INDEX idx_conv_seller (seller_id),
    CONSTRAINT fk_conv_buyer   FOREIGN KEY (buyer_id)   REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_conv_seller  FOREIGN KEY (seller_id)  REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_conv_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
--  11. MENSAJES DE CHAT
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id               BIGINT    NOT NULL AUTO_INCREMENT,
    conversation_id  BIGINT    NOT NULL,
    sender_id        BIGINT    NOT NULL,
    content          TEXT      NOT NULL,
    is_read          BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_msg_conversation (conversation_id),
    INDEX idx_msg_sender       (sender_id),
    INDEX idx_msg_read         (is_read),
    CONSTRAINT fk_msg_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_sender       FOREIGN KEY (sender_id)       REFERENCES users(id)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
--  TRIGGER: actualizar rating_avg de la tienda al calificar
-- ============================================================
DELIMITER $$

CREATE TRIGGER trg_update_store_rating
AFTER INSERT ON ratings
FOR EACH ROW
BEGIN
    UPDATE stores
    SET
        rating_avg   = (SELECT AVG(score) FROM ratings WHERE store_id = NEW.store_id),
        rating_count = (SELECT COUNT(*)   FROM ratings WHERE store_id = NEW.store_id)
    WHERE id = NEW.store_id;
END$$

DELIMITER ;


-- ============================================================
--  DATOS SEMILLA — Categorías raíz
-- ============================================================
INSERT INTO categories (id, parent_id, name, slug, sort_order) VALUES
(1,  NULL, 'Frutas y Verduras', 'frutas-verduras',  1),
(2,  NULL, 'Carnes y Embutidos','carnes-embutidos',  2),
(3,  NULL, 'Lácteos y Huevos',  'lacteos-huevos',   3),
(4,  NULL, 'Panadería',         'panaderia',         4),
(5,  NULL, 'Bebidas',           'bebidas',           5),
(6,  NULL, 'Abarrotes',         'abarrotes',         6),
(7,  NULL, 'Congelados',        'congelados',        7),
(8,  NULL, 'Orgánicos',         'organicos',         8);

-- Subcategorías de Frutas y Verduras
INSERT INTO categories (parent_id, name, slug, sort_order) VALUES
(1, 'Frutas tropicales', 'frutas-tropicales', 1),
(1, 'Verduras de hoja',  'verduras-hoja',     2),
(1, 'Tubérculos',        'tuberculos',        3);

-- Subcategorías de Carnes
INSERT INTO categories (parent_id, name, slug, sort_order) VALUES
(2, 'Res',     'carne-res',     1),
(2, 'Pollo',   'carne-pollo',   2),
(2, 'Cerdo',   'carne-cerdo',   3),
(2, 'Mariscos','mariscos',      4);

-- Subcategorías de Lácteos
INSERT INTO categories (parent_id, name, slug, sort_order) VALUES
(3, 'Quesos',  'quesos',  1),
(3, 'Yogur',   'yogur',   2),
(3, 'Cremas',  'cremas',  3);


-- ============================================================
--  DATOS SEMILLA — Usuario administrador
-- ============================================================
-- Password: Admin123! (bcrypt hash generado con factor 10)
INSERT INTO users (username, email, password, full_name, role) VALUES
('admin', 'admin@mibazarvirtual.com',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhumG',
 'Administrador MiBazarVirtual', 'ADMIN');


-- ============================================================
--  DATOS SEMILLA — Vendedores de ejemplo
-- ============================================================
-- Password de todos: Vendedor123!
INSERT INTO users (username, email, password, full_name, phone, role) VALUES
('finca_el_eden',   'eden@demo.com',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhumG', 'Carlos Ajú',      '5555-0001', 'SELLER'),
('lacteos_dona_maria','maria@demo.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhumG', 'María Pérez',     '5555-0002', 'SELLER'),
('panaderia_sol',   'sol@demo.com',      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhumG', 'Pedro Revolorio', '5555-0003', 'SELLER'),
('carnes_don_julio', 'julio@demo.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhumG', 'Julio García',    '5555-0004', 'SELLER'),
('organicos_verde',  'verde@demo.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhumG', 'Ana Lima',        '5555-0005', 'SELLER');


-- ============================================================
--  DATOS SEMILLA — Tiendas de los vendedores
-- ============================================================
INSERT INTO stores (user_id, name, description, address, latitude, longitude, delivery_radius, opening_time, closing_time, status) VALUES
(2, 'Finca El Edén',
 'Frutas y verduras frescas directo del campo al mercado. Cultivadas sin agroquímicos.',
 'Zona 5, Ciudad de Guatemala', 14.6349, -90.5069, 10.00, '06:00:00', '18:00:00', 'ACTIVE'),

(3, 'Lácteos Doña María',
 'Quesos artesanales, cremas y yogures elaborados con leche fresca de vaca.',
 'Zona 1, Ciudad de Guatemala', 14.6407, -90.5133, 8.00, '07:00:00', '17:00:00', 'ACTIVE'),

(4, 'Panadería El Sol',
 'Pan fresco horneado cada mañana. Especialidad en pan dulce y francés.',
 'Zona 10, Ciudad de Guatemala', 14.6042, -90.5133, 5.00, '05:00:00', '14:00:00', 'ACTIVE'),

(5, 'Carnes Don Julio',
 'Carnicería con más de 20 años de trayectoria. Res, pollo y cerdo de primera calidad.',
 'Zona 12, Ciudad de Guatemala', 14.5792, -90.5192, 12.00, '06:00:00', '17:00:00', 'ACTIVE'),

(6, 'Orgánicos Verde',
 'Productos 100% orgánicos certificados. Verduras de temporada y superalimentos.',
 'Zona 15, Ciudad de Guatemala', 14.5958, -90.4933, 15.00, '07:00:00', '19:00:00', 'ACTIVE');


-- ============================================================
--  DATOS SEMILLA — Productos de ejemplo
-- ============================================================
INSERT INTO products (store_id, category_id, name, description, price, unit, stock, status) VALUES
-- Finca El Edén (store 1)
(1, 9,  'Mangos Criollos',         'Mangos maduros de la finca, dulces y jugosos. Temporada.',    15.00, 'KG',     50, 'ACTIVE'),
(1, 10, 'Espinaca fresca',         'Espinaca recién cortada, ideal para ensaladas y jugos.',        8.00, 'PAQUETE',30, 'ACTIVE'),
(1, 11, 'Papas Blancas',           'Papas criollas ideales para cocer, freír o sopas.',           12.00, 'KG',    100, 'ACTIVE'),
(1, 9,  'Bananos de seda',         'Bananos pequeños y dulces, perfectos para los niños.',         6.00, 'DOCENA', 40, 'ACTIVE'),

-- Lácteos Doña María (store 2)
(2, 15, 'Queso Fresco Artesanal',  'Elaborado con leche entera de vaca. Sin conservantes.',       35.00, 'KG',    20, 'ACTIVE'),
(2, 16, 'Yogur Natural 500ml',     'Yogur griego sin azúcar añadida. Rico en probióticos.',       22.00, 'UNIDAD',25, 'ACTIVE'),
(2, 17, 'Crema para cocinar',      'Crema espesa ideal para recetas y postres.',                   18.00, 'UNIDAD',30, 'ACTIVE'),

-- Panadería El Sol (store 3)
(3, 4,  'Pan Francés (docena)',    'Recién horneado cada mañana. Crocante por fuera, suave por dentro.', 12.00, 'DOCENA', 60, 'ACTIVE'),
(3, 4,  'Pan Dulce Surtido',       'Surtido de conchas, orejas y cuernitos. 12 piezas.',          18.00, 'DOCENA', 40, 'ACTIVE'),
(3, 4,  'Baguette Integral',       'Pan integral con semillas de linaza. Saludable y nutritivo.', 14.00, 'UNIDAD', 20, 'ACTIVE'),

-- Carnes Don Julio (store 4)
(4, 12, 'Filete de Res',           'Corte de primera calidad, ideal para a la plancha.',          85.00, 'KG',    15, 'ACTIVE'),
(4, 13, 'Pollo Entero',            'Pollo fresco sin hormonas. Peso aproximado 2.5 kg.',          42.00, 'UNIDAD',20, 'ACTIVE'),
(4, 14, 'Chuletas de Cerdo',       'Chuletas gruesas marinadas listas para asar.',                65.00, 'KG',    10, 'ACTIVE'),

-- Orgánicos Verde (store 5)
(5, 8,  'Mix Ensalada Orgánica',   'Mezcla de lechugas orgánicas, rúcula y espinaca baby.',       25.00, 'PAQUETE',20, 'ACTIVE'),
(5, 8,  'Aguacate Hass Orgánico',  'Aguacates maduros cultivados sin pesticidas.',                20.00, 'UNIDAD', 35, 'ACTIVE'),
(5, 8,  'Granola Artesanal 400g',  'Granola con avena, miel local, almendras y arándanos.',       45.00, 'UNIDAD', 25, 'ACTIVE');


-- ============================================================
--  DATOS SEMILLA — Compradores de ejemplo
-- ============================================================
-- Password: Comprador123!
INSERT INTO users (username, email, password, full_name, phone, role) VALUES
('luis_comprador',   'luis@demo.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhumG', 'Luis Morales',  '5555-1001', 'BUYER'),
('sofia_compradora', 'sofia@demo.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhumG', 'Sofía Torres',  '5555-1002', 'BUYER'),
('demo_presentacion','demo@demo.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhumG', 'Demo Usuario',  '5555-1003', 'BUYER');


-- ============================================================
--  VISTA ÚTIL: productos con info de tienda y categoría
-- ============================================================
CREATE OR REPLACE VIEW v_products_full AS
SELECT
    p.id              AS product_id,
    p.name            AS product_name,
    p.description,
    p.price,
    p.discount_price,
    p.unit,
    p.stock,
    p.cover_image,
    p.status          AS product_status,
    s.id              AS store_id,
    s.name            AS store_name,
    s.rating_avg,
    c.id              AS category_id,
    c.name            AS category_name,
    c.parent_id       AS parent_category_id
FROM products p
JOIN stores     s ON p.store_id    = s.id
JOIN categories c ON p.category_id = c.id
WHERE p.status = 'ACTIVE'
  AND s.status = 'ACTIVE';


-- ============================================================
--  CREDENCIALES DE DEMO (resumen para el equipo)
-- ============================================================
/*
  ADMIN
  ─────────────────────────────────────
  email:    admin@mibazarvirtual.com
  password: Admin123!

  VENDEDORES (todos con password: Vendedor123!)
  ─────────────────────────────────────
  finca_el_eden     / eden@demo.com
  lacteos_dona_maria/ maria@demo.com
  panaderia_sol     / sol@demo.com
  carnes_don_julio  / julio@demo.com
  organicos_verde   / verde@demo.com

  COMPRADORES (todos con password: Comprador123!)
  ─────────────────────────────────────
  luis_comprador    / luis@demo.com
  sofia_compradora  / sofia@demo.com
  demo_presentacion / demo@demo.com    ← usar en la presentación
*/
