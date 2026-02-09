const express = require("express");
const router = express.Router();
const pricingController = require("../controllers/pricingController");

router.get("/", pricingController.getPackages);
router.post("/", pricingController.addPackage);
router.put("/:id", pricingController.updatePackage);
router.delete("/:id", pricingController.deletePackage);

module.exports = router;
