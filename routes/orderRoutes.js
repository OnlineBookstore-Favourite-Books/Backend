const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");

const {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} = require("../controllers/orderController");

// Any logged in user — place an order or view own history
router.post("/", authenticate, createOrder);
router.get("/user/:user_id", authenticate, getUserOrders);

// Staff and manager only — operational order management
router.get("/", authenticate, authorize("staff", "manager"), getAllOrders);
router.get("/:id", authenticate, authorize("staff", "manager"), getOrderById);
router.put("/:id/status", authenticate, authorize("staff", "manager"), updateOrderStatus);

module.exports = router;