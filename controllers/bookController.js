const db = require("../config/db");

const uploadBookCover = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "Cover image is required",
    });
  }

  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/book-covers/${req.file.filename}`;

  return res.status(201).json({
    message: "Cover image uploaded successfully",
    image_url: imageUrl,
  });
};

// Add new book
const addBook = (req, res) => {
  const {
    title,
    author,
    isbn,
    description,
    price,
    image_url,
    genre,
    stock_quantity,
  } = req.body;

  const sql = `
    INSERT INTO books 
    (title, author, isbn, description, price, image_url, genre, stock_quantity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [title, author, isbn, description, price, image_url, genre, stock_quantity],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to add book" });
      }

      res.status(201).json({ message: "Book added successfully" });
    }
  );
};

// Get all books
const getBooks = (req, res) => {
  const { search, genre } = req.query;

  let sql = "SELECT * FROM books WHERE 1=1";
  const params = [];

  if (search) {
    sql += " AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (genre) {
    sql += " AND genre = ?";
    params.push(genre);
  }

  sql += " ORDER BY title";

  db.query(sql, params, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to fetch books",
      });
    }

    res.json(results);
  });
};
// Get single book
const getBookById = (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT * FROM books WHERE id = ?",
    [id],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          message: "Failed to fetch book",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: "Book not found",
        });
      }

      res.json(results[0]);
    }
  );
};

// Update book
const updateBook = (req, res) => {
  const { id } = req.params;

  const {
    title,
    author,
    isbn,
    description,
    price,
    image_url,
    genre,
    stock_quantity,
  } = req.body;

  const sql = `
    UPDATE books
    SET
      title = ?,
      author = ?,
      isbn = ?,
      description = ?,
      price = ?,
      image_url = ?,
      genre = ?,
      stock_quantity = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      title,
      author,
      isbn,
      description,
      price,
      image_url,
      genre,
      stock_quantity,
      id,
    ],
    (err) => {
      if (err) {
        return res.status(500).json({
          message: "Failed to update book",
        });
      }

      res.json({
        message: "Book updated successfully",
      });
    }
  );
};

// Update book stock only
const updateBookStock = (req, res) => {
  const { id } = req.params;
  const { stock_quantity } = req.body;

  if (stock_quantity === undefined || stock_quantity === null) {
    return res.status(400).json({
      message: "Stock quantity is required.",
    });
  }

  const quantity = Number(stock_quantity);
  if (Number.isNaN(quantity) || quantity < 0) {
    return res.status(400).json({
      message: "Stock quantity must be a number greater than or equal to 0.",
    });
  }

  const sql = `
    UPDATE books
    SET stock_quantity = ?
    WHERE id = ?
  `;

  db.query(sql, [quantity, id], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to update stock quantity",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    res.json({
      message: "Stock quantity updated successfully",
      stock_quantity: quantity,
    });
  });
};

// Delete book
const deleteBook = (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM books WHERE id = ?",
    [id],
    (err) => {
      if (err) {
        return res.status(500).json({
          message: "Failed to delete book",
        });
      }

      res.json({
        message: "Book deleted successfully",
      });
    }
  );
};

module.exports = {
  uploadBookCover,
  addBook,
  getBooks,
  getBookById,
  updateBook,
  updateBookStock,
  deleteBook,
};