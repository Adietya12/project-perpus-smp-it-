<?php
require_once '../../config/db.php';
require_once '../../config/helpers.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

if ($method === 'GET') {
    $sql = "SELECT d.*, a.nama AS nama_anggota, a.nomor_anggota,
                   b.judul AS judul_buku, t.kode_transaksi
            FROM denda d
            JOIN anggota    a ON d.anggota_id    = a.id
            JOIN transaksi  t ON d.transaksi_id  = t.id
            JOIN buku       b ON t.buku_id        = b.id
            ORDER BY d.id DESC";
    $rows = $db->query($sql)->fetch_all(MYSQLI_ASSOC);
    respond(true, 'OK', $rows);
}

// Tandai lunas
if ($method === 'PUT') {
    if (!$id) respond(false, 'ID diperlukan.', null, 400);
    $tgl = date('Y-m-d');
    $stmt = $db->prepare("UPDATE denda SET status_bayar='lunas', tanggal_bayar=? WHERE id=?");
    $stmt->bind_param('si', $tgl, $id);
    $stmt->execute();
    $stmt->close();
    respond(true, 'Denda berhasil ditandai lunas.');
}
