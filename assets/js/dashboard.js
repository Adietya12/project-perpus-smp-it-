/* ============================================
   DASHBOARD.JS — Logika Utama Dashboard
   ============================================ */
'use strict';

/* ══════════════════════════════════════
   NAVIGASI
══════════════════════════════════════ */
const PAGE_LABELS = {
  dashboard: 'Dashboard',
  buku:      'Manajemen Buku',
  anggota:   'Manajemen Anggota',
  pinjam:    'Peminjaman',
  kembali:   'Pengembalian',
  denda:     'Denda',
  surat:     'Surat Bebas Pinjam',
};

function navigateTo(pageId) {
  /* Sembunyikan semua halaman */
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  /* Tampilkan halaman tujuan */
  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');

  /* Aktifkan nav item */
  const navBtn = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (navBtn) navBtn.classList.add('active');

  /* Update breadcrumb */
  document.getElementById('breadcrumb-label').textContent = PAGE_LABELS[pageId] || pageId;

  /* Render halaman */
  renderPage(pageId);
}

/* ══════════════════════════════════════
   RENDER DISPATCHER
══════════════════════════════════════ */
function renderPage(pageId) {
  const map = {
    dashboard: renderDashboard,
    buku:      renderBuku,
    anggota:   renderAnggota,
    pinjam:    renderPinjam,
    kembali:   renderKembali,
    denda:     renderDenda,
    surat:     renderSurat,
  };
  if (map[pageId]) map[pageId]();
}

/* ══════════════════════════════════════
   RENDER DASHBOARD
══════════════════════════════════════ */
function renderDashboard() {
  const dipinjam  = DB.transaksi.filter(t => t.status === 'dipinjam');
  const terlambat = dipinjam.filter(t => t.batas < today());
  const totalDenda = DB.denda.filter(d => d.status === 'belum').reduce((s, d) => s + d.jumlah, 0);

  document.getElementById('stat-buku').textContent    = DB.buku.length;
  document.getElementById('stat-anggota').textContent = DB.anggota.length;
  document.getElementById('stat-pinjam').textContent  = dipinjam.length;
  document.getElementById('stat-denda').textContent   = fRp(totalDenda);
  document.getElementById('stat-terlambat-label').textContent = `↑ ${terlambat.length} terlambat`;

  /* Transaksi terbaru */
  const tbody = document.getElementById('dash-transaksi');
  const recent = DB.transaksi.slice(-10).reverse();
  if (!recent.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-cell">Belum ada transaksi</td></tr>';
  } else {
    tbody.innerHTML = recent.map(t => {
      const a = DB.anggota.find(x => x.id === t.anggotaId);
      const b = DB.buku.find(x => x.id === t.bukuId);
      const badge = t.status === 'dipinjam' ? 'badge-yellow' : 'badge-green';
      const label = t.status === 'dipinjam' ? 'Dipinjam' : 'Dikembalikan';
      return `<tr>
        <td>${a?.nama || '-'}</td>
        <td>${b?.judul || '-'}</td>
        <td><span class="badge ${badge}">${label}</span></td>
      </tr>`;
    }).join('');
  }

  /* Buku terlambat */
  const tbox = document.getElementById('dash-terlambat');
  if (!terlambat.length) {
    tbox.innerHTML = '<div class="empty-cell" style="padding:24px">Tidak ada keterlambatan</div>';
  } else {
    tbox.innerHTML = terlambat.map(t => {
      const a = DB.anggota.find(x => x.id === t.anggotaId);
      const b = DB.buku.find(x => x.id === t.bukuId);
      const hari = daysDiff(t.batas, today());
      return `<div class="activity-item">
        <div class="activity-dot red"></div>
        <div class="activity-text"><strong>${a?.nama}</strong> — ${b?.judul}</div>
        <span class="badge badge-red">${hari} hari</span>
      </div>`;
    }).join('');
  }
}

/* ══════════════════════════════════════
   RENDER BUKU
══════════════════════════════════════ */
function renderBuku() {
  document.getElementById('count-buku').textContent = DB.buku.length + ' buku';
  const tbody = document.getElementById('tbl-buku');

  if (!DB.buku.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-cell">Belum ada data buku</td></tr>';
    return;
  }

  tbody.innerHTML = DB.buku.map(b => `
    <tr>
      <td class="td-mono">${b.kode}</td>
      <td><strong>${b.judul}</strong></td>
      <td>${b.pengarang}</td>
      <td><span class="tag">${b.kategori}</span></td>
      <td>${b.stok}</td>
      <td>${b.tersedia > 0
        ? `<span class="badge badge-green">${b.tersedia}</span>`
        : '<span class="badge badge-red">Habis</span>'}</td>
      <td>
        <div class="btn-group">
          <button class="btn btn-ghost btn-sm" onclick="editBuku(${b.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="hapusBuku(${b.id})">Hapus</button>
        </div>
      </td>
    </tr>`).join('');
}

/* ── CRUD Buku ── */
function simpanBuku() {
  const id     = document.getElementById('buku-edit-id').value;
  const obj = {
    kode:      document.getElementById('buku-kode').value.trim(),
    judul:     document.getElementById('buku-judul').value.trim(),
    pengarang: document.getElementById('buku-pengarang').value.trim(),
    penerbit:  document.getElementById('buku-penerbit').value.trim(),
    tahun:     +document.getElementById('buku-tahun').value,
    kategori:  document.getElementById('buku-kategori').value.trim(),
    stok:      +document.getElementById('buku-stok').value,
  };

  if (!obj.kode || !obj.judul || !obj.pengarang) {
    showAlert('Kode, judul, dan pengarang wajib diisi.', 'error');
    return;
  }

  if (id) {
    const idx = DB.buku.findIndex(b => b.id === +id);
    const selisih = obj.stok - DB.buku[idx].stok;
    obj.tersedia = Math.max(0, DB.buku[idx].tersedia + selisih);
    DB.buku[idx] = { ...DB.buku[idx], ...obj };
    showAlert('Buku berhasil diperbarui.');
  } else {
    DB.buku.push({ id: DB.nextId.buku++, ...obj, tersedia: obj.stok });
    showAlert('Buku berhasil ditambahkan.');
  }

  closeModal('modal-buku');
  resetFormBuku();
  renderBuku();
  renderDashboard();
}

function editBuku(id) {
  const b = DB.buku.find(x => x.id === id);
  if (!b) return;
  document.getElementById('buku-edit-id').value   = b.id;
  document.getElementById('buku-kode').value       = b.kode;
  document.getElementById('buku-judul').value      = b.judul;
  document.getElementById('buku-pengarang').value  = b.pengarang;
  document.getElementById('buku-penerbit').value   = b.penerbit;
  document.getElementById('buku-tahun').value      = b.tahun;
  document.getElementById('buku-kategori').value   = b.kategori;
  document.getElementById('buku-stok').value       = b.stok;
  document.getElementById('modal-buku-title').textContent = 'Edit Buku';
  openModal('modal-buku');
}

function hapusBuku(id) {
  if (!confirm('Hapus buku ini?')) return;
  DB.buku = DB.buku.filter(b => b.id !== id);
  showAlert('Buku berhasil dihapus.');
  renderBuku();
  renderDashboard();
}

function resetFormBuku() {
  ['buku-edit-id','buku-kode','buku-judul','buku-pengarang','buku-penerbit','buku-kategori']
    .forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('buku-stok').value  = 1;
  document.getElementById('buku-tahun').value = new Date().getFullYear();
  document.getElementById('modal-buku-title').textContent = 'Tambah Buku';
}

/* ══════════════════════════════════════
   RENDER ANGGOTA
══════════════════════════════════════ */
function renderAnggota() {
  document.getElementById('count-anggota').textContent = DB.anggota.length + ' anggota';
  const tbody = document.getElementById('tbl-anggota');

  if (!DB.anggota.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Belum ada data anggota</td></tr>';
    return;
  }

  tbody.innerHTML = DB.anggota.map(a => `
    <tr>
      <td class="td-mono">${a.nomor}</td>
      <td><strong>${a.nama}</strong></td>
      <td>${a.email}</td>
      <td>${a.telp}</td>
      <td>${a.status === 'aktif'
        ? '<span class="badge badge-green">Aktif</span>'
        : '<span class="badge badge-gray">Nonaktif</span>'}</td>
      <td>
        <div class="btn-group">
          <button class="btn btn-ghost btn-sm" onclick="editAnggota(${a.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="hapusAnggota(${a.id})">Hapus</button>
        </div>
      </td>
    </tr>`).join('');
}

/* ── CRUD Anggota ── */
function simpanAnggota() {
  const id = document.getElementById('anggota-edit-id').value;
  const obj = {
    nomor:  document.getElementById('anggota-nomor').value.trim(),
    nama:   document.getElementById('anggota-nama').value.trim(),
    email:  document.getElementById('anggota-email').value.trim(),
    telp:   document.getElementById('anggota-telp').value.trim(),
    alamat: document.getElementById('anggota-alamat').value.trim(),
    status: document.getElementById('anggota-status').value,
  };

  if (!obj.nomor || !obj.nama) {
    showAlert('Nomor anggota dan nama wajib diisi.', 'error');
    return;
  }

  if (id) {
    const idx = DB.anggota.findIndex(a => a.id === +id);
    DB.anggota[idx] = { ...DB.anggota[idx], ...obj };
    showAlert('Anggota berhasil diperbarui.');
  } else {
    DB.anggota.push({ id: DB.nextId.anggota++, ...obj });
    showAlert('Anggota berhasil ditambahkan.');
  }

  closeModal('modal-anggota');
  resetFormAnggota();
  renderAnggota();
  renderDashboard();
}

function editAnggota(id) {
  const a = DB.anggota.find(x => x.id === id);
  if (!a) return;
  document.getElementById('anggota-edit-id').value = a.id;
  document.getElementById('anggota-nomor').value   = a.nomor;
  document.getElementById('anggota-nama').value    = a.nama;
  document.getElementById('anggota-email').value   = a.email;
  document.getElementById('anggota-telp').value    = a.telp;
  document.getElementById('anggota-alamat').value  = a.alamat;
  document.getElementById('anggota-status').value  = a.status;
  document.getElementById('modal-anggota-title').textContent = 'Edit Anggota';
  openModal('modal-anggota');
}

function hapusAnggota(id) {
  if (!confirm('Hapus anggota ini?')) return;
  DB.anggota = DB.anggota.filter(a => a.id !== id);
  showAlert('Anggota berhasil dihapus.');
  renderAnggota();
  renderDashboard();
}

function resetFormAnggota() {
  ['anggota-edit-id','anggota-nomor','anggota-nama','anggota-email','anggota-telp','anggota-alamat']
    .forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('anggota-status').value = 'aktif';
  document.getElementById('modal-anggota-title').textContent = 'Tambah Anggota';
}

/* ══════════════════════════════════════
   RENDER PEMINJAMAN
══════════════════════════════════════ */
function renderPinjam() {
  const aktif = DB.transaksi.filter(t => t.status === 'dipinjam');
  document.getElementById('count-pinjam').textContent = aktif.length;
  const tbody = document.getElementById('tbl-pinjam');

  if (!aktif.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Tidak ada peminjaman aktif</td></tr>';
  } else {
    tbody.innerHTML = aktif.map(t => {
      const a = DB.anggota.find(x => x.id === t.anggotaId);
      const b = DB.buku.find(x => x.id === t.bukuId);
      const terlambat = t.batas < today();
      return `<tr>
        <td class="td-mono">${t.kode}</td>
        <td>${a?.nama || '-'}</td>
        <td>${b?.judul || '-'}</td>
        <td>${fDate(t.tgl)}</td>
        <td>${fDate(t.batas)} ${terlambat ? '<span class="badge badge-red">Terlambat</span>' : ''}</td>
        <td>${terlambat
          ? '<span class="badge badge-red">Terlambat</span>'
          : '<span class="badge badge-yellow">Dipinjam</span>'}</td>
      </tr>`;
    }).join('');
  }

  /* Populate select anggota & buku di modal */
  const selA = document.getElementById('pinjam-anggota');
  selA.innerHTML = '<option value="">-- Pilih Anggota --</option>' +
    DB.anggota.filter(a => a.status === 'aktif')
      .map(a => `<option value="${a.id}">${a.nomor} — ${a.nama}</option>`).join('');

  const selB = document.getElementById('pinjam-buku');
  selB.innerHTML = '<option value="">-- Pilih Buku --</option>' +
    DB.buku.filter(b => b.tersedia > 0)
      .map(b => `<option value="${b.id}">[${b.kode}] ${b.judul} (stok: ${b.tersedia})</option>`).join('');

  document.getElementById('pinjam-tgl').value   = today();
  document.getElementById('pinjam-batas').value = addDays(today(), 7);
}

function simpanPinjam() {
  const anggotaId = +document.getElementById('pinjam-anggota').value;
  const bukuId    = +document.getElementById('pinjam-buku').value;
  const tgl       = document.getElementById('pinjam-tgl').value;
  const batas     = document.getElementById('pinjam-batas').value;

  if (!anggotaId || !bukuId || !tgl || !batas) {
    showAlert('Semua field wajib diisi.', 'error');
    return;
  }

  const adaDenda = DB.denda.find(d => d.anggotaId === anggotaId && d.status === 'belum');
  if (adaDenda) {
    showAlert('Anggota masih memiliki denda yang belum dibayar.', 'error');
    return;
  }

  const buku = DB.buku.find(b => b.id === bukuId);
  if (!buku || buku.tersedia < 1) {
    showAlert('Stok buku tidak tersedia.', 'error');
    return;
  }

  const kode = genKode('TRX');
  DB.transaksi.push({ id: DB.nextId.transaksi++, kode, anggotaId, bukuId, tgl, batas, status: 'dipinjam' });
  buku.tersedia--;

  closeModal('modal-pinjam');
  showAlert(`Peminjaman berhasil dicatat. Kode: ${kode}`);
  renderPinjam();
  renderDashboard();
}

/* ══════════════════════════════════════
   RENDER PENGEMBALIAN
══════════════════════════════════════ */
function renderKembali() {
  const aktif = DB.transaksi.filter(t => t.status === 'dipinjam');
  const tbody = document.getElementById('tbl-kembali');

  if (!aktif.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Tidak ada peminjaman aktif</td></tr>';
    return;
  }

  tbody.innerHTML = aktif.map(t => {
    const a = DB.anggota.find(x => x.id === t.anggotaId);
    const b = DB.buku.find(x => x.id === t.bukuId);
    const hari  = Math.max(0, daysDiff(t.batas, today()));
    const denda = hari * DENDA_PER_HARI;
    const terlambat = hari > 0;

    return `<tr>
      <td class="td-mono">${t.kode}</td>
      <td>${a?.nama || '-'}</td>
      <td>${b?.judul || '-'}</td>
      <td>${fDate(t.batas)}</td>
      <td>${terlambat
        ? `<span class="badge badge-red">${hari} hari · ${fRp(denda)}</span>`
        : '<span class="badge badge-green">Tepat waktu</span>'}</td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="prosesKembali(${t.id})">
          Proses Kembali
        </button>
      </td>
    </tr>`;
  }).join('');
}

function prosesKembali(id) {
  const t = DB.transaksi.find(x => x.id === id);
  if (!t) return;

  const hari  = Math.max(0, daysDiff(t.batas, today()));
  const denda = hari * DENDA_PER_HARI;

  let msg = 'Konfirmasi pengembalian buku ini?';
  if (hari > 0) msg += `\n\nTerlambat ${hari} hari — Denda: ${fRp(denda)}`;
  if (!confirm(msg)) return;

  t.status     = 'dikembalikan';
  t.tglKembali = today();

  const buku = DB.buku.find(b => b.id === t.bukuId);
  if (buku) buku.tersedia++;

  if (hari > 0) {
    DB.denda.push({
      id: DB.nextId.denda++,
      transaksiId: t.id,
      anggotaId:   t.anggotaId,
      hari,
      jumlah:      denda,
      status:      'belum',
    });
    showAlert(`Buku dikembalikan. Denda ${fRp(denda)} (${hari} hari) dicatat.`, 'warn');
  } else {
    showAlert('Buku berhasil dikembalikan tepat waktu.');
  }

  renderKembali();
  renderDenda();
  renderDashboard();
}

/* ══════════════════════════════════════
   RENDER DENDA
══════════════════════════════════════ */
function renderDenda() {
  document.getElementById('count-denda').textContent = DB.denda.length;
  const tbody = document.getElementById('tbl-denda');

  if (!DB.denda.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Belum ada data denda</td></tr>';
    return;
  }

  tbody.innerHTML = DB.denda.map(d => {
    const a = DB.anggota.find(x => x.id === d.anggotaId);
    const t = DB.transaksi.find(x => x.id === d.transaksiId);
    const b = DB.buku.find(x => x.id === t?.bukuId);

    return `<tr>
      <td>
        <strong>${a?.nama || '-'}</strong><br>
        <span class="td-mono">${a?.nomor || ''}</span>
      </td>
      <td>${b?.judul || '-'}</td>
      <td>${d.hari} hari</td>
      <td><span class="denda-big">${fRp(d.jumlah)}</span></td>
      <td>${d.status === 'lunas'
        ? '<span class="badge badge-green">Lunas</span>'
        : '<span class="badge badge-red">Belum Bayar</span>'}</td>
      <td>${d.status === 'belum'
        ? `<button class="btn btn-primary btn-sm" onclick="bayarDenda(${d.id})">Tandai Lunas</button>`
        : '—'}</td>
    </tr>`;
  }).join('');
}

function bayarDenda(id) {
  const d = DB.denda.find(x => x.id === id);
  if (!d) return;
  if (!confirm(`Tandai denda ${fRp(d.jumlah)} sebagai lunas?`)) return;
  d.status = 'lunas';
  showAlert('Denda berhasil ditandai lunas.');
  renderDenda();
  renderDashboard();
}

/* ══════════════════════════════════════
   RENDER SURAT BEBAS PINJAM
══════════════════════════════════════ */
function renderSurat() {
  const sel = document.getElementById('surat-anggota');
  sel.innerHTML = '<option value="">-- Pilih Anggota --</option>' +
    DB.anggota.map(a => `<option value="${a.id}">${a.nomor} — ${a.nama}</option>`).join('');

  const tbody = document.getElementById('tbl-surat');
  if (!DB.surat.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-cell">Belum ada surat diterbitkan</td></tr>';
    return;
  }

  tbody.innerHTML = DB.surat.map(s => {
    const a = DB.anggota.find(x => x.id === s.anggotaId);
    return `<tr>
      <td class="td-mono">${s.nomor}</td>
      <td>${a?.nama || '-'}</td>
      <td>${fDate(s.tanggal)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="previewSurat(${s.id})">Lihat</button>
      </td>
    </tr>`;
  }).join('');
}

function cekStatusSurat() {
  const id  = +document.getElementById('surat-anggota').value;
  const box = document.getElementById('surat-status-box');
  const btn = document.getElementById('btn-buat-surat');
  document.getElementById('surat-preview').classList.add('hidden');

  if (!id) { box.innerHTML = ''; btn.disabled = true; return; }

  const pinjamAktif = DB.transaksi.filter(t => t.anggotaId === id && t.status === 'dipinjam');
  const dendaBelum  = DB.denda.filter(d => d.anggotaId === id && d.status === 'belum');

  if (pinjamAktif.length > 0) {
    box.innerHTML = `<div class="alert alert-error">Masih ada <strong>${pinjamAktif.length} buku</strong> yang belum dikembalikan.<button onclick="this.parentElement.remove()">×</button></div>`;
    btn.disabled = true;
  } else if (dendaBelum.length > 0) {
    const total = dendaBelum.reduce((s, d) => s + d.jumlah, 0);
    box.innerHTML = `<div class="alert alert-warn">Masih ada denda belum lunas: <strong>${fRp(total)}</strong>.<button onclick="this.parentElement.remove()">×</button></div>`;
    btn.disabled = true;
  } else {
    box.innerHTML = `<div class="alert alert-success">Anggota memenuhi syarat — bebas pinjaman &amp; denda.<button onclick="this.parentElement.remove()">×</button></div>`;
    btn.disabled = false;
  }
}

function buatSurat() {
  const id = +document.getElementById('surat-anggota').value;
  if (!id) return;

  const nomor = `SBP/${new Date().getFullYear()}/${String(DB.nextId.surat).padStart(4,'0')}`;
  const surat = { id: DB.nextId.surat++, nomor, anggotaId: id, tanggal: today() };
  DB.surat.push(surat);

  showAlert(`Surat ${nomor} berhasil diterbitkan.`);
  renderSurat();
  previewSurat(surat.id);
}

function previewSurat(id) {
  const s = DB.surat.find(x => x.id === id);
  if (!s) return;
  const a = DB.anggota.find(x => x.id === s.anggotaId);

  const wrap = document.getElementById('surat-preview');
  wrap.classList.remove('hidden');
  wrap.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title">Preview Surat — ${s.nomor}</div>
        <button class="btn btn-primary btn-sm no-print" onclick="window.print()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Cetak
        </button>
      </div>
      <div class="card-body">
        <div class="surat-doc">
          <div class="surat-kop">
            <h2>Perpustakaan Pustaka</h2>
            <p>Jl. Pendidikan No. 1 — pustaka@perpustakaan.id — (021) 000-0000</p>
          </div>
          <div class="surat-title">Surat Keterangan Bebas Peminjaman</div>
          <p>Nomor: <strong>${s.nomor}</strong></p>
          <br>
          <p>Yang bertanda tangan di bawah ini, Kepala Perpustakaan Pustaka, menerangkan bahwa:</p>
          <table style="margin:16px 0;width:100%;border-collapse:collapse">
            <tr><td style="width:160px;padding:4px 0;color:#737373">Nama</td><td>: <strong>${a?.nama}</strong></td></tr>
            <tr><td style="padding:4px 0;color:#737373">No. Anggota</td><td>: ${a?.nomor}</td></tr>
            <tr><td style="padding:4px 0;color:#737373">Alamat</td><td>: ${a?.alamat || '-'}</td></tr>
          </table>
          <p>Adalah benar anggota perpustakaan kami dan <strong>dinyatakan bebas dari segala pinjaman buku maupun denda</strong> hingga tanggal surat ini diterbitkan.</p>
          <br>
          <p>Surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
          <div class="surat-ttd">
            <div class="surat-ttd-box">
              <p>${fDate(s.tanggal)}</p>
              <p style="margin-top:4px">Kepala Perpustakaan,</p>
              <div style="height:56px"></div>
              <p><strong>Administrator</strong></p>
              <p style="font-size:12px;color:#737373">Sistem Perpustakaan Pustaka</p>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  wrap.scrollIntoView({ behavior: 'smooth' });
}

/* ══════════════════════════════════════
   EVENT LISTENERS
══════════════════════════════════════ */

/* Navigasi sidebar */
document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
  btn.addEventListener('click', () => navigateTo(btn.dataset.page));
});

/* Tombol buka modal */
document.getElementById('btn-open-modal-buku')?.addEventListener('click', () => {
  resetFormBuku(); openModal('modal-buku');
});
document.getElementById('btn-open-modal-anggota')?.addEventListener('click', () => {
  resetFormAnggota(); openModal('modal-anggota');
});
document.getElementById('btn-open-modal-pinjam')?.addEventListener('click', () => {
  renderPinjam(); openModal('modal-pinjam');
});

/* Tombol simpan */
document.getElementById('btn-simpan-buku')?.addEventListener('click', simpanBuku);
document.getElementById('btn-simpan-anggota')?.addEventListener('click', simpanAnggota);
document.getElementById('btn-simpan-pinjam')?.addEventListener('click', simpanPinjam);
document.getElementById('btn-buat-surat')?.addEventListener('click', buatSurat);

/* Surat: cek status saat anggota dipilih */
document.getElementById('surat-anggota')?.addEventListener('change', cekStatusSurat);

/* Search */
document.getElementById('search-buku')?.addEventListener('input', e => filterTable('tbl-buku', e.target.value));
document.getElementById('search-anggota')?.addEventListener('input', e => filterTable('tbl-anggota', e.target.value));
document.getElementById('search-pinjam')?.addEventListener('input', e => filterTable('tbl-pinjam', e.target.value));
document.getElementById('search-kembali')?.addEventListener('input', e => filterTable('tbl-kembali', e.target.value));
document.getElementById('search-denda')?.addEventListener('input', e => filterTable('tbl-denda', e.target.value));

/* Topbar date */
document.getElementById('topbar-date').textContent =
  new Date().toLocaleDateString('id-ID', { weekday:'short', day:'2-digit', month:'short', year:'numeric' });

/* Init */
renderDashboard();
