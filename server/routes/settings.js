const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const { authMiddleware, adminMiddleware } = require("../controllers/authController");

router.get("/", authMiddleware, settingsController.getSettings);
router.put("/", authMiddleware, adminMiddleware, settingsController.updateSettings);

module.exports = router;
