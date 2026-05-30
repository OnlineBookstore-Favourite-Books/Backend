const db = require("../config/db");

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
  const sql = "SELECT * FROM books";

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Failed to fetch books" });
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
  addBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
};