const express = require("express");
const router = express.Router();
const controller = require("../controllers/inventoryController");
const { authMiddleware, adminMiddleware } = require("../controllers/authController");

// Categories
router.get("/categories", authMiddleware, controller.getCategories);
router.post("/categories", authMiddleware, controller.createCategory);
router.delete("/categories/:id", authMiddleware, adminMiddleware, controller.deleteCategory);

// Items
router.get("/", authMiddleware, controller.getItems);
router.get("/stats", authMiddleware, controller.getStats);
router.post("/", authMiddleware, controller.createItem);
router.put("/:id", authMiddleware, controller.updateItem);
router.delete("/:id", authMiddleware, adminMiddleware, controller.deleteItem);

// Stock operations
router.post("/:id/add-stock", authMiddleware, controller.addStock);
router.post("/:id/adjust", authMiddleware, controller.adjustStock);

// Package materials
router.get("/materials/:packageId/:packageType", authMiddleware, controller.getPackageMaterials);
router.post("/materials/:packageId/:packageType", authMiddleware, controller.setPackageMaterials);

// Transactions
router.get("/transactions/:itemId", authMiddleware, controller.getTransactions);

module.exports = router;
