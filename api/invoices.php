<?php
// api/invoices.php
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

if ($method === 'GET') {
    if ($id) {
        // Fetch Invoice Basic Data
        $stmt = $pdo->prepare("SELECT i.*, COALESCE(i.created_by, 'Admin') as created_by FROM invoices i WHERE i.id = ?");
        $stmt->execute([$id]);
        $invoice = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$invoice) {
            sendResponse(["message" => "فاتورة غير موجودة"], 404);
        }

        // Fetch Invoice Items
        $stmtItems = $pdo->prepare("SELECT * FROM invoice_items WHERE invoice_id = ?");
        $stmtItems->execute([$id]);
        $items = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

        // Fetch Customer Data
        $stmtCust = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
        $stmtCust->execute([$invoice['customer_id']]);
        $customer = $stmtCust->fetch(PDO::FETCH_ASSOC);

        // Combine
        $invoice['items'] = $items;
        $invoice['customer'] = $customer;
        $invoice['customer_name'] = $customer['name'] ?? 'Unknown';

        sendResponse($invoice); // Return single object, not array of rows
    } else {
        try {
            // Check columns exist first to avoid fatal error
            $cols = $pdo->query("SHOW COLUMNS FROM invoices")->fetchAll(PDO::FETCH_COLUMN);
            $hasCreatedBy = in_array('created_by', $cols);

            $selectCreatedBy = $hasCreatedBy ? "COALESCE(i.created_by, 'Admin') as created_by" : "'Admin' as created_by";

            $query = "SELECT i.*, $selectCreatedBy, c.name as customer_name, c.phone as customer_phone 
                      FROM invoices i JOIN customers c ON i.customer_id = c.id ORDER BY i.created_at DESC";

            $invoices = $pdo->query($query)->fetchAll(PDO::FETCH_ASSOC);
            sendResponse($invoices);
        } catch (Exception $e) {
            // Return empty array on error to prevent frontend crash
            error_log("Invoices List Error: " . $e->getMessage());
            sendResponse([]);
        }
    }
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $customer_id = $data['customer_id'];
    $items = $data['items'];
    $total_amount = $data['total_amount'];
    $paid_amount = $data['paid_amount'] ?? 0;
    $created_by = $data['created_by'] ?? 'Admin';
    $participants = $data['participants'] ?? '';

    $remaining_amount = $total_amount - $paid_amount;
    $invoice_no = "INV-" . time();
    $status = 'pending';
    if ($paid_amount >= $total_amount)
        $status = 'paid';
    elseif ($paid_amount > 0)
        $status = 'partial';

    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("INSERT INTO invoices (customer_id, invoice_no, total_amount, paid_amount, remaining_amount, created_by, participants, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$customer_id, $invoice_no, $total_amount, $paid_amount, $remaining_amount, $created_by, $participants, $status]);
        $invoice_id = $pdo->lastInsertId();

        foreach ($items as $item) {
            $pkgId = $item['is_package'] ? ($item['package_id'] ?? $item['id']) : null;
            $pkgName = $item['type'] ?? $item['package_name'] ?? 'Service';
            $pkgPrice = $item['price'] ?? 0;
            $stmt = $pdo->prepare("INSERT INTO invoice_items (invoice_id, package_id, package_name, price) VALUES (?, ?, ?, ?)");
            $stmt->execute([$invoice_id, $pkgId, $pkgName, $pkgPrice]);
        }

        $pdo->commit();
        logActivity($pdo, $decoded['id'], "إنشاء فاتورة استوديو", "invoice", $invoice_id, ["invoice_no" => $invoice_no]);
        sendResponse(["id" => $invoice_id, "invoice_no" => $invoice_no, "message" => "Invoice created successfully"]);
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(["message" => "خطأ في إنشاء الفاتورة", "error" => $e->getMessage()], 500);
    }
}

if ($method === 'PUT' && $id) {
    $data = json_decode(file_get_contents("php://input"), true);
    $paid_amount = $data['paid_amount'];
    $total_amount = $data['total_amount'];
    $participants = $data['participants'] ?? '';
    $remaining_amount = $total_amount - $paid_amount;

    $status = 'pending';
    if ($paid_amount >= $total_amount)
        $status = 'paid';
    elseif ($paid_amount > 0)
        $status = 'partial';

    $stmt = $pdo->prepare("UPDATE invoices SET paid_amount = ?, remaining_amount = ?, status = ?, participants = ? WHERE id = ?");
    $stmt->execute([$paid_amount, $remaining_amount, $status, $participants, $id]);
    logActivity($pdo, $decoded['id'], "تحديث فاتورة استوديو", "invoice", $id);
    sendResponse(["message" => "Invoice updated successfully"]);
}

if ($method === 'DELETE' && $id) {
    $stmt = $pdo->prepare("DELETE FROM invoices WHERE id = ?");
    $stmt->execute([$id]);
    logActivity($pdo, $decoded['id'], "حذف فاتورة استوديو", "invoice", $id);
    sendResponse(["message" => "Invoice deleted successfully"]);
}

sendResponse(["message" => "Method not allowed"], 405);
?>