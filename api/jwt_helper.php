<?php
// api/jwt_helper.php

class JWT
{
    private static $secret;

    public static function setSecret($s)
    {
        self::$secret = $s;
    }

    public static function sign($payload)
    {
        $payload['iat'] = time();
        $payload['exp'] = time() + (60 * 60 * 24); // 24 hour expiry
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode(json_encode($payload));
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secret, true);
        $base64UrlSignature = self::base64UrlEncode($signature);
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public static function verify($token)
    {
        if (empty($token) || !is_string($token)) {
            return false;
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }

        list($header, $payload, $signature) = $parts;

        // Re-generate signature to verify
        $validSignature = self::hashHmac($header . "." . $payload, self::$secret);

        // Use hash_equals for timing attack protection
        if (!hash_equals($signature, $validSignature)) {
            return false;
        }

        // Decode payload
        $decoded = json_decode(self::base64UrlDecode($payload), true);

        // Validate expiration
        if (isset($decoded['exp']) && $decoded['exp'] < time()) {
            return false;
        }

        // Validate issued-at is not in future
        if (isset($decoded['iat']) && $decoded['iat'] > time() + 60) {
            return false;
        }

        return $decoded;

    private static function base64UrlEncode($data)
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }

    private static function base64UrlDecode($data)
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $padlen = 4 - $remainder;
            $data .= str_repeat('=', $padlen);
        }
        return base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
    }

    private static function hashHmac($data, $key)
    {
        return self::base64UrlEncode(hash_hmac('sha256', $data, $key, true));
    }
}
?>