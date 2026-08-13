/**
 * Mediyogi AI - Authentication Logic (Login & Registration System)
 */

// Initialize default users if not present in localStorage
function getRegisteredUsers() {
  let users = JSON.parse(localStorage.getItem('mediyogi_registered_users'));
  if (!users || !Array.isArray(users) || users.length === 0) {
    users = [
      {
        name: 'Priya Verma',
        email: 'priya.verma@health.in',
        password: 'password123',
        phone: '+91 98765 43210',
        bloodGroup: 'O+',
        healthId: 'ABDM-91-8420-1129-90',
        city: 'New Delhi',
        avatar: 'PV',
        dob: '1998-05-14',
        gender: 'Female'
      }
    ];
    localStorage.setItem('mediyogi_registered_users', JSON.stringify(users));
  }
  return users;
}

// Show alert banner on login/register page
function showAuthAlert(message, type = 'error') {
  const alertEl = document.getElementById('auth-alert');
  if (!alertEl) return;
  alertEl.className = `auth-alert ${type}`;
  alertEl.innerHTML = (type === 'error' ? '⚠️ ' : type === 'success' ? '✅ ' : 'ℹ️ ') + message;
  alertEl.style.display = 'flex';
}

// Clear alert banner
function hideAuthAlert() {
  const alertEl = document.getElementById('auth-alert');
  if (alertEl) {
    alertEl.style.display = 'none';
  }
}

// Tab Switching
function switchAuthTab(type) {
  hideAuthAlert();
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  const loginBtn = document.getElementById('tab-login-btn');
  const regBtn = document.getElementById('tab-reg-btn');

  if (type === 'login') {
    loginForm.classList.add('active');
    regForm.classList.remove('active');
    loginBtn.classList.add('active');
    regBtn.classList.remove('active');
  } else {
    regForm.classList.add('active');
    loginForm.classList.remove('active');
    regBtn.classList.add('active');
    loginBtn.classList.remove('active');
  }
}

// Toggle password visibility
function togglePasswordVisibility(inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btnEl.textContent = '🙈';
  } else {
    input.type = 'password';
    btnEl.textContent = '👁️';
  }
}

// Handle Login Submit
function handleLoginSubmit(e) {
  e.preventDefault();
  hideAuthAlert();

  const userInput = document.getElementById('login-user').value.trim();
  const passInput = document.getElementById('login-pass').value;

  if (!userInput || !passInput) {
    showAuthAlert('Please enter both email/username and password.', 'error');
    return;
  }

  const users = getRegisteredUsers();
  const matchedUser = users.find(u => 
    (u.email.toLowerCase() === userInput.toLowerCase() || u.name.toLowerCase() === userInput.toLowerCase()) &&
    u.password === passInput
  );

  if (matchedUser) {
    showAuthAlert('Login successful! Redirecting...', 'success');
    setTimeout(() => {
      saveUserSession(matchedUser);
    }, 600);
  } else {
    showAuthAlert('Invalid email or password. Please check your credentials or create a new account.', 'error');
  }
}

// Handle Register Submit
function handleRegisterSubmit(e) {
  e.preventDefault();
  hideAuthAlert();

  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const pass = document.getElementById('reg-pass').value;
  const city = document.getElementById('reg-city').value.trim() || 'New Delhi';

  if (!name || name.length < 2) {
    showAuthAlert('Please enter a valid full name (at least 2 characters).', 'error');
    return;
  }

  if (!email || !email.includes('@') || !email.includes('.')) {
    showAuthAlert('Please enter a valid email address.', 'error');
    return;
  }

  if (!pass || pass.length < 6) {
    showAuthAlert('Password must be at least 6 characters long.', 'error');
    return;
  }

  const users = getRegisteredUsers();
  const existingUser = users.find(u => u.email.toLowerCase() === email);

  if (existingUser) {
    showAuthAlert('An account with this email already exists. Please log in.', 'error');
    return;
  }

  // Derive initials for Avatar
  const nameParts = name.split(' ').filter(p => p.length > 0);
  let avatar = 'U';
  if (nameParts.length >= 2) {
    avatar = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  } else if (nameParts.length === 1) {
    avatar = nameParts[0].substring(0, 2).toUpperCase();
  }

  // Generate ABDM Health ID
  const r1 = Math.floor(1000 + Math.random() * 9000);
  const r2 = Math.floor(1000 + Math.random() * 9000);
  const r3 = Math.floor(10 + Math.random() * 90);
  const healthId = `ABDM-91-${r1}-${r2}-${r3}`;

  const newUser = {
    name: name,
    email: email,
    password: pass,
    phone: '+91 ' + Math.floor(7000000000 + Math.random() * 2999999999),
    bloodGroup: 'O+',
    healthId: healthId,
    city: city,
    avatar: avatar,
    dob: '1998-05-14',
    gender: 'General'
  };

  users.push(newUser);
  localStorage.setItem('mediyogi_registered_users', JSON.stringify(users));

  showAuthAlert('Account created successfully! Logging you in...', 'success');
  setTimeout(() => {
    saveUserSession(newUser);
  }, 700);
}

// Handle Instant Guest Login
function handleGuestLogin() {
  const users = getRegisteredUsers();
  const guest = users.find(u => u.email === 'priya.verma@health.in') || users[0];
  showAuthAlert('Logging in as Instant Guest...', 'success');
  setTimeout(() => {
    saveUserSession(guest);
  }, 400);
}

// Save active session & redirect
function saveUserSession(userObj) {
  // Create session payload (omit plain password for safety)
  const sessionData = {
    name: userObj.name,
    email: userObj.email,
    phone: userObj.phone || '+91 98765 43210',
    bloodGroup: userObj.bloodGroup || 'O+',
    healthId: userObj.healthId || 'ABDM-91-8420-1129-90',
    city: userObj.city || 'New Delhi',
    avatar: userObj.avatar || 'PV',
    dob: userObj.dob || '1998-05-14',
    gender: userObj.gender || 'Female'
  };

  localStorage.setItem('mediyogi_user', JSON.stringify(sessionData));

  // Determine redirect URL from query string or default to dashboard
  const urlParams = new URLSearchParams(window.location.search);
  const redirectTarget = urlParams.get('redirect') || 'dashboard.html';
  window.location.href = redirectTarget;
}

// Check on page initialization if notice needed
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  getRegisteredUsers();
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('msg') === 'login_required') {
    showAuthAlert('Please login or create an account to access the Mediyogi AI patient portal.', 'info');
  }
});

/* ==========================================================================
   THEME MANAGEMENT (LIGHT / DARK MODE)
   ========================================================================== */
function getPreferredTheme() {
  const savedTheme = localStorage.getItem('mediyogi_theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme) {
  const targetTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', targetTheme);
  if (document.body) document.body.setAttribute('data-theme', targetTheme);
  localStorage.setItem('mediyogi_theme', targetTheme);
  updateThemeToggleUI(targetTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
  const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(nextTheme);
}

function updateThemeToggleUI(theme) {
  const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
  toggleBtns.forEach(btn => {
    const isLight = theme === 'light';
    btn.setAttribute('aria-label', isLight ? 'Switch to Dark Theme' : 'Switch to Light Theme');
    btn.setAttribute('title', isLight ? 'Switch to Dark Theme' : 'Switch to Light Theme');
    
    const iconSpan = btn.querySelector('.theme-icon');
    const labelSpan = btn.querySelector('.theme-label');
    
    if (iconSpan) {
      iconSpan.textContent = isLight ? '☀️' : '🌙';
    }
    if (labelSpan) {
      labelSpan.textContent = isLight ? 'Light' : 'Dark';
    }
  });
}

function initTheme() {
  const currentTheme = getPreferredTheme();
  applyTheme(currentTheme);
  
  const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
  toggleBtns.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      toggleTheme();
    };
  });

  window.addEventListener('storage', (e) => {
    if (e.key === 'mediyogi_theme' && e.newValue) {
      applyTheme(e.newValue);
    }
  });
}

/* ==========================================================================
   PWA SERVICE WORKER REGISTRATION
   ========================================================================== */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then((reg) => {
        console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.error('[PWA] ServiceWorker registration failed:', err);
      });
  });
}