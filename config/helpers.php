<?php
// ============================================================
//  config/helpers.php — Fungsi Pembantu API
// ============================================================

/**
 * Kirim response JSON sukses
 */
function respond(bool $success, string $message, $data = null, int $code = 200): void {
    http_response_code($code);
    $res = ['success' => $success, 'message' => $message];
    if ($data !== null) $res['data'] = $data;
    echo json_encode($res, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Ambil body JSON dari request
 */
function getBody(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

/**
 * Pastikan method sesuai, atau tolak
 */
function requireMethod(string ...$methods): void {
    if (!in_array($_SERVER['REQUEST_METHOD'], $methods)) {
        respond(false, 'Method tidak diizinkan', null, 405);
    }
}
