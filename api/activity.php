<?php
// api/activity.php
require_once 'config.php';
require_once 'jwt_helper.php';

JWT::setSecret($jwt_secret);
$token = getBearerToken();
if (!JWT::verify($token))
    sendResponse(["message" => "غير مصرح"], 401);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Self-Healing: Create Table if not exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        action VARCHAR(255) NOT NULL,
        entity_type VARCHAR(50) NULL,
        entity_id INT NULL,
        details TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $userId = $_GET['user_id'] ?? null;

    // Clean userId if it's sent as string "undefined" or "null" by frontend
    if ($userId === 'undefined' || $userId === 'null' || $userId === '') {
        $userId = null;
    }

    $query = "SELECT a.*, u.name as user_name, u.email as user_email 
              FROM activity_logs a 
              LEFT JOIN users u ON a.user_id = u.id ";

    if ($userId !== null && is_numeric($userId)) {
        $stmt = $pdo->prepare($query . " WHERE a.user_id = ? ORDER BY a.created_at DESC LIMIT 100");
        $stmt->execute([$userId]);
    } else {
        $stmt = $pdo->prepare($query . " ORDER BY a.created_at DESC LIMIT 100");
        $stmt->execute();
    }

    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    sendResponse($results);
}
?>