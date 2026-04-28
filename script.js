// ============================================================
//   EduHub Students Portal — script.js
//   Works in DEMO MODE (no Supabase) and with real Supabase.
// ============================================================

// ── DEMO ACCOUNT ─────────────────────────────────────────────
const DEMO_EMAIL    = 'demo@eduhub.com';
const DEMO_PASSWORD = 'demo1234';
const DEMO_NAME     = 'Daniel Ukpong';

// ── TOAST ─────────────────────────────────────────────────────
function showToast(message, type = 'default') {
  document.querySelector('.toast-pop')?.remove();
  const icons = { success: '✅', error: '❌', info: 'ℹ️', default: '📢' };
  const colors = { success: '#3cbe8a', error: '#e05252', info: '#c9a84c', default: '#c9a84c' };

  const t = document.createElement('div');
  t.className = 'toast-pop';
  t.innerHTML = `<span>${icons[type] || '📢'}</span><span>${message}</span>`;

  Object.assign(t.style, {
    position:   'fixed',
    bottom:     '1.5rem',
    right:      '1.5rem',
    background: '#0d1b2a',
    color:      '#fff',
    padding:    '.85rem 1.3rem',
    borderRadius: '9px',
    fontSize:   '.87rem',
    fontWeight: '500',
    boxShadow:  '0 20px 60px rgba(13,27,42,.3)',
    zIndex:     '9999',
    borderLeft: `4px solid ${colors[type] || colors.default}`,
    maxWidth:   '320px',
    fontFamily: "'DM Sans', sans-serif",
    display:    'flex',
    alignItems: 'center',
    gap:        '.5rem',
    animation:  'toastIn .3s cubic-bezier(.22,1,.36,1)',
  });

  // Inject keyframe if not already there
  if (!document.getElementById('toastKeyframe')) {
    const style = document.createElement('style');
    style.id = 'toastKeyframe';
    style.textContent = `
      @keyframes toastIn {
        from { opacity:0; transform:translateY(16px) scale(.95); }
        to   { opacity:1; transform:translateY(0) scale(1); }
      }`;
    document.head.appendChild(style);
  }

  document.body.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'opacity .3s ease, transform .3s ease';
    t.style.opacity    = '0';
    t.style.transform  = 'translateY(14px)';
    setTimeout(() => t.remove(), 320);
  }, 3500);
}

// ── DROPDOWN MENU ─────────────────────────────────────────────
function toggleMenu() {
  document.getElementById('menuDropdown')?.classList.toggle('show');
}
document.addEventListener('click', e => {
  const container = document.querySelector('.menu-container');
  const dropdown  = document.getElementById('menuDropdown');
  if (dropdown && container && !container.contains(e.target)) {
    dropdown.classList.remove('show');
  }
});

// ── SESSION HELPERS ───────────────────────────────────────────
function isSupabaseAvailable() {
  return typeof supabase !== 'undefined' &&
         typeof supabase.auth !== 'undefined' &&
         supabase.auth !== null;
}

function setDemoSession(name, email) {
  localStorage.setItem('eduhub_demo_session', 'active');
  localStorage.setItem('eduhub_demo_name',    name  || DEMO_NAME);
  localStorage.setItem('eduhub_demo_email',   email || DEMO_EMAIL);
}

function clearDemoSession() {
  localStorage.removeItem('eduhub_demo_session');
  localStorage.removeItem('eduhub_demo_name');
  localStorage.removeItem('eduhub_demo_email');
}

function getDemoUser() {
  return {
    name:  localStorage.getItem('eduhub_demo_name')  || DEMO_NAME,
    email: localStorage.getItem('eduhub_demo_email') || DEMO_EMAIL,
  };
}

function isDemoSession() {
  return localStorage.getItem('eduhub_demo_session') === 'active';
}

// ── LOGOUT ────────────────────────────────────────────────────
async function logout() {
  clearDemoSession();
  if (isSupabaseAvailable()) {
    try { await supabase.auth.signOut(); } catch (_) {}
  }
  window.location.href = 'index.html';
}

// ── AUTH GUARD ────────────────────────────────────────────────
async function requireAuth() {
  // Demo session is valid
  if (isDemoSession()) return;

  if (isSupabaseAvailable()) {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) return;
    } catch (_) {}
  }
  // Neither demo nor supabase session → kick to login
  window.location.href = 'index.html';
}

// ── LOAD USER INFO (header & profile) ────────────────────────
async function loadUserInfo() {
  let displayName = '';
  let email       = '';

  if (isDemoSession()) {
    const u = getDemoUser();
    displayName = u.name;
    email       = u.email;
  } else if (isSupabaseAvailable()) {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (user) {
        displayName = user.user_metadata?.full_name || user.email.split('@')[0];
        email       = user.email;
      }
    } catch (_) {}
  }

  if (!displayName) return;

  const safeSet = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const safeVal = (id, val) => { const el = document.getElementById(id); if (el) el.value       = val; };

  safeSet('userName',       displayName);
  safeSet('userEmail',      email);
  safeSet('avatarInitials', displayName.charAt(0).toUpperCase());
  safeSet('welcomeMessage', `Welcome back, ${displayName}! 👋`);

  // Profile page fields
  safeVal('fullName', displayName);
  safeVal('email',    email);
}

// ── LOGIN FORM ────────────────────────────────────────────────
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();

    const emailVal = document.getElementById('email').value.trim();
    const passVal  = document.getElementById('password').value;
    const btn      = loginForm.querySelector('button[type="submit"]');
    btn.textContent = 'Signing in…';
    btn.disabled    = true;

    // ── 1. Demo account shortcut ─────────────────────────────
    if (emailVal === DEMO_EMAIL && passVal === DEMO_PASSWORD) {
      setDemoSession(DEMO_NAME, DEMO_EMAIL);
      showToast('Demo login successful! Redirecting…', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
      return;
    }

    // ── 2. Also accept ANY email/password as demo (generic demo) ─
    //     Remove this block if you only want the specific demo creds
    if (passVal.length >= 6 && !isSupabaseAvailable()) {
      const name = emailVal.split('@')[0].replace(/[._]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      setDemoSession(name, emailVal);
      showToast('Signed in (demo mode)! Redirecting…', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
      return;
    }

    // ── 3. Real Supabase auth ─────────────────────────────────
    if (isSupabaseAvailable()) {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email: emailVal, password: passVal });
        if (error) {
          showToast('Invalid email or password. Try again.', 'error');
          btn.textContent = 'Sign In →';
          btn.disabled    = false;
        } else {
          showToast('Login successful! Redirecting…', 'success');
          setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
        }
      } catch (_) {
        showToast('Connection error. Try again.', 'error');
        btn.textContent = 'Sign In →';
        btn.disabled    = false;
      }
    } else {
      showToast('Password too short (min 6 chars).', 'error');
      btn.textContent = 'Sign In →';
      btn.disabled    = false;
    }
  });
}

// ── CREATE ACCOUNT FORM ───────────────────────────────────────
const createAccountForm = document.getElementById('createAccountForm');
if (createAccountForm) {
  createAccountForm.addEventListener('submit', async e => {
    e.preventDefault();

    const fullname        = document.getElementById('fullname').value.trim();
    const emailVal        = document.getElementById('email').value.trim();
    const password        = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const btn             = createAccountForm.querySelector('button[type="submit"]');

    if (password !== confirmPassword) return showToast('Passwords do not match.', 'error');
    if (password.length < 8)         return showToast('Password must be at least 8 characters.', 'error');
    if (!fullname)                   return showToast('Please enter your full name.', 'error');

    btn.textContent = 'Creating account…';
    btn.disabled    = true;

    if (isSupabaseAvailable()) {
      try {
        const { error } = await supabase.auth.signUp({
          email: emailVal, password,
          options: { data: { full_name: fullname } }
        });
        if (error) {
          showToast(error.message, 'error');
          btn.textContent = 'Create Account →';
          btn.disabled    = false;
        } else {
          showToast('Account created! Please check your email.', 'success');
          setTimeout(() => { window.location.href = 'index.html'; }, 1500);
        }
      } catch (_) {
        // Fallback to demo
        setDemoSession(fullname, emailVal);
        showToast('Account created (demo mode)!', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
      }
    } else {
      // Demo mode — just save and go
      setDemoSession(fullname, emailVal);
      showToast('Account created! Welcome to EduHub!', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
    }
  });
}

// ── FORGOT PASSWORD FORM ──────────────────────────────────────
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener('submit', async e => {
    e.preventDefault();
    const emailVal = document.getElementById('email').value.trim();
    const btn      = forgotPasswordForm.querySelector('button[type="submit"]');

    btn.textContent = 'Sending…';
    btn.disabled    = true;

    if (isSupabaseAvailable()) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(emailVal, {
          redirectTo: `${location.origin}/reset-password.html`
        });
        if (error) {
          showToast(error.message, 'error');
          btn.textContent = 'Send Reset Link →';
          btn.disabled    = false;
        } else {
          showToast('Reset link sent! Check your inbox.', 'success');
          btn.textContent = 'Email Sent ✓';
        }
      } catch (_) {
        showToast('Reset link sent! (demo mode)', 'success');
        btn.textContent = 'Email Sent ✓';
      }
    } else {
      // Demo mode
      setTimeout(() => {
        showToast('Reset link sent to ' + emailVal + '! (demo mode)', 'success');
        btn.textContent = 'Email Sent ✓';
      }, 800);
    }
  });
}

// ── RESET PASSWORD FORM ───────────────────────────────────────
const resetPasswordForm = document.getElementById('resetPasswordForm');
if (resetPasswordForm) {
  resetPasswordForm.addEventListener('submit', async e => {
    e.preventDefault();
    const password        = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const btn             = resetPasswordForm.querySelector('button[type="submit"]');

    if (password !== confirmPassword) return showToast('Passwords do not match.', 'error');
    if (password.length < 8)         return showToast('Password must be at least 8 characters.', 'error');

    btn.textContent = 'Updating…';
    btn.disabled    = true;

    if (isSupabaseAvailable()) {
      try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          showToast(error.message, 'error');
          btn.textContent = 'Update Password →';
          btn.disabled    = false;
        } else {
          showToast('Password updated successfully!', 'success');
          setTimeout(() => { window.location.href = 'index.html'; }, 1200);
        }
      } catch (_) {
        showToast('Password updated (demo mode)!', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1200);
      }
    } else {
      setTimeout(() => {
        showToast('Password updated (demo mode)!', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1200);
      }, 800);
    }
  });
}

// ── SAVE PROFILE ──────────────────────────────────────────────
async function saveProfile() {
  const phone = document.getElementById('phone')?.value;
  const age   = document.getElementById('age')?.value;

  if (phone) localStorage.setItem('eduhub_phone', phone);
  if (age)   localStorage.setItem('eduhub_dob',   age);

  showToast('Profile saved successfully!', 'success');
}

function restoreProfile() {
  const phone   = localStorage.getItem('eduhub_phone');
  const dob     = localStorage.getItem('eduhub_dob');
  const phoneEl = document.getElementById('phone');
  const ageEl   = document.getElementById('age');
  if (phoneEl && phone) phoneEl.value = phone;
  if (ageEl   && dob)   ageEl.value   = dob;
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const protectedPages = ['dashboard.html', 'profile.html', 'about.html', 'settings.html'];
  const currentPage    = location.pathname.split('/').pop() || 'index.html';

  if (protectedPages.includes(currentPage)) {
    await requireAuth();
    await loadUserInfo();
  }

  restoreProfile();

  // Auto-fill demo credentials hint on login page
  const demoHint = document.getElementById('demoHint');
  if (demoHint) {
    demoHint.addEventListener('click', () => {
      const emailEl = document.getElementById('email');
      const passEl  = document.getElementById('password');
      if (emailEl) emailEl.value = DEMO_EMAIL;
      if (passEl)  passEl.value  = DEMO_PASSWORD;
      showToast('Demo credentials filled! Click Sign In.', 'info');
    });
  }
});