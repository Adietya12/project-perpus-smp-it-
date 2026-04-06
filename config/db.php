<?php
// ============================================================
//  config/db.php — Koneksi Database MySQL
//  Sistem Informasi Perpustakaan
// ============================================================

define('DB_HOST',    'localhost');
define('DB_USER',    'root');       // default XAMPP
define('DB_PASS',    '');           // default XAMPP (kosong)
define('DB_NAME',    'pustaka');
define('DB_CHARSET', 'utf8mb4');

define('DENDA_PER_HARI', 1000);    // Rp 1.000/hari

/**
 * Mengembalikan koneksi mysqli (singleton).
 * Dipanggil oleh semua file API.
 */
function getDB(): mysqli {
    static $conn = null;

    if ($conn === null) {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

        if ($conn->connect_error) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Koneksi database gagal: ' . $conn->connect_error
            ]);
            exit;
        }

        $conn->set_charset(DB_CHARSET);
    }

    return $conn;
}

// ── CORS & Header (untuk fetch() dari frontend) ──────────────
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Tangani preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
