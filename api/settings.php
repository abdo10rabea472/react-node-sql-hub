<?php
// api/settings.php
require_once 'config.php';
require_once 'jwt_helper.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET settings is public (needed before login), PUT requires auth
if ($method !== 'GET') {
    JWT::setSecret($jwt_secret);
    $token = getBearerToken();
    if (!JWT::verify($token))
        sendResponse(["message" => "غير مصرح"], 401);
}

if ($method === 'GET') {
    // Auto-add missing columns
    $cols = $pdo->query("SHOW COLUMNS FROM studio_settings")->fetchAll(PDO::FETCH_COLUMN);
    $newCols = [
        'country_code' => "VARCHAR(10) DEFAULT '966'",
        'deduction_rules' => "TEXT DEFAULT NULL",
        'ai_models' => "TEXT DEFAULT NULL",
        'admin_name' => "VARCHAR(255) DEFAULT ''",
    ];
    foreach ($newCols as $col => $def) {
        if (!in_array($col, $cols)) {
            $pdo->exec("ALTER TABLE studio_settings ADD COLUMN " . $col . " " . $def);
        }
    }

    $settings = $pdo->query("SELECT * FROM studio_settings WHERE id = 1")->fetch(PDO::FETCH_ASSOC);
    sendResponse($settings);
}

if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $fields = [];
    $values = [];
    $allowed = ['studio_name', 'email', 'address', 'phone', 'admin_name', 'currency', 'language', 'theme', 'country_code', 'deduction_rules', 'ai_models'];
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