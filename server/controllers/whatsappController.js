const { create } = require("@open-wa/wa-automate");

let client = null;
let qrCode = null;
let sessionStatus = "disconnected"; // disconnected, qr, connected

// Start WhatsApp session
exports.startSession = async (req, res) => {
  if (client && sessionStatus === "connected") {
    return res.json({ status: "connected", message: "Session already active" });
  }

  try {
    sessionStatus = "starting";
    qrCode = null;

    create({
      sessionId: "studio-whatsapp",
      multiDevice: true,
      authTimeout: 60,
      qrTimeout: 0,
      cacheEnabled: false,
      headless: true,
      qrRefreshS: 15,
      logConsole: false,
      popup: false,
    })
      .then((waClient) => {
        client = waClient;
        sessionStatus = "connected";
        qrCode = null;

        // Listen for QR code
        waClient.onStateChanged((state) => {
          if (state === "CONFLICT" || state === "UNLAUNCHED") {
            sessionStatus = "disconnected";
            client = null;
          }
        });
      })
      .catch((err) => {
        console.error("WhatsApp session error:", err);
        sessionStatus = "disconnected";
      });

    // Wait a moment then check for QR
    setTimeout(async () => {
      if (!client && sessionStatus === "starting") {
        sessionStatus = "qr";
      }
    }, 5000);

    res.json({ status: "starting", message: "Starting WhatsApp session..." });
  } catch (err) {
    console.error("Error starting WhatsApp:", err);
    res.status(500).json({ message: "Error starting WhatsApp session" });
  }
};

// Get session status and QR code
exports.getStatus = (req, res) => {
  res.json({
    status: sessionStatus,
    qrCode: qrCode,
    connected: sessionStatus === "connected",
  });
};

// Stop WhatsApp session
exports.stopSession = async (req, res) => {
  try {
    if (client) {
      await client.kill();
      client = null;
    }
    sessionStatus = "disconnected";
    qrCode = null;
    res.json({ status: "disconnected", message: "Session stopped" });
  } catch (err) {
    console.error("Error stopping session:", err);
    res.status(500).json({ message: "Error stopping session" });
  }
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
    // Format phone number (remove + and add @c.us)
    const formattedPhone = phone.replace(/[^0-9]/g, "") + "@c.us";
    await client.sendText(formattedPhone, message);
    res.json({ success: true, message: "Message sent successfully" });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ message: "Error sending message" });
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
    const formattedPhone = phone.replace(/[^0-9]/g, "") + "@c.us";
    await client.sendText(formattedPhone, invoiceText);
    res.json({ success: true, message: "Invoice sent via WhatsApp" });
  } catch (err) {
    console.error("Error sending invoice:", err);
    res.status(500).json({ message: "Error sending invoice via WhatsApp" });
  }
};
