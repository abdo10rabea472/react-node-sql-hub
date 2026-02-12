const db = require("../config/db");

// Get all purchases
exports.getPurchases = (req, res) => {
    db.query("SELECT * FROM purchases ORDER BY created_at DESC", (err, results) => {
        if (err) {
            console.error("[Purchases] Fetch error:", err);
            return res.status(500).json({ message: "خطأ في جلب المشتريات" });
        }
        res.json(results);
    });
};

// Get purchases stats
exports.getStats = (req, res) => {
    const query = `
        SELECT 
            COUNT(*) as total_purchases,
            COALESCE(SUM(total_cost), 0) as total_spent,
            COALESCE(SUM(CASE WHEN category = 'frame' THEN total_cost ELSE 0 END), 0) as frames_cost,
            COALESCE(SUM(CASE WHEN category = 'paper' THEN total_cost ELSE 0 END), 0) as paper_cost,
            COALESCE(SUM(CASE WHEN category = 'ink' THEN total_cost ELSE 0 END), 0) as ink_cost,
            COALESCE(SUM(CASE WHEN category = 'tableau' THEN total_cost ELSE 0 END), 0) as tableau_cost,
            COALESCE(SUM(CASE WHEN category = 'other' THEN total_cost ELSE 0 END), 0) as other_cost
        FROM purchases
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error("[Purchases] Stats error:", err);
            return res.status(500).json({ message: "خطأ في جلب الإحصائيات" });
        }
        res.json(results[0]);
    });
};

// Create purchase
exports.createPurchase = (req, res) => {
    const { item_name, category, quantity, unit_cost, supplier, notes, created_by } = req.body;
    if (!item_name || !category || !unit_cost) {
        return res.status(400).json({ message: "الاسم والفئة والسعر مطلوبين" });
    }
    const qty = parseInt(quantity) || 1;
    const cost = parseFloat(unit_cost) || 0;
    const total_cost = qty * cost;

    db.query(
        "INSERT INTO purchases (item_name, category, quantity, unit_cost, total_cost, supplier, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [item_name, category, qty, cost, total_cost, supplier || null, notes || null, created_by || 'Admin'],
        (err, result) => {
            if (err) {
                console.error("[Purchases] Create error:", err);
                return res.status(500).json({ message: "خطأ في إضافة المشتريات" });
            }
            res.json({ id: result.insertId, message: "تم إضافة المشتريات بنجاح" });
        }
    );
};

// Update purchase
exports.updatePurchase = (req, res) => {
    const { id } = req.params;
    const { item_name, category, quantity, unit_cost, supplier, notes } = req.body;
    const qty = parseInt(quantity) || 1;
    const cost = parseFloat(unit_cost) || 0;
    const total_cost = qty * cost;

    db.query(
        "UPDATE purchases SET item_name = ?, category = ?, quantity = ?, unit_cost = ?, total_cost = ?, supplier = ?, notes = ? WHERE id = ?",
        [item_name, category, qty, cost, total_cost, supplier || null, notes || null, id],
        (err) => {
            if (err) {
                console.error("[Purchases] Update error:", err);
                return res.status(500).json({ message: "خطأ في تحديث المشتريات" });
            }
            res.json({ message: "تم تحديث المشتريات بنجاح" });
        }
    );
};

// Delete purchase
exports.deletePurchase = (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM purchases WHERE id = ?", [id], (err) => {
        if (err) {
            console.error("[Purchases] Delete error:", err);
            return res.status(500).json({ message: "خطأ في حذف المشتريات" });
        }
        res.json({ message: "تم حذف المشتريات بنجاح" });
    });
};
