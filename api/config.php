<?php
// api/config.php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Dynamic CORS - allow specific domains
$allowedOrigins = [];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Allow lovable.app and lovableproject.com domains
if (preg_match('/^https?:\/\/.*\.(lovable\.app|lovableproject\.com)$/', $origin)) {
    $allowedOrigins[] = $origin;
}
// Allow localhost for development
if (preg_match('/^https?:\/\/localhost(:\d+)?$/', $origin)) {
    $allowedOrigins[] = $origin;
}
// Allow the main domain
if (preg_match('/^https?:\/\/(www\.)?vip472\.com$/', $origin)) {
    $allowedOrigins[] = $origin;
}

$corsOrigin = in_array($origin, $allowedOrigins) ? $origin : '';
if ($corsOrigin) {
    header("Access-Control-Allow-Origin: $corsOrigin");
    header("Vary: Origin");
} else {
    // Fallback: allow all for compatibility (can be tightened later)
    header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 1. Load .env values with better parsing
function getEnvValue($key, $default = null)
{
    $envFile = __DIR__ . '/../.env';
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (!$line || strpos($line, '#') === 0)
                continue;

            $parts = explode('=', $line, 2);
            if (count($parts) === 2 && trim($parts[0]) === $key) {
                $value = trim($parts[1]);
                // Remove quotes if present
                $value = trim($value, '"\'');
                return $value;
            }
        }
    }
    return $default;
}

$host = getEnvValue('DB_HOST', 'localhost');
$db_name = getEnvValue('DB_NAME', 'u842627858_eltahan');
$username = getEnvValue('DB_USER', 'u842627858_eltahan');
$password = getEnvValue('DB_PASSWORD', '@Lloush//722');
$jwt_secret = getEnvValue('JWT_SECRET', 'your-secret-key-here-change-in-production');

try {
    $pdo = new PDO("mysql:host=$host", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$db_name` ");

    // --- AUTO-CREATE TABLES ---
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'editor', 'user') DEFAULT 'user',
        status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS pricing_packages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        photo_count INT NOT NULL,
        sizes TEXT,
        color VARCHAR(20)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        invoice_no VARCHAR(50) UNIQUE NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        paid_amount DECIMAL(10, 2) DEFAULT 0,
        remaining_amount DECIMAL(10, 2) DEFAULT 0,
        status ENUM('draft', 'paid', 'pending', 'partial') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        action TEXT NOT NULL,
        entity_type VARCHAR(50),
        entity_id INT,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // --- AUTO-MIGRATE: Fix Missing Columns in Old Tables ---
    try {
        $cols = $pdo->query("SHOW COLUMNS FROM activity_logs")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('entity_type', $cols))
            $pdo->exec("ALTER TABLE activity_logs ADD COLUMN entity_type VARCHAR(50) DEFAULT 'system'");
        if (!in_array('entity_id', $cols))
            $pdo->exec("ALTER TABLE activity_logs ADD COLUMN entity_id INT NULL");
        if (!in_array('details', $cols))
            $pdo->exec("ALTER TABLE activity_logs ADD COLUMN details TEXT NULL");

        $invCols = $pdo->query("SHOW COLUMNS FROM invoices")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('created_by', $invCols))
            $pdo->exec("ALTER TABLE invoices ADD COLUMN created_by VARCHAR(100) DEFAULT 'Admin'");
        if (!in_array('participants', $invCols))
            $pdo->exec("ALTER TABLE invoices ADD COLUMN participants TEXT NULL");

    } catch (Exception $e) { /* Ignore if already exists or other minor error */
    }

    $pdo->exec("CREATE TABLE IF NOT EXISTS invoice_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        package_id INT,
        package_name VARCHAR(255),
        price DECIMAL(10, 2),
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS studio_settings (
        id INT PRIMARY KEY,
        studio_name VARCHAR(255) DEFAULT 'Stodio',
        email VARCHAR(255) DEFAULT 'contact@stodio.com',
        phone VARCHAR(50),
        address TEXT,
        currency VARCHAR(10) DEFAULT 'EGP',
        language VARCHAR(5) DEFAULT 'ar',
        logo_url TEXT
    )");

    // Insert Default Settings if not exist
    $stmt = $pdo->prepare("SELECT id FROM studio_settings WHERE id = 1");
    $stmt->execute();
    if (!$stmt->fetch()) {
        $pdo->exec("INSERT INTO studio_settings (id, studio_name) VALUES (1, 'Stodio')");
    }

    $pdo->exec("CREATE TABLE IF NOT EXISTS inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50),
        quantity INT DEFAULT 0,
        price DECIMAL(10, 2) DEFAULT 0,
        cost DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS purchases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_name VARCHAR(255) NOT NULL,
        category VARCHAR(50),
        quantity INT DEFAULT 1,
        unit_cost DECIMAL(10, 2) DEFAULT 0,
        total_cost DECIMAL(10, 2) DEFAULT 0,
        supplier VARCHAR(255),
        notes TEXT,
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Ensure Admin exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = 'admin@stodio.com'");
    $stmt->execute();
    if (!$stmt->fetch()) {
        $adminPass = password_hash('admin', PASSWORD_DEFAULT);
        $pdo->exec("INSERT INTO users (name, email, password, role) VALUES ('Administrator', 'admin@stodio.com', '$adminPass', 'admin')");
        $newAdminId = $pdo->lastInsertId();

        // Log Initial Activity
        $pdo->prepare("INSERT INTO activity_logs (user_id, action, entity_type) VALUES (?, ?, ?)")
            ->execute([$newAdminId, "نظام سجل الأنشطة متصل وجاهز", "system"]);
    }

    // --- SEED SAMPLE DATA IF NO ACTIVITIES EXIST ---
    $activityCount = $pdo->query("SELECT COUNT(*) FROM activity_logs")->fetchColumn();
    if ($activityCount == 0 || $activityCount < 5) {
        // Ensure we have some customers first
        $cCount = $pdo->query("SELECT COUNT(*) FROM customers")->fetchColumn();
        if ($cCount == 0) {
            $pdo->exec("INSERT INTO customers (name, phone, email) VALUES 
                ('أحمد محمد', '01012345678', 'ahmed@example.com'),
                ('سارة محمود', '01198765432', 'sara@example.com'),
                ('ياسر علي', '01234567890', 'yasser@example.com')");
        }

        $cId = $pdo->query("SELECT id FROM customers LIMIT 1")->fetchColumn();
        if ($cId) {
            $pdo->exec("INSERT INTO invoices (customer_id, invoice_no, total_amount, paid_amount, remaining_amount, status) VALUES 
                ($cId, 'INV-" . time() . "1', 500, 500, 0, 'paid'),
                ($cId, 'INV-" . time() . "2', 1200, 400, 800, 'partial')");
        }

        $pdo->exec("INSERT INTO activity_logs (user_id, action, entity_type, created_at) VALUES 
            (1, 'تم تهيئة نظام سجل الأنشطة', 'system', NOW()),
            (1, 'إضافة بيانات تجريبية للتقارير', 'system', NOW()),
            (1, 'تم إنشاء فاتورة جديدة رقم INV-778', 'invoice', NOW()),
            (1, 'تسجيل دخول مدير النظام', 'user', NOW())");
    }

} catch (PDOException $e) {
    error_log("Database Error: " . $e->getMessage());
    echo json_encode(["message" => "خطأ في الاتصال بقاعدة البيانات"]);
    exit();
}

function sendResponse($data, $status = 200)
{
    http_response_code($status);
    echo json_encode($data);
    exit();
}

function getBearerToken()
{
    $headers = array_change_key_case(getallheaders(), CASE_LOWER);
    if (isset($headers['authorization'])) {
        if (preg_match('/Bearer\s(\S+)/', $headers['authorization'], $matches))
            return $matches[1];
    }
    return $_GET['token'] ?? null;
}

if (!function_exists('getallheaders')) {
    function getallheaders()
    {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}
?>