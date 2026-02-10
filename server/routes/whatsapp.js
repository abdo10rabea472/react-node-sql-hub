const express = require("express");
const router = express.Router();
const controller = require("../controllers/whatsappController");

router.post("/start", controller.startSession);
router.get("/status", controller.getStatus);
router.post("/stop", controller.stopSession);
router.post("/send-message", controller.sendMessage);
router.post("/send-invoice", controller.sendInvoice);
router.post("/send-invoice-pdf", controller.sendInvoicePDF);

module.exports = router;
