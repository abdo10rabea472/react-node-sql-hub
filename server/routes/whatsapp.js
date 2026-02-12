const express = require("express");
const router = express.Router();
const controller = require("../controllers/whatsappController");
const { authMiddleware, adminMiddleware } = require("../controllers/authController");

router.post("/start", authMiddleware, adminMiddleware, controller.startSession);
router.get("/status", authMiddleware, controller.getStatus);
router.post("/stop", authMiddleware, adminMiddleware, controller.stopSession);
router.post("/send-message", authMiddleware, controller.sendMessage);
router.post("/send-invoice", authMiddleware, controller.sendInvoice);
router.post("/send-invoice-pdf", authMiddleware, controller.sendInvoicePDF);

module.exports = router;
