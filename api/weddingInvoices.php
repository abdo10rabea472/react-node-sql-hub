<?php
// api/weddingInvoices.php
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
        $stmt = $pdo->prepare("SELECT wit.package_name, wit.price as item_price, wit.item_type, wit.quantity, wit.unit_price FROM wedding_invoice_items wit WHERE wit.invoice_id = ?");
        $stmt->execute([$id]);
        sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
    } else {
        $query = "SELECT wi.*, c.name as customer_name, c.phone as customer_phone FROM wedding_invoices wi JOIN customers c ON wi.customer_id = c.id ORDER BY wi.created_at DESC";
        sendResponse($pdo->query($query)->fetchAll(PDO::FETCH_ASSOC));
    }
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $customer_id = $data['customer_id'];
    $items = $data['items'];
    $total = parseFloat($data['total_amount'] ?? 0);
    $paid = parseFloat($data['paid_amount'] ?? 0);
    $remaining = $total - $paid;
    $invoice_no = "WED-" . time();
    $status = ($paid >= $total) ? 'paid' : (($paid > 0) ? 'partial' : 'pending');

    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("INSERT INTO wedding_invoices (customer_id, invoice_no, total_amount, paid_amount, remaining_amount, created_by, wedding_date, venue, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$customer_id, $invoice_no, $total, $paid, $remaining, $data['created_by'] ?? 'Admin', $data['wedding_date'] ?? null, $data['venue'] ?? '', $data['notes'] ?? '', $status]);
        $invoice_id = $pdo->lastInsertId();

        foreach ($items as $item) {
            $stmt = $pdo->prepare("INSERT INTO wedding_invoice_items (invoice_id, package_id, package_name, item_type, quantity, unit_price, price) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $invoice_id,
                $item['id'] ?? null,
                $item['package_name'] ?? $item['description'] ?? 'Item',
                $item['type'] ?? $item['item_type'] ?? 'album',
                $item['quantity'] ?? 1,
                parseFloat($item['unit_price'] ?? $item['price'] ?? 0),
                parseFloat($item['price'] ?? 0)
            ]);
        }
        $pdo->commit();
        logActivity($pdo, $decoded['id'], "إنشاء فاتورة زفاف", "wedding_invoice", $invoice_id, ["invoice_no" => $invoice_no]);
        sendResponse(["id" => $invoice_id, "invoice_no" => $invoice_no]);
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Wedding invoice error: " . $e->getMessage());
        sendResponse(["message" => "خطأ في إنشاء فاتورة الزفاف"], 500);
    }
}

if ($method === 'PUT' && $id) {
    $data = json_decode(file_get_contents("php://input"), true);
    $total = parseFloat($data['total_amount'] ?? 0);
    $paid = parseFloat($data['paid_amount'] ?? 0);
    $remaining = $total - $paid;
    $status = ($paid >= $total) ? 'paid' : (($paid > 0) ? 'partial' : 'pending');

    $stmt = $pdo->prepare("UPDATE wedding_invoices SET paid_amount = ?, remaining_amount = ?, status = ?, wedding_date = ?, venue = ?, notes = ? WHERE id = ?");
    $stmt->execute([$paid, $remaining, $status, $data['wedding_date'] ?? null, $data['venue'] ?? '', $data['notes'] ?? '', $id]);
    sendResponse(["message" => "Updated"]);
}

function parseFloat($val)
{
    return (float) $val;
}
?>