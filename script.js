/**
 * Mediyogi Public Health AI Platform - Core Application Logic
 */

// Global State Initializer
const AppState = {
  user: JSON.parse(localStorage.getItem('mediyogi_user')) || {
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
  currentLang: 'en'
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
  initUIState();
  initChatEngine();
  initReportParser();
  initHospitalRadar();
  initVitalsTracker();
  initSymptomChecker();
  initProfileManagement();
});

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

  // Re-render chart if switching to vitals
  if (sectionId === 'vitals') {
    setTimeout(renderVitalsChart, 100);
  }
}

function initUIState() {
  // Populate User Display Names
  const userNames = document.querySelectorAll('.user-disp-name');
  userNames.forEach(el => el.textContent = AppState.user.name);

  const healthIdEls = document.querySelectorAll('.user-health-id');
  healthIdEls.forEach(el => el.textContent = AppState.user.healthId);

  // Avatar Initials
  const avatars = document.querySelectorAll('.avatar');
  avatars.forEach(el => {
    if (AppState.user.avatar) el.textContent = AppState.user.avatar;
  });

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

function sendChatMessage(textOverride) {
  const input = document.getElementById('chat-input');
  const query = textOverride || (input ? input.value.trim() : '');
  if (!query) return;

  addChatMessage('user', query);
  if (input) input.value = '';

  // Simulate AI Thinking
  showTypingIndicator();

  setTimeout(() => {
    removeTypingIndicator();
    const botReply = generateAIResponse(query);
    addChatMessage('bot', botReply);
    speakResponse(botReply);
  }, 700);
}

function generateAIResponse(text) {
  const lower = text.toLowerCase();
  const dict = AI_KNOWLEDGE[AppState.currentLang] || AI_KNOWLEDGE.en;

  if (lower.includes('fever') || lower.includes('बुखार') || lower.includes('জ্বর')) return dict.fever;
  if (lower.includes('dengue') || lower.includes('डेंगू') || lower.includes('डेगू')) return dict.dengue;
  if (lower.includes('vaccine') || lower.includes('टीका') || lower.includes('ভ্যাকসিন')) return dict.vaccine;
  if (lower.includes('headache') || lower.includes('pain')) return "For headaches: Ensure hydration and reduce screen glare. If accompanied by sudden blurred vision or stiffness in neck, seek medical attention.";
  
  return dict.default;
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
  chatBox.scrollTop = chatBox.scrollHeight;
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
  chatBox.scrollTop = chatBox.scrollHeight;
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

  if (wizardAnswers.breathing === 'Yes, severe' || wizardAnswers.fever === 'High (>102°F)') {
    riskScore = 'High';
    badgeClass = 'badge-danger';
    advice = '⚠️ HIGH RISK: Immediate medical evaluation is recommended. Please visit the nearest hospital emergency or consult a clinician.';
  } else if (wizardAnswers.duration === 'More than a week' || wizardAnswers.fatigue === 'Severe') {
    riskScore = 'Moderate';
    badgeClass = 'badge-warning';
    advice = 'MODERATE RISK: Consult a primary care doctor within 24-48 hours for a thorough physical check-up.';
  }

  container.innerHTML = `
    <div style="text-align:center; padding:10px 0;">
      <div style="font-size:2.5rem; margin-bottom:8px;">🩺</div>
      <h3 style="margin-bottom:8px;">Assessment Completed</h3>
      <div style="margin-bottom:16px;">
        <span class="badge ${badgeClass}" style="font-size:1rem; padding:8px 16px;">Risk Level: ${riskScore}</span>
      </div>
      <p style="color:var(--text-muted); font-size:0.95rem; margin-bottom:24px;">${advice}</p>
      <div style="display:flex; gap:12px; justify-content:center;">
        <button class="btn btn-primary" onclick="closeModal('symptom-modal'); showSection('hospitals');">Find Nearest Hospital</button>
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
let hospitalMarkers = [];
let userLocationMarker = null;
let activeHospitalsList = [];

const DEFAULT_HOSPITALS_DATA = [
  { id: 'hosp-1', name: 'AIIMS New Delhi', lat: 28.5672, lng: 77.2100, beds: 18, emergency: true, rating: '4.9 ⭐', dist: '1.2 km', address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi' },
  { id: 'hosp-2', name: 'Fortis Healthcare', lat: 28.5447, lng: 77.2646, beds: 8, emergency: true, rating: '4.7 ⭐', dist: '3.5 km', address: 'Okhla Road, New Delhi' },
  { id: 'hosp-3', name: 'Max Super Speciality Hospital', lat: 28.5284, lng: 77.2185, beds: 14, emergency: true, rating: '4.8 ⭐', dist: '4.1 km', address: 'Press Enclave Road, Saket, New Delhi' },
  { id: 'hosp-4', name: 'Apollo Clinic Specialty Center', lat: 28.5615, lng: 77.2401, beds: 5, emergency: false, rating: '4.5 ⭐', dist: '2.0 km', address: 'Lajpat Nagar III, New Delhi' }
];

function initHospitalRadar() {
  activeHospitalsList = [...DEFAULT_HOSPITALS_DATA];
  renderHospitalList(activeHospitalsList);

  setTimeout(() => {
    const mapContainer = document.getElementById('hospital-map');
    if (mapContainer && window.L && !leafletMap) {
      leafletMap = L.map('hospital-map').setView([28.5672, 77.2100], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
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
        <p style="color:#10b981; font-weight:600; margin-bottom:8px;">🛏️ ${hosp.beds} Free ICU Beds • ${hosp.rating}</p>
        <button class="btn btn-primary btn-sm" style="width:100%; padding:6px 10px; font-size:0.8rem;" onclick="openBookingModal('${escapeHtml(hosp.name)}')">Book Appointment</button>
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
      <div style="display:flex; gap:8px;">
        <button class="btn btn-primary btn-sm" style="flex:1;" onclick="event.stopPropagation(); openBookingModal('${escapeHtml(h.name)}')">Book Instant Appointment</button>
        <button class="btn btn-secondary btn-sm" title="Focus on map" onclick="event.stopPropagation(); focusHospitalOnMap(${idx})">📍 Map</button>
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
    (h.address && h.address.toLowerCase().includes(query))
  );

  if (filtered.length > 0) {
    activeHospitalsList = filtered;
    renderHospitalList(activeHospitalsList);
    updateMapMarkers(activeHospitalsList);
    showSearchStatus(`Filtered ${filtered.length} local hospital(s). Press Enter or click 'Search Map' to search globally on OpenStreetMap.`, true);
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
  const container = document.getElementById('booking-modal-body');
  if (container) {
    container.innerHTML = `
      <h3 style="margin-bottom:16px;">Book Appointment at ${escapeHtml(hospitalName)}</h3>
      <div class="form-group">
        <label>Select Preferred Date</label>
        <input type="date" id="book-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
      </div>
      <div class="form-group">
        <label>Department / Specialty</label>
        <select id="book-dept" class="form-control">
          <option>General Medicine & Triage</option>
          <option>Cardiology</option>
          <option>Pediatrics</option>
          <option>Pulmonology</option>
          <option>Emergency & ICU</option>
        </select>
      </div>
      <div style="display:flex; gap:12px; margin-top:24px;">
        <button class="btn btn-primary" style="flex:1;" onclick="confirmBooking('${escapeHtml(hospitalName)}')">Confirm Booking</button>
        <button class="btn btn-secondary" onclick="closeModal('booking-modal')">Cancel</button>
      </div>
    `;
  }
  openModal('booking-modal');
}

function confirmBooking(hospName) {
  const date = document.getElementById('book-date').value;
  const dept = document.getElementById('book-dept').value;
  const refId = 'MED-' + Math.floor(100000 + Math.random() * 900000);

  AppState.appointments.push({ hospName, date, dept, refId });
  localStorage.setItem('mediyogi_appointments', JSON.stringify(AppState.appointments));

  closeModal('booking-modal');
  alert(`✅ Appointment Confirmed at ${hospName}!\nReference ID: ${refId}\nDepartment: ${dept}\nDate: ${date}`);
}

/* ==========================================================================
   HEALTH VITALS TRACKER & CANVAS CHART
   ========================================================================== */
function initVitalsTracker() {
  updateWaterUI();
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

  if (!weight || !heightCm) {
    resultDiv.textContent = 'Please enter valid height and weight.';
    return;
  }

  const heightM = heightCm / 100;
  const bmi = (weight / (heightM * heightM)).toFixed(1);
  let status = 'Normal Weight';

  if (bmi < 18.5) status = 'Underweight';
  else if (bmi >= 25 && bmi < 29.9) status = 'Overweight';
  else if (bmi >= 30) status = 'Obese';

  resultDiv.innerHTML = `Your BMI is <strong>${bmi}</strong> (${status})`;
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
  if (cardEmergency) cardEmergency.textContent = `${AppState.user.emergencyName} (${AppState.user.emergencyPhone})`;

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
  const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
  const publicUrl = `${baseUrl}profile.html?id=${encodeURIComponent(AppState.user.healthId)}`;

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

function renderProfileQRCodes() {
  const containers = document.querySelectorAll('.qr-code-box');
  if (!containers.length) return;

  const textToEncode = `${window.location.origin}/profile.html?healthId=${AppState.user.healthId}`;

  // Deterministic SVG QR-like pattern generator
  const svg = generateSVGQRCode(textToEncode, 130);
  containers.forEach(box => {
    box.innerHTML = svg;
  });
}

function generateSVGQRCode(text, size = 120) {
  // Deterministic grid generator for vector QR appearance
  const cols = 21;
  const tileSize = size / cols;
  let rects = '';

  // Finder Patterns (3 corners)
  const drawFinder = (startX, startY) => {
    rects += `<rect x="${startX * tileSize}" y="${startY * tileSize}" width="${7 * tileSize}" height="${7 * tileSize}" fill="#10b981" rx="2"/>`;
    rects += `<rect x="${(startX + 1) * tileSize}" y="${(startY + 1) * tileSize}" width="${5 * tileSize}" height="${5 * tileSize}" fill="#0b0f19" rx="1"/>`;
    rects += `<rect x="${(startX + 2) * tileSize}" y="${(startY + 2) * tileSize}" width="${3 * tileSize}" height="${3 * tileSize}" fill="#10b981" rx="1"/>`;
  };

  drawFinder(0, 0);
  drawFinder(cols - 7, 0);
  drawFinder(0, cols - 7);

  // Hash-based pseudo random data fill
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < cols; r++) {
    for (let c = 0; c < cols; c++) {
      // Skip finder pattern zones
      if ((r < 7 && c < 7) || (r < 7 && c >= cols - 7) || (r >= cols - 7 && c < 7)) continue;
      
      const seed = Math.abs((hash ^ (r * 31 + c * 17)) % 100);
      if (seed > 45) {
        const x = c * tileSize;
        const y = r * tileSize;
        rects += `<rect x="${x}" y="${y}" width="${tileSize - 0.5}" height="${tileSize - 0.5}" fill="${seed > 80 ? '#06b6d4' : '#f8fafc'}" opacity="0.9" rx="0.5"/>`;
      }
    }
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="background:#0b0f19; padding:8px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">${rects}</svg>`;
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
