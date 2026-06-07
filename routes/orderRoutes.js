const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");

const {
  createOrder,
  confirmPayment,
  createInStoreOrder,
  cancelPendingOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} = require("../controllers/orderController");

// Any logged in user — place an order or view own history
router.post("/", authenticate, createOrder);
router.post("/instore", authenticate, authorize("staff", "manager"), createInStoreOrder);
router.post("/:id/confirm-payment", authenticate, authorize("staff", "manager"), confirmPayment);
router.delete("/:id/cancel", authenticate, cancelPendingOrder);
router.get("/user/:user_id", authenticate, getUserOrders);

// Staff and manager only — operational order management
router.get("/", authenticate, authorize("staff", "manager"), getAllOrders);
router.put("/:id/status", authenticate, authorize("staff", "manager"), updateOrderStatus);
// Authenticated users — customers can view their own orders, staff/managers can view any
router.get("/:id", authenticate, getOrderById);

module.exports = router;