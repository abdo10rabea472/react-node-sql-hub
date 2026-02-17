const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const app = express();
app.use(cors());
app.use(express.json());

let client = null;
let currentQR = null;
let status = 'disconnected'; // disconnected | starting | qr | connected

function createClient() {
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: '../_IGNORE_studio-whatsapp' }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    }
  });

  client.on('qr', async (qr) => {
    console.log('QR Code received');
    status = 'qr';
    try {
      currentQR = await qrcode.toDataURL(qr, { width: 300, margin: 2 });
    } catch (err) {
      console.error('QR generation error:', err);
    }
  });

  client.on('ready', () => {
    console.log('WhatsApp client is ready!');
    status = 'connected';
    currentQR = null;
  });

  client.on('authenticated', () => {
    console.log('WhatsApp authenticated');
    status = 'connected';
    currentQR = null;
  });

  client.on('auth_failure', (msg) => {
    console.error('Auth failure:', msg);
    status = 'disconnected';
    currentQR = null;
    client = null;
  });

  client.on('disconnected', (reason) => {
    console.log('WhatsApp disconnected:', reason);
    status = 'disconnected';
    currentQR = null;
    client = null;
  });
}

// Routes
app.get('/status', (req, res) => {
  res.json({
    connected: status === 'connected',
    status: status,
    qrCode: currentQR
  });
});

app.post('/start', async (req, res) => {
  if (status === 'connected') {
    return res.json({ connected: true, status: 'connected', message: 'Already connected' });
  }

  if (status === 'starting') {
    return res.json({ connected: false, status: 'starting', qrCode: currentQR, message: 'Already starting...' });
  }

  try {
    status = 'starting';
    currentQR = null;
    createClient();
    client.initialize();

    // Wait a bit for QR to generate
    await new Promise(resolve => setTimeout(resolve, 5000));

    res.json({
      connected: status === 'connected',
      status: status,
      qrCode: currentQR,
      message: status === 'qr' ? 'Scan the QR code' : 'Starting...'
    });
  } catch (err) {
    console.error('Start error:', err);
    status = 'disconnected';
    res.status(500).json({ connected: false, status: 'disconnected', message: err.message });
  }
});

app.post('/stop', async (req, res) => {
  try {
    if (client) {
      await client.destroy();
      client = null;
    }
    status = 'disconnected';
    currentQR = null;
    res.json({ connected: false, status: 'disconnected', message: 'Disconnected' });
  } catch (err) {
    console.error('Stop error:', err);
    status = 'disconnected';
    currentQR = null;
    client = null;
    res.json({ connected: false, status: 'disconnected', message: 'Disconnected' });
  }
});

app.post('/send-message', async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ success: false, message: 'Phone and message required' });
  }

  if (status !== 'connected' || !client) {
    return res.status(400).json({ success: false, message: 'WhatsApp not connected' });
  }

  try {
    // Clean phone number and format for WhatsApp
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const chatId = cleanPhone + '@c.us';
    await client.sendMessage(chatId, message);
    res.json({ success: true, message: 'Message sent' });
  } catch (err) {
    console.error('Send error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`WhatsApp server running on http://localhost:${PORT}`);
});
