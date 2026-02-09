const express = require("express");
const router = express.Router();
const customersController = require("../controllers/customersController");

router.get("/", customersController.getCustomers);
router.post("/", customersController.addCustomer);
router.delete("/:id", customersController.deleteCustomer);

module.exports = router;
