const express = require("express");
const router = express.Router();
const customersController = require("../controllers/customersController");
const { authMiddleware } = require("../controllers/authController");

router.get("/", authMiddleware, customersController.getCustomers);
router.post("/", authMiddleware, customersController.addCustomer);
router.put("/:id", authMiddleware, customersController.updateCustomer);
router.delete("/:id", authMiddleware, customersController.deleteCustomer);

module.exports = router;
