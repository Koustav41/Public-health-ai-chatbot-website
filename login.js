function switchAuthTab(type) {
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

function handleLoginSubmit(e) {
  e.preventDefault();
  const user = document.getElementById('login-user').value;
  saveUserSession(user || 'Priya Verma');
}

function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  saveUserSession(name);
}

function handleGuestLogin() {
  saveUserSession('Priya Verma');
}

function saveUserSession(userName) {
  const userObj = {
    name: userName,
    email: 'priya.verma@health.in',
    phone: '+91 98765 43210',
    bloodGroup: 'O+',
    healthId: 'ABDM-91-8420-1129-90',
    city: 'New Delhi'
  };

  localStorage.setItem('mediyogi_user', JSON.stringify(userObj));
  window.location.href = 'dashboard.html';
}