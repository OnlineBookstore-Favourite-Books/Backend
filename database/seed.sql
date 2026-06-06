-- Favourite Books - sample seed data
-- Run this file after schema.sql.

USE favourite_books_db;

-- Passwords (plain text):
-- manager@favbooks.com  -> manager123
-- staff@favbooks.com    -> staff123
-- customer@favbooks.com -> customer123
INSERT INTO users (name, email, password, phone, address, role)
VALUES
  ('Manager User', 'manager@favbooks.com', '$2b$10$lckaRZRITTeGqF6yqnvARODBhktQmvMUiyknvSJsYX7Oi04Wow.zG', '0400000001', '1 Admin Street', 'manager'),
  ('Staff User', 'staff@favbooks.com', '$2b$10$kHGagoffIYhQ2.cS3j7gB.yY3XZAs.Xsc6H.DDEy0Si64V4caxYfO', '0400000002', '2 Staff Street', 'staff'),
  ('Customer User', 'customer@favbooks.com', '$2b$10$gL8QNvOIO8fC7zVjNcxCquzRNBItn44PoP25NlEj7vC0C8YFm.EB2', '0400000003', '3 Reader Avenue', 'customer')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password = VALUES(password),
  phone = VALUES(phone),
  address = VALUES(address),
  role = VALUES(role);

INSERT INTO books (title, author, isbn, description, price, image_url, genre, stock_quantity)
VALUES
  (
    'Clean Code',
    'Robert C. Martin',
    '9780132350884',
    'A practical handbook of agile software craftsmanship.',
    49.90,
    'https://images-na.ssl-images-amazon.com/images/I/41xShlnTZTL._SX376_BO1,204,203,200_.jpg',
    'Programming',
    25
  ),
  (
    'Atomic Habits',
    'James Clear',
    '9780735211292',
    'An easy and proven way to build good habits and break bad ones.',
    29.90,
    'https://images-na.ssl-images-amazon.com/images/I/513Y5o-DYtL._SX329_BO1,204,203,200_.jpg',
    'Business',
    40
  ),
  (
    'A Brief History of Time',
    'Stephen Hawking',
    '9780553380163',
    'A landmark volume in science writing by one of the great minds.',
    24.50,
    'https://images-na.ssl-images-amazon.com/images/I/41aQPTCmeVL._SX324_BO1,204,203,200_.jpg',
    'Science',
    18
  ),
  (
    'The Midnight Library',
    'Matt Haig',
    '9780525559474',
    'A moving novel about choices, regrets, and the possibility of new lives.',
    22.00,
    'https://images-na.ssl-images-amazon.com/images/I/41JjytmWwVL._SX329_BO1,204,203,200_.jpg',
    'Fiction',
    30
  )
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  author = VALUES(author),
  description = VALUES(description),
  price = VALUES(price),
  image_url = VALUES(image_url),
  genre = VALUES(genre),
  stock_quantity = VALUES(stock_quantity);

-- Sample orders
INSERT INTO orders (id, user_id, total_amount, delivery_address, status, courier_id, created_at)
VALUES
  (1, 3, 79.80, '12 Reader Lane, Melbourne VIC 3000', 'delivered', 'AUSPOST-881234', DATE_SUB(NOW(), INTERVAL 14 DAY)),
  (2, 3, 24.50, '12 Reader Lane, Melbourne VIC 3000', 'shipped',   'STARTRACK-445566', DATE_SUB(NOW(), INTERVAL 5 DAY)),
  (3, 3, 51.90, '12 Reader Lane, Melbourne VIC 3000', 'processing', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (4, 3, 22.00, '12 Reader Lane, Melbourne VIC 3000', 'pending',    NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (5, 3, 29.90, '12 Reader Lane, Melbourne VIC 3000', 'cancelled',  NULL, DATE_SUB(NOW(), INTERVAL 7 DAY)),
  (6, 3, 74.40, 'In-Store Purchase',                  'delivered',  NULL, DATE_SUB(NOW(), INTERVAL 10 DAY))
ON DUPLICATE KEY UPDATE
  status     = VALUES(status),
  courier_id = VALUES(courier_id);

-- Order items for the sample orders
INSERT INTO order_items (order_id, book_id, title, author, price, quantity)
VALUES
  -- Order 1: Clean Code x1 + Atomic Habits x1
  (1, 1, 'Clean Code',            'Robert C. Martin', 49.90, 1),
  (1, 2, 'Atomic Habits',         'James Clear',      29.90, 1),
  -- Order 2: A Brief History of Time x1
  (2, 3, 'A Brief History of Time', 'Stephen Hawking', 24.50, 1),
  -- Order 3: Clean Code x1 + The Midnight Library x1
  (3, 1, 'Clean Code',            'Robert C. Martin', 49.90, 1),
  (3, 4, 'The Midnight Library',  'Matt Haig',        22.00, 1),
  -- Order 4: The Midnight Library x1
  (4, 4, 'The Midnight Library',  'Matt Haig',        22.00, 1),
  -- Order 5: Cancelled — Atomic Habits x1
  (5, 2, 'Atomic Habits',         'James Clear',      29.90, 1),
  -- Order 6: In-store — Atomic Habits x1 + The Midnight Library x2
  (6, 2, 'Atomic Habits',         'James Clear',      29.90, 1),
  (6, 4, 'The Midnight Library',  'Matt Haig',        22.00, 2)
ON DUPLICATE KEY UPDATE
  quantity = VALUES(quantity);
