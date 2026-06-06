const express = require("express");
const router = express.Router();
const { uploadBookCover: uploadMiddleware } = require("../middleware/upload");
const { authenticate, authorize } = require("../middleware/auth");

const {
  uploadBookCover,
  addBook,
  getBooks,
  getBookById,
  updateBook,
  updateBookStock,
  deleteBook,
} = require("../controllers/bookController");

// Public — customers browse without an account
router.get("/", getBooks);
router.get("/:id", getBookById);

// Manager only — catalogue management
router.post("/upload-cover", authenticate, authorize("manager"), uploadMiddleware.single("cover"), uploadBookCover);
router.post("/", authenticate, authorize("manager"), addBook);
router.put("/:id", authenticate, authorize("manager"), updateBook);
router.patch("/:id/stock", authenticate, authorize("staff", "manager"), updateBookStock);
router.delete("/:id", authenticate, authorize("manager"), deleteBook);

module.exports = router;