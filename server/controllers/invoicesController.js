const db = require("../config/db");
const { deductForInvoice } = require("./inventoryController");

// Safe column check using whitelisted values only
const ALLOWED_TABLES = ['invoices', 'wedding_invoices', 'wedding_invoice_items', 'studio_settings'];
const ensureColumnExists = (table, column, definition) => {
    if (!ALLOWED_TABLES.includes(table)) {
        console.error(`Table '${table}' not in whitelist`);
        return;
    }
    // Use parameterized LIKE for column name
    db.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column], (err, results) => {
        if (err) return console.error(`Error checking ${column} in ${table}:`, err);
        if (results && results.length === 0) {
            // Definition is hardcoded, not user input - safe to interpolate
            db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`, (err) => {
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
        if (err) {
            console.error("[Invoices] Fetch error:", err);
            return res.status(500).json({ message: "خطأ في جلب الفواتير" });
        }
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
        if (err) {
            console.error("[Invoices] Details error:", err);
            return res.status(500).json({ message: "خطأ في جلب تفاصيل الفاتورة" });
        }
        res.json(results);
    });
};

// Create invoice with multiple items
exports.createInvoice = (req, res) => {
    const { customer_id, items, total_amount, paid_amount, created_by, participants } = req.body;
    const remaining_amount = total_amount - (parseFloat(paid_amount) || 0);
    const invoice_no = `INV-${Date.now()}`;

    let status = 'pending';
    if (parseFloat(paid_amount) >= parseFloat(total_amount)) status = 'paid';
    else if (parseFloat(paid_amount) > 0) status = 'partial';

    db.getConnection((err, connection) => {
        if (err) {
            console.error("[Invoices] Connection error:", err);
            return res.status(500).json({ message: "خطأ في الاتصال بقاعدة البيانات" });
        }

        connection.beginTransaction(err => {
            if (err) {
                connection.release();
                console.error("[Invoices] Transaction error:", err);
                return res.status(500).json({ message: "خطأ في بدء العملية" });
            }

            const invQuery = "INSERT INTO invoices (customer_id, invoice_no, total_amount, paid_amount, remaining_amount, created_by, participants, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            connection.query(invQuery, [customer_id, invoice_no, total_amount, paid_amount, remaining_amount, created_by, participants, status], (err, result) => {
                if (err) {
                    console.error("[Invoices] Create error:", err);
                    return connection.rollback(() => {
                        connection.release();
                        res.status(500).json({ message: "خطأ في إنشاء الفاتورة" });
                    });
                }

                const invoice_id = result.insertId;
                const itemData = items.map(item => [invoice_id, item.id, item.type, item.price]);
                const itemQuery = "INSERT INTO invoice_items (invoice_id, package_id, package_name, price) VALUES ?";

                connection.query(itemQuery, [itemData], (err) => {
                    if (err) {
                        console.error("[Invoices] Items error:", err);
                        return connection.rollback(() => {
                            connection.release();
                            res.status(500).json({ message: "خطأ في إضافة عناصر الفاتورة" });
                        });
                    }

                    connection.commit(err => {
                        if (err) {
                            console.error("[Invoices] Commit error:", err);
                            return connection.rollback(() => {
                                connection.release();
                                res.status(500).json({ message: "خطأ في حفظ الفاتورة" });
                            });
                        }
                        connection.release();
                        // Deduct inventory
                        deductForInvoice(invoice_id, 'studio', items, created_by);
                        res.json({ id: invoice_id, invoice_no, message: "Invoice created successfully" });
                    });
                });
            });
        });
    });
};

// Update invoice
exports.updateInvoice = (req, res) => {
    const { id } = req.params;
    const { paid_amount, total_amount, participants } = req.body;
    const remaining_amount = parseFloat(total_amount) - (parseFloat(paid_amount) || 0);

    let status = 'pending';
    if (parseFloat(paid_amount) >= parseFloat(total_amount)) status = 'paid';
    else if (parseFloat(paid_amount) > 0) status = 'partial';

    const query = "UPDATE invoices SET paid_amount = ?, remaining_amount = ?, status = ?, participants = ? WHERE id = ?";
    db.query(query, [paid_amount, remaining_amount, status, participants, id], (err) => {
        if (err) {
            console.error("[Invoices] Update error:", err);
            return res.status(500).json({ message: "خطأ في تحديث الفاتورة" });
        }
        res.json({ message: "Invoice updated successfully" });
    });
};

// Delete invoice
exports.deleteInvoice = (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM invoices WHERE id = ?", [id], (err) => {
        if (err) {
            console.error("[Invoices] Delete error:", err);
            return res.status(500).json({ message: "خطأ في حذف الفاتورة" });
        }
        res.json({ message: "Invoice deleted successfully" });
    });
};
