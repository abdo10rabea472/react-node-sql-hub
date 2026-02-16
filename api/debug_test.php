<?php
// Temporary debug file - DELETE AFTER FIXING
// Access directly: https://eltahan.vip472.com/api/debug_test.php

header("Content-Type: application/json; charset=UTF-8");

require_once 'config.php';

// 1. Check if admin exists
$stmt = $pdo->prepare("SELECT id, email, password, status, role FROM users WHERE email = ?");
$stmt->execute(['admin@stodio.com']);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(["error" => "Admin user NOT found in database!", "step" => "user_lookup"], JSON_UNESCAPED_UNICODE);
    exit();
}

// 2. Test password_verify
$verifyResult = password_verify('admin', $user['password']);

// 3. Generate a fresh hash and verify it works
$freshHash = password_hash('admin', PASSWORD_DEFAULT);
$freshVerify = password_verify('admin', $freshHash);

// 4. Check hash format
$hashInfo = [
    "length" => strlen($user['password']),
    "first_10_chars" => substr($user['password'], 0, 10),
    "starts_with_dollar" => (substr($user['password'], 0, 1) === '$'),
    "looks_like_bcrypt" => (bool) preg_match('/^\$2[aby]?\$\d+\$/', $user['password']),
];

// 5. Count total users
$totalUsers = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();

// 6. Try to manually update and re-verify
$pdo->prepare("UPDATE users SET password = ? WHERE email = 'admin@stodio.com'")->execute([$freshHash]);
$stmt2 = $pdo->prepare("SELECT password FROM users WHERE email = ?");
$stmt2->execute(['admin@stodio.com']);
$updatedPassword = $stmt2->fetchColumn();
$afterUpdateVerify = password_verify('admin', $updatedPassword);

echo json_encode([
    "php_version" => PHP_VERSION,
    "user_found" => true,
    "user_status" => $user['status'],
    "user_role" => $user['role'],
    "original_password_verify" => $verifyResult,
    "hash_info" => $hashInfo,
    "fresh_hash_self_verify" => $freshVerify,
    "after_update_verify" => $afterUpdateVerify,
    "updated_hash_first_10" => substr($updatedPassword, 0, 10),
    "total_users" => $totalUsers,
    "password_algo_info" => password_get_info($user['password']),
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>
