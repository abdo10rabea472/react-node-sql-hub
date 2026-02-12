const express = require("express");
const router = express.Router();
const controller = require("../controllers/purchasesController");
const { authMiddleware, adminMiddleware } = require("../controllers/authController");

router.get("/", authMiddleware, controller.getPurchases);
router.get("/stats", authMiddleware, controller.getStats);
router.post("/", authMiddleware, controller.createPurchase);
router.put("/:id", authMiddleware, adminMiddleware, controller.updatePurchase);
router.delete("/:id", authMiddleware, adminMiddleware, controller.deletePurchase);

module.exports = router;
