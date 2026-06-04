const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");

const { getSalesReport } = require("../controllers/reportController");

// Manager only — financial data
router.get("/sales", authenticate, authorize("manager"), getSalesReport);

module.exports = router;