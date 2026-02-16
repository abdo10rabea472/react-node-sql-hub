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

// ── Helper: check if column exists ──
function columnExists($pdo, $table, $column) {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?");
    $stmt->execute([$table, $column]);
    return (int)$stmt->fetchColumn() > 0;
}

// ── Auto-create tables ──
$pdo->exec("CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'عامة',
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    expense_date DATE DEFAULT NULL,
    notes TEXT,
    created_by VARCHAR(100) DEFAULT 'Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$pdo->exec("CREATE TABLE IF NOT EXISTS salaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    base_salary DECIMAL(10,2) DEFAULT 0,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    bonus DECIMAL(10,2) DEFAULT 0,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    overtime_amount DECIMAL(10,2) DEFAULT 0,
    late_hours DECIMAL(5,2) DEFAULT 0,
    late_deduction DECIMAL(10,2) DEFAULT 0,
    advances_deduction DECIMAL(10,2) DEFAULT 0,
    deductions DECIMAL(10,2) DEFAULT 0,
    net_salary DECIMAL(10,2) DEFAULT 0,
    month VARCHAR(7) NOT NULL,
    notes TEXT,
    attendance_summary TEXT,
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'Admin'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$pdo->exec("CREATE TABLE IF NOT EXISTS advances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    reason VARCHAR(255) DEFAULT '',
    status ENUM('pending','deducted','cancelled') DEFAULT 'pending',
    advance_date DATE DEFAULT NULL,
    notes TEXT,
    created_by VARCHAR(100) DEFAULT 'Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$pdo->exec("CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    attendance_date DATE NOT NULL,
    check_in TIME DEFAULT NULL,
    check_out TIME DEFAULT NULL,
    scheduled_in TIME DEFAULT '09:00:00',
    scheduled_out TIME DEFAULT '17:00:00',
    late_minutes INT DEFAULT 0,
    overtime_minutes INT DEFAULT 0,
    status ENUM('present','absent','late','half_day','vacation') DEFAULT 'present',
    notes TEXT,
    created_by VARCHAR(100) DEFAULT 'Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

// ── Migrate old salaries table (add missing columns safely) ──
$salaryColumns = [
    ['base_salary', "DECIMAL(10,2) DEFAULT 0 AFTER user_name"],
    ['overtime_hours', "DECIMAL(5,2) DEFAULT 0 AFTER bonus"],
    ['overtime_amount', "DECIMAL(10,2) DEFAULT 0 AFTER overtime_hours"],
    ['late_hours', "DECIMAL(5,2) DEFAULT 0 AFTER overtime_amount"],
    ['late_deduction', "DECIMAL(10,2) DEFAULT 0 AFTER late_hours"],
    ['advances_deduction', "DECIMAL(10,2) DEFAULT 0 AFTER late_deduction"],
    ['attendance_summary', "TEXT AFTER notes"],
];
$allowedSalaryCols = array_column($salaryColumns, 0);
foreach ($salaryColumns as [$col, $def]) {
    if (!in_array($col, $allowedSalaryCols)) continue;
    if (!preg_match('/^[a-z_]+$/', $col)) continue;
    if (!columnExists($pdo, 'salaries', $col)) {
        $pdo->exec("ALTER TABLE salaries ADD COLUMN " . $col . " " . $def);
    }
}

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
        if ($decoded['role'] !== 'admin') {
            sendResponse(["message" => "غير مصرح - صلاحيات غير كافية"], 403);
        }
        $pdo->prepare("DELETE FROM expenses WHERE id = ?")->execute([$id]);
        sendResponse(["message" => "Expense deleted"]);
    }
}

// ── Advances (سلف) ──
if ($path === 'advances') {
    if ($method === 'GET') {
        $userId = $_GET['user_id'] ?? null;
        if ($userId) {
            $stmt = $pdo->prepare("SELECT * FROM advances WHERE user_id = ? ORDER BY created_at DESC");
            $stmt->execute([$userId]);
            sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
        }
        sendResponse($pdo->query("SELECT * FROM advances ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC));
    }
    if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $pdo->prepare("INSERT INTO advances (user_id, user_name, amount, reason, advance_date, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['user_id'],
            $data['user_name'],
            $data['amount'],
            $data['reason'] ?? '',
            $data['advance_date'] ?? date('Y-m-d'),
            $data['notes'] ?? '',
            $data['created_by'] ?? 'Admin'
        ]);
        logActivity($pdo, $decoded['id'], "سلفة لـ " . $data['user_name'] . ": " . $data['amount'], "advance", $pdo->lastInsertId());
        sendResponse(["message" => "Advance added", "id" => $pdo->lastInsertId()]);
    }
    if ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $pdo->prepare("UPDATE advances SET status = ? WHERE id = ?");
        $stmt->execute([$data['status'], $id]);
        sendResponse(["message" => "Advance updated"]);
    }
    if ($method === 'DELETE' && $id) {
        $pdo->prepare("DELETE FROM advances WHERE id = ?")->execute([$id]);
        sendResponse(["message" => "Advance deleted"]);
    }
}

// ── Attendance ──
if ($path === 'attendance') {
    if ($method === 'GET') {
        $userId = $_GET['user_id'] ?? null;
        $month = $_GET['month'] ?? null;
        $where = [];
        $params = [];
        if ($userId) { $where[] = "user_id = ?"; $params[] = $userId; }
        if ($month) { $where[] = "DATE_FORMAT(attendance_date, '%Y-%m') = ?"; $params[] = $month; }
        $sql = "SELECT * FROM attendance";
        if (!empty($where)) $sql .= " WHERE " . implode(" AND ", $where);
        $sql .= " ORDER BY attendance_date DESC, check_in DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
    if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $scheduledIn = $data['scheduled_in'] ?? '09:00';
        $scheduledOut = $data['scheduled_out'] ?? '17:00';
        $checkIn = $data['check_in'] ?? null;
        $checkOut = $data['check_out'] ?? null;
        
        // Calculate late minutes
        $lateMinutes = 0;
        if ($checkIn && $scheduledIn) {
            $diff = (strtotime($checkIn) - strtotime($scheduledIn)) / 60;
            if ($diff > 0) $lateMinutes = (int)$diff;
        }
        
        // Calculate overtime minutes
        $overtimeMinutes = 0;
        if ($checkOut && $scheduledOut) {
            $diff = (strtotime($checkOut) - strtotime($scheduledOut)) / 60;
            if ($diff > 0) $overtimeMinutes = (int)$diff;
        }
        
        $status = $data['status'] ?? 'present';
        if ($lateMinutes > 0 && $status === 'present') $status = 'late';
        
        $stmt = $pdo->prepare("INSERT INTO attendance (user_id, user_name, attendance_date, check_in, check_out, scheduled_in, scheduled_out, late_minutes, overtime_minutes, status, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['user_id'],
            $data['user_name'],
            $data['attendance_date'] ?? date('Y-m-d'),
            $checkIn,
            $checkOut,
            $scheduledIn,
            $scheduledOut,
            $lateMinutes,
            $overtimeMinutes,
            $status,
            $data['notes'] ?? '',
            $data['created_by'] ?? 'Admin'
        ]);
        sendResponse(["message" => "Attendance recorded", "id" => $pdo->lastInsertId(), "late_minutes" => $lateMinutes, "overtime_minutes" => $overtimeMinutes]);
    }
    if ($method === 'DELETE' && $id) {
        $pdo->prepare("DELETE FROM attendance WHERE id = ?")->execute([$id]);
        sendResponse(["message" => "Attendance deleted"]);
    }
}

// ── Salary Report (for a specific employee & month) ──
if ($path === 'salary-report') {
    $userId = $_GET['user_id'] ?? null;
    $month = $_GET['month'] ?? date('Y-m');
    if (!$userId) sendResponse(["message" => "user_id required"], 400);
    
    // Get user base salary
    $userStmt = $pdo->prepare("SELECT id, name, base_salary FROM users WHERE id = ?");
    $userStmt->execute([$userId]);
    $userData = $userStmt->fetch(PDO::FETCH_ASSOC);
    $baseSalary = (float)($userData['base_salary'] ?? 0);
    
    // Get attendance for the month
    $attStmt = $pdo->prepare("SELECT * FROM attendance WHERE user_id = ? AND DATE_FORMAT(attendance_date, '%Y-%m') = ? ORDER BY attendance_date");
    $attStmt->execute([$userId, $month]);
    $attendance = $attStmt->fetchAll(PDO::FETCH_ASSOC);
    
    $totalLateMinutes = 0;
    $totalOvertimeMinutes = 0;
    $daysPresent = 0;
    $daysAbsent = 0;
    $daysLate = 0;
    foreach ($attendance as $a) {
        $totalLateMinutes += (int)$a['late_minutes'];
        $totalOvertimeMinutes += (int)$a['overtime_minutes'];
        if ($a['status'] === 'absent') $daysAbsent++;
        else {
            $daysPresent++;
            if ($a['status'] === 'late') $daysLate++;
        }
    }
    
    // Hourly rate = base_salary / 30 / 8
    $hourlyRate = $baseSalary > 0 ? $baseSalary / 30 / 8 : 0;
    $lateDeduction = round(($totalLateMinutes / 60) * $hourlyRate, 2);
    $overtimeAmount = round(($totalOvertimeMinutes / 60) * $hourlyRate * 1.5, 2);
    
    // Pending advances
    $advStmt = $pdo->prepare("SELECT * FROM advances WHERE user_id = ? AND status = 'pending'");
    $advStmt->execute([$userId]);
    $pendingAdvances = $advStmt->fetchAll(PDO::FETCH_ASSOC);
    $totalAdvances = array_sum(array_column($pendingAdvances, 'amount'));
    
    sendResponse([
        "user" => $userData,
        "base_salary" => $baseSalary,
        "month" => $month,
        "attendance" => $attendance,
        "days_present" => $daysPresent,
        "days_absent" => $daysAbsent,
        "days_late" => $daysLate,
        "total_late_minutes" => $totalLateMinutes,
        "total_overtime_minutes" => $totalOvertimeMinutes,
        "hourly_rate" => $hourlyRate,
        "late_deduction" => $lateDeduction,
        "overtime_amount" => $overtimeAmount,
        "pending_advances" => $pendingAdvances,
        "total_advances" => (float)$totalAdvances,
    ]);
}

// ── Salaries ──
if ($path === 'salaries') {
    if ($method === 'GET') {
        sendResponse($pdo->query("SELECT * FROM salaries ORDER BY paid_at DESC")->fetchAll(PDO::FETCH_ASSOC));
    }
    if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $baseSalary = (float)($data['base_salary'] ?? 0);
        $amount = (float)($data['amount'] ?? 0);
        $bonus = (float)($data['bonus'] ?? 0);
        $overtimeHours = (float)($data['overtime_hours'] ?? 0);
        $overtimeAmount = (float)($data['overtime_amount'] ?? 0);
        $lateHours = (float)($data['late_hours'] ?? 0);
        $lateDeduction = (float)($data['late_deduction'] ?? 0);
        $advancesDeduction = (float)($data['advances_deduction'] ?? 0);
        $deductions = (float)($data['deductions'] ?? 0);
        $net = $amount + $bonus + $overtimeAmount - $lateDeduction - $advancesDeduction - $deductions;
        
        $stmt = $pdo->prepare("INSERT INTO salaries (user_id, user_name, base_salary, amount, bonus, overtime_hours, overtime_amount, late_hours, late_deduction, advances_deduction, deductions, net_salary, month, notes, attendance_summary, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['user_id'],
            $data['user_name'],
            $baseSalary,
            $amount, $bonus,
            $overtimeHours, $overtimeAmount,
            $lateHours, $lateDeduction,
            $advancesDeduction,
            $deductions, $net,
            $data['month'] ?? date('Y-m'),
            $data['notes'] ?? '',
            $data['attendance_summary'] ?? '',
            $data['created_by'] ?? 'Admin'
        ]);
        
        // Mark advances as deducted
        if ($advancesDeduction > 0 && isset($data['user_id'])) {
            $pdo->prepare("UPDATE advances SET status = 'deducted' WHERE user_id = ? AND status = 'pending'")->execute([$data['user_id']]);
        }
        
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
    $advTotal = 0;
    try { $advTotal = $pdo->query("SELECT COALESCE(SUM(amount),0) as total FROM advances WHERE status = 'pending'")->fetch(PDO::FETCH_ASSOC)['total']; } catch (Exception $e) {}
    $thisMonth = date('Y-m');
    $expMonth = $pdo->prepare("SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE DATE_FORMAT(created_at, '%Y-%m') = ?");
    $expMonth->execute([$thisMonth]);
    $salMonth = $pdo->prepare("SELECT COALESCE(SUM(net_salary),0) as total FROM salaries WHERE month = ?");
    $salMonth->execute([$thisMonth]);
    sendResponse([
        "total_expenses" => (float)$expTotal,
        "total_salaries" => (float)$salTotal,
        "total_advances" => (float)$advTotal,
        "month_expenses" => (float)$expMonth->fetch(PDO::FETCH_ASSOC)['total'],
        "month_salaries" => (float)$salMonth->fetch(PDO::FETCH_ASSOC)['total'],
    ]);
}
?>
