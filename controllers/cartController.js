const db = require("../config/db");

// Add book to cart
const addToCart = (req, res) => {
  const { user_id, book_id, quantity } = req.body;

  // Check current stock and existing cart quantity together
  const stockSql = `
    SELECT books.stock_quantity,
           COALESCE(cart_items.quantity, 0) AS cart_quantity
    FROM books
    LEFT JOIN cart_items ON cart_items.book_id = books.id AND cart_items.user_id = ?
    WHERE books.id = ?
  `;

  db.query(stockSql, [user_id, book_id], (err, results) => {
    if (err) return res.status(500).json({ message: "Failed to check stock" });
    if (results.length === 0) return res.status(404).json({ message: "Book not found" });

    const { stock_quantity, cart_quantity } = results[0];
    const newTotal = cart_quantity + quantity;

    if (newTotal > stock_quantity) {
      const available = stock_quantity - cart_quantity;
      if (available <= 0) {
        return res.status(400).json({ message: "You already have the maximum available stock in your cart" });
      }
      return res.status(400).json({ message: `Only ${available} more available to add (${stock_quantity} in stock, ${cart_quantity} already in cart)` });
    }

    if (cart_quantity > 0) {
      db.query(
        "UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND book_id = ?",
        [quantity, user_id, book_id],
        (err) => {
          if (err) return res.status(500).json({ message: "Failed to update cart" });
          res.json({ message: "Cart updated successfully" });
        }
      );
    } else {
      db.query(
        "INSERT INTO cart_items (user_id, book_id, quantity) VALUES (?, ?, ?)",
        [user_id, book_id, quantity],
        (err) => {
          if (err) return res.status(500).json({ message: "Failed to add to cart" });
          res.status(201).json({ message: "Book added to cart!" });
        }
      );
    }
  });
};

// Get cart items
const getCart = (req, res) => {
  const { user_id } = req.params;

  const sql = `
    SELECT
      cart_items.id,
      cart_items.book_id,
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

// Update cart item quantity
const updateCartItem = (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ message: "Quantity must be at least 1" });
  }

  const stockSql = `
    SELECT books.stock_quantity
    FROM cart_items
    JOIN books ON cart_items.book_id = books.id
    WHERE cart_items.id = ?
  `;

  db.query(stockSql, [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Failed to check stock" });
    if (results.length === 0) return res.status(404).json({ message: "Cart item not found" });

    const stock = results[0].stock_quantity;
    if (quantity > stock) {
      return res.status(400).json({ message: `Only ${stock} in stock` });
    }

    db.query("UPDATE cart_items SET quantity = ? WHERE id = ?", [quantity, id], (err) => {
      if (err) return res.status(500).json({ message: "Failed to update quantity" });
      res.json({ message: "Quantity updated" });
    });
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
  updateCartItem,
  removeCartItem,
};