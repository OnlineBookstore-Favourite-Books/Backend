const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");

const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
} = require("../controllers/userController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/:id", authenticate, getProfile);
router.put("/:id", authenticate, updateProfile);

module.exports = router;