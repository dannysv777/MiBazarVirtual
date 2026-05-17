CREATE TABLE notifications (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT NOT NULL,
  type        VARCHAR(50) NOT NULL,
  title       VARCHAR(150) NOT NULL,
  body        VARCHAR(500) NOT NULL,
  data        JSON,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id_read (user_id, is_read),
  INDEX idx_created_at (created_at)
);
