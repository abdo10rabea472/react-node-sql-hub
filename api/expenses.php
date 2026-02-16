<?php
// api/expenses.php
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

// Auto-create tables
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        description VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'عامة',
        amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        expense_date DATE DEFAULT NULL,
        notes TEXT,
        created_by VARCHAR(100) DEFAULT 'Admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS salaries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        bonus DECIMAL(10,2) DEFAULT 0,
        deductions DECIMAL(10,2) DEFAULT 0,
        net_salary DECIMAL(10,2) DEFAULT 0,
        month VARCHAR(7) NOT NULL,
        notes TEXT,
        paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'Admin'
    )");
} catch (Exception $e) { /* tables exist */ }

// ── Expenses ──
if ($path === '' || $path === 'expenses') {
    if ($method === 'GET') {
        sendResponse($pdo->query("SELECT * FROM expenses ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC));
    }
    if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $pdo->prepare("INSERT INTO expenses (description, category, amount, expense_date, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['description'],
            $data['category'] ?? 'عامة',
            $data['amount'],
            $data['expense_date'] ?? date('Y-m-d'),
            $data['notes'] ?? '',
            $data['created_by'] ?? 'Admin'
        ]);
        logActivity($pdo, $decoded['id'], "إضافة مصروف: " . $data['description'], "expense", $pdo->lastInsertId());
        sendResponse(["message" => "Expense added", "id" => $pdo->lastInsertId()]);
    }
    if ($method === 'DELETE' && $id) {
        $pdo->prepare("DELETE FROM expenses WHERE id = ?")->execute([$id]);
        sendResponse(["message" => "Expense deleted"]);
    }
}

// ── Salaries ──
if ($path === 'salaries') {
    if ($method === 'GET') {
        sendResponse($pdo->query("SELECT * FROM salaries ORDER BY paid_at DESC")->fetchAll(PDO::FETCH_ASSOC));
    }
    if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $amount = (float)($data['amount'] ?? 0);
        $bonus = (float)($data['bonus'] ?? 0);
        $deductions = (float)($data['deductions'] ?? 0);
        $net = $amount + $bonus - $deductions;
        $stmt = $pdo->prepare("INSERT INTO salaries (user_id, user_name, amount, bonus, deductions, net_salary, month, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['user_id'],
            $data['user_name'],
            $amount, $bonus, $deductions, $net,
            $data['month'] ?? date('Y-m'),
            $data['notes'] ?? '',
            $data['created_by'] ?? 'Admin'
        ]);
        logActivity($pdo, $decoded['id'], "صرف مرتب: " . $data['user_name'], "salary", $pdo->lastInsertId());
        sendResponse(["message" => "Salary added", "id" => $pdo->lastInsertId()]);
    }
    if ($method === 'DELETE' && $id) {
        $pdo->prepare("DELETE FROM salaries WHERE id = ?")->execute([$id]);
        sendResponse(["message" => "Salary deleted"]);
    }
}

// ── Stats ──
if ($path === 'stats') {
    $expTotal = $pdo->query("SELECT COALESCE(SUM(amount),0) as total FROM expenses")->fetch(PDO::FETCH_ASSOC)['total'];
    $salTotal = $pdo->query("SELECT COALESCE(SUM(net_salary),0) as total FROM salaries")->fetch(PDO::FETCH_ASSOC)['total'];
    $thisMonth = date('Y-m');
    $expMonth = $pdo->prepare("SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE DATE_FORMAT(created_at, '%Y-%m') = ?");
    $expMonth->execute([$thisMonth]);
    $salMonth = $pdo->prepare("SELECT COALESCE(SUM(net_salary),0) as total FROM salaries WHERE month = ?");
    $salMonth->execute([$thisMonth]);
    sendResponse([
        "total_expenses" => (float)$expTotal,
        "total_salaries" => (float)$salTotal,
        "month_expenses" => (float)$expMonth->fetch(PDO::FETCH_ASSOC)['total'],
        "month_salaries" => (float)$salMonth->fetch(PDO::FETCH_ASSOC)['total'],
    ]);
}
?>
