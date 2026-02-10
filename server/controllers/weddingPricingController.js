const db = require("../config/db");

// Auto-create wedding_albums table
db.query(`CREATE TABLE IF NOT EXISTS wedding_albums (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    photo_count INT NOT NULL DEFAULT 0,
    size VARCHAR(100),
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`, (err) => { if (err) console.error("Error creating wedding_albums table:", err); });

// Auto-create wedding_videos table
db.query(`CREATE TABLE IF NOT EXISTS wedding_videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    camera_type VARCHAR(255) NOT NULL,
    quality VARCHAR(100) NOT NULL,
    price_per_hour DECIMAL(10, 2) NOT NULL,
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`, (err) => { if (err) console.error("Error creating wedding_videos table:", err); });

// ===== ALBUMS =====
exports.getAlbums = (req, res) => {
    db.query("SELECT * FROM wedding_albums ORDER BY created_at DESC", (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching albums" });
        res.json(results);
    });
};

exports.addAlbum = (req, res) => {
    const { description, price, photo_count, size, color } = req.body;
    const query = "INSERT INTO wedding_albums (description, price, photo_count, size, color) VALUES (?, ?, ?, ?, ?)";
    db.query(query, [description, price, photo_count, size, color], (err, result) => {
        if (err) return res.status(500).json({ message: "Error adding album" });
        res.json({ id: result.insertId, message: "Album added successfully" });
    });
};

exports.updateAlbum = (req, res) => {
    const { id } = req.params;
    const { description, price, photo_count, size } = req.body;
    const query = "UPDATE wedding_albums SET description = ?, price = ?, photo_count = ?, size = ? WHERE id = ?";
    db.query(query, [description, price, photo_count, size, id], (err) => {
        if (err) return res.status(500).json({ message: "Error updating album" });
        res.json({ message: "Album updated successfully" });
    });
};

exports.deleteAlbum = (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM wedding_albums WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ message: "Error deleting album" });
        res.json({ message: "Album deleted successfully" });
    });
};

// ===== VIDEOS =====
exports.getVideos = (req, res) => {
    db.query("SELECT * FROM wedding_videos ORDER BY created_at DESC", (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching videos" });
        res.json(results);
    });
};

exports.addVideo = (req, res) => {
    const { camera_type, quality, price_per_hour, color } = req.body;
    const query = "INSERT INTO wedding_videos (camera_type, quality, price_per_hour, color) VALUES (?, ?, ?, ?)";
    db.query(query, [camera_type, quality, price_per_hour, color], (err, result) => {
        if (err) return res.status(500).json({ message: "Error adding video pricing" });
        res.json({ id: result.insertId, message: "Video pricing added successfully" });
    });
};

exports.updateVideo = (req, res) => {
    const { id } = req.params;
    const { camera_type, quality, price_per_hour } = req.body;
    const query = "UPDATE wedding_videos SET camera_type = ?, quality = ?, price_per_hour = ? WHERE id = ?";
    db.query(query, [camera_type, quality, price_per_hour, id], (err) => {
        if (err) return res.status(500).json({ message: "Error updating video pricing" });
        res.json({ message: "Video pricing updated successfully" });
    });
};

exports.deleteVideo = (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM wedding_videos WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ message: "Error deleting video pricing" });
        res.json({ message: "Video pricing deleted successfully" });
    });
};
