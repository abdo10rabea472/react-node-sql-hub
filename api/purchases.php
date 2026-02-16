<?php
// api/purchases.php
require_once 'config.php';
require_once 'jwt_helper.php';
require_once 'activity_helper.php';

JWT::setSecret($jwt_secret);
$token = getBearerToken();
if (!JWT::verify($token))
    sendResponse(["message" => "غير مصرح"], 401);

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

if ($method === 'GET') {
    sendResponse($pdo->query("SELECT * FROM purchases ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC));
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $pdo->prepare("INSERT INTO purchases (item_name, category, quantity, unit_cost, total_cost, supplier, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$data['item_name'], $data['category'], $data['quantity'] ?? 1, $data['unit_cost'], $data['total_cost'], $data['supplier'] ?? '', $data['notes'] ?? '', $data['created_by'] ?? 'Admin']);
    logActivity($pdo, JWT::verify($token)['id'], "إضافة مشتريات", "purchase", $pdo->lastInsertId());
    sendResponse(["message" => "Purchase added"]);
}

if ($method === 'DELETE' && $id) {
    $decoded = JWT::verify($token);
    if (!$decoded || $decoded['role'] !== 'admin') {
        sendResponse(["message" => "غير مصرح - صلاحيات غير كافية"], 403);
    }
    $pdo->prepare("DELETE FROM purchases WHERE id = ?")->execute([$id]);
    sendResponse(["message" => "Purchase deleted"]);
}
?>