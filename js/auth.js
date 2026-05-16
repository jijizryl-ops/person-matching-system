const Auth = {
  SESSION_KEY: 'pm_session',
  save(user)     { sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(user)); },
  get()          { const s = sessionStorage.getItem(this.SESSION_KEY); return s ? JSON.parse(s) : null; },
  clear()        { sessionStorage.removeItem(this.SESSION_KEY); },
  isLoggedIn()   { return !!this.get(); },
  requireAuth()  { if (!this.isLoggedIn()) window.location.href = 'index.html'; },
  isAdmin()      { const u = this.get(); return u && u.role === 'ADMINISTRATOR'; },
};

async function doLogin() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorMsg = document.getElementById('errorMsg');
  const loading  = document.getElementById('loading');
  errorMsg.style.display = 'none';
  if (!username || !password) {
    errorMsg.textContent = 'Please enter username and password.';
    errorMsg.style.display = 'block'; return;
  }
  loading.style.display = 'block';
  try {
    const result = await Sheets.getUsers();
    loading.style.display = 'none';
    if (!result.success) {
      errorMsg.textContent = 'Cannot connect to database. Check your config.js setup.';
      errorMsg.style.display = 'block'; return;
    }
    const users = result.data || [];
    const user  = users.find(u => u[1] === username && u[2] === password);
    if (!user) {
      errorMsg.textContent = 'Invalid username or password.';
      errorMsg.style.display = 'block'; return;
    }
    Auth.save({ id: user[0], username: user[1], role: user[3], name: user[4] });
    window.location.href = 'dashboard.html';
  } catch(e) {
    loading.style.display = 'none';
    errorMsg.textContent = 'Login failed. Please try again.';
    errorMsg.style.display = 'block';
  }
}
document.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
if (Auth.isLoggedIn()) window.location.href = 'dashboard.html';
