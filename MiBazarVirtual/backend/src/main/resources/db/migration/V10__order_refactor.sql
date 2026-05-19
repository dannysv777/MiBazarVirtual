ALTER TABLE users
  MODIFY COLUMN role ENUM('BUYER','SELLER','DELIVERY','ADMIN') NOT NULL DEFAULT 'BUYER';

ALTER TABLE orders
  MODIFY COLUMN status ENUM(
    'PENDING',
    'PARTIALLY_CONFIRMED',
    'CONFIRMED',
    'READY_FOR_PICKUP',
    'IN_PROGRESS',
    'DELIVERED',
    'CANCELLED'
  ) NOT NULL DEFAULT 'PENDING';

ALTER TABLE orders
  MODIFY COLUMN store_id BIGINT NULL,
  ADD COLUMN delivery_worker_id BIGINT NULL,
  ADD COLUMN delivery_accepted_at TIMESTAMP NULL,
  ADD COLUMN estimated_delivery_time VARCHAR(50) NULL,
  ADD INDEX idx_order_delivery_worker (delivery_worker_id),
  ADD CONSTRAINT fk_order_delivery_worker FOREIGN KEY (delivery_worker_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE order_items
  ADD COLUMN item_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN vendor_note VARCHAR(255) NULL,
  ADD COLUMN store_id BIGINT NULL;

UPDATE order_items oi
JOIN products p ON p.id = oi.product_id
SET oi.store_id = p.store_id
WHERE oi.store_id IS NULL;

ALTER TABLE order_items
  MODIFY COLUMN store_id BIGINT NOT NULL,
  ADD INDEX idx_item_store (store_id),
  ADD INDEX idx_item_status (item_status),
  ADD CONSTRAINT fk_item_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT;
