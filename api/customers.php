<?php
// api/customers.php
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
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
        $stmt->execute([$id]);
        sendResponse($stmt->fetch(PDO::FETCH_ASSOC));
    } else {
        sendResponse($pdo->query("SELECT * FROM customers ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC));
    }
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $pdo->prepare("INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)");
    $stmt->execute([$data['name'], $data['phone'] ?? '', $data['email'] ?? '', $data['address'] ?? '']);
    sendResponse(["message" => "Customer added", "id" => $pdo->lastInsertId()]);
}

if ($method === 'PUT' && $id) {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $pdo->prepare("UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?");
    $stmt->execute([$data['name'], $data['phone'], $data['email'], $data['address'], $id]);
    sendResponse(["message" => "Customer updated"]);
}

if ($method === 'DELETE' && $id) {
    $pdo->prepare("DELETE FROM customers WHERE id = ?")->execute([$id]);
    sendResponse(["message" => "Customer deleted"]);
}
?>