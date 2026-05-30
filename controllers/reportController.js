const db = require("../config/db");

const getSalesReport = (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM orders) AS total_orders,
      (SELECT IFNULL(SUM(total_amount), 0) FROM orders) AS total_revenue,
      (SELECT IFNULL(SUM(quantity), 0) FROM order_items) AS total_books_sold
  `;

  db.query(sql, (err, summaryResults) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to generate sales report",
      });
    }

    const topBooksSql = `
      SELECT
        title,
        author,
        SUM(quantity) AS total_sold
      FROM order_items
      GROUP BY title, author
      ORDER BY total_sold DESC
      LIMIT 5
    `;

    db.query(topBooksSql, (topBooksErr, topBooksResults) => {
      if (topBooksErr) {
        return res.status(500).json({
          message: "Failed to fetch top books",
        });
      }

      return res.json({
        summary: summaryResults[0],
        top_books: topBooksResults,
      });
    });
  });
};

module.exports = {
  getSalesReport,
};
