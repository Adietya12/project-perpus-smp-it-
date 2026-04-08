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
    // Panggil callback jika ada (untuk auto-tambah buku)
    if (typeof cfg.onSelect === "function") cfg.onSelect(li.dataset.value, li.textContent);
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
  pengaturan: "Pengaturan Akun",
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
let _chartHarian = null;

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

  // ── Top Peminjam ──
  const countMap = {};
  DB.transaksi.forEach((t) => {
    const key = t.anggota_id;
    if (!key) return;
    if (!countMap[key]) countMap[key] = { nama: tNamaA(t) || "-", nomor: t.nomor_anggota || "", total: 0 };
    countMap[key].total++;
  });
  const topList = Object.values(countMap).sort((a, b) => b.total - a.total).slice(0, 10);
  const topTbody = document.getElementById("dash-top-peminjam");
  topTbody.innerHTML = !topList.length
    ? '<tr><td colspan="3" class="empty-cell">Belum ada data</td></tr>'
    : topList.map((a, i) => `<tr>
        <td style="text-align:center;font-weight:700;color:${i < 3 ? "#f59e0b" : "#6b7280"}">${i + 1}</td>
        <td><strong>${a.nama}</strong><br><span style="font-size:12px;color:#6b7280">${a.nomor}</span></td>
        <td style="text-align:center"><span class="badge badge-yellow">${a.total} buku</span></td>
      </tr>`).join("");

  // ── Grafik Peminjaman 7 Hari Terakhir ──
  const days = [];
  const counts = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("id-ID", { weekday: "short", day: "2-digit" });
    days.push(label);
    counts.push(DB.transaksi.filter((t) => (t.tanggal_pinjam || "").startsWith(iso)).length);
  }
  const ctx = document.getElementById("dash-chart-harian")?.getContext("2d");
  if (ctx) {
    if (_chartHarian) _chartHarian.destroy();
    _chartHarian = new Chart(ctx, {
      type: "bar",
      data: {
        labels: days,
        datasets: [{
          label: "Peminjaman",
          data: counts,
          backgroundColor: "rgba(59,130,246,0.7)",
          borderColor: "rgba(59,130,246,1)",
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 11 } },
            grid: { color: "rgba(0,0,0,0.05)" }
          },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
  }

  // ── Buku Terlambat ──
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

function handleKategoriChange(sel) {
  const input = document.getElementById("buku-kategori");
  if (sel.value === "Lainnya") {
    input.style.display = "block";
    input.value = "";
    input.focus();
  } else {
    input.style.display = "none";
    input.value = sel.value;
  }
}

async function simpanBuku() {
  const id = document.getElementById("buku-edit-id").value;
  // Pakai native HTML validation
  const fields = ["buku-judul", "buku-stok"];
  let valid = true;
  fields.forEach((fId) => {
    const el = document.getElementById(fId);
    if (!el.value.toString().trim()) {
      el.reportValidity();
      valid = false;
    }
  });
  // Validasi kategori
  const kategoriVal = document.getElementById("buku-kategori").value.trim();
  const kategoriSel = document.getElementById("buku-kategori-select");
  if (!kategoriVal) {
    kategoriSel.reportValidity && kategoriSel.setCustomValidity("Pilih kategori terlebih dahulu");
    kategoriSel.reportValidity();
    kategoriSel.setCustomValidity("");
    valid = false;
  }
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
  // Set dropdown kategori
  const katSel = document.getElementById("buku-kategori-select");
  const katInput = document.getElementById("buku-kategori");
  const katOptions = Array.from(katSel.options).map(o => o.value);
  if (katOptions.includes(b.kategori)) {
    katSel.value = b.kategori;
    katInput.value = b.kategori;
    katInput.style.display = "none";
  } else {
    katSel.value = "Lainnya";
    katInput.value = b.kategori;
    katInput.style.display = "block";
  }
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
  const katSelReset = document.getElementById("buku-kategori-select");
  if (katSelReset) katSelReset.value = "";
  const katInputReset = document.getElementById("buku-kategori");
  if (katInputReset) katInputReset.style.display = "none";
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
  if (!aktif.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Tidak ada peminjaman aktif</td></tr>';
  } else {
    // Kelompokkan per anggota agar buku dari anggota yg sama terlihat bersama
    const grouped = {};
    aktif.forEach((t) => {
      const key = t.anggota_id + "_" + tPinjam(t) + "_" + tBatas(t);
      if (!grouped[key]) grouped[key] = { t, buku: [] };
      grouped[key].buku.push(tJudulB(t) || "-");
    });
    tbody.innerHTML = Object.values(grouped).map(({ t, buku }) => {
      const terlambat = tBatas(t) < today();
      const bukuCells = buku.map((j, i) =>
        `<td style="vertical-align:middle">${j}</td>`
      ).join("");
      // Jika ada lebih dari 1 buku tampilkan sebagai badge-tag
      const bukuDisplay = buku.length === 1
        ? buku[0]
        : buku.map(j => `<span style="display:inline-block;background:#e0f2fe;color:#0369a1;border-radius:4px;padding:2px 8px;font-size:12px;margin:2px 2px 2px 0">${j}</span>`).join("");
      return `<tr>
        <td class="td-mono">${tKode(t)}</td>
        <td>${tNamaA(t) || "-"}</td>
        <td>${bukuDisplay}</td>
        <td>${fDate(tPinjam(t))}</td>
        <td>${fDate(tBatas(t))} ${terlambat ? '<span class="badge badge-red">Terlambat</span>' : ""}</td>
        <td>${terlambat ? '<span class="badge badge-red">Terlambat</span>' : '<span class="badge badge-yellow">Dipinjam</span>'}</td>
      </tr>`;
    }).join("");
  }

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
    placeholder: "-- Pilih Buku (klik untuk menambah) --",
    items: DB.buku
      .filter((b) => bTersedia(b) > 0 && !bukuDipilih.includes(b.id))
      .map((b) => ({ value: b.id, label: `[${bKode(b)}] ${bJudul(b)} (stok: ${bTersedia(b)})` })),
    onSelect: function(value) {
      // Langsung tambah buku saat dipilih (tanpa klik tombol Tambah)
      const id = +value;
      if (!id) return;
      if (!bukuDipilih.includes(id)) {
        bukuDipilih.push(id);
        renderBukuDipilih();
        renderSelectBukuPinjam();
        document.getElementById("pinjam-buku-error").style.display = "none";
      }
      // Reset display
      const hidden = document.getElementById("pinjam-buku-select");
      if (hidden) hidden.value = "";
      const lbl = document.getElementById("label-pinjam-buku-select");
      if (lbl) { lbl.textContent = "-- Pilih Buku (klik untuk menambah) --"; lbl.classList.add("placeholder"); }
    }
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
  if (!aktif.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Tidak ada peminjaman aktif</td></tr>';
    return;
  }
  // Kelompokkan per sesi (anggota + tanggal pinjam + tanggal batas) — sama seperti renderPinjam
  const grouped = {};
  aktif.forEach((t) => {
    const key = t.anggota_id + "_" + tPinjam(t) + "_" + tBatas(t);
    if (!grouped[key]) grouped[key] = { t, buku: [] };
    grouped[key].buku.push({ judul: tJudulB(t) || "-", id: t.id });
  });
  tbody.innerHTML = Object.values(grouped).map(({ t, buku }) => {
    const hari = Math.max(0, daysDiff(tBatas(t), today()));
    const denda = hari * DENDA_PER_HARI;
    // Tampilkan buku sebagai badge jika lebih dari 1, teks biasa jika 1
    const bukuDisplay = buku.length === 1
      ? buku[0].judul
      : buku.map(b => `<span style="display:inline-block;background:#e0f2fe;color:#0369a1;border-radius:4px;padding:2px 8px;font-size:12px;margin:2px 2px 2px 0">${b.judul}</span>`).join("");
    return `<tr>
      <td class="td-mono">${tKode(t)}</td>
      <td>${tNamaA(t) || "-"}</td>
      <td>${bukuDisplay}</td>
      <td>${fDate(tBatas(t))}</td>
      <td>${hari > 0 ? `<span class="badge badge-red">${hari} hari · ${fRp(denda)}</span>` : '<span class="badge badge-green">Tepat waktu</span>'}</td>
      <td><button class="btn btn-primary btn-sm" onclick="prosesKembali(${t.id})">Proses Kembali</button></td>
    </tr>`;
  }).join("");
}

// ID transaksi yang sedang akan diproses kembali
let _kembaliId = null;

function prosesKembali(id) {
  const t = DB.transaksi.find((x) => x.id == id);
  if (!t) return;

  // Cari semua buku yang dipinjam oleh anggota ini pada sesi yang sama
  const semuaBuku = DB.transaksi.filter(
    (x) => x.anggota_id === t.anggota_id &&
            x.tanggal_pinjam === t.tanggal_pinjam &&
            x.tanggal_batas_kembali === t.tanggal_batas_kembali &&
            tStatus(x) === "dipinjam"
  );

  // Isi modal
  document.getElementById("kembali-nama-anggota").innerHTML =
    `<strong>${tNamaA(t)}</strong> <span style="color:#6b7280;font-size:13px">${t.nomor_anggota || ""}</span>`;

  const bukuList = document.getElementById("kembali-daftar-buku");
  bukuList.innerHTML = semuaBuku.map((x) => {
    const hariX = Math.max(0, daysDiff(x.tanggal_batas_kembali, today()));
    const dendaX = hariX * DENDA_PER_HARI;
    return `<label style="display:flex;align-items:center;gap:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;cursor:pointer;transition:background .15s" class="kembali-buku-item">
      <input type="checkbox" class="kembali-checkbox" data-id="${x.id}" data-hari="${hariX}" data-denda="${dendaX}"
        style="width:16px;height:16px;accent-color:#3b82f6;flex-shrink:0" />
      <span style="font-size:18px">📖</span>
      <div style="flex:1">
        <div style="font-weight:500;font-size:14px">${tJudulB(x) || "-"}</div>
        <div style="font-size:12px;color:#6b7280">${x.kode_buku || ""} · Dipinjam ${fDate(x.tanggal_pinjam)}</div>
      </div>
      ${hariX > 0
        ? `<span class="badge badge-red">${hariX} hari · ${fRp(dendaX)}</span>`
        : '<span class="badge badge-green">Tepat waktu</span>'}
    </label>`;
  }).join("");

  // Update info denda saat checkbox berubah
  function updateDendaInfo() {
    const checked = [...document.querySelectorAll(".kembali-checkbox:checked")];
    const totalHari = checked.length ? Math.max(...checked.map(c => parseInt(c.dataset.hari))) : 0;
    const totalDenda = checked.reduce((s, c) => s + parseInt(c.dataset.denda), 0);
    const dendaInfo = document.getElementById("kembali-info-denda");
    if (!checked.length) {
      dendaInfo.innerHTML = `<div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;padding:10px 14px;color:#92400e;font-size:13px">⚠️ Pilih minimal 1 buku untuk dikembalikan.</div>`;
    } else if (totalDenda > 0) {
      dendaInfo.innerHTML = `<div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;padding:10px 14px;color:#92400e;font-size:13px">
        ⚠️ ${checked.length} buku dipilih — Denda: <strong>${fRp(totalDenda)}</strong>
      </div>`;
    } else {
      dendaInfo.innerHTML = `<div style="background:#dcfce7;border:1px solid #86efac;border-radius:6px;padding:10px 14px;color:#166534;font-size:13px">
        ✅ ${checked.length} buku dipilih — Tepat waktu, tidak ada denda.
      </div>`;
    }
  }

  bukuList.querySelectorAll(".kembali-checkbox").forEach(cb =>
    cb.addEventListener("change", updateDendaInfo)
  );
  updateDendaInfo();

  // Tombol pilih semua
  const btnPilihSemua = document.getElementById("btn-pilih-semua-buku");
  btnPilihSemua.onclick = () => {
    const cbs = [...document.querySelectorAll(".kembali-checkbox")];
    const semuaChecked = cbs.every(c => c.checked);
    cbs.forEach(c => c.checked = !semuaChecked);
    btnPilihSemua.textContent = semuaChecked ? "Pilih Semua" : "Batal Semua";
    updateDendaInfo();
  };
  btnPilihSemua.textContent = "Pilih Semua";

  _kembaliId = id;
  openModal("modal-kembali");
}

async function konfirmasiKembali() {
  if (!_kembaliId) return;

  // Ambil hanya buku yang di-centang
  const checkedBoxes = [...document.querySelectorAll(".kembali-checkbox:checked")];
  if (!checkedBoxes.length) {
    showAlert("Pilih minimal 1 buku untuk dikembalikan.", "warn");
    return;
  }

  const selectedIds = checkedBoxes.map(c => parseInt(c.dataset.id));
  const totalDenda = checkedBoxes.reduce((s, c) => s + parseInt(c.dataset.denda), 0);
  const maxHari = Math.max(...checkedBoxes.map(c => parseInt(c.dataset.hari)));

  let berhasil = 0, gagal = [];
  for (const xId of selectedIds) {
    const res = await apiKembali(xId);
    if (res.success) berhasil++;
    else gagal.push(res.message);
  }

  closeModal("modal-kembali");
  _kembaliId = null;

  if (berhasil > 0) {
    showAlert(
      maxHari > 0
        ? `${berhasil} buku dikembalikan. Denda ${fRp(totalDenda)} dicatat.`
        : `${berhasil} buku berhasil dikembalikan tepat waktu.`,
      maxHari > 0 ? "warn" : "success",
    );
  }
  if (gagal.length) showAlert(gagal.join(" | "), "error");

  renderKembali();
  renderDenda();
  renderDashboard();
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
document
  .getElementById("btn-konfirmasi-kembali")
  ?.addEventListener("click", konfirmasiKembali);
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

  // Pisahkan: buku yang sudah dikembalikan dikelompokkan per tanggal_kembali + anggota,
  // buku yang masih dipinjam dikelompokkan per sesi (anggota + tanggal_pinjam + tanggal_batas_kembali)
  const groups = {};
  data.forEach((t) => {
    let key;
    if (tStatus(t) === "dikembalikan" && t.tanggal_kembali) {
      // Kelompokkan per event pengembalian: anggota + tanggal_kembali
      key = "kembali_" + t.anggota_id + "_" + t.tanggal_kembali;
    } else {
      // Masih dipinjam: kelompokkan per sesi peminjaman
      key = "pinjam_" + t.anggota_id + "_" + tPinjam(t) + "_" + tBatas(t);
    }
    if (!groups[key]) groups[key] = { t, buku: [], isKembali: tStatus(t) === "dikembalikan" };
    groups[key].buku.push(t);
  });
  const grupList = Object.values(groups);

  document.getElementById("count-riwayat").textContent =
    grupList.length + " transaksi";

  const tbody = document.getElementById("tbl-riwayat");
  if (!grupList.length) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="empty-cell">Tidak ada data yang cocok</td></tr>';
    return;
  }

  tbody.innerHTML = grupList.map(({ t, buku, isKembali }) => {
    const terlambat =
      isKembali
        ? buku.some(b => b.tanggal_kembali > tBatas(b))
        : tBatas(t) < today();

    // Tampilkan hanya buku yang relevan (sesuai event ini)
    const bukuDisplay = buku.length === 1
      ? (tJudulB(buku[0]) || "-")
      : buku.map(b => `<span style="display:inline-block;background:#e0f2fe;color:#0369a1;border-radius:4px;padding:2px 8px;font-size:12px;margin:2px 2px 2px 0">${tJudulB(b) || "-"}</span>`).join("");

    // Kumpulkan denda dari buku-buku dalam event ini saja
    const dendaList = buku
      .map((b) => DB.denda.find((d) => d.transaksi_id == b.id))
      .filter(Boolean);
    let dendaInfo;
    if (!dendaList.length) {
      dendaInfo = '<span style="color:#a3a3a3">—</span>';
    } else {
      const totalDenda = dendaList.reduce((s, d) => s + dJumlah(d), 0);
      const semuaLunas = dendaList.every((d) => dStatus(d) === "lunas");
      dendaInfo = `<span class="badge ${semuaLunas ? "badge-green" : "badge-red"}">${fRp(totalDenda)}</span>`;
    }

    const statusBadge =
      !isKembali
        ? terlambat
          ? '<span class="badge badge-red">Terlambat</span>'
          : '<span class="badge badge-yellow">Dipinjam</span>'
        : '<span class="badge badge-green">Dikembalikan</span>';

    // Tanggal kembali: dari event pengembalian ini
    const tglKembali = isKembali
      ? buku.map(b => b.tanggal_kembali).filter(Boolean).sort().pop()
      : null;

    return `<tr>
      <td class="td-mono">${tKode(t)}</td>
      <td><strong>${tNamaA(t) || "-"}</strong><br><span class="td-mono" style="font-size:11px">${t.nomor_anggota || ""}</span></td>
      <td>${bukuDisplay}</td>
      <td>${fDate(tPinjam(t))}</td>
      <td>${fDate(tBatas(t))}</td>
      <td>${tglKembali ? fDate(tglKembali) : '<span style="color:#a3a3a3">Belum</span>'}</td>
      <td>${dendaInfo}</td>
      <td>${statusBadge}</td>
    </tr>`;
  }).join("");
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