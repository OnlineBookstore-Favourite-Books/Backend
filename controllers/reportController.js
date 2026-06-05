const db = require("../config/db");

const getSalesReport = (req, res) => {
  const { start_date, end_date } = req.query;

  const hasDate = start_date && end_date;

  // Date-only filter (used for status breakdown and individual sales)
  const dateFilter = hasDate
    ? "WHERE orders.created_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)"
    : "";
  const dateParams = hasDate ? [start_date, end_date] : [];

  // Paid+delivered filter (used for revenue/chart queries)
  const revenueFilter = hasDate
    ? "WHERE orders.created_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY) AND orders.status IN ('paid','delivered')"
    : "WHERE orders.status IN ('paid','delivered')";
  const revenueParams = hasDate ? [start_date, end_date] : [];

  const summarySql = `
    SELECT
      COUNT(DISTINCT orders.id) AS total_orders,
      IFNULL(SUM(orders.total_amount), 0) AS total_revenue,
      IFNULL(SUM(order_items.quantity), 0) AS total_books_sold
    FROM orders
    LEFT JOIN order_items ON order_items.order_id = orders.id
    ${revenueFilter}
  `;

  db.query(summarySql, revenueParams, (err, summaryResults) => {
    if (err) return res.status(500).json({ message: "Failed to generate sales report" });

    const statusBreakdownSql = `
      SELECT
        SUM(CASE WHEN orders.status IN ('paid','delivered') THEN 1 ELSE 0 END) AS concluded,
        SUM(CASE WHEN orders.status IN ('pending','processing','shipped') THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN orders.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
      FROM orders
      ${dateFilter}
    `;

    db.query(statusBreakdownSql, dateParams, (breakdownErr, breakdownResults) => {
      if (breakdownErr) return res.status(500).json({ message: "Failed to fetch status breakdown" });

      const topBooksSql = `
        SELECT
          order_items.title,
          order_items.author,
          SUM(order_items.quantity) AS total_sold
        FROM order_items
        JOIN orders ON order_items.order_id = orders.id
        ${revenueFilter}
        GROUP BY order_items.title, order_items.author
        ORDER BY total_sold DESC
        LIMIT 5
      `;

      db.query(topBooksSql, revenueParams, (topBooksErr, topBooksResults) => {
        if (topBooksErr) return res.status(500).json({ message: "Failed to fetch top books" });

        const genreSql = `
          SELECT
            books.genre,
            SUM(order_items.quantity) AS total_sold,
            SUM(order_items.quantity * order_items.price) AS total_revenue
          FROM order_items
          JOIN orders ON order_items.order_id = orders.id
          JOIN books ON order_items.book_id = books.id
          ${revenueFilter}
          GROUP BY books.genre
          ORDER BY total_sold DESC
        `;

        db.query(genreSql, revenueParams, (genreErr, genreResults) => {
          if (genreErr) return res.status(500).json({ message: "Failed to fetch genre sales" });

          const monthlySql = `
            SELECT
              DATE_FORMAT(orders.created_at, '%b %Y') AS month_label,
              DATE_FORMAT(orders.created_at, '%Y-%m') AS month_sort,
              IFNULL(SUM(orders.total_amount), 0) AS revenue,
              IFNULL(SUM(order_items.quantity), 0) AS books_sold,
              COUNT(DISTINCT orders.id) AS completed_orders
            FROM orders
            LEFT JOIN order_items ON order_items.order_id = orders.id
            ${revenueFilter}
            GROUP BY month_sort, month_label
            ORDER BY month_sort ASC
          `;

          db.query(monthlySql, revenueParams, (monthlyErr, monthlyResults) => {
            if (monthlyErr) return res.status(500).json({ message: "Failed to fetch monthly sales" });

            const topAuthorsSql = `
              SELECT
                order_items.author,
                SUM(order_items.quantity) AS total_sold
              FROM order_items
              JOIN orders ON order_items.order_id = orders.id
              ${revenueFilter}
              GROUP BY order_items.author
              ORDER BY total_sold DESC
              LIMIT 5
            `;

            db.query(topAuthorsSql, revenueParams, (authorsErr, authorsResults) => {
              if (authorsErr) return res.status(500).json({ message: "Failed to fetch top authors" });

              const individualSalesSql = `
                SELECT
                  orders.id AS order_id,
                  DATE_FORMAT(orders.created_at, '%d/%m/%Y %H:%i') AS order_date,
                  orders.user_id,
                  order_items.title,
                  order_items.author,
                  order_items.quantity,
                  order_items.price AS unit_price,
                  (order_items.quantity * order_items.price) AS line_total,
                  orders.status
                FROM orders
                JOIN order_items ON order_items.order_id = orders.id
                ${dateFilter}
                ORDER BY orders.created_at ASC, orders.id ASC
              `;

              db.query(individualSalesSql, dateParams, (salesErr, salesResults) => {
                if (salesErr) return res.status(500).json({ message: "Failed to fetch individual sales" });

                return res.json({
                  summary: summaryResults[0],
                  status_breakdown: breakdownResults[0],
                  top_books: topBooksResults,
                  genre_sales: genreResults,
                  monthly_sales: monthlyResults,
                  top_authors: authorsResults,
                  individual_sales: salesResults,
                });
              });
            });
          });
        });
      });
    });
  });
};

module.exports = {
  getSalesReport,
};
