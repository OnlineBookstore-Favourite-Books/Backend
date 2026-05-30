const db = require("../config/db");

const createOrder = (req, res) => {
  const { user_id, delivery_address } = req.body;

  if (!user_id || !delivery_address) {
    return res.status(400).json({
      message: "User ID and delivery address are required",
    });
  }

  const cartSql = `
    SELECT 
      cart_items.book_id,
      cart_items.quantity,
      books.title,
      books.author,
      books.price,
      books.stock_quantity
    FROM cart_items
    JOIN books ON cart_items.book_id = books.id
    WHERE cart_items.user_id = ?
  `;

  db.query(cartSql, [user_id], (err, cartItems) => {
    if (err) {
      return res.status(500).json({ message: "Failed to fetch cart" });
    }

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const totalAmount = cartItems.reduce((total, item) => {
      return total + Number(item.price) * item.quantity;
    }, 0);

    const orderSql = `
      INSERT INTO orders (user_id, total_amount, delivery_address, status)
      VALUES (?, ?, ?, 'paid')
    `;

    db.query(orderSql, [user_id, totalAmount, delivery_address], (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Failed to create order" });
      }

      const orderId = result.insertId;

      const orderItems = cartItems.map((item) => [
        orderId,
        item.book_id,
        item.title,
        item.author,
        item.price,
        item.quantity,
      ]);

      const orderItemSql = `
        INSERT INTO order_items 
        (order_id, book_id, title, author, price, quantity)
        VALUES ?
      `;

      db.query(orderItemSql, [orderItems], (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to create order items" });
        }

        const clearCartSql = "DELETE FROM cart_items WHERE user_id = ?";

        db.query(clearCartSql, [user_id], (err) => {
          if (err) {
            return res.status(500).json({ message: "Order created but cart not cleared" });
          }

          res.status(201).json({
            message: "Order placed successfully",
            order_id: orderId,
            total_amount: totalAmount,
          });
        });
      });
    });
  });
};

module.exports = {
  createOrder,
};