<?php
// api/whatsapp.php
require_once 'config.php';
require_once 'jwt_helper.php';

JWT::setSecret($jwt_secret);
$token = getBearerToken();
if (!JWT::verify($token))
    sendResponse(["message" => "Unauthorized"], 401);

// Proxy requests to local Node.js WhatsApp Service (Port 3000)
// Note: I will use port 3000 for the node server as defined in server.js

function callNodeServer($endpoint, $method = 'GET', $data = null)
{
    $url = "http://localhost:3000" . $endpoint;

    $options = [
        'http' => [
            'header' => "Content-type: application/json\r\n",
            'method' => $method,
            'content' => $data ? json_encode($data) : null,
            'ignore_errors' => true // to capture status codes
        ]
    ];

    $context = stream_context_create($options);
    $result = @file_get_contents($url, false, $context);

    if ($result === FALSE) {
        return [
            "connected" => false,
            "status" => "disconnected",
            "message" => "WhatsApp Service is offline (Start node server!)"
        ];
    }

    return json_decode($result, true);
}

$action = $_GET['path'] ?? '';

// Route Requests
if ($action === 'status' || $action === '') {
    $response = callNodeServer('/status');
    sendResponse($response);
}

if ($action === 'start') {
    $response = callNodeServer('/start', 'POST');
    sendResponse($response);
}

if ($action === 'stop') {
    $response = callNodeServer('/stop', 'POST');
    sendResponse($response);
}

if ($action === 'send-message' || $action === 'send-invoice') {
    $input = json_decode(file_get_contents("php://input"), true);
    require_once 'activity_helper.php';
    logActivity($pdo, JWT::verify($token)['id'], "Sent WhatsApp: " . ($input['phone'] ?? 'unknown'), "whatsapp", null, $input);
    $response = callNodeServer('/send-message', 'POST', $input);
    sendResponse($response);
}

sendResponse(["message" => "Route not found"], 404);
?>