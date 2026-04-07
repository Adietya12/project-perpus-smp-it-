/* ============================================
   DASHBOARD.JS — Logika Utama (versi API/DB)
   ============================================ */
"use strict";

/* ── Searchable Select Utility ───────────────────────────────────── */
/**
 * Mengubah elemen display + hidden input menjadi dropdown yang bisa dicari.
 * @param {Object} cfg - Konfigurasi komponen
 */
function initSearchableSelect(cfg) {
  const wrap     = document.getElementById(cfg.wrapperId);
  const display  = document.getElementById(cfg.displayId);
  const labelEl  = document.getElementById(cfg.labelId);
  const dropdown = document.getElementById(cfg.dropdownId);
  const searchEl = document.getElementById(cfg.searchId);
  const listEl   = document.getElementById(cfg.listId);
  const hidden   = document.getElementById(cfg.hiddenId);
  if (!wrap || !display || !dropdown || !searchEl || !listEl || !hidden) return;

  // Simpan items ke elemen agar bisa di-re-render
  wrap._ssItems = cfg.items || [];

  function renderList(query) {
    const q = (query || "").toLowerCase();
    const filtered = wrap._ssItems.filter(item =>
      item.label.toLowerCase().includes(q)
    );
    listEl.innerHTML = filtered.length
      ? filtered.map(item =>
          `<li data-value="${item.value}">${item.label}</li>`
        ).join("")
      : `<li class="empty">Tidak ada hasil</li>`;
  }

  function openDropdown() {
    dropdown.style.display = "block";
    display.classList.add("open");
    searchEl.value = "";
    renderList("");
    searchEl.focus();
  }

  function closeDropdown() {
    dropdown.style.display = "none";
    display.classList.remove("open");
  }

  function selectItem(value, label) {
    hidden.value = value;
    labelEl.textContent = label;
    labelEl.classList.remove("placeholder");
    closeDropdown();
    // Sembunyikan pesan error jika ada
    const errA = document.getElementById("pinjam-anggota-error");
    if (errA) errA.style.display = "none";
  }

  // Reset/re-init: hapus listener lama dgn clone
  const newDisplay = display.cloneNode(true);
  display.parentNode.replaceChild(newDisplay, display);
  const newSearch  = searchEl.cloneNode(true);
  searchEl.parentNode.replaceChild(newSearch, searchEl);
  const newList    = listEl.cloneNode(false);
  listEl.parentNode.replaceChild(newList, listEl);

  const d  = document.getElementById(cfg.displayId);
  const s  = document.getElementById(cfg.searchId);
  const l  = document.getElementById(cfg.listId);
  const lb = document.getElementById(cfg.labelId);

  // Set placeholder
  lb.textContent = hidden.value ? (wrap._ssItems.find(i => i.value == hidden.value) || {label: cfg.placeholder}).label : cfg.placeholder;
  if (!hidden.value) lb.classList.add("placeholder");

  d.addEventListener("click", () => {
    const dd = document.getElementById(cfg.dropdownId);
    dd.style.display === "none" ? openDropdownFresh() : closeFresh();
  });

  function openDropdownFresh() {
    const dd = document.getElementById(cfg.dropdownId);
    dd.style.display = "block";
    d.classList.add("open");
    s.value = "";
    renderListFresh("");
    s.focus();
  }

  function closeFresh() {
    const dd = document.getElementById(cfg.dropdownId);
    dd.style.display = "none";
    d.classList.remove("open");
  }

  function renderListFresh(query) {
    const q = (query || "").toLowerCase();
    const filtered = wrap._ssItems.filter(item =>
      item.label.toLowerCase().includes(q)
    );
    l.innerHTML = filtered.length
      ? filtered.map(item =>
          `<li data-value="${item.value}">${item.label}</li>`
        ).join("")
      : `<li class="empty">Tidak ada hasil</li>`;
  }

  s.addEventListener("input", () => renderListFresh(s.value));
  s.addEventListener("keydown", (e) => e.stopPropagation());

  l.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li || li.classList.contains("empty")) return;
    hidden.value = li.dataset.value;
    lb.textContent = li.textContent;
    lb.classList.remove("placeholder");
    closeFresh();
    const errA = document.getElementById("pinjam-anggota-error");
    if (errA) errA.style.display = "none";
  });

  // Tutup saat klik di luar
  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) closeFresh();
  }, { capture: false });
}

const PAGE_LABELS = {
  dashboard: "Dashboard",
  buku: "Manajemen Buku",
  anggota: "Manajemen Anggota",
  pinjam: "Peminjaman",
  kembali: "Pengembalian",
  denda: "Denda",
  surat: "Surat Bebas Pinjam",
  riwayat: "Riwayat Transaksi",
};

function navigateTo(pageId) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  const page = document.getElementById("page-" + pageId);
  if (page) page.classList.add("active");
  const navBtn = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (navBtn) navBtn.classList.add("active");
  document.getElementById("breadcrumb-label").textContent =
    PAGE_LABELS[pageId] || pageId;
  renderPage(pageId);
}

function renderPage(pageId) {
  const map = {
    dashboard: renderDashboard,
    buku: renderBuku,
    anggota: renderAnggota,
    pinjam: renderPinjam,
    kembali: renderKembali,
    denda: renderDenda,
    surat: renderSurat,
    riwayat: renderRiwayat,
  };
  if (map[pageId]) map[pageId]();
}

/* ── Helper accessor (nama kolom MySQL) ── */
const aNama = (a) => a.nama,
  aNomor = (a) => a.nomor_anggota,
  aStatus = (a) => a.status;
const bJudul = (b) => b.judul,
  bKode = (b) => b.kode_buku,
  bTersedia = (b) => parseInt(b.stok_tersedia);
const tStatus = (t) => t.status,
  tBatas = (t) => t.tanggal_batas_kembali,
  tPinjam = (t) => t.tanggal_pinjam;
const tNamaA = (t) => t.nama_anggota,
  tJudulB = (t) => t.judul_buku,
  tKode = (t) => t.kode_transaksi;
const dJumlah = (d) => parseFloat(d.jumlah_denda),
  dStatus = (d) => d.status_bayar,
  dHari = (d) => parseInt(d.hari_terlambat);

/* ══════════════════════════════════════ DASHBOARD ══════════════════════════════════════ */
function renderDashboard() {
  const dipinjam = DB.transaksi.filter((t) => tStatus(t) === "dipinjam");
  const terlambat = dipinjam.filter((t) => tBatas(t) < today());
  const totalDenda = DB.denda
    .filter((d) => dStatus(d) === "belum")
    .reduce((s, d) => s + dJumlah(d), 0);
  document.getElementById("stat-buku").textContent = DB.buku.length;
  document.getElementById("stat-anggota").textContent = DB.anggota.length;
  document.getElementById("stat-pinjam").textContent = dipinjam.length;
  document.getElementById("stat-denda").textContent = fRp(totalDenda);
  document.getElementById("stat-terlambat-label").textContent =
    `↑ ${terlambat.length} terlambat`;
  const tbody = document.getElementById("dash-transaksi");
  const recent = DB.transaksi.slice(0, 10);
  tbody.innerHTML = !recent.length
    ? '<tr><td colspan="3" class="empty-cell">Belum ada transaksi</td></tr>'
    : recent
        .map((t) => {
          const badge =
            tStatus(t) === "dipinjam" ? "badge-yellow" : "badge-green";
          const label = tStatus(t) === "dipinjam" ? "Dipinjam" : "Dikembalikan";
          return `<tr><td>${tNamaA(t) || "-"}</td><td>${tJudulB(t) || "-"}</td><td><span class="badge ${badge}">${label}</span></td></tr>`;
        })
        .join("");
  const tbox = document.getElementById("dash-terlambat");
  tbox.innerHTML = !terlambat.length
    ? '<div class="empty-cell" style="padding:24px">Tidak ada keterlambatan</div>'
    : terlambat
        .map((t) => {
          const hari = daysDiff(tBatas(t), today());
          return `<div class="activity-item"><div class="activity-dot red"></div><div class="activity-text"><strong>${tNamaA(t)}</strong> — ${tJudulB(t)}</div><span class="badge badge-red">${hari} hari</span></div>`;
        })
        .join("");
}

/* ══════════════════════════════════════ BUKU ══════════════════════════════════════ */
function renderBuku() {
  document.getElementById("count-buku").textContent = DB.buku.length + " buku";
  const tbody = document.getElementById("tbl-buku");
  tbody.innerHTML = !DB.buku.length
    ? '<tr><td colspan="7" class="empty-cell">Belum ada data buku</td></tr>'
    : DB.buku
        .map(
          (b) => `<tr>
        <td class="td-mono">${bKode(b)}</td><td><strong>${bJudul(b)}</strong></td>
        <td>${b.pengarang}</td><td><span class="tag">${b.kategori || "-"}</span></td>
        <td>${b.stok}</td>
        <td>${bTersedia(b) > 0 ? `<span class="badge badge-green">${bTersedia(b)}</span>` : '<span class="badge badge-red">Habis</span>'}</td>
        <td><div class="btn-group">
          <button class="btn btn-ghost btn-sm" onclick="editBuku(${b.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="hapusBuku(${b.id})">Hapus</button>
        </div></td></tr>`,
        )
        .join("");
}

async function simpanBuku() {
  const id = document.getElementById("buku-edit-id").value;
  // Pakai native HTML validation
  const fields = ["buku-judul", "buku-kategori", "buku-stok"];
  let valid = true;
  fields.forEach((fId) => {
    const el = document.getElementById(fId);
    if (!el.value.toString().trim()) {
      el.reportValidity();
      valid = false;
    }
  });
  if (!valid) return;

  const obj = {
    kode_buku: document.getElementById("buku-kode").value.trim(),
    judul: document.getElementById("buku-judul").value.trim(),
    pengarang: document.getElementById("buku-pengarang").value.trim(),
    penerbit: document.getElementById("buku-penerbit").value.trim(),
    tahun_terbit: document.getElementById("buku-tahun").value || null,
    kategori: document.getElementById("buku-kategori").value.trim(),
    stok: +document.getElementById("buku-stok").value,
  };
  const res = id ? await apiBukuUpdate(+id, obj) : await apiBukuCreate(obj);
  if (res.success) {
    showAlert(res.message);
    closeModal("modal-buku");
    resetFormBuku();
    renderBuku();
    renderDashboard();
  } else showAlert(res.message, "error");
}

function editBuku(id) {
  const b = DB.buku.find((x) => x.id == id);
  if (!b) return;
  document.getElementById("buku-edit-id").value = b.id;
  document.getElementById("buku-kode").value = b.kode_buku;
  document.getElementById("buku-judul").value = b.judul;
  document.getElementById("buku-pengarang").value = b.pengarang;
  document.getElementById("buku-penerbit").value = b.penerbit;
  document.getElementById("buku-tahun").value = b.tahun_terbit;
  document.getElementById("buku-kategori").value = b.kategori;
  document.getElementById("buku-stok").value = b.stok;
  document.getElementById("modal-buku-title").textContent = "Edit Buku";
  openModal("modal-buku");
}

async function hapusBuku(id) {
  if (!confirm("Hapus buku ini?")) return;
  const res = await apiBukuDelete(id);
  if (res.success) {
    showAlert(res.message);
    renderBuku();
    renderDashboard();
  } else showAlert(res.message, "error");
}

function resetFormBuku() {
  [
    "buku-edit-id",
    "buku-kode",
    "buku-judul",
    "buku-pengarang",
    "buku-penerbit",
    "buku-kategori",
  ].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("buku-stok").value = 1;
  document.getElementById("buku-tahun").value = new Date().getFullYear();
  document.getElementById("modal-buku-title").textContent = "Tambah Buku";
}

/* ══════════════════════════════════════ ANGGOTA ══════════════════════════════════════ */
function renderAnggota() {
  document.getElementById("count-anggota").textContent =
    DB.anggota.length + " anggota";
  const tbody = document.getElementById("tbl-anggota");
  tbody.innerHTML = !DB.anggota.length
    ? '<tr><td colspan="6" class="empty-cell">Belum ada data anggota</td></tr>'
    : DB.anggota
        .map(
          (a) => `<tr>
        <td class="td-mono">${aNomor(a)}</td><td><strong>${aNama(a)}</strong></td>
        <td>${a.email || "-"}</td><td>${a.no_telepon || "-"}</td>
        <td>${aStatus(a) === "aktif" ? '<span class="badge badge-green">Aktif</span>' : '<span class="badge badge-gray">Nonaktif</span>'}</td>
        <td><div class="btn-group">
          <button class="btn btn-ghost btn-sm" onclick="editAnggota(${a.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="hapusAnggota(${a.id})">Hapus</button>
        </div></td></tr>`,
        )
        .join("");
}

async function simpanAnggota() {
  const id = document.getElementById("anggota-edit-id").value;
  const namaEl = document.getElementById("anggota-nama");
  if (!namaEl.value.trim()) {
    namaEl.reportValidity();
    return;
  }
  const obj = {
    nomor_anggota: document.getElementById("anggota-nomor").value.trim(),
    nama: namaEl.value.trim(),
    email: document.getElementById("anggota-email").value.trim(),
    no_telepon: document.getElementById("anggota-telp").value.trim(),
    alamat: document.getElementById("anggota-alamat").value.trim(),
    status: document.getElementById("anggota-status").value,
  };
  const res = id
    ? await apiAnggotaUpdate(+id, obj)
    : await apiAnggotaCreate(obj);
  if (res.success) {
    showAlert(res.message);
    closeModal("modal-anggota");
    resetFormAnggota();
    renderAnggota();
    renderDashboard();
  } else showAlert(res.message, "error");
}

function editAnggota(id) {
  const a = DB.anggota.find((x) => x.id == id);
  if (!a) return;
  document.getElementById("anggota-edit-id").value = a.id;
  document.getElementById("anggota-nomor").value = a.nomor_anggota;
  document.getElementById("anggota-nama").value = a.nama;
  document.getElementById("anggota-email").value = a.email;
  document.getElementById("anggota-telp").value = a.no_telepon;
  document.getElementById("anggota-alamat").value = a.alamat;
  document.getElementById("anggota-status").value = a.status;
  document.getElementById("modal-anggota-title").textContent = "Edit Anggota";
  openModal("modal-anggota");
}

async function hapusAnggota(id) {
  if (!confirm("Hapus anggota ini?")) return;
  const res = await apiAnggotaDelete(id);
  if (res.success) {
    showAlert(res.message);
    renderAnggota();
    renderDashboard();
  } else showAlert(res.message, "error");
}

function resetFormAnggota() {
  [
    "anggota-edit-id",
    "anggota-nomor",
    "anggota-nama",
    "anggota-email",
    "anggota-telp",
    "anggota-alamat",
  ].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("anggota-status").value = "aktif";
  document.getElementById("modal-anggota-title").textContent = "Tambah Anggota";
}

/* ══════════════════════════════════════ PEMINJAMAN ══════════════════════════════════════ */
let bukuDipilih = []; // array id buku yang akan dipinjam

function renderPinjam() {
  const aktif = DB.transaksi.filter((t) => tStatus(t) === "dipinjam");
  document.getElementById("count-pinjam").textContent = aktif.length;
  const tbody = document.getElementById("tbl-pinjam");
  tbody.innerHTML = !aktif.length
    ? '<tr><td colspan="6" class="empty-cell">Tidak ada peminjaman aktif</td></tr>'
    : aktif
        .map((t) => {
          const terlambat = tBatas(t) < today();
          return `<tr><td class="td-mono">${tKode(t)}</td><td>${tNamaA(t) || "-"}</td><td>${tJudulB(t) || "-"}</td>
          <td>${fDate(tPinjam(t))}</td>
          <td>${fDate(tBatas(t))} ${terlambat ? '<span class="badge badge-red">Terlambat</span>' : ""}</td>
          <td>${terlambat ? '<span class="badge badge-red">Terlambat</span>' : '<span class="badge badge-yellow">Dipinjam</span>'}</td></tr>`;
        })
        .join("");

  // Populate searchable anggota
  initSearchableSelect({
    wrapperId:   "wrap-pinjam-anggota",
    displayId:   "display-pinjam-anggota",
    labelId:     "label-pinjam-anggota",
    dropdownId:  "dropdown-pinjam-anggota",
    searchId:    "search-pinjam-anggota",
    listId:      "list-pinjam-anggota",
    hiddenId:    "pinjam-anggota",
    placeholder: "-- Pilih Anggota --",
    items: DB.anggota
      .filter((a) => aStatus(a) === "aktif")
      .map((a) => ({ value: a.id, label: `${aNomor(a) || ""} — ${aNama(a)}` })),
  });

  // Populate searchable buku
  renderSelectBukuPinjam();

  // Reset daftar buku dipilih
  bukuDipilih = [];
  renderBukuDipilih();

  // Set tanggal otomatis
  const tglHariIni = today();
  document.getElementById("pinjam-tgl").value = tglHariIni;
  document.getElementById("pinjam-batas").value = addDays(tglHariIni, 14);
}

function renderSelectBukuPinjam() {
  initSearchableSelect({
    wrapperId:   "wrap-pinjam-buku-select",
    displayId:   "display-pinjam-buku-select",
    labelId:     "label-pinjam-buku-select",
    dropdownId:  "dropdown-pinjam-buku-select",
    searchId:    "search-pinjam-buku-select",
    listId:      "list-pinjam-buku-select",
    hiddenId:    "pinjam-buku-select",
    placeholder: "-- Pilih Buku --",
    items: DB.buku
      .filter((b) => bTersedia(b) > 0 && !bukuDipilih.includes(b.id))
      .map((b) => ({ value: b.id, label: `[${bKode(b)}] ${bJudul(b)} (stok: ${bTersedia(b)})` })),
  });
}

function renderBukuDipilih() {
  const wrap = document.getElementById("pinjam-buku-list");
  if (!wrap) return;
  if (!bukuDipilih.length) {
    wrap.innerHTML = "";
    return;
  }
  wrap.innerHTML = bukuDipilih
    .map((id) => {
      const b = DB.buku.find((x) => x.id == id);
      return `<div style="display:flex;align-items:center;gap:8px;background:#f5f5f5;padding:6px 10px;border-radius:6px">
      <span style="flex:1;font-size:13px">[${bKode(b)}] ${bJudul(b)}</span>
      <button type="button" onclick="hapusBukuPinjam(${id})" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:16px;line-height:1">×</button>
    </div>`;
    })
    .join("");
}

function tambahBukuPinjam() {
  const hidden = document.getElementById("pinjam-buku-select");
  const id = hidden ? +hidden.value : 0;
  if (!id) return;
  if (!bukuDipilih.includes(id)) {
    bukuDipilih.push(id);
    renderBukuDipilih();
    renderSelectBukuPinjam();
    document.getElementById("pinjam-buku-error").style.display = "none";
  }
  // Reset searchable select buku
  hidden.value = "";
  const lbl = document.getElementById("label-pinjam-buku-select");
  if (lbl) { lbl.textContent = "-- Pilih Buku --"; lbl.classList.add("placeholder"); }
}

function hapusBukuPinjam(id) {
  bukuDipilih = bukuDipilih.filter((x) => x !== id);
  renderBukuDipilih();
  renderSelectBukuPinjam();
}

// Auto update batas kembali saat tanggal pinjam berubah
document.getElementById("pinjam-tgl")?.addEventListener("change", function () {
  document.getElementById("pinjam-batas").value = addDays(this.value, 14);
});

async function simpanPinjam() {
  const anggotaId = document.getElementById("pinjam-anggota").value;
  const tglPinjam = document.getElementById("pinjam-tgl").value;
  const tglBatas = document.getElementById("pinjam-batas").value;

  // Validasi
  if (!anggotaId) {
    document.getElementById("pinjam-anggota-error").style.display = "block";
    return;
  }
  if (!bukuDipilih.length) {
    document.getElementById("pinjam-buku-error").style.display = "block";
    return;
  }

  // Kirim 1 request per buku
  let berhasil = 0,
    gagal = [];
  for (const bukuId of bukuDipilih) {
    const res = await apiPinjam({
      anggota_id: +anggotaId,
      buku_id: bukuId,
      tanggal_pinjam: tglPinjam,
      tanggal_batas_kembali: tglBatas,
    });
    if (res.success) berhasil++;
    else gagal.push(res.message);
  }

  closeModal("modal-pinjam");
  if (berhasil > 0) showAlert(`${berhasil} buku berhasil dicatat peminjaman.`);
  if (gagal.length) showAlert(gagal.join(" | "), "error");
  renderPinjam();
  renderDashboard();
}

/* ══════════════════════════════════════ PENGEMBALIAN ══════════════════════════════════════ */
function renderKembali() {
  const aktif = DB.transaksi.filter((t) => tStatus(t) === "dipinjam");
  const tbody = document.getElementById("tbl-kembali");
  tbody.innerHTML = !aktif.length
    ? '<tr><td colspan="6" class="empty-cell">Tidak ada peminjaman aktif</td></tr>'
    : aktif
        .map((t) => {
          const hari = Math.max(0, daysDiff(tBatas(t), today())),
            denda = hari * DENDA_PER_HARI;
          return `<tr><td class="td-mono">${tKode(t)}</td><td>${tNamaA(t) || "-"}</td><td>${tJudulB(t) || "-"}</td>
          <td>${fDate(tBatas(t))}</td>
          <td>${hari > 0 ? `<span class="badge badge-red">${hari} hari · ${fRp(denda)}</span>` : '<span class="badge badge-green">Tepat waktu</span>'}</td>
          <td><button class="btn btn-primary btn-sm" onclick="prosesKembali(${t.id})">Proses Kembali</button></td></tr>`;
        })
        .join("");
}

async function prosesKembali(id) {
  const t = DB.transaksi.find((x) => x.id == id);
  if (!t) return;
  const hari = Math.max(0, daysDiff(tBatas(t), today())),
    denda = hari * DENDA_PER_HARI;
  let msg = "Konfirmasi pengembalian buku ini?";
  if (hari > 0) msg += `\n\nTerlambat ${hari} hari — Denda: ${fRp(denda)}`;
  if (!confirm(msg)) return;
  const res = await apiKembali(id);
  if (res.success) {
    showAlert(
      hari > 0
        ? `Buku dikembalikan. Denda ${fRp(denda)} (${hari} hari) dicatat.`
        : "Buku berhasil dikembalikan tepat waktu.",
      hari > 0 ? "warn" : "success",
    );
    renderKembali();
    renderDenda();
    renderDashboard();
  } else showAlert(res.message, "error");
}

/* ══════════════════════════════════════ DENDA ══════════════════════════════════════ */
function renderDenda() {
  document.getElementById("count-denda").textContent = DB.denda.length;
  const tbody = document.getElementById("tbl-denda");
  tbody.innerHTML = !DB.denda.length
    ? '<tr><td colspan="6" class="empty-cell">Belum ada data denda</td></tr>'
    : DB.denda
        .map(
          (d) => `<tr>
        <td><strong>${d.nama_anggota || "-"}</strong><br><span class="td-mono">${d.nomor_anggota || ""}</span></td>
        <td>${d.judul_buku || "-"}</td><td>${dHari(d)} hari</td>
        <td><span class="denda-big">${fRp(dJumlah(d))}</span></td>
        <td>${dStatus(d) === "lunas" ? '<span class="badge badge-green">Lunas</span>' : '<span class="badge badge-red">Belum Bayar</span>'}</td>
        <td>${dStatus(d) === "belum" ? `<button class="btn btn-primary btn-sm" onclick="bayarDenda(${d.id})">Tandai Lunas</button>` : "—"}</td>
      </tr>`,
        )
        .join("");
}

async function bayarDenda(id) {
  const d = DB.denda.find((x) => x.id == id);
  if (!d || !confirm(`Tandai denda ${fRp(dJumlah(d))} sebagai lunas?`)) return;
  const res = await apiBayarDenda(id);
  if (res.success) {
    showAlert(res.message);
    renderDenda();
    renderDashboard();
  } else showAlert(res.message, "error");
}

/* ══════════════════════════════════════ SURAT ══════════════════════════════════════ */
function renderSurat() {
  const sel = document.getElementById("surat-anggota");
  sel.innerHTML =
    '<option value="">-- Pilih Anggota --</option>' +
    DB.anggota
      .map((a) => `<option value="${a.id}">${aNomor(a)} — ${aNama(a)}</option>`)
      .join("");
  const tbody = document.getElementById("tbl-surat");
  tbody.innerHTML = !DB.surat.length
    ? '<tr><td colspan="5" class="empty-cell">Belum ada surat diterbitkan</td></tr>'
    : DB.surat
        .map(
          (s) => `<tr>
        <td class="td-mono">${s.nomor_surat}</td><td>${s.nama_anggota || "-"}</td>
        <td>${fDate(s.tanggal)}</td>
        <td><button class="btn btn-ghost btn-sm" onclick="previewSurat(${s.id})">Lihat</button></td>
        <td><button class="btn btn-sm" style="color:#ef4444;border:1px solid #fca5a5;background:#fff5f5" onclick="hapusSurat(${s.id})">Hapus</button></td>
      </tr>`,
        )
        .join("");
}

async function hapusSurat(id) {
  if (!confirm("Yakin ingin menghapus surat ini?")) return;
  const res = await apiHapusSurat(id);
  if (res.success) {
    showAlert(res.message);
    renderSurat();
    // Sembunyikan preview jika surat yang dihapus sedang ditampilkan
    const preview = document.getElementById("surat-preview");
    if (preview && !preview.classList.contains("hidden")) {
      preview.classList.add("hidden");
    }
  } else {
    showAlert(res.message, "error");
  }
}

async function cekStatusSurat() {
  const id = +document.getElementById("surat-anggota").value;
  const box = document.getElementById("surat-status-box");
  const btn = document.getElementById("btn-buat-surat");
  document.getElementById("surat-preview").classList.add("hidden");
  if (!id) {
    box.innerHTML = "";
    btn.disabled = true;
    return;
  }
  const pinjamAktif = DB.transaksi.filter(
    (t) => t.anggota_id === id && tStatus(t) === "dipinjam",
  );
  const dendaBelum = DB.denda.filter(
    (d) => d.anggota_id === id && dStatus(d) === "belum",
  );
  if (pinjamAktif.length > 0) {
    box.innerHTML = `<div class="alert alert-error">Masih ada <strong>${pinjamAktif.length} buku</strong> yang belum dikembalikan.<button onclick="this.parentElement.remove()">×</button></div>`;
    btn.disabled = true;
  } else if (dendaBelum.length > 0) {
    const total = dendaBelum.reduce((s, d) => s + dJumlah(d), 0);
    box.innerHTML = `<div class="alert alert-warn">Masih ada denda belum lunas: <strong>${fRp(total)}</strong>.<button onclick="this.parentElement.remove()">×</button></div>`;
    btn.disabled = true;
  } else {
    box.innerHTML = `<div class="alert alert-success">Anggota memenuhi syarat — bebas pinjaman &amp; denda.<button onclick="this.parentElement.remove()">×</button></div>`;
    btn.disabled = false;
  }
}

async function buatSurat() {
  const id = +document.getElementById("surat-anggota").value;
  if (!id) return;
  const res = await apiBuatSurat(id);
  if (res.success) {
    showAlert(res.message);
    renderSurat();
    previewSuratData(res.data);
  } else showAlert(res.message, "error");
}

function previewSurat(id) {
  const s = DB.surat.find((x) => x.id == id);
  if (s) previewSuratData(s);
}

function previewSuratData(s) {
  const wrap = document.getElementById("surat-preview");
  wrap.classList.remove("hidden");
  wrap.innerHTML = `<div class="card">
    <div class="card-header">
      <div class="card-title">Preview Surat — ${s.nomor_surat}</div>
      <button class="btn btn-primary btn-sm no-print" onclick="window.print()">Cetak</button>
    </div>
    <div class="card-body"><div class="surat-doc">
      <div class="surat-kop"><h2>Perpustakaan Pustaka</h2><p>Jl. Pendidikan No. 1 — pustaka@perpustakaan.id</p></div>
      <div class="surat-title">Surat Keterangan Bebas Peminjaman</div>
      <p>Nomor: <strong>${s.nomor_surat}</strong></p><br>
      <p>Yang bertanda tangan di bawah ini, Kepala Perpustakaan Pustaka, menerangkan bahwa:</p>
      <table style="margin:16px 0;width:100%;border-collapse:collapse">
        <tr><td style="width:160px;padding:4px 0;color:#737373">Nama</td><td>: <strong>${s.nama_anggota}</strong></td></tr>
        <tr><td style="padding:4px 0;color:#737373">No. Anggota</td><td>: ${s.nomor_anggota}</td></tr>
        <tr><td style="padding:4px 0;color:#737373">Alamat</td><td>: ${s.alamat || "-"}</td></tr>
      </table>
      <p>Adalah benar anggota perpustakaan kami dan <strong>dinyatakan bebas dari segala pinjaman buku maupun denda</strong> hingga tanggal surat ini diterbitkan.</p>
      <br><p>Surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
      <div class="surat-ttd"><div class="surat-ttd-box">
        <p>${fDate(s.tanggal)}</p><p>Kepala Perpustakaan,</p>
        <div style="height:56px"></div><p><strong>Administrator</strong></p>
      </div></div>
    </div></div></div>`;
  wrap.scrollIntoView({ behavior: "smooth" });
}

/* ══════════════════════════════════════ EVENT LISTENERS ══════════════════════════════════════ */
document.querySelectorAll(".nav-item[data-page]").forEach((btn) => {
  btn.addEventListener("click", () => navigateTo(btn.dataset.page));
});
document
  .getElementById("btn-open-modal-buku")
  ?.addEventListener("click", () => {
    resetFormBuku();
    openModal("modal-buku");
  });
document
  .getElementById("btn-open-modal-anggota")
  ?.addEventListener("click", () => {
    resetFormAnggota();
    openModal("modal-anggota");
  });
document
  .getElementById("btn-open-modal-pinjam")
  ?.addEventListener("click", () => {
    renderPinjam();
    openModal("modal-pinjam");
  });
document
  .getElementById("btn-simpan-buku")
  ?.addEventListener("click", simpanBuku);
document
  .getElementById("btn-simpan-anggota")
  ?.addEventListener("click", simpanAnggota);
document
  .getElementById("btn-simpan-pinjam")
  ?.addEventListener("click", simpanPinjam);
document.getElementById("btn-buat-surat")?.addEventListener("click", buatSurat);
document
  .getElementById("surat-anggota")
  ?.addEventListener("change", cekStatusSurat);
document
  .getElementById("search-buku")
  ?.addEventListener("input", (e) => filterTable("tbl-buku", e.target.value));
document
  .getElementById("search-anggota")
  ?.addEventListener("input", (e) =>
    filterTable("tbl-anggota", e.target.value),
  );
document
  .getElementById("search-pinjam")
  ?.addEventListener("input", (e) => filterTable("tbl-pinjam", e.target.value));
document
  .getElementById("search-kembali")
  ?.addEventListener("input", (e) =>
    filterTable("tbl-kembali", e.target.value),
  );
document
  .getElementById("search-denda")
  ?.addEventListener("input", (e) => filterTable("tbl-denda", e.target.value));
document.getElementById("topbar-date").textContent =
  new Date().toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/* ── INIT ── */
loadAllData().then(() => renderDashboard());

/* ══════════════════════════════════════
   RENDER RIWAYAT TRANSAKSI
══════════════════════════════════════ */
function renderRiwayat() {
  // Isi dropdown bulan dari data transaksi
  const bulanSet = new Set();
  DB.transaksi.forEach((t) => {
    if (t.tanggal_pinjam) bulanSet.add(t.tanggal_pinjam.slice(0, 7)); // YYYY-MM
  });
  const selBulan = document.getElementById("filter-bulan-riwayat");
  const currentBulan = selBulan.value;
  selBulan.innerHTML =
    '<option value="">Semua Bulan</option>' +
    [...bulanSet]
      .sort()
      .reverse()
      .map((b) => {
        const [y, m] = b.split("-");
        const label = new Date(y, m - 1).toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric",
        });
        return `<option value="${b}" ${b === currentBulan ? "selected" : ""}>${label}</option>`;
      })
      .join("");

  filterRiwayat();
}

function filterRiwayat() {
  const q = (
    document.getElementById("search-riwayat")?.value || ""
  ).toLowerCase();
  const status = document.getElementById("filter-status-riwayat")?.value || "";
  const bulan = document.getElementById("filter-bulan-riwayat")?.value || "";

  let data = DB.transaksi.slice();

  if (status) data = data.filter((t) => tStatus(t) === status);
  if (bulan)
    data = data.filter((t) => (t.tanggal_pinjam || "").startsWith(bulan));
  if (q)
    data = data.filter(
      (t) =>
        (t.nama_anggota || "").toLowerCase().includes(q) ||
        (t.judul_buku || "").toLowerCase().includes(q) ||
        (t.kode_transaksi || "").toLowerCase().includes(q) ||
        (t.nomor_anggota || "").toLowerCase().includes(q),
    );

  document.getElementById("count-riwayat").textContent =
    data.length + " transaksi";

  const tbody = document.getElementById("tbl-riwayat");
  if (!data.length) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="empty-cell">Tidak ada data yang cocok</td></tr>';
    return;
  }

  tbody.innerHTML = data
    .map((t) => {
      const terlambat =
        tStatus(t) === "dikembalikan"
          ? t.tanggal_kembali > tBatas(t)
          : tBatas(t) < today();

      // Cari denda untuk transaksi ini
      const dendaTrx = DB.denda.find((d) => d.transaksi_id == t.id);
      const dendaInfo = dendaTrx
        ? `<span class="badge ${dStatus(dendaTrx) === "lunas" ? "badge-green" : "badge-red"}">${fRp(dJumlah(dendaTrx))}</span>`
        : '<span style="color:#a3a3a3">—</span>';

      const statusBadge =
        tStatus(t) === "dipinjam"
          ? terlambat
            ? '<span class="badge badge-red">Terlambat</span>'
            : '<span class="badge badge-yellow">Dipinjam</span>'
          : '<span class="badge badge-green">Dikembalikan</span>';

      return `<tr>
      <td class="td-mono">${tKode(t)}</td>
      <td><strong>${tNamaA(t) || "-"}</strong><br><span class="td-mono" style="font-size:11px">${t.nomor_anggota || ""}</span></td>
      <td>${tJudulB(t) || "-"}</td>
      <td>${fDate(tPinjam(t))}</td>
      <td>${fDate(tBatas(t))}</td>
      <td>${t.tanggal_kembali ? fDate(t.tanggal_kembali) : '<span style="color:#a3a3a3">Belum</span>'}</td>
      <td>${dendaInfo}</td>
      <td>${statusBadge}</td>
    </tr>`;
    })
    .join("");
}

function resetFilterRiwayat() {
  document.getElementById("search-riwayat").value = "";
  document.getElementById("filter-status-riwayat").value = "";
  document.getElementById("filter-bulan-riwayat").value = "";
  filterRiwayat();
}

// Tambah ke PAGE_LABELS dan renderPage
PAGE_LABELS["riwayat"] = "Riwayat Transaksi";
const _origRenderPage = renderPage;
// Override renderPage sudah handle lewat map di dalam fungsi
// Tambahkan event listener filter riwayat
document
  .getElementById("search-riwayat")
  ?.addEventListener("input", filterRiwayat);
document
  .getElementById("filter-status-riwayat")
  ?.addEventListener("change", filterRiwayat);
document
  .getElementById("filter-bulan-riwayat")
  ?.addEventListener("change", filterRiwayat);
