// Section switching for dashboard
function showSection(sectionId) {
  document.querySelectorAll('.dashboard-section').forEach(sec => {
    sec.classList.remove('active');
    sec.style.display = 'none';
  });
  const activeSection = document.getElementById(sectionId);
  if (activeSection) {
    activeSection.classList.add('active');
    activeSection.style.display = 'block';
  }
  // Highlight active nav
  document.querySelectorAll('.sidebar nav a').forEach(link => {
    link.classList.remove('active-nav');
  });
  const navLink = document.getElementById('nav-' + sectionId);
  if (navLink) navLink.classList.add('active-nav');
}

// Show only the first section on load
document.addEventListener('DOMContentLoaded', () => {
  showSection('reports');
});

// Simple chat functionality
function sendMessage() {
  const input = document.getElementById('userInput');
  const chatBox = document.getElementById('chat-box');
  const userMsg = input.value.trim();
  if (!userMsg) return;
  // Add user message
  const userDiv = document.createElement('div');
  userDiv.className = 'user-msg';
  userDiv.textContent = userMsg;
  chatBox.appendChild(userDiv);
  // Add bot reply (placeholder)
  setTimeout(() => {
    const botDiv = document.createElement('div');
    botDiv.className = 'bot-msg';
    botDiv.textContent = "I'm processing your query...";
    chatBox.appendChild(botDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 600);
  input.value = '';
  chatBox.scrollTop = chatBox.scrollHeight;
}

