const express = require("express");
const router = express.Router();

const {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

router.post("/", createOrder);
router.get("/", getAllOrders);
router.get("/user/:user_id", getUserOrders);
router.put("/:id/status", updateOrderStatus);

module.exports = router;