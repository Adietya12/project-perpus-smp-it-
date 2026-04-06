<?php
require_once '../../config/db.php';
require_once '../../config/helpers.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

/* ── GET: ambil semua / satu buku ── */
if ($method === 'GET') {
    if ($id) {
        $stmt = $db->prepare("SELECT * FROM buku WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        $row ? respond(true, 'OK', $row) : respond(false, 'Buku tidak ditemukan.', null, 404);
    } else {
        $rows = $db->query("SELECT * FROM buku ORDER BY id DESC")->fetch_all(MYSQLI_ASSOC);
        respond(true, 'OK', $rows);
    }
}

/* ── POST: tambah buku ── */
if ($method === 'POST') {
    $b = getBody();
    if (!($b['kode_buku'] ?? '') || !($b['judul'] ?? '') || !($b['pengarang'] ?? '')) {
        respond(false, 'Kode, judul, dan pengarang wajib diisi.', null, 400);
    }
    $stok = (int)($b['stok'] ?? 0);
    $stmt = $db->prepare(
        "INSERT INTO buku (kode_buku,judul,pengarang,penerbit,tahun_terbit,kategori,stok,stok_tersedia)
         VALUES (?,?,?,?,?,?,?,?)"
    );
    $stmt->bind_param('ssssissi',
        $b['kode_buku'], $b['judul'], $b['pengarang'],
        $b['penerbit'],  $b['tahun_terbit'], $b['kategori'],
        $stok, $stok
    );
    $stmt->execute();
    $newId = $db->insert_id;
    $stmt->close();
    respond(true, 'Buku berhasil ditambahkan.', ['id' => $newId], 201);
}

/* ── PUT: edit buku ── */
if ($method === 'PUT') {
    if (!$id) respond(false, 'ID diperlukan.', null, 400);
    $b = getBody();

    // Hitung selisih stok untuk update stok_tersedia
    $cur = $db->query("SELECT stok, stok_tersedia FROM buku WHERE id = $id")->fetch_assoc();
    if (!$cur) respond(false, 'Buku tidak ditemukan.', null, 404);

    $stokBaru     = (int)($b['stok'] ?? $cur['stok']);
    $selisih      = $stokBaru - $cur['stok'];
    $tersediaBaru = max(0, $cur['stok_tersedia'] + $selisih);

    $stmt = $db->prepare(
        "UPDATE buku SET kode_buku=?,judul=?,pengarang=?,penerbit=?,tahun_terbit=?,
         kategori=?,stok=?,stok_tersedia=? WHERE id=?"
    );
    $stmt->bind_param('ssssissii',
        $b['kode_buku'], $b['judul'], $b['pengarang'],
        $b['penerbit'],  $b['tahun_terbit'], $b['kategori'],
        $stokBaru, $tersediaBaru, $id
    );
    $stmt->execute();
    $stmt->close();
    respond(true, 'Buku berhasil diperbarui.');
}

/* ── DELETE: hapus buku ── */
if ($method === 'DELETE') {
    if (!$id) respond(false, 'ID diperlukan.', null, 400);
    $stmt = $db->prepare("DELETE FROM buku WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $stmt->close();
    respond(true, 'Buku berhasil dihapus.');
}
