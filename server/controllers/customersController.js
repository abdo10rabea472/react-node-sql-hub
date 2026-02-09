const db = require("../config/db");

// Get all customers
exports.getCustomers = (req, res) => {
    db.query("SELECT * FROM customers ORDER BY name ASC", (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching customers" });
        res.json(results);
    });
};

// Add customer (with check for existing phone)
exports.addCustomer = (req, res) => {
    const { name, phone, email, address } = req.body;

    // Check if phone exists
    db.query("SELECT id FROM customers WHERE phone = ?", [phone], (err, results) => {
        if (err) return res.status(500).json({ message: "Error checking customer" });

        if (results.length > 0) {
            // Found existing
            return res.json({ id: results[0].id, message: "Customer already exists with this phone", existed: true });
        }

        // Add new
        db.query(
            "INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)",
            [name, phone, email, address],
            (err, result) => {
                if (err) return res.status(500).json({ message: "Error adding customer" });
                res.json({ id: result.insertId, message: "Customer added successfully", existed: false });
            }
        );
    });
};


// Delete customer
exports.deleteCustomer = (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM customers WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ message: "Error deleting customer" });
        res.json({ message: "Customer deleted successfully" });
    });
};
