<?php
require_once '../../config/db.php';
require_once '../../config/helpers.php';
session_start();

requireMethod('POST');
$body = getBody();

$username = trim($body['username'] ?? '');
$password = $body['password'] ?? '';

if (!$username || !$password) {
    respond(false, 'Username dan password wajib diisi.', null, 400);
}

$db   = getDB();
$stmt = $db->prepare("SELECT id, username, password, nama FROM admin WHERE username = ?");
$stmt->bind_param('s', $username);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$row || $row['password'] !== md5($password)) {
    respond(false, 'Username atau password salah.', null, 401);
}

$_SESSION['admin_id']   = $row['id'];
$_SESSION['admin_nama'] = $row['nama'];

respond(true, 'Login berhasil.', ['nama' => $row['nama']]);
