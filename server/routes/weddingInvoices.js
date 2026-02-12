const express = require("express");
const router = express.Router();
const controller = require("../controllers/weddingInvoicesController");
const { authMiddleware } = require("../controllers/authController");

router.get("/", authMiddleware, controller.getInvoices);
router.get("/:id", authMiddleware, controller.getInvoiceDetails);
router.post("/", authMiddleware, controller.createInvoice);
router.put("/:id", authMiddleware, controller.updateInvoice);
router.delete("/:id", authMiddleware, controller.deleteInvoice);

module.exports = router;
