const db = require("../config/db");

// Auto-create tables
db.query(`CREATE TABLE IF NOT EXISTS inventory_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    name_ar VARCHAR(255),
    color VARCHAR(20) DEFAULT '#6B7280',
    icon VARCHAR(50) DEFAULT 'Package',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
    if (err) console.error("Error creating inventory_categories:", err);
    else {
        // Insert default categories
        const defaults = [
            ['frame', 'براويز', '#8B5CF6', 'Frame'],
            ['paper', 'ورق', '#0EA5E9', 'FileText'],
            ['ink', 'أحبار', '#F59E0B', 'Droplets'],
            ['tableau', 'طابلو', '#10B981', 'Image'],
            ['other', 'أخرى', '#6B7280', 'Package'],
        ];
        defaults.forEach(([name, name_ar, color, icon]) => {
            db.query("INSERT IGNORE INTO inventory_categories (name, name_ar, color, icon) VALUES (?, ?, ?, ?)", [name, name_ar, color, icon]);
        });
    }
});

db.query(`CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    category_id INT,
    quantity INT DEFAULT 0,
    unit_cost DECIMAL(10, 2) DEFAULT 0,
    min_stock INT DEFAULT 5,
    supplier VARCHAR(255),
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`, (err) => { if (err) console.error("Error creating inventory:", err); });

db.query(`CREATE TABLE IF NOT EXISTS package_materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    package_id INT NOT NULL,
    package_type ENUM('studio', 'wedding_album', 'wedding_video') DEFAULT 'studio',
    inventory_item_id INT NOT NULL,
    quantity_needed INT DEFAULT 1,
    UNIQUE KEY unique_pkg_item (package_id, package_type, inventory_item_id)
)`, (err) => { if (err) console.error("Error creating package_materials:", err); });

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
    const { name, name_ar, color, icon } = req.body;
    if (!name) return res.status(400).json({ message: "اسم الفئة مطلوب" });
    db.query("INSERT INTO inventory_categories (name, name_ar, color, icon) VALUES (?, ?, ?, ?)",
        [name, name_ar || name, color || '#6B7280', icon || 'Package'], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "الفئة موجودة بالفعل" });
                return res.status(500).json({ message: "خطأ في إضافة الفئة" });
            }
            res.json({ id: result.insertId, message: "تم إضافة الفئة بنجاح" });
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
    db.query(`SELECT i.*, ic.name as category_name, ic.name_ar as category_name_ar, ic.color as category_color, ic.icon as category_icon
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
        // Also get per-category stats
        db.query(`SELECT ic.name, ic.name_ar, ic.color, COUNT(i.id) as item_count, COALESCE(SUM(i.quantity * i.unit_cost), 0) as category_value
                  FROM inventory_categories ic LEFT JOIN inventory i ON i.category_id = ic.id
                  GROUP BY ic.id ORDER BY ic.id`, (err2, catStats) => {
            if (err2) return res.json(results[0]);
            res.json({ ...results[0], categories: catStats });
        });
    });
};

exports.createItem = (req, res) => {
    const { item_name, category_id, quantity, unit_cost, min_stock, supplier, notes, created_by } = req.body;
    if (!item_name) return res.status(400).json({ message: "اسم الصنف مطلوب" });

    const qty = parseInt(quantity) || 0;
    const cost = parseFloat(unit_cost) || 0;

    db.query("INSERT INTO inventory (item_name, category_id, quantity, unit_cost, min_stock, supplier, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [item_name, category_id || null, qty, cost, parseInt(min_stock) || 5, supplier || null, notes || null, created_by || 'Admin'],
        (err, result) => {
            if (err) return res.status(500).json({ message: "خطأ في إضافة الصنف" });
            // Record transaction
            if (qty > 0) {
                db.query("INSERT INTO inventory_transactions (inventory_item_id, type, quantity, notes, created_by) VALUES (?, 'purchase', ?, 'إضافة أولية', ?)",
                    [result.insertId, qty, created_by || 'Admin']);
            }
            res.json({ id: result.insertId, message: "تم إضافة الصنف بنجاح" });
        });
};

exports.updateItem = (req, res) => {
    const { id } = req.params;
    const { item_name, category_id, quantity, unit_cost, min_stock, supplier, notes } = req.body;

    db.query("UPDATE inventory SET item_name = ?, category_id = ?, quantity = ?, unit_cost = ?, min_stock = ?, supplier = ?, notes = ? WHERE id = ?",
        [item_name, category_id || null, parseInt(quantity) || 0, parseFloat(unit_cost) || 0, parseInt(min_stock) || 5, supplier || null, notes || null, id],
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

// ==================== Package Materials ====================
exports.getPackageMaterials = (req, res) => {
    const { packageId, packageType } = req.params;
    db.query(`SELECT pm.*, i.item_name, ic.name_ar as category_name
              FROM package_materials pm
              JOIN inventory i ON pm.inventory_item_id = i.id
              LEFT JOIN inventory_categories ic ON i.category_id = ic.id
              WHERE pm.package_id = ? AND pm.package_type = ?`,
        [packageId, packageType || 'studio'], (err, results) => {
            if (err) return res.status(500).json({ message: "خطأ في جلب المواد" });
            res.json(results);
        });
};

exports.setPackageMaterials = (req, res) => {
    const { packageId, packageType } = req.params;
    const { materials } = req.body; // [{inventory_item_id, quantity_needed}]

    db.query("DELETE FROM package_materials WHERE package_id = ? AND package_type = ?", [packageId, packageType || 'studio'], (err) => {
        if (err) return res.status(500).json({ message: "خطأ" });
        if (!materials || materials.length === 0) return res.json({ message: "تم حفظ المواد" });

        const values = materials.map(m => [packageId, packageType || 'studio', m.inventory_item_id, m.quantity_needed || 1]);
        db.query("INSERT INTO package_materials (package_id, package_type, inventory_item_id, quantity_needed) VALUES ?", [values], (err) => {
            if (err) return res.status(500).json({ message: "خطأ في حفظ المواد" });
            res.json({ message: "تم حفظ المواد بنجاح" });
        });
    });
};

// ==================== Deduct inventory for invoice ====================
exports.deductForInvoice = (invoiceId, invoiceType, items, createdBy, callback) => {
    // items: [{id (package_id), type}]
    // For each package, find its materials and deduct from inventory
    const packageType = invoiceType === 'wedding' ? 'wedding_album' : 'studio';

    // Collect all package IDs
    const pkgIds = items.map(i => i.id).filter(Boolean);
    if (pkgIds.length === 0) return callback && callback();

    // Also handle video type
    const allQueries = [];
    items.forEach(item => {
        let pType = packageType;
        if (item.type === 'video') pType = 'wedding_video';
        allQueries.push({ packageId: item.id, packageType: pType });
    });

    let processed = 0;
    allQueries.forEach(({ packageId, packageType: pType }) => {
        db.query("SELECT * FROM package_materials WHERE package_id = ? AND package_type = ?", [packageId, pType], (err, materials) => {
            if (err || !materials || materials.length === 0) {
                processed++;
                if (processed === allQueries.length && callback) callback();
                return;
            }
            materials.forEach(mat => {
                const deductQty = mat.quantity_needed;
                db.query("UPDATE inventory SET quantity = GREATEST(0, quantity - ?) WHERE id = ?", [deductQty, mat.inventory_item_id]);
                db.query("INSERT INTO inventory_transactions (inventory_item_id, type, quantity, reference_id, reference_type, notes, created_by) VALUES (?, 'invoice_deduct', ?, ?, ?, ?, ?)",
                    [mat.inventory_item_id, -deductQty, invoiceId, invoiceType, `خصم تلقائي - فاتورة #${invoiceId}`, createdBy || 'Admin']);
            });
            processed++;
            if (processed === allQueries.length && callback) callback();
        });
    });
};

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
