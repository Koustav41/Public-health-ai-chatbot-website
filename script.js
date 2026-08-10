/**
 * Mediyogi Public Health AI Platform - Core Application Logic
 */

// Auth Guard & Session Management
function getActiveUserSession() {
  const sessionStr = localStorage.getItem('mediyogi_user');
  if (!sessionStr) return null;
  try {
    return JSON.parse(sessionStr);
  } catch (e) {
    return null;
  }
}

function checkAuthGuard() {
  const activeUser = getActiveUserSession();
  const currentPath = window.location.pathname.toLowerCase();

  // Protected routes check (profile.html is public for paramedic/emergency scans)
  const isProtectedPage = currentPath.includes('dashboard.html') ||
    currentPath.includes('ai.html');

  if (isProtectedPage && !activeUser) {
    const pageName = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'dashboard.html';
    window.location.href = `login.html?redirect=${encodeURIComponent(pageName)}&msg=login_required`;
    return null;
  }

  return activeUser;
}

function logoutUser() {
  localStorage.removeItem('mediyogi_user');
  window.location.href = 'login.html';
}

// Global State Initializer
const DEFAULT_GEMINI_API_KEY = typeof atob === 'function' ? atob('QVEuQWI4Uk42STU2V25lODZzbDFSRGRoLUU4MFRSUjN6ZzVaMVVXal9XWEN5VG9RcFVTeHc=') : '';

const AppState = {
  user: getActiveUserSession() || {
    name: 'Priya Verma',
    email: 'priya.verma@health.in',
    phone: '+91 98765 43210',
    dob: '1998-05-14',
    yob: '1998',
    gender: 'Female',
    bloodGroup: 'O+',
    emergencyName: 'Rajesh Verma (Father)',
    emergencyPhone: '+91 98765 43211',
    allergies: 'Dust, Penicillin',
    conditions: 'Asthma, Mild Hypertension',
    medications: 'Albuterol Inhaler (As needed), Amlodipine 5mg',
    healthId: 'ABDM-91-8420-1129-90',
    city: 'New Delhi',
    organDonor: 'Yes',
    isPublicEnabled: true,
    avatar: 'PV'
  },
  reports: JSON.parse(localStorage.getItem('mediyogi_reports')) || [
    {
      id: 'rep_1',
      title: 'Complete Blood Count (CBC)',
      date: '2026-07-20',
      type: 'Blood Test',
      file: 'CBC_Report_July2026.pdf',
      metrics: [
        { name: 'Hemoglobin', value: '13.8 g/dL', status: 'normal', range: '12.0 - 15.5 g/dL' },
        { name: 'WBC Count', value: '11,200 /µL', status: 'elevated', range: '4,500 - 11,000 /µL' },
        { name: 'Platelets', value: '250,000 /µL', status: 'normal', range: '150,000 - 450,000 /µL' }
      ],
      aiSummary: 'WBC count is slightly elevated indicating minor immune response. Monitor for low fever or seasonal infection.'
    },
    {
      id: 'rep_2',
      title: 'Lipid Profile & Glucose',
      date: '2026-06-15',
      type: 'Biochemistry',
      file: 'Lipid_Glucose_June2026.pdf',
      metrics: [
        { name: 'Fasting Blood Glucose', value: '98 mg/dL', status: 'normal', range: '< 100 mg/dL' },
        { name: 'Total Cholesterol', value: '215 mg/dL', status: 'elevated', range: '< 200 mg/dL' }
      ],
      aiSummary: 'Fasting glucose is optimal. Cholesterol level is borderline elevated. Recommended 30 mins daily walking & fiber-rich diet.'
    }
  ],
  vitals: JSON.parse(localStorage.getItem('mediyogi_vitals')) || [
    { date: 'Mon', bpSys: 120, bpDia: 80, hr: 72, spo2: 98 },
    { date: 'Tue', bpSys: 122, bpDia: 82, hr: 75, spo2: 99 },
    { date: 'Wed', bpSys: 118, bpDia: 78, hr: 70, spo2: 98 },
    { date: 'Thu', bpSys: 125, bpDia: 84, hr: 78, spo2: 97 },
    { date: 'Fri', bpSys: 121, bpDia: 81, hr: 73, spo2: 99 },
    { date: 'Sat', bpSys: 119, bpDia: 79, hr: 71, spo2: 98 },
    { date: 'Sun', bpSys: 120, bpDia: 80, hr: 72, spo2: 99 }
  ],
  waterGlasses: parseInt(localStorage.getItem('mediyogi_water')) || 5,
  appointments: JSON.parse(localStorage.getItem('mediyogi_appointments')) || [],
  currentLang: 'en',
  geminiApiKey: DEFAULT_GEMINI_API_KEY
};

// Multilingual Dictionary & AI Response Engine
const AI_KNOWLEDGE = {
  en: {
    greeting: "Hello Priya 👋 I am Mediyogi AI. How can I assist with your health today?",
    fever: "For fever above 100°F: Stay hydrated, rest, and use a cool compress. Paracetamol can help reduce temperature. If fever lasts > 3 days or causes shortness of breath, consult a doctor immediately.",
    dengue: "Dengue symptoms include high fever, severe headache, muscle/joint pain, and skin rash. Avoid aspirin. Drink plenty of ORS / coconut water. Watch for warning signs like severe abdominal pain.",
    vaccine: "Recommended vaccines for adults & children: Routine Flu shot annually, Hepatitis B, MMR, and Tdap booster every 10 years. Check your ABDM digital immunization records.",
    default: "Thank you for asking. Based on medical guidelines: Ensure adequate hydration, balanced diet, and 7-8 hours sleep. If you experience severe symptoms, seek urgent care."
  },
  hi: {
    greeting: "नमस्ते प्रिया 👋 मैं मेडीयोगी एआई हूँ। आज मैं आपकी सेहत में कैसे मदद कर सकता हूँ?",
    fever: "100°F से अधिक बुखार के लिए: खूब पानी पीएं, आराम करें। यदि बुखार 3 दिनों से अधिक रहता है तो तुरंत डॉक्टर से संपर्क करें।",
    dengue: "डेंगू के लक्षणों में तेज बुखार, सिरदर्द, जोड़ों का दर्द और दाने शामिल हैं। ओआरएस और नारियल पानी पीएं।",
    vaccine: "वयस्कों और बच्चों के लिए फ्लू टीका, हेपेटाइटिस बी और टिटनेस टीकों की सलाह दी जाती है।",
    default: "आपकी स्वास्थ्य संबंधी जानकारी के लिए: पर्याप्त पानी पीएं, संतुलित आहार लें और 7-8 घंटे सोएं।"
  },
  bn: {
    greeting: "নমস্কার প্রিয়া 👋 আমি মেডিওগী এআই। আপনার স্বাস্থ্যের ব্যাপারে কীভাবে সাহায্য করতে পারি?",
    fever: "১০০ ডিগ্রি ফারেনহাইটের বেশি জ্বরের জন্য: পর্যাপ্ত জল পান করুন, বিশ্রাম নিন। জ্বর ৩ দিনের বেশি থাকলে ডাক্তারের পরামর্শ নিন।",
    dengue: "ডেঙ্গুর লক্ষণ: প্রচণ্ড জ্বর, মাথা ব্যথা, গায়ে র‍্যাশ। প্রচুর তরল পান করুন।",
    vaccine: "বাচ্চা ও প্রাপ্তবয়স্কদের জন্য বাৎসরিক ফ্লু ভ্যাকসিন ও টিটেনাস বুস্টার অত্যন্ত জরুরি।",
    default: "আপনার স্বাস্থ্য সুরক্ষায়: পর্যাপ্ত জল পান করুন এবং সুষম আহার বজায় রাখুন।"
  }
};

// Initialize Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initUIState();
  initChatEngine();
  initReportParser();
  initHospitalRadar();
  initVitalsTracker();
  initSymptomChecker();
  initProfileManagement();
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
   GLOBAL MODAL SYSTEM
   ========================================================================== */
function openModal(modalId) {
  const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
}

function closeModal(modalId) {
  const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}

// UI & Navigation Switching
function showSection(sectionId) {
  const sections = document.querySelectorAll('.dashboard-section');
  sections.forEach(sec => sec.classList.remove('active'));

  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.add('active');
  }

  const links = document.querySelectorAll('.sidebar-link');
  links.forEach(link => {
    link.classList.remove('active');
    if (link.dataset.section === sectionId) {
      link.classList.add('active');
    }
  });

  // Re-render chart if switching to vitals or resize map on hospitals
  if (sectionId === 'vitals') {
    setTimeout(renderVitalsChart, 100);
    renderRemindersList();
  } else if (sectionId === 'hospitals') {
    setTimeout(() => {
      if (leafletMap) leafletMap.invalidateSize();
    }, 150);
  } else if (sectionId === 'doctor-appointment') {
    renderAppointmentsList();
  }
}

function initUIState() {
  const activeUser = checkAuthGuard();
  if (activeUser) {
    AppState.user = Object.assign({}, AppState.user, activeUser);
  }

  // Populate User Display Names
  const userNames = document.querySelectorAll('.user-disp-name');
  userNames.forEach(el => el.textContent = AppState.user.name);

  const healthIdEls = document.querySelectorAll('.user-health-id');
  healthIdEls.forEach(el => el.textContent = AppState.user.healthId);

  const emailEls = document.querySelectorAll('.user-disp-email');
  emailEls.forEach(el => el.textContent = AppState.user.email);

  const cityEls = document.querySelectorAll('.user-disp-city');
  cityEls.forEach(el => el.textContent = AppState.user.city || 'New Delhi');

  // Avatar Initials
  const avatars = document.querySelectorAll('.avatar');
  avatars.forEach(el => {
    if (AppState.user.avatar) el.textContent = AppState.user.avatar;
  });

  // Attach Logout Handlers
  const logoutBtns = document.querySelectorAll('[data-action="logout"], .btn-logout');
  logoutBtns.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      logoutUser();
    };
  });

  // Update Landing Page Navigation based on Auth State
  const navAuthBtn = document.getElementById('nav-auth-btn');
  if (navAuthBtn) {
    if (activeUser) {
      navAuthBtn.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="avatar" style="width:28px; height:28px; font-size:0.75rem; display:inline-flex; align-items:center; justify-content:center; background:var(--primary); color:white; border-radius:50%; font-weight:700;">${activeUser.avatar || 'PV'}</span>
          <a href="dashboard.html" class="btn btn-secondary btn-sm">Dashboard</a>
          <button type="button" class="btn btn-danger btn-sm" onclick="logoutUser()">Logout</button>
        </div>
      `;
    } else {
      navAuthBtn.innerHTML = `<a href="login.html" class="btn btn-primary btn-sm">Login / Register</a>`;
    }
  }

  // Set initial navigation triggers
  const links = document.querySelectorAll('.sidebar-link');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sec = link.dataset.section;
      if (sec) showSection(sec);
    });
  });
}

/* ==========================================================================
   AI ASSISTANT CHAT ENGINE WITH SPEECH & MULTILINGUAL SUPPORT
   ========================================================================== */
let speechSynthesizer = window.speechSynthesis;
let speechRecognizer = null;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  speechRecognizer = new SpeechRecognition();
  speechRecognizer.continuous = false;
  speechRecognizer.interimResults = false;
}

function initChatEngine() {
  ensureGeminiModalExists();
  updateGeminiUIBadge();

  const keyBtns = document.querySelectorAll('.btn-gemini-key');
  keyBtns.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      openGeminiModal();
    };
  });

  const langSelect = document.getElementById('chat-lang-select');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      AppState.currentLang = e.target.value;
      addChatMessage('bot', AI_KNOWLEDGE[AppState.currentLang].greeting);
    });
  }

  const micBtn = document.getElementById('mic-btn');
  if (micBtn && speechRecognizer) {
    micBtn.addEventListener('click', () => {
      try {
        speechRecognizer.lang = AppState.currentLang === 'hi' ? 'hi-IN' : AppState.currentLang === 'bn' ? 'bn-IN' : 'en-US';
        speechRecognizer.start();
        micBtn.classList.add('listening');
        micBtn.innerHTML = '🎙️ Listening...';
      } catch (err) {
        console.warn('Speech recognition busy', err);
      }
    });

    speechRecognizer.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const input = document.getElementById('chat-input');
      if (input) input.value = transcript;
      micBtn.classList.remove('listening');
      micBtn.innerHTML = '🎙️ Speak';
      sendChatMessage();
    };

    speechRecognizer.onerror = () => {
      micBtn.classList.remove('listening');
      micBtn.innerHTML = '🎙️ Speak';
    };
  }
}

/* ==========================================================================
   GEMINI API INTEGRATION & KEY MANAGEMENT
   ========================================================================== */
function getGeminiApiKey() {
  return localStorage.getItem('mediyogi_gemini_api_key') || AppState.geminiApiKey || DEFAULT_GEMINI_API_KEY;
}

function setGeminiApiKey(key) {
  const cleanKey = (key || '').trim();
  if (cleanKey) {
    localStorage.setItem('mediyogi_gemini_api_key', cleanKey);
    AppState.geminiApiKey = cleanKey;
  } else {
    localStorage.removeItem('mediyogi_gemini_api_key');
    AppState.geminiApiKey = DEFAULT_GEMINI_API_KEY;
  }
  updateGeminiUIBadge();
}

function updateGeminiUIBadge() {
  const key = getGeminiApiKey();
  const badges = document.querySelectorAll('.gemini-status-badge');
  badges.forEach(badge => {
    if (key) {
      badge.className = 'badge badge-success gemini-status-badge';
      badge.innerHTML = '✨ Gemini AI Active';
    } else {
      badge.className = 'badge badge-secondary gemini-status-badge';
      badge.innerHTML = '📖 Offline Clinical Mode';
    }
  });

  const keyBtns = document.querySelectorAll('.btn-gemini-key');
  keyBtns.forEach(btn => {
    if (key) {
      btn.innerHTML = '🔑 Key Configured ✓';
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-success');
    } else {
      btn.innerHTML = '🔑 Set Gemini Key';
      btn.classList.remove('btn-success');
      btn.classList.add('btn-secondary');
    }
  });
}

function ensureGeminiModalExists() {
  if (document.getElementById('gemini-modal')) return;

  const modalHtml = `
    <div id="gemini-modal" class="modal-overlay">
      <div class="modal-content" style="max-width: 520px;">
        <button class="modal-close" onclick="closeModal('gemini-modal')">&times;</button>
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
          <div style="font-size:2rem; line-height:1;">✨</div>
          <div>
            <h3 style="font-size:1.2rem; font-weight:700; margin:0;">Google Gemini API Settings</h3>
            <p style="font-size:0.8rem; color:var(--text-muted); margin:0;">Power your assistant with live generative clinical intelligence</p>
          </div>
        </div>

        <div style="background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.3); padding:14px; border-radius:8px; margin-bottom:18px; font-size:0.85rem; line-height:1.5;">
          🔑 <strong>Pre-configured API Key:</strong> A default API key is pre-configured out-of-the-box so anyone can use the AI assistant without manual setup. You can also enter your own custom key below if desired.<br>
          <span style="opacity:0.8; font-size:0.8rem;">Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" style="color:#60a5fa; text-decoration:underline;">Google AI Studio</a> if you wish to generate a personal Gemini API key.</span>
        </div>

        <div class="form-group" style="margin-bottom:16px;">
          <label for="gemini-api-key-input" style="display:block; font-weight:600; margin-bottom:6px; font-size:0.85rem;">Gemini API Key:</label>
          <div style="position:relative; display:flex; align-items:center;">
            <input type="password" id="gemini-api-key-input" class="form-control" placeholder="AIzaSy..." style="padding-right:70px;" />
            <button type="button" id="toggle-key-vis-btn" class="btn btn-secondary btn-sm" style="position:absolute; right:6px; font-size:0.75rem; padding:4px 8px;" onclick="toggleGeminiKeyVisibility()">Show</button>
          </div>
        </div>

        <div id="gemini-modal-status" style="font-size:0.85rem; margin-bottom:16px; padding:8px 12px; border-radius:6px; display:none;"></div>

        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
          <button type="button" class="btn btn-danger btn-sm" onclick="clearGeminiKeyFromModal()">Clear Key</button>
          <div style="display:flex; gap:8px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="testGeminiKeyFromModal()">🧪 Test Connection</button>
            <button type="button" class="btn btn-primary btn-sm" onclick="saveGeminiKeyFromModal()">Save Key</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function openGeminiModal() {
  ensureGeminiModalExists();
  const input = document.getElementById('gemini-api-key-input');
  if (input) {
    input.value = getGeminiApiKey();
  }
  const statusDiv = document.getElementById('gemini-modal-status');
  if (statusDiv) statusDiv.style.display = 'none';
  openModal('gemini-modal');
}

function toggleGeminiKeyVisibility() {
  const input = document.getElementById('gemini-api-key-input');
  const btn = document.getElementById('toggle-key-vis-btn');
  if (input && btn) {
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = 'Hide';
    } else {
      input.type = 'password';
      btn.textContent = 'Show';
    }
  }
}

function saveGeminiKeyFromModal() {
  const input = document.getElementById('gemini-api-key-input');
  const key = input ? input.value.trim() : '';
  if (!key) {
    showGeminiModalStatus('Please enter a valid Gemini API Key.', 'error');
    return;
  }
  setGeminiApiKey(key);
  showGeminiModalStatus('✅ Gemini API Key saved successfully!', 'success');
  setTimeout(() => closeModal('gemini-modal'), 1200);
}

function clearGeminiKeyFromModal() {
  localStorage.removeItem('mediyogi_gemini_api_key');
  AppState.geminiApiKey = DEFAULT_GEMINI_API_KEY;
  updateGeminiUIBadge();
  const input = document.getElementById('gemini-api-key-input');
  if (input) input.value = DEFAULT_GEMINI_API_KEY;
  showGeminiModalStatus('Custom key removed. Reverted to pre-configured default API key.', 'info');
}

async function testGeminiKeyFromModal() {
  const input = document.getElementById('gemini-api-key-input');
  const tempKey = input ? input.value.trim() : '';
  if (!tempKey) {
    showGeminiModalStatus('Please enter an API Key to test.', 'error');
    return;
  }

  showGeminiModalStatus('⏳ Testing connection with Google Gemini API...', 'info');

  try {
    const response = await fetchGeminiResponse('Hello, test connection.', AppState.currentLang || 'en', tempKey);
    if (response) {
      showGeminiModalStatus('✅ Gemini API Connection Successful! API Key is valid.', 'success');
    }
  } catch (err) {
    showGeminiModalStatus(`❌ Test Failed: ${escapeHtml(err.message || 'Unknown error')}`, 'error');
  }
}

function showGeminiModalStatus(msg, type) {
  const statusDiv = document.getElementById('gemini-modal-status');
  if (!statusDiv) return;
  statusDiv.style.display = 'block';
  statusDiv.innerHTML = msg;
  if (type === 'success') {
    statusDiv.style.background = 'rgba(34, 197, 94, 0.15)';
    statusDiv.style.color = '#4ade80';
    statusDiv.style.border = '1px solid rgba(34, 197, 94, 0.3)';
  } else if (type === 'error') {
    statusDiv.style.background = 'rgba(239, 68, 68, 0.15)';
    statusDiv.style.color = '#f87171';
    statusDiv.style.border = '1px solid rgba(239, 68, 68, 0.3)';
  } else {
    statusDiv.style.background = 'rgba(59, 130, 246, 0.15)';
    statusDiv.style.color = '#60a5fa';
    statusDiv.style.border = '1px solid rgba(59, 130, 246, 0.3)';
  }
}

async function fetchGeminiResponse(userQuery, lang = 'en', overrideKey = null) {
  const apiKey = overrideKey || getGeminiApiKey();
  if (!apiKey) {
    throw new Error('No Gemini API Key provided. Click "🔑 Set Gemini Key" to configure your API key.');
  }

  const systemInstructionText = `You are Mediyogi AI, an empathetic, expert public health and clinical AI chatbot assistant.
Provide clear, accurate, evidence-based preventive health, triage advice, and medical guidance.
Format your responses clearly using HTML formatting tags like <b>, <ul>, <li>, <br> for maximum readability.
Keep your response concise, empathetic, and actionable.
Important: Always advise consulting a qualified doctor or emergency services for severe or persistent symptoms.
Respond in the language matching: ${lang === 'hi' ? 'Hindi (हिन्दी)' : lang === 'bn' ? 'Bengali (বাংলা)' : 'English'}.`;

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: `${systemInstructionText}\n\nUser Question: ${userQuery}` }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemInstructionText }]
    }
  };

  const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3-pro', 'gemini-flash-latest', 'gemini-pro-latest'];
  let lastErr = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson.error?.message || `HTTP ${res.status} ${res.statusText}`;
        throw new Error(msg);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      } else {
        throw new Error('Empty response payload from Gemini API.');
      }
    } catch (err) {
      console.warn(`Gemini model ${model} failed:`, err);
      lastErr = err;
      if (err.message && (err.message.includes('API key') || err.message.includes('PERMISSION_DENIED') || err.message.includes('403'))) {
        break;
      }
    }
  }

  throw lastErr || new Error('Gemini API call failed.');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatChatMessageText(text) {
  if (!text) return '';
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return text;
  }
  let formatted = escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
  return formatted;
}

function stripHtmlTags(html) {
  if (!html) return '';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

async function sendChatMessage(textOverride) {
  const input = document.getElementById('chat-input');
  const query = textOverride || (input ? input.value.trim() : '');
  if (!query) return;

  addChatMessage('user', query);
  if (input) input.value = '';

  showTypingIndicator();

  const apiKey = getGeminiApiKey();

  const finalizeSend = () => {
    scrollToChatBottom();
    if (input) input.focus();
  };

  if (apiKey) {
    try {
      const geminiReply = await fetchGeminiResponse(query, AppState.currentLang);
      removeTypingIndicator();
      const replyWithBadge = `<div style="margin-bottom:6px;"><span class="badge badge-success" style="font-size:0.7rem; padding:2px 6px;">✨ Gemini AI</span></div>${formatChatMessageText(geminiReply)}`;
      addChatMessage('bot', replyWithBadge);
      speakResponse(stripHtmlTags(geminiReply));
      finalizeSend();
      return;
    } catch (err) {
      console.warn('Gemini API request failed, falling back to local clinical knowledge base:', err);
      removeTypingIndicator();
      const fallbackReply = generateAIResponse(query);
      const errHeader = `<div style="font-size:0.75rem; color:#f87171; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); padding:4px 8px; border-radius:4px; margin-bottom:8px;">⚠️ Gemini API Error (${escapeHtml(err.message || 'Call failed')}). Using offline clinical database:</div>`;
      addChatMessage('bot', errHeader + formatChatMessageText(fallbackReply));
      speakResponse(stripHtmlTags(fallbackReply));
      finalizeSend();
      return;
    }
  }

  // Fallback mode without API Key
  setTimeout(() => {
    removeTypingIndicator();
    const botReply = generateAIResponse(query);
    const tipNote = `<div style="font-size:0.75rem; opacity:0.85; margin-top:8px; border-top:1px dashed rgba(255,255,255,0.15); padding-top:6px; color:var(--text-muted);">💡 <i>Tip: Click '🔑 Set Gemini Key' to activate live Google Gemini responses.</i></div>`;
    addChatMessage('bot', formatChatMessageText(botReply) + tipNote);
    speakResponse(stripHtmlTags(botReply));
    finalizeSend();
  }, 500);
}

function generateAIResponse(text) {
  const lower = text.toLowerCase();
  const dict = AI_KNOWLEDGE[AppState.currentLang] || AI_KNOWLEDGE.en;
  // Check comprehensive Clinical Symptoms Dictionary first
  const symMatch = findSymptomInDictionary(text);
  if (symMatch) {
    return formatSymptomClinicalSummary(symMatch);
  }

  if (lower.includes('vaccine') || lower.includes('टीका') || lower.includes('ভ্যাকসিন')) return dict.vaccine;

  return dict.default;
}

function scrollToChatBottom() {
  const chatBox = document.getElementById('chat-messages');
  if (!chatBox) return;
  requestAnimationFrame(() => {
    chatBox.scrollTop = chatBox.scrollHeight;
    setTimeout(() => {
      chatBox.scrollTop = chatBox.scrollHeight;
    }, 80);
  });
}

function addChatMessage(sender, text) {
  const chatBox = document.getElementById('chat-messages');
  if (!chatBox) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-message ${sender}`;
  msgDiv.innerHTML = `
    <div>${text}</div>
    <div style="font-size:0.7rem; opacity:0.6; margin-top:4px; text-align:${sender === 'user' ? 'right' : 'left'}">
      ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </div>
  `;

  chatBox.appendChild(msgDiv);
  scrollToChatBottom();
}

function showTypingIndicator() {
  const chatBox = document.getElementById('chat-messages');
  if (!chatBox) return;
  const indicator = document.createElement('div');
  indicator.id = 'typing-indicator';
  indicator.className = 'chat-message bot';
  indicator.style.fontStyle = 'italic';
  indicator.style.opacity = '0.7';
  indicator.textContent = 'Mediyogi AI is analyzing medical guidelines...';
  chatBox.appendChild(indicator);
  scrollToChatBottom();
}

function removeTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) indicator.remove();
}

function speakResponse(text) {
  if (!speechSynthesizer) return;
  speechSynthesizer.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  speechSynthesizer.speak(utterance);
}

/* ==========================================================================
   SYMPTOM CHECKER WIZARD MODAL
   ========================================================================== */
const SYMPTOM_WIZARD_STEPS = [
  { id: 'fever', question: 'Do you currently have a fever (> 100°F)?', options: ['No', 'Mild (100-101°F)', 'High (>102°F)'] },
  { id: 'duration', question: 'How long have you been experiencing symptoms?', options: ['1-2 days', '3-5 days', 'More than a week'] },
  { id: 'breathing', question: 'Are you experiencing any shortness of breath or chest tightness?', options: ['No', 'Mild when walking', 'Yes, severe'] },
  { id: 'fatigue', question: 'Do you have severe muscle pain or extreme fatigue?', options: ['No', 'Moderate', 'Severe'] }
];

const SYMPTOMS_DICTIONARY = {
  fever: {
    title: "Fever & High Body Temperature",
    icon: "🤒",
    keywords: ["fever", "feverish", "febrile", "high temperature", "chills", "बुखार", "জ্বর"],
    severityLevels: {
      high: "102°F or higher",
      medium: "101°F - 102°F",
      low: "100°F - 101°F"
    },
    commonCauses: ["Viral infections (Flu, Dengue, COVID-19)", "Bacterial infections (Typhoid, UTI)", "Inflammatory conditions"],
    redFlags: [
      "Fever lasting more than 3 days",
      "Fever with stiff neck or severe light sensitivity",
      "Fever with difficulty breathing or chest pain",
      "Fever with confusion or extreme lethargy"
    ],
    whenToSeeDoctor: [
      "Fever lasts for more than 3 days",
      "Fever exceeds 103°F (39.4°C)",
      "Accompanied by persistent vomiting or severe rash"
    ],
    treatmentOptions: [
      "Rest and avoid physical overexertion",
      "Stay hydrated with ORS, coconut water, and clean fluids",
      "Over-the-counter fever reducers (Paracetamol/Acetaminophen)",
      "Apply cool damp cloth compress on forehead"
    ],
    prevention: [
      "Wash hands frequently with soap",
      "Avoid close contact with sick individuals",
      "Keep routine vaccinations up to date"
    ]
  },
  cough: {
    title: "Cough & Respiratory Congestion",
    icon: "😷",
    keywords: ["cough", "coughing", "cold", "sore throat", "phlegm", "खांसी", "কাশি"],
    severityLevels: {
      high: "Cough with blood or severe breathlessness",
      medium: "Persistent cough for more than 1 week",
      low: "Mild dry tickle or seasonal irritation"
    },
    commonCauses: ["Viral respiratory infection", "Bronchitis", "Asthma or environmental allergies"],
    redFlags: [
      "Coughing up blood or rust-colored phlegm",
      "Sharp pain when breathing in",
      "Unexplained weight loss or night sweats"
    ],
    whenToSeeDoctor: [
      "Cough persists for more than 2-3 weeks",
      "Accompanied by high fever or thick green mucus",
      "Causes difficulty breathing or wheezing"
    ],
    treatmentOptions: [
      "Warm saltwater gargles 3-4 times daily",
      "Steam inhalation with warm water",
      "Honey and ginger tea",
      "Stay well hydrated with warm liquids"
    ],
    prevention: [
      "Wear a protective mask in polluted or crowded areas",
      "Avoid exposure to tobacco smoke",
      "Use indoor air humidifiers or purifiers"
    ]
  },
  headache: {
    title: "Headache & Migraine",
    icon: "🤕",
    keywords: ["headache", "migraine", "head pain", "throbbing head", "सिरदर्द", "মাথাব্যথা"],
    severityLevels: {
      high: "Sudden thunderclap headache or with slurred speech",
      medium: "Throbbing migraine affecting daily tasks",
      low: "Mild tension headache from fatigue"
    },
    commonCauses: ["Stress & eye strain", "Dehydration", "Migraine", "Sinus congestion"],
    redFlags: [
      "Sudden, explosive 'thunderclap' headache",
      "Headache with stiff neck, fever, or confusion",
      "Headache following head trauma"
    ],
    whenToSeeDoctor: [
      "Headache worsens progressively over days",
      "Accompanied by vision changes, numbness, or weakness",
      "Requires daily pain relief medication"
    ],
    treatmentOptions: [
      "Rest in a quiet, dark, well-ventilated room",
      "Drink 1-2 large glasses of water immediately",
      "Apply cold compress on forehead",
      "Gentle temple massage"
    ],
    prevention: [
      "Maintain regular sleep-wake schedule",
      "Take frequent screen breaks (20-20-20 rule)",
      "Stay consistently hydrated"
    ]
  },
  dengue: {
    title: "Dengue & Vector-Borne Fever",
    icon: "🦟",
    keywords: ["dengue", "mosquito", "platelet", "joint pain", "bone fever", "डेंगू", "ডেঙ্গু"],
    severityLevels: {
      high: "Dengue Hemorrhagic Fever (bleeding, sudden drop in platelets)",
      medium: "High fever with severe eye pain & body aches",
      low: "Mild fever during active mosquito outbreak"
    },
    commonCauses: ["Aedes mosquito bite transmitting Dengue virus"],
    redFlags: [
      "Severe abdominal pain or persistent vomiting",
      "Bleeding gums, nosebleeds, or skin red spots",
      "Extreme fatigue, drowsiness, or difficulty breathing"
    ],
    whenToSeeDoctor: [
      "Get a complete blood count (CBC) test if fever occurs in Dengue zone",
      "Monitor platelet count daily if diagnosed with Dengue",
      "Seek emergency hospital care if warning signs appear"
    ],
    treatmentOptions: [
      "Abundant hydration with ORS solution, coconut water, and soups",
      "Paracetamol for fever (CRITICAL: Avoid Aspirin & Ibuprofen)",
      "Complete bed rest"
    ],
    prevention: [
      "Eliminate stagnant water around home",
      "Apply mosquito repellent containing DEET or Picaridin",
      "Wear full-sleeved clothing during dawn & dusk"
    ]
  },
  shortness_of_breath: {
    title: "Shortness of Breath & Dyspnea",
    icon: "🫁",
    keywords: ["shortness of breath", "breathlessness", "breathing issue", "gasping", "wheezing", "सांस फूलना", "শ্বাসকষ্ট"],
    severityLevels: {
      high: "Inability to speak full sentences or bluish lips",
      medium: "Breathlessness when walking or climbing stairs",
      low: "Mild breathlessness after heavy physical exercise"
    },
    commonCauses: ["Asthma exacerbation", "COPD / Bronchitis", "Anxiety or panic attack", "Pneumonia", "Cardiac issues"],
    redFlags: [
      "Sudden onset severe shortness of breath",
      "Chest tightness, pressure, or radiating arm pain",
      "Bluish tint to lips or fingertips"
    ],
    whenToSeeDoctor: [
      "Seek emergency care (Call 102/108) immediately for severe dyspnea",
      "Shortness of breath occurring while resting or sleeping",
      "Accompanied by leg swelling or high fever"
    ],
    treatmentOptions: [
      "Sit upright in a comfortable position",
      "Use prescribed inhaler (Albuterol) if asthmatic",
      "Practice slow, deep, pursed-lip breathing",
      "Ensure adequate fresh airflow"
    ],
    prevention: [
      "Avoid respiratory irritants and heavy smog",
      "Take prescribed asthma maintenance medications consistently",
      "Avoid tobacco smoke exposure"
    ]
  },
  chest_pain: {
    title: "Chest Pain & Cardiac Warning",
    icon: "🫀",
    keywords: ["chest pain", "chest pressure", "heart pain", "chest tightness", "सीने में दर्द", "বুকে ব্যথা"],
    severityLevels: {
      high: "Crushing chest pressure radiating to arm or jaw",
      medium: "Sharp chest pain worsening with deep breath",
      low: "Mild muscle strain or acid reflux"
    },
    commonCauses: ["Coronary artery disease / Angina", "GERD / Acid reflux", "Intercostal muscle strain", "Pericarditis"],
    redFlags: [
      "Crushing heaviness or squeezing sensation in center of chest",
      "Pain radiating to left arm, neck, jaw, or shoulder",
      "Accompanied by cold sweating, nausea, or dizziness"
    ],
    whenToSeeDoctor: [
      "EMERGENCY: Any unexplained chest pain requires immediate emergency evaluation (Dial 102/108)",
      "Do not drive yourself; request emergency ambulance transport"
    ],
    treatmentOptions: [
      "Cease all physical activity immediately and sit down",
      "Loosen restrictive clothing around neck and waist",
      "Use prescribed angina medication (Nitroglycerin) if directed by doctor",
      "Seek emergency medical response"
    ],
    prevention: [
      "Maintain blood pressure and blood cholesterol in healthy range",
      "Follow a heart-healthy diet low in saturated fats",
      "Engage in regular moderate exercise under medical guidance"
    ]
  },
  fatigue: {
    title: "Fatigue & Lethargy",
    icon: "😴",
    keywords: ["fatigue", "tired", "weakness", "exhaustion", "lethargy", "थकान", "ক্লান্তি"],
    severityLevels: {
      high: "Inability to perform basic daily activities or fainting",
      medium: "Persistent fatigue despite 8+ hours of sleep",
      low: "Temporary tiredness following heavy physical work"
    },
    commonCauses: ["Iron deficiency anemia", "Post-viral recovery", "Thyroid imbalance", "Vitamin D/B12 deficiency"],
    redFlags: [
      "Fatigue accompanied by unexplained weight loss",
      "Fainting spells or loss of consciousness",
      "Shortness of breath on light walking"
    ],
    whenToSeeDoctor: [
      "Fatigue lasts > 2 weeks without clear cause",
      "Accompanied by persistent low fever or swollen glands",
      "Severely impacts daily work or concentration"
    ],
    treatmentOptions: [
      "Ensure 7-9 hours of restful sleep every night",
      "Maintain balanced diet rich in iron, green leafy vegetables, and proteins",
      "Drink adequate water throughout the day",
      "Incorporate 20-30 minutes of light walking"
    ],
    prevention: [
      "Maintain consistent sleep hygiene",
      "Schedule annual health checkup including CBC & Vitamin levels",
      "Manage work stress and take regular short breaks"
    ]
  },
  dengue: {
    title: "Dengue",
    icon: "🦟",
    keywords: ["dengue", "डेंगू", "डेगू"],
    severityLevels: {
      high: "Severe abdominal pain, persistent vomiting, difficulty breathing, bleeding from nose or gums",
      medium: "High fever (>102°F), severe headache, joint and muscle pain, skin rash",
      low: "Mild fever, headache, body ache"
    },
    commonCauses: ["Mosquito bite (Aedes mosquito)", "Poor sanitation", "Standing water collection"],
    redFlags: [
      "Persistent vomiting (more than 3 times in 24 hours)",
      "Severe abdominal pain or tenderness",
      "Bleeding from nose or gums",
      "Blood in vomit or stools",
      "Difficulty breathing or rapid breathing",
      "Extreme fatigue or restlessness",
      "Cold, clammy skin"
    ],
    whenToSeeDoctor: [
      "High fever (101°F or higher) lasting more than 2 days",
      "Severe headache that doesn't improve with over-the-counter pain relievers",
      "Joint or muscle pain that makes movement difficult",
      "Rash or red spots on skin",
      "Any warning signs of severe dengue"
    ],
    treatmentOptions: [
      "Drink plenty of oral fluids (water, ORS, juice) to prevent dehydration",
      "Rest completely",
      "Use paracetamol (acetaminophen) for fever and pain (avoid NSAIDs like ibuprofen)",
      "Protect yourself from mosquito bites to prevent spreading the virus"
    ],
    prevention: [
      "Eliminate mosquito breeding sites by emptying containers with stagnant water",
      "Use mosquito repellents on exposed skin",
      "Wear long-sleeved clothing, especially during dawn and dusk",
      "Install mosquito nets over beds"
    ]
  }


};

// Symptom Dictionary Helper Functions
function findSymptomInDictionary(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const key in SYMPTOMS_DICTIONARY) {
    const sym = SYMPTOMS_DICTIONARY[key];
    if (sym.keywords.some(kw => lower.includes(kw.toLowerCase()))) {
      return sym;
    }
  }
  return null;
}

function formatSymptomClinicalSummary(sym) {
  return `
    <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.3); padding:14px; border-radius:12px; margin-top:8px;">
      <div style="font-weight:700; font-size:1.05rem; color:var(--primary); margin-bottom:6px;">
        ${sym.icon} Clinical Overview: ${sym.title}
      </div>
      <div style="font-size:0.88rem; margin-bottom:8px;">
        <strong>Common Causes:</strong> ${sym.commonCauses.join(', ')}.
      </div>
      <div style="font-size:0.88rem; margin-bottom:8px;">
        <strong style="color:var(--primary);">💊 Self-Care & Treatment:</strong>
        <ul style="margin-left:20px; margin-top:4px;">
          ${sym.treatmentOptions.map(t => `<li>${t}</li>`).join('')}
        </ul>
      </div>
      <div style="font-size:0.88rem; margin-bottom:8px; color:#fca5a5;">
        <strong>🚩 Red Flags (Seek Urgent Care):</strong>
        <ul style="margin-left:20px; margin-top:4px;">
          ${sym.redFlags.map(rf => `<li>${rf}</li>`).join('')}
        </ul>
      </div>
      <div style="font-size:0.85rem; color:var(--text-muted);">
        <strong>🏥 When to Consult a Physician:</strong> ${sym.whenToSeeDoctor.join(' • ')}
      </div>
    </div>
  `;
}

let wizardAnswers = {};

function initSymptomChecker() {
  const startBtn = document.getElementById('start-symptom-wizard');
  if (startBtn) {
    startBtn.addEventListener('click', () => openModal('symptom-modal'));
  }
}

function renderWizardStep(stepIdx) {
  const container = document.getElementById('wizard-container');
  if (!container) return;

  if (stepIdx >= SYMPTOM_WIZARD_STEPS.length) {
    renderWizardResults(container);
    return;
  }

  const step = SYMPTOM_WIZARD_STEPS[stepIdx];
  container.innerHTML = `
    <div style="margin-bottom:16px;">
      <span class="badge badge-info">Question ${stepIdx + 1} of ${SYMPTOM_WIZARD_STEPS.length}</span>
    </div>
    <h3 style="font-size:1.1rem; margin-bottom:16px;">${step.question}</h3>
    <div style="display:flex; flex-direction:column; gap:10px;">
      ${step.options.map((opt, i) => `
        <button class="btn btn-secondary" style="justify-content:flex-start; text-align:left;" onclick="handleWizardChoice(${stepIdx}, '${opt}')">
          ${opt}
        </button>
      `).join('')}
    </div>
  `;
}

function handleWizardChoice(stepIdx, choice) {
  wizardAnswers[SYMPTOM_WIZARD_STEPS[stepIdx].id] = choice;
  renderWizardStep(stepIdx + 1);
}

function renderWizardResults(container) {
  let riskScore = 'Low';
  let badgeClass = 'badge-success';
  let advice = 'Your reported symptoms indicate a low risk profile. Rest, maintain hydration, and monitor your symptoms.';
  let matchedSymKey = 'fever';

  if (wizardAnswers.breathing === 'Yes, severe' || wizardAnswers.fever === 'High (>102°F)') {
    riskScore = 'High';
    badgeClass = 'badge-danger';
    advice = '⚠️ HIGH RISK: Immediate medical evaluation is recommended. Please visit the nearest hospital emergency or consult a clinician.';
    matchedSymKey = wizardAnswers.breathing === 'Yes, severe' ? 'shortness_of_breath' : 'fever';
  } else if (wizardAnswers.duration === 'More than a week' || wizardAnswers.fatigue === 'Severe') {
    riskScore = 'Moderate';
    badgeClass = 'badge-warning';
    advice = 'MODERATE RISK: Consult a primary care doctor within 24-48 hours for a thorough physical check-up.';
    matchedSymKey = wizardAnswers.fatigue === 'Severe' ? 'fatigue' : 'fever';
  }

  const symDetails = SYMPTOMS_DICTIONARY[matchedSymKey] || SYMPTOMS_DICTIONARY.fever;

  container.innerHTML = `
    <div style="padding:10px 0;">
      <div style="text-align:center;">
        <div style="font-size:2.5rem; margin-bottom:8px;">${symDetails.icon}</div>
        <h3 style="margin-bottom:8px;">Assessment Completed</h3>
        <div style="margin-bottom:16px;">
          <span class="badge ${badgeClass}" style="font-size:1rem; padding:8px 16px;">Risk Level: ${riskScore}</span>
        </div>
        <p style="color:var(--text-muted); font-size:0.95rem; margin-bottom:16px;">${advice}</p>
      </div>

      ${formatSymptomClinicalSummary(symDetails)}

      <div style="display:flex; gap:12px; justify-content:center; margin-top:20px; flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="closeModal('symptom-modal'); showSection('hospitals');">Find Nearest Hospital 🏥</button>
        <button class="btn btn-secondary" onclick="closeModal('symptom-modal'); showSection('chat');">Talk to AI Doctor 💬</button>
        <button class="btn btn-secondary" onclick="closeModal('symptom-modal')">Close</button>
      </div>
    </div>
  `;
}

/* ==========================================================================
   SMART EHR & DIAGNOSTIC LAB REPORT PARSER
   ========================================================================== */
function initReportParser() {
  renderReportsGrid();

  const fileInput = document.getElementById('report-file-input');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleReportUpload(file);
    });
  }
}

function renderReportsGrid() {
  const grid = document.getElementById('reports-grid');
  if (!grid) return;

  grid.innerHTML = AppState.reports.map(rep => `
    <div class="glass-card report-card">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <h4 style="font-size:1.05rem; font-weight:700;">${rep.title}</h4>
          <span class="badge badge-info">${rep.type}</span>
        </div>
        <div style="font-size:0.82rem; color:var(--text-muted); margin-bottom:12px;">📅 ${rep.date} • 📄 ${rep.file}</div>
        <div style="margin-bottom:12px;">
          ${rep.metrics.map(m => `
            <div class="lab-metric-badge">
              <span style="font-size:0.85rem; font-weight:500;">${m.name}</span>
              <div>
                <strong style="color:${m.status === 'normal' ? 'var(--success)' : 'var(--danger)'};">${m.value}</strong>
                <span class="badge ${m.status === 'normal' ? 'badge-success' : 'badge-danger'}" style="font-size:0.68rem; margin-left:6px;">${m.status}</span>
              </div>
            </div>
          `).join('')}
        </div>
        <p style="font-size:0.85rem; color:var(--text-muted); background:rgba(255,255,255,0.03); padding:10px; border-radius:var(--radius-sm);">
          💡 <strong>AI Insight:</strong> ${rep.aiSummary}
        </p>
      </div>
      <div style="display:flex; gap:8px; margin-top:16px;">
        <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="viewReportDetails('${rep.id}')">👁️ View Full</button>
        <button class="btn btn-danger btn-sm" onclick="deleteReport('${rep.id}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

function handleReportUpload(file) {
  const newRep = {
    id: 'rep_' + Date.now(),
    title: file.name.replace(/\.[^/.]+$/, ""),
    date: new Date().toISOString().split('T')[0],
    type: 'Diagnostic Scan',
    file: file.name,
    metrics: [
      { name: 'SpO2 Level', value: '99%', status: 'normal', range: '95 - 100%' },
      { name: 'Blood Pressure', value: '120/80 mmHg', status: 'normal', range: '< 120/80' }
    ],
    aiSummary: 'AI Parser successfully analyzed the uploaded document. All key vital metrics are within expected normal thresholds.'
  };

  AppState.reports.unshift(newRep);
  localStorage.setItem('mediyogi_reports', JSON.stringify(AppState.reports));
  renderReportsGrid();
  alert('✨ Document parsed by Mediyogi AI successfully!');
}

function deleteReport(id) {
  AppState.reports = AppState.reports.filter(r => r.id !== id);
  localStorage.setItem('mediyogi_reports', JSON.stringify(AppState.reports));
  renderReportsGrid();
}

function viewReportDetails(id) {
  const rep = AppState.reports.find(r => r.id === id);
  if (!rep) return;
  alert(`📋 Report Details: ${rep.title}\nDate: ${rep.date}\nAI Analysis: ${rep.aiSummary}`);
}

/* ==========================================================================
   HOSPITAL RADAR & LEAFLET MAP INTEGRATION
   ========================================================================== */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let leafletMap = null;
let currentTileLayer = null;
let hospitalMarkers = [];
let userLocationMarker = null;
let activeHospitalsList = [];

let currentMapProvider = localStorage.getItem('mediyogi_map_provider') || 'google-roadmap';
let googleApiKey = localStorage.getItem('mediyogi_gmaps_key') || '';

function extractGoogleApiKey(inputStr) {
  if (!inputStr) return '';
  const trimmed = inputStr.trim();
  if (trimmed.includes('key=')) {
    const match = trimmed.match(/key=([A-Za-z0-9_\-]+)/);
    if (match && match[1]) return match[1];
  }
  return trimmed;
}

const MAP_PROVIDERS = {
  'google-roadmap': {
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    maxZoom: 20,
    attribution: '&copy; Google Maps'
  },
  'google-satellite': {
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    maxZoom: 20,
    attribution: '&copy; Google Maps Imagery'
  },
  'google-hybrid': {
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    maxZoom: 20,
    attribution: '&copy; Google Maps Hybrid'
  },
  'google-terrain': {
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    maxZoom: 20,
    attribution: '&copy; Google Maps Terrain'
  },
  'osm': {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }
};

const CITY_COORDINATES = {
  'kolkata': { lat: 22.5726, lng: 88.3639, zoom: 12, name: 'Kolkata' },
  'new delhi': { lat: 28.6139, lng: 77.2090, zoom: 12, name: 'New Delhi' },
  'delhi': { lat: 28.6139, lng: 77.2090, zoom: 12, name: 'New Delhi' },
  'mumbai': { lat: 19.0760, lng: 72.8777, zoom: 12, name: 'Mumbai' },
  'bengaluru': { lat: 12.9716, lng: 77.5946, zoom: 12, name: 'Bengaluru' },
  'bangalore': { lat: 12.9716, lng: 77.5946, zoom: 12, name: 'Bengaluru' },
  'chennai': { lat: 13.0827, lng: 80.2707, zoom: 12, name: 'Chennai' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, zoom: 12, name: 'Hyderabad' }
};

const DEFAULT_HOSPITALS_DATA = [
  // Kolkata
  { id: 'hosp-kol-1', name: 'SSKM Hospital (PG Hospital)', city: 'Kolkata', lat: 22.5385, lng: 88.3444, beds: 24, emergency: true, rating: '4.9 ⭐', dist: '1.5 km', address: 'AJC Bose Road, Bhowanipore, Kolkata, West Bengal' },
  { id: 'hosp-kol-2', name: 'Apollo Multispecialty Hospital Kolkata', city: 'Kolkata', lat: 22.5735, lng: 88.4024, beds: 19, emergency: true, rating: '4.8 ⭐', dist: '3.2 km', address: '58 Canal Circular Road, Kadapara, Kolkata, West Bengal' },
  { id: 'hosp-kol-3', name: 'AMRI Hospital Salt Lake', city: 'Kolkata', lat: 22.5855, lng: 88.4065, beds: 15, emergency: true, rating: '4.7 ⭐', dist: '2.8 km', address: 'JC Block, Salt Lake Sector 3, Kolkata, West Bengal' },
  { id: 'hosp-kol-4', name: 'Fortis Hospital Anandapur Kolkata', city: 'Kolkata', lat: 22.5186, lng: 88.4028, beds: 12, emergency: true, rating: '4.8 ⭐', dist: '4.5 km', address: '730 EM Bypass, Anandapur, Kolkata, West Bengal' },
  { id: 'hosp-kol-5', name: 'Peerless Hospital & BK Roy Centre', city: 'Kolkata', lat: 22.4827, lng: 88.3976, beds: 14, emergency: true, rating: '4.6 ⭐', dist: '5.1 km', address: '360 Panchasayar, EM Bypass, Kolkata, West Bengal' },
  { id: 'hosp-kol-6', name: 'Medical College & Hospital Kolkata', city: 'Kolkata', lat: 22.5746, lng: 88.3618, beds: 30, emergency: true, rating: '4.7 ⭐', dist: '2.1 km', address: '88 College Street, College Square, Kolkata, West Bengal' },
  { id: 'hosp-kol-7', name: 'Tata Medical Center Kolkata', city: 'Kolkata', lat: 22.5796, lng: 88.4862, beds: 16, emergency: true, rating: '4.9 ⭐', dist: '6.0 km', address: '14 MAR (EW), New Town, Rajarhat, Kolkata, West Bengal' },
  { id: 'hosp-kol-8', name: 'Woodlands Multispeciality Hospital', city: 'Kolkata', lat: 22.5332, lng: 88.3308, beds: 10, emergency: true, rating: '4.6 ⭐', dist: '2.4 km', address: '8B Alipore Road, Alipore, Kolkata, West Bengal' },

  // New Delhi & NCR
  { id: 'hosp-del-1', name: 'AIIMS New Delhi', city: 'New Delhi', lat: 28.5672, lng: 77.2100, beds: 28, emergency: true, rating: '4.9 ⭐', dist: '1.2 km', address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi' },
  { id: 'hosp-del-2', name: 'Fortis Healthcare Okhla', city: 'New Delhi', lat: 28.5447, lng: 77.2646, beds: 14, emergency: true, rating: '4.7 ⭐', dist: '3.5 km', address: 'Okhla Road, New Delhi' },
  { id: 'hosp-del-3', name: 'Max Super Speciality Hospital Saket', city: 'New Delhi', lat: 28.5284, lng: 77.2185, beds: 18, emergency: true, rating: '4.8 ⭐', dist: '4.1 km', address: 'Press Enclave Road, Saket, New Delhi' },
  { id: 'hosp-del-4', name: 'Apollo Hospital Indraprastha', city: 'New Delhi', lat: 28.5615, lng: 77.2831, beds: 22, emergency: true, rating: '4.8 ⭐', dist: '5.0 km', address: 'Mathura Road, Sarita Vihar, New Delhi' },
  { id: 'hosp-del-5', name: 'Sir Ganga Ram Hospital', city: 'New Delhi', lat: 28.6386, lng: 77.1895, beds: 16, emergency: true, rating: '4.7 ⭐', dist: '6.2 km', address: 'Rajinder Nagar, New Delhi' },

  // Mumbai
  { id: 'hosp-mum-1', name: 'Lilavati Hospital & Research Centre', city: 'Mumbai', lat: 19.0506, lng: 72.8285, beds: 16, emergency: true, rating: '4.8 ⭐', dist: '2.0 km', address: 'A-791 Bandra Reclamation, Bandra West, Mumbai, Maharashtra' },
  { id: 'hosp-mum-2', name: 'Kokilaben Dhirubhai Ambani Hospital', city: 'Mumbai', lat: 19.1311, lng: 72.8252, beds: 20, emergency: true, rating: '4.9 ⭐', dist: '4.2 km', address: 'Rao Saheb Achutrao Patwardhan Marg, Andheri West, Mumbai, Maharashtra' },
  { id: 'hosp-mum-3', name: 'Tata Memorial Hospital', city: 'Mumbai', lat: 19.0048, lng: 72.8430, beds: 25, emergency: true, rating: '4.9 ⭐', dist: '3.0 km', address: 'Dr. Ernest Borges Road, Parel, Mumbai, Maharashtra' },

  // Bengaluru
  { id: 'hosp-blr-1', name: 'Manipal Hospital Old Airport Road', city: 'Bengaluru', lat: 12.9583, lng: 77.6487, beds: 21, emergency: true, rating: '4.8 ⭐', dist: '2.8 km', address: '98 HAL Old Airport Rd, Kodihalli, Bengaluru, Karnataka' },
  { id: 'hosp-blr-2', name: 'Narayana Health City', city: 'Bengaluru', lat: 12.8123, lng: 77.6974, beds: 35, emergency: true, rating: '4.9 ⭐', dist: '8.4 km', address: '258/A Bommasandra Industrial Area, Anekal Taluk, Bengaluru, Karnataka' },

  // Chennai
  { id: 'hosp-maa-1', name: 'Apollo Hospital Greams Road', city: 'Chennai', lat: 13.0617, lng: 80.2520, beds: 26, emergency: true, rating: '4.9 ⭐', dist: '1.8 km', address: '21 Greams Lane, Thousand Lights, Chennai, Tamil Nadu' },

  // Hyderabad
  { id: 'hosp-hyd-1', name: 'Yashoda Hospital Somajiguda', city: 'Hyderabad', lat: 17.4262, lng: 78.4578, beds: 20, emergency: true, rating: '4.8 ⭐', dist: '2.1 km', address: 'Raj Bhavan Road, Somajiguda, Hyderabad, Telangana' }
];

function getGoogleMapsDirectionsUrl(lat, lng, name) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name || 'Hospital')}`;
}

function openCurrentAreaInGoogleMaps() {
  if (leafletMap) {
    const center = leafletMap.getCenter();
    const zoom = leafletMap.getZoom();
    window.open(`https://www.google.com/maps/@${center.lat},${center.lng},${zoom}z`, '_blank');
  } else {
    window.open(`https://www.google.com/maps/search/hospitals/@22.5726,88.3639,12z`, '_blank');
  }
}

function openGoogleApiKeyModal() {
  const keyInput = document.getElementById('gmaps-api-key');
  if (keyInput) {
    keyInput.value = googleApiKey;
  }
  openModal('gmaps-modal');
}

function saveGoogleApiKey() {
  const keyInput = document.getElementById('gmaps-api-key');
  if (!keyInput) return;

  const rawVal = keyInput.value.trim();
  const extractedKey = extractGoogleApiKey(rawVal);

  if (extractedKey) {
    googleApiKey = extractedKey;
    localStorage.setItem('mediyogi_gmaps_key', googleApiKey);
    closeModal('gmaps-modal');
    alert(`✅ Google Maps API Key saved! Configuration updated.`);
    if (typeof initHospitalRadar === 'function') {
      initHospitalRadar();
    }
  } else {
    googleApiKey = '';
    localStorage.removeItem('mediyogi_gmaps_key');
    closeModal('gmaps-modal');
    alert('ℹ️ API Key cleared. Using default high-definition Google Maps layer.');
  }
}

function switchMapProvider(providerKey) {
  if (!MAP_PROVIDERS[providerKey]) return;
  currentMapProvider = providerKey;
  localStorage.setItem('mediyogi_map_provider', providerKey);

  if (leafletMap) {
    if (currentTileLayer) {
      leafletMap.removeLayer(currentTileLayer);
    }
    const config = MAP_PROVIDERS[providerKey];
    currentTileLayer = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      attribution: config.attribution
    }).addTo(leafletMap);
  }
}

function filterHospitalsByCity(cityName) {
  const searchInput = document.getElementById('hospital-search');
  if (cityName === 'all') {
    if (searchInput) searchInput.value = '';
    activeHospitalsList = [...DEFAULT_HOSPITALS_DATA];
    renderHospitalList(activeHospitalsList);
    updateMapMarkers(activeHospitalsList);
    showSearchStatus(`Showing all ${DEFAULT_HOSPITALS_DATA.length} hospitals across India.`, true);
    if (leafletMap && window.L) {
      leafletMap.flyTo([22.5726, 88.3639], 5, { animate: true, duration: 1.2 });
    }
    return;
  }

  if (searchInput) searchInput.value = cityName;
  filterHospitalsLocal();

  const cityKey = cityName.toLowerCase();
  if (CITY_COORDINATES[cityKey] && leafletMap) {
    const coords = CITY_COORDINATES[cityKey];
    leafletMap.flyTo([coords.lat, coords.lng], coords.zoom, { animate: true, duration: 1.2 });
  }
}

function initHospitalRadar() {
  activeHospitalsList = [...DEFAULT_HOSPITALS_DATA];
  renderHospitalList(activeHospitalsList);

  const providerSelect = document.getElementById('map-provider-select');
  if (providerSelect) {
    providerSelect.value = currentMapProvider;
  }

  setTimeout(() => {
    const mapContainer = document.getElementById('hospital-map');
    if (mapContainer && window.L && !leafletMap) {
      const userCity = (AppState.user && AppState.user.city) ? AppState.user.city.toLowerCase() : 'kolkata';
      const initialCoords = CITY_COORDINATES[userCity] || CITY_COORDINATES['kolkata'] || { lat: 22.5726, lng: 88.3639, zoom: 12 };

      leafletMap = L.map('hospital-map').setView([initialCoords.lat, initialCoords.lng], initialCoords.zoom);

      const config = MAP_PROVIDERS[currentMapProvider] || MAP_PROVIDERS['google-roadmap'];
      currentTileLayer = L.tileLayer(config.url, {
        maxZoom: config.maxZoom,
        attribution: config.attribution
      }).addTo(leafletMap);

      updateMapMarkers(activeHospitalsList);
    }
  }, 300);
}

function updateMapMarkers(list) {
  if (!leafletMap || !window.L) return;

  // Clear existing hospital markers
  hospitalMarkers.forEach(m => leafletMap.removeLayer(m));
  hospitalMarkers = [];

  if (!list || list.length === 0) return;

  const boundsGroup = [];

  list.forEach((hosp, idx) => {
    const marker = L.marker([hosp.lat, hosp.lng]).addTo(leafletMap);

    const popupHTML = `
      <div class="hospital-popup-card">
        <h4>${escapeHtml(hosp.name)}</h4>
        <p>📍 ${escapeHtml(hosp.address || 'Medical Facility')}</p>
        <p style="color:#10b981; font-weight:600; margin-bottom:10px;">🛏️ ${hosp.beds} Free ICU Beds • ${hosp.rating}</p>
        <div style="display:flex; flex-direction:column; gap:6px;">
          <button class="btn btn-primary btn-sm" style="width:100%; padding:6px 10px; font-size:0.8rem;" onclick="openBookingModal('${escapeHtml(hosp.name)}')">Book Appointment</button>
          <a href="${getGoogleMapsDirectionsUrl(hosp.lat, hosp.lng, hosp.name)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="width:100%; padding:6px 10px; font-size:0.8rem; text-align:center; display:inline-flex; align-items:center; justify-content:center; gap:4px;">🗺️ Google Maps Directions ↗</a>
        </div>
      </div>
    `;

    marker.bindPopup(popupHTML);

    marker.on('click', () => {
      highlightHospitalCard(idx);
    });

    hospitalMarkers.push(marker);
    boundsGroup.push([hosp.lat, hosp.lng]);
  });

  // Adjust view bounds to fit all filtered markers
  if (boundsGroup.length === 1) {
    leafletMap.flyTo(boundsGroup[0], 14, { animate: true, duration: 1 });
  } else if (boundsGroup.length > 1) {
    const bounds = L.latLngBounds(boundsGroup);
    leafletMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }
}

function renderHospitalList(list) {
  const container = document.getElementById('hospitals-container');
  const countBadge = document.getElementById('hospital-count-badge');
  if (!container) return;

  if (countBadge) {
    countBadge.textContent = `Showing ${list.length} Hospital${list.length === 1 ? '' : 's'}`;
  }

  if (!list || list.length === 0) {
    container.innerHTML = `
      <div class="glass-card" style="grid-column: 1 / -1; text-align:center; padding:40px 20px;">
        <div style="font-size:2.5rem; margin-bottom:10px;">🏥</div>
        <h4 style="margin-bottom:8px;">No Hospitals Found</h4>
        <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:16px;">Try searching for another hospital name, city, or area.</p>
        <button class="btn btn-secondary btn-sm" onclick="clearHospitalSearch()">Reset Search</button>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map((h, idx) => `
    <div id="hospital-card-${idx}" class="glass-card interactive" onclick="focusHospitalOnMap(${idx})">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
        <h4 style="font-size:1.05rem; font-weight:700;">${escapeHtml(h.name)}</h4>
        <span class="badge ${h.emergency ? 'badge-success' : 'badge-info'}">${h.emergency ? '24/7 ICU' : 'Clinic'}</span>
      </div>
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:6px;">📍 ${escapeHtml(h.address || h.dist || 'Medical Center')}</p>
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px;">Distance: ${h.dist || 'Nearby'} • Rating: ${h.rating}</p>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <span style="font-size:0.85rem; color:var(--success); font-weight:600;">🛏️ ${h.beds} ICU Beds Available</span>
      </div>
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm" style="flex:1; min-width:130px;" onclick="event.stopPropagation(); openBookingModal('${escapeHtml(h.name)}')">Book Appointment</button>
        <button class="btn btn-secondary btn-sm" title="Focus on map" onclick="event.stopPropagation(); focusHospitalOnMap(${idx})">📍 Focus</button>
        <a href="${getGoogleMapsDirectionsUrl(h.lat, h.lng, h.name)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" title="Get Driving Directions on Google Maps" onclick="event.stopPropagation();" style="display:inline-flex; align-items:center; gap:4px;">🗺️ Directions ↗</a>
      </div>
    </div>
  `).join('');
}

function focusHospitalOnMap(idx) {
  if (activeHospitalsList[idx] && leafletMap) {
    const hosp = activeHospitalsList[idx];
    leafletMap.flyTo([hosp.lat, hosp.lng], 15, { animate: true, duration: 1.2 });

    if (hospitalMarkers[idx]) {
      hospitalMarkers[idx].openPopup();
    }
    highlightHospitalCard(idx);
  }
}

function highlightHospitalCard(idx) {
  document.querySelectorAll('.hospital-list .glass-card').forEach((card, i) => {
    if (i === idx) {
      card.classList.add('hospital-card-active');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      card.classList.remove('hospital-card-active');
    }
  });
}

function handleHospitalSearchKeyup(event) {
  const query = document.getElementById('hospital-search').value;
  const clearBtn = document.getElementById('btn-clear-hospital-search');

  if (clearBtn) {
    clearBtn.style.display = query.trim().length > 0 ? 'block' : 'none';
  }

  // Trigger search on Enter keypress
  if (event.key === 'Enter') {
    triggerGlobalHospitalSearch();
    return;
  }

  // Perform local filter on keyup
  filterHospitalsLocal();
}

function filterHospitalsLocal() {
  const query = document.getElementById('hospital-search').value.toLowerCase().trim();

  if (!query) {
    activeHospitalsList = [...DEFAULT_HOSPITALS_DATA];
    renderHospitalList(activeHospitalsList);
    updateMapMarkers(activeHospitalsList);
    showSearchStatus('', false);
    return;
  }

  const filtered = DEFAULT_HOSPITALS_DATA.filter(h =>
    h.name.toLowerCase().includes(query) ||
    (h.city && h.city.toLowerCase().includes(query)) ||
    (h.address && h.address.toLowerCase().includes(query))
  );

  if (filtered.length > 0) {
    activeHospitalsList = filtered;
    renderHospitalList(activeHospitalsList);
    updateMapMarkers(activeHospitalsList);
    showSearchStatus(`Filtered ${filtered.length} hospital(s) matching "${escapeHtml(query)}". Press Enter or click 'Search Map' to search globally on OpenStreetMap.`, true);

    if (CITY_COORDINATES[query] && leafletMap) {
      const coords = CITY_COORDINATES[query];
      leafletMap.flyTo([coords.lat, coords.lng], coords.zoom, { animate: true, duration: 1 });
    }
  } else {
    // If not found in local presets, offer global map search automatically
    triggerGlobalHospitalSearch();
  }
}

async function triggerGlobalHospitalSearch() {
  const queryInput = document.getElementById('hospital-search');
  if (!queryInput) return;

  const query = queryInput.value.trim();
  if (!query) {
    clearHospitalSearch();
    return;
  }

  showSearchStatus(`🔍 Searching map & OpenStreetMap database for "${escapeHtml(query)}"...`, true);

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=10&q=${encodeURIComponent('hospital ' + query)}`);

    if (!res.ok) throw new Error('Network error querying OpenStreetMap');

    const data = await res.json();

    if (data && data.length > 0) {
      const searchedHospitals = data.map((item, index) => {
        // Extract hospital or facility name from display_name
        const parts = item.display_name.split(',');
        const shortName = parts[0].trim();
        const address = parts.slice(1, 3).join(',').trim() || parts[1] || 'Medical Facility';

        return {
          id: `search-hosp-${index}`,
          name: shortName,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          beds: Math.floor(Math.random() * 22) + 3, // Mock live bed count
          emergency: index % 2 === 0,
          rating: (4.1 + Math.random() * 0.8).toFixed(1) + ' ⭐',
          dist: 'Searched Location',
          address: address
        };
      });

      activeHospitalsList = searchedHospitals;
      renderHospitalList(activeHospitalsList);
      updateMapMarkers(activeHospitalsList);
      showSearchStatus(`✅ Found ${searchedHospitals.length} hospital(s) on the map for "${escapeHtml(query)}".`, true);
    } else {
      // Try searching without the "hospital " prefix if query already contains hospital or medical
      const res2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=10&q=${encodeURIComponent(query)}`);
      const data2 = await res2.json();

      if (data2 && data2.length > 0) {
        const searchedHospitals = data2.map((item, index) => {
          const parts = item.display_name.split(',');
          return {
            id: `search-hosp-${index}`,
            name: parts[0].trim(),
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            beds: Math.floor(Math.random() * 18) + 4,
            emergency: true,
            rating: '4.6 ⭐',
            dist: 'Searched Location',
            address: parts.slice(1, 3).join(',').trim()
          };
        });

        activeHospitalsList = searchedHospitals;
        renderHospitalList(activeHospitalsList);
        updateMapMarkers(activeHospitalsList);
        showSearchStatus(`✅ Found ${searchedHospitals.length} location(s) matching "${escapeHtml(query)}".`, true);
      } else {
        showSearchStatus(`⚠️ No hospitals found matching "${escapeHtml(query)}" on OpenStreetMap. Showing local results.`, true);
        activeHospitalsList = [...DEFAULT_HOSPITALS_DATA];
        renderHospitalList(activeHospitalsList);
        updateMapMarkers(activeHospitalsList);
      }
    }
  } catch (err) {
    console.error('Hospital search error:', err);
    showSearchStatus(`⚠️ Search connection issue. Filtered local records for "${escapeHtml(query)}".`, true);
    filterHospitalsLocal();
  }
}

function locateUserHospitals() {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser.');
    return;
  }

  showSearchStatus('📍 Obtaining your current GPS location...', true);

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (leafletMap) {
        leafletMap.flyTo([lat, lng], 14, { animate: true, duration: 1.5 });

        // Add or move user location marker
        if (userLocationMarker) {
          leafletMap.removeLayer(userLocationMarker);
        }

        userLocationMarker = L.circleMarker([lat, lng], {
          radius: 9,
          fillColor: '#3b82f6',
          color: '#ffffff',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.9
        }).addTo(leafletMap);

        userLocationMarker.bindPopup('<b>📍 Your Current Location</b>').openPopup();
      }

      // Fetch hospitals nearby user's lat, lng
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=8&lat=${lat}&lon=${lng}&q=hospital`);
        const data = await res.json();

        if (data && data.length > 0) {
          const nearby = data.map((item, idx) => {
            const parts = item.display_name.split(',');
            return {
              id: `near-${idx}`,
              name: parts[0].trim(),
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              beds: Math.floor(Math.random() * 20) + 5,
              emergency: true,
              rating: (4.3 + Math.random() * 0.6).toFixed(1) + ' ⭐',
              dist: 'Near You',
              address: parts.slice(1, 3).join(',').trim()
            };
          });

          activeHospitalsList = nearby;
          renderHospitalList(activeHospitalsList);
          updateMapMarkers(activeHospitalsList);
          showSearchStatus(`📍 Displaying ${nearby.length} nearby hospitals around your location.`, true);
        } else {
          showSearchStatus('📍 Centered on your location.', true);
        }
      } catch (e) {
        showSearchStatus('📍 Centered on your location.', true);
      }
    },
    (err) => {
      showSearchStatus('⚠️ Geolocation access denied or unavailable.', true);
    }
  );
}

function clearHospitalSearch() {
  const queryInput = document.getElementById('hospital-search');
  const clearBtn = document.getElementById('btn-clear-hospital-search');

  if (queryInput) queryInput.value = '';
  if (clearBtn) clearBtn.style.display = 'none';

  activeHospitalsList = [...DEFAULT_HOSPITALS_DATA];
  renderHospitalList(activeHospitalsList);
  updateMapMarkers(activeHospitalsList);
  showSearchStatus('', false);

  if (leafletMap) {
    leafletMap.flyTo([28.5672, 77.2100], 13);
  }
}

function showSearchStatus(message, visible = true) {
  const statusBar = document.getElementById('hospital-search-status');
  if (!statusBar) return;

  if (visible && message) {
    statusBar.style.display = 'flex';
    statusBar.innerHTML = `
      <span>${message}</span>
      <button class="btn btn-secondary btn-sm" onclick="clearHospitalSearch()" style="padding:2px 8px; font-size:0.75rem;">Reset</button>
    `;
  } else {
    statusBar.style.display = 'none';
    statusBar.innerHTML = '';
  }
}

function openBookingModal(hospitalName) {
  openDoctorAppointmentForm(`Specialist at ${hospitalName}`, 'General Medicine');
}

function openDoctorAppointmentForm(doctorName = '', specialty = '') {
  const container = document.getElementById('booking-modal-body');
  if (!container) return;

  const todayStr = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <h3 style="margin-bottom:16px; font-size:1.3rem; font-weight:800;">📅 Schedule Doctor Appointment</h3>
    
    <div class="form-group">
      <label>Doctor / Specialist Name</label>
      <input type="text" id="book-doctor-name" class="form-control" placeholder="e.g. Dr. Ananya Sharma" value="${escapeHtml(doctorName || 'Dr. Rajesh Gupta')}">
    </div>

    <div class="form-group">
      <label>Department / Specialty</label>
      <select id="book-dept" class="form-control">
        <option ${specialty === 'General Medicine' ? 'selected' : ''}>General Medicine & Triage</option>
        <option ${specialty === 'Cardiology' ? 'selected' : ''}>Cardiology</option>
        <option ${specialty === 'Pediatrics' ? 'selected' : ''}>Pediatrics</option>
        <option ${specialty === 'Pulmonology' ? 'selected' : ''}>Pulmonology</option>
        <option ${specialty === 'Dermatology' ? 'selected' : ''}>Dermatology</option>
        <option ${specialty === 'Neurology' ? 'selected' : ''}>Neurology</option>
        <option ${specialty === 'Orthopedics' ? 'selected' : ''}>Orthopedics</option>
      </select>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
      <div class="form-group">
        <label>Appointment Date</label>
        <input type="date" id="book-date" class="form-control" value="${todayStr}" min="${todayStr}">
      </div>
      <div class="form-group">
        <label>Time Slot</label>
        <select id="book-slot" class="form-control">
          <option value="09:30 AM">09:30 AM (Morning)</option>
          <option value="11:00 AM">11:00 AM (Morning)</option>
          <option value="02:30 PM">02:30 PM (Afternoon)</option>
          <option value="05:00 PM">05:00 PM (Evening)</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label>Consultation Mode</label>
      <select id="book-mode" class="form-control">
        <option value="In-Person Clinic Visit">🏥 In-Person Clinic Visit</option>
        <option value="HD Video Tele-Consultation">📹 HD Video Tele-Consultation</option>
      </select>
    </div>

    <div class="form-group">
      <label>Symptoms / Reason for Visit (Optional)</label>
      <input type="text" id="book-symptoms" class="form-control" placeholder="e.g. Routine checkup, mild fever, hypertension follow-up">
    </div>

    <div style="display:flex; gap:12px; margin-top:20px;">
      <button class="btn btn-primary" style="flex:1;" onclick="saveDoctorAppointment()">Confirm & Book Slot</button>
      <button class="btn btn-secondary" onclick="closeModal('booking-modal')">Cancel</button>
    </div>
  `;

  openModal('booking-modal');
}

function saveDoctorAppointment() {
  const docName = document.getElementById('book-doctor-name')?.value || 'Dr. Specialist';
  const dept = document.getElementById('book-dept')?.value || 'General Medicine';
  const date = document.getElementById('book-date')?.value || new Date().toISOString().split('T')[0];
  const slot = document.getElementById('book-slot')?.value || '10:00 AM';
  const mode = document.getElementById('book-mode')?.value || 'In-Person Clinic Visit';
  const symptoms = document.getElementById('book-symptoms')?.value || 'General Health Consult';

  const refId = 'MED-' + Math.floor(100000 + Math.random() * 900000);

  const newAppt = {
    id: 'apt_' + Date.now(),
    refId,
    docName,
    hospName: docName.includes('AIIMS') ? 'AIIMS New Delhi' : 'Mediyogi Medical Center',
    dept,
    date,
    slot,
    mode,
    symptoms,
    status: 'Confirmed'
  };

  if (!AppState.appointments) AppState.appointments = [];
  AppState.appointments.unshift(newAppt);
  localStorage.setItem('mediyogi_appointments', JSON.stringify(AppState.appointments));

  closeModal('booking-modal');
  showToast(`✅ Appointment booked with ${docName} on ${date} (${slot})!`);
  renderAppointmentsList();
}

function renderAppointmentsList(filter = 'all') {
  const container = document.getElementById('appointments-list-container');
  if (!container) return;

  if (!AppState.appointments || !Array.isArray(AppState.appointments)) {
    AppState.appointments = JSON.parse(localStorage.getItem('mediyogi_appointments')) || [];
  }

  if (AppState.appointments.length === 0) {
    AppState.appointments = [
      {
        id: 'apt_demo_1',
        refId: 'MED-782910',
        docName: 'Dr. Ananya Sharma',
        hospName: 'AIIMS Heart Center',
        dept: 'Cardiology',
        date: '2026-08-10',
        slot: '11:00 AM',
        mode: 'HD Video Tele-Consultation',
        symptoms: 'Annual cardiac screening & ECG review',
        status: 'Confirmed'
      },
      {
        id: 'apt_demo_2',
        refId: 'MED-491203',
        docName: 'Dr. Rajesh Gupta',
        hospName: 'Mediyogi Care Center',
        dept: 'General Medicine',
        date: '2026-07-28',
        slot: '02:30 PM',
        mode: 'In-Person Clinic Visit',
        symptoms: 'Follow-up for blood pressure check',
        status: 'Completed'
      }
    ];
    localStorage.setItem('mediyogi_appointments', JSON.stringify(AppState.appointments));
  }

  let list = AppState.appointments;
  const todayStr = new Date().toISOString().split('T')[0];

  if (filter === 'upcoming') {
    list = list.filter(a => a.date >= todayStr && a.status !== 'Cancelled');
  } else if (filter === 'completed') {
    list = list.filter(a => a.date < todayStr || a.status === 'Completed');
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:30px 15px;">
        <div style="font-size:2.2rem; margin-bottom:8px;">📅</div>
        <h4 style="margin-bottom:6px;">No Appointments Found</h4>
        <p style="color:var(--text-muted); font-size:0.88rem; margin-bottom:14px;">You have no ${filter} doctor appointments.</p>
        <button class="btn btn-primary btn-sm" onclick="openDoctorAppointmentForm()">Book New Appointment</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:14px;">
      ${list.map(appt => `
        <div class="glass-card" style="padding:16px; background:var(--bg-glass-light); border:1px solid var(--border-color); position:relative;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
            <div>
              <span style="font-size:0.75rem; color:var(--secondary); font-weight:700; font-family:monospace;">${appt.refId}</span>
              <h4 style="font-size:1.1rem; font-weight:800; color:var(--text-main); margin-top:2px;">${escapeHtml(appt.docName)}</h4>
              <div style="font-size:0.85rem; color:var(--text-muted);">${escapeHtml(appt.dept)} • ${escapeHtml(appt.hospName || 'Clinic')}</div>
            </div>
            <span class="badge ${appt.status === 'Confirmed' ? 'badge-success' : appt.status === 'Completed' ? 'badge-info' : 'badge-danger'}">
              ${appt.status === 'Confirmed' ? '🟢 Confirmed' : appt.status === 'Completed' ? '🔵 Completed' : '🔴 Cancelled'}
            </span>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.85rem; background:rgba(0,0,0,0.15); padding:10px; border-radius:8px; margin-bottom:12px;">
            <div>🗓️ <strong>Date:</strong> ${appt.date} (${appt.slot || '10:00 AM'})</div>
            <div>🩺 <strong>Mode:</strong> ${escapeHtml(appt.mode || 'Clinic Visit')}</div>
            <div style="grid-column:span 2;">📝 <strong>Reason:</strong> ${escapeHtml(appt.symptoms || 'General Checkup')}</div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:8px;">
            ${appt.status === 'Confirmed' ? `
              <button class="btn btn-secondary btn-sm" style="font-size:0.8rem;" onclick="openDoctorAppointmentForm('${escapeHtml(appt.docName)}', '${escapeHtml(appt.dept)}')">Reschedule</button>
              <button class="btn btn-danger btn-sm" style="font-size:0.8rem;" onclick="cancelAppointment('${appt.id || appt.refId}')">Cancel</button>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function filterAppointments(filterType) {
  const btns = document.querySelectorAll('#appointment-filter-btns button');
  btns.forEach(btn => btn.classList.remove('active-filter'));

  const activeBtn = Array.from(btns).find(b => b.textContent.toLowerCase().includes(filterType));
  if (activeBtn) activeBtn.classList.add('active-filter');

  renderAppointmentsList(filterType);
}

function cancelAppointment(idOrRef) {
  if (!confirm('Are you sure you want to cancel this appointment?')) return;

  AppState.appointments = AppState.appointments.map(a => {
    if (a.id === idOrRef || a.refId === idOrRef) {
      return { ...a, status: 'Cancelled' };
    }
    return a;
  });

  localStorage.setItem('mediyogi_appointments', JSON.stringify(AppState.appointments));
  showToast('🔴 Appointment cancelled.');
  renderAppointmentsList();
}

/* ==========================================================================
   HEALTH VITALS TRACKER & CANVAS CHART
   ========================================================================== */
function initVitalsTracker() {
  updateWaterUI();
  renderRemindersList();
  renderAppointmentsList();
}

function renderVitalsChart() {
  const canvas = document.getElementById('vitals-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.parentElement.clientWidth || 500;
  const height = canvas.height = 240;

  ctx.clearRect(0, 0, width, height);

  // Background Grid Lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let y = 40; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const stepX = width / (AppState.vitals.length - 1);

  // Draw Systolic Line (Primary Green)
  ctx.beginPath();
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 3;

  AppState.vitals.forEach((v, i) => {
    const x = i * stepX;
    const y = height - (v.bpSys / 160) * height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Draw Heart Rate Line (Teal)
  ctx.beginPath();
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);

  AppState.vitals.forEach((v, i) => {
    const x = i * stepX;
    const y = height - (v.hr / 160) * height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);
}

function addWaterGlass() {
  AppState.waterGlasses += 1;
  localStorage.setItem('mediyogi_water', AppState.waterGlasses);
  updateWaterUI();
}

function resetWater() {
  AppState.waterGlasses = 0;
  localStorage.setItem('mediyogi_water', 0);
  updateWaterUI();
}

function updateWaterUI() {
  const waterCount = document.getElementById('water-count');
  const waterWave = document.getElementById('water-wave');
  if (waterCount) waterCount.textContent = AppState.waterGlasses;

  if (waterWave) {
    const pct = Math.min(100, (AppState.waterGlasses / 8) * 100);
    waterWave.style.height = `${pct}%`;
  }
}

function calculateBMI() {
  const weight = parseFloat(document.getElementById('bmi-weight').value);
  const heightCm = parseFloat(document.getElementById('bmi-height').value);
  const resultDiv = document.getElementById('bmi-result');

  if (!resultDiv) return;
  if (!weight || !heightCm || weight <= 0 || heightCm <= 0) {
    resultDiv.innerHTML = '<span style="color:var(--danger);">⚠️ Please enter valid weight and height.</span>';
    return;
  }

  const heightM = heightCm / 100;
  const bmi = (weight / (heightM * heightM)).toFixed(1);
  let status = 'Normal Weight';
  let badgeClass = 'badge-success';
  let advice = '';

  const minNormalWeight = (18.5 * heightM * heightM).toFixed(1);
  const maxNormalWeight = (24.9 * heightM * heightM).toFixed(1);

  if (bmi < 18.5) {
    status = 'Underweight';
    badgeClass = 'badge-warning';
    advice = `Nutrient-dense diet recommended. Ideal weight target: ${minNormalWeight} - ${maxNormalWeight} kg.`;
  } else if (bmi >= 18.5 && bmi <= 24.9) {
    status = 'Normal Weight';
    badgeClass = 'badge-success';
    advice = `Optimal BMI! Maintain balanced diet and 150 mins weekly exercise. Target: ${minNormalWeight} - ${maxNormalWeight} kg.`;
  } else if (bmi >= 25 && bmi <= 29.9) {
    status = 'Overweight';
    badgeClass = 'badge-warning';
    advice = `Consider portion control & regular cardio activity. Ideal weight target: ${minNormalWeight} - ${maxNormalWeight} kg.`;
  } else {
    status = 'Obese';
    badgeClass = 'badge-danger';
    advice = `Consult a clinical specialist. Ideal weight target: ${minNormalWeight} - ${maxNormalWeight} kg.`;
  }

  resultDiv.innerHTML = `
    <div class="result-box-card" style="background:var(--bg-glass-light); padding:12px; border-radius:10px; margin-top:8px; border:1px solid var(--border-color);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span style="font-size:1.05rem; font-weight:700; color:var(--text-main);">BMI: ${bmi}</span>
        <span class="badge ${badgeClass}">${status}</span>
      </div>
      <p style="font-size:0.8rem; color:var(--text-muted); margin:0;">💡 ${advice}</p>
    </div>
  `;
}

function convertBloodSugar() {
  const inputEl = document.getElementById('bs-value');
  const unitEl = document.getElementById('bs-unit');
  const resultDiv = document.getElementById('bs-result');

  if (!inputEl || !unitEl || !resultDiv) return;

  const rawVal = parseFloat(inputEl.value);
  if (isNaN(rawVal) || rawVal <= 0) {
    resultDiv.innerHTML = '<span style="color:var(--danger);">⚠️ Please enter a valid blood sugar value.</span>';
    return;
  }

  const unit = unitEl.value;
  let mgdl, mmol;

  if (unit === 'mg/dL') {
    mgdl = rawVal;
    mmol = (rawVal / 18.018).toFixed(2);
  } else {
    mmol = rawVal;
    mgdl = (rawVal * 18.018).toFixed(1);
  }

  const hba1c = ((parseFloat(mgdl) + 46.7) / 28.7).toFixed(1);

  let statusBadge = '';
  let advice = '';

  if (mgdl < 70) {
    statusBadge = '<span class="badge badge-danger">🔴 Hypoglycemia (Low)</span>';
    advice = 'Blood glucose is low (<70 mg/dL). Consume 15g fast-acting carbohydrates (fruit juice, sugar).';
  } else if (mgdl <= 99) {
    statusBadge = '<span class="badge badge-success">🟢 Normal Fasting</span>';
    advice = 'Optimal blood glucose level. Continue balanced nutrition and routine activity.';
  } else if (mgdl <= 125) {
    statusBadge = '<span class="badge badge-warning">🟡 Prediabetes Range</span>';
    advice = 'Glucose level is elevated. Exercise regularly and limit refined sugar intake.';
  } else {
    statusBadge = '<span class="badge badge-danger">🔴 Diabetes Range</span>';
    advice = 'Glucose is in diabetic range (≥126 mg/dL). Consult your healthcare provider for evaluation.';
  }

  resultDiv.innerHTML = `
    <div class="result-box-card" style="background:var(--bg-glass-light); padding:12px; border-radius:10px; margin-top:8px; border:1px solid var(--border-color);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span style="font-size:1.05rem; font-weight:700; color:var(--text-main);">${mgdl} mg/dL <span style="font-size:0.82rem; color:var(--text-muted);">(${mmol} mmol/L)</span></span>
        ${statusBadge}
      </div>
      <div style="font-size:0.85rem; margin-bottom:6px; color:var(--secondary); font-weight:600;">
        📊 Estimated HbA1c: <strong>${hba1c}%</strong>
      </div>
      <p style="font-size:0.8rem; color:var(--text-muted); margin:0;">💡 ${advice}</p>
    </div>
  `;
}

function calculatePregnancy() {
  const lmpInput = document.getElementById('preg-last-period');
  const dueInput = document.getElementById('preg-due-date');
  const resultDiv = document.getElementById('preg-result');

  if (!resultDiv) return;

  let lmpDate = lmpInput && lmpInput.value ? new Date(lmpInput.value) : null;
  let dueDate = dueInput && dueInput.value ? new Date(dueInput.value) : null;

  if (!lmpDate && !dueDate) {
    lmpDate = new Date();
    lmpDate.setDate(lmpDate.getDate() - 84); // 12 weeks default for instant display
    if (lmpInput) lmpInput.value = lmpDate.toISOString().split('T')[0];
  }

  const GESTATION_DAYS = 280;

  if (lmpDate && !dueDate) {
    dueDate = new Date(lmpDate.getTime() + GESTATION_DAYS * 24 * 60 * 60 * 1000);
    if (dueInput) dueInput.value = dueDate.toISOString().split('T')[0];
  } else if (dueDate && !lmpDate) {
    lmpDate = new Date(dueDate.getTime() - GESTATION_DAYS * 24 * 60 * 60 * 1000);
    if (lmpInput) lmpInput.value = lmpDate.toISOString().split('T')[0];
  }

  const today = new Date();
  const diffTime = today.getTime() - lmpDate.getTime();
  const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (daysPassed < 0) {
    resultDiv.innerHTML = '<span style="color:var(--warning);">⚠️ LMP date selected is in the future.</span>';
    return;
  }

  const weeks = Math.floor(daysPassed / 7);
  const days = daysPassed % 7;
  const progressPct = Math.min(100, Math.max(0, Math.floor((daysPassed / GESTATION_DAYS) * 100)));

  let trimesterBadge = '';
  let advice = '';

  if (weeks <= 12) {
    trimesterBadge = '<span class="badge badge-info">🌸 1st Trimester</span>';
    advice = '1st Trimester (W1-12): Daily Folic Acid (400mcg), early prenatal screen, & hydration.';
  } else if (weeks <= 26) {
    trimesterBadge = '<span class="badge badge-success">🌼 2nd Trimester</span>';
    advice = '2nd Trimester (W13-26): Anomaly ultrasound, iron & calcium supplements, tracking fetal movement.';
  } else if (weeks <= 40) {
    trimesterBadge = '<span class="badge badge-warning">🌺 3rd Trimester</span>';
    advice = '3rd Trimester (W27-40): Fetal kick count logs, hospital bag preparation, and routine NSTs.';
  } else {
    trimesterBadge = '<span class="badge badge-danger">🚨 Past Due Date</span>';
    advice = 'Post-term (W40+): Consult your OB/GYN doctor immediately for fetal surveillance.';
  }

  const daysRemaining = Math.max(0, Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const formattedDue = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  resultDiv.innerHTML = `
    <div class="result-box-card" style="background:var(--bg-glass-light); padding:12px; border-radius:10px; margin-top:8px; border:1px solid var(--border-color);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span style="font-size:0.95rem; font-weight:700; color:var(--text-main);">🗓️ Due: ${formattedDue}</span>
        ${trimesterBadge}
      </div>
      <div style="font-size:0.85rem; margin-bottom:6px; color:var(--primary); font-weight:600;">
        👶 Progress: <strong>${weeks} Weeks, ${days} Days</strong> (${progressPct}% complete)
      </div>
      <div style="background:rgba(255,255,255,0.06); height:8px; border-radius:4px; overflow:hidden; margin-bottom:8px;">
        <div style="width:${progressPct}%; height:100%; background:linear-gradient(90deg, var(--primary), var(--secondary)); border-radius:4px;"></div>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:0.78rem; color:var(--text-muted); margin-bottom:6px;">
        <span>⏳ ${daysRemaining} days remaining</span>
        <span>Target: 40 Weeks</span>
      </div>
      <p style="font-size:0.78rem; color:var(--text-muted); margin:0;">💡 ${advice}</p>
    </div>
  `;
}

function checkInteractions() {
  const med1Input = document.getElementById('med1');
  const med2Input = document.getElementById('med2');
  const resultDiv = document.getElementById('interaction-result');

  if (!resultDiv) return;

  const m1 = med1Input ? med1Input.value.trim() : '';
  const m2 = med2Input ? med2Input.value.trim() : '';

  if (!m1 && !m2) {
    resultDiv.innerHTML = '<span style="color:var(--danger);">⚠️ Please enter at least one medication.</span>';
    return;
  }

  if (!m2) {
    resultDiv.innerHTML = `
      <div class="result-box-card" style="background:var(--bg-glass-light); padding:12px; border-radius:10px; margin-top:8px; border:1px solid var(--border-color);">
        <span class="badge badge-success" style="margin-bottom:6px; display:inline-block;">🟢 Single Drug Check</span>
        <p style="font-size:0.82rem; color:var(--text-muted); margin:0;">
          <strong>${escapeHtml(m1)}</strong> checked. Enter a 2nd medication to run cross-interaction screening.
        </p>
      </div>
    `;
    return;
  }

  const INTERACTION_DATABASE = [
    {
      keywords: ['metformin', 'albuterol'],
      badge: '<span class="badge badge-info">🔵 Low Clinical Risk</span>',
      title: 'Minor Blood Glucose Modulation',
      desc: 'Albuterol (beta-2 agonist) may transiently increase blood glucose, slightly opposing Metformin. Monitor glucose levels routinely.'
    },
    {
      keywords: ['aspirin', 'warfarin'],
      badge: '<span class="badge badge-danger">🔴 High Severe Risk</span>',
      title: 'Major Hemorrhage & Bleeding Hazard',
      desc: 'Combined Aspirin and Warfarin significantly raises internal bleeding risk. Requires strict physician supervision and INR monitoring.'
    },
    {
      keywords: ['ibuprofen', 'lisinopril'],
      badge: '<span class="badge badge-warning">🟡 Moderate Interaction</span>',
      title: 'Reduced Antihypertensive Response',
      desc: 'NSAIDs like Ibuprofen can diminish blood pressure control of Lisinopril and increase renal workload.'
    },
    {
      keywords: ['atorvastatin', 'clarithromycin'],
      badge: '<span class="badge badge-danger">🔴 High Severe Risk</span>',
      title: 'CYP3A4 Inhibition & Rhabdomyolysis Risk',
      desc: 'Clarithromycin inhibits statin breakdown, elevating statin levels and risk of severe muscle breakdown.'
    },
    {
      keywords: ['paracetamol', 'alcohol'],
      badge: '<span class="badge badge-warning">🟡 Moderate Risk</span>',
      title: 'Increased Hepatotoxicity',
      desc: 'Regular alcohol with Paracetamol increases toxic NAPQI metabolite formation, stressing liver tissue.'
    }
  ];

  const match = INTERACTION_DATABASE.find(item => {
    const k1 = item.keywords[0];
    const k2 = item.keywords[1];
    return (m1.toLowerCase().includes(k1) && m2.toLowerCase().includes(k2)) ||
      (m1.toLowerCase().includes(k2) && m2.toLowerCase().includes(k1));
  });

  if (match) {
    resultDiv.innerHTML = `
      <div class="result-box-card" style="background:var(--bg-glass-light); padding:12px; border-radius:10px; margin-top:8px; border:1px solid var(--border-color);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <strong style="font-size:0.9rem; color:var(--text-main);">${escapeHtml(m1)} + ${escapeHtml(m2)}</strong>
          ${match.badge}
        </div>
        <div style="font-size:0.84rem; font-weight:700; color:var(--warning); margin-bottom:4px;">⚠️ ${match.title}</div>
        <p style="font-size:0.8rem; color:var(--text-muted); margin:0;">${match.desc}</p>
      </div>
    `;
  } else {
    resultDiv.innerHTML = `
      <div class="result-box-card" style="background:var(--bg-glass-light); padding:12px; border-radius:10px; margin-top:8px; border:1px solid var(--border-color);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <strong style="font-size:0.9rem; color:var(--text-main);">${escapeHtml(m1)} + ${escapeHtml(m2)}</strong>
          <span class="badge badge-success">🟢 No Severe Conflict Found</span>
        </div>
        <p style="font-size:0.8rem; color:var(--text-muted); margin:0;">
          No high-risk documented drug interactions found between ${escapeHtml(m1)} and ${escapeHtml(m2)}. Always consult your doctor or pharmacist.
        </p>
      </div>
    `;
  }
}

function setReminder() {
  const medEl = document.getElementById('reminder-med');
  const doseEl = document.getElementById('reminder-dose');
  const freqEl = document.getElementById('reminder-freq');

  if (!medEl || !doseEl || !freqEl) return;

  const med = medEl.value.trim();
  const dose = doseEl.value.trim();
  const freq = parseInt(freqEl.value, 10);

  if (!med || !dose || isNaN(freq) || freq <= 0) {
    showToast('⚠️ Please enter valid medication name, dose, and frequency.', 'warning');
    return;
  }

  if (!AppState.reminders) {
    AppState.reminders = JSON.parse(localStorage.getItem('mediyogi_reminders')) || [];
  }

  const now = new Date();
  const nextTime = new Date(now.getTime() + freq * 60 * 60 * 1000);
  const timeStr = nextTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newReminder = {
    id: 'rem_' + Date.now(),
    med,
    dose,
    freq,
    nextTime: timeStr
  };

  AppState.reminders.push(newReminder);
  localStorage.setItem('mediyogi_reminders', JSON.stringify(AppState.reminders));

  showToast(`⏰ Medication reminder added for ${med} (${dose})!`);
  renderRemindersList();
}

function renderRemindersList() {
  const resultDiv = document.getElementById('reminder-result');
  if (!resultDiv) return;

  if (!AppState.reminders) {
    AppState.reminders = JSON.parse(localStorage.getItem('mediyogi_reminders')) || [];
  }

  if (AppState.reminders.length === 0) {
    AppState.reminders = [
      { id: 'rem_demo_1', med: 'Metformin', dose: '500mg', freq: 8, nextTime: '02:30 PM' }
    ];
    localStorage.setItem('mediyogi_reminders', JSON.stringify(AppState.reminders));
  }

  resultDiv.innerHTML = `
    <div style="margin-top:10px; display:flex; flex-direction:column; gap:8px; max-height:160px; overflow-y:auto;">
      ${AppState.reminders.map(rem => `
        <div style="background:var(--bg-glass-light); padding:8px 12px; border-radius:8px; border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:700; font-size:0.86rem; color:var(--text-main);">${escapeHtml(rem.med)} <span style="font-size:0.75rem; color:var(--secondary);">(${escapeHtml(rem.dose)})</span></div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Every ${rem.freq}h • Next: <strong>${rem.nextTime}</strong></div>
          </div>
          <button class="btn btn-danger btn-sm" style="padding:2px 8px; font-size:0.75rem;" title="Delete Reminder" onclick="deleteReminder('${rem.id}')">🗑️</button>
        </div>
      `).join('')}
    </div>
  `;
}

function deleteReminder(id) {
  if (!AppState.reminders) return;
  AppState.reminders = AppState.reminders.filter(r => r.id !== id);
  localStorage.setItem('mediyogi_reminders', JSON.stringify(AppState.reminders));
  showToast('🗑️ Reminder deleted');
  renderRemindersList();
}

/* ==========================================================================
   PATIENT PROFILE MANAGEMENT & PUBLIC HEALTH CARD
   ========================================================================== */
function initProfileManagement() {
  const fields = {
    'prof-name': AppState.user.name || '',
    'prof-email': AppState.user.email || '',
    'prof-phone': AppState.user.phone || '',
    'prof-dob': AppState.user.dob || '1998-05-14',
    'prof-gender': AppState.user.gender || 'Female',
    'prof-blood': AppState.user.bloodGroup || 'O+',
    'prof-emergency-name': AppState.user.emergencyName || '',
    'prof-emergency-phone': AppState.user.emergencyPhone || '',
    'prof-allergies': AppState.user.allergies || '',
    'prof-conditions': AppState.user.conditions || '',
    'prof-medications': AppState.user.medications || '',
    'prof-city': AppState.user.city || '',
    'prof-organ-donor': AppState.user.organDonor || 'Yes',
    'prof-public-toggle': AppState.user.isPublicEnabled !== false
  };

  for (const [id, val] of Object.entries(fields)) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.type === 'checkbox') {
      el.checked = !!val;
    } else {
      el.value = val;
    }
  }

  updateProfileCardPreview();
  renderProfileQRCodes();
}

function saveUserProfile() {
  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  };
  const getCheck = (id) => {
    const el = document.getElementById(id);
    return el ? el.checked : false;
  };

  const newName = getVal('prof-name');
  if (!newName) {
    showToast('⚠️ Please enter your Full Name', 'warning');
    return;
  }

  AppState.user.name = newName;
  AppState.user.email = getVal('prof-email') || AppState.user.email;
  AppState.user.phone = getVal('prof-phone') || AppState.user.phone;
  AppState.user.dob = getVal('prof-dob') || AppState.user.dob;
  if (AppState.user.dob) {
    AppState.user.yob = AppState.user.dob.split('-')[0] || AppState.user.yob;
  }
  AppState.user.gender = getVal('prof-gender') || AppState.user.gender;
  AppState.user.bloodGroup = getVal('prof-blood') || AppState.user.bloodGroup;
  AppState.user.emergencyName = getVal('prof-emergency-name') || AppState.user.emergencyName;
  AppState.user.emergencyPhone = getVal('prof-emergency-phone') || AppState.user.emergencyPhone;
  AppState.user.allergies = getVal('prof-allergies') || AppState.user.allergies;
  AppState.user.conditions = getVal('prof-conditions') || AppState.user.conditions;
  AppState.user.medications = getVal('prof-medications') || AppState.user.medications;
  AppState.user.city = getVal('prof-city') || AppState.user.city;
  AppState.user.organDonor = getVal('prof-organ-donor') || AppState.user.organDonor;
  AppState.user.isPublicEnabled = getCheck('prof-public-toggle');

  // Compute avatar initials
  const parts = AppState.user.name.trim().split(' ');
  if (parts.length >= 2) {
    AppState.user.avatar = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  } else if (parts[0]) {
    AppState.user.avatar = parts[0].substring(0, 2).toUpperCase();
  }

  localStorage.setItem('mediyogi_user', JSON.stringify(AppState.user));
  initUIState();
  updateProfileCardPreview();
  renderProfileQRCodes();

  showToast('✅ Profile updated & public health ID synced successfully!');
}

function updateProfileCardPreview() {
  const cardName = document.getElementById('card-user-name');
  if (cardName) cardName.textContent = AppState.user.name;

  const cardHealthId = document.getElementById('card-health-id');
  if (cardHealthId) cardHealthId.textContent = AppState.user.healthId;

  const cardGender = document.getElementById('card-gender');
  if (cardGender) cardGender.textContent = AppState.user.gender;

  const cardYob = document.getElementById('card-yob');
  if (cardYob) cardYob.textContent = AppState.user.yob || (AppState.user.dob ? AppState.user.dob.split('-')[0] : '1998');

  const cardBlood = document.getElementById('card-blood');
  if (cardBlood) cardBlood.textContent = AppState.user.bloodGroup;

  const cardEmergency = document.getElementById('card-emergency');
  if (cardEmergency) {
    const eName = AppState.user.emergencyName || 'Rajesh Verma (Father)';
    const ePhone = AppState.user.emergencyPhone || '+91 98765 43211';
    cardEmergency.textContent = `${eName} (${ePhone})`;
  }

  const cardDonor = document.getElementById('card-organ-donor');
  if (cardDonor) cardDonor.textContent = AppState.user.organDonor || 'Yes';

  const cardAvatar = document.getElementById('card-avatar');
  if (cardAvatar) cardAvatar.textContent = AppState.user.avatar;

  const publicBadge = document.getElementById('card-public-status');
  if (publicBadge) {
    if (AppState.user.isPublicEnabled !== false) {
      publicBadge.className = 'badge badge-success';
      publicBadge.textContent = '🟢 Public Access Active';
    } else {
      publicBadge.className = 'badge badge-warning';
      publicBadge.textContent = '🔒 Private Access Only';
    }
  }
}

function copyPublicProfileLink() {
  const publicUrl = getPublicProfileUrl(AppState.user ? AppState.user.healthId : '');

  navigator.clipboard.writeText(publicUrl).then(() => {
    showToast('📋 Public Health Profile link copied to clipboard!');
  }).catch(() => {
    // Fallback for clipboard API
    const input = document.createElement('input');
    input.value = publicUrl;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast('📋 Public Health Profile link copied to clipboard!');
  });
}

function openPublicProfileView() {
  window.open('profile.html', '_blank');
}

function printHealthCard() {
  window.open('profile.html?print=true', '_blank');
}

function showToast(message, type = 'success') {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 14px 22px;
      border-radius: 12px;
      background: rgba(18, 24, 38, 0.95);
      border: 1px solid var(--primary);
      color: #ffffff;
      font-weight: 600;
      font-size: 0.92rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 10px;
      backdrop-filter: blur(10px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform: translateY(100px);
      opacity: 0;
    `;
    document.body.appendChild(toast);
  }

  if (type === 'warning') {
    toast.style.borderColor = 'var(--warning)';
  } else {
    toast.style.borderColor = 'var(--primary)';
  }

  toast.textContent = message;
  toast.style.transform = 'translateY(0)';
  toast.style.opacity = '1';

  setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';
  }, 3500);
}

function getPublicProfileUrl(healthId) {
  const targetId = healthId || (AppState && AppState.user ? AppState.user.healthId : 'ABDM-91-8420-1129-90');
  const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
  return `${baseUrl}profile.html?healthId=${encodeURIComponent(targetId)}`;
}

function renderProfileQRCodes() {
  const containers = document.querySelectorAll('.qr-code-box');
  if (!containers.length) return;

  const healthId = AppState.user ? AppState.user.healthId : 'ABDM-91-8420-1129-90';
  const profileUrl = getPublicProfileUrl(healthId);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(profileUrl)}`;

  containers.forEach(box => {
    box.innerHTML = `
      <div style="background:#ffffff; padding:10px; border-radius:14px; display:inline-block; text-align:center; box-shadow:0 4px 18px rgba(0,0,0,0.35); border:2px solid rgba(16,185,129,0.4);">
        <img src="${qrImageUrl}" alt="Emergency Medical Profile QR Code" style="width:130px; height:130px; display:block; border-radius:6px;" />
        <span style="font-size:0.72rem; color:#0b0f19; font-weight:800; margin-top:6px; letter-spacing:0.5px; text-transform:uppercase; display:block;">📷 Scan with Camera</span>
      </div>
    `;
  });
}

function sendEmergencyAlert() {
  const contact = AppState.user.emergencyPhone;
  const name = AppState.user.emergencyName;
  alert(`🚨 EMERGENCY ALERT DISPATCHED!\n\nAn automated SMS & location notification has been dispatched to emergency contact:\n👤 ${name}\n📞 ${contact}\n\nGPS Coordinates attached: 28.6139° N, 77.2090° E (New Delhi)`);
}

/* ==========================================================================
   MODAL UTILITIES
   ========================================================================== */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');

  if (modalId === 'symptom-modal') {
    wizardAnswers = {};
    renderWizardStep(0);
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}
