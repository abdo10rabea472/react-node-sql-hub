<?php
// api/settings.php
require_once 'config.php';
require_once 'jwt_helper.php';

JWT::setSecret($jwt_secret);
$token = getBearerToken();
if (!JWT::verify($token))
    sendResponse(["message" => "غير مصرح"], 401);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $settings = $pdo->query("SELECT * FROM studio_settings WHERE id = 1")->fetch(PDO::FETCH_ASSOC);
    sendResponse($settings);
}

if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $fields = [];
    $values = [];
    $allowed = ['studio_name', 'email', 'address', 'phone', 'admin_name', 'currency', 'language', 'theme'];
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