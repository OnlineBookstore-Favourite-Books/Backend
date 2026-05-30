const express = require("express");
const router = express.Router();

const {
  addToCart,
  getCart,
  removeCartItem,
} = require("../controllers/cartController");

router.post("/", addToCart);
router.get("/:user_id", getCart);
router.delete("/:id", removeCartItem);

module.exports = router;