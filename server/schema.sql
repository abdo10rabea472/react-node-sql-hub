-- Database for Studio
CREATE DATABASE IF NOT EXISTS studio;
USE studio;

-- Pricing Packages Table
CREATE TABLE IF NOT EXISTS pricing_packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    photo_count INT NOT NULL,
    sizes TEXT, -- Stored as comma-separated or JSON
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Studio Settings Table
CREATE TABLE IF NOT EXISTS studio_settings (
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
    CHECK (id = 1) -- Only one settings row
);

-- Insert default settings if not exists
INSERT IGNORE INTO studio_settings (id, studio_name, currency, language, theme) 
VALUES (1, 'STODIO Photography', 'SAR', 'ar', 'light');

-- Insert some dummy packages
INSERT IGNORE INTO pricing_packages (type, price, photo_count, sizes, color) 
VALUES 
('بورتريه', 299.00, 10, '4x6 prints, Digital High-Res', '#4F46E5'),
('عائلي', 499.00, 20, '8x10 premium, Digital Gallery', '#10B981');
