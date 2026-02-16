<?php
// api/inventory.php
require_once 'config.php';
require_once 'jwt_helper.php';
require_once 'activity_helper.php';

JWT::setSecret($jwt_secret);
$token = getBearerToken();
$decoded = JWT::verify($token);
if (!$decoded)
    sendResponse(["message" => "غير مصرح"], 401);

$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['path'] ?? '';
$id = $_GET['id'] ?? null;

// Categories
if ($path === 'categories') {
    if ($method === 'GET') {
        sendResponse($pdo->query("SELECT * FROM inventory_categories ORDER BY id")->fetchAll(PDO::FETCH_ASSOC));
    }
    if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $pdo->prepare("INSERT INTO inventory_categories (name, name_ar, color, icon, is_sellable) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$data['name'], $data['name_ar'], $data['color'] ?? '#6B7280', $data['icon'] ?? 'Package', $data['is_sellable'] ?? 1]);
        sendResponse(["message" => "Category created", "id" => $pdo->lastInsertId()]);
    }
}

// Items
if ($path === '' || empty($path)) {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM inventory WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse($stmt->fetch(PDO::FETCH_ASSOC));
        } else {
            sendResponse($pdo->query("SELECT * FROM inventory ORDER BY item_name")->fetchAll(PDO::FETCH_ASSOC));
        }
    }
    if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $pdo->prepare("INSERT INTO inventory (item_name, category_id, usage_type, quantity, unit_cost, sell_price, min_stock, supplier, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['item_name'],
            $data['category_id'],
            $data['usage_type'] ?? 'studio',
            $data['quantity'] ?? 0,
            $data['unit_cost'] ?? 0,
            $data['sell_price'] ?? 0,
            $data['min_stock'] ?? 5,
            $data['supplier'] ?? '',
            $data['notes'] ?? '',
            $decoded['name'] ?? 'Admin'
        ]);
        sendResponse(["message" => "Item created", "id" => $pdo->lastInsertId()]);
    }
    if ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $pdo->prepare("UPDATE inventory SET item_name = ?, category_id = ?, quantity = ?, unit_cost = ?, sell_price = ?, min_stock = ?, supplier = ?, notes = ? WHERE id = ?");
        $stmt->execute([
            $data['item_name'],
            $data['category_id'],
            $data['quantity'],
            $data['unit_cost'],
            $data['sell_price'],
            $data['min_stock'],
            $data['supplier'],
            $data['notes'],
            $id
        ]);
        sendResponse(["message" => "Item updated"]);
    }
    if ($method === 'DELETE' && $id) {
        $pdo->prepare("DELETE FROM inventory WHERE id = ?")->execute([$id]);
        sendResponse(["message" => "Item deleted"]);
    }
}

// Stats & Transactions
if ($path === 'stats') {
    $stats = [
        "totalItems" => $pdo->query("SELECT COUNT(*) FROM inventory")->fetchColumn(),
        "lowStock" => $pdo->query("SELECT COUNT(*) FROM inventory WHERE quantity <= min_stock")->fetchColumn(),
        "totalValue" => $pdo->query("SELECT SUM(quantity * unit_cost) FROM inventory")->fetchColumn()
    ];
    sendResponse($stats);
}

sendResponse(["message" => "Not found"], 404);
?>