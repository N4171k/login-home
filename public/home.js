const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const userJoined = document.getElementById('userJoined');
const homeMessage = document.getElementById('homeMessage');
const refreshBtn = document.getElementById('refreshBtn');
const logoutBtn = document.getElementById('logoutBtn');

function showMessage(text, type = '') {
  homeMessage.textContent = text;
  homeMessage.className = `message ${type}`.trim();
}

function formatDate(isoText) {
  const date = new Date(isoText);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleString();
}

async function loadProfile() {
  const token = localStorage.getItem('token');

  if (!token) {
    window.location.href = '/';
    return;
  }

  try {
    showMessage('Loading profile...');

    const response = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Unauthorized');
    }

    const { user } = data;
    userName.textContent = user.name;
    userEmail.textContent = user.email;
    userJoined.textContent = formatDate(user.created_at);
    showMessage('Profile loaded', 'success');
  } catch (error) {
    showMessage(error.message, 'error');
    if (/token|unauthorized|invalid/i.test(error.message)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setTimeout(() => {
        window.location.href = '/';
      }, 800);
    }
  }
}

refreshBtn.addEventListener('click', loadProfile);
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
});

loadProfile();
