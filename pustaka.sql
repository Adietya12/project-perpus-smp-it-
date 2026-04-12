-- ============================================================
--  pustaka.sql  —  Jalankan di phpMyAdmin atau MySQL CLI
--  XAMPP: http://localhost/phpmyadmin
-- ============================================================

CREATE DATABASE IF NOT EXISTS pustaka
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pustaka;

-- ── Tabel Buku ──
CREATE TABLE IF NOT EXISTS buku (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  kode_buku     VARCHAR(20)  NOT NULL UNIQUE,
  judul         VARCHAR(255) NOT NULL,
  pengarang     VARCHAR(150) NOT NULL,
  penerbit      VARCHAR(150),
  tahun_terbit  YEAR,
  kategori      VARCHAR(100),
  stok          INT NOT NULL DEFAULT 0,
  stok_tersedia INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── Tabel Anggota ──
CREATE TABLE IF NOT EXISTS anggota (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  nomor_anggota  VARCHAR(20)  UNIQUE,
  nama           VARCHAR(150) NOT NULL,
  email          VARCHAR(150),
  no_telepon     VARCHAR(20),
  alamat         TEXT,
  status         ENUM('aktif','nonaktif') DEFAULT 'aktif',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── Tabel Transaksi ──
CREATE TABLE IF NOT EXISTS transaksi (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  kode_transaksi        VARCHAR(30) NOT NULL UNIQUE,
  anggota_id            INT NOT NULL,
  buku_id               INT NOT NULL,
  tanggal_pinjam        DATE NOT NULL,
  tanggal_batas_kembali DATE NOT NULL,
  tanggal_kembali       DATE DEFAULT NULL,
  status                ENUM('dipinjam','dikembalikan') DEFAULT 'dipinjam',
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (anggota_id) REFERENCES anggota(id) ON DELETE RESTRICT,
  FOREIGN KEY (buku_id)    REFERENCES buku(id)    ON DELETE RESTRICT
);

-- ── Tabel Denda ──
CREATE TABLE IF NOT EXISTS denda (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  transaksi_id  INT NOT NULL,
  anggota_id    INT NOT NULL,
  hari_terlambat INT NOT NULL DEFAULT 0,
  jumlah_denda  DECIMAL(10,2) NOT NULL DEFAULT 0,
  status_bayar  ENUM('belum','lunas') DEFAULT 'belum',
  tanggal_bayar DATE DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (transaksi_id) REFERENCES transaksi(id) ON DELETE CASCADE,
  FOREIGN KEY (anggota_id)   REFERENCES anggota(id)   ON DELETE RESTRICT
);

-- ── Tabel Surat Bebas Pinjam ──
CREATE TABLE IF NOT EXISTS surat_bebas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nomor_surat VARCHAR(50) NOT NULL UNIQUE,
  anggota_id  INT NOT NULL,
  tanggal     DATE NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (anggota_id) REFERENCES anggota(id) ON DELETE RESTRICT
);

-- ── Tabel Admin ──
CREATE TABLE IF NOT EXISTS admin (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(50)  NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,  -- bcrypt hash
  nama       VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Data Awal Admin ──
-- Password: admin123
INSERT INTO admin (username, password, nama) VALUES
('admin', '0192023a7bbd73250516f069df18b500', 'Administrator'),
('pustaka', '0192023a7bbd73250516f069df18b500', 'Admin Pustaka');

-- ── Sample Data Buku ──
INSERT INTO buku (kode_buku, judul, pengarang, penerbit, tahun_terbit, kategori, stok, stok_tersedia) VALUES
('BK001', 'Laskar Pelangi',      'Andrea Hirata',           'Bentang Pustaka',   2005, 'Novel',     5, 5),
('BK002', 'Bumi Manusia',        'Pramoedya Ananta Toer',   'Lentera Dipantara', 1980, 'Novel',     3, 3),
('BK003', 'Pemrograman Web PHP', 'Bunafit Nugroho',         'Gava Media',        2014, 'Teknologi', 4, 4),
('BK004', 'Filosofi Teras',      'Henry Manampiring',       'Kompas',            2018, 'Non-fiksi', 6, 6);

-- ── Sample Data Anggota ──
INSERT INTO anggota (nomor_anggota, nama, email, no_telepon, alamat) VALUES
('AGT001', 'Budi Santoso', 'budi@email.com',  '081234567890', 'Jl. Merdeka No.1, Jakarta'),
('AGT002', 'Siti Rahayu',  'siti@email.com',  '082345678901', 'Jl. Sudirman No.5, Bandung'),
('AGT003', 'Ahmad Fauzi',  'ahmad@email.com', '083456789012', 'Jl. Diponegoro No.10, Surabaya');
