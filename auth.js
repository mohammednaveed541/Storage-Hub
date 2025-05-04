// auth.js

const SUPABASE_URL = 'https://zvovqihaeiialxurvwnt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2b3ZxaWhhZWlpYWx4dXJ2d250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MDQ1NDMsImV4cCI6MjA2MTE4MDU0M30.H3OICJXJ-0R7BgnuAOnJKUv_hfLPTl3lSb_9HC9hWeI';
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM
const loginBtn = document.getElementById('loginBtn');
const userProfileBtn = document.getElementById('userProfileBtn');
const userName = document.getElementById('userName');
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const signupLink = document.getElementById('signupLink');
const loginLink = document.getElementById('loginLink');
const closeBtns = document.querySelectorAll('.close');

function showUserUI(user) {
  if (loginBtn) loginBtn.style.display = 'none';
  if (userProfileBtn) userProfileBtn.style.display = 'flex';
  if (userName) userName.textContent = user.email.split('@')[0];
}
function showGuestUI() {
  if (loginBtn) loginBtn.style.display = 'flex';
  if (userProfileBtn) userProfileBtn.style.display = 'none';
}

window.supabase.auth.getUser().then(({ data }) => {
  if (data && data.user) showUserUI(data.user);
  else showGuestUI();
});

// Auth state change
window.supabase.auth.onAuthStateChange((event, session) => {
  if (session && session.user) showUserUI(session.user);
  else showGuestUI();
});

// Open login modal
if (loginBtn) loginBtn.addEventListener('click', () => {
  loginModal.style.display = 'block';
});

// Switch to signup modal
if (signupLink) signupLink.addEventListener('click', (e) => {
  e.preventDefault();
  loginModal.style.display = 'none';
  signupModal.style.display = 'block';
});

// Switch to login modal
if (loginLink) loginLink.addEventListener('click', (e) => {
  e.preventDefault();
  signupModal.style.display = 'none';
  loginModal.style.display = 'block';
});

// Close modals
closeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    loginModal.style.display = 'none';
    signupModal.style.display = 'none';
  });
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === loginModal) loginModal.style.display = 'none';
  if (e.target === signupModal) signupModal.style.display = 'none';
});

// Login form
if (loginForm) loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) alert(`Error: ${error.message}`);
  else {
    loginModal.style.display = 'none';
    loginForm.reset();
    window.location.reload();
  }
});

// Signup form
if (signupForm) signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  if (password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) alert(`Error: ${error.message}`);
  else {
    alert('Signup successful! Check your email for confirmation.');
    signupModal.style.display = 'none';
    signupForm.reset();
  }
});

// Logout
if (userProfileBtn) userProfileBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.reload();
});
