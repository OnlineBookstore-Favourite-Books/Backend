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

    const outOfStock = cartItems.filter(item => item.quantity > item.stock_quantity);
    if (outOfStock.length > 0) {
      const details = outOfStock.map(item =>
        `"${item.title}" (requested ${item.quantity}, only ${item.stock_quantity} in stock)`
      ).join(", ");
      return res.status(400).json({ message: `Some items exceed available stock: ${details}` });
    }

    const totalAmount = cartItems.reduce((total, item) => {
      return total + Number(item.price) * item.quantity;
    }, 0);

    const orderSql = `
      INSERT INTO orders (user_id, total_amount, delivery_address, status)
      VALUES (?, ?, ?, 'pending')
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

        // Once an online order is placed, clear the cart. Payment confirmation is handled by staff/manager.
        db.query("DELETE FROM cart_items WHERE user_id = ?", [user_id], (clearErr) => {
          if (clearErr) {
            return res.status(500).json({ message: "Order created but failed to clear cart" });
          }

          res.status(201).json({
            message: "Order placed and awaiting payment confirmation",
            order_id: orderId,
            total_amount: totalAmount,
            delivery_address,
            payment_status: "pending",
          });
        });
      });
    });
  });
};

const confirmPayment = (req, res) => {
  const { id } = req.params;

  const orderSql = `
    SELECT orders.id, orders.user_id, orders.status,
           order_items.book_id, order_items.quantity
    FROM orders
    JOIN order_items ON order_items.order_id = orders.id
    WHERE orders.id = ?
  `;

  db.query(orderSql, [id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Failed to fetch order" });
    if (rows.length === 0) return res.status(404).json({ message: "Order not found" });
    if (rows[0].status !== "pending") return res.status(400).json({ message: "Order is not pending" });

    const userId = rows[0].user_id;
    const items = rows.map(r => ({ book_id: r.book_id, quantity: r.quantity }));

    // Re-validate stock before confirming
    const bookIds = items.map(i => i.book_id);
    const stockSql = `SELECT id, title, stock_quantity FROM books WHERE id IN (?)`;

    db.query(stockSql, [bookIds], (err, books) => {
      if (err) return res.status(500).json({ message: "Failed to check stock" });

      const stockMap = Object.fromEntries(books.map(b => [b.id, b]));
      const overStock = items.filter(i => i.quantity > stockMap[i.book_id].stock_quantity);

      if (overStock.length > 0) {
        const details = overStock.map(i =>
          `"${stockMap[i.book_id].title}" (only ${stockMap[i.book_id].stock_quantity} in stock)`
        ).join(", ");
        return res.status(400).json({ message: `Stock changed since order was created: ${details}` });
      }

      // Mark order as paid
      db.query("UPDATE orders SET status = 'paid' WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ message: "Failed to confirm payment" });

        // Decrement stock
        const stockUpdates = items.map(item =>
          new Promise((resolve, reject) => {
            db.query(
              "UPDATE books SET stock_quantity = stock_quantity - ? WHERE id = ?",
              [item.quantity, item.book_id],
              (err) => err ? reject(err) : resolve()
            );
          })
        );

        Promise.all(stockUpdates).then(() => {
          const receiptSql = `
            SELECT orders.id, orders.total_amount, orders.delivery_address,
                   users.name AS customer_name, users.email AS customer_email
            FROM orders
            JOIN users ON orders.user_id = users.id
            WHERE orders.id = ?
          `;
          db.query(receiptSql, [id], (err, receiptRows) => {
            if (err || receiptRows.length === 0) {
              return res.json({ message: "Payment confirmed successfully" });
            }
            const r = receiptRows[0];
            res.json({
              message: "Payment confirmed successfully",
              order_id: id,
              total_amount: r.total_amount,
              delivery_address: r.delivery_address,
              customer_name: r.customer_name,
              customer_email: r.customer_email,
              notifications: {
                receipt: `[PLACEHOLDER] Receipt email would be sent to: ${r.customer_email}`,
                store: `[PLACEHOLDER] Order notification would be sent to: store@favouritebooks.com`,
              },
            });
          });
        }).catch(() => {
          res.status(500).json({ message: "Payment confirmed but stock update failed" });
        });
      });
    });
  });
};

const createInStoreOrder = (req, res) => {
  const { items } = req.body;
  const staffUserId = req.user.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "No items provided" });
  }

  const totalAmount = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const orderSql = `
    INSERT INTO orders (user_id, total_amount, delivery_address, status)
    VALUES (?, ?, 'In-Store Purchase', 'delivered')
  `;

  db.query(orderSql, [staffUserId, totalAmount], (err, result) => {
    if (err) return res.status(500).json({ message: "Failed to create order" });

    const orderId = result.insertId;

    const orderItems = items.map(item => [
      orderId, item.id, item.title, item.author, item.price, item.quantity
    ]);

    db.query(
      "INSERT INTO order_items (order_id, book_id, title, author, price, quantity) VALUES ?",
      [orderItems],
      (err) => {
        if (err) return res.status(500).json({ message: "Failed to create order items" });

        const stockUpdates = items.map(item =>
          new Promise((resolve, reject) => {
            db.query(
              "UPDATE books SET stock_quantity = stock_quantity - ? WHERE id = ?",
              [item.quantity, item.id],
              (err) => err ? reject(err) : resolve()
            );
          })
        );

        Promise.all(stockUpdates)
          .then(() => res.status(201).json({ message: "In-store order recorded", order_id: orderId, total_amount: totalAmount }))
          .catch(() => res.status(201).json({ message: "In-store order recorded (stock update failed)", order_id: orderId, total_amount: totalAmount }));
      }
    );
  });
};

const cancelPendingOrder = (req, res) => {
  const { id } = req.params;
  db.query(
    "DELETE FROM orders WHERE id = ? AND status = 'pending'",
    [id],
    (err) => {
      if (err) return res.status(500).json({ message: "Failed to cancel order" });
      res.json({ message: "Order cancelled" });
    }
  );
};

const getUserOrders = (req, res) => {
  const { user_id } = req.params;

  if (Number(user_id) !== req.user.id) {
    return res.status(403).json({ message: "Forbidden. You cannot view another user's orders." });
  }

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
      orders.user_id,
      orders.total_amount,
      orders.delivery_address,
      orders.status,
      orders.courier_id,
      CASE
        WHEN orders.delivery_address = 'In-Store Purchase' THEN 'In-Store POS'
        ELSE 'Online Card'
      END AS payment_method,
      CASE
        WHEN orders.delivery_address = 'In-Store Purchase' THEN CONCAT('POS-', orders.id)
        ELSE CONCAT('WEB-', orders.id)
      END AS payment_reference,
      CASE
        WHEN orders.status = 'pending' THEN 'Awaiting Confirmation'
        ELSE 'Confirmed'
      END AS payment_status,
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
  const { status, courier_id } = req.body || {};

  const validStatuses = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      message: "Invalid order status",
    });
  }

  const sql = courier_id
    ? "UPDATE orders SET status = ?, courier_id = ? WHERE id = ?"
    : "UPDATE orders SET status = ? WHERE id = ?";

  const params = courier_id ? [status, courier_id, id] : [status, id];

  db.query(sql, params, (err, result) => {
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

const getOrderById = (req, res) => {
  const { id } = req.params;

  const orderSql = `
    SELECT
      orders.id,
      orders.user_id,
      orders.total_amount,
      orders.delivery_address,
      orders.status,
      orders.courier_id,
      CASE
        WHEN orders.delivery_address = 'In-Store Purchase' THEN 'In-Store POS'
        ELSE 'Online Card'
      END AS payment_method,
      CASE
        WHEN orders.delivery_address = 'In-Store Purchase' THEN CONCAT('POS-', orders.id)
        ELSE CONCAT('WEB-', orders.id)
      END AS payment_reference,
      CASE
        WHEN orders.status = 'pending' THEN 'Awaiting Confirmation'
        ELSE 'Confirmed'
      END AS payment_status,
      orders.created_at,
      users.name AS customer_name,
      users.email AS customer_email
    FROM orders
    JOIN users ON orders.user_id = users.id
    WHERE orders.id = ?
  `;

  db.query(orderSql, [id], (err, orderResults) => {
    if (err) return res.status(500).json({ message: "Failed to fetch order" });
    if (orderResults.length === 0) return res.status(404).json({ message: "Order not found" });

    const order = orderResults[0];

    const itemsSql = `
      SELECT book_id, title, author, price, quantity
      FROM order_items
      WHERE order_id = ?
    `;

    db.query(itemsSql, [id], (err, items) => {
      if (err) return res.status(500).json({ message: "Failed to fetch order items" });

      res.json({ ...order, items });
    });
  });
};

module.exports = {
  createOrder,
  confirmPayment,
  createInStoreOrder,
  cancelPendingOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
};