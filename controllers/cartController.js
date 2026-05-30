const db = require("../config/db");

// Add book to cart
const addToCart = (req, res) => {
  const { user_id, book_id, quantity } = req.body;

  const checkSql = `
    SELECT * FROM cart_items 
    WHERE user_id = ? AND book_id = ?
  `;

  db.query(checkSql, [user_id, book_id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Failed to check cart" });
    }

    if (results.length > 0) {
      const updateSql = `
        UPDATE cart_items 
        SET quantity = quantity + ? 
        WHERE user_id = ? AND book_id = ?
      `;

      db.query(updateSql, [quantity, user_id, book_id], (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to update cart" });
        }

        res.json({ message: "Cart updated successfully" });
      });
    } else {
      const insertSql = `
        INSERT INTO cart_items (user_id, book_id, quantity)
        VALUES (?, ?, ?)
      `;

      db.query(insertSql, [user_id, book_id, quantity], (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to add to cart" });
        }

        res.status(201).json({ message: "Book added to cart" });
      });
    }
  });
};

// Get cart items
const getCart = (req, res) => {
  const { user_id } = req.params;

  const sql = `
    SELECT 
      cart_items.id,
      cart_items.quantity,
      books.title,
      books.author,
      books.price,
      books.image_url,
      books.stock_quantity
    FROM cart_items
    JOIN books ON cart_items.book_id = books.id
    WHERE cart_items.user_id = ?
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Failed to fetch cart" });
    }

    res.json(results);
  });
};

// Remove cart item
const removeCartItem = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM cart_items WHERE id = ?";

  db.query(sql, [id], (err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to remove item" });
    }

    res.json({ message: "Item removed from cart" });
  });
};

module.exports = {
  addToCart,
  getCart,
  removeCartItem,
};