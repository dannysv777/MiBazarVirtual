ALTER TABLE categories
    ADD COLUMN description TEXT NULL AFTER name;

ALTER TABLE stores
    ADD COLUMN city VARCHAR(100) NULL AFTER address,
    ADD COLUMN phone VARCHAR(20) NULL AFTER city,
    ADD COLUMN schedule VARCHAR(160) NULL AFTER phone;
