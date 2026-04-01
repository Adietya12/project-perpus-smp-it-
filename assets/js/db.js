/* ============================================
   DB.JS — Data Store (In-Memory)
   ============================================ */
'use strict';

const DB = {
  buku: [
    { id:1, kode:'BK001', judul:'Laskar Pelangi',      pengarang:'Andrea Hirata',         penerbit:'Bentang Pustaka',   tahun:2005, kategori:'Novel',     stok:5, tersedia:5 },
    { id:2, kode:'BK002', judul:'Bumi Manusia',        pengarang:'Pramoedya Ananta Toer', penerbit:'Lentera Dipantara', tahun:1980, kategori:'Novel',     stok:3, tersedia:3 },
    { id:3, kode:'BK003', judul:'Pemrograman Web PHP', pengarang:'Bunafit Nugroho',       penerbit:'Gava Media',        tahun:2014, kategori:'Teknologi', stok:4, tersedia:4 },
    { id:4, kode:'BK004', judul:'Filosofi Teras',      pengarang:'Henry Manampiring',     penerbit:'Kompas',            tahun:2018, kategori:'Non-fiksi', stok:6, tersedia:6 },
  ],
  anggota: [
    { id:1, nomor:'AGT001', nama:'Budi Santoso', email:'budi@email.com',  telp:'081234567890', alamat:'Jl. Merdeka No.1, Jakarta',     status:'aktif' },
    { id:2, nomor:'AGT002', nama:'Siti Rahayu',  email:'siti@email.com',  telp:'082345678901', alamat:'Jl. Sudirman No.5, Bandung',     status:'aktif' },
    { id:3, nomor:'AGT003', nama:'Ahmad Fauzi',  email:'ahmad@email.com', telp:'083456789012', alamat:'Jl. Diponegoro No.10, Surabaya', status:'aktif' },
  ],
  transaksi: [],
  denda:     [],
  surat:     [],
  nextId: { buku:5, anggota:4, transaksi:1, denda:1, surat:1 },
};

const DENDA_PER_HARI = 1000;
