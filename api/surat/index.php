<?php
require_once '../../config/db.php';
require_once '../../config/helpers.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT s.*, a.nama AS nama_anggota, a.nomor_anggota, a.alamat
            FROM surat_bebas s
            JOIN anggota a ON s.anggota_id = a.id
            ORDER BY s.id DESC";
    $rows = $db->query($sql)->fetch_all(MYSQLI_ASSOC);
    respond(true, 'OK', $rows);
}

if ($method === 'POST') {
    $body      = getBody();
    $anggotaId = (int)($body['anggota_id'] ?? 0);
    if (!$anggotaId) respond(false, 'Anggota wajib dipilih.', null, 400);

    // Cek pinjaman aktif
    $cekPinjam = $db->prepare("SELECT id FROM transaksi WHERE anggota_id=? AND status='dipinjam' LIMIT 1");
    $cekPinjam->bind_param('i', $anggotaId);
    $cekPinjam->execute();
    if ($cekPinjam->get_result()->num_rows > 0) {
        respond(false, 'Anggota masih memiliki buku yang dipinjam.', null, 400);
    }
    $cekPinjam->close();

    // Cek denda belum lunas
    $cekDenda = $db->prepare("SELECT id FROM denda WHERE anggota_id=? AND status_bayar='belum' LIMIT 1");
    $cekDenda->bind_param('i', $anggotaId);
    $cekDenda->execute();
    if ($cekDenda->get_result()->num_rows > 0) {
        respond(false, 'Anggota masih memiliki denda yang belum dibayar.', null, 400);
    }
    $cekDenda->close();

    // Generate nomor surat
    $count    = $db->query("SELECT COUNT(*) AS c FROM surat_bebas")->fetch_assoc()['c'] + 1;
    $nomor    = 'SBP/' . date('Y') . '/' . str_pad($count, 4, '0', STR_PAD_LEFT);
    $tanggal  = date('Y-m-d');

    $stmt = $db->prepare("INSERT INTO surat_bebas (nomor_surat,anggota_id,tanggal) VALUES (?,?,?)");
    $stmt->bind_param('sis', $nomor, $anggotaId, $tanggal);
    $stmt->execute();
    $newId = $db->insert_id;
    $stmt->close();

    // Ambil data lengkap untuk preview
    $row = $db->query("SELECT s.*, a.nama AS nama_anggota, a.nomor_anggota, a.alamat
                       FROM surat_bebas s JOIN anggota a ON s.anggota_id=a.id
                       WHERE s.id=$newId")->fetch_assoc();

    respond(true, "Surat $nomor berhasil diterbitkan.", $row, 201);
}

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if (!$id) respond(false, 'ID surat diperlukan.', null, 400);

    $stmt = $db->prepare("DELETE FROM surat_bebas WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $affected = $stmt->affected_rows;
    $stmt->close();

    $affected
        ? respond(true, 'Surat berhasil dihapus.')
        : respond(false, 'Surat tidak ditemukan.', null, 404);
}
