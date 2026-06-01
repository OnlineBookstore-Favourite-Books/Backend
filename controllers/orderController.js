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

const getUserOrders = (req, res) => {
  const { user_id } = req.params;

  const sql = `
    SELECT *
    FROM orders
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to fetch orders",
      });
    }

    res.json(results);
  });
};

const getAllOrders = (req, res) => {
  const sql = `
    SELECT
      orders.id,
      orders.total_amount,
      orders.delivery_address,
      orders.status,
      orders.created_at,
      users.name AS customer_name,
      users.email AS customer_email
    FROM orders
    JOIN users ON orders.user_id = users.id
    ORDER BY orders.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to fetch all orders",
      });
    }

    res.json(results);
  });
};

const updateOrderStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  const validStatuses = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      message: "Invalid order status",
    });
  }

  const sql = "UPDATE orders SET status = ? WHERE id = ?";

  db.query(sql, [status, id], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to update order status",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.json({
      message: "Order status updated successfully",
    });
  });
};

module.exports = {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
};