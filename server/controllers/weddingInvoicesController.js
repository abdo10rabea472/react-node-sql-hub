const db = require("../config/db");

// Ensure wedding tables exist
db.query(`CREATE TABLE IF NOT EXISTS wedding_invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    invoice_no VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    remaining_amount DECIMAL(10, 2) DEFAULT 0,
    created_by VARCHAR(255),
    wedding_date DATE,
    venue VARCHAR(255),
    notes TEXT,
    status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
)`, (err) => { if (err) console.error("Error creating wedding_invoices table:", err); });

db.query(`CREATE TABLE IF NOT EXISTS wedding_invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    package_id INT,
    package_name VARCHAR(255),
    price DECIMAL(10, 2),
    FOREIGN KEY (invoice_id) REFERENCES wedding_invoices(id) ON DELETE CASCADE
)`, (err) => { if (err) console.error("Error creating wedding_invoice_items table:", err); });

// Get all wedding invoices
exports.getInvoices = (req, res) => {
    const query = `
        SELECT wi.*, c.name as customer_name, c.phone as customer_phone 
        FROM wedding_invoices wi
        JOIN customers c ON wi.customer_id = c.id
        ORDER BY wi.created_at DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching wedding invoices", error: err });
        res.json(results);
    });
};

// Get wedding invoice details
exports.getInvoiceDetails = (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT wi.*, wit.package_name, wit.price as item_price 
        FROM wedding_invoices wi
        JOIN wedding_invoice_items wit ON wi.id = wit.invoice_id
        WHERE wi.id = ?
    `;
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching wedding invoice details", error: err });
        res.json(results);
    });
};

// Create wedding invoice
exports.createInvoice = (req, res) => {
    const { customer_id, items, total_amount, paid_amount, created_by, wedding_date, venue, notes } = req.body;
    const remaining_amount = total_amount - (parseFloat(paid_amount) || 0);
    const invoice_no = `WED-${Date.now()}`;

    let status = 'pending';
    if (parseFloat(paid_amount) >= parseFloat(total_amount)) status = 'paid';
    else if (parseFloat(paid_amount) > 0) status = 'partial';

    db.getConnection((err, connection) => {
        if (err) return res.status(500).json({ message: "DB Connection Error" });

        connection.beginTransaction(err => {
            if (err) { connection.release(); return res.status(500).json({ message: "Transaction Error" }); }

            const invQuery = "INSERT INTO wedding_invoices (customer_id, invoice_no, total_amount, paid_amount, remaining_amount, created_by, wedding_date, venue, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            connection.query(invQuery, [customer_id, invoice_no, total_amount, paid_amount, remaining_amount, created_by, wedding_date, venue, notes, status], (err, result) => {
                if (err) {
                    return connection.rollback(() => { connection.release(); res.status(500).json({ message: "Error creating wedding invoice", error: err }); });
                }

                const invoice_id = result.insertId;
                const itemData = items.map(item => [invoice_id, item.id, item.type, item.price]);
                const itemQuery = "INSERT INTO wedding_invoice_items (invoice_id, package_id, package_name, price) VALUES ?";

                connection.query(itemQuery, [itemData], (err) => {
                    if (err) {
                        return connection.rollback(() => { connection.release(); res.status(500).json({ message: "Error adding wedding invoice items", error: err }); });
                    }

                    connection.commit(err => {
                        if (err) { return connection.rollback(() => { connection.release(); res.status(500).json({ message: "Commit Error" }); }); }
                        connection.release();
                        res.json({ id: invoice_id, invoice_no, message: "Wedding invoice created successfully" });
                    });
                });
            });
        });
    });
};

// Update wedding invoice
exports.updateInvoice = (req, res) => {
    const { id } = req.params;
    const { paid_amount, total_amount, wedding_date, venue, notes } = req.body;
    const remaining_amount = parseFloat(total_amount) - (parseFloat(paid_amount) || 0);

    let status = 'pending';
    if (parseFloat(paid_amount) >= parseFloat(total_amount)) status = 'paid';
    else if (parseFloat(paid_amount) > 0) status = 'partial';

    const query = "UPDATE wedding_invoices SET paid_amount = ?, remaining_amount = ?, status = ?, wedding_date = ?, venue = ?, notes = ? WHERE id = ?";
    db.query(query, [paid_amount, remaining_amount, status, wedding_date, venue, notes, id], (err) => {
        if (err) return res.status(500).json({ message: "Error updating wedding invoice", error: err });
        res.json({ message: "Wedding invoice updated successfully" });
    });
};

// Delete wedding invoice
exports.deleteInvoice = (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM wedding_invoices WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ message: "Error deleting wedding invoice", error: err });
        res.json({ message: "Wedding invoice deleted successfully" });
    });
};
