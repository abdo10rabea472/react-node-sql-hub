<?php
// api/users.php
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

if ($method === 'GET' && $path === 'stats') {
    try {
        // Dashboard Stats Aggregation

        // Ensure tables exist to prevent crash
        // These are dummy checks. Real table structures should be handled by migrations.
        // They prevent immediate crashes if a table is completely absent during a query.
        $pdo->exec("CREATE TABLE IF NOT EXISTS invoices (id INT PRIMARY KEY AUTO_INCREMENT, paid_amount DECIMAL(10,2) DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
        $pdo->exec("CREATE TABLE IF NOT EXISTS customers (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255))");
        $pdo->exec("CREATE TABLE IF NOT EXISTS users (id INT PRIMARY KEY AUTO_INCREMENT)");
        $pdo->exec("CREATE TABLE IF NOT EXISTS purchases (id INT PRIMARY KEY AUTO_INCREMENT, total_amount DECIMAL(10,2) DEFAULT 0)");

        // 1. Total Invoices & Revenue
        $totalInvoices = 0;
        $totalRevenue = 0;
        try {
            $totalInvoices = $pdo->query("SELECT COUNT(*) FROM invoices")->fetchColumn();
            $totalRevenue = $pdo->query("SELECT COALESCE(SUM(paid_amount), 0) FROM invoices")->fetchColumn();
        } catch (Exception $e) { /* Ignore if table missing or query fails, defaults to 0 */
        }

        // 2. Total Purchases
        $totalPurchases = 0;
        try {
            // Check if table exists properly
            $stmt = $pdo->query("SHOW TABLES LIKE 'purchases'");
            if ($stmt->rowCount() > 0) {
                $totalPurchases = $pdo->query("SELECT COALESCE(SUM(total_amount), 0) FROM purchases")->fetchColumn();
            }
        } catch (Exception $e) { /* Ignore if table missing or query fails, defaults to 0 */
        }

        // 3. Customers
        $totalCustomers = 0;
        try {
            $totalCustomers = $pdo->query("SELECT COUNT(*) FROM customers")->fetchColumn();
        } catch (Exception $e) { /* Ignore if table missing or query fails, defaults to 0 */
        }

        // 4. Daily & Monthly Sales
        $dailySales = 0;
        $monthlySales = 0;
        try {
            $today = date('Y-m-d');
            $currentMonth = date('Y-m');
            $dailySales = $pdo->query("SELECT COALESCE(SUM(paid_amount), 0) FROM invoices WHERE DATE(created_at) = '$today'")->fetchColumn();
            $monthlySales = $pdo->query("SELECT COALESCE(SUM(paid_amount), 0) FROM invoices WHERE DATE_FORMAT(created_at, '%Y-%m') = '$currentMonth'")->fetchColumn();
        } catch (Exception $e) { /* Ignore if table missing or query fails, defaults to 0 */
        }

        // 5. Recent Activities (Invoices)
        $recentInvoices = [];
        try {
            $recentInvoices = $pdo->query("SELECT i.id, i.invoice_no, c.name as customer_name, i.total_amount, i.status, i.created_at 
                                       FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id 
                                       ORDER BY i.created_at DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) { /* Ignore if tables missing or query fails, defaults to empty array */
        }

        // 6. System Users Stats
        $totalUsers = 0;
        $activeSystemUsers = 0;
        $admins = 0;
        $editors = 0;
        $bannedUsers = 0;
        $recentUsers = [];
        try {
            $totalUsers = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
            $activeSystemUsers = $pdo->query("SELECT COUNT(*) FROM users WHERE status = 'active'")->fetchColumn();
            $admins = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn();
            $editors = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'editor'")->fetchColumn();
            $bannedUsers = $pdo->query("SELECT COUNT(*) FROM users WHERE status = 'inactive'")->fetchColumn();
            $recentUsers = $pdo->query("SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) { /* Ignore */
        }

        // 7. Stats Response
        $stats = [
            "totalOrders" => (int) $totalInvoices,
            "revenue" => (float) $totalRevenue,
            "purchases" => (float) $totalPurchases,
            "balance" => (float) ($totalRevenue - $totalPurchases),
            "activeUsers" => (int) $totalCustomers, // Using customers as "Active Users" for the dashboard
            "dailySales" => (float) $dailySales,
            "monthlySales" => (float) $monthlySales,
            "recentActivity" => $recentInvoices,
            "totalUsers" => (int) $totalUsers,
            "systemActive" => (int) $activeSystemUsers,
            "admins" => (int) $admins,
            "editors" => (int) $editors,
            "bannedUsers" => (int) $bannedUsers,
            "inactiveUsers" => (int) $bannedUsers,
            "recentUsers" => $recentUsers
        ];

        sendResponse($stats);

    } catch (Exception $e) {
        // Fallback or error report for any unhandled exception in the stats block
        sendResponse(["message" => "Error calculating stats: " . $e->getMessage()], 500);
    }
}

// Add base_salary column if not exists
$chk = $pdo->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'base_salary'");
$chk->execute();
if ((int)$chk->fetchColumn() === 0) {
    $pdo->exec("ALTER TABLE users ADD COLUMN base_salary DECIMAL(10,2) DEFAULT 0");
}

if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare("SELECT id, name, email, role, status, base_salary, created_at FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$user)
            sendResponse(["message" => "مستخدم غير موجود"], 404);
        sendResponse($user);
    } else {
        $users = $pdo->query("SELECT id, name, email, role, status, base_salary, created_at FROM users ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC);
        sendResponse($users);
    }
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
        sendResponse(["message" => "الاسم والبريد الإلكتروني وكلمة المرور مطلوبة"], 400);
    }

    $hashed = password_hash($data['password'], PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    try {
        $stmt->execute([$data['name'], $data['email'], $hashed, $data['role'] ?? 'user']);
        $newId = $pdo->lastInsertId();
        logActivity($pdo, $decoded['id'], "إضافة مستخدم جديد", "user", $newId, ["name" => $data['name']]);
        sendResponse(["message" => "تم إضافة المستخدم بنجاح", "userId" => $newId]);
    } catch (PDOException $e) {
        sendResponse(["message" => "البريد الإلكتروني مستخدم بالفعل"], 409);
    }
}

if ($method === 'PUT' && $id) {
    $data = json_decode(file_get_contents("php://input"), true);
    $fields = [];
    $values = [];
    foreach (['name', 'email', 'role', 'status', 'base_salary'] as $key) {
        if (isset($data[$key])) {
            $fields[] = "$key = ?";
            $values[] = $data[$key];
        }
    }
    if (isset($data['password'])) {
        $fields[] = "password = ?";
        $values[] = password_hash($data['password'], PASSWORD_DEFAULT);
    }

    if (empty($fields))
        sendResponse(["message" => "لا توجد بيانات لتحديثها"], 400);

    $values[] = $id;
    $stmt = $pdo->prepare("UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?");
    $stmt->execute($values);
    logActivity($pdo, $decoded['id'], "تحديث بيانات مستخدم", "user", $id);
    sendResponse(["message" => "تم تحديث المستخدم بنجاح"]);
}

if ($method === 'DELETE' && $id) {
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$id]);
    logActivity($pdo, $decoded['id'], "حذف مستخدم", "user", $id);
    sendResponse(["message" => "تم حذف المستخدم بنجاح"]);
}

sendResponse(["message" => "Method not allowed"], 405);
?>