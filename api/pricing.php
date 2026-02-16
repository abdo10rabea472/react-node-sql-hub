<?php
// api/pricing.php
require_once 'config.php';
require_once 'jwt_helper.php';

JWT::setSecret($jwt_secret);
$token = getBearerToken();
if (!JWT::verify($token))
    sendResponse(["message" => "غير مصرح"], 401);

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

if ($method === 'GET') {
    $packages = $pdo->query("SELECT * FROM pricing_packages ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($packages as &$pkg) {
        if (isset($pkg['sizes'])) {
            $decoded = json_decode($pkg['sizes'], true);
            $pkg['sizes'] = is_array($decoded) ? $decoded : [];
        }
    }
    sendResponse($packages);
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $pdo->prepare("INSERT INTO pricing_packages (type, price, cost_price, photo_count, sizes, color) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$data['type'], $data['price'], $data['cost_price'] ?? 0, $data['photo_count'], $data['sizes'], $data['color'] ?? '#000000']);
    sendResponse(["message" => "Package created", "id" => $pdo->lastInsertId()]);
}

if ($method === 'PUT' && $id) {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $pdo->prepare("UPDATE pricing_packages SET type = ?, price = ?, cost_price = ?, photo_count = ?, sizes = ?, color = ? WHERE id = ?");
    $stmt->execute([$data['type'], $data['price'], $data['cost_price'], $data['photo_count'], $data['sizes'], $data['color'], $id]);
    sendResponse(["message" => "Package updated"]);
}

if ($method === 'DELETE' && $id) {
    $decoded = JWT::verify($token);
    if (!$decoded || $decoded['role'] !== 'admin') {
        sendResponse(["message" => "غير مصرح - صلاحيات غير كافية"], 403);
    }
    $pdo->prepare("DELETE FROM pricing_packages WHERE id = ?")->execute([$id]);
    sendResponse(["message" => "Package deleted"]);
}
?>