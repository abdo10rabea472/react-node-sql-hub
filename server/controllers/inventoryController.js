const db = require("../config/db");

// Auto-create tables
db.query(`CREATE TABLE IF NOT EXISTS inventory_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    name_ar VARCHAR(255),
    color VARCHAR(20) DEFAULT '#6B7280',
    icon VARCHAR(50) DEFAULT 'Package',
    is_sellable TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
    if (err) console.error("Error creating inventory_categories:", err);
    else {
        // Ensure is_sellable column exists
        db.query("SHOW COLUMNS FROM inventory_categories LIKE 'is_sellable'", (err, results) => {
            if (!err && results && results.length === 0) {
                db.query("ALTER TABLE inventory_categories ADD COLUMN is_sellable TINYINT(1) DEFAULT 1");
            }
        });
        // Insert default categories
        const defaults = [
            ['frame', 'براويز', '#8B5CF6', 'Frame', 1],
            ['tableau', 'طابلو', '#10B981', 'Image', 1],
            ['expenses', 'مصاريف', '#F59E0B', 'Receipt', 0],
            ['other', 'أخرى', '#6B7280', 'Package', 1],
        ];
    }
});

db.query(`CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    category_id INT,
    quantity INT DEFAULT 0,
    unit_cost DECIMAL(10, 2) DEFAULT 0,
    sell_price DECIMAL(10, 2) DEFAULT 0,
    min_stock INT DEFAULT 5,
    supplier VARCHAR(255),
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`, (err) => {
    if (err) console.error("Error creating inventory:", err);
    else {
        const ensureCol = (col, def) => {
            db.query(`SHOW COLUMNS FROM inventory LIKE '${col}'`, (err, results) => {
                if (!err && results && results.length === 0) {
                    db.query(`ALTER TABLE inventory ADD COLUMN ${col} ${def}`);
                }
            });
        };
        ensureCol('sell_price', 'DECIMAL(10, 2) DEFAULT 0 AFTER unit_cost');
    }
});

// package_materials table removed - no longer needed

db.query(`CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_item_id INT NOT NULL,
    type ENUM('purchase', 'invoice_deduct', 'manual_adjust') NOT NULL,
    quantity INT NOT NULL,
    reference_id INT,
    reference_type VARCHAR(50),
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`, (err) => { if (err) console.error("Error creating inventory_transactions:", err); });

// ==================== Categories ====================
exports.getCategories = (req, res) => {
    db.query("SELECT * FROM inventory_categories ORDER BY id", (err, results) => {
        if (err) return res.status(500).json({ message: "خطأ في جلب الفئات" });
        res.json(results);
    });
};

exports.createCategory = (req, res) => {
    const { name, name_ar, color, icon, is_sellable } = req.body;
    if (!name) return res.status(400).json({ message: "اسم الفئة مطلوب" });
    db.query("INSERT INTO inventory_categories (name, name_ar, color, icon, is_sellable) VALUES (?, ?, ?, ?, ?)",
        [name, name_ar || name, color || '#6B7280', icon || 'Package', is_sellable !== undefined ? is_sellable : 1], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "الفئة موجودة بالفعل" });
                return res.status(500).json({ message: "خطأ في إضافة الفئة" });
            }
            res.json({ id: result.insertId, message: "تم إضافة الفئة بنجاح" });
        });
};

exports.updateCategory = (req, res) => {
    const { id } = req.params;
    const { is_sellable } = req.body;
    db.query("UPDATE inventory_categories SET is_sellable = ? WHERE id = ?", [is_sellable ? 1 : 0, id], (err) => {
        if (err) return res.status(500).json({ message: "خطأ في تحديث الفئة" });
        res.json({ message: "تم تحديث الفئة" });
    });
};

exports.deleteCategory = (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM inventory_categories WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ message: "خطأ في حذف الفئة" });
        res.json({ message: "تم حذف الفئة" });
    });
};

// ==================== Inventory Items ====================
exports.getItems = (req, res) => {
    db.query(`SELECT i.*, ic.name as category_name, ic.name_ar as category_name_ar, ic.color as category_color, ic.icon as category_icon, COALESCE(ic.is_sellable, 1) as is_sellable
              FROM inventory i LEFT JOIN inventory_categories ic ON i.category_id = ic.id
              ORDER BY i.updated_at DESC`, (err, results) => {
        if (err) return res.status(500).json({ message: "خطأ في جلب المخزون" });
        res.json(results);
    });
};

exports.getStats = (req, res) => {
    db.query(`SELECT 
        COUNT(*) as total_items,
        COALESCE(SUM(quantity * unit_cost), 0) as total_value,
        COALESCE(SUM(CASE WHEN quantity <= min_stock THEN 1 ELSE 0 END), 0) as low_stock_count,
        COALESCE(SUM(quantity), 0) as total_quantity
    FROM inventory`, (err, results) => {
        if (err) return res.status(500).json({ message: "خطأ في جلب الإحصائيات" });
        db.query(`SELECT ic.name, ic.name_ar, ic.color, COALESCE(ic.is_sellable, 1) as is_sellable, COUNT(i.id) as item_count, COALESCE(SUM(i.quantity * i.unit_cost), 0) as category_value
                  FROM inventory_categories ic LEFT JOIN inventory i ON i.category_id = ic.id
                  GROUP BY ic.id ORDER BY ic.id`, (err2, catStats) => {
            if (err2) return res.json(results[0]);
            res.json({ ...results[0], categories: catStats });
        });
    });
};

exports.createItem = (req, res) => {
    const { item_name, category_id, quantity, unit_cost, sell_price, min_stock, supplier, notes, created_by } = req.body;
    if (!item_name) return res.status(400).json({ message: "اسم الصنف مطلوب" });

    const qty = parseInt(quantity) || 0;
    const cost = parseFloat(unit_cost) || 0;
    const sell = parseFloat(sell_price) || 0;

    db.query("INSERT INTO inventory (item_name, category_id, quantity, unit_cost, sell_price, min_stock, supplier, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [item_name, category_id || null, qty, cost, sell, parseInt(min_stock) || 5, supplier || null, notes || null, created_by || 'Admin'],
        (err, result) => {
            if (err) return res.status(500).json({ message: "خطأ في إضافة الصنف" });
            if (qty > 0) {
                db.query("INSERT INTO inventory_transactions (inventory_item_id, type, quantity, notes, created_by) VALUES (?, 'purchase', ?, 'إضافة أولية', ?)",
                    [result.insertId, qty, created_by || 'Admin']);
            }
            res.json({ id: result.insertId, message: "تم إضافة الصنف بنجاح" });
        });
};

exports.updateItem = (req, res) => {
    const { id } = req.params;
    const { item_name, category_id, quantity, unit_cost, sell_price, min_stock, supplier, notes } = req.body;

    db.query("UPDATE inventory SET item_name = ?, category_id = ?, quantity = ?, unit_cost = ?, sell_price = ?, min_stock = ?, supplier = ?, notes = ? WHERE id = ?",
        [item_name, category_id || null, parseInt(quantity) || 0, parseFloat(unit_cost) || 0, parseFloat(sell_price) || 0, parseInt(min_stock) || 5, supplier || null, notes || null, id],
        (err) => {
            if (err) return res.status(500).json({ message: "خطأ في تحديث الصنف" });
            res.json({ message: "تم تحديث الصنف بنجاح" });
        });
};

exports.deleteItem = (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM inventory WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ message: "خطأ في حذف الصنف" });
        res.json({ message: "تم حذف الصنف" });
    });
};

// Add stock (purchase)
exports.addStock = (req, res) => {
    const { id } = req.params;
    const { quantity, unit_cost, supplier, notes, created_by } = req.body;
    const qty = parseInt(quantity) || 0;
    if (qty <= 0) return res.status(400).json({ message: "الكمية يجب أن تكون أكبر من صفر" });

    db.query("UPDATE inventory SET quantity = quantity + ?, unit_cost = COALESCE(?, unit_cost), supplier = COALESCE(?, supplier) WHERE id = ?",
        [qty, unit_cost ? parseFloat(unit_cost) : null, supplier || null, id], (err) => {
            if (err) return res.status(500).json({ message: "خطأ في إضافة المخزون" });
            db.query("INSERT INTO inventory_transactions (inventory_item_id, type, quantity, notes, created_by) VALUES (?, 'purchase', ?, ?, ?)",
                [id, qty, notes || 'إضافة مخزون', created_by || 'Admin']);
            res.json({ message: "تم إضافة المخزون بنجاح" });
        });
};

// Manual adjust
exports.adjustStock = (req, res) => {
    const { id } = req.params;
    const { quantity, notes, created_by } = req.body;
    const qty = parseInt(quantity);
    if (isNaN(qty)) return res.status(400).json({ message: "الكمية مطلوبة" });

    db.query("UPDATE inventory SET quantity = quantity + ? WHERE id = ?", [qty, id], (err) => {
        if (err) return res.status(500).json({ message: "خطأ في تعديل المخزون" });
        db.query("INSERT INTO inventory_transactions (inventory_item_id, type, quantity, notes, created_by) VALUES (?, 'manual_adjust', ?, ?, ?)",
            [id, qty, notes || 'تعديل يدوي', created_by || 'Admin']);
        res.json({ message: "تم تعديل المخزون" });
    });
};

// Package materials removed - no longer needed

// Get transactions history
exports.getTransactions = (req, res) => {
    const { itemId } = req.params;
    db.query(`SELECT t.*, i.item_name FROM inventory_transactions t
              JOIN inventory i ON t.inventory_item_id = i.id
              WHERE t.inventory_item_id = ? ORDER BY t.created_at DESC LIMIT 50`,
        [itemId], (err, results) => {
            if (err) return res.status(500).json({ message: "خطأ" });
            res.json(results);
        });
};
