const mysql = require("mysql2");

const poolConfig = {
    host: "localhost",
    user: "root",
    password: "",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create a connection without a database selected first to ensure the DB exists
const db = mysql.createPool({ ...poolConfig, database: "studio" });

const schemas = [
    `CREATE TABLE IF NOT EXISTS pricing_packages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        cost_price DECIMAL(10, 2) DEFAULT 0,
        photo_count INT NOT NULL,
        sizes TEXT,
        color VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS studio_settings (
        id INT PRIMARY KEY DEFAULT 1,
        studio_name VARCHAR(255) DEFAULT 'STODIO Photography',
        email VARCHAR(255),
        address TEXT,
        phone VARCHAR(50),
        admin_name VARCHAR(255),
        currency VARCHAR(10) DEFAULT 'SAR',
        language VARCHAR(5) DEFAULT 'ar',
        theme VARCHAR(10) DEFAULT 'light',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CHECK (id = 1)
    )`,
    `CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        invoice_no VARCHAR(50) UNIQUE NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        paid_amount DECIMAL(10, 2) DEFAULT 0,
        remaining_amount DECIMAL(10, 2) DEFAULT 0,
        created_by VARCHAR(255),
        participants TEXT,
        status ENUM('draft', 'paid', 'pending', 'partial') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS invoice_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        package_id INT,
        package_name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        cost_price DECIMAL(10, 2) DEFAULT 0,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
        FOREIGN KEY (package_id) REFERENCES pricing_packages(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS purchases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_name VARCHAR(255) NOT NULL,
        category ENUM('frame', 'paper', 'ink', 'tableau', 'other') NOT NULL,
        quantity INT DEFAULT 1,
        unit_cost DECIMAL(10, 2) NOT NULL,
        total_cost DECIMAL(10, 2) NOT NULL,
        supplier VARCHAR(255),
        notes TEXT,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `INSERT IGNORE INTO studio_settings (id, studio_name, currency, language, theme) 
     VALUES (1, 'STODIO Photography', 'SAR', 'ar', 'light')`
];

// Initialize Tables sequentially
let completed = 0;
schemas.forEach((sql, idx) => {
    db.query(sql, (err) => {
        if (err) console.error(`❌ Schema init error (${idx}):`, err.message);
        completed++;
        if (completed === schemas.length) {
            console.log("✅ Database Tables Initialized Automatically");
            // Run migrations after tables are ready
            const migrations = [
                "ALTER TABLE invoices ADD COLUMN paid_amount DECIMAL(10, 2) DEFAULT 0",
                "ALTER TABLE invoices ADD COLUMN remaining_amount DECIMAL(10, 2) DEFAULT 0",
                "ALTER TABLE invoices ADD COLUMN created_by VARCHAR(255)",
                "ALTER TABLE invoices ADD COLUMN participants TEXT",
                "ALTER TABLE invoices MODIFY COLUMN status ENUM('draft','paid','pending','partial') DEFAULT 'pending'",
                "ALTER TABLE pricing_packages ADD COLUMN cost_price DECIMAL(10, 2) DEFAULT 0",
                "ALTER TABLE invoice_items ADD COLUMN cost_price DECIMAL(10, 2) DEFAULT 0",
            ];
            migrations.forEach(mig => {
                db.query(mig, (err) => {
                    if (err && err.errno !== 1060) console.error("Migration warning:", err.message);
                });
            });
        }
    });
});

module.exports = db;

