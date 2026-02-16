<?php
// api/auth.php
require_once 'config.php';
require_once 'jwt_helper.php';
require_once 'activity_helper.php';

JWT::setSecret($jwt_secret);

$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_GET['path']) ? $_GET['path'] : '';

if ($path === 'login' && $method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $email = trim(strtolower($data['email'] ?? ''));
    $password = trim($data['password'] ?? '');

    // Input validation
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(["message" => "البريد الإلكتروني غير صالح"], 400);
    }
    if (empty($password) || mb_strlen($password) < 4 || mb_strlen($password) > 255) {
        sendResponse(["message" => "كلمة المرور غير صالحة"], 400);
    }

    // Check in SQL Database only - no hardcoded credentials
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password'])) {
        if ($user['status'] !== 'active') {
            sendResponse(["message" => "الحساب موقوف، تواصل مع المدير"], 403);
        }
        $tokenPayload = ["id" => $user['id'], "email" => $user['email'], "role" => $user['role']];
        $token = JWT::sign($tokenPayload);
        logActivity($pdo, $user['id'], "تسجيل دخول", "user", $user['id']);
        sendResponse(["token" => $token, "user" => $user]);
    } else {
        sendResponse(["message" => "بيانات الدخول غير صحيحة"], 401);
    }
}

if ($path === 'verify') {
    $token = getBearerToken();
    if (!$token)
        sendResponse(["message" => "Unauthorized"], 401);

    $decoded = JWT::verify($token);
    if (!$decoded)
        sendResponse(["message" => "Invalid Token"], 401);

    // Fetch fresh user data from SQL
    $stmt = $pdo->prepare("SELECT id, name, email, role, status FROM users WHERE id = ?");
    $stmt->execute([$decoded['id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user)
        sendResponse(["message" => "User not found"], 401);
    sendResponse(["user" => $user]);
}
?>