const express = require("express");
const router = express.Router();
const invoicesController = require("../controllers/invoicesController");

router.get("/", invoicesController.getInvoices);
router.get("/:id", invoicesController.getInvoiceDetails);
router.post("/", invoicesController.createInvoice);
router.put("/:id", invoicesController.updateInvoice);
router.delete("/:id", invoicesController.deleteInvoice);


module.exports = router;
