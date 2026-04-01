/* ============================================
   UTILS.JS — Fungsi-fungsi Pembantu
   ============================================ */
'use strict';

/** Format angka ke Rupiah */
function fRp(n) {
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

/** Format date string ke "12 Jan 2024" */
function fDate(s) {
  if (!s) return '-';
  const d = new Date(s);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Tanggal hari ini format YYYY-MM-DD */
function today() {
  return new Date().toISOString().split('T')[0];
}

/** Tambah N hari ke date string */
function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

/** Selisih hari (b - a), positif = b lebih belakang */
function daysDiff(a, b) {
  const d1 = new Date(a), d2 = new Date(b);
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

/** Generate kode unik */
function genKode(prefix) {
  return prefix + Date.now().toString().slice(-6);
}

/** Tampilkan alert di #alert-box */
function showAlert(msg, type = 'success') {
  const box = document.getElementById('alert-box');
  const typeClass = { success: 'alert-success', error: 'alert-error', warn: 'alert-warn' };
  box.innerHTML = `
    <div class="alert ${typeClass[type] || 'alert-success'}">
      ${msg}
      <button onclick="this.parentElement.remove()">×</button>
    </div>`;
  setTimeout(() => { if (box.firstChild) box.firstChild.remove(); }, 4500);
}

/** Buka modal */
function openModal(id) {
  const el = document.getElementById(id);
  el.classList.add('show');
  document.body.style.overflow = 'hidden';
}

/** Tutup modal */
function closeModal(id) {
  document.getElementById(id).classList.remove('show');
  // Kembalikan scroll body jika tidak ada modal lain yang terbuka
  if (!document.querySelector('.overlay.show')) {
    document.body.style.overflow = '';
  }
}

/** Filter baris tabel berdasarkan teks */
function filterTable(tbodyId, query) {
  const q = query.toLowerCase();
  document.querySelectorAll(`#${tbodyId} tr`).forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

/** Tutup semua modal saat klik overlay atau tekan Escape */
document.addEventListener('click', e => {
  if (e.target.classList.contains('overlay')) {
    e.target.classList.remove('show');
    if (!document.querySelector('.overlay.show')) document.body.style.overflow = '';
  }
  /* Tombol close dengan data-close */
  if (e.target.dataset.close) closeModal(e.target.dataset.close);
  /* Tombol goto halaman */
  if (e.target.dataset.goto) navigateTo(e.target.dataset.goto);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.overlay.show').forEach(m => m.classList.remove('show'));
    document.body.style.overflow = '';
  }
});
