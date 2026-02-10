const db = require("../config/db");

// Ensure wedding_packages table exists
db.query(`CREATE TABLE IF NOT EXISTS wedding_packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    includes TEXT,
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`, (err) => { if (err) console.error("Error creating wedding_packages table:", err); });

// Get all wedding packages
exports.getPackages = (req, res) => {
    db.query("SELECT * FROM wedding_packages ORDER BY created_at DESC", (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching wedding packages" });
        const formatted = results.map(pkg => ({
            ...pkg,
            includes: pkg.includes ? pkg.includes.split(", ") : []
        }));
        res.json(formatted);
    });
};

// Add new wedding package
exports.addPackage = (req, res) => {
    const { type, price, description, includes, color } = req.body;
    const includesStr = Array.isArray(includes) ? includes.join(", ") : includes;
    const query = "INSERT INTO wedding_packages (type, price, description, includes, color) VALUES (?, ?, ?, ?, ?)";
    db.query(query, [type, price, description, includesStr, color], (err, result) => {
        if (err) return res.status(500).json({ message: "Error adding wedding package" });
        res.json({ id: result.insertId, message: "Wedding package added successfully" });
    });
};

// Update wedding package
exports.updatePackage = (req, res) => {
    const { id } = req.params;
    const { type, price, description, includes } = req.body;
    const includesStr = Array.isArray(includes) ? includes.join(", ") : includes;
    const query = "UPDATE wedding_packages SET type = ?, price = ?, description = ?, includes = ? WHERE id = ?";
    db.query(query, [type, price, description, includesStr, id], (err) => {
        if (err) return res.status(500).json({ message: "Error updating wedding package" });
        res.json({ message: "Wedding package updated successfully" });
    });
};

// Delete wedding package
exports.deletePackage = (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM wedding_packages WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ message: "Error deleting wedding package" });
        res.json({ message: "Wedding package deleted successfully" });
    });
};
