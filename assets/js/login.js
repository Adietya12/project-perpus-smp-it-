/* ============================================
   LOGIN.JS — Terhubung ke API PHP
   ============================================ */
'use strict';

const inpUser   = document.getElementById('inp-user');
const inpPass   = document.getElementById('inp-pass');
const btnLogin  = document.getElementById('btn-login');
const errorBox  = document.getElementById('error-box');
const errorMsg  = document.getElementById('error-msg');
const toggleBtn = document.getElementById('toggle-pw');
const eyeIcon   = document.getElementById('eye-icon');
const loginForm = document.getElementById('login-form');
const successState = document.getElementById('success-state');
const successName  = document.getElementById('success-name');
const dotsEl    = document.getElementById('dots');
const hintUser  = document.getElementById('hint-user');
const hintPass  = document.getElementById('hint-pass');
const forgotLink = document.getElementById('forgot-link');
const daftarLink = document.getElementById('daftar-link');

toggleBtn.addEventListener('click', () => {
  const isPassword = inpPass.type === 'password';
  inpPass.type = isPassword ? 'text' : 'password';
  eyeIcon.innerHTML = isPassword
    ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
    : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
});

function showError(msg) {
  errorMsg.textContent = msg;
  errorBox.classList.remove('show');
  void errorBox.offsetWidth;
  errorBox.classList.add('show');
}

async function doLogin() {
  const username = inpUser.value.trim();
  const password = inpPass.value;
  if (!username || !password) { showError('Username dan password tidak boleh kosong.'); return; }

  btnLogin.classList.add('loading');
  errorBox.classList.remove('show');

  try {
    const res = await fetch('/pustaka/api/auth/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json();
    btnLogin.classList.remove('loading');

    if (json.success) {
      onLoginSuccess(json.data);
    } else {
      showError(json.message || 'Username atau password salah.');
    }
  } catch (err) {
    btnLogin.classList.remove('loading');
    showError('Tidak dapat terhubung ke server. Pastikan XAMPP aktif.');
  }
}

function onLoginSuccess(data) {
  loginForm.style.display = 'none';
  successName.textContent = `Selamat datang, ${data.nama}`;
  successState.classList.add('show');
  let dotCount = 0;
  const dotInterval = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    dotsEl.textContent = '.'.repeat(dotCount);
  }, 400);
  setTimeout(() => { clearInterval(dotInterval); window.location.href = 'pages/dashboard.html'; }, 2000);
}

inpUser.addEventListener('keydown', e => { if (e.key === 'Enter') inpPass.focus(); });
inpPass.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
btnLogin.addEventListener('click', doLogin);
hintUser?.addEventListener('click', () => { inpUser.value = hintUser.textContent.trim(); inpUser.focus(); });
hintPass?.addEventListener('click', () => { inpPass.value = hintPass.textContent.trim(); });
forgotLink?.addEventListener('click', e => { e.preventDefault(); showError('Hubungi administrator sistem untuk reset password.'); });
daftarLink?.addEventListener('click', e => { e.preventDefault(); showError('Pendaftaran akun hanya bisa dilakukan oleh admin sistem.'); });
