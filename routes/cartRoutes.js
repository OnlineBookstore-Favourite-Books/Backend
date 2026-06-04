const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");

const {
  addToCart,
  getCart,
  removeCartItem,
} = require("../controllers/cartController");

router.post("/", authenticate, addToCart);
router.get("/:user_id", authenticate, getCart);
router.delete("/:id", authenticate, removeCartItem);

module.exports = router;