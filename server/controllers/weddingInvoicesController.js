const db = require("../config/db");

// Safe column check
const ALLOWED_TABLES = ['wedding_invoices', 'wedding_invoice_items'];
const ensureColumnExists = (table, column, definition) => {
    if (!ALLOWED_TABLES.includes(table)) return;
    db.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column], (err, results) => {
        if (err) return console.error(`Error checking ${column} in ${table}:`, err);
        if (results && results.length === 0) {
            db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`, (err) => {
                if (err) console.error(`Error adding ${column} to ${table}:`, err);
                else console.log(`✅ Column '${column}' added to table '${table}'`);
            });
        }
    });
};

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
)`, (err) => {
    if (err) console.error("Error creating wedding_invoices table:", err);
    else {
        ensureColumnExists('wedding_invoices', 'created_by', 'VARCHAR(255)');
        ensureColumnExists('wedding_invoices', 'venue', 'VARCHAR(255)');
        ensureColumnExists('wedding_invoices', 'notes', 'TEXT');
    }
});

db.query(`CREATE TABLE IF NOT EXISTS wedding_invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    package_id INT,
    package_name VARCHAR(255),
    item_type VARCHAR(50) DEFAULT 'album',
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10, 2),
    price DECIMAL(10, 2),
    FOREIGN KEY (invoice_id) REFERENCES wedding_invoices(id) ON DELETE CASCADE
)`, (err) => {
    if (err) console.error("Error creating wedding_invoice_items table:", err);
    else {
        ensureColumnExists('wedding_invoice_items', 'item_type', "VARCHAR(50) DEFAULT 'album'");
        ensureColumnExists('wedding_invoice_items', 'quantity', "INT DEFAULT 1");
        ensureColumnExists('wedding_invoice_items', 'unit_price', "DECIMAL(10, 2)");
    }
});

// Get all wedding invoices
exports.getInvoices = (req, res) => {
    const query = `
        SELECT wi.*, c.name as customer_name, c.phone as customer_phone 
        FROM wedding_invoices wi
        JOIN customers c ON wi.customer_id = c.id
        ORDER BY wi.created_at DESC
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error("[Wedding Invoices] Fetch error:", err);
            return res.status(500).json({ message: "خطأ في جلب فواتير الأفراح" });
        }
        res.json(results);
    });
};

// Get wedding invoice details
exports.getInvoiceDetails = (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT wit.package_name, wit.price as item_price, wit.item_type, wit.quantity, wit.unit_price
        FROM wedding_invoice_items wit
        WHERE wit.invoice_id = ?
    `;
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error("[Wedding Invoices] Details error:", err);
            return res.status(500).json({ message: "خطأ في جلب تفاصيل الفاتورة" });
        }
        res.json(results);
    });
};

// Create wedding invoice
exports.createInvoice = (req, res) => {
    const { customer_id, items, total_amount, paid_amount, created_by, wedding_date, venue, notes } = req.body;

    const total = parseFloat(total_amount) || 0;
    const paid = parseFloat(paid_amount) || 0;
    const remaining_amount = total - paid;
    const invoice_no = `WED-${Date.now()}`;
    const cleanWeddingDate = wedding_date && wedding_date.trim() !== '' ? wedding_date : null;

    let status = 'pending';
    if (paid >= total) status = 'paid';
    else if (paid > 0) status = 'partial';

    db.getConnection((err, connection) => {
        if (err) {
            console.error("[Wedding Invoices] Connection error:", err);
            return res.status(500).json({ message: "خطأ في الاتصال بقاعدة البيانات" });
        }

        connection.beginTransaction(err => {
            if (err) { connection.release(); return res.status(500).json({ message: "خطأ في بدء العملية" }); }

            const invQuery = "INSERT INTO wedding_invoices (customer_id, invoice_no, total_amount, paid_amount, remaining_amount, created_by, wedding_date, venue, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            connection.query(invQuery, [customer_id, invoice_no, total, paid, remaining_amount, created_by, cleanWeddingDate, venue, notes, status], (err, result) => {
                if (err) {
                    console.error("[Wedding Invoices] Create error:", err);
                    return connection.rollback(() => { connection.release(); res.status(500).json({ message: "خطأ في إنشاء الفاتورة" }); });
                }

                const invoice_id = result.insertId;
                const itemData = items.map(item => [
                    invoice_id,
                    item.id || null,
                    item.package_name || item.description || 'Item',
                    item.type || item.item_type || 'album',
                    item.quantity || 1,
                    parseFloat(item.unit_price || item.price) || 0,
                    parseFloat(item.price) || 0
                ]);
                const itemQuery = "INSERT INTO wedding_invoice_items (invoice_id, package_id, package_name, item_type, quantity, unit_price, price) VALUES ?";

                connection.query(itemQuery, [itemData], (err) => {
                    if (err) {
                        console.error("[Wedding Invoices] Items error:", err);
                        return connection.rollback(() => { connection.release(); res.status(500).json({ message: "خطأ في إضافة عناصر الفاتورة" }); });
                    }

                    connection.commit(err => {
                        if (err) { return connection.rollback(() => { connection.release(); res.status(500).json({ message: "خطأ في حفظ الفاتورة" }); }); }
                        connection.release();
                        console.log("✅ Wedding Invoice Created:", invoice_no);
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

    const total = parseFloat(total_amount) || 0;
    const paid = parseFloat(paid_amount) || 0;
    const remaining_amount = total - paid;
    const cleanWeddingDate = wedding_date && wedding_date.trim() !== '' ? wedding_date : null;

    let status = 'pending';
    if (paid >= total) status = 'paid';
    else if (paid > 0) status = 'partial';

    const query = "UPDATE wedding_invoices SET paid_amount = ?, remaining_amount = ?, status = ?, wedding_date = ?, venue = ?, notes = ? WHERE id = ?";
    db.query(query, [paid, remaining_amount, status, cleanWeddingDate, venue, notes, id], (err) => {
        if (err) {
            console.error("[Wedding Invoices] Update error:", err);
            return res.status(500).json({ message: "خطأ في تحديث الفاتورة" });
        }
        res.json({ message: "Wedding invoice updated successfully" });
    });
};

// Delete wedding invoice
exports.deleteInvoice = (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM wedding_invoices WHERE id = ?", [id], (err) => {
        if (err) {
            console.error("[Wedding Invoices] Delete error:", err);
            return res.status(500).json({ message: "خطأ في حذف الفاتورة" });
        }
        res.json({ message: "Wedding invoice deleted successfully" });
    });
};
