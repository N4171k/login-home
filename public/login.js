const form = document.getElementById('authForm');
const messageEl = document.getElementById('message');
const switchModeBtn = document.getElementById('switchModeBtn');
const modeText = document.getElementById('modeText');
const submitBtn = document.getElementById('submitBtn');
const nameField = document.getElementById('nameField');

let isRegisterMode = false;

function showMessage(text, type = '') {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`.trim();
}

function renderMode() {
  if (isRegisterMode) {
    nameField.style.display = 'grid';
    modeText.textContent = 'Already have an account?';
    switchModeBtn.textContent = 'Login';
    submitBtn.textContent = 'Create Account';
  } else {
    nameField.style.display = 'none';
    modeText.textContent = 'No account?';
    switchModeBtn.textContent = 'Create one';
    submitBtn.textContent = 'Login';
  }
  showMessage('');
}

async function request(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
}

switchModeBtn.addEventListener('click', () => {
  isRegisterMode = !isRegisterMode;
  renderMode();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const name = formData.get('name')?.toString().trim();
  const email = formData.get('email')?.toString().trim();
  const password = formData.get('password')?.toString();

  try {
    if (isRegisterMode) {
      await request('/api/auth/register', { name, email, password });
      showMessage('Account created. You can login now.', 'success');
      isRegisterMode = false;
      renderMode();
      form.reset();
      return;
    }

    const data = await request('/api/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    showMessage('Login successful. Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = '/home';
    }, 500);
  } catch (error) {
    showMessage(error.message, 'error');
  }
});

renderMode();
