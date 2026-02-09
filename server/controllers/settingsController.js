const db = require("../config/db");

// Get settings
exports.getSettings = (req, res) => {
    db.query("SELECT * FROM studio_settings WHERE id = 1", (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching settings" });
        res.json(results[0]);
    });
};

// Update settings
exports.updateSettings = (req, res) => {
    const { studio_name, email, address, phone, admin_name, currency, language, theme } = req.body;

    const query = `
        UPDATE studio_settings 
        SET studio_name = ?, email = ?, address = ?, phone = ?, admin_name = ?, 
            currency = ?, language = ?, theme = ? 
        WHERE id = 1
    `;

    db.query(query, [studio_name, email, address, phone, admin_name, currency, language, theme], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error updating settings" });
        }
        res.json({ message: "Settings updated successfully" });
    });
};
