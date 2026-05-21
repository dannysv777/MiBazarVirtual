CREATE TABLE push_tokens (
  id           BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id      BIGINT NOT NULL,
  token        VARCHAR(255) NOT NULL,
  token_type   VARCHAR(20) NOT NULL DEFAULT 'EXPO',
  platform     VARCHAR(20),
  device_id    VARCHAR(120),
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_push_token (token),
  INDEX idx_push_tokens_user_active (user_id, active),
  CONSTRAINT fk_push_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
