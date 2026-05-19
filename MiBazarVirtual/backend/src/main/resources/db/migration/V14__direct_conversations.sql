ALTER TABLE conversations
  MODIFY COLUMN product_id BIGINT NULL,
  ADD COLUMN conversation_type VARCHAR(30) NOT NULL DEFAULT 'PRODUCT',
  ADD COLUMN order_id BIGINT NULL,
  ADD INDEX idx_conv_type_order (conversation_type, order_id),
  ADD INDEX idx_conv_participants (buyer_id, seller_id);
