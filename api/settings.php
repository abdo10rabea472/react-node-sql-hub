<?php
// api/settings.php
require_once 'config.php';
require_once 'jwt_helper.php';

JWT::setSecret($jwt_secret);
$token = getBearerToken();
if (!JWT::verify($token))
    sendResponse(["message" => "غير مصرح"], 401);

$method = $_SERVER['REQUEST_METHOD'];

// Auto-migrate attendance settings columns
$settingsMigrations = [
    ['late_grace_minutes', "INT DEFAULT 15"],
    ['deduction_type', "VARCHAR(20) DEFAULT 'per_minute'"],
    ['deduction_rate', "DECIMAL(10,2) DEFAULT 1"],
    ['overtime_rate_multiplier', "DECIMAL(3,1) DEFAULT 1.5"],
    ['half_day_deduction_percent', "INT DEFAULT 50"],
    ['absent_deduction_percent', "INT DEFAULT 100"],
];
foreach ($settingsMigrations as [$col, $def]) {
    $chk = $pdo->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'studio_settings' AND COLUMN_NAME = ?");
    $chk->execute([$col]);
    if ((int)$chk->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE studio_settings ADD COLUMN $col $def");
    }
}

if ($method === 'GET') {
    $settings = $pdo->query("SELECT * FROM studio_settings WHERE id = 1")->fetch(PDO::FETCH_ASSOC);
    sendResponse($settings);
}

if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $fields = [];
    $values = [];
    $allowed = ['studio_name', 'email', 'address', 'phone', 'admin_name', 'currency', 'language', 'theme', 'country_code',
        'late_grace_minutes', 'deduction_type', 'deduction_rate', 'overtime_rate_multiplier', 'half_day_deduction_percent', 'absent_deduction_percent'];
    foreach ($allowed as $key) {
        if (isset($data[$key])) {
            $fields[] = "$key = ?";
            $values[] = $data[$key];
        }
    }
    if (empty($fields))
        sendResponse(["message" => "No data"], 400);
    $stmt = $pdo->prepare("UPDATE studio_settings SET " . implode(', ', $fields) . " WHERE id = 1");
    $stmt->execute($values);
    sendResponse(["message" => "Settings updated"]);
}
?>