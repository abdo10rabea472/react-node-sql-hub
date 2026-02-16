<?php
// api/weddingPricing.php
require_once 'config.php';
require_once 'jwt_helper.php';

JWT::setSecret($jwt_secret);
$token = getBearerToken();
if (!JWT::verify($token))
    sendResponse(["message" => "غير مصرح"], 401);

$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['path'] ?? '';
$id = $_GET['id'] ?? null;

if ($path === 'albums') {
    if ($method === 'GET') {
        sendResponse($pdo->query("SELECT * FROM wedding_albums ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC));
    }
    if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $pdo->prepare("INSERT INTO wedding_albums (name, price) VALUES (?, ?)");
        $stmt->execute([$data['name'], $data['price']]);
        sendResponse(["message" => "Album added", "id" => $pdo->lastInsertId()]);
    }
    // ... Add PUT/DELETE if needed
}

if ($path === 'videos') {
    if ($method === 'GET') {
        sendResponse($pdo->query("SELECT * FROM wedding_videos ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC));
    }
    if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $pdo->prepare("INSERT INTO wedding_videos (name, price) VALUES (?, ?)");
        $stmt->execute([$data['name'], $data['price']]);
        sendResponse(["message" => "Video added", "id" => $pdo->lastInsertId()]);
    }
}
?>