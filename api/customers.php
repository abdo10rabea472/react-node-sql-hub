<?php
// api/customers.php
require_once 'config.php';
require_once 'jwt_helper.php';
require_once 'activity_helper.php';

JWT::setSecret($jwt_secret);
$token = getBearerToken();
$decoded = JWT::verify($token);
if (!$decoded)
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
    $name = trim($data['name'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $email = trim($data['email'] ?? '');
    $address = trim($data['address'] ?? '');

    if (empty($name) || mb_strlen($name) > 255) {
        sendResponse(["message" => "اسم العميل مطلوب ولا يزيد عن 255 حرف"], 400);
    }
    if ($phone && !preg_match('/^[0-9+\-\s]{0,50}$/', $phone)) {
        sendResponse(["message" => "رقم الهاتف غير صالح"], 400);
    }
    if ($email && (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 255)) {
        sendResponse(["message" => "البريد الإلكتروني غير صالح"], 400);
    }

    $stmt = $pdo->prepare("INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)");
    $stmt->execute([$name, $phone, $email, $address]);
    $newId = $pdo->lastInsertId();
    logActivity($pdo, $decoded['id'], "إضافة عميل جديد: $name", "customer", $newId, ["name" => $name, "phone" => $phone]);
    sendResponse(["message" => "Customer added", "id" => $newId]);
}

if ($method === 'PUT' && $id) {
    $data = json_decode(file_get_contents("php://input"), true);
    $name = trim($data['name'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $email = trim($data['email'] ?? '');
    $address = trim($data['address'] ?? '');

    if (empty($name) || mb_strlen($name) > 255) {
        sendResponse(["message" => "اسم العميل مطلوب ولا يزيد عن 255 حرف"], 400);
    }

    $stmt = $pdo->prepare("UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?");
    $stmt->execute([$name, $phone, $email, $address, $id]);
    logActivity($pdo, $decoded['id'], "تعديل بيانات عميل: $name", "customer", $id, ["name" => $name]);
    sendResponse(["message" => "Customer updated"]);
}

if ($method === 'DELETE' && $id) {
    if ($decoded['role'] !== 'admin') {
        sendResponse(["message" => "غير مصرح - صلاحيات غير كافية"], 403);
    }
    $stmt = $pdo->prepare("SELECT name FROM customers WHERE id = ?");
    $stmt->execute([$id]);
    $customer = $stmt->fetch(PDO::FETCH_ASSOC);
    $customerName = $customer['name'] ?? "ID:$id";

    $pdo->prepare("DELETE FROM customers WHERE id = ?")->execute([$id]);
    logActivity($pdo, $decoded['id'], "حذف عميل: $customerName", "customer", $id, ["deleted_name" => $customerName]);
    sendResponse(["message" => "Customer deleted"]);
}
?>