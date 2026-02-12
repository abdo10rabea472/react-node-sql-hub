const express = require("express");
const router = express.Router();
const invoicesController = require("../controllers/invoicesController");
const { authMiddleware } = require("../controllers/authController");

router.get("/", authMiddleware, invoicesController.getInvoices);
router.get("/:id", authMiddleware, invoicesController.getInvoiceDetails);
router.post("/", authMiddleware, invoicesController.createInvoice);
router.put("/:id", authMiddleware, invoicesController.updateInvoice);
router.delete("/:id", authMiddleware, invoicesController.deleteInvoice);

module.exports = router;
