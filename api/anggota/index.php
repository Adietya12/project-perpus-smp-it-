<?php
require_once '../../config/db.php';
require_once '../../config/helpers.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

if ($method === 'GET') {
    if ($id) {
        $stmt = $db->prepare("SELECT * FROM anggota WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        $row ? respond(true, 'OK', $row) : respond(false, 'Anggota tidak ditemukan.', null, 404);
    } else {
        $rows = $db->query("SELECT * FROM anggota ORDER BY id DESC")->fetch_all(MYSQLI_ASSOC);
        respond(true, 'OK', $rows);
    }
}

if ($method === 'POST') {
    $a = getBody();
    if (!($a['nama'] ?? '')) {
        respond(false, 'Nama anggota wajib diisi.', null, 400);
    }
    $status = $a['status'] ?? 'aktif';
    $stmt = $db->prepare(
        "INSERT INTO anggota (nomor_anggota,nama,email,no_telepon,alamat,status)
         VALUES (?,?,?,?,?,?)"
    );
    $stmt->bind_param('ssssss',
        $a['nomor_anggota'], $a['nama'], $a['email'],
        $a['no_telepon'], $a['alamat'], $status
    );
    $stmt->execute();
    $newId = $db->insert_id;
    $stmt->close();
    respond(true, 'Anggota berhasil ditambahkan.', ['id' => $newId], 201);
}

if ($method === 'PUT') {
    if (!$id) respond(false, 'ID diperlukan.', null, 400);
    $a = getBody();
    $stmt = $db->prepare(
        "UPDATE anggota SET nomor_anggota=?,nama=?,email=?,no_telepon=?,alamat=?,status=? WHERE id=?"
    );
    $status = $a['status'] ?? 'aktif';
    $stmt->bind_param('ssssssi',
        $a['nomor_anggota'], $a['nama'], $a['email'],
        $a['no_telepon'], $a['alamat'], $status, $id
    );
    $stmt->execute();
    $stmt->close();
    respond(true, 'Anggota berhasil diperbarui.');
}

if ($method === 'DELETE') {
    if (!$id) respond(false, 'ID diperlukan.', null, 400);
    // Cek dulu apakah anggota punya transaksi
    $cek = $db->prepare("SELECT COUNT(*) AS total FROM transaksi WHERE anggota_id = ?");
    $cek->bind_param('i', $id);
    $cek->execute();
    $row = $cek->get_result()->fetch_assoc();
    $cek->close();

    if ($row['total'] > 0) {
        respond(false, 'Anggota tidak bisa dihapus karena masih memiliki riwayat transaksi.', null, 400);
    }

    $stmt = $db->prepare("DELETE FROM anggota WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $stmt->close();
    respond(true, 'Anggota berhasil dihapus.');
}