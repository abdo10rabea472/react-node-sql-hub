const express = require("express");
const router = express.Router();
const controller = require("../controllers/weddingInvoicesController");

router.get("/", controller.getInvoices);
router.get("/:id", controller.getInvoiceDetails);
router.post("/", controller.createInvoice);
router.put("/:id", controller.updateInvoice);
router.delete("/:id", controller.deleteInvoice);

module.exports = router;
