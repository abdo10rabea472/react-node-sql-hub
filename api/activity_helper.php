<?php
// api/activity_helper.php
function logActivity($pdo, $userId, $action, $entityType = null, $entityId = null, $details = null)
{
    try {
        $stmt = $pdo->prepare("INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $userId,
            $action,
            $entityType,
            $entityId,
            $details ? json_encode($details) : null
        ]);
    } catch (PDOException $e) {
        // Silent error for logging
    }
}
?>