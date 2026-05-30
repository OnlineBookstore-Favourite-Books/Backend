const express = require("express");
const router = express.Router();

const {
  createOrder,
  getUserOrders,
} = require("../controllers/orderController");

router.post("/", createOrder);
router.get("/user/:user_id", getUserOrders);

module.exports = router;