CREATE OR REPLACE VIEW v_products_full AS
SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.description,
    p.price,
    p.discount_price,
    p.unit,
    p.stock,
    p.cover_image,
    p.status AS product_status,
    s.id AS store_id,
    s.name AS store_name,
    s.rating_avg,
    c.id AS category_id,
    c.name AS category_name,
    c.parent_id AS parent_category_id
FROM products p
JOIN stores s ON p.store_id = s.id
JOIN categories c ON p.category_id = c.id
WHERE p.status = 'ACTIVE'
  AND s.status = 'ACTIVE';

CREATE TRIGGER trg_update_store_rating
AFTER INSERT ON ratings
FOR EACH ROW
BEGIN
    UPDATE stores
    SET
        rating_avg = (SELECT AVG(score) FROM ratings WHERE store_id = NEW.store_id),
        rating_count = (SELECT COUNT(*) FROM ratings WHERE store_id = NEW.store_id)
    WHERE id = NEW.store_id;
END;
