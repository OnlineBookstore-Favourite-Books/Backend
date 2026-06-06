const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");

const {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
} = require("../controllers/cartController");

router.post("/", authenticate, addToCart);
router.get("/:user_id", authenticate, getCart);
router.put("/:id", authenticate, updateCartItem);
router.delete("/:id", authenticate, removeCartItem);

module.exports = router;