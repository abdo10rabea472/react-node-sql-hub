const express = require("express");
const router = express.Router();
const pricingController = require("../controllers/pricingController");
const { authMiddleware, adminMiddleware } = require("../controllers/authController");

router.get("/", authMiddleware, pricingController.getPackages);
router.post("/", authMiddleware, adminMiddleware, pricingController.addPackage);
router.put("/:id", authMiddleware, adminMiddleware, pricingController.updatePackage);
router.delete("/:id", authMiddleware, adminMiddleware, pricingController.deletePackage);

module.exports = router;
