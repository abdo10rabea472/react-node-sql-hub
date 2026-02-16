const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

console.log("Starting WhatsApp Server...");

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let qrCodeData = null;
let isConnected = false;
let isStarting = false;

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    // Convert QR text to Data URL (image)
    qrcode.toDataURL(qr, (err, url) => {
        if (!err) {
            qrCodeData = url;
            isStarting = false;
        }
    });
});

client.on('ready', () => {
    console.log('Client is ready!');
    isConnected = true;
    qrCodeData = null;
    isStarting = false;
});

client.on('authenticated', () => {
    console.log('Client is authenticated!');
    isConnected = true;
    isStarting = false;
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
    isConnected = false;
    isStarting = false;
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
    isConnected = false;
    qrCodeData = null;
    isStarting = false;
    // Client.destroy/initialize logic can be added here if needed to auto-restart
});

// API Routes
app.post('/start', async (req, res) => {
    if (isConnected) {
        return res.json({ status: 'connected', connected: true, message: 'Already connected' });
    }

    if (!isStarting) {
        isStarting = true;
        try {
            await client.initialize();
        } catch (error) {
            // If already initialized, just continue
            console.log("Client initialize error (might be already active):", error.message);
        }
    }

    res.json({ status: 'starting', connected: false, message: 'Session initializing...' });
});

app.get('/status', (req, res) => {
    if (isConnected) {
        return res.json({ connected: true, status: 'connected', message: 'WhatsApp is ready' });
    }
    if (qrCodeData) {
        return res.json({ connected: false, status: 'qr', qrCode: qrCodeData, message: 'Scan QR Code' });
    }
    if (isStarting) {
        return res.json({ connected: false, status: 'starting', message: 'Initializing...' });
    }
    return res.json({ connected: false, status: 'disconnected', message: 'Disconnected' });
});

app.post('/stop', async (req, res) => {
    try {
        await client.logout();
        await client.destroy();
    } catch (e) {
        console.error("Logout error:", e.message);
    }
    isConnected = false;
    qrCodeData = null;
    isStarting = false;
    res.json({ success: true, message: 'Session stopped' });
});

// Send Message Endpoint
app.post('/send-message', async (req, res) => {
    const { phone, message } = req.body;

    // Proper Try-Catch to prevent crash
    try {
        if (!isConnected) {
            return res.status(400).json({ error: 'WhatsApp is not connected' });
        }

        // Sanitize phone number
        let number = phone.toString().replace(/\D/g, '');

        // Strictly fix Egyptian Numbers
        if (number.startsWith('01') && number.length === 11) {
            number = '2' + number;
        }
        if (number.startsWith('00')) {
            number = number.substring(2);
        }
        if (number.length === 10 && number.startsWith('1')) {
            number = '20' + number;
        }

        console.log(`Processing Number: ${number}`);

        let chatId;

        try {
            // Attempt to resolve ID
            const contact = await client.getNumberId(number);
            if (contact && contact._serialized) {
                chatId = contact._serialized;
                console.log(`Resolved ID: ${chatId}`);
            }
        } catch (idErr) {
            console.error("ID Resolution Failed:", idErr.message);
        }

        // Fallback ID
        if (!chatId) {
            chatId = number + "@c.us";
            console.log(`Using Fallback ID: ${chatId}`);
        }

        await client.sendMessage(chatId, message);
        console.log(`Message sent successfully to ${chatId}`);
        res.json({ success: true, message: 'Message sent' });

    } catch (error) {
        console.error("SEND ERROR:", error.message);
        // Do not crash, send error response
        res.status(500).json({ error: 'Failed to send message: ' + error.message });
    }
});

app.listen(PORT, () => {
    console.log(`WhatsApp Server running on port ${PORT}`);
});
