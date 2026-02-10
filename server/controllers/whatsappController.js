const { Client, LocalAuth } = require("whatsapp-web.js");
const QRCode = require("qrcode");

let client = null;
let qrDataUrl = null;
let sessionStatus = "disconnected"; // disconnected, qr, connected, starting

// Start WhatsApp session
exports.startSession = async (req, res) => {
  if (client && sessionStatus === "connected") {
    return res.json({ status: "connected", message: "Session already active" });
  }

  // If already starting, don't create another client
  if (sessionStatus === "starting" || sessionStatus === "qr") {
    return res.json({ status: sessionStatus, qrCode: qrDataUrl, message: "Session already starting..." });
  }

  try {
    sessionStatus = "starting";
    qrDataUrl = null;

    // Destroy old client if exists
    if (client) {
      try { await client.destroy(); } catch (e) {}
      client = null;
    }

    client = new Client({
      authStrategy: new LocalAuth({ dataPath: "./whatsapp-session" }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--disable-gpu",
        ],
      },
    });

    client.on("qr", async (qr) => {
      console.log("📱 QR Code received - scan it from WhatsApp app");
      sessionStatus = "qr";
      try {
        qrDataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
      } catch (e) {
        console.error("QR generation error:", e);
      }
    });

    client.on("ready", () => {
      console.log("✅ WhatsApp client is ready!");
      sessionStatus = "connected";
      qrDataUrl = null;
    });

    client.on("authenticated", () => {
      console.log("🔐 WhatsApp authenticated");
      sessionStatus = "connected";
      qrDataUrl = null;
    });

    client.on("auth_failure", (msg) => {
      console.error("❌ WhatsApp auth failure:", msg);
      sessionStatus = "disconnected";
      qrDataUrl = null;
      client = null;
    });

    client.on("disconnected", (reason) => {
      console.log("⚠️ WhatsApp disconnected:", reason);
      sessionStatus = "disconnected";
      qrDataUrl = null;
      client = null;
    });

    client.initialize().catch((err) => {
      console.error("WhatsApp init error:", err.message);
      sessionStatus = "disconnected";
      client = null;
    });

    res.json({ status: "starting", message: "Starting WhatsApp session..." });
  } catch (err) {
    console.error("Error starting WhatsApp:", err);
    sessionStatus = "disconnected";
    res.status(500).json({ message: "Error starting WhatsApp session" });
  }
};

// Get session status and QR code
exports.getStatus = (req, res) => {
  res.json({
    status: sessionStatus,
    qrCode: qrDataUrl,
    connected: sessionStatus === "connected",
  });
};

// Stop WhatsApp session
exports.stopSession = async (req, res) => {
  try {
    if (client) {
      await client.destroy();
      client = null;
    }
    sessionStatus = "disconnected";
    qrDataUrl = null;
    res.json({ status: "disconnected", message: "Session stopped" });
  } catch (err) {
    console.error("Error stopping session:", err);
    sessionStatus = "disconnected";
    client = null;
    res.status(500).json({ message: "Error stopping session" });
  }
};

// Helper: format and validate phone number
const formatPhone = async (phone) => {
  let cleaned = phone.replace(/[^0-9]/g, "");
  // Try the number as-is
  try {
    const numberId = await client.getNumberId(cleaned + "@c.us");
    if (numberId) return numberId._serialized;
  } catch (e) {}
  // Try with country code prefixed (Egypt: 20)
  if (cleaned.startsWith("0")) {
    try {
      const withCode = "20" + cleaned.substring(1);
      const numberId = await client.getNumberId(withCode + "@c.us");
      if (numberId) return numberId._serialized;
    } catch (e) {}
  }
  return null; // Not found on WhatsApp
};

// Send text message
exports.sendMessage = async (req, res) => {
  if (!client || sessionStatus !== "connected") {
    return res.status(400).json({ message: "WhatsApp not connected" });
  }

  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ message: "Phone and message are required" });
  }

  try {
    const chatId = await formatPhone(phone);
    if (!chatId) {
      return res.status(400).json({ message: "This number is not registered on WhatsApp: " + phone });
    }
    await client.sendMessage(chatId, message);
    res.json({ success: true, message: "Message sent successfully" });
  } catch (err) {
    console.error("Error sending message:", err.message || err);
    res.status(500).json({ message: "Error sending message: " + (err.message || "Unknown error") });
  }
};

// Send invoice as formatted text message
exports.sendInvoice = async (req, res) => {
  if (!client || sessionStatus !== "connected") {
    return res.status(400).json({ message: "WhatsApp not connected" });
  }

  const { phone, invoiceText } = req.body;
  if (!phone || !invoiceText) {
    return res.status(400).json({ message: "Phone and invoice text are required" });
  }

  try {
    const chatId = await formatPhone(phone);
    if (!chatId) {
      return res.status(400).json({ message: "This number is not registered on WhatsApp: " + phone });
    }
    await client.sendMessage(chatId, invoiceText);
    res.json({ success: true, message: "Invoice sent via WhatsApp" });
  } catch (err) {
    console.error("Error sending invoice:", err.message || err);
    res.status(500).json({ message: "Error sending invoice: " + (err.message || "Unknown error") });
  }
};
