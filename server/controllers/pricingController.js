const db = require("../config/db");

// Get all packages
exports.getPackages = (req, res) => {
    db.query("SELECT * FROM pricing_packages ORDER BY created_at DESC", (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching packages" });
        // Format sizes back to array for frontend
        const formatted = results.map(pkg => ({
            ...pkg,
            sizes: pkg.sizes ? pkg.sizes.split(", ") : []
        }));
        res.json(formatted);
    });
};

// Add new package
exports.addPackage = (req, res) => {
    const { type, price, photo_count, sizes, color } = req.body;
    const sizesStr = Array.isArray(sizes) ? sizes.join(", ") : sizes;

    const query = "INSERT INTO pricing_packages (type, price, photo_count, sizes, color) VALUES (?, ?, ?, ?, ?)";
    db.query(query, [type, price, photo_count, sizesStr, color], (err, result) => {
        if (err) return res.status(500).json({ message: "Error adding package" });
        res.json({ id: result.insertId, message: "Package added successfully" });
    });
};

// Update package
exports.updatePackage = (req, res) => {
    const { id } = req.params;
    const { type, price, photo_count, sizes } = req.body;
    const sizesStr = Array.isArray(sizes) ? sizes.join(", ") : sizes;

    const query = "UPDATE pricing_packages SET type = ?, price = ?, photo_count = ?, sizes = ? WHERE id = ?";
    db.query(query, [type, price, photo_count, sizesStr, id], (err) => {
        if (err) return res.status(500).json({ message: "Error updating package" });
        res.json({ message: "Package updated successfully" });
    });
};

// Delete package
exports.deletePackage = (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM pricing_packages WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ message: "Error deleting package" });
        res.json({ message: "Package deleted successfully" });
    });
};
