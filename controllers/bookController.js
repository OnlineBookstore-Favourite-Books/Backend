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

module.exports = {
  addBook,
  getBooks,
};