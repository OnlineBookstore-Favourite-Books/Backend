const express = require("express");
const router = express.Router();
const { uploadBookCover: uploadMiddleware } = require("../middleware/upload");

const {
  uploadBookCover,
  addBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
} = require("../controllers/bookController");

router.post("/upload-cover", uploadMiddleware.single("cover"), uploadBookCover);
router.post("/", addBook);
router.get("/", getBooks);
router.get("/:id", getBookById);
router.put("/:id", updateBook);
router.delete("/:id", deleteBook);

module.exports = router;