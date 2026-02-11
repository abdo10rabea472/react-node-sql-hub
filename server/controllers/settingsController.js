const db = require("../config/db");

// Ensure country_code column exists
db.query("SHOW COLUMNS FROM studio_settings LIKE 'country_code'", (err, results) => {
    if (!err && results && results.length === 0) {
        db.query("ALTER TABLE studio_settings ADD COLUMN country_code VARCHAR(10) DEFAULT '966'", (err) => {
            if (err) console.error("Error adding country_code:", err);
            else console.log("✅ Column 'country_code' added to studio_settings");
        });
    }
});

// Get settings
exports.getSettings = (req, res) => {
    db.query("SELECT * FROM studio_settings WHERE id = 1", (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching settings" });
        res.json(results[0]);
    });
};

// Update settings
exports.updateSettings = (req, res) => {
    const { studio_name, email, address, phone, admin_name, currency, language, theme, country_code } = req.body;

    const query = `
        UPDATE studio_settings 
        SET studio_name = ?, email = ?, address = ?, phone = ?, admin_name = ?, 
            currency = ?, language = ?, theme = ?, country_code = ?
        WHERE id = 1
    `;

    db.query(query, [studio_name, email, address, phone, admin_name, currency, language, theme, country_code || '966'], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error updating settings" });
        }
        res.json({ message: "Settings updated successfully" });
    });
};
