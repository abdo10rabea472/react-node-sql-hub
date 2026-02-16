<?php
// api/index.php
// Main Router for PHP API

// --- Router Logic ---
$uri = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);

// Serve static files directly if they exist
if (file_exists(__DIR__ . $uri) && !is_dir(__DIR__ . $uri)) {
    return false;
}

// 1. Clean Path
$uri = trim($uri, '/');
$parts = explode('/', $uri);

// Remove 'api' prefix if exists (from proxy)
if (($parts[0] ?? '') === 'api') {
    array_shift($parts);
}

$module = $parts[0] ?? '';
$action = $parts[1] ?? '';

// If action is numeric (e.g. users/5), treat as ID
if (is_numeric($action)) {
    $_GET['id'] = $action;
    $action = '';
}

// Pass path to modules
$_GET['path'] = $action;

// 2. Route to Module
switch ($module) {
    case 'auth':
        require 'auth.php';
        break;
    case 'users':
        require 'users.php';
        break;
    case 'invoices':
        require 'invoices.php';
        break;
    case 'customers':
        require 'customers.php';
        break;
    case 'pricing':
        require 'pricing.php';
        break;
    case 'settings':
        require 'settings.php';
        break;
    case 'purchases':
        require 'purchases.php';
        break;
    case 'activity':
        require 'activity.php';
        break;
    case 'inventory':
        require 'inventory.php';
        break;
    case 'wedding-pricing':
        require 'weddingPricing.php';
        break;
    case 'wedding-invoices':
        require 'weddingInvoices.php';
        break;
    case 'whatsapp':
        require 'whatsapp.php';
        break;
    default:
        // Handle root or 404
        if ($module === '') {
            echo json_encode(["message" => "STODIO API Ready", "version" => "1.0"]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Route not found: $module", "uri" => $uri]);
        }
        break;
}
?>