<?php
require_once '../../config/db.php';
require_once '../../config/helpers.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';   // 'pinjam' | 'kembali'

/* ── GET: ambil semua transaksi (join anggota & buku) ── */
if ($method === 'GET') {
    $sql = "SELECT t.*, a.nama AS nama_anggota, a.nomor_anggota,
                   b.judul AS judul_buku, b.kode_buku
            FROM transaksi t
            JOIN anggota a ON t.anggota_id = a.id
            JOIN buku    b ON t.buku_id    = b.id
            ORDER BY t.id DESC";
    $rows = $db->query($sql)->fetch_all(MYSQLI_ASSOC);
    respond(true, 'OK', $rows);
}

/* ── POST action=pinjam: catat peminjaman ── */
if ($method === 'POST' && $action === 'pinjam') {
    $body = getBody();
    $anggotaId = (int)($body['anggota_id'] ?? 0);
    $bukuId    = (int)($body['buku_id']    ?? 0);
    $tglPinjam = $body['tanggal_pinjam']        ?? date('Y-m-d');
    $tglBatas  = $body['tanggal_batas_kembali'] ?? date('Y-m-d', strtotime('+7 days'));

    if (!$anggotaId || !$bukuId) {
        respond(false, 'Anggota dan buku wajib dipilih.', null, 400);
    }

    // Cek denda belum lunas
    $cekDenda = $db->prepare("SELECT id FROM denda WHERE anggota_id=? AND status_bayar='belum' LIMIT 1");
    $cekDenda->bind_param('i', $anggotaId);
    $cekDenda->execute();
    if ($cekDenda->get_result()->num_rows > 0) {
        respond(false, 'Anggota masih memiliki denda yang belum dibayar.', null, 400);
    }
    $cekDenda->close();

    // Cek stok tersedia
    $cekStok = $db->prepare("SELECT stok_tersedia FROM buku WHERE id=?");
    $cekStok->bind_param('i', $bukuId);
    $cekStok->execute();
    $stokRow = $cekStok->get_result()->fetch_assoc();
    $cekStok->close();
    if (!$stokRow || $stokRow['stok_tersedia'] < 1) {
        respond(false, 'Stok buku tidak tersedia.', null, 400);
    }

    $kode = 'TRX' . date('ymd') . rand(100,999);

    $db->begin_transaction();
    try {
        $ins = $db->prepare(
            "INSERT INTO transaksi (kode_transaksi,anggota_id,buku_id,tanggal_pinjam,tanggal_batas_kembali,status)
             VALUES (?,?,?,?,?,'dipinjam')"
        );
        $ins->bind_param('siiss', $kode, $anggotaId, $bukuId, $tglPinjam, $tglBatas);
        $ins->execute();
        $ins->close();

        $db->query("UPDATE buku SET stok_tersedia = stok_tersedia - 1 WHERE id = $bukuId");
        $db->commit();
        respond(true, "Peminjaman berhasil. Kode: $kode", ['kode_transaksi' => $kode], 201);
    } catch (Exception $e) {
        $db->rollback();
        respond(false, 'Terjadi kesalahan: ' . $e->getMessage(), null, 500);
    }
}

/* ── POST action=kembali: proses pengembalian ── */
if ($method === 'POST' && $action === 'kembali') {
    $body        = getBody();
    $transaksiId = (int)($body['transaksi_id'] ?? 0);
    if (!$transaksiId) respond(false, 'ID transaksi diperlukan.', null, 400);

    $stmt = $db->prepare("SELECT * FROM transaksi WHERE id=? AND status='dipinjam'");
    $stmt->bind_param('i', $transaksiId);
    $stmt->execute();
    $t = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$t) respond(false, 'Transaksi tidak ditemukan atau sudah dikembalikan.', null, 404);

    $tglKembali  = date('Y-m-d');
    $tglBatas    = $t['tanggal_batas_kembali'];
    $hariTerlambat = max(0, (int)((strtotime($tglKembali) - strtotime($tglBatas)) / 86400));
    $jumlahDenda = $hariTerlambat * DENDA_PER_HARI;

    $db->begin_transaction();
    try {
        // Update status transaksi
        $upd = $db->prepare("UPDATE transaksi SET status='dikembalikan', tanggal_kembali=? WHERE id=?");
        $upd->bind_param('si', $tglKembali, $transaksiId);
        $upd->execute();
        $upd->close();

        // Tambah stok
        $db->query("UPDATE buku SET stok_tersedia = stok_tersedia + 1 WHERE id = {$t['buku_id']}");

        // Catat denda jika terlambat
        if ($hariTerlambat > 0) {
            $ins = $db->prepare(
                "INSERT INTO denda (transaksi_id,anggota_id,hari_terlambat,jumlah_denda,status_bayar)
                 VALUES (?,?,?,?,'belum')"
            );
            $ins->bind_param('iiid', $transaksiId, $t['anggota_id'], $hariTerlambat, $jumlahDenda);
            $ins->execute();
            $ins->close();
        }

        $db->commit();
        respond(true, 'Pengembalian berhasil.', [
            'hari_terlambat' => $hariTerlambat,
            'jumlah_denda'   => $jumlahDenda,
        ]);
    } catch (Exception $e) {
        $db->rollback();
        respond(false, 'Terjadi kesalahan: ' . $e->getMessage(), null, 500);
    }
}
