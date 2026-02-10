const db = require("../config/db");

// Basic error handling for database queries
const handleSqlError = (err, res, msg) => {
    console.error(`[SQL Error] ${msg}:`, err);
    if (res) res.status(500).json({ message: msg, error: err });
};

// Check and add columns if missing
const ensureColumnExists = (table, column, definition) => {
    db.query(`SHOW COLUMNS FROM ${table} LIKE '${column}'`, (err, results) => {
        if (err) return console.error(`Error checking ${column} in ${table}:`, err);
        if (results && results.length === 0) {
            db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (err) => {
                if (err) console.error(`Error adding ${column} to ${table}:`, err);
                else console.log(`✅ Column '${column}' added to table '${table}'`);
            });
        }
    });
};

// Initialize schema columns
ensureColumnExists('invoices', 'participants', 'TEXT');
ensureColumnExists('invoices', 'created_by', 'VARCHAR(255)');
ensureColumnExists('invoices', 'status', "ENUM('pending', 'partial', 'paid') DEFAULT 'pending'");

// Get all invoices with customer details
exports.getInvoices = (req, res) => {
    const query = `
        SELECT i.*, COALESCE(i.created_by, 'Admin') as created_by, c.name as customer_name, c.phone as customer_phone 
        FROM invoices i
        JOIN customers c ON i.customer_id = c.id
        ORDER BY i.created_at DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching invoices", error: err });
        res.json(results);
    });
};

// Get invoice details with items
exports.getInvoiceDetails = (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT i.*, it.package_name, it.price as item_price 
        FROM invoices i
        JOIN invoice_items it ON i.id = it.invoice_id
        WHERE i.id = ?
    `;
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching invoice details", error: err });
        res.json(results);
    });
};


// Create invoice with multiple items
exports.createInvoice = (req, res) => {
    const { customer_id, items, total_amount, paid_amount, created_by, participants } = req.body;
    const remaining_amount = total_amount - (parseFloat(paid_amount) || 0);
    const invoice_no = `INV-${Date.now()}`;

    // Determine status
    let status = 'pending';
    if (parseFloat(paid_amount) >= parseFloat(total_amount)) status = 'paid';
    else if (parseFloat(paid_amount) > 0) status = 'partial';

    db.getConnection((err, connection) => {
        if (err) return res.status(500).json({ message: "DB Connection Error" });

        connection.beginTransaction(err => {
            if (err) {
                connection.release();
                return res.status(500).json({ message: "Transaction Error" });
            }

            const invQuery = "INSERT INTO invoices (customer_id, invoice_no, total_amount, paid_amount, remaining_amount, created_by, participants, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            connection.query(invQuery, [customer_id, invoice_no, total_amount, paid_amount, remaining_amount, created_by, participants, status], (err, result) => {
                if (err) {
                    return connection.rollback(() => {
                        connection.release();
                        console.error("Create Invoice SQL Error:", err);
                        res.status(500).json({ message: "Error creating invoice record", error: err });
                    });
                }

                const invoice_id = result.insertId;
                const itemData = items.map(item => [invoice_id, item.id, item.type, item.price]);
                const itemQuery = "INSERT INTO invoice_items (invoice_id, package_id, package_name, price) VALUES ?";

                connection.query(itemQuery, [itemData], (err) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            res.status(500).json({ message: "Error adding invoice items", error: err });
                        });
                    }

                    connection.commit(err => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
                                res.status(500).json({ message: "Commit Error" });
                            });
                        }
                        connection.release();
                        res.json({ id: invoice_id, invoice_no, message: "Invoice created successfully" });
                    });
                });
            });
        });
    });
};

// Update invoice (paid amount / status / participants)
exports.updateInvoice = (req, res) => {
    const { id } = req.params;
    const { paid_amount, total_amount, participants } = req.body;
    const remaining_amount = parseFloat(total_amount) - (parseFloat(paid_amount) || 0);

    let status = 'pending';
    if (parseFloat(paid_amount) >= parseFloat(total_amount)) status = 'paid';
    else if (parseFloat(paid_amount) > 0) status = 'partial';

    const query = "UPDATE invoices SET paid_amount = ?, remaining_amount = ?, status = ?, participants = ? WHERE id = ?";
    db.query(query, [paid_amount, remaining_amount, status, participants, id], (err, result) => {
        if (err) {
            console.error("Update Invoice SQL Error:", err);
            return res.status(500).json({ message: "Error updating invoice", error: err });
        }
        res.json({ message: "Invoice updated successfully" });
    });
};

// Delete invoice
exports.deleteInvoice = (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM invoices WHERE id = ?", [id], (err, result) => {
        if (err) {
            console.error("Delete Invoice SQL Error:", err);
            return res.status(500).json({ message: "Error deleting invoice", error: err });
        }
        res.json({ message: "Invoice deleted successfully" });
    });
};
