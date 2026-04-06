/* ============================================
   API.JS — Penghubung Frontend ↔ PHP Backend
   ============================================ */
"use strict";

const BASE_URL = "/pustaka/api";

let DB = {
  buku: [],
  anggota: [],
  transaksi: [],
  denda: [],
  surat: [],
};

const DENDA_PER_HARI = 1000;

async function apiFetch(url, options = {}) {
  try {
    const res = await fetch(BASE_URL + url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.error("API error:", err);
    return { success: false, message: "Koneksi ke server gagal." };
  }
}

async function loadAllData() {
  const [resBuku, resAnggota, resTrx, resDenda, resSurat] = await Promise.all([
    apiFetch("/buku/index.php"),
    apiFetch("/anggota/index.php"),
    apiFetch("/transaksi/index.php"),
    apiFetch("/denda/index.php"),
    apiFetch("/surat/index.php"),
  ]);
  if (resBuku.success) DB.buku = resBuku.data;
  if (resAnggota.success) DB.anggota = resAnggota.data;
  if (resTrx.success) DB.transaksi = resTrx.data;
  if (resDenda.success) DB.denda = resDenda.data;
  if (resSurat.success) DB.surat = resSurat.data;
}

/* ── BUKU ── */
async function apiBukuCreate(data) {
  const res = await apiFetch("/buku/index.php", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (res.success) {
    const all = await apiFetch("/buku/index.php");
    if (all.success) DB.buku = all.data;
  }
  return res;
}
async function apiBukuUpdate(id, data) {
  const res = await apiFetch(`/buku/index.php?id=${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (res.success) {
    const all = await apiFetch("/buku/index.php");
    if (all.success) DB.buku = all.data;
  }
  return res;
}
async function apiBukuDelete(id) {
  const res = await apiFetch(`/buku/index.php?id=${id}`, { method: "DELETE" });
  if (res.success) DB.buku = DB.buku.filter((b) => b.id !== id);
  return res;
}

/* ── ANGGOTA ── */
async function apiAnggotaCreate(data) {
  const res = await apiFetch("/anggota/index.php", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (res.success) {
    const all = await apiFetch("/anggota/index.php");
    if (all.success) DB.anggota = all.data;
  }
  return res;
}
async function apiAnggotaUpdate(id, data) {
  const res = await apiFetch(`/anggota/index.php?id=${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (res.success) {
    const all = await apiFetch("/anggota/index.php");
    if (all.success) DB.anggota = all.data;
  }
  return res;
}
async function apiAnggotaDelete(id) {
  const res = await apiFetch(`/anggota/index.php?id=${id}`, {
    method: "DELETE",
  });
  if (res.success) DB.anggota = DB.anggota.filter((a) => a.id !== id);
  return res;
}

/* ── TRANSAKSI ── */
async function apiPinjam(data) {
  const res = await apiFetch("/transaksi/index.php?action=pinjam", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (res.success) await refreshTransaksi();
  return res;
}
async function apiKembali(transaksiId) {
  const res = await apiFetch("/transaksi/index.php?action=kembali", {
    method: "POST",
    body: JSON.stringify({ transaksi_id: transaksiId }),
  });
  if (res.success) await refreshTransaksi();
  return res;
}
async function refreshTransaksi() {
  const [trx, buku, denda] = await Promise.all([
    apiFetch("/transaksi/index.php"),
    apiFetch("/buku/index.php"),
    apiFetch("/denda/index.php"),
  ]);
  if (trx.success) DB.transaksi = trx.data;
  if (buku.success) DB.buku = buku.data;
  if (denda.success) DB.denda = denda.data;
}

/* ── DENDA ── */
async function apiBayarDenda(id) {
  const res = await apiFetch(`/denda/index.php?id=${id}`, { method: "PUT" });
  if (res.success) {
    const all = await apiFetch("/denda/index.php");
    if (all.success) DB.denda = all.data;
  }
  return res;
}

/* ── SURAT ── */
async function apiBuatSurat(anggotaId) {
  const res = await apiFetch("/surat/index.php", {
    method: "POST",
    body: JSON.stringify({ anggota_id: anggotaId }),
  });
  if (res.success) {
    const all = await apiFetch("/surat/index.php");
    if (all.success) DB.surat = all.data;
  }
  return res;
}
